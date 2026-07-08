import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  fetchMonthCalendar,
  fetchFestivals,
  panchangaKeys,
  holidayKeys,
  type CalendarDay,
  type Festival,
} from "@/lib/api";
import {
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  adToBS,
  bsToAD,
  getCurrentBs,
} from "@/lib/bs-calendar";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { PanchangaMonthGrid } from "@/components/panchanga/PanchangaMonthGrid";
import { locationToSearch } from "@/lib/url-state";
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/browser";
import {
  applyHolidaysToDays,
  buildCalendarGridDays,
  buildLocalMonthDays,
  mergeEnrichedDays,
  shiftBsMonth,
} from "@/lib/local-calendar";
import { BsCalendarGrid } from "./BsCalendarGrid";
import { BsMonthHeaderTitle } from "./BsMonthHeaderTitle";
import { DayDetailModal } from "./DayDetailModal";
import { useLocale } from "@/i18n/locale";
import { patroSegBtn } from "@/lib/patro-classes";

const BS_YEAR_OPTIONS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i,
);

type HomePatroView = "calendar" | "panchanga";
export type { HomePatroView };
export const HOME_PATRO_VIEW_KEY = "dhakalPatroHomePatroView";

export function loadHomePatroView(): HomePatroView {
  const saved = getLocalStorageItem(HOME_PATRO_VIEW_KEY);
  return saved === "panchanga" ? "panchanga" : "calendar";
}

function anchorDateForBsMonth(
  year: number,
  month: number,
  days: CalendarDay[],
  todayAd: string | undefined,
): Date {
  if (todayAd) {
    const bs = adToBS(new Date(`${todayAd}T12:00:00`));
    if (bs.year === year && bs.month === month) {
      return new Date(`${todayAd}T12:00:00`);
    }
  }
  const first = days.find((d) => d.day === 1) ?? days[0];
  if (first?.date_ad) return new Date(`${first.date_ad}T12:00:00`);
  const ad = bsToAD(year, month, 1);
  return new Date(ad.getFullYear(), ad.getMonth(), ad.getDate(), 12, 0, 0, 0);
}

function toAdStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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
  /** Home: toggle between BS calendar and monthly panchanga patro. */
  enablePatroToggle?: boolean;
  patroView?: HomePatroView;
  onPatroViewChange?: (view: HomePatroView) => void;
  location?: PanchangaLocation;
  onLocationChange?: (location: PanchangaLocation) => void;
  todayAd?: string;
}

