import { useQuery } from "@tanstack/react-query";
import { Moon, Sunrise, SunMoon, Sunset } from "lucide-react";
import type { PanchangaDataMode } from "@/components/panchanga/use-panchanga-mode";
import {
  fetchMonthCalendar,
  panchangaKeys,
  type CalendarDay,
  type LocationParams,
} from "@/lib/api";
import { BS_MONTHS_NE, adToBS } from "@/lib/bs-calendar";
import { NakshatraIcon } from "@/components/nakshatra/NakshatraIcon";
import { formatMonthMoonEventDisplay, toNepaliDigits } from "@/lib/panchanga-format";
import { cn } from "@/lib/utils";

const WEEKDAYS_NE = ["आइत", "सोम", "मंगल", "बुध", "बिहि", "शुक्र", "शनि"];

type PakshaPhase = "shukla" | "krishna";

function getPakshaPhase(day: CalendarDay): PakshaPhase | undefined {
  if (day.paksha === "shukla" || day.paksha_ne?.includes("शुक्ल")) return "shukla";
  if (day.paksha === "krishna" || day.paksha_ne?.includes("कृष्ण")) return "krishna";
  return undefined;
}

function formatTithiWithPaksha(day: CalendarDay): string {
  const tithi = day.tithi_ne ?? day.tithi ?? "—";
  const pakshaLabel = (() => {
    if (day.paksha_ne?.includes("शुक्ल")) return "शुक्ल";
    if (day.paksha_ne?.includes("कृष्ण")) return "कृष्ण";
    if (day.paksha_ne) return day.paksha_ne.replace(/\s*पक्ष$/, "");
    if (day.paksha === "shukla") return "शुक्ल";
    if (day.paksha === "krishna") return "कृष्ण";
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
  const bs = adToBS(date);
  const todayBs = adToBS(new Date());
  const isInstant = dataMode === "instant";

  const { data, isLoading } = useQuery({
    queryKey: isInstant
      ? panchangaKeys.monthAtClock(bs.year, bs.month, clock, locationParams)
      : panchangaKeys.month(bs.year, bs.month, locationParams),
    queryFn: () =>
      fetchMonthCalendar(bs.year, bs.month, locationParams, {
        clock: isInstant ? clock : undefined,
      }),
    staleTime: 1000 * 60 * 60,
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
      "relative min-h-[132px] p-1.5 text-left cursor-pointer flex flex-col gap-1 transition-colors border-0",
      isKrishna
        ? "bg-background text-foreground dark:text-foreground dark:bg-background"
        : "bg-white text-foreground dark:text-foreground dark:bg-background",
      isSel &&
        (isKrishna ? "ring-2 ring-secondary ring-inset" : "ring-2 ring-secondary ring-inset"),
      isToday && !isKrishna && "bg-secondary/20",
      isToday && isKrishna && "ring-2 ring-slate-300/50 ring-inset"
    );
  };

  return (
    <div className="rounded-xl overflow-hidden bg-card shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]">
      {isInstant && (
        <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border bg-secondary/10">
          प्रत्येक दिन{" "}
          <span className="font-mono font-semibold text-foreground tabular-nums">
            {toNepaliDigits(clock)}
          </span>{" "}
          बजेको तिथि/नक्षत्र/योग/करण (समय-आधारित)
        </div>
      )}
      <div className="grid grid-cols-7 gap-px bg-border border-b border-border">
        {WEEKDAYS_NE.map((ne, i) => (
          <div
            key={ne}
            className="bg-foreground/[0.03] px-1.5 py-1.5 flex flex-col gap-0.5"
          >
            <span className="text-[11px] font-semibold truncate">{ne}</span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground truncate">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i]}
            </span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
          Loading {BS_MONTHS_NE[bs.month - 1]}…
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-px bg-border">
          {blanks.map((b) => (
            <div key={`b-${b}`} className="min-h-[132px] bg-foreground/[0.025]" />
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
                {/* Top: tithi */}
                <p
                  className={cn(
                    "text-xs font-semibold truncate text-center w-full leading-tight m-0 ext-foreground",
                  )}
                >
                  {formatTithiWithPaksha(day)}
                </p>

                {/* Middle: sunrise · day · sunset */}
                <div className="flex items-center justify-between gap-0.5 min-w-0 flex-1">
                  <div className="flex flex-col items-start justify-center gap-0.5 w-[30%] min-w-0 shrink-0">
                    {day.sunrise ? (
                      <>
                        <Sunrise
                          className={cn(
                            "w-4 h-4 shrink-0 text-orange-500"
                          )}
                        />
                        <span className="font-mono text-xs leading-none tabular-nums">
                          {toNepaliDigits(day.sunrise)}
                        </span>
                      </>
                    ) : (
                      <span className={cn("text-xs")}>—</span>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center flex-1 min-w-0 px-0.5">
                    <span className="font-mono font-bold text-[22px] leading-none tabular-nums">
                      {toNepaliDigits(day.day)}
                    </span>
                    <span className="font-mono text-xs leading-none mt-0.5 text-foreground">
                      {ad.getDate()}
                    </span>
                    {isToday && (
                      <span
                        className={cn(
                          "text-[8px] font-bold px-1 py-px rounded-full mt-0.5 g-secondary text-secondary-foreground",
                        )}
                      >
                        आज
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-end justify-center gap-0.5 w-[30%] min-w-0 shrink-0">
                    {day.sunset ? (
                      <>
                        <Sunset
                          className={cn(
                            "w-4 h-4 shrink-0 text-blue-500"
                          )}
                        />
                        <span className="font-mono text-xs leading-none tabular-nums">
                          {toNepaliDigits(day.sunset)}
                        </span>
                      </>
                    ) : (
                      <span className={cn("text-xs")}>—</span>
                    )}
                  </div>
                </div>

                {/* Bottom: nakshatra · yoga · karana */}
                <div className="grid grid-cols-3 gap-0.5 text-xs leading-tight min-w-0 w-full">
                  <span className="flex flex-col items-center gap-0.5 min-w-0">
                    <NakshatraIcon
                      name={day.nakshatra_ne ?? day.nakshatra}
                      size={20}
                      strokeWidth={1.8}
                      className="text-secondary dark:text-[var(--brand-yellow)]"
                    />
                    <span className="truncate font-medium text-center w-full">
                      {day.nakshatra_ne ?? day.nakshatra ?? "—"}
                    </span>
                  </span>
                  <span className={cn("truncate text-center")}>
                    {day.yoga_ne ?? day.yoga ?? "—"}
                  </span>
                  <span className={cn("truncate text-center")}>
                    {day.karana_ne ?? day.karana ?? "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1 min-w-0 w-full">
                  <span className="inline-flex items-center gap-0.5 min-w-0">
                    <SunMoon className="w-4 h-4 shrink-0 text-foreground" />
                    <span className="font-mono text-xs leading-none tabular-nums truncate">
                      {formatMonthMoonEventDisplay(day, "moonrise") ?? "—"}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-0.5 min-w-0">
                    <Moon className="w-4 h-4 shrink-0 text-foreground" />
                    <span className="font-mono text-xs leading-none tabular-nums truncate">
                      {formatMonthMoonEventDisplay(day, "moonset") ?? "—"}
                    </span>
                  </span>
                </div>

                {day.festivals[0] && (
                  <span
                    className={cn(
                      "max-w-full truncate text-xs font-semibold px-1 py-0.5 rounded-full self-start",
                      "bg-secondary/14 text-secondary dark:text-teal-300"
                    )}
                  >
                    {day.festivals[0]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
