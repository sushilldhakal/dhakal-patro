import { useTranslation } from "react-i18next";
import type { CalendarDay } from "@/lib/api";
import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";

const WEEKDAYS_NE = ["आइतवार", "सोमवार", "मंगलवार", "बुधवार", "बिहीवार", "शुक्रवार", "शनिवार"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_SHORT = ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"];

const TODAY_AD = new Date().toISOString().split("T")[0];

function fmtAdShort(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleString("en", { month: "short", day: "numeric" });
}

function fmtAdCompact(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  const month = d.toLocaleString("en", { month: "short" }).toLowerCase();
  return `${month} ${d.getDate()}`;
}

interface Props {
  days: CalendarDay[];
  publicHolidayDates: Set<string>;
  selectedAdDate?: string;
  onSelectDay?: (day: CalendarDay) => void;
  mode?: "bs" | "ad";
  isEnriching?: boolean;
  todayAd?: string;
}

export function BsCalendarGrid({
  days,
  publicHolidayDates,
  selectedAdDate,
  onSelectDay,
  mode = "bs",
  isEnriching = false,
  todayAd = TODAY_AD,
}: Props) {
  const { t } = useTranslation();
  const { lang, pick, digits } = useLocale();
  const firstDay = days[0];
  const startOffset = firstDay ? new Date(firstDay.date_ad).getDay() : 0;

  const cells: (CalendarDay | null)[] = [...Array<null>(startOffset).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm shadow-ring-soft max-md:rounded-none max-md:shadow-none">
      <div className="grid grid-cols-7 gap-px bg-border">
        {WEEKDAYS_NE.map((ne, i) => {
          const weekend = i === 0 || i === 6;
          return (
            <div
              key={ne}
              className="flex min-w-0 flex-col gap-px bg-surface-inset px-3 py-2 max-md:items-center max-md:px-0 max-md:py-1"
            >
              {lang === "en" ? (
                <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{WEEKDAYS_EN[i]}</span>
              ) : (
                <>
                  <span className={cn("text-sm font-semibold max-md:hidden", weekend && "text-danger")}>{ne}</span>
                  <span
                    className={cn(
                      "hidden text-center text-[9px] font-semibold leading-tight tracking-tight max-md:block",
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
          const isToday = day.date_ad === todayAd;
          const isSelected = day.date_ad === selectedAdDate && !isToday;
          const isWeekend = col === 0 || col === 6;
          const isPublicHoliday = publicHolidayDates.has(day.date_ad);
          const hasFestival = day.festivals.length > 0 && !isPublicHoliday;
          const adDay = new Date(day.date_ad).getDate();

          const primaryNum = mode === "ad" ? adDay : day.day;
          const weekdayShort = pick(day.weekday_ne, day.weekday_en ?? day.weekday_ne)?.split(" ")[0] ?? "";
          const secondaryLabel =
            mode === "ad" ? `${weekdayShort} ${digits(day.day)}`.trim() : fmtAdShort(day.date_ad);

          const mainFest = day.festivals[0];
          const tithi = pick(day.tithi_ne ?? day.tithi, day.tithi ?? day.tithi_ne);

          return (
            <button
              key={day.date_ad}
              type="button"
              className={cn(
                "relative flex min-h-[104px] min-w-0 flex-col justify-between gap-1.5 border-none bg-card p-2.5 text-left text-foreground transition-colors",
                "max-md:min-h-12 max-md:items-center max-md:justify-start max-md:gap-0 max-md:p-1 max-md:text-center",
                isToday && "bg-surface-today hover:bg-surface-today-hover",
                !isToday && !isPublicHoliday && !hasFestival && "hover:bg-surface-hover",
                isSelected && "shadow-[inset_0_0_0_2px_var(--ring)]",
                isPublicHoliday && "bg-surface-tint-danger",
                hasFestival && "bg-surface-tint-teal",
              )}
              onClick={() => onSelectDay?.(day)}
            >
              {isToday && (
                <span className="absolute top-1 right-1 z-[1] rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-bold leading-none tracking-wide text-secondary-foreground max-md:top-px max-md:right-px max-md:px-0.5 max-md:py-px max-md:text-[6px]">
                  {t("calendar.today_badge")}
                </span>
              )}

              <span className="flex min-w-0 w-full flex-1 flex-col gap-1 max-md:items-center max-md:gap-px">
                <span className="flex w-full items-baseline gap-2 max-md:flex-col max-md:items-center max-md:gap-0">
                  <span
                    className={cn(
                      "font-num text-2xl font-semibold leading-none tracking-tight max-md:text-base max-md:leading-tight",
                      (isWeekend || isPublicHoliday) && "text-danger",
                    )}
                  >
                    {digits(primaryNum)}
                  </span>
                  <span className="font-num ml-auto text-[10.5px] font-medium whitespace-nowrap text-muted-foreground max-md:hidden">
                    {secondaryLabel}
                  </span>
                  <span className="font-num hidden text-[8px] leading-tight text-muted-foreground max-md:block">
                    {fmtAdCompact(day.date_ad)}
                  </span>
                </span>

                {tithi ? (
                  <span className="inline-flex max-w-full items-center gap-1 overflow-hidden text-[11px] font-medium text-ellipsis whitespace-nowrap text-muted-foreground max-md:hidden">
                    {tithi}
                  </span>
                ) : isEnriching ? (
                  <span
                    className="inline-block h-2 w-10 animate-pulse rounded-full bg-muted-foreground/25 max-md:hidden"
                    aria-hidden
                  />
                ) : null}

                {mainFest && (
                  <span
                    className={cn(
                      "max-w-full truncate rounded-full px-2 py-1 text-[10.5px] font-semibold leading-none max-md:hidden",
                      isPublicHoliday
                        ? "bg-chip-public text-danger"
                        : "bg-chip-festival text-accent dark:text-[#7fd6db]",
                    )}
                  >
                    {mainFest}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
