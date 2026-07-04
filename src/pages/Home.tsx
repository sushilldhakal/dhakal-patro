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
import {
  ASIDE_TAB_IDS,
  PanchangaAsideTabPanel,
  type AsideTabId,
} from "@/components/home/PanchangaAsideTabs";
import { HomeQuickLinks } from "@/components/home/HomeQuickLinks";

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
  initialLoading,
  error,
  placement = "sidebar",
}: {
  selectedDay: CalendarDay | null;
  selectedAdDate: string;
  todayAd: string;
  monthContext: CalendarMonthContext;
  p?: PanchangaDay;
  initialLoading: boolean;
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
    return bsDisplay ? digits(bsDisplay) : "—";
  })();

  const topFestName = pick(
    activeP?.festivals?.[0]?.name_ne ?? activeP?.festivals?.[0]?.name_en ?? contextDay?.festivals[0],
    activeP?.festivals?.[0]?.name_en ?? activeP?.festivals?.[0]?.name_ne ?? contextDay?.festivals[0],
  );
  const topFestIsPublic = activeP?.festivals?.[0]?.is_public_holiday ?? false;
  const isBelow = placement === "below";
  const heroMonthArt = bsMonthArtUrl(monthContext.month);

  return (
    <aside
      className={cn(
        "flex flex-col gap-3 max-sm:px-2.5",
        isBelow ? "w-full" : "min-h-0 flex-1 min-[1081px]:h-full min-[1081px]:gap-0",
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-3",
          isBelow
            ? "overflow-hidden rounded-xl bg-card shadow-sm shadow-ring-soft"
            : "min-[1081px]:min-h-0 min-[1081px]:flex-1 min-[1081px]:gap-0 min-[1081px]:overflow-hidden min-[1081px]:rounded-xl min-[1081px]:bg-card min-[1081px]:shadow-sm min-[1081px]:shadow-ring-soft",
        )}
      >
        <div
          className={cn(
            "flex items-baseline gap-2.5 px-4 pt-3.5 pb-3",
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

        {initialLoading ? null : error && !activeP ? (
          <div
            className={cn(
              "flex flex-col gap-3",
              !isBelow && "min-[1081px]:min-h-0 min-[1081px]:flex-1 min-[1081px]:gap-0 min-[1081px]:overflow-hidden",
            )}
          >
            <div
              className={cn(
                "rounded-lg border border-danger/20 bg-error-surface p-3.5 text-sm font-medium text-danger",
                !isBelow && "min-[1081px]:m-4",
                isBelow && "m-4",
              )}
            >
              {t("panchanga.error")}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "flex flex-col gap-3",
              isBelow
                ? "lg:flex-row lg:items-stretch"
                : "min-[1081px]:min-h-0 min-[1081px]:flex-1 min-[1081px]:gap-0 min-[1081px]:overflow-hidden",
            )}
          >
            <div
              className={cn(
                patroHeroMonthShell,
                "shrink-0 rounded-xl p-[22px] text-[#f5f5f1] shadow-lg",
                isBelow ? "mx-4 mt-4 lg:mx-0 lg:mt-0 lg:w-[min(100%,22rem)] lg:rounded-none lg:shadow-none" : "min-[1081px]:rounded-none min-[1081px]:p-5 min-[1081px]:shadow-none",
                !isBelow && "min-[1081px]:rounded-none",
              )}
              style={{ backgroundImage: `url(${heroMonthArt})` }}
            >
              <div className={patroHeroMonthOverlay} aria-hidden />
              <div className="relative z-10">
              <div className="flex items-start justify-between gap-3.5">
                <div className="min-w-0 flex-1">
                  <div className="text-[10.5px] font-semibold tracking-[0.16em] text-[rgba(245,245,241,0.55)]">
                    {isSelectedToday
                      ? `${t("panchanga.today_eyebrow").toUpperCase()} · ${t("today")}`
                      : (weekdayNe ?? "").toUpperCase()}
                  </div>
                  <div className="mt-2.5 text-4xl font-bold leading-tight min-[1081px]:mt-2 min-[1081px]:text-[30px]">
                    {displayHeroDate}
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-[rgba(245,245,241,0.85)]">
                    {weekdayNe}
                    {activeP?.bs_date && typeof activeP.bs_date === "object"
                      ? `, ${t("panchanga.bs_era")} ${digits(activeP.bs_date.year)}`
                      : `, ${t("panchanga.bs_era")} ${digits(monthContext.year)}`}
                  </div>
                  <div className="mono mt-1.5 text-xs font-medium text-[rgba(245,245,241,0.55)]">
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

            <div className={cn("flex min-w-0 flex-1 flex-col", isBelow && "min-h-0")}>
            <div
              className="grid shrink-0 grid-cols-4 gap-1.5 border-b border-border px-2.5 py-2.5"
              role="tablist"
              aria-label={t("panchanga.tabs_label")}
            >
              {ASIDE_TAB_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  className={patroAsideTab(id === asideTab)}
                  aria-selected={id === asideTab}
                  onClick={() => setAsideTab(id)}
                >
                  {t(`panchanga.tabs.${id}`)}
                </button>
              ))}
            </div>

            <div
              className={cn(
                "min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5 [-webkit-overflow-scrolling:touch] [scrollbar-color:color-mix(in_srgb,var(--muted-foreground)_35%,transparent)_transparent] [scrollbar-width:thin] max-md:border-none max-md:p-0",
                isBelow && "max-h-[28rem] lg:max-h-none",
              )}
              role="tabpanel"
            >
              <PanchangaAsideTabPanel
                tab={asideTab}
                p={activeP}
                selectedDay={contextDay}
                selectedAdDate={selectedAdDate}
                bsYear={monthContext.year}
                bsMonth={monthContext.month}
                monthDays={monthContext.days}
                todayAd={todayAd}
                loading={initialLoading}
              />
            </div>
            </div>
          </div>
        )}
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
  useRouteLoading(asideInitialLoading);

  return (
    <main className="mx-auto max-w-[1400px] px-4 pb-12 pt-4 max-sm:px-0 max-sm:pb-16 max-sm:pt-0">
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
            initialLoading={asideInitialLoading}
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

      <p className="mt-7 text-center text-[11.5px] text-muted-foreground max-sm:px-2.5">{t("footer_note")}</p>
    </main>
  );
}
