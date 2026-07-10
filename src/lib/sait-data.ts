/** Auspicious dates (साइत) by BS year, ceremony type, and month. */
import {
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  getCurrentBs,
} from "@/lib/bs-calendar";

export type SaitCategoryId =
  | "vivah"
  | "bratabandha"
  | "griha-aarambha"
  | "griha-pravesh"
  | "byaparik-pratisthan"
  | "rudri-jurne"
  | "agni-jurne"
  | "annaprasan";

export type SaitMonthDays = Partial<Record<number, number[]>>;

/** All BS years supported by the calendar (same range as month/year pickers). */
export const SAIT_YEARS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i,
);

export function clampSaitYear(year?: number): number {
  if (
    year != null &&
    year >= BS_SUPPORTED_START_YEAR &&
    year <= BS_SUPPORTED_END_YEAR
  ) {
    return year;
  }
  const { year: current } = getCurrentBs();
  if (current >= BS_SUPPORTED_START_YEAR && current <= BS_SUPPORTED_END_YEAR) {
    return current;
  }
  return BS_SUPPORTED_START_YEAR;
}

export const SAIT_CATEGORIES: { id: SaitCategoryId; label: string }[] = [
  { id: "vivah", label: "विवाह" },
  { id: "bratabandha", label: "ब्रतबन्ध" },
  { id: "griha-aarambha", label: "गृह आराम्भ" },
  { id: "griha-pravesh", label: "गृह प्रवेश" },
  { id: "byaparik-pratisthan", label: "व्यापारिक प्रतिष्ठान" },
  { id: "rudri-jurne", label: "रुद्री जुर्ने" },
  { id: "agni-jurne", label: "अग्नि जुर्ने" },
  { id: "annaprasan", label: "अन्नप्रासन" },
];

/** month (1–12) → auspicious days */
export type SaitCategoryData = SaitMonthDays;

export type SaitYearData = Partial<Record<SaitCategoryId, SaitCategoryData>>;

export const SAIT_DATA: Partial<Record<number, SaitYearData>> = {
  2083: {
    vivah: {
      1: [7, 8, 22, 23, 24, 25, 30, 31],
      3: [9, 13, 14, 15, 17, 18, 23],
      8: [9, 10, 16, 17, 19, 24, 25, 26],
      10: [4, 12, 15, 19, 20, 27],
      11: [3, 4, 11, 12, 15, 16, 17, 18, 20, 25, 26, 30],
    },
  },
};

export function getSaitMonthEntries(
  year: number,
  category: SaitCategoryId,
): { month: number; days: number[] }[] {
  const byMonth = SAIT_DATA[year]?.[category];
  if (!byMonth) return [];
  return Object.entries(byMonth)
    .map(([month, days]) => ({ month: Number(month), days: days ?? [] }))
    .filter((entry) => entry.days.length > 0)
    .sort((a, b) => a.month - b.month);
}

/** BS years that have at least one sait entry for a ceremony type (offline bundle). */
export function getLocalSaitYearsForCategory(category: SaitCategoryId): number[] {
  return Object.keys(SAIT_DATA)
    .map(Number)
    .filter((y) => getSaitMonthEntries(y, category).length > 0)
    .sort((a, b) => a - b);
}

/** Pick the closest year that actually has sait rows for this category. */
export function pickNearestSaitYear(preferred: number, available: number[]): number {
  if (!available.length) return preferred;
  if (available.includes(preferred)) return preferred;
  return available.reduce((best, y) =>
    Math.abs(y - preferred) < Math.abs(best - preferred) ? y : best,
  );
}

/** Merge API years with offline fallback when API is unavailable. */
export function mergeSaitYears(apiYears: number[] | undefined, category: SaitCategoryId): number[] {
  if (apiYears?.length) return [...apiYears].sort((a, b) => a - b);
  return getLocalSaitYearsForCategory(category);
}
