import { useQuery } from "@tanstack/react-query";
import { fetchMonthCalendar, panchangaKeys, type CalendarDay } from "@/lib/api";
import { BS_MONTHS_NE, adToBS } from "@/lib/bs-calendar";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { cn } from "@/lib/utils";

const WEEKDAYS_NE = ["आइत", "सोम", "मंगल", "बुध", "बिहि", "शुक्र", "शनि"];

interface Props {
  date: Date;
  onPickDay: (d: Date) => void;
}

export function PanchangaMonthGrid({ date, onPickDay }: Props) {
  const bs = adToBS(date);
  const todayBs = adToBS(new Date());

  const { data, isLoading } = useQuery({
    queryKey: panchangaKeys.month(bs.year, bs.month),
    queryFn: () => fetchMonthCalendar(bs.year, bs.month),
    staleTime: 1000 * 60 * 60,
  });

  const days = data?.calendar ?? [];
  const firstWeekday = days[0] ? new Date(days[0].date_ad).getDay() : 0;
  const blanks = Array.from({ length: firstWeekday }, (_, i) => i);

  const cellClass = (day: CalendarDay) => {
    const isToday =
      day.day === todayBs.day && bs.month === todayBs.month && bs.year === todayBs.year;
    const isSel = day.day === bs.day;
    return cn(
      "relative min-h-[128px] p-2.5 bg-card text-left cursor-pointer flex flex-col gap-0.5 text-foreground transition-colors border-0",
      "hover:bg-secondary/[0.08]",
      isSel && "ring-2 ring-secondary ring-inset",
      isToday && "bg-secondary/20",
      day.weekday === "Sat" && "text-destructive"
    );
  };

  return (
    <div className="rounded-xl overflow-hidden bg-card shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]">
      <div className="grid grid-cols-7 gap-px bg-border border-b border-border">
        {WEEKDAYS_NE.map((ne, i) => (
          <div
            key={ne}
            className={cn(
              "bg-foreground/[0.03] px-2.5 py-2 flex flex-col gap-0.5",
              i === 6 && "text-destructive"
            )}
          >
            <span className="text-[12.5px] font-semibold">{ne}</span>
            <span className="text-[9.5px] uppercase tracking-wider text-muted-foreground">
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
            <div key={`b-${b}`} className="min-h-[128px] bg-foreground/[0.025]" />
          ))}
          {days.map((day) => {
            const ad = new Date(day.date_ad);
            const isToday =
              day.day === todayBs.day && bs.month === todayBs.month && bs.year === todayBs.year;
            return (
              <button
                key={day.date_ad}
                type="button"
                className={cellClass(day)}
                onClick={() => onPickDay(ad)}
              >
                <span className="text-[10.5px] font-semibold text-muted-foreground truncate">
                  {day.tithi_ne ?? day.tithi}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-bold text-[22px] leading-none tabular-nums">
                    {toNepaliDigits(day.day)}
                  </span>
                  {isToday && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      आज
                    </span>
                  )}
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                    {ad.getDate()}
                  </span>
                </div>
                {(day.sunrise || day.sunset) && (
                  <span className="font-mono text-[9.5px] text-muted-foreground whitespace-nowrap">
                    {day.sunrise && <>↑{toNepaliDigits(day.sunrise)}</>}
                    {day.sunrise && day.sunset && " "}
                    {day.sunset && <>↓{toNepaliDigits(day.sunset)}</>}
                  </span>
                )}
                {day.nakshatra && (
                  <span className="text-[10.5px] truncate">
                    ✦ {day.nakshatra}
                  </span>
                )}
                {day.festivals[0] && (
                  <span className="mt-auto max-w-full truncate text-[10px] font-semibold px-1.5 py-1 rounded-full self-start bg-secondary/14 text-secondary dark:text-teal-300">
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
