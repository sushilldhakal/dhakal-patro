import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { fetchSait, fetchSaitYears, saitKeys } from "@/lib/api";
import {
  clampSaitYear,
  SAIT_CATEGORIES,
  SAIT_YEARS,
  type SaitCategoryId,
} from "@/lib/sait-data";
import { BS_MONTHS_NE } from "@/lib/bs-calendar";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { patroEmpty, patroSaitCat } from "@/lib/patro-classes";
import { cn } from "@/lib/utils";

type Props = {
  defaultYear?: number;
  highlightMonth?: number;
  highlightDay?: number;
};

function normalizeYear(year?: number): number {
  return clampSaitYear(year);
}

export function SaitAsidePanel({ defaultYear, highlightMonth, highlightDay }: Props) {
  const { t } = useTranslation();
  const preferredYear = normalizeYear(defaultYear);
  const [year, setYear] = useState(preferredYear);
  const [category, setCategory] = useState<SaitCategoryId>("vivah");

  // Available years come from the API (computed range). The pure BS-year list is
  // only a picker fallback while that request is in flight — never a source of
  // dates (every date below is fetched from the API for the selected year).
  const yearsQ = useQuery({
    queryKey: saitKeys.years(),
    queryFn: fetchSaitYears,
    staleTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });

  const yearOptions = useMemo(
    () => (yearsQ.data?.years?.length ? yearsQ.data.years : SAIT_YEARS),
    [yearsQ.data?.years],
  );

  const saitQ = useQuery({
    queryKey: saitKeys.entries(year, category),
    queryFn: () => fetchSait(year, category),
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  const entries = useMemo(
    () =>
      (saitQ.data?.months ?? []).map((entry) => ({ month: entry.month, days: entry.days })),
    [saitQ.data?.months],
  );

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <label className="shrink-0 text-xs font-semibold" htmlFor="sait-bs-year">
          {t("sait.year")}
        </label>
        <select
          id="sait-bs-year"
          className="h-8 min-w-0 flex-1 cursor-pointer rounded-md border border-border bg-card px-2.5 text-sm font-bold text-foreground font-num hover:border-secondary/35 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-secondary/45"
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

      <div className="flex flex-wrap gap-1" role="tablist" aria-label={t("sait.categories_aria")}>
        {SAIT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            className={patroSaitCat(cat.id === category)}
            aria-selected={cat.id === category}
            onClick={() => setCategory(cat.id)}
          >
            {t(`sait.categories.${cat.id}`)}
          </button>
        ))}
      </div>

      {saitQ.isLoading && !entries.length ? (
        <div className="h-40 animate-pulse rounded-md bg-muted" />
      ) : saitQ.isError ? (
        <p className={patroEmpty}>{t("sait.no_data")}</p>
      ) : entries.length === 0 ? (
        <p className={patroEmpty}>{t("sait.no_entries")}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {entries.map(({ month, days }) => (
            <li
              key={month}
              className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 rounded-md bg-surface-inset px-2.5 py-2 text-sm leading-snug"
            >
              <span className="shrink-0 text-sm font-bold text-foreground">{BS_MONTHS_NE[month - 1]}:</span>
              <span className="font-num text-sm font-semibold text-foreground">
                {days.map((day, i) => {
                  const isHighlight = highlightMonth === month && highlightDay === day;
                  return (
                    <span key={day}>
                      {i > 0 ? ", " : ""}
                      <span
                        className={cn(
                          isHighlight && "font-extrabold text-accent underline underline-offset-2",
                        )}
                      >
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
