import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Flag, Sunrise, Sunset } from "lucide-react";
import {
  fetchPanchanga,
  fetchHolidays,
  panchangaKeys,
  holidayKeys,
  type Holiday,
  type CalendarDay,
  type PanchangaDay,
} from "../lib/api";
import { CalendarView, type CalendarMonthContext } from "../components/CalendarView";
import { RituSeasons } from "../components/RituSeasons";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { useRouteLoading } from "@/lib/route-loading";
import {
  resolveLocationTimezone,
  usePanchangaLocation,
  type PanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";
import { todayAdStringInTimezone } from "@/lib/zoned-time";
import { BS_MONTH_NAMES, BS_MONTHS_NE, getCurrentBs } from "../lib/bs-calendar";
import { formatHolidayBsDisplay } from "../lib/panchanga-format";
import { formatLocaleDigits } from "@/i18n/digits";
import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import { patroAsideLink, patroAsideTab, patroHeroDeco, patroHeroGrid, patroHeroPill, patroHeroPillEv } from "@/lib/patro-classes";
import {
  ASIDE_TAB_IDS,
  PanchangaAsideTabPanel,
  type AsideTabId,
} from "@/components/home/PanchangaAsideTabs";

const TODAY_AD = new Date().toISOString().split("T")[0];

function fmtAdFull(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });
}

