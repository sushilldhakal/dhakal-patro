import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSait, saitKeys } from "@/lib/api";
import {
  clampSaitYear,
  getSaitMonthEntries,
  SAIT_CATEGORIES,
  SAIT_YEARS,
  type SaitCategoryId,
} from "@/lib/sait-data";
import { BS_MONTHS_NE } from "@/lib/bs-calendar";
import { toNepaliDigits } from "@/lib/panchanga-format";

type Props = {
  defaultYear?: number;
  highlightMonth?: number;
  highlightDay?: number;
};

function normalizeYear(year?: number): number {
  return clampSaitYear(year);
}

export function SaitAsidePanel({ defaultYear, highlightMonth, highlightDay }: Props) {
  const [year, setYear] = useState(() => normalizeYear(defaultYear));
  const [category, setCategory] = useState<SaitCategoryId>("vivah");

  const saitQ = useQuery({
    queryKey: saitKeys.entries(year, category),
    queryFn: () => fetchSait(year, category),
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  const entries = useMemo(() => {
    if (saitQ.data?.months?.length) {
      return saitQ.data.months.map((entry) => ({
        month: entry.month,
        days: entry.days,
      }));
    }
    return getSaitMonthEntries(year, category);
  }, [saitQ.data, year, category]);

  return (
    <div className="pn-aside-sait-panel">
      <div className="pn-aside-sait-year-row">
        <label className="pn-aside-sait-year-label" htmlFor="sait-bs-year">
          वर्ष
        </label>
        <select
          id="sait-bs-year"
          className="pn-aside-sait-select"
          value={year}
          aria-label="वर्ष"
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {SAIT_YEARS.map((y) => (
            <option key={y} value={y}>
              {toNepaliDigits(y)}
            </option>
          ))}
        </select>
      </div>

      <div className="pn-aside-sait-cats" role="tablist" aria-label="साइत प्रकार">
        {SAIT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            className={`pn-aside-sait-cat${cat.id === category ? " active" : ""}`}
            aria-selected={cat.id === category}
            onClick={() => setCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {saitQ.isLoading && !entries.length ? (
        <div className="pn-aside-tab-skel" />
      ) : entries.length === 0 ? (
        <p className="pn-aside-tab-empty">यस वर्ष र प्रकारका लागि साइत उपलब्ध छैन।</p>
      ) : (
        <ul className="pn-aside-sait-months">
          {entries.map(({ month, days }) => (
            <li key={month} className="pn-aside-sait-month-row">
              <span className="pn-aside-sait-month-name">{BS_MONTHS_NE[month - 1]}:</span>
              <span className="pn-aside-sait-days">
                {days.map((day, i) => {
                  const isHighlight =
                    highlightMonth === month && highlightDay === day;
                  return (
                    <span key={day}>
                      {i > 0 ? ", " : ""}
                      <span className={isHighlight ? "pn-aside-sait-day highlight" : "pn-aside-sait-day"}>
                        {toNepaliDigits(day)}
                      </span>
                    </span>
                  );
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
