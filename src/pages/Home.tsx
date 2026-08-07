import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import {
  fetchPanchangaDay,
  fetchSaitMonthAll,
  panchangaKeys,
  saitMonthAllKey,
  type CalendarDay,
  type PanchangaDay,
} from "../lib/api";
import { CalendarView, loadHomePatroView, type CalendarMonthContext, type HomePatroView, HOME_PATRO_VIEW_KEY } from "../components/CalendarView";
import { AakashGocharEntryCard } from "@/components/sky3d/AakashGocharEntryCard";
import { useRouteLoading } from "@/lib/route-loading";
import { setLocalStorageItem } from "@/lib/browser";
import {
  resolveLocationTimezone,
  usePanchangaLocation,
  type PanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";
import { todayAdStringInTimezone } from "@/lib/zoned-time";
import { BS_MONTH_NAMES, BS_MONTHS_NE, adToBS, bsToAdOrNull, getCurrentBs } from "../lib/bs-calendar";
import { useLocale, bilingualText } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import { patroAsideLink, patroAsideTab, patroHeroMonthOverlay, patroHeroMonthShell, patroHeroPill, patroHeroPillEv } from "@/lib/patro-classes";
import { bsMonthArtUrl } from "@/lib/month-art";
import { resolveSamvatsaraForPatroYear } from "@/lib/samvatsara";
import { patroEraShortLabel } from "@/components/patro-date/patro-era-short-label";
import {
  formatGregorianFromDateParts,
  formatPatroCivilDayLabel,
  patroHeadlineDigits,
} from "@/lib/patro-headline-subtitle";
import { canonicalCivilIso, parseCivilIsoToDate } from "@/lib/patro-day";
import { getLanguageForEra, type Era } from "@/lib/era";
import {
  patroDayFetchFromApiDateAd,
  patroDayFetchFromBrowseGridParts,
  type PatroDayFetchState,
} from "@/lib/patro-day-url";
import { formatPakshaLabel } from "@/lib/panchanga-format";
import {
  ASIDE_TAB_IDS,
  PanchangaAsideTabPanel,
  type AsideTabId,
} from "@/components/home/PanchangaAsideTabs";
import { prefetchAsidePanels } from "@/components/home/aside-prefetch";
import { HomeQuickLinks } from "@/components/home/HomeQuickLinks";
import { HeroMonthArt } from "@/components/home/HeroMonthArt";
import { PanchangaDirectory } from "@/components/panchanga/PanchangaDirectory";
import { Button } from "@/components/ui/button";
import { usePatroMonthUrlBrowse } from "@/hooks/use-patro-url-browse";
import { currentPatroDayLinkSearch } from "@/lib/url-state";
import { smoothScrollToElement } from "@/lib/scroll";

const ASIDE_SIDEBAR_MQ = "(min-width: 1280px)";
const PANCHANGA_SCROLL_OFFSET = 72; // sticky header (h-16) + small gap

const routeApi = getRouteApi("/");

function fmtAdIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthStartAdDate(ctx: CalendarMonthContext): string {
  const inMonth =
    ctx.days.find((d) => !d.outsideMonth && d.day === 1) ??
    ctx.days.find((d) => !d.outsideMonth);
  if (inMonth?.date_ad) return inMonth.date_ad;
  // BBS months have no offline mapping — their days come from the API. Hold today
  // until they arrive instead of throwing out of the whole Home tree.
  const ad = bsToAdOrNull(ctx.year, ctx.month, 1);
  return fmtAdIso(ad ?? new Date());
}

function panchangaMatchesAside(
  p: PanchangaDay | undefined,
  asideAdDate: string,
  ctx: CalendarMonthContext,
  contextDay: CalendarDay | null,
): boolean {
  if (!p) return false;
  const v = p.date_parts?.vikram;
  if (!ctx.isAdCalendar && contextDay && v?.year && v.month && v.day) {
    return v.year === ctx.year && v.month === ctx.month && v.day === contextDay.day;
  }
  const ad = canonicalCivilIso(asideAdDate);
  if (p.date_ad && canonicalCivilIso(p.date_ad) === ad) return true;
  if (p.panchanga_date_ad && canonicalCivilIso(p.panchanga_date_ad) === ad) return true;
  if (!ctx.isAdCalendar && contextDay && p.bs_date && typeof p.bs_date === "object") {
    return (
      p.bs_date.year === ctx.year &&
      p.bs_date.month === ctx.month &&
      p.bs_date.day === contextDay.day
    );
  }
  if (
    !ctx.isAdCalendar &&
    contextDay &&
    v?.year === ctx.year &&
    v.month === ctx.month &&
    v.day === contextDay.day
  ) {
    return true;
  }
  return false;
}

const PanchangaAside = forwardRef(function PanchangaAside(
  {
    selectedDay,
    selectedAdDate,
    todayAd,
    monthContext,
    location,
    p,
    loading,
    error,
    placement = "sidebar",
    browseEra = "bs",
  }: {
    selectedDay: CalendarDay | null;
    selectedAdDate: string;
    todayAd: string;
    monthContext: CalendarMonthContext;
    location: PanchangaLocation;
    p?: PanchangaDay;
    /** True while the panchanga for the selected date/location is in flight. */
    loading: boolean;
    error: boolean;
    placement?: "sidebar" | "below";
    browseEra?: Era;
  },
  ref: React.ForwardedRef<HTMLElement>,
) {
  const { t } = useTranslation();
  const { digits, lang } = useLocale();
  const [asideTab, setAsideTab] = useState<AsideTabId>("panchanga");

  const contextDay =
    selectedDay ??
    monthContext.days.find((d) => !d.outsideMonth && d.date_ad === selectedAdDate) ??
    monthContext.days.find((d) => !d.outsideMonth && d.day === 1) ??
    monthContext.days.find((d) => !d.outsideMonth) ??
    null;
  const pMatches = panchangaMatchesAside(p, selectedAdDate, monthContext, contextDay);
  const activeP = pMatches ? p : undefined;

  const isSelectedToday = selectedAdDate === todayAd;

  const bsDisplay = bilingualText(lang, activeP?.display?.bs_ne, undefined) ?? activeP?.date_bs;
  const adDisplay = (() => {
    const digitFn = patroHeadlineDigits(lang);
    const g = activeP?.date_parts?.gregorian;
    if (g?.year && g.month && g.day) {
      return formatGregorianFromDateParts(g, lang, digitFn);
    }
    if (activeP?.date_ad) {
      return formatPatroCivilDayLabel(activeP.date_ad, lang, digitFn);
    }
    return formatPatroCivilDayLabel(selectedAdDate, lang, digitFn);
  })();
  const weekdayNe = bilingualText(lang, 
    activeP?.weekday ?? contextDay?.weekday_ne ?? contextDay?.weekday,
    contextDay?.weekday_en ?? activeP?.weekday ?? contextDay?.weekday,
  );
  const tithi = bilingualText(lang, 
    activeP?.tithi?.name_ne ?? activeP?.tithi?.name ?? contextDay?.tithi_ne ?? contextDay?.tithi,
    activeP?.tithi?.name ?? activeP?.tithi?.name_ne ?? contextDay?.tithi ?? contextDay?.tithi_ne,
  );
  const paksha = formatPakshaLabel(
    activeP,
    lang,
    contextDay?.paksha_ne,
    contextDay?.paksha,
  );

  // Local BS date for the selected AD day — lets the hero paint a real date
  // instantly (and in the prerendered HTML) without waiting for the panchanga
  // API. Improves LCP: the hero is the largest element on the home page.
  const fallbackBs = useMemo(() => {
    try {
      return adToBS(new Date(`${selectedAdDate}T12:00:00`));
    } catch {
      return null;
    }
  }, [selectedAdDate]);

  const displayHeroDate = (() => {
    const v = activeP?.date_parts?.vikram;
    if (v?.month && v.day) {
      const monthName = bilingualText(
        lang,
        BS_MONTHS_NE[v.month - 1],
        BS_MONTH_NAMES[v.month - 1],
      );
      return `${monthName} ${digits(v.day)}`;
    }
    if (activeP?.bs_date && typeof activeP.bs_date === "object") {
      const monthName = bilingualText(
        lang,
        BS_MONTHS_NE[activeP.bs_date.month - 1],
        BS_MONTH_NAMES[activeP.bs_date.month - 1],
      );
      return `${monthName} ${digits(activeP.bs_date.day)}`;
    }
    if (contextDay && !monthContext.isAdCalendar) {
      const monthName = bilingualText(
        lang,
        BS_MONTHS_NE[monthContext.month - 1],
        BS_MONTH_NAMES[monthContext.month - 1],
      );
      return `${monthName} ${digits(contextDay.day)}`;
    }
    if (contextDay) {
      const bs = adToBS(parseCivilIsoToDate(contextDay.date_ad));
      const monthName = bilingualText(lang, BS_MONTHS_NE[bs.month - 1], BS_MONTH_NAMES[bs.month - 1]);
      return `${monthName} ${digits(bs.day)}`;
    }
    if (activeP?.display?.bs_ne) return digits(activeP.display.bs_ne);
    if (activeP?.date_bs) return digits(activeP.date_bs);
    if (bsDisplay) return digits(bsDisplay);
    if (fallbackBs) {
      const monthName = bilingualText(lang, BS_MONTHS_NE[fallbackBs.month - 1], BS_MONTH_NAMES[fallbackBs.month - 1]);
      return `${monthName} ${digits(fallbackBs.day)}`;
    }
    return "—";
  })();

  // The day payload names festivals in `name` (Latin) + `name_ne`; only the
  // yearly festivals API uses `name_en`. Read all three or English mode falls
  // back to Devanagari.
  const topFest = activeP?.festivals?.[0];
  const topFestName = bilingualText(lang, 
    topFest?.name_ne ?? topFest?.name_en ?? topFest?.name ?? contextDay?.festivals[0],
    topFest?.name_en ?? topFest?.name ?? topFest?.name_ne ?? contextDay?.festivals[0],
  );
  const topFestIsPublic = activeP?.festivals?.[0]?.is_public_holiday ?? false;
  const patroYearForLabel =
    activeP?.date_parts?.vikram?.year ??
    (activeP?.bs_date && typeof activeP.bs_date === "object" ? activeP.bs_date.year : monthContext.year);
  const patroEraForLabel =
    activeP?.date_parts?.vikram?.era ??
    (activeP?.bs_date && typeof activeP.bs_date === "object" && activeP.bs_date.year < 0
      ? "bbs"
      : browseEra);
  const vikramEraLabel = patroEraShortLabel(patroEraForLabel, t);
  const samvatsara = resolveSamvatsaraForPatroYear(patroEraForLabel, patroYearForLabel, activeP?.samvatsara);
  const samvatsaraLabel = samvatsara ? bilingualText(lang, samvatsara.name_ne, samvatsara.name_en) : undefined;
  const isBelow = placement === "below";
  const heroMonthArt = bsMonthArtUrl(monthContext.month);

  return (
    <aside
      ref={ref}
      id="home-panchanga-aside"
      className={cn(
        "scroll-mt-[4.5rem] flex flex-col gap-3 bg-transparent",
        isBelow ? "w-full" : "xl:gap-0",
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-3",
          isBelow ? "rounded-xl" : "xl:gap-0",
        )}
      >
        <div
          className={cn(
            "flex items-baseline gap-2.5 pt-3.5 pb-3 bg-transparent",
            !isBelow && "xl:shrink-0 xl:border-b xl:border-border",
            isBelow && "border-b border-border",
          )}
        >
          <h2 className="m-0 flex-1 text-lg font-bold">
            {isSelectedToday ? t("panchanga.today_title") : t("panchanga.title")}
          </h2>
          <Link
            to="/panchanga"
            search={currentPatroDayLinkSearch(location, selectedAdDate)}
            className={patroAsideLink}
          >
            {t("panchanga.full_detail")} →
          </Link>
        </div>

        {/* Hero always renders from local BS data (no API wait) so it paints
            as the LCP element immediately; the detail panel below shows its own
            loading skeletons / error while the panchanga API is in flight. */}
        <div
          className={cn(
            "flex flex-col gap-3",
            isBelow
              ? "lg:flex-row lg:items-stretch"
              : "min-[1081px]:gap-0",
          )}
        >
            <div
              className={cn(
                patroHeroMonthShell,
                "shrink-0 rounded-xl p-5 text-white shadow-lg",
                isBelow ? "mx-4 mt-4 lg:mx-0 lg:mt-0 lg:w-[min(100%,22rem)] lg:rounded-none lg:shadow-none" : "xl:rounded-none xl:p-5 xl:shadow-none",
                !isBelow && "xl:rounded-none",
              )}
            >
              <HeroMonthArt src={heroMonthArt} />
              <div className={patroHeroMonthOverlay} aria-hidden />
              <div className="relative z-10 text-white">
              <div className="flex items-start justify-between gap-3.5">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold tracking-[0.16em] text-white/70">
                    {isSelectedToday
                      ? t("panchanga.today_eyebrow").toUpperCase()
                      : (weekdayNe ?? "").toUpperCase()}
                  </div>
                  <div className="mt-2.5 text-4xl font-bold leading-tight text-white xl:mt-2 xl:text-xl">
                    {displayHeroDate}
                  </div>
                  <div className="mt-0.5 text-sm text-white/90">
                    {weekdayNe}
                    {`, ${vikramEraLabel} ${digits(patroYearForLabel)}`}
                    {samvatsaraLabel ? (
                      <span className="text-white/75"> · {samvatsaraLabel}</span>
                    ) : null}
                  </div>
                  <div className="mt-1.5 text-xs text-white/70">
                    {adDisplay}
                  </div>
                </div>
                {(paksha || tithi || topFestName) ? (
                  <div className="mt-0.5 flex max-w-[42%] shrink-0 flex-col items-end gap-1.5 xl:max-w-[46%]">
                    {paksha && <span className={patroHeroPill}>{paksha}</span>}
                    {tithi && <span className={patroHeroPill}>{tithi}</span>}
                    {topFestName && (
                      <span className={patroHeroPillEv(topFestIsPublic ? "public" : "festival")}>
                        {topFestName}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-card xl:rounded-none">
            <div
              className="grid shrink-0 grid-cols-3 border-b border-border bg-surface-muted"
              role="tablist"
              aria-label={t("panchanga.tabs_label")}
            >
              {ASIDE_TAB_IDS.map((id) => (
                <Button
                  key={id}
                  role="tab"
                  variant="ghost"
                  size="sm"
                  className={cn(patroAsideTab(id === asideTab), "h-auto w-full rounded-none p-0")}
                  aria-selected={id === asideTab}
                  onClick={() => setAsideTab(id)}
                >
                  {t(`panchanga.tabs.${id}`)}
                </Button>
              ))}
            </div>

            <div
              className="min-h-[12rem] flex-1 to-card p-3 max-md:p-3"
              role="tabpanel"
            >
              {error && !activeP ? (
                <div className="flex h-full min-h-[10rem] flex-col items-center justify-center gap-2 rounded-xl bg-error-surface px-4 py-6 text-center">
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-danger/10 text-sm font-bold text-danger">
                    !
                  </span>
                  <p className="m-0 text-sm leading-relaxed text-danger">
                    {t("panchanga.error")}
                  </p>
                </div>
              ) : (
                <div className="animate-in fade-in-0 duration-200">
                  <PanchangaAsideTabPanel
                    tab={asideTab}
                    p={activeP}
                    selectedDay={contextDay}
                    selectedAdDate={selectedAdDate}
                    location={location}
                    bsYear={monthContext.year}
                    bsMonth={monthContext.month}
                    adYear={monthContext.isAdCalendar ? monthContext.adYear : undefined}
                    adMonth={monthContext.isAdCalendar ? monthContext.adMonth : undefined}
                    loading={loading}
                  />
                </div>
              )}
            </div>
            </div>
        </div>
      </div>
    </aside>
  );
});

export function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate({ from: "/" });
  const search = routeApi.useSearch();
  const { location, setLocation } = usePanchangaLocation();
  const monthBrowse = usePatroMonthUrlBrowse(search, navigate, location, setLocation);
  const { year: bsYear, month: bsMonth } = getCurrentBs();
  const todayAd = useMemo(
    () => todayAdStringInTimezone(new Date(), resolveLocationTimezone(location)),
    [location],
  );
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const panchangaAsideRef = useRef<HTMLElement>(null);
  const scrollToPanchangaRef = useRef(false);

  const handleDaySelect = useCallback((day: CalendarDay | null) => {
    setSelectedDay(day);
    if (
      day &&
      typeof window !== "undefined" &&
      !window.matchMedia(ASIDE_SIDEBAR_MQ).matches
    ) {
      scrollToPanchangaRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!scrollToPanchangaRef.current || !selectedDay) return;
    scrollToPanchangaRef.current = false;
    const el = panchangaAsideRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      smoothScrollToElement(el, {
        duration: 400,
        offset: PANCHANGA_SCROLL_OFFSET,
      });
    });
  }, [selectedDay]);
  const [patroView, setPatroView] = useState<HomePatroView>(loadHomePatroView);
  const [monthContext, setMonthContext] = useState<CalendarMonthContext>(() => {
    const today = new Date();
    return {
      year: bsYear,
      month: bsMonth,
      days: [],
      adYear: today.getFullYear(),
      adMonth: today.getMonth() + 1,
      isAdCalendar: false,
    };
  });
  const handleMonthContextChange = useCallback((ctx: CalendarMonthContext) => {
    setMonthContext((prev) =>
      prev.year === ctx.year && prev.month === ctx.month && prev.days === ctx.days ? prev : ctx,
    );
  }, []);
  const monthStartAd = useMemo(() => monthStartAdDate(monthContext), [monthContext]);
  // Works for either grid: in Gregorian mode the BS month of the displayed
  // month never matches today's BS month, so ask the days themselves.
  const viewingCurrentMonth = useMemo(() => {
    if (monthContext.days.length) {
      return monthContext.days.some((d) => d.date_ad === todayAd);
    }
    const todayBs = adToBS(new Date(`${todayAd}T12:00:00`));
    return monthContext.year === todayBs.year && monthContext.month === todayBs.month;
  }, [monthContext.days, monthContext.year, monthContext.month, todayAd]);
  const asideAdDate = useMemo(() => {
    if (selectedDay?.date_ad) return selectedDay.date_ad;
    if (viewingCurrentMonth) return todayAd;
    return monthStartAd;
  }, [selectedDay, viewingCurrentMonth, todayAd, monthStartAd]);

  const { era: browseEra, year: browseYear, month: browseMonth } = monthBrowse;
  const asideDayState = useMemo((): PatroDayFetchState => {
    const display = {
      era: browseEra,
      language: getLanguageForEra(browseEra),
    };

    const gridDay =
      selectedDay && !selectedDay.outsideMonth
        ? selectedDay.day
        : (() => {
            const cell =
              monthContext.days.find((d) => !d.outsideMonth && d.date_ad === asideAdDate) ??
              monthContext.days.find((d) => !d.outsideMonth && d.day === 1) ??
              monthContext.days.find((d) => !d.outsideMonth) ??
              null;
            return cell?.day ?? 1;
          })();

    if (!monthContext.isAdCalendar && monthContext.year && monthContext.month) {
      return patroDayFetchFromBrowseGridParts(
        {
          year: monthContext.year,
          month: monthContext.month,
          day: gridDay,
        },
        display,
      );
    }

    if (selectedDay?.date_ad) {
      return patroDayFetchFromApiDateAd(selectedDay.date_ad, display);
    }
    const cell =
      monthContext.days.find((d) => !d.outsideMonth && d.date_ad === asideAdDate) ??
      monthContext.days.find((d) => !d.outsideMonth && d.day === 1) ??
      null;
    if (cell?.date_ad) {
      return patroDayFetchFromApiDateAd(cell.date_ad, display);
    }
    return { kind: "today", display };
  }, [
    browseEra,
    asideAdDate,
    monthContext,
    selectedDay,
  ]);

  const panchangaQ = useQuery({
    queryKey: panchangaKeys.daySelection(asideDayState, location.params),
    queryFn: () => fetchPanchangaDay(asideDayState, location.params),
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  // Silently warm the साइत and दैनिक मुहूर्त aside tabs in the background once
  // the home page is idle: prefetch their code-split chunks and the sait month
  // data into the query cache. The muhurta panel derives everything from the
  // already-loaded panchanga day, so it only needs its chunk. Runs off the main
  // thread (requestIdleCallback) so it never competes with the initial render.
  const queryClient = useQueryClient();
  const prefetchYear = browseYear;
  const prefetchMonth = browseMonth;
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      prefetchAsidePanels();
      void queryClient.prefetchQuery({
        queryKey: saitMonthAllKey(prefetchYear, prefetchMonth),
        queryFn: () => fetchSaitMonthAll(prefetchYear, prefetchMonth),
        staleTime: 1000 * 60 * 60,
      });
    };
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback;
    const handle = ric ? ric(run, { timeout: 2500 }) : window.setTimeout(run, 1200);
    return () => {
      cancelled = true;
      const cic = (window as unknown as {
        cancelIdleCallback?: (h: number) => void;
      }).cancelIdleCallback;
      if (ric && cic) cic(handle);
      else window.clearTimeout(handle);
    };
  }, [queryClient, prefetchYear, prefetchMonth]);

  const handlePatroViewChange = useCallback((view: HomePatroView) => {
    setPatroView(view);
    setLocalStorageItem(HOME_PATRO_VIEW_KEY, view);
  }, []);

  const asideInitialLoading = panchangaQ.isLoading && !panchangaQ.data;
  // keepPreviousData keeps `isLoading` false on a location/date change and
  // leaves the previous city's data on screen — confusing for the user. While
  // the query is showing placeholder (previous-key) data mid-fetch, swap the
  // panel body for the loader instead.
  const asideLoading =
    asideInitialLoading || (panchangaQ.isFetching && panchangaQ.isPlaceholderData);
  useRouteLoading(asideInitialLoading);

  return (
    <main className="mx-auto max-w-[1400px] px-4 pb-12 pt-4 max-md:px-0 max-md:pb-16 max-md:pt-0">
      {/* `main` drops its padding below md, so the card brings its own there —
          otherwise it alone would run edge to edge above the calendar. */}
     

      <CalendarView
        monthBrowse={monthBrowse}
        location={location}
        onLocationChange={setLocation}
        todayAd={todayAd}
        enablePatroToggle
        patroView={patroView}
        onPatroViewChange={handlePatroViewChange}
        onDaySelect={handleDaySelect}
        onMonthContextChange={handleMonthContextChange}
        aside={
          <PanchangaAside
            key={selectedDay?.date_ad ?? "none"}
            ref={panchangaAsideRef}
            placement="sidebar"
            selectedDay={selectedDay}
            selectedAdDate={asideAdDate}
            todayAd={todayAd}
            monthContext={monthContext}
            location={location}
            p={panchangaQ.data}
            loading={asideLoading}
            error={panchangaQ.isError}
            browseEra={browseEra}
          />
        }
        holidays={
          <section className="col-span-full mt-2 max-sm:px-2.5">
            <HomeQuickLinks location={location} />
            <PanchangaDirectory className="mt-8" />
          </section>
        }
      />
 <AakashGocharEntryCard className="mye-3" />
      <p className="mt-7 text-center text-sm max-sm:px-2.5">{t("footer_note")}</p>
    </main>
  );
}