function daysUntil(iso: string): number {
  const target = new Date(iso);
  const today = new Date(TODAY_AD);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function relLabel(
  days: number,
  t: (key: string, opts?: { count?: number }) => string,
  lang: string,
): string {
  if (days === 0) return t("rel.today");
  if (days === 1) return t("rel.tomorrow");
  return t("rel.days_after", { count: Number(formatLocaleDigits(days, lang)) });
}

function PanchangaAside({
  selectedDay,
  selectedAdDate,
  todayAd,
  monthContext,
  p,
  loading,
  error,
}: {
  selectedDay: CalendarDay | null;
  selectedAdDate: string;
  todayAd: string;
  monthContext: CalendarMonthContext;
  p?: PanchangaDay;
  loading: boolean;
  error: boolean;
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

  return (
    <aside className="flex min-h-0 flex-1 flex-col gap-3 max-sm:px-2.5 min-[1081px]:h-full min-[1081px]:gap-0">
      <div className="flex flex-col gap-3 min-[1081px]:min-h-0 min-[1081px]:flex-1 min-[1081px]:gap-0 min-[1081px]:overflow-hidden min-[1081px]:rounded-xl min-[1081px]:bg-card min-[1081px]:shadow-sm min-[1081px]:shadow-ring-soft">
        <div className="flex items-baseline gap-2.5 min-[1081px]:shrink-0 min-[1081px]:border-b min-[1081px]:border-border min-[1081px]:px-4 min-[1081px]:pt-3.5 min-[1081px]:pb-3">
          <h2 className="m-0 flex-1 text-lg font-bold">
            {isSelectedToday ? t("panchanga.today_title") : t("panchanga.title")}
          </h2>
          <Link to="/panchanga" className={patroAsideLink}>
            {t("panchanga.full_detail")} →
          </Link>
        </div>

        {loading ? null : error ? (
          <div className="flex flex-col gap-3 min-[1081px]:min-h-0 min-[1081px]:flex-1 min-[1081px]:gap-0 min-[1081px]:overflow-hidden">
            <div className="rounded-lg border border-danger/20 bg-error-surface p-3.5 text-sm font-medium text-danger min-[1081px]:m-4">
              {t("panchanga.error")}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 min-[1081px]:min-h-0 min-[1081px]:flex-1 min-[1081px]:gap-0 min-[1081px]:overflow-hidden">
            <div className={cn(patroHeroDeco, "rounded-xl bg-[#07080d] p-[22px] text-[#f5f5f1] shadow-lg shrink-0 min-[1081px]:rounded-none min-[1081px]:p-5 min-[1081px]:shadow-none")}>
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
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5 [-webkit-overflow-scrolling:touch] [scrollbar-color:color-mix(in_srgb,var(--muted-foreground)_35%,transparent)_transparent] [scrollbar-width:thin] max-md:border-none max-md:p-0"
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
        )}
      </div>
    </aside>
  );
}

function UpcomingHolidays({
  upcoming,
  location,
}: {
  upcoming: Holiday[];
  location: PanchangaLocation;
}) {
  const { t, i18n } = useTranslation();
  const { lang, pick, digits } = useLocale();

  return (
    <section className="col-span-full mt-2 max-sm:px-2.5">
      <div className="mb-3 flex flex-wrap items-baseline gap-2.5">
        <Flag size={18} strokeWidth={1.8} className="self-center text-secondary dark:text-secondary" />
        <h2 className="m-0 text-lg font-bold">{t("holidays.upcoming")}</h2>
        <span className="flex-1 text-xs font-medium text-muted-foreground">{t("holidays.upcoming_sub")}</span>
        <Link to="/holidays" className={patroAsideLink}>
          {t("holidays.view_all")} →
        </Link>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl bg-card shadow-xs shadow-ring-soft">
        {upcoming.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">{t("holidays.none")}</div>
        ) : (
          upcoming.map((h) => {
            const days = daysUntil(h.start_date);
            const bsParts = (h.bs_start_date ?? "").split("-");
            const bsDay = bsParts[2] ? Number(bsParts[2]) : new Date(h.start_date).getDate();
            const bsMonthIdx = bsParts[1] ? Number(bsParts[1]) - 1 : 0;
            const bsLabel = formatHolidayBsDisplay(h, i18n.language);
            const type = h.is_public_holiday ? "public" : "festival";

            return (
              <Link
                key={h.id}
                to="/holidays"
                className="flex w-full cursor-pointer items-center gap-3.5 border-b border-border bg-transparent px-4 py-3 text-left text-foreground no-underline transition-colors last:border-b-0 hover:bg-surface-hover"
              >
                <span
                  className={cn(
                    "flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-px rounded-lg",
                    type === "public"
                      ? "bg-hol-tile-public text-danger"
                      : "bg-hol-tile-festival text-accent dark:text-[#7fd6db]",
                  )}
                >
                  <span className="font-num text-[17px] font-bold leading-none">{digits(bsDay)}</span>
                  <span className="text-[9.5px] font-semibold tracking-wide">
                    {pick(BS_MONTHS_NE[bsMonthIdx], BS_MONTH_NAMES[bsMonthIdx]) ?? ""}
                  </span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-px">
                  <span className="text-[15px] font-semibold">
                    {pick(h.name_ne ?? h.name_en, h.name_en ?? h.name_ne)}
                  </span>
                  {lang === "ne" && h.name_en && h.name_ne && (
                    <span className="text-xs text-muted-foreground">{h.name_en}</span>
                  )}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold leading-none",
                    type === "public"
                      ? "bg-chip-public text-danger"
                      : "bg-chip-festival text-accent dark:text-[#7fd6db]",
                  )}
                >
                  {h.is_public_holiday ? t("holidays.public") : t("holidays.festival")}
                </span>
                <span className="flex min-w-0 flex-col items-end gap-px text-right">
                  <span className="text-xs font-semibold text-muted-foreground">{bsLabel}</span>
                  <span className="mono text-[11px] text-muted-foreground">{fmtAdFull(h.start_date)}</span>
                  <span className="text-[11px] font-medium text-secondary">{relLabel(days, t, i18n.language)}</span>
                </span>
              </Link>
            );
          })
        )}
      </div>

      <RituSeasons location={location} />

      <Link
        to="/suryakranti"
        className="group mt-3 flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm font-semibold text-foreground no-underline transition-colors hover:border-secondary/35 hover:bg-tab-hover hover:text-secondary dark:hover:text-secondary"
      >
        <span className="flex items-center gap-1 text-secondary dark:text-secondary" aria-hidden>
          <Sunrise size={16} strokeWidth={1.8} />
          <Sunset size={16} strokeWidth={1.8} />
        </span>
        <span className="flex-1">{t("sun_times_cta")}</span>
        <ArrowRight size={14} className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-secondary" />
      </Link>
    </section>
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
  const [monthContext, setMonthContext] = useState<CalendarMonthContext>(() => ({
    year: bsYear,
    month: bsMonth,
    days: [],
  }));
  const handleMonthContextChange = useCallback((ctx: CalendarMonthContext) => {
    setMonthContext(ctx);
  }, []);
  const selectedAdDate = selectedDay?.date_ad ?? todayAd;

  const panchangaQ = useQuery({
    queryKey: panchangaKeys.day(selectedAdDate, "ad", location.params),
    queryFn: () => fetchPanchanga(selectedAdDate, "ad", location.params),
    staleTime: 1000 * 60 * 30,
  });

  const holidaysQ = useQuery({
    queryKey: holidayKeys.holidays(bsYear),
    queryFn: () => fetchHolidays(bsYear),
    staleTime: 1000 * 60 * 60,
  });

  const upcomingHolidays = useMemo(
    () =>
      (holidaysQ.data?.holidays ?? [])
        .filter((h) => h.start_date >= TODAY_AD)
        .slice(0, 6),
    [holidaysQ.data],
  );

  const pageLoading = calendarLoading || panchangaQ.isLoading || holidaysQ.isLoading;

  useRouteLoading(pageLoading);

  return (
    <main className="mx-auto max-w-[1400px] px-4 pb-12 pt-4 max-sm:px-0 max-sm:pb-16 max-sm:pt-0">
      <div className="mb-3 flex justify-end px-4 sm:px-0">
        <LocationSelector compact location={location} onLocationChange={setLocation} />
      </div>
      <CalendarView
        location={location}
        todayAd={todayAd}
        onDaySelect={setSelectedDay}
        onMonthContextChange={handleMonthContextChange}
        onLoadingChange={setCalendarLoading}
        aside={
          <PanchangaAside
            selectedDay={selectedDay}
            selectedAdDate={selectedAdDate}
            todayAd={todayAd}
            monthContext={monthContext}
            p={panchangaQ.data}
            loading={panchangaQ.isLoading}
            error={panchangaQ.isError}
          />
        }
        holidays={<UpcomingHolidays upcoming={upcomingHolidays} location={location} />}
      />

      <p className="mt-7 text-center text-[11.5px] text-muted-foreground max-sm:px-2.5">{t("footer_note")}</p>
    </main>
  );
}
