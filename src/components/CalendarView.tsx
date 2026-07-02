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
import { useLocale } from "@/i18n/locale";
import { patroSegBtn } from "@/lib/patro-classes";

const BS_YEAR_OPTIONS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i,
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
  location?: PanchangaLocation;
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
  const { lang, pick, digits } = useLocale();
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
      result = applyHolidaysToDays(result, holidayQ.data.holidays, lang);
    }
    if (monthQ.data?.calendar) {
      result = mergeEnrichedDays(result, monthQ.data.calendar);
    }
    return result;
  }, [localDays, holidayQ.data, monthQ.data, lang]);

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
        <div className="mb-3 rounded-xl border border-warning/25 bg-warning-surface px-3.5 py-2 text-sm font-medium text-warning">
          {t("calendar.enrich_error")}
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
    <div className="mb-4 mt-2 flex flex-wrap items-end justify-between gap-4 max-sm:px-2.5 max-sm:pt-3">
      <div className="flex w-full flex-col items-start min-[1081px]:w-auto">
        <div className="mb-1.5 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {t("calendar.eyebrow")}
        </div>
        <h1 className="m-0 text-[40px] font-bold leading-tight tracking-tight max-sm:text-[28px]">
          {pick(BS_MONTHS_NE[month - 1], BS_MONTH_NAMES[month - 1])}{" "}
          <span className="font-num font-semibold text-secondary dark:text-secondary">{digits(year)}</span>
        </h1>
        <div className="mt-1 text-sm text-muted-foreground">
          {pick(`${BS_MONTH_NAMES[month - 1]} ${year} · `, "")}
          {adMonthSpan}
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center gap-2.5 min-[1081px]:w-auto">
        <select
          className="h-8 cursor-pointer rounded-lg border border-border bg-card px-2.5 text-[13px] font-medium text-foreground"
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
              {bsMonthLabel(i + 1, lang)}
            </option>
          ))}
        </select>

        <select
          className="h-8 cursor-pointer rounded-lg border border-border bg-card px-2.5 text-[13px] font-medium text-foreground"
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
              {digits(y)}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
            onClick={prev}
            disabled={month === 1 && year <= BS_SUPPORTED_START_YEAR}
            aria-label={t("calendar.prev_month")}
          >
            <ChevronLeft size={16} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            className="h-8 cursor-pointer rounded-lg border-none bg-primary px-4 text-[13.5px] font-semibold text-primary-foreground shadow-xs transition-[filter,transform] hover:brightness-105 active:translate-y-px"
            onClick={goToday}
          >
            {t("calendar.today_btn")}
          </button>
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
            onClick={nextMonth}
            disabled={month === 12 && year >= BS_SUPPORTED_END_YEAR}
            aria-label={t("calendar.next_month")}
          >
            <ChevronRight size={16} strokeWidth={1.8} />
          </button>
        </div>

        {isEnriching && <span className="text-xs font-medium text-muted-foreground">{t("common.enriching")}</span>}

        <div
          className="inline-flex gap-0.5 rounded-lg border border-border bg-card p-0.5"
          role="radiogroup"
          aria-label={t("calendar.era_aria")}
        >
          <button
            type="button"
            role="radio"
            aria-checked={mode === "bs"}
            className={patroSegBtn(mode === "bs")}
            onClick={() => setMode("bs")}
          >
            {t("calendar.mode_bs")}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "ad"}
            className={patroSegBtn(mode === "ad")}
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
      <div className="grid items-start gap-4 min-[1081px]:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] min-[1081px]:items-stretch min-[1081px]:gap-[15px] max-sm:gap-4">
        <div className="min-w-0">{monthHeader}{calendarBlock}</div>
        {aside ? (
          <div className="flex h-0 min-h-full min-w-0 flex-col min-[1081px]:h-auto">{aside}</div>
        ) : null}
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
