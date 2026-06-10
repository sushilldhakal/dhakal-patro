import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  fetchMonthCalendar,
  fetchHolidays,
  panchangaKeys,
  holidayKeys,
  type CalendarDay,
} from "@/lib/api";
import { BS_MONTH_NAMES, BS_MONTHS_NE, getCurrentBs, bsMonthLabel } from "@/lib/bs-calendar";
import {
  applyHolidaysToDays,
  buildLocalMonthDays,
  getBsMonthAdSpanLabel,
  mergeEnrichedDays,
} from "@/lib/local-calendar";
import { BsCalendarGrid } from "./BsCalendarGrid";
import { DayDetailModal } from "./DayDetailModal";

const BS_YEAR_OPTIONS = Array.from({ length: 51 }, (_, i) => 2060 + i);

interface Props {
  onDaySelect?: (day: CalendarDay | null) => void;
  aside?: ReactNode;
  holidays?: ReactNode;
  showMonthHeader?: boolean;
}

export function CalendarView({
  onDaySelect,
  aside,
  holidays,
  showMonthHeader = true,
}: Props) {
  const init = getCurrentBs();
  const [year, setYear] = useState(init.year);
  const [month, setMonth] = useState(init.month);
  const [selected, setSelected] = useState<CalendarDay | null>(null);
  const [mode, setMode] = useState<"bs" | "ad">("bs");

  const localDays = useMemo(() => buildLocalMonthDays(year, month), [year, month]);
  const adMonthSpan = useMemo(() => getBsMonthAdSpanLabel(year, month), [year, month]);
  const monthQ = useQuery({
    queryKey: panchangaKeys.month(year, month),
    queryFn: () => fetchMonthCalendar(year, month),
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

  function selectDay(day: CalendarDay) {
    const next = selected?.date_ad === day.date_ad ? null : day;
    setSelected(next);
    onDaySelect?.(next);
  }

  function prev() {
    setSelected(null);
    onDaySelect?.(null);
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
  }

  function nextMonth() {
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
      />

      <DayDetailModal
        day={selected}
        bsYear={year}
        bsMonth={month}
        publicHolidayDates={publicHolidayDates}
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
        <div className="pn-eyebrow">नेपाली पात्रो · वि.सं.</div>
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
          aria-label="Month"
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
          aria-label="Year"
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
          <button type="button" className="pn-iconbtn" onClick={prev} aria-label="Previous month">
            <ChevronLeft size={16} strokeWidth={1.8} />
          </button>
          <button type="button" className="pn-todaybtn" onClick={goToday}>
            आज
          </button>
          <button type="button" className="pn-iconbtn" onClick={nextMonth} aria-label="Next month">
            <ChevronRight size={16} strokeWidth={1.8} />
          </button>
        </div>

        {isEnriching && <span className="pn-enrich-note">Loading tithi…</span>}

        <div className="pn-seg" role="tablist">
          <button
            type="button"
            className={`pn-seg-btn${mode === "bs" ? " on" : ""}`}
            onClick={() => setMode("bs")}
          >
            वि.सं.
          </button>
          <button
            type="button"
            className={`pn-seg-btn${mode === "ad" ? " on" : ""}`}
            onClick={() => setMode("ad")}
          >
            A.D.
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
        {aside}
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
