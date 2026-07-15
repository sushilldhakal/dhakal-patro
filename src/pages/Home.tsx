import { useCallback, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import {
  fetchPanchanga,
  panchangaKeys,
  type CalendarDay,
  type PanchangaDay,
} from "../lib/api";
import { CalendarView, loadHomePatroView, type CalendarMonthContext, type HomePatroView, HOME_PATRO_VIEW_KEY } from "../components/CalendarView";
import { useRouteLoading } from "@/lib/route-loading";
import { setLocalStorageItem } from "@/lib/browser";
import {
  resolveLocationTimezone,
  usePanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";
import { todayAdStringInTimezone } from "@/lib/zoned-time";
import { BS_MONTH_NAMES, BS_MONTHS_NE, adToBS, bsToAD, getCurrentBs } from "../lib/bs-calendar";
import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import { patroAsideLink, patroAsideTab, patroHeroMonthOverlay, patroHeroMonthShell, patroHeroPill, patroHeroPillEv } from "@/lib/patro-classes";
import { bsMonthArtUrl } from "@/lib/month-art";
import { resolveSamvatsaraForBsYear } from "@/lib/samvatsara";
import {
  ASIDE_TAB_IDS,
  PanchangaAsideTabPanel,
  type AsideTabId,
} from "@/components/home/PanchangaAsideTabs";
import { HomeQuickLinks } from "@/components/home/HomeQuickLinks";
import { HeroMonthArt } from "@/components/home/HeroMonthArt";
import { Button } from "@/components/ui/button";

function fmtAdIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthStartAdDate(ctx: CalendarMonthContext): string {
  const first = ctx.days.find((d) => d.day === 1) ?? ctx.days[0];
  if (first?.date_ad) return first.date_ad;
  return fmtAdIso(bsToAD(ctx.year, ctx.month, 1));
}

function fmtAdFull(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });
}

function panchangaMatchesAd(p: PanchangaDay | undefined, ad: string): boolean {
  if (!p) return false;
  return p.date_ad === ad || p.panchanga_date_ad === ad;
}

