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
import { BS_MONTHS_NE, getCurrentBs } from "../lib/bs-calendar";
import {
  formatHolidayBsDisplay,
  toNepaliDigits,
} from "../lib/panchanga-format";
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

function relLabel(days: number, t: (key: string, opts?: { count?: number }) => string): string {
  if (days === 0) return t("rel.today");
  if (days === 1) return t("rel.tomorrow");
  return t("rel.days_after", { count: days });
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
  const [asideTab, setAsideTab] = useState<AsideTabId>("panchanga");

  const isSelectedToday = selectedAdDate === todayAd;

  const bsDisplay = p?.display?.bs_ne ?? p?.date_bs;
  const adDisplay = p?.display?.gregorian_en ?? fmtAdFull(selectedAdDate);
  const weekdayNe = p?.weekday ?? selectedDay?.weekday_ne ?? selectedDay?.weekday;
  const tithi = p?.tithi?.name_ne ?? p?.tithi?.name ?? selectedDay?.tithi_ne ?? selectedDay?.tithi;
  const paksha = p?.paksha?.label_ne ?? p?.paksha_ne;

  const displayHeroDate = (() => {
    if (p?.bs_date && typeof p.bs_date === "object") {
      return `${BS_MONTHS_NE[p.bs_date.month - 1]} ${toNepaliDigits(p.bs_date.day)}`;
    }
    if (p?.display?.bs_ne) return toNepaliDigits(p.display.bs_ne);
    if (p?.date_bs) return toNepaliDigits(p.date_bs);
    return bsDisplay ? toNepaliDigits(bsDisplay) : "—";
  })();


  const topFestName =
    p?.festivals?.[0]?.name_ne ??
    p?.festivals?.[0]?.name_en ??
    selectedDay?.festivals[0];
  const topFestIsPublic =
    p?.festivals?.[0]?.is_public_holiday ??
    (selectedDay ? false : false);

  return (
    <aside className="pn-aside">
      <div className="pn-aside-panel">
        <div className="pn-aside-head">
          <h2 className="pn-aside-title">
            {isSelectedToday ? t("panchanga.today_title") : t("panchanga.title")}
          </h2>
          <Link to="/panchanga" className="pn-aside-link">
            {t("panchanga.full_detail")} →
          </Link>
        </div>

        {loading ? null : error ? (
          <div className="pn-aside-body">
            <div className="pn-error-box">{t("panchanga.error")}</div>
          </div>
        ) : (
          <div className="pn-aside-body">
            <div className="pn-hero">
              <div className="pn-hero-grid" />
              <div className="pn-hero-layout">
                <div className="pn-hero-main">
                  <div className="pn-hero-eyebrow">
                    {isSelectedToday
                      ? `${t("panchanga.today_eyebrow").toUpperCase()} · ${t("today")}`
                      : (weekdayNe ?? "").toUpperCase()}
                  </div>
                  <div className="pn-hero-date">{displayHeroDate}</div>
                  <div className="pn-hero-sub">
                    {weekdayNe}
                    {p?.bs_date && typeof p.bs_date === "object"
                      ? `, ${t("panchanga.bs_era")} ${toNepaliDigits(p.bs_date.year)}`
                      : ""}
                  </div>
                  <div className="pn-hero-ad">{adDisplay}</div>
                </div>
                {(paksha || tithi || topFestName) ? (
                  <div className="pn-hero-pills">
                    {paksha && <span className="pn-pill">{paksha}</span>}
                    {tithi && <span className="pn-pill">{tithi}</span>}
                    {topFestName && (
                      <span className={`pn-pill ev ${topFestIsPublic ? "public" : "festival"}`}>
                        {topFestName}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="pn-aside-tabs" role="tablist" aria-label={t("panchanga.tabs_label")}>
              {ASIDE_TAB_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  className={`pn-aside-tab${id === asideTab ? " active" : ""}`}
                  aria-selected={id === asideTab}
                  onClick={() => setAsideTab(id)}
                >
                  {t(`panchanga.tabs.${id}`)}
                </button>
              ))}
            </div>

            <div className="pn-aside-scroll" role="tabpanel">
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
  const { t } = useTranslation();

  return (
    <section className="pn-holidays">
      <div className="pn-hol-head">
        <Flag size={18} strokeWidth={1.8} />
        <h2 className="pn-hol-title">{t("holidays.upcoming")}</h2>
        <span className="pn-hol-sub">{t("holidays.upcoming_sub")}</span>
        <Link to="/holidays" className="pn-aside-link">
          {t("holidays.view_all")} →
        </Link>
      </div>

      <div className="pn-hol-list">
        {upcoming.length === 0 ? (
          <div style={{ padding: "16px", color: "var(--muted-foreground)", fontSize: "var(--fs-sm)" }}>
            {t("holidays.none")}
          </div>
        ) : (
          upcoming.map((h) => {
            const days = daysUntil(h.start_date);
            const bsParts = (h.bs_start_date ?? "").split("-");
            const bsDay = bsParts[2] ? Number(bsParts[2]) : new Date(h.start_date).getDate();
            const bsMonthIdx = bsParts[1] ? Number(bsParts[1]) - 1 : 0;
            const bsLabel = formatHolidayBsDisplay(h);
            const type = h.is_public_holiday ? "public" : "festival";

            return (
              <Link key={h.id} to="/holidays" className="pn-hol-row">
                <span className={`pn-datetile ${type}`}>
                  <span className="pn-datetile-d">{toNepaliDigits(bsDay)}</span>
                  <span className="pn-datetile-m">{BS_MONTHS_NE[bsMonthIdx] ?? ""}</span>
                </span>
                <span className="pn-hol-names">
                  <span className="pn-hol-ne">{h.name_ne ?? h.name_en}</span>
                  {h.name_en && h.name_ne && (
                    <span className="pn-hol-en">{h.name_en}</span>
                  )}
                </span>
                <span className={`pn-badge ${type}`}>
                  {h.is_public_holiday ? t("holidays.public") : t("holidays.festival")}
                </span>
                <span className="pn-hol-ad">
                  <span className="pn-hol-bs">{bsLabel}</span>
                  <span className="pn-hol-ad-line mono">{fmtAdFull(h.start_date)}</span>
                  <span className="pn-hol-rel">{relLabel(days, t)}</span>
                </span>
              </Link>
            );
          })
        )}
      </div>

      <RituSeasons location={location} />

      <Link to="/suryakranti" className="pn-sun-times-cta">
        <span className="pn-sun-times-cta-icons" aria-hidden>
          <Sunrise size={16} strokeWidth={1.8} />
          <Sunset size={16} strokeWidth={1.8} />
        </span>
        <span className="pn-sun-times-cta-text">{t("sun_times_cta")}</span>
        <ArrowRight size={14} className="pn-sun-times-cta-arrow" />
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

  const pageLoading =
    calendarLoading || panchangaQ.isLoading || holidaysQ.isLoading;

  useRouteLoading(pageLoading);

  return (
    <main className="pn-page">
      <div className="flex justify-end px-4 sm:px-0 mb-3">
        <LocationSelector
          compact
          location={location}
          onLocationChange={setLocation}
        />
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

      <p className="pn-note">{t("footer_note")}</p>
    </main>
  );
}
