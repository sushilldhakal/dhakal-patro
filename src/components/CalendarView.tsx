import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  fetchMonthCalendar,
  fetchHolidays,
  panchangaKeys,
  holidayKeys,
  type CalendarDay,
} from "@/lib/api";
import {
  BS_MONTH_NAMES,
  BS_MONTHS_NE,
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  adToBS,
  getCurrentBs,
  bsMonthLabel,
} from "@/lib/bs-calendar";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import {
  applyHolidaysToDays,
  buildLocalMonthDays,
  getBsMonthAdSpanLabel,
  mergeEnrichedDays,
} from "@/lib/local-calendar";
import { BsCalendarGrid } from "./BsCalendarGrid";
import { DayDetailModal } from "./DayDetailModal";

const BS_YEAR_OPTIONS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i
);

export type CalendarMonthContext = {
  year: number;
  month: number;
  days: CalendarDay[];
};

interface Props {
  onDaySelect?: (day: CalendarDay | null) => void;
  onMonthContextChange?: (ctx: CalendarMonthContext) => void;
  aside?: ReactNode;
  holidays?: ReactNode;
  showMonthHeader?: boolean;
  /** Active location — drives per-day tithi/sunrise for the month grid. */
  location?: PanchangaLocation;
  /** AD date (YYYY-MM-DD) considered "today", resolved for the location's timezone. */
  todayAd?: string;
  onLoadingChange?: (loading: boolean) => void;
}