function PanchangaAside({
  selectedDay,
  selectedAdDate,
  todayAd,
  monthContext,
  p,
  loading,
  error,
  placement = "sidebar",
}: {
  selectedDay: CalendarDay | null;
  selectedAdDate: string;
  todayAd: string;
  monthContext: CalendarMonthContext;
  p?: PanchangaDay;
  /** True while the panchanga for the selected date/location is in flight. */
  loading: boolean;
  error: boolean;
  placement?: "sidebar" | "below";
}) {
  const { t } = useTranslation();
  const { pick, digits } = useLocale();
  const [asideTab, setAsideTab] = useState<AsideTabId>("panchanga");

  const contextDay =
    selectedDay ??
    monthContext.days.find((d) => d.date_ad === selectedAdDate) ??
    monthContext.days.find((d) => d.day === 1) ??
    monthContext.days[0] ??
    null;
  const pMatches = panchangaMatchesAd(p, selectedAdDate);
  const activeP = pMatches ? p : undefined;

  const isSelectedToday = selectedAdDate === todayAd;

  const bsDisplay = pick(activeP?.display?.bs_ne, undefined) ?? activeP?.date_bs;
  const adDisplay = activeP?.display?.gregorian_en ?? fmtAdFull(selectedAdDate);
  const weekdayNe = pick(
    activeP?.weekday ?? contextDay?.weekday_ne ?? contextDay?.weekday,
    contextDay?.weekday_en ?? activeP?.weekday ?? contextDay?.weekday,
  );
  const tithi = pick(
    activeP?.tithi?.name_ne ?? activeP?.tithi?.name ?? contextDay?.tithi_ne ?? contextDay?.tithi,
    activeP?.tithi?.name ?? activeP?.tithi?.name_ne ?? contextDay?.tithi ?? contextDay?.tithi_ne,
  );
  const paksha = pick(
    activeP?.paksha?.label_ne ?? activeP?.paksha_ne ?? contextDay?.paksha_ne,
    activeP?.paksha?.label_en ?? activeP?.paksha?.label_ne ?? activeP?.paksha_ne ?? contextDay?.paksha,
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
    if (activeP?.bs_date && typeof activeP.bs_date === "object") {
      const monthName = pick(BS_MONTHS_NE[activeP.bs_date.month - 1], BS_MONTH_NAMES[activeP.bs_date.month - 1]);
      return `${monthName} ${digits(activeP.bs_date.day)}`;
    }
    if (contextDay) {
      const monthName = pick(BS_MONTHS_NE[monthContext.month - 1], BS_MONTH_NAMES[monthContext.month - 1]);
      return `${monthName} ${digits(contextDay.day)}`;
    }
    if (activeP?.display?.bs_ne) return digits(activeP.display.bs_ne);
    if (activeP?.date_bs) return digits(activeP.date_bs);
    if (bsDisplay) return digits(bsDisplay);
    if (fallbackBs) {
      const monthName = pick(BS_MONTHS_NE[fallbackBs.month - 1], BS_MONTH_NAMES[fallbackBs.month - 1]);
      return `${monthName} ${digits(fallbackBs.day)}`;
    }
    return "—";
  })();

  const topFestName = pick(
    activeP?.festivals?.[0]?.name_ne ?? activeP?.festivals?.[0]?.name_en ?? contextDay?.festivals[0],
    activeP?.festivals?.[0]?.name_en ?? activeP?.festivals?.[0]?.name_ne ?? contextDay?.festivals[0],
  );
  const topFestIsPublic = activeP?.festivals?.[0]?.is_public_holiday ?? false;
  const bsYearForSamvatsara =
    activeP?.bs_date && typeof activeP.bs_date === "object"
      ? activeP.bs_date.year
      : monthContext.year;
  const samvatsara = resolveSamvatsaraForBsYear(bsYearForSamvatsara, activeP?.samvatsara);
  const samvatsaraLabel = samvatsara ? pick(samvatsara.name_ne, samvatsara.name_en) : undefined;
  const isBelow = placement === "below";
  const heroMonthArt = bsMonthArtUrl(monthContext.month);

  return (
    <aside
      className={cn(
        "flex flex-col gap-3 bg-transparent",
        isBelow ? "w-full" : "min-[1081px]:gap-0",
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-3",
          isBelow ? "rounded-xl" : "min-[1081px]:gap-0",
        )}
      >
        <div
          className={cn(
            "flex items-baseline gap-2.5 pt-3.5 pb-3 bg-transparent",
            !isBelow && "min-[1081px]:shrink-0 min-[1081px]:border-b min-[1081px]:border-border",
            isBelow && "border-b border-border",
          )}
        >
          <h2 className="m-0 flex-1 text-lg font-bold">
            {isSelectedToday ? t("panchanga.today_title") : t("panchanga.title")}
          </h2>
          <Link to="/panchanga" className={patroAsideLink}>
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
                "shrink-0 rounded-xl p-[22px] text-[#f5f5f1] shadow-lg",
                isBelow ? "mx-4 mt-4 lg:mx-0 lg:mt-0 lg:w-[min(100%,22rem)] lg:rounded-none lg:shadow-none" : "min-[1081px]:rounded-none min-[1081px]:p-5 min-[1081px]:shadow-none",
                !isBelow && "min-[1081px]:rounded-none",
              )}
            >
              <HeroMonthArt src={heroMonthArt} />
              <div className={patroHeroMonthOverlay} aria-hidden />
              <div className="relative z-10">
              <div className="flex items-start justify-between gap-3.5">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold tracking-[0.16em] text-[rgba(245,245,241,0.55)]">
                    {isSelectedToday
                      ? `${t("panchanga.today_eyebrow").toUpperCase()} · ${t("today")}`
                      : (weekdayNe ?? "").toUpperCase()}
                  </div>
                  <div className="mt-2.5 text-4xl font-bold leading-tight min-[1081px]:mt-2 min-[1081px]:text-xl">
                    {displayHeroDate}
                  </div>
                  <div className="mt-0.5 text-sm text-base text-[rgba(245,245,241,0.85)]">
                    {weekdayNe}
                    {activeP?.bs_date && typeof activeP.bs_date === "object"
                      ? `, ${t("panchanga.bs_era")} ${digits(activeP.bs_date.year)}`
                      : `, ${t("panchanga.bs_era")} ${digits(monthContext.year)}`}
                    {samvatsaraLabel ? (
                      <span className="text-[rgba(245,245,241,0.72)]"> · {samvatsaraLabel}</span>
                    ) : null}
                  </div>
                  <div className="mono mt-1.5 text-xs text-base text-[rgba(245,245,241,0.55)]">
                    {adDisplay}
                  </div>
                </div>
                {(paksha || tithi || topFestName) ? (
                  <div className="mt-0.5 flex max-w-[42%] shrink-0 flex-col items-end gap-1.5 min-[1081px]:max-w-[46%]">
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

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-card min-[1081px]:rounded-none">
            <div
              className="grid shrink-0 grid-cols-4 border-b border-border bg-surface-muted"
              role="tablist"
              aria-label={t("panchanga.tabs_label")}
            >
              {ASIDE_TAB_IDS.map((id) => (
                <Button
                  key={id}
                  role="tab"
                  variant="ghost"
                  size="sm"
                  className={cn(patroAsideTab(id === asideTab), "h-auto w-full rounded-none text-md p-0")}
                  aria-selected={id === asideTab}
                  onClick={() => setAsideTab(id)}
                >
                  {t(`panchanga.tabs.${id}`)}
                </Button>
              ))}
            </div>

            <div
              className="min-h-[12rem] flex-1 bg-gradient-to-b from-surface-muted/40 to-card p-3 max-md:p-3"
              role="tabpanel"
            >
              {error && !activeP ? (
                <div className="flex h-full min-h-[10rem] flex-col items-center justify-center gap-2 rounded-xl border border-danger/25 bg-error-surface px-4 py-6 text-center">
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
                    bsYear={monthContext.year}
                    bsMonth={monthContext.month}
                    monthDays={monthContext.days}
                    todayAd={todayAd}
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
}

export function Home() {
  const { t } = useTranslation();
  const { location, setLocation } = usePanchangaLocation();
  const { year: bsYear, month: bsMonth } = getCurrentBs();
  const todayAd = useMemo(
    () => todayAdStringInTimezone(new Date(), resolveLocationTimezone(location)),
    [location],
  );
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [patroView, setPatroView] = useState<HomePatroView>(loadHomePatroView);
  const [monthContext, setMonthContext] = useState<CalendarMonthContext>(() => ({
    year: bsYear,
    month: bsMonth,
    days: [],
  }));
  const handleMonthContextChange = useCallback((ctx: CalendarMonthContext) => {
    setMonthContext((prev) =>
      prev.year === ctx.year && prev.month === ctx.month && prev.days === ctx.days ? prev : ctx,
    );
  }, []);
  const monthStartAd = useMemo(() => monthStartAdDate(monthContext), [monthContext]);
  const viewingCurrentBsMonth = useMemo(() => {
    const todayBs = adToBS(new Date(`${todayAd}T12:00:00`));
    return monthContext.year === todayBs.year && monthContext.month === todayBs.month;
  }, [monthContext.year, monthContext.month, todayAd]);
  const asideAdDate = useMemo(() => {
    if (selectedDay?.date_ad) return selectedDay.date_ad;
    if (viewingCurrentBsMonth) return todayAd;
    return monthStartAd;
  }, [selectedDay, viewingCurrentBsMonth, todayAd, monthStartAd]);

  const panchangaQ = useQuery({
    queryKey: panchangaKeys.day(asideAdDate, "ad", location.params),
    queryFn: () => fetchPanchanga(asideAdDate, "ad", location.params),
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

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
      <CalendarView
        location={location}
        onLocationChange={setLocation}
        todayAd={todayAd}
        enablePatroToggle
        patroView={patroView}
        onPatroViewChange={handlePatroViewChange}
        onDaySelect={setSelectedDay}
        onMonthContextChange={handleMonthContextChange}
        aside={
          <PanchangaAside
            placement="sidebar"
            selectedDay={selectedDay}
            selectedAdDate={asideAdDate}
            todayAd={todayAd}
            monthContext={monthContext}
            p={panchangaQ.data}
            loading={asideLoading}
            error={panchangaQ.isError}
          />
        }
        holidays={
          <section className="col-span-full mt-2 max-sm:px-2.5">
            <HomeQuickLinks
              location={location}
              bsYear={monthContext.year}
              bsMonth={monthContext.month}
            />
          </section>
        }
      />

      <p className="mt-7 text-center text-sm max-sm:px-2.5">{t("footer_note")}</p>
    </main>
  );
}
