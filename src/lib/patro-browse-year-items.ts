import type { BsNativeSelectOption } from "@/components/BsNativeSelect";
import type { Era } from "@/lib/era";
import { formatBrowsePatroYearPicker } from "@/lib/patro-year-axis";
import {
  parsePatroYearSearchQuery,
  signedTargetsForYearSearch,
} from "@/lib/patro-year-search-query";

type YearItem = BsNativeSelectOption;

function labelYear(
  y: number,
  digits: (n: number | string) => string,
): YearItem {
  return { value: y, label: formatBrowsePatroYearPicker(y, digits) };
}

/** Window around `currentYear` in a sorted ascending browse-year list. */
export function sliceBrowseYearRange(
  years: readonly number[],
  currentYear: number,
  radius = 100,
): number[] {
  if (years.length === 0) return [];
  const idx = years.indexOf(currentYear);
  if (idx < 0) {
    return years.slice(Math.max(0, years.length - (radius * 2 + 1)));
  }
  const start = Math.max(0, idx - radius);
  const end = Math.min(years.length, idx + radius + 1);
  return years.slice(start, end);
}

/** Native `<select>` options — ~201 years around the browsed year (not the full ephemeris list). */
export function windowedBrowseYearSelectOptions(
  years: readonly number[],
  currentYear: number,
  era: Era,
  digits: (n: number | string) => string,
): YearItem[] {
  return lazyBrowseYearListItems(years, "", currentYear, era, digits);
}

/** Combobox rows — format labels only for the visible slice, not the full ephemeris list. */
export function lazyBrowseYearListItems(
  years: readonly number[],
  query: string,
  currentYear: number,
  era: Era,
  digits: (n: number | string) => string,
): YearItem[] {
  const q = query.trim();
  if (!q) {
    return sliceBrowseYearRange(years, currentYear).map((y) => labelYear(y, digits));
  }

  const { n, era: parsedEra } = parsePatroYearSearchQuery(q);
  if (n != null) {
    const set = new Set(years);
    const out: YearItem[] = [];
    for (const target of signedTargetsForYearSearch(n, parsedEra ?? era)) {
      if (target === 0) continue;
      if (set.has(target)) out.push(labelYear(target, digits));
    }
    if (out.length === 0 && set.has(n)) out.push(labelYear(n, digits));
    return out;
  }

  const needle = q.toLowerCase();
  const windowYears = sliceBrowseYearRange(years, currentYear, 500);
  return windowYears
    .filter((y) => {
      const row = labelYear(y, digits);
      return row.label.toLowerCase().includes(needle) || String(y).includes(q);
    })
    .map((y) => labelYear(y, digits))
    .slice(0, 20);
}

/** Bounds for a sorted ascending browse-year list (avoid spreading huge arrays). */
export function browseYearRangeBounds(years: readonly number[]): {
  min: number;
  max: number;
} {
  if (years.length === 0) return { min: 1, max: 1 };
  return { min: years[0]!, max: years[years.length - 1]! };
}
