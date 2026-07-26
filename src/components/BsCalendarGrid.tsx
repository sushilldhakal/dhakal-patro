import { useTranslation } from "react-i18next";
import type { CalendarDay } from "@/lib/api";
import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";

const WEEKDAYS_NE = ["आइतवार", "सोमवार", "मंगलवार", "बुधवार", "बिहीवार", "शुक्रवार", "शनिवार"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_SHORT = ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"];

const TODAY_AD = new Date().toISOString().split("T")[0];

function fmtAdDay(iso: string): number {
  return new Date(iso + "T12:00:00").getDate();
}

/** Patro-style upright vertical festival label along the cell edge. */
function VerticalFestivalLabel({
  name,
  side,
  danger,
}: {
  name: string;
  side: "left" | "right";
  danger?: boolean;
}) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute z-[1] max-md:hidden",
        "top-7 bottom-7 w-3 overflow-hidden",
        side === "left" ? "left-1" : "right-1",
      )}
      aria-hidden
    >
      <span
        className={cn(
          "inline-block max-h-full overflow-hidden text-xs font-semibold leading-[1.05] tracking-tight",
          danger ? "text-danger" : "text-foreground/85",
          side === "left" ? "[writing-mode:vertical-rl] rotate-180" : "[writing-mode:vertical-rl]",
        )}
      >
        {name}
      </span>
    </span>
  );
}

interface Props {
  days: CalendarDay[];
  publicHolidayDates: Set<string>;
  selectedAdDate?: string;
  onSelectDay?: (day: CalendarDay) => void;
  isEnriching?: boolean;
  todayAd?: string;
}

export function BsCalendarGrid({
  days,
  publicHolidayDates,
  selectedAdDate,
  onSelectDay,
  isEnriching = false,
  todayAd = TODAY_AD,
}: Props) {
  const { t } = useTranslation();
  const { lang, pick, digits } = useLocale();
  const cells: (CalendarDay | null)[] = [...days];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted shadow-sm shadow-ring-soft max-md:rounded-none max-md:shadow-none">
      <div className="grid grid-cols-7 gap-px">
        {WEEKDAYS_NE.map((ne, i) => {
          const weekend = i === 0 || i === 6;
          return (
            <div
              key={ne}
              className="flex min-w-0 flex-col gap-px bg-surface-inset px-3 py-2 max-md:items-center max-md:px-0 max-md:py-1"
            >
              {lang === "en" ? (
                <span className="text-xs text-md font-semibold uppercase tracking-widest">{WEEKDAYS_EN[i]}</span>
              ) : (
                <>
                  <span className={cn("text-md font-semibold max-md:hidden", weekend && "text-danger")}>{ne}</span>
                  <span
                    className={cn(
                      "hidden text-center text-md font-bold leading-tight tracking-tight max-md:block",
                      weekend && "text-danger",
                    )}
                  >
                    {WEEKDAYS_SHORT[i]}
                  </span>
                </>
              )}
            </div>
          );
        })}

        {cells.map((day, i) => {
          if (!day) {
            return (
              <div
                key={`empty-${i}`}
                className="min-h-[104px] cursor-default bg-surface-muted max-md:min-h-12"
                aria-hidden
              />
            );
          }

          const col = i % 7;
          const isOutside = day.outsideMonth === true;
          const isToday = day.date_ad === todayAd;
          const isSelected = day.date_ad === selectedAdDate && !isToday;
          const isWeekend = col === 0 || col === 6;
          const isPublicHoliday = !isOutside && publicHolidayDates.has(day.date_ad);
          const festivals = !isOutside ? day.festivals.filter(Boolean) : [];
          const hasFestival = festivals.length > 0 && !isPublicHoliday;
          const mainFest = festivals[0];
          const leftFest = festivals[1];
          const rightFest = festivals[2];
          const tithi = pick(day.tithi_ne ?? day.tithi, day.tithi ?? day.tithi_ne);
          const festTitle =
            festivals.length > 3 ? festivals.join(" · ") : undefined;

          return (
            <button
              key={day.date_ad}
              type="button"
              title={festTitle}
              className={cn(
                "relative flex min-h-[104px] min-w-0 flex-col overflow-hidden border-none bg-card p-2 text-foreground transition-colors",
                "max-md:min-h-[5rem] max-md:p-1",
                (leftFest || rightFest) && "md:px-3",
                isOutside && "bg-surface-muted/70 text-foreground/70 hover:bg-surface-hover",
                isToday && "bg-surface-today hover:bg-surface-today-hover",
                !isToday && !isOutside && !isPublicHoliday && !hasFestival && "hover:bg-surface-hover",
                isSelected && "shadow-[inset_0_0_0_2px_var(--ring)]",
                isPublicHoliday && "bg-surface-tint-danger",
              )}
              onClick={() => onSelectDay?.(day)}
            >
              {leftFest ? (
                <VerticalFestivalLabel name={leftFest} side="left" danger={isPublicHoliday} />
              ) : null}
              {rightFest ? (
                <VerticalFestivalLabel name={rightFest} side="right" danger={isPublicHoliday} />
              ) : null}

              {/* Top row: tithi (full width) */}
              <span className="flex w-full items-start leading-none">
                {tithi ? (
                  <span className="min-w-0 w-full truncate text-center text-xs font-semibold md:text-sm pt-1">
                    {tithi}
                  </span>
                ) : isEnriching && !isOutside ? (
                  <span
                    className="inline-block h-1.5 w-6 animate-pulse rounded-full bg-muted-foreground/25"
                    aria-hidden
                  />
                ) : (
                  <span className="min-w-0 w-full" aria-hidden />
                )}
              </span>

              {/* Center: BS day (large) + AD day (small) */}
              <span className="flex flex-1 flex-col items-center justify-center gap-0.5">
                {isToday && (
                  <span className="rounded-full bg-secondary px-1.5 py-0.5 text-xs font-bold leading-none tracking-wide text-secondary-foreground max-md:px-1">
                    {t("calendar.today_badge")}
                  </span>
                )}
                <span className="flex items-baseline justify-center gap-1 leading-none">
                  <span
                    className={cn(
                      "font-num text-3xl font-semibold tracking-tight max-md:text-2xl",
                      !isOutside && (isWeekend || isPublicHoliday) && "text-danger",
                    )}
                  >
                    {digits(day.day)}
                  </span>
                  <span className="font-num text-xs font-semibold text-muted-foreground md:text-sm">
                    {digits(fmtAdDay(day.date_ad))}
                  </span>
                </span>
              </span>

              {/* Bottom: primary festival (extras on left/right vertically on md+) */}
              {mainFest ? (
                <span
                  className={cn(
                    "flex w-full min-w-0 flex-col gap-px text-center text-xs font-semibold leading-tight",
                    isPublicHoliday ? "text-danger" : "text-foreground",
                  )}
                >
                  <span className="truncate max-md:whitespace-normal max-md:line-clamp-2 max-md:leading-[1.15]">
                    {mainFest}
                  </span>
                  {festivals.length > 1 ? (
                    <span className="flex flex-col gap-px md:hidden">
                      {festivals.slice(1, 3).map((name, fi) => (
                        <span
                          key={`${name}-${fi}`}
                          className="truncate text-[10px] font-medium leading-tight opacity-90"
                        >
                          {name}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
