import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useQueries } from "@tanstack/react-query";
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
  getBSMonthLength,
  getCurrentBs,
  getSupportedAdBounds,
} from "@/lib/bs-calendar";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { PanchangaMonthGrid } from "@/components/panchanga/PanchangaMonthGrid";
import { locationToSearch } from "@/lib/url-state";
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/browser";
import {
  applyHolidaysToDays,
  buildAdCalendarGridDays,
  buildCalendarGridDays,
  buildLocalAdMonthDays,
  buildLocalMonthDays,
  getBsMonthsOverlappingAdMonth,
  mergeEnrichedDays,
  shiftAdMonth,
  shiftBsMonth,
  uniqueBsMonths,
} from "@/lib/local-calendar";
import { BsCalendarGrid } from "./BsCalendarGrid";
import { BsMonthHeaderTitle } from "./BsMonthHeaderTitle";
import { VedicPatroLoader } from "./VedicPatroLoader";
import { DayDetailModal } from "./DayDetailModal";
import { useLocale } from "@/i18n/locale";
import { useCalendarEra } from "@/hooks/use-calendar-era";
import { getStoredLanguage } from "@/lib/user-preferences";
import { cn } from "@/lib/utils";
import { patroMdRail, patroSegBtn } from "@/lib/patro-classes";
import { ArrowLeftRight } from "lucide-react";

const BS_YEAR_OPTIONS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i,
);

const AD_BOUNDS = getSupportedAdBounds();
const AD_YEAR_OPTIONS = Array.from(
  { length: AD_BOUNDS.maxYear - AD_BOUNDS.minYear + 1 },
  (_, i) => AD_BOUNDS.minYear + i,
);

