import { useMemo } from "react";
import { useQueries, keepPreviousData } from "@tanstack/react-query";
import {
  fetchMonthCalendar,
  panchangaKeys,
  type CalendarDay,
  type LocationParams,
} from "@/lib/api";
import { adToBS } from "@/lib/bs-calendar";
import {
  buildAdCalendarGridDays,
  getBsMonthsOverlappingAdMonth,
  getSecondaryCellDate,
  shiftAdMonth,
  uniqueBsMonths,
} from "@/lib/local-calendar";
import { getMonthDayChandraRashi, getMonthDayNakshatra } from "@/lib/panchanga-format";
import { cn } from "@/lib/utils";
import { useLocale, bilingualText } from "@/i18n/locale";
import { useCalendarEra } from "@/hooks/use-calendar-era";
import { VedicPatroLoader } from "@/components/VedicPatroLoader";
import { VerticalEdgeLabel } from "@/components/VerticalEdgeLabel";

const WEEKDAYS_NE = ["आइतवार", "सोमवार", "मंगलवार", "बुधवार", "बिहीवार", "शुक्रवार", "शनिवार"];
const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_EN_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type PakshaPhase = "shukla" | "krishna";

function getPakshaPhase(day: CalendarDay): PakshaPhase | undefined {
  if (day.paksha === "shukla" || day.paksha_ne?.includes("शुक्ल")) return "shukla";
  if (day.paksha === "krishna" || day.paksha_ne?.includes("कृष्ण")) return "krishna";
  return undefined;
}

function formatTithiWithPaksha(day: CalendarDay, isEn: boolean): string {
  const tithi = isEn ? (day.tithi ?? day.tithi_ne ?? "—") : (day.tithi_ne ?? day.tithi ?? "—");
  const phase = getPakshaPhase(day);
  const pakshaLabel = (() => {
    if (phase === "shukla") return isEn ? "Shukla" : "शुक्ल";
    if (phase === "krishna") return isEn ? "Krishna" : "कृष्ण";
    if (!isEn && day.paksha_ne) return day.paksha_ne.replace(/\s*पक्ष$/, "");
    return undefined;
  })();
  if (!pakshaLabel) return tithi;
  return `${pakshaLabel} ${tithi}`;
}

interface Props {
  date: Date;
  locationParams?: LocationParams;
  onPickDay: (d: Date) => void;
  calendarMode?: "bs" | "ad";
}

function toAdIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function PanchangaMonthGrid({
  date,
  locationParams,
  onPickDay,
  calendarMode = "bs",
}: Props) {
  const { lang, monoDigits, isEnglish } = useLocale();
  const calendarEra = useCalendarEra();
  const isEn = isEnglish;
  const isAdCalendar = calendarMode === "ad" || calendarEra === "ad" || isEnglish;
  const bs = adToBS(date);
  const adYear = date.getFullYear();
  const adMonth = date.getMonth() + 1;
  const selectedAd = toAdIso(date);
  const todayAd = toAdIso(new Date());
  const todayBs = adToBS(new Date());

  const prevAd = useMemo(() => shiftAdMonth(adYear, adMonth, -1), [adYear, adMonth]);
  const nextAd = useMemo(() => shiftAdMonth(adYear, adMonth, 1), [adYear, adMonth]);

  const requiredBsMonths = useMemo(() => {
    if (!isAdCalendar) return [{ year: bs.year, month: bs.month }];
    return uniqueBsMonths([
      ...getBsMonthsOverlappingAdMonth(adYear, adMonth),
      ...getBsMonthsOverlappingAdMonth(prevAd.year, prevAd.month),
      ...getBsMonthsOverlappingAdMonth(nextAd.year, nextAd.month),
    ]);
  }, [isAdCalendar, bs.year, bs.month, adYear, adMonth, prevAd, nextAd]);

  const monthQueries = useQueries({
    queries: requiredBsMonths.map(({ year, month }) => ({
      queryKey: panchangaKeys.month(year, month, locationParams, false, true),
      queryFn: () =>
        fetchMonthCalendar(year, month, locationParams, {
          full: false,
          excludeInternational: true,
        }),
      staleTime: 1000 * 60 * 60,
      placeholderData: keepPreviousData,
    })),
  });

  const monthQueriesTick = monthQueries.map((q) => `${q.dataUpdatedAt ?? 0}:${q.status}`).join("|");

  const enrichedDays = useMemo(() => {
    const byDate = new Map<string, CalendarDay>();
    for (const query of monthQueries) {
      for (const day of query.data?.calendar ?? []) {
        byDate.set(day.date_ad, day);
      }
    }
    return [...byDate.values()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthQueriesTick]);

  const days = useMemo(() => {
    if (!isAdCalendar) {
      return monthQueries[0]?.data?.calendar ?? [];
    }
    return buildAdCalendarGridDays(adYear, adMonth, enrichedDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdCalendar, adYear, adMonth, enrichedDays, monthQueriesTick]);

  const isFetching = monthQueries.some((q) => q.isFetching);
  const isPlaceholderData = monthQueries.some((q) => q.isPlaceholderData);
  const hasData = monthQueries.some((q) => q.data);
  const firstWeekday = days[0] ? new Date(`${days[0].date_ad}T12:00:00`).getDay() : 0;
  // AD grid from buildAdCalendarGridDays already includes leading/trailing padding.
  const blanks = isAdCalendar ? [] : Array.from({ length: firstWeekday }, (_, i) => i);
  const isLoadingFresh = isFetching && (isPlaceholderData || !hasData);

  const cellClass = (day: CalendarDay, phase: PakshaPhase | undefined) => {
    const isToday = isAdCalendar
      ? day.date_ad === todayAd
      : day.day === todayBs.day && bs.month === todayBs.month && bs.year === todayBs.year;
    const isSel = isAdCalendar ? day.date_ad === selectedAd : day.day === bs.day;
    const isKrishna = phase === "krishna";
    return cn(
      "relative min-h-[118px] overflow-hidden p-1.5 text-left cursor-pointer flex flex-col gap-0.5 transition-colors border-0",
      "max-md:min-h-[150px] max-md:gap-px max-md:p-1",
      isKrishna
        ? "bg-background text-foreground dark:text-foreground dark:bg-background"
        : "bg-white text-foreground dark:text-foreground dark:bg-background",
      isSel && "ring-2 ring-primary ring-inset",
      isToday && !isKrishna && "bg-surface-today",
      isToday && isKrishna && "bg-surface-today ring-2 ring-danger/30 ring-inset"
    );
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-muted shadow-sm shadow-ring-soft",
        // No rows yet (first fetch for this location) — reserve space so the
        // loader overlay isn't clipped by a collapsed grid.
        days.length === 0 && "min-h-[420px]",
      )}
      aria-busy={isLoadingFresh}
    >
      {isLoadingFresh && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
        >
          <VedicPatroLoader size={88} />
        </div>
      )}
      <div className="grid grid-cols-7 gap-px  border-b border-border">
        {WEEKDAYS_NE.map((ne, i) => {
          const weekend = i === 0 || i === 6;
          return (
            <div
              key={ne}
              className="flex min-w-0 items-center justify-center bg-background px-1 py-1.5 min-h-[40px]"
            >
              <span
                className={cn(
                  "truncate text-center text-sm font-semibold leading-tight sm:text-sm",
                  weekend && "text-danger",
                )}
              >
                {isEn ? (
                  <>
                    <span className="max-md:hidden">{WEEKDAYS_EN[i]}</span>
                    <span className="hidden max-md:inline">{WEEKDAYS_EN_SHORT[i]}</span>
                  </>
                ) : (
                  ne
                )}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-7 gap-px ">
          {blanks.map((b) => (
            <div key={`b-${b}`} className="min-h-[118px] bg-muted max-md:min-h-[150px]" />
          ))}
          {days.map((day, i) => {
            const ad = new Date(`${day.date_ad}T12:00:00`);
            const phase = getPakshaPhase(day);
            const hasSunTimes = Boolean(day.sunrise || day.sunset);
            const primaryDay = isAdCalendar ? ad.getDate() : day.day;
            const secondary = getSecondaryCellDate(
              day,
              isAdCalendar ? "ad" : "bs",
              lang,
              i === 0,
            );
            const secondaryLabel = secondary.monthLabel
              ? `${secondary.monthLabel} ${monoDigits(secondary.day)}`
              : monoDigits(secondary.day);
            const secondaryLabelShort = secondary.monthLabelShort
              ? `${secondary.monthLabelShort} ${monoDigits(secondary.day)}`
              : monoDigits(secondary.day);

            return (
              <button
                key={day.date_ad}
                type="button"
                className={cn(cellClass(day, phase), hasSunTimes && "md:px-3.5", day.outsideMonth && "opacity-60")}
                onClick={() => onPickDay(ad)}
              >
                {day.sunrise ? (
                  <VerticalEdgeLabel
                    text={monoDigits(day.sunrise)}
                    side="left"
                    className="font-normal tabular-nums text-muted-foreground"
                  />
                ) : null}
                {day.sunset ? (
                  <VerticalEdgeLabel
                    text={monoDigits(day.sunset)}
                    side="right"
                    className="font-normal tabular-nums text-muted-foreground"
                  />
                ) : null}

                {/* Top: tithi — always visible; wraps on narrow cells */}
                <p className="m-0 w-full text-center text-xs font-semibold leading-snug text-foreground line-clamp-2 max-md:line-clamp-none sm:text-xs sm:line-clamp-1 sm:truncate">
                  {formatTithiWithPaksha(day, isEn)}
                </p>
                <p className="m-0 w-full text-center text-xs font-semibold leading-tight text-panchang dark:text-accent sm:truncate sm:text-xs">
                  {getMonthDayNakshatra(day, lang) ?? "—"}
                </p>

                {/* Middle: BS/AD dates in one row (sun times vertical on md+) */}
                <div className="flex min-w-0 flex-1 items-center justify-center py-0.5 max-md:flex-none max-md:flex-col max-md:justify-center max-md:gap-0.5">
                  <div className="flex min-w-0 flex-row flex-wrap items-baseline justify-center gap-x-1 px-0.5">
                    <span className="font-num text-lg font-bold leading-none tabular-nums sm:text-lg">
                      {monoDigits(primaryDay)}
                    </span>
                    <span
                      className={cn(
                        "font-num whitespace-nowrap leading-none sm:text-xs",
                        secondary.monthLabel ? "text-[0.625rem]" : "text-xs",
                      )}
                    >
                      <span className="md:hidden">{secondaryLabelShort}</span>
                      <span className="max-md:hidden">{secondaryLabel}</span>
                    </span>
                  </div>

                  {/* Mobile-only sunrise/sunset — stacked when space is tight */}
                  <div className="hidden w-full flex-col items-center justify-center gap-0.5 font-num text-xs font-bold leading-tight tabular-nums max-md:flex">
                    <span className="whitespace-nowrap">{day.sunrise ? monoDigits(day.sunrise) : "—"}</span>
                    <span className="whitespace-nowrap">{day.sunset ? monoDigits(day.sunset) : "—"}</span>
                  </div>
                </div>

                {/* Bottom: rashi · yoga · karana */}
                <div className="grid w-full min-w-0 grid-cols-3 gap-0.5 text-xs font-bold leading-tight sm:text-xs max-md:grid-cols-1 max-md:gap-px">
                  <span className="text-center font-bold text-panchang dark:text-accent sm:truncate">
                    {getMonthDayChandraRashi(day, lang) ?? "—"}
                  </span>
                  <span className="text-center font-bold sm:truncate">
                    {bilingualText(lang, day.yoga_ne ?? day.yoga, day.yoga ?? day.yoga_ne) ?? "—"}
                  </span>
                  <span className="text-center font-bold sm:truncate">
                    {bilingualText(lang, day.karana_ne ?? day.karana, day.karana ?? day.karana_ne) ?? "—"}
                  </span>
                </div>

                {/* {day.festivals[0] && (
                  <span
                    className={cn(
                      "max-w-full truncate rounded-full px-1 py-0.5 text-xs font-semibold self-start",
                      "max-md:w-full max-md:self-center max-md:py-px max-md:text-sm max-md:leading-tight",
                      "text-panchang text-foreground dark:text-accent"
                    )}
                  >
                    {day.festivals[0]}
                  </span>
                )} */}
              </button>
            );
          })}
        </div>
    </div>
  );
}
