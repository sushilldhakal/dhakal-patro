import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { BS_MONTH_NAMES, BS_MONTHS_NE, getCurrentBs } from "../lib/bs-calendar";
import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import { patroAsideLink, patroAsideTab, patroHeroDeco, patroHeroGrid, patroHeroPill, patroHeroPillEv } from "@/lib/patro-classes";
import {
  ASIDE_TAB_IDS,
  PanchangaAsideTabPanel,
  type AsideTabId,
} from "@/components/home/PanchangaAsideTabs";
import { HomeQuickLinks } from "@/components/home/HomeQuickLinks";

function fmtAdFull(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });
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
  loading: boolean;
  error: boolean;
  placement?: "sidebar" | "below";
}) {
  const { t } = useTranslation();
  const { pick, digits } = useLocale();
  const [asideTab, setAsideTab] = useState<AsideTabId>("panchanga");

  const isSelectedToday = selectedAdDate === todayAd;

  const bsDisplay = pick(p?.display?.bs_ne, undefined) ?? p?.date_bs;
  const adDisplay = p?.display?.gregorian_en ?? fmtAdFull(selectedAdDate);
  const weekdayNe = pick(
    p?.weekday ?? selectedDay?.weekday_ne ?? selectedDay?.weekday,
    selectedDay?.weekday_en ?? p?.weekday ?? selectedDay?.weekday,
  );
  const tithi = pick(
    p?.tithi?.name_ne ?? p?.tithi?.name ?? selectedDay?.tithi_ne ?? selectedDay?.tithi,
    p?.tithi?.name ?? p?.tithi?.name_ne ?? selectedDay?.tithi ?? selectedDay?.tithi_ne,
  );
  const paksha = pick(p?.paksha?.label_ne ?? p?.paksha_ne, p?.paksha?.label_en ?? p?.paksha?.label_ne ?? p?.paksha_ne);

  const displayHeroDate = (() => {
    if (p?.bs_date && typeof p.bs_date === "object") {
      const monthName = pick(BS_MONTHS_NE[p.bs_date.month - 1], BS_MONTH_NAMES[p.bs_date.month - 1]);
      return `${monthName} ${digits(p.bs_date.day)}`;
    }
    if (p?.display?.bs_ne) return digits(p.display.bs_ne);
    if (p?.date_bs) return digits(p.date_bs);
    return bsDisplay ? digits(bsDisplay) : "—";
  })();

  const topFestName = pick(
    p?.festivals?.[0]?.name_ne ?? p?.festivals?.[0]?.name_en ?? selectedDay?.festivals[0],
    p?.festivals?.[0]?.name_en ?? p?.festivals?.[0]?.name_ne ?? selectedDay?.festivals[0],
  );
  const topFestIsPublic = p?.festivals?.[0]?.is_public_holiday ?? false;
  const isBelow = placement === "below";

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

        {loading ? null : error ? (
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
                patroHeroDeco,
                "shrink-0 rounded-xl bg-[#07080d] p-[22px] text-[#f5f5f1] shadow-lg",
                isBelow ? "mx-4 mt-4 lg:mx-0 lg:mt-0 lg:w-[min(100%,22rem)] lg:rounded-none lg:shadow-none" : "min-[1081px]:rounded-none min-[1081px]:p-5 min-[1081px]:shadow-none",
                !isBelow && "min-[1081px]:rounded-none",
              )}
            >
              <div className={patroHeroGrid} />
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
                    {p?.bs_date && typeof p.bs_date === "object"
                      ? `, ${t("panchanga.bs_era")} ${digits(p.bs_date.year)}`
                      : ""}
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
                p={p}
                selectedDay={selectedDay}
                selectedAdDate={selectedAdDate}
                bsYear={monthContext.year}
                bsMonth={monthContext.month}
                monthDays={monthContext.days}
                todayAd={todayAd}
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
  const [calendarLoading, setCalendarLoading] = useState(false);
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
  const selectedAdDate = selectedDay?.date_ad ?? todayAd;

  const panchangaQ = useQuery({
    queryKey: panchangaKeys.day(selectedAdDate, "ad", location.params),
    queryFn: () => fetchPanchanga(selectedAdDate, "ad", location.params),
    staleTime: 1000 * 60 * 30,
  });

  const handlePatroViewChange = useCallback((view: HomePatroView) => {
    setPatroView(view);
    setLocalStorageItem(HOME_PATRO_VIEW_KEY, view);
  }, []);

  const pageLoading = calendarLoading || panchangaQ.isLoading;

  useRouteLoading(pageLoading);

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
        onLoadingChange={setCalendarLoading}
        aside={
          <PanchangaAside
            placement={patroView === "panchanga" ? "below" : "sidebar"}
            selectedDay={selectedDay}
            selectedAdDate={selectedAdDate}
            todayAd={todayAd}
            monthContext={monthContext}
            p={panchangaQ.data}
            loading={panchangaQ.isLoading}
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