/** Home aside sits beside the calendar from Tailwind `xl` (1280px) up. */
const ASIDE_SIDEBAR_MQ = "(min-width: 1280px)";

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(query);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [query]);
  return matches;
}

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
  const calendarEra = useCalendarEra();
  const startsGregorian =
    typeof window !== "undefined" && getStoredLanguage() === "en";
  const isAdCalendar = calendarEra === "ad" || lang === "en" || startsGregorian;
  const init = useMemo(() => {
    if (todayAd) {
      const bs = adToBS(new Date(`${todayAd}T12:00:00`));
      return { year: bs.year, month: bs.month };
    }
    return getCurrentBs();
  }, [todayAd]);
  const initAd = useMemo(() => {
    const d = todayAd ? new Date(`${todayAd}T12:00:00`) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }, [todayAd]);
  const [year, setYear] = useState(init.year);
  const [month, setMonth] = useState(init.month);
  const [adYear, setAdYear] = useState(initAd.year);
  const [adMonth, setAdMonth] = useState(initAd.month);
  const prevLangRef = useRef<string | null>(null);
  const [selected, setSelected] = useState<CalendarDay | null>(null);
  const [internalPatroView, setInternalPatroView] = useState<HomePatroView>(() =>
    enablePatroToggle ? loadHomePatroView() : "calendar",
  );
  const lastMonthContextKey = useRef("");
  const patroView = patroViewProp ?? internalPatroView;
  const isPanchangaPatro = enablePatroToggle && patroView === "panchanga";
  const asideInSidebar = useMediaQuery(ASIDE_SIDEBAR_MQ);

  const switchPatroView = (next: HomePatroView) => {
    if (patroViewProp === undefined) setInternalPatroView(next);
    onPatroViewChange?.(next);
    if (enablePatroToggle) setLocalStorageItem(HOME_PATRO_VIEW_KEY, next);
    setSelected(null);
    onDaySelect?.(null);
  };

  useEffect(() => {
    if (prevLangRef.current === null) {
      prevLangRef.current = lang;
      return;
    }
    if (prevLangRef.current === lang) return;
    const from = prevLangRef.current;
    prevLangRef.current = lang;
    if (lang === "en") {
      const anchor = todayAd
        ? new Date(`${todayAd}T12:00:00`)
        : bsToAD(year, month, Math.min(15, getBSMonthLength(year, month)));
      setAdYear(anchor.getFullYear());
      setAdMonth(anchor.getMonth() + 1);
    } else if (from === "en") {
      const mid = new Date(adYear, adMonth - 1, 15);
      const bs = adToBS(mid);
      setYear(bs.year);
      setMonth(bs.month);
    }
  }, [lang, year, month, adYear, adMonth, todayAd]);

  const localDays = useMemo(
    () =>
      isAdCalendar && !isPanchangaPatro
        ? buildLocalAdMonthDays(adYear, adMonth)
        : buildLocalMonthDays(year, month),
    [isAdCalendar, isPanchangaPatro, adYear, adMonth, year, month],
  );
  const prevBs = useMemo(() => shiftBsMonth(year, month, -1), [year, month]);
  const nextBs = useMemo(() => shiftBsMonth(year, month, 1), [year, month]);

  const canFetchPrev =
    prevBs.year >= BS_SUPPORTED_START_YEAR && prevBs.year <= BS_SUPPORTED_END_YEAR;
  const canFetchNext =
    nextBs.year >= BS_SUPPORTED_START_YEAR && nextBs.year <= BS_SUPPORTED_END_YEAR;

  const prevAd = useMemo(() => shiftAdMonth(adYear, adMonth, -1), [adYear, adMonth]);
  const nextAd = useMemo(() => shiftAdMonth(adYear, adMonth, 1), [adYear, adMonth]);

  const requiredBsMonths = useMemo(() => {
    if (isPanchangaPatro) return [{ year, month }];
    if (!isAdCalendar) {
      const months = [{ year, month }];
      if (canFetchPrev) months.push(prevBs);
      if (canFetchNext) months.push(nextBs);
      return uniqueBsMonths(months);
    }
    return uniqueBsMonths([
      ...getBsMonthsOverlappingAdMonth(adYear, adMonth),
      ...getBsMonthsOverlappingAdMonth(prevAd.year, prevAd.month),
      ...getBsMonthsOverlappingAdMonth(nextAd.year, nextAd.month),
    ]);
  }, [
    isPanchangaPatro,
    isAdCalendar,
    year,
    month,
    adYear,
    adMonth,
    prevBs,
    nextBs,
    prevAd,
    nextAd,
    canFetchPrev,
    canFetchNext,
  ]);

  const monthQueries = useQueries({
    queries: requiredBsMonths.map(({ year: bsYear, month: bsMonth }) => ({
      queryKey: panchangaKeys.month(bsYear, bsMonth, location?.params, false),
      queryFn: () => fetchMonthCalendar(bsYear, bsMonth, location?.params, { full: false }),
      staleTime: 1000 * 60 * 60,
      enabled: !isPanchangaPatro,
    })),
  });

  const monthQueriesTick = monthQueries
    .map((q) => `${q.dataUpdatedAt ?? 0}:${q.status}`)
    .join("|");

  const enrichedCalendarDays = useMemo(() => {
    const byDate = new Map<string, CalendarDay>();
    for (const query of monthQueries) {
      for (const day of query.data?.calendar ?? []) {
        byDate.set(day.date_ad, day);
      }
    }
    return [...byDate.values()];
  }, [monthQueriesTick]);

  const monthFetchError = monthQueries.some((q) => q.isError);

  const prevMonthQ = !isAdCalendar
    ? monthQueries.find(
        (_q, i) =>
          requiredBsMonths[i]?.year === prevBs.year &&
          requiredBsMonths[i]?.month === prevBs.month,
      )
    : undefined;

  const nextMonthQ = !isAdCalendar
    ? monthQueries.find(
        (_q, i) =>
          requiredBsMonths[i]?.year === nextBs.year &&
          requiredBsMonths[i]?.month === nextBs.month,
      )
    : undefined;

  const festivalYears = useMemo(
    () => [...new Set(requiredBsMonths.map((m) => m.year))].sort((a, b) => a - b),
    [requiredBsMonths],
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
    if (enrichedCalendarDays.length) {
      result = mergeEnrichedDays(result, enrichedCalendarDays);
    }
    if (yearFestivals.length) {
      result = applyHolidaysToDays(result, yearFestivals, lang);
    }
    return result;
  }, [localDays, enrichedCalendarDays, yearFestivals, lang]);

  const gridDays = useMemo(() => {
    if (isPanchangaPatro) return monthDays;
    if (isAdCalendar) {
      let grid = buildAdCalendarGridDays(adYear, adMonth, enrichedCalendarDays);
      if (yearFestivals.length) {
        grid = applyHolidaysToDays(grid, yearFestivals, lang);
      }
      return grid;
    }
    let grid = buildCalendarGridDays(year, month, {
      prev: prevMonthQ?.data?.calendar,
      current: monthDays,
      next: nextMonthQ?.data?.calendar,
    });
    if (yearFestivals.length) {
      grid = applyHolidaysToDays(grid, yearFestivals, lang);
    }
    return grid;
  }, [
    isPanchangaPatro,
    isAdCalendar,
    adYear,
    adMonth,
    year,
    month,
    monthDays,
    enrichedCalendarDays,
    prevMonthQ?.data?.calendar,
    nextMonthQ?.data?.calendar,
    yearFestivals,
    lang,
  ]);

  useEffect(() => {
    if (!onMonthContextChange) return;
    const first = monthDays[0]?.date_ad ?? "";
    const last = monthDays.at(-1)?.date_ad ?? "";
    const contextYear = isAdCalendar
      ? adToBS(new Date(adYear, adMonth - 1, 1)).year
      : year;
    const contextMonth = isAdCalendar
      ? adToBS(new Date(adYear, adMonth - 1, 1)).month
      : month;
    const key = `${contextYear}|${contextMonth}|${monthDays.length}|${first}|${last}|${festivalDataTick}|${monthQueriesTick}`;
    if (lastMonthContextKey.current === key) return;
    lastMonthContextKey.current = key;
    onMonthContextChange({ year: contextYear, month: contextMonth, days: monthDays });
  }, [
    isAdCalendar,
    adYear,
    adMonth,
    year,
    month,
    monthDays,
    festivalDataTick,
    monthQueriesTick,
    onMonthContextChange,
  ]);

  const publicHolidayDates = useMemo(
    () =>
      new Set<string>(
        yearFestivals
          .filter((f) => f.is_public_holiday && f.start_date)
          .map((f) => f.start_date as string),
      ),
    [yearFestivals],
  );

  const isEnriching =
    (monthQueries.some((q) => q.isFetching && !q.data) || festivalsLoading) &&
    !isPanchangaPatro;

  const panchangaGridDate = useMemo(() => {
    if (isAdCalendar) {
      if (todayAd) {
        const d = new Date(`${todayAd}T12:00:00`);
        if (d.getFullYear() === adYear && d.getMonth() + 1 === adMonth) return d;
      }
      return new Date(adYear, adMonth - 1, 1, 12, 0, 0, 0);
    }
    return anchorDateForBsMonth(year, month, monthDays, todayAd);
  }, [isAdCalendar, adYear, adMonth, year, month, monthDays, todayAd]);

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
    setSelected(day);
    onDaySelect?.(day);
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
    setSelected(null);
    onDaySelect?.(null);
    if (isAdCalendar) {
      if (adYear === AD_BOUNDS.minYear && adMonth === AD_BOUNDS.minMonth) return;
      const p = shiftAdMonth(adYear, adMonth, -1);
      setAdYear(p.year);
      setAdMonth(p.month);
      return;
    }
    if (month === 1 && year <= BS_SUPPORTED_START_YEAR) return;
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
  }

  function nextMonth() {
    setSelected(null);
    onDaySelect?.(null);
    if (isAdCalendar) {
      if (adYear === AD_BOUNDS.maxYear && adMonth === AD_BOUNDS.maxMonth) return;
      const n = shiftAdMonth(adYear, adMonth, 1);
      setAdYear(n.year);
      setAdMonth(n.month);
      return;
    }
    if (month === 12 && year >= BS_SUPPORTED_END_YEAR) return;
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
  }

  function goToday() {
    if (isAdCalendar) {
      setAdYear(initAd.year);
      setAdMonth(initAd.month);
    } else {
      setYear(init.year);
      setMonth(init.month);
    }
    setSelected(null);
    onDaySelect?.(null);
  }

  const calendarBlock = isPanchangaPatro ? (
    <PanchangaMonthGrid
      date={panchangaGridDate}
      locationParams={location?.params}
      onPickDay={goToPanchangaDay}
      calendarMode={isAdCalendar ? "ad" : "bs"}
    />
  ) : (
    <>
      {monthFetchError && (
        <div className="mb-3 rounded-xl border border-warning/25 bg-warning-surface px-3.5 py-2 text-sm text-base text-warning">
          {t("calendar.enrich_error")}
        </div>
      )}

      <div className="relative" aria-busy={isEnriching}>
        {isEnriching && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/70 backdrop-blur-[2px]"
            role="status"
            aria-live="polite"
          >
            <VedicPatroLoader size={88} label={t("common.enriching")} />
          </div>
        )}
        <BsCalendarGrid
          key={`${lang}-${isAdCalendar ? `${adYear}-${adMonth}` : `${year}-${month}`}`}
          days={gridDays}
          publicHolidayDates={publicHolidayDates}
          selectedAdDate={selected?.date_ad}
          onSelectDay={selectDay}
          isEnriching={isEnriching}
          todayAd={todayAd}
          primaryDate={isAdCalendar ? "ad" : "bs"}
        />
      </div>

      {!asideInSidebar ? (
        <DayDetailModal
          day={selected}
          bsYear={
            selected
              ? adToBS(new Date(`${selected.date_ad}T12:00:00`)).year
              : isAdCalendar
                ? adToBS(new Date(adYear, adMonth - 1, 1)).year
                : year
          }
          bsMonth={
            selected
              ? adToBS(new Date(`${selected.date_ad}T12:00:00`)).month
              : isAdCalendar
                ? adToBS(new Date(adYear, adMonth - 1, 1)).month
                : month
          }
          publicHolidayDates={publicHolidayDates}
          location={location}
          onClose={() => {
            setSelected(null);
            onDaySelect?.(null);
          }}
        />
      ) : null}
    </>
  );

  const nextPatroView: HomePatroView = patroView === "calendar" ? "panchanga" : "calendar";
  const nextPatroLabel = t(nextPatroView === "panchanga" ? "calendar.mode_panchanga" : "calendar.mode_bs");

  const patroModeMobileBtn = enablePatroToggle ? (
    <button
      type="button"
      className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-border bg-card px-2 text-sm font-semibold transition-colors hover:text-foreground active:bg-muted"
      onClick={() => switchPatroView(nextPatroView)}
      aria-label={t("calendar.patro_mode_switch")}
    >
      <ArrowLeftRight className="size-3.5" aria-hidden />
      {nextPatroLabel}
    </button>
  ) : null;

  const patroModeDesktop = enablePatroToggle ? (
    <div
      className="hidden shrink-0 gap-0.5 rounded-lg border border-border bg-card p-0.5 md:inline-flex"
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
    <div className="hidden text-xs text-base uppercase tracking-[0.12em] md:block md:text-right">
      {t("calendar.eyebrow")}
    </div>
  );

  const locationControlMobile =
    location && onLocationChange ? (
      <LocationSelector
        compact
        location={location}
        onLocationChange={onLocationChange}
        className="h-8 min-w-0 w-auto max-w-[7.25rem] shrink-0 px-2"
      />
    ) : null;

  const locationControlDesktop =
    location && onLocationChange ? (
      <LocationSelector
        compact
        location={location}
        onLocationChange={onLocationChange}
        className="h-8 min-w-0 w-auto max-w-[12.5rem]"
      />
    ) : null;

  const mobileHeaderToolbar = patroModeMobileBtn ?? undefined;

  const headerToolbarDesktop = (
    <>
      {patroModeDesktop}
      {locationControlDesktop}
    </>
  );

  function changeMonth(nextMonthValue: number) {
    if (isAdCalendar) {
      setAdMonth(nextMonthValue);
    } else {
      setMonth(nextMonthValue);
    }
    setSelected(null);
    onDaySelect?.(null);
  }

  function changeYear(nextYearValue: number) {
    if (isAdCalendar) {
      setAdYear(nextYearValue);
    } else {
      setYear(nextYearValue);
    }
    setSelected(null);
    onDaySelect?.(null);
  }

  const headerYear = isAdCalendar ? adYear : year;
  const headerMonth = isAdCalendar ? adMonth : month;
  const headerYearOptions = isAdCalendar ? AD_YEAR_OPTIONS : BS_YEAR_OPTIONS;
  const headerPrevDisabled = isAdCalendar
    ? adYear === AD_BOUNDS.minYear && adMonth === AD_BOUNDS.minMonth
    : month === 1 && year <= BS_SUPPORTED_START_YEAR;
  const headerNextDisabled = isAdCalendar
    ? adYear === AD_BOUNDS.maxYear && adMonth === AD_BOUNDS.maxMonth
    : month === 12 && year >= BS_SUPPORTED_END_YEAR;

  const monthHeader = showMonthHeader ? (
    <div
      className={cn(
        patroMdRail,
        "mb-4 mt-2 flex flex-col gap-2 max-md:pt-3 md:flex-row md:items-start md:justify-between md:gap-3 md:pt-0",
      )}
    >
      <div className="min-w-0 flex-1">
        <BsMonthHeaderTitle
          calendarMode={isAdCalendar ? "ad" : "bs"}
          year={headerYear}
          month={headerMonth}
          yearOptions={headerYearOptions}
          todayAd={todayAd}
          onToday={goToday}
          todayAriaLabel={t("calendar.today_btn")}
          onMonthChange={changeMonth}
          onYearChange={changeYear}
          monthAriaLabel={t("calendar.month_aria")}
          yearAriaLabel={t("calendar.year_aria")}
          onPrev={prev}
          onNext={nextMonth}
          prevDisabled={headerPrevDisabled}
          nextDisabled={headerNextDisabled}
          prevAriaLabel={t("calendar.prev_month")}
          nextAriaLabel={t("calendar.next_month")}
          mobileDateTimeDrawer
          mobileToolbar={mobileHeaderToolbar}
          mobileToolbarLower={locationControlMobile ?? undefined}
        />
      </div>

      <div className="hidden shrink-0 flex-row items-center justify-end gap-2 md:flex md:w-auto md:flex-col md:items-end md:pt-0.5">
        {headerToolbarDesktop}
      </div>
    </div>
  ) : null;

  if (!showMonthHeader && !aside && !holidays) {
    return <div>{calendarBlock}</div>;
  }

  if (aside || holidays) {
    return (
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] xl:items-stretch xl:gap-[15px] max-sm:gap-4">
        <div className="min-w-0">{monthHeader}{calendarBlock}</div>
        {aside ? (
          <div className="flex min-w-0 flex-col xl:min-h-full max-sm:px-2.5">{aside}</div>
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