export function CalendarView({
  onDaySelect,
  onMonthContextChange,
  aside,
  holidays,
  showMonthHeader = true,
  enablePatroToggle = false,
  patroView: patroViewProp,
  onPatroViewChange,
  location,
  onLocationChange,
  todayAd,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lang } = useLocale();
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
  const [internalPatroView, setInternalPatroView] = useState<HomePatroView>(() =>
    enablePatroToggle ? loadHomePatroView() : "calendar",
  );
  const lastMonthContextKey = useRef("");
  const patroView = patroViewProp ?? internalPatroView;
  const isPanchangaPatro = enablePatroToggle && patroView === "panchanga";

  const switchPatroView = (next: HomePatroView) => {
    if (patroViewProp === undefined) setInternalPatroView(next);
    onPatroViewChange?.(next);
    if (enablePatroToggle) setLocalStorageItem(HOME_PATRO_VIEW_KEY, next);
    setSelected(null);
    onDaySelect?.(null);
  };

  const localDays = useMemo(() => buildLocalMonthDays(year, month), [year, month]);
  const prevBs = useMemo(() => shiftBsMonth(year, month, -1), [year, month]);
  const nextBs = useMemo(() => shiftBsMonth(year, month, 1), [year, month]);

  const canFetchPrev =
    prevBs.year >= BS_SUPPORTED_START_YEAR && prevBs.year <= BS_SUPPORTED_END_YEAR;
  const canFetchNext =
    nextBs.year >= BS_SUPPORTED_START_YEAR && nextBs.year <= BS_SUPPORTED_END_YEAR;

  // Lite month rows (`full=false`): the grid only renders day/tithi/festival
  // basics and DayDetailModal fetches its own single-day detail, so skipping
  // the embedded per-day panchanga cuts the payload ~10× and the server work.
  const monthQ = useQuery({
    queryKey: panchangaKeys.month(year, month, location?.params, false),
    queryFn: () => fetchMonthCalendar(year, month, location?.params, { full: false }),
    staleTime: 1000 * 60 * 60,
  });

  const prevMonthQ = useQuery({
    queryKey: panchangaKeys.month(prevBs.year, prevBs.month, location?.params, false),
    queryFn: () => fetchMonthCalendar(prevBs.year, prevBs.month, location?.params, { full: false }),
    staleTime: 1000 * 60 * 60,
    enabled: canFetchPrev && !isPanchangaPatro,
  });

  const nextMonthQ = useQuery({
    queryKey: panchangaKeys.month(nextBs.year, nextBs.month, location?.params, false),
    queryFn: () => fetchMonthCalendar(nextBs.year, nextBs.month, location?.params, { full: false }),
    staleTime: 1000 * 60 * 60,
    enabled: canFetchNext && !isPanchangaPatro,
  });

  const festivalYears = useMemo(
    () => [...new Set([year, prevBs.year, nextBs.year])].sort((a, b) => a - b),
    [year, prevBs.year, nextBs.year],
  );

  const festivalQueries = useQueries({
    queries: festivalYears.map((bsYear) => ({
      queryKey: holidayKeys.festivals(bsYear),
      queryFn: () => fetchFestivals(bsYear),
      staleTime: 1000 * 60 * 60,
    })),
  });

  /** Stable tick — `useQueries` returns a new array ref every render. */
  const festivalDataTick = festivalQueries
    .map((q) => `${q.dataUpdatedAt ?? 0}:${q.status}`)
    .join("|");

  const yearFestivals = useMemo(() => {
    const byKey = new Map<string, Festival>();
    for (const query of festivalQueries) {
      for (const festival of query.data?.festivals ?? []) {
        if (!festival.start_date) continue;
        byKey.set(`${festival.id}:${festival.start_date}`, festival);
      }
    }
    return [...byKey.values()];
    // eslint-disable-next-line react-hooks/exhaustive-deps -- festivalQueries ref is unstable; festivalDataTick tracks data
  }, [festivalDataTick]);

  const festivalsLoading = festivalQueries.some((q) => q.isLoading);

  const monthDays = useMemo(() => {
    let result = localDays;
    if (yearFestivals.length) {
      result = applyHolidaysToDays(result, yearFestivals, lang);
    }
    if (monthQ.data?.calendar) {
      result = mergeEnrichedDays(result, monthQ.data.calendar);
    }
    return result;
  }, [localDays, yearFestivals, monthQ.data, lang]);

  const gridDays = useMemo(() => {
    if (isPanchangaPatro) return monthDays;
    let grid = buildCalendarGridDays(year, month, {
      prev: prevMonthQ.data?.calendar,
      current: monthDays,
      next: nextMonthQ.data?.calendar,
    });
    if (yearFestivals.length) {
      grid = applyHolidaysToDays(grid, yearFestivals, lang);
    }
    return grid;
  }, [
    isPanchangaPatro,
    year,
    month,
    monthDays,
    prevMonthQ.data?.calendar,
    nextMonthQ.data?.calendar,
    yearFestivals,
    lang,
  ]);

  useEffect(() => {
    if (!onMonthContextChange) return;
    const first = monthDays[0]?.date_ad ?? "";
    const last = monthDays.at(-1)?.date_ad ?? "";
    const key = `${year}|${month}|${monthDays.length}|${first}|${last}|${festivalDataTick}|${monthQ.dataUpdatedAt ?? 0}`;
    if (lastMonthContextKey.current === key) return;
    lastMonthContextKey.current = key;
    onMonthContextChange({ year, month, days: monthDays });
  }, [year, month, monthDays, festivalDataTick, monthQ.dataUpdatedAt, onMonthContextChange]);

  const publicHolidayDates = useMemo(
    () =>
      new Set<string>(
        yearFestivals
          .filter((f) => f.is_public_holiday && f.start_date)
          .map((f) => f.start_date as string),
      ),
    [yearFestivals],
  );

  const isEnriching = (monthQ.isFetching && !monthQ.data) || festivalsLoading;

  const panchangaGridDate = useMemo(
    () => anchorDateForBsMonth(year, month, monthDays, todayAd),
    [year, month, monthDays, todayAd],
  );

  function selectDay(day: CalendarDay) {
    if (isPanchangaPatro && location) {
      navigate({
        to: "/panchanga",
        search: {
          ...locationToSearch(location),
          date: day.date_ad,
        },
      });
      return;
    }
    const next = selected?.date_ad === day.date_ad ? null : day;
    setSelected(next);
    onDaySelect?.(next);
  }

  function goToPanchangaDay(d: Date) {
    if (!location) return;
    navigate({
      to: "/panchanga",
      search: {
        ...locationToSearch(location),
        date: toAdStr(d),
      },
    });
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

  const calendarBlock = isPanchangaPatro ? (
    <PanchangaMonthGrid
      date={panchangaGridDate}
      locationParams={location?.params}
      onPickDay={goToPanchangaDay}
    />
  ) : (
    <>
      {monthQ.isError && (
        <div className="mb-3 rounded-xl border border-warning/25 bg-warning-surface px-3.5 py-2 text-sm font-medium text-warning">
          {t("calendar.enrich_error")}
        </div>
      )}

      <div className="relative" aria-busy={isEnriching}>
        {isEnriching && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-3 pt-2"
            role="status"
            aria-live="polite"
          >
            <span className="rounded-full border border-border/80 bg-card/95 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
              {t("common.enriching")}
            </span>
          </div>
        )}
        <BsCalendarGrid
          days={gridDays}
          publicHolidayDates={publicHolidayDates}
          selectedAdDate={selected?.date_ad}
          onSelectDay={selectDay}
          isEnriching={isEnriching}
          todayAd={todayAd}
        />
      </div>

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

  const patroModeBlock = enablePatroToggle ? (
    <div
      className="inline-flex shrink-0 gap-0.5 rounded-lg border border-border bg-card p-0.5"
      role="radiogroup"
      aria-label={t("calendar.patro_mode_aria")}
    >
      <button
        type="button"
        role="radio"
        aria-checked={patroView === "calendar"}
        className={patroSegBtn(patroView === "calendar")}
        onClick={() => switchPatroView("calendar")}
      >
        {t("calendar.mode_bs")}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={patroView === "panchanga"}
        className={patroSegBtn(patroView === "panchanga")}
        onClick={() => switchPatroView("panchanga")}
      >
        {t("calendar.mode_panchanga")}
      </button>
    </div>
  ) : (
    <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground sm:text-right">
      {t("calendar.eyebrow")}
    </div>
  );

  function changeMonth(nextMonth: number) {
    setMonth(nextMonth);
    setSelected(null);
    onDaySelect?.(null);
  }

  function changeYear(nextYear: number) {
    setYear(nextYear);
    setSelected(null);
    onDaySelect?.(null);
  }

  const monthHeader = showMonthHeader ? (
    <div className="mb-4 mt-2 flex items-start justify-between gap-3 max-sm:px-2.5 max-sm:pt-3">
      <div className="min-w-0 flex-1">
        <BsMonthHeaderTitle
          year={year}
          month={month}
          yearOptions={BS_YEAR_OPTIONS}
          todayAd={todayAd}
          onToday={goToday}
          todayAriaLabel={t("calendar.today_btn")}
          onMonthChange={changeMonth}
          onYearChange={changeYear}
          monthAriaLabel={t("calendar.month_aria")}
          yearAriaLabel={t("calendar.year_aria")}
          onPrev={prev}
          onNext={nextMonth}
          prevDisabled={month === 1 && year <= BS_SUPPORTED_START_YEAR}
          nextDisabled={month === 12 && year >= BS_SUPPORTED_END_YEAR}
          prevAriaLabel={t("calendar.prev_month")}
          nextAriaLabel={t("calendar.next_month")}
        />
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
        {patroModeBlock}
        {location && onLocationChange ? (
          <LocationSelector
            compact
            location={location}
            onLocationChange={onLocationChange}
            className="w-auto max-w-[11rem] sm:max-w-[12.5rem]"
          />
        ) : null}
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
          <div className="flex min-w-0 flex-col min-[1081px]:min-h-full max-sm:px-2.5">{aside}</div>
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
