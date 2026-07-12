import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { PanchangaDataMode } from "@/components/panchanga/use-panchanga-mode";
import {
  fetchMonthCalendar,
  panchangaKeys,
  type CalendarDay,
  type LocationParams,
} from "@/lib/api";
import { adToBS } from "@/lib/bs-calendar";
import { getMonthDayChandraRashi, getMonthDayNakshatra } from "@/lib/panchanga-format";
import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n/locale";
import { VedicPatroLoader } from "@/components/VedicPatroLoader";

const WEEKDAYS_NE = ["आइतवार", "सोमवार", "मंगलवार", "बुधवार", "बिहीवार", "शुक्रवार", "शनिवार"];
const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
  dataMode?: PanchangaDataMode;
  clock?: string;
}

export function PanchangaMonthGrid({
  date,
  locationParams,
  onPickDay,
  dataMode = "udaya",
  clock = "12:00",
}: Props) {
  const { lang, pick, digits } = useLocale();
  const isEn = lang === "en";
  const bs = adToBS(date);
  const todayBs = adToBS(new Date());
  const isInstant = dataMode === "instant";

  // Udaya mode renders only lite row fields (tithi/yoga/karana/sun times), so
  // fetch `full=false` and skip the heavy embedded per-day panchanga block.
  const { data, isFetching, isPlaceholderData } = useQuery({
    queryKey: isInstant
      ? panchangaKeys.monthAtClock(bs.year, bs.month, clock, locationParams, true)
      : panchangaKeys.month(bs.year, bs.month, locationParams, false, true),
    queryFn: () =>
      fetchMonthCalendar(bs.year, bs.month, locationParams, {
        clock: isInstant ? clock : undefined,
        full: isInstant ? undefined : false,
        excludeInternational: true,
      }),
    staleTime: 1000 * 60 * 60,
    placeholderData: keepPreviousData,
  });

  const days = data?.calendar ?? [];
  const firstWeekday = days[0] ? new Date(days[0].date_ad).getDay() : 0;
  const blanks = Array.from({ length: firstWeekday }, (_, i) => i);
  // keepPreviousData leaves the previous month/location's rows visible while
  // refetching — cover them with the loader so the user knows data is stale.
  const isLoadingFresh = isFetching && (isPlaceholderData || !data);

  const cellClass = (day: CalendarDay, phase: PakshaPhase | undefined) => {
    const isToday =
      day.day === todayBs.day && bs.month === todayBs.month && bs.year === todayBs.year;
    const isSel = day.day === bs.day;
    const isKrishna = phase === "krishna";
    return cn(
      "relative min-h-[118px] p-1.5 text-left cursor-pointer flex flex-col gap-0.5 transition-colors border-0",
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
      {isInstant && (
        <div className="px-3 py-2 text-xs border-b border-border">
          {pick("प्रत्येक दिन ", "Each day at ")}
          <span className="font-mono font-semibold text-foreground tabular-nums">
            {digits(clock)}
          </span>{" "}
          {pick("बजेको तिथि/नक्षत्र/योग/करण (समय-आधारित)", "— tithi/nakshatra/yoga/karana (ephemeris mode)")}
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
                {pick(ne, WEEKDAYS_EN[i])}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-7 gap-px ">
          {blanks.map((b) => (
            <div key={`b-${b}`} className="min-h-[118px] bg-muted max-md:min-h-[150px]" />
          ))}
          {days.map((day) => {
            const ad = new Date(day.date_ad);
            const phase = getPakshaPhase(day);

            return (
              <button
                key={day.date_ad}
                type="button"
                className={cellClass(day, phase)}
                onClick={() => onPickDay(ad)}
              >
                {/* Top: tithi — always visible; wraps on narrow cells */}
                <p className="m-0 w-full text-center text-sm font-semibold leading-snug text-foreground line-clamp-2 max-md:line-clamp-none sm:text-xs sm:line-clamp-1 sm:truncate">
                  {formatTithiWithPaksha(day, isEn)}
                </p>
                <p className="m-0 w-full text-center text-sm font-semibold leading-tight text-panchang dark:text-accent sm:truncate sm:text-sm">
                  {getMonthDayNakshatra(day, lang) ?? "—"}
                </p>

                {/* Middle: sunrise · day · sunset */}
                <div className="flex min-w-0 flex-1 items-center justify-between gap-1 py-0.5 max-md:flex-none max-md:flex-col max-md:justify-center max-md:gap-0.5">
                  <span className="w-[28%] min-w-0 shrink-0 font-mono text-sm leading-none tabular-nums max-md:hidden">
                    {day.sunrise ? digits(day.sunrise) : "—"}
                  </span>

                  <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-0.5 max-md:flex-none">
                    <div className="flex flex-col items-center max-md:flex-row max-md:items-baseline max-md:gap-1">
                      <span className="font-mono text-lg font-bold leading-none tabular-nums sm:text-lg">
                        {digits(day.day)}
                      </span>
                      <span className="mt-0.5 font-mono text-sm leading-none sm:text-sm max-md:mt-0">
                        {ad.getDate()}
                      </span>
                    </div>
                  </div>

                  <span className="w-[28%] min-w-0 shrink-0 text-right font-mono text-sm leading-none tabular-nums max-md:hidden">
                    {day.sunset ? digits(day.sunset) : "—"}
                  </span>

                  {/* Mobile-only sunrise/sunset — stacked when space is tight */}
                  <div className="hidden w-full flex-col items-center justify-center gap-0.5 font-mono text-sm font-bold leading-tight tabular-nums max-md:flex">
                    <span className="whitespace-nowrap">{day.sunrise ? digits(day.sunrise) : "—"}</span>
                    <span className="whitespace-nowrap">{day.sunset ? digits(day.sunset) : "—"}</span>
                  </div>
                </div>

                {/* Bottom: rashi · yoga · karana */}
                <div className="grid w-full min-w-0 grid-cols-3 gap-0.5 text-sm font-bold leading-tight sm:text-sm max-md:grid-cols-1 max-md:gap-px">
                  <span className="text-center font-bold text-panchang dark:text-accent sm:truncate">
                    {getMonthDayChandraRashi(day, lang) ?? "—"}
                  </span>
                  <span className="text-center font-bold sm:truncate">
                    {pick(day.yoga_ne ?? day.yoga, day.yoga ?? day.yoga_ne) ?? "—"}
                  </span>
                  <span className="text-center font-bold sm:truncate">
                    {pick(day.karana_ne ?? day.karana, day.karana ?? day.karana_ne) ?? "—"}
                  </span>
                </div>

                {day.festivals[0] && (
                  <span
                    className={cn(
                      "max-w-full truncate rounded-full px-1 py-0.5 text-xs font-semibold self-start",
                      "max-md:w-full max-md:self-center max-md:py-px max-md:text-sm max-md:leading-tight",
                      "text-panchang text-foreground dark:text-accent"
                    )}
                  >
                    {day.festivals[0]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
    </div>
  );
}
