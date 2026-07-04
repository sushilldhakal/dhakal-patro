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

const WEEKDAYS_NE = ["आइत", "सोम", "मंगल", "बुध", "बिहि", "शुक्र", "शनि"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  const { data } = useQuery({
    queryKey: isInstant
      ? panchangaKeys.monthAtClock(bs.year, bs.month, clock, locationParams)
      : panchangaKeys.month(bs.year, bs.month, locationParams),
    queryFn: () =>
      fetchMonthCalendar(bs.year, bs.month, locationParams, {
        clock: isInstant ? clock : undefined,
      }),
    staleTime: 1000 * 60 * 60,
    placeholderData: keepPreviousData,
  });

  const days = data?.calendar ?? [];
  const firstWeekday = days[0] ? new Date(days[0].date_ad).getDay() : 0;
  const blanks = Array.from({ length: firstWeekday }, (_, i) => i);

  const cellClass = (day: CalendarDay, phase: PakshaPhase | undefined) => {
    const isToday =
      day.day === todayBs.day && bs.month === todayBs.month && bs.year === todayBs.year;
    const isSel = day.day === bs.day;
    const isKrishna = phase === "krishna";
    return cn(
      "relative min-h-[118px] p-1.5 text-left cursor-pointer flex flex-col gap-0.5 transition-colors border-0",
      isKrishna
        ? "bg-background text-foreground dark:text-foreground dark:bg-background"
        : "bg-white text-foreground dark:text-foreground dark:bg-background",
      isSel && "ring-2 ring-primary ring-inset",
      isToday && !isKrishna && "bg-surface-today",
      isToday && isKrishna && "bg-surface-today ring-2 ring-danger/30 ring-inset"
    );
  };

  return (
    <div className="rounded-xl overflow-hidden bg-card shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]">
      {isInstant && (
        <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border bg-secondary/10">
          {pick("प्रत्येक दिन ", "Each day at ")}
          <span className="font-mono font-semibold text-foreground tabular-nums">
            {digits(clock)}
          </span>{" "}
          {pick("बजेको तिथि/नक्षत्र/योग/करण (समय-आधारित)", "— tithi/nakshatra/yoga/karana (ephemeris mode)")}
        </div>
      )}
      <div className="grid grid-cols-7 gap-px bg-border border-b border-border">
        {WEEKDAYS_NE.map((ne, i) => (
          <div
            key={ne}
            className="bg-foreground/[0.03] px-1.5 py-1.5 flex flex-col gap-0.5"
          >
            <span className="text-[11px] font-semibold truncate">{pick(ne, WEEKDAYS_EN[i])}</span>
            {lang === "ne" && (
              <span className="text-xs uppercase tracking-wider text-muted-foreground truncate">
                {WEEKDAYS_EN[i]}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-border">
          {blanks.map((b) => (
            <div key={`b-${b}`} className="min-h-[118px] bg-foreground/[0.025]" />
          ))}
          {days.map((day) => {
            const ad = new Date(day.date_ad);
            const isToday =
              day.day === todayBs.day && bs.month === todayBs.month && bs.year === todayBs.year;
            const phase = getPakshaPhase(day);

            return (
              <button
                key={day.date_ad}
                type="button"
                className={cellClass(day, phase)}
                onClick={() => onPickDay(ad)}
              >
                {/* Top: tithi + nakshatra */}
                <p className="text-xs font-semibold truncate text-center w-full leading-tight m-0 text-foreground">
                  {formatTithiWithPaksha(day, isEn)}
                </p>
                <p className="m-0 text-[11px] font-semibold truncate text-center w-full leading-tight text-panchang dark:text-accent">
                  {getMonthDayNakshatra(day, lang) ?? "—"}
                </p>

                {/* Middle: sunrise · day · sunset */}
                <div className="flex items-center justify-between gap-1 min-w-0 flex-1 py-0.5">
                  <span className="w-[28%] min-w-0 shrink-0 font-mono text-[11px] leading-none tabular-nums text-muted-foreground">
                    {day.sunrise ? digits(day.sunrise) : "—"}
                  </span>

                  <div className="flex flex-col items-center justify-center flex-1 min-w-0 px-0.5">
                    <span className="font-mono font-bold text-[22px] leading-none tabular-nums">
                      {digits(day.day)}
                    </span>
                    <span className="font-mono text-[11px] leading-none mt-0.5 text-muted-foreground">
                      {ad.getDate()}
                    </span>
                    {isToday && (
                      <span className="text-[8px] font-bold px-1 py-px rounded-full mt-0.5 text-danger">
                        {pick("आज", "Today")}
                      </span>
                    )}
                  </div>

                  <span className="w-[28%] min-w-0 shrink-0 text-right font-mono text-[11px] leading-none tabular-nums text-muted-foreground">
                    {day.sunset ? digits(day.sunset) : "—"}
                  </span>
                </div>

                {/* Bottom: rashi · yoga · karana */}
                <div className="grid grid-cols-3 gap-0.5 text-[11px] leading-tight min-w-0 w-full">
                  <span className="truncate text-center font-semibold text-panchang dark:text-accent">
                    {getMonthDayChandraRashi(day, lang) ?? "—"}
                  </span>
                  <span className="truncate text-center">
                    {pick(day.yoga_ne ?? day.yoga, day.yoga ?? day.yoga_ne) ?? "—"}
                  </span>
                  <span className="truncate text-center">
                    {pick(day.karana_ne ?? day.karana, day.karana ?? day.karana_ne) ?? "—"}
                  </span>
                </div>

                {day.festivals[0] && (
                  <span
                    className={cn(
                      "max-w-full truncate text-xs font-semibold px-1 py-0.5 rounded-full self-start",
                      "bg-chip-festival text-panchang dark:text-accent"
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
