import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { fetchSait, fetchSaitYears, saitKeys } from "@/lib/api";
import {
  clampSaitYear,
  getSaitMonthEntries,
  mergeSaitYears,
  pickNearestSaitYear,
  SAIT_CATEGORIES,
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

function resolveEntries(
  apiMonths: { month: number; days: number[] }[] | undefined,
  year: number,
  category: SaitCategoryId,
): { month: number; days: number[] }[] {
  if (apiMonths?.length) {
    return apiMonths.map((entry) => ({ month: entry.month, days: entry.days }));
  }
  return getSaitMonthEntries(year, category);
}

export function SaitAsidePanel({ defaultYear, highlightMonth, highlightDay }: Props) {
  const { t } = useTranslation();
  const preferredYear = normalizeYear(defaultYear);
  const [year, setYear] = useState(preferredYear);
  const [category, setCategory] = useState<SaitCategoryId>("vivah");

  const yearsQ = useQuery({
    queryKey: saitKeys.years(),
    queryFn: fetchSaitYears,
    staleTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });

  const yearsForCategory = useMemo(
    () => mergeSaitYears(yearsQ.data?.years, category),
    [yearsQ.data?.years, category],
  );

  useEffect(() => {
    if (!yearsForCategory.length) return;
    setYear((current) => {
      if (yearsForCategory.includes(current)) return current;
      return pickNearestSaitYear(preferredYear, yearsForCategory);
    });
  }, [category, preferredYear, yearsForCategory]);

  const saitQ = useQuery({
    queryKey: saitKeys.entries(year, category),
    queryFn: () => fetchSait(year, category),
    staleTime: 1000 * 60 * 60,
    retry: 1,
    enabled: yearsForCategory.length === 0 || yearsForCategory.includes(year),
  });

  const entries = useMemo(
    () => resolveEntries(saitQ.data?.months, year, category),
    [saitQ.data?.months, year, category],
  );

  const yearOptions = yearsForCategory.length ? yearsForCategory : [year];

  return (
    <div className="pn-aside-sait-panel">
      <div className="pn-aside-sait-year-row">
        <label className="pn-aside-sait-year-label" htmlFor="sait-bs-year">
          {t("sait.year")}
        </label>
        <select
          id="sait-bs-year"
          className="pn-aside-sait-select"
          value={year}
          aria-label={t("sait.year")}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {toNepaliDigits(y)}
            </option>
          ))}
        </select>
      </div>

      <div className="pn-aside-sait-cats" role="tablist" aria-label={t("sait.categories_aria")}>
        {SAIT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            className={`pn-aside-sait-cat${cat.id === category ? " active" : ""}`}
            aria-selected={cat.id === category}
            onClick={() => setCategory(cat.id)}
          >
            {t(`sait.categories.${cat.id}`)}
          </button>
        ))}
      </div>

      {saitQ.isLoading && !entries.length ? (
        <div className="pn-aside-tab-skel" />
      ) : !yearsForCategory.length ? (
        <p className="pn-aside-tab-empty">{t("sait.no_data")}</p>
      ) : entries.length === 0 ? (
        <p className="pn-aside-tab-empty">{t("sait.no_entries")}</p>
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
