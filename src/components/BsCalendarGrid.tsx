import type { CalendarDay } from "@/lib/api";

const WEEKDAYS_NE = ["आइतवार", "सोमवार", "मंगलवार", "बुधवार", "बिहीवार", "शुक्रवार", "शनिवार"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TODAY_AD = new Date().toISOString().split("T")[0];

function fmtAdShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en", { month: "short", day: "numeric" });
}

interface Props {
  days: CalendarDay[];
  publicHolidayDates: Set<string>;
  selectedAdDate?: string;
  onSelectDay?: (day: CalendarDay) => void;
  mode?: "bs" | "ad";
  isEnriching?: boolean;
}

export function BsCalendarGrid({
  days,
  publicHolidayDates,
  selectedAdDate,
  onSelectDay,
  mode = "bs",
  isEnriching = false,
}: Props) {
  const firstDay = days[0];
  const startOffset = firstDay ? new Date(firstDay.date_ad).getDay() : 0;

  const cells: (CalendarDay | null)[] = [
    ...Array<null>(startOffset).fill(null),
    ...days,
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="pn-calcard">
      <div className="pn-weekrow">
        {WEEKDAYS_NE.map((ne, i) => (
          <div key={ne} className={`pn-wk${i === 0 || i === 6 ? " weekend" : ""}`}>
            <span className="pn-wk-ne">{ne}</span>
            <span className="pn-wk-en">{WEEKDAYS_EN[i]}</span>
          </div>
        ))}
      </div>

      <div className="pn-grid">
        {cells.map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} className="pn-cell empty" aria-hidden />;
          }

          const col = i % 7;
          const isToday = day.date_ad === TODAY_AD;
          const isSelected = day.date_ad === selectedAdDate && !isToday;
          const isWeekend = col === 0 || col === 6;
          const isPublicHoliday = publicHolidayDates.has(day.date_ad);
          const hasFestival = day.festivals.length > 0 && !isPublicHoliday;
          const adDay = new Date(day.date_ad).getDate();

          const primaryNum = mode === "ad" ? adDay : day.day;
          const secondaryLabel =
            mode === "ad"
              ? `${day.weekday_ne?.split(" ")[0] ?? ""} ${day.day}`.trim()
              : fmtAdShort(day.date_ad);

          const tintClass = isPublicHoliday ? " tint-red" : hasFestival ? " tint-teal" : "";
          const offClass = isWeekend || isPublicHoliday ? " off" : "";
          const cellClass = [
            "pn-cell",
            isToday ? "today" : "",
            isSelected ? "sel" : "",
            offClass,
            tintClass,
          ]
            .filter(Boolean)
            .join(" ");

          const mainFest = day.festivals[0];

          return (
            <button
              key={day.date_ad}
              type="button"
              className={cellClass}
              onClick={() => onSelectDay?.(day)}
            >
              <span className="pn-cell-top">
                <span className="pn-cell-num">{primaryNum}</span>
                {isToday && <span className="pn-today-badge">आज</span>}
                <span className="pn-cell-ad">{secondaryLabel}</span>
              </span>

              <span className="pn-cell-bottom">
                {day.tithi_ne || day.tithi ? (
                  <span className="pn-cell-tithi">{day.tithi_ne ?? day.tithi}</span>
                ) : isEnriching ? (
                  <span className="pn-tithi-skel" aria-hidden />
                ) : null}

                {mainFest && (
                  <span className={`pn-chip ${isPublicHoliday ? "public" : "festival"}`}>
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
