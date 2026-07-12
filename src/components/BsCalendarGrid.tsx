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
                <span className="text-xs font-medium uppercase tracking-widest">{WEEKDAYS_EN[i]}</span>
              ) : (
                <>
                  <span className={cn("text-sm font-semibold max-md:hidden", weekend && "text-danger")}>{ne}</span>
                  <span
                    className={cn(
                      "hidden text-center text-sm font-bold leading-tight tracking-tight max-md:block",
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
          const hasFestival = !isOutside && day.festivals.length > 0 && !isPublicHoliday;

          const mainFest = day.festivals[0];
          const tithi = pick(day.tithi_ne ?? day.tithi, day.tithi ?? day.tithi_ne);

          return (
            <button
              key={day.date_ad}
              type="button"
              className={cn(
                "relative flex min-h-[104px] min-w-0 flex-col border-none bg-card p-2 text-foreground transition-colors",
                "max-md:min-h-[5rem] max-md:p-1",
                isOutside && "bg-surface-muted/90 hover:bg-surface-hover",
                isToday && "bg-surface-today hover:bg-surface-today-hover",
                !isToday && !isOutside && !isPublicHoliday && !hasFestival && "hover:bg-surface-hover",
                isSelected && "shadow-[inset_0_0_0_2px_var(--ring)]",
                isPublicHoliday && "bg-surface-tint-danger",
              )}
              onClick={() => onSelectDay?.(day)}
            >
              {/* Top row: tithi (left) · English date (right) */}
              <span className="flex w-full items-start justify-between gap-1 leading-none">
                {tithi ? (
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-left text-xs font-semibold md:font-medium pt-1",
                      isOutside ? "" : "",
                    )}
                  >
                    {tithi}
                  </span>
                ) : isEnriching && !isOutside ? (
                  <span
                    className="inline-block h-1.5 w-6 animate-pulse rounded-full bg-muted-foreground/25"
                    aria-hidden
                  />
                ) : (
                  <span className="min-w-0 flex-1" aria-hidden />
                )}
                <span
                  className={cn(
                    "font-num shrink-0 text-right text-xs font-semibold md:font-medium pt-1",
                    isOutside ? "" : "",
                  )}
                >
                  {digits(fmtAdDay(day.date_ad))}
                </span>
              </span>

              {/* Center: BS day number */}
              <span className="flex flex-1 flex-col items-center justify-center gap-0.5">
                {isToday && (
                  <span className="rounded-full bg-secondary px-1.5 py-0.5 text-xs font-bold leading-none tracking-wide text-secondary-foreground max-md:px-1">
                    {t("calendar.today_badge")}
                  </span>
                )}
                <span
                  className={cn(
                    "font-num text-3xl font-semibold leading-none tracking-tight max-md:text-2xl",
                    isOutside && "",
                    !isOutside && (isWeekend || isPublicHoliday) && "text-danger",
                  )}
                >
                  {digits(day.day)}
                </span>
              </span>

              {/* Bottom: festival / holiday */}
              {mainFest && !isOutside ? (
                <span
                  className={cn(
                    "w-full truncate text-center text-xs font-semibold leading-tight",
                    "max-md:whitespace-normal max-md:line-clamp-2 max-md:leading-[1.15]",
                    isPublicHoliday ? "text-danger" : "text-foreground",
                  )}
                >
                  {mainFest}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