export function CalendarView({
  onDaySelect,
  onMonthContextChange,
  aside,
  holidays,
  showMonthHeader = true,
  location,
  todayAd,
  onLoadingChange,
}: Props) {
  const { t } = useTranslation();
  // "Today" follows the active location's timezone when provided, so opening the
  // patro lands on the correct local month/day rather than the browser's.
  const init = useMemo(() => {
    if (todayAd) {
      const bs = adToBS(new Date(`${todayAd}T12:00:00`));
      return { year: bs.year, month: bs.month };
    }
    return getCurrentBs();
  }, [todayAd]);
  const [year, setYear] = useState(init.year);
  const [month, setMonth] = useState(init.month);
  const [selected, setSelected] = useState<CalendarDay | null>(null);
  const [mode, setMode] = useState<"bs" | "ad">("bs");

  const localDays = useMemo(() => buildLocalMonthDays(year, month), [year, month]);
  const adMonthSpan = useMemo(() => getBsMonthAdSpanLabel(year, month), [year, month]);
  const monthQ = useQuery({
    queryKey: panchangaKeys.month(year, month, location?.params),
    queryFn: () => fetchMonthCalendar(year, month, location?.params),
    staleTime: 1000 * 60 * 60,
  });

  const holidayQ = useQuery({
    queryKey: holidayKeys.holidays(year),
    queryFn: () => fetchHolidays(year),
    staleTime: 1000 * 60 * 60,
  });

  const days = useMemo(() => {
    let result = localDays;
    if (holidayQ.data?.holidays) {
      result = applyHolidaysToDays(result, holidayQ.data.holidays);
    }
    if (monthQ.data?.calendar) {
      result = mergeEnrichedDays(result, monthQ.data.calendar);
    }
    return result;
  }, [localDays, holidayQ.data, monthQ.data]);

  useEffect(() => {
    onMonthContextChange?.({ year, month, days });
  }, [year, month, days, onMonthContextChange]);

  const publicHolidayDates = useMemo(
    () =>
      new Set<string>(
        (holidayQ.data?.holidays ?? [])
          .filter((h) => h.is_public_holiday)
          .map((h) => h.start_date),
      ),
    [holidayQ.data],
  );

  const isEnriching = monthQ.isFetching && !monthQ.data;

  useEffect(() => {
    onLoadingChange?.(monthQ.isLoading || holidayQ.isLoading);
  }, [monthQ.isLoading, holidayQ.isLoading, onLoadingChange]);

  function selectDay(day: CalendarDay) {
    const next = selected?.date_ad === day.date_ad ? null : day;
    setSelected(next);
    onDaySelect?.(next);
  }

  function prev() {
    if (month === 1 && year <= BS_SUPPORTED_START_YEAR) return;
    setSelected(null);
    onDaySelect?.(null);
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 12 && year >= BS_SUPPORTED_END_YEAR) return;
    setSelected(null);
    onDaySelect?.(null);
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
  }

  function goToday() {
    setYear(init.year);
    setMonth(init.month);
    setSelected(null);
    onDaySelect?.(null);
  }

  const calendarBlock = (
    <>
      {monthQ.isError && (
        <div className="pn-warn-banner">
          Tithi & sunrise could not be loaded — dates are still correct.
        </div>
      )}

      <BsCalendarGrid
        days={days}
        publicHolidayDates={publicHolidayDates}
        selectedAdDate={selected?.date_ad}
        onSelectDay={selectDay}
        mode={mode}
        isEnriching={isEnriching}
        todayAd={todayAd}
      />

      <DayDetailModal
        day={selected}
        bsYear={year}
        bsMonth={month}
        publicHolidayDates={publicHolidayDates}
        location={location}
        onClose={() => {
          setSelected(null);
          onDaySelect?.(null);
        }}
      />
    </>
  );

  const monthHeader = showMonthHeader ? (
    <div className="pn-monthhead">
      <div className="pn-monthtitle">
        <div className="pn-eyebrow">{t("calendar.eyebrow")}</div>
        <h1 className="pn-h1">
          {BS_MONTHS_NE[month - 1]}{" "}
          <span className="pn-h1-yr">{year}</span>
        </h1>
        <div className="pn-sub">
          {BS_MONTH_NAMES[month - 1]} {year} · {adMonthSpan}
        </div>
      </div>

      <div className="pn-controls">
        <select
          className="pn-select"
          value={month}
          aria-label={t("calendar.month_aria")}
          onChange={(e) => {
            setMonth(Number(e.target.value));
            setSelected(null);
            onDaySelect?.(null);
          }}
        >
          {BS_MONTH_NAMES.map((_: string, i: number) => (
            <option key={i} value={i + 1}>
              {bsMonthLabel(i + 1)}
            </option>
          ))}
        </select>

        <select
          className="pn-select"
          value={year}
          aria-label={t("calendar.year_aria")}
          onChange={(e) => {
            setYear(Number(e.target.value));
            setSelected(null);
            onDaySelect?.(null);
          }}
        >
          {BS_YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <div className="pn-navgroup">
          <button
            type="button"
            className="pn-iconbtn"
            onClick={prev}
            disabled={month === 1 && year <= BS_SUPPORTED_START_YEAR}
            aria-label={t("calendar.prev_month")}
          >
            <ChevronLeft size={16} strokeWidth={1.8} />
          </button>
          <button type="button" className="pn-todaybtn" onClick={goToday}>
            {t("calendar.today_btn")}
          </button>
          <button
            type="button"
            className="pn-iconbtn"
            onClick={nextMonth}
            disabled={month === 12 && year >= BS_SUPPORTED_END_YEAR}
            aria-label={t("calendar.next_month")}
          >
            <ChevronRight size={16} strokeWidth={1.8} />
          </button>
        </div>

        {isEnriching && <span className="pn-enrich-note">{t("common.enriching")}</span>}

        <div className="pn-seg" role="radiogroup" aria-label={t("calendar.era_aria")}>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "bs"}
            className={`pn-seg-btn${mode === "bs" ? " on" : ""}`}
            onClick={() => setMode("bs")}
          >
            {t("calendar.mode_bs")}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "ad"}
            className={`pn-seg-btn${mode === "ad" ? " on" : ""}`}
            onClick={() => setMode("ad")}
          >
            {t("calendar.mode_ad")}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (!showMonthHeader && !aside && !holidays) {
    return <div>{calendarBlock}</div>;
  }

  if (aside || holidays) {
    return (
      <div className="pn-layout">
        <div className="pn-calendar-col">
          {monthHeader}
          {calendarBlock}
        </div>
        {aside ? <div className="pn-aside-col">{aside}</div> : null}
        {holidays}
      </div>
    );
  }

  return (
    <>
      {monthHeader}
      {calendarBlock}
    </>
  );
}
