/**
 * Auspicious dates (साइत) by BS year, ceremony type, and month.
 *
 * This is an OFFLINE FALLBACK bundle only used when the API is unreachable. The
 * values are our own ephemeris-computed sait (the same engine the API serves) —
 * NOT the Nepal Panchanga Nirnayak Samiti listings. The live app always shows
 * computed sait via the API for every year and category.
 */
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

// Computed offline fallback (engine v3.14.0). Regenerate from the backend when
// the sait engine changes; the API is the source of truth in the live app.
export const SAIT_DATA: Partial<Record<number, SaitYearData>> = {
  2080: {
    vivah: { 1: [16, 17, 18, 19, 20, 23, 24, 27, 28], 2: [1, 2, 3, 7, 8, 15, 16, 17, 18, 19, 22, 23, 26, 29, 30, 31], 3: [7, 8, 10, 12, 13, 14, 15, 16], 8: [12, 13, 17, 18, 20, 21, 22, 23, 24, 29, 30], 9: [1, 5, 6], 10: [13, 18, 19, 21, 22, 23, 24, 25, 29], 11: [2, 6, 7, 13, 14, 15, 16, 17, 18, 19, 20, 22, 23, 24, 25, 29], 12: [3, 8, 9, 27, 30] },
  },
  2081: {
    vivah: { 1: [6, 7, 8, 9, 13, 14, 16], 7: [2, 5, 10, 11, 12, 13, 14], 8: [2, 3, 9, 10, 11, 12, 13, 14, 18, 20, 22, 25, 26, 27], 10: [5, 7, 8, 10, 11, 12, 13, 14, 17, 20, 21, 22, 24, 25], 11: [1, 2, 3, 5, 7, 10, 11, 12, 13, 17, 18, 19, 21, 22, 27, 28] },
    "griha-aarambha": { 1: [8, 9, 12, 13, 14, 18, 19, 20, 21, 22, 23, 24, 27, 28, 31], 2: [1], 4: [2, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17, 23, 24, 25, 27, 28, 30], 7: [4, 5, 12, 13, 14, 16, 18, 19, 22, 23, 25, 26, 27, 28], 8: [1, 2, 3, 5, 9, 10, 11, 12, 13, 14, 16, 20, 21, 22, 23, 25, 26, 30], 9: [2, 3, 7, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 21, 22, 26, 27], 10: [1, 2, 5, 6, 7, 8, 10, 11, 12, 16, 17, 18, 20, 21, 24, 25, 26, 28], 11: [2, 3, 4, 5, 7, 12, 13, 14, 16, 17, 18, 21, 22, 25, 26], 12: [1] },
  },
  2082: {
    vivah: { 1: [1, 2, 5, 7, 9, 10, 12, 16, 24, 25, 26, 27, 30, 31], 2: [1, 3, 4, 5, 6, 8, 9, 10, 11, 14, 18, 19, 21, 22, 23, 24, 25], 7: [20, 21, 28, 29, 30], 8: [1, 2, 6, 7, 8, 10], 11: [7, 8, 9, 10, 13, 14], 12: [20, 21, 23, 29] },
    bratabandha: { 1: [1, 5, 24, 25, 26], 2: [1, 4, 14, 15, 22, 23], 11: [6, 8, 10, 14, 15, 20, 21, 22, 24], 12: [13, 15, 20, 23] },
    "griha-aarambha": { 1: [1, 2, 3, 7, 9, 10, 11, 12, 13, 16, 17, 18, 20, 21, 24, 25, 26, 27, 30, 31], 4: [2, 5, 6, 7, 9, 10, 13, 14, 15, 16, 19, 20, 23, 25, 26, 27, 29], 7: [1, 2, 4, 5, 6, 7, 11, 12, 14, 15, 16, 17, 20, 21, 22, 24, 25, 28, 29, 30], 8: [1, 2, 4, 5, 8, 9, 10, 11, 13, 14, 15, 18, 19, 20, 22, 27, 28, 29], 9: [1, 2, 6, 7, 8, 9, 10, 12, 16, 17, 20, 21, 25, 26, 28, 29, 30], 10: [4, 5, 6, 7, 9, 10, 11, 14, 15, 21, 22, 23, 24, 25, 28], 11: [2, 3, 5, 6, 7, 8, 9, 13, 14, 16, 17, 20, 21, 22, 23, 24, 25, 26, 29, 30] },
  },
  2083: {
    vivah: { 1: [6, 7, 12, 13, 14, 15, 16, 20, 21, 23, 24, 25, 30, 31], 2: [1], 3: [5, 7, 9, 10, 11, 12, 13, 17, 18, 20, 22, 23, 25, 27, 28], 8: [9, 10, 14, 17, 18, 19, 20, 25, 26, 28], 9: [3, 4, 5], 10: [9, 10, 11, 13, 14, 17, 19, 20, 21, 24, 27, 28, 29], 11: [3, 4, 11, 12, 13, 15, 17, 18, 19, 20, 21, 22, 27, 30], 12: [1, 5, 6, 24, 25, 27, 28] },
    bratabandha: { 1: [7, 20, 21, 23, 24], 3: [5, 10, 11, 17, 18, 21], 10: [25, 28], 11: [5, 6, 10, 13, 27], 12: [3, 4, 5, 10, 25, 28] },
    "griha-aarambha": { 1: [2, 6, 7, 8, 14, 15, 16, 18, 20, 21, 25, 26, 28, 29, 30, 31], 4: [2, 3, 4, 7, 8, 13, 14, 15, 16, 17, 18, 22, 23, 24, 29, 30, 31], 5: [1], 7: [3, 4, 5, 6, 7, 11, 12, 13, 15, 18, 19, 20, 21, 24, 25, 28, 29, 30], 8: [4, 5, 8, 9, 10, 12, 16, 17, 18, 19, 20, 25, 26, 27, 28, 29], 9: [1, 3, 4, 7, 10, 11, 14, 15, 17, 18, 19, 20, 24, 25, 26, 27, 28, 30], 10: [1, 4, 5, 6, 8, 9, 11, 12, 13, 14, 17, 21, 23, 24, 25, 27, 28], 11: [3, 4, 6, 7, 10, 11, 12, 13, 15, 19, 20, 21, 22, 25, 26, 27, 30], 12: [1] },
    "griha-pravesh": { 1: [6, 7, 15], 9: [3, 4], 10: [27, 28], 11: [3, 4, 27, 30], 12: [1] },
    "byaparik-pratisthan": { 1: [2, 7, 10, 16, 18, 21, 25, 28, 30], 2: [1], 3: [3, 10, 11, 17, 18, 19, 22, 25], 5: [1, 3, 10, 11, 12, 15, 22, 29], 6: [1, 5, 8, 12, 15, 16, 19, 26], 7: [19, 20, 25], 8: [4, 10, 17, 18, 28], 9: [1, 8, 10, 15, 17, 27], 10: [1, 6, 8, 14, 21, 25, 28], 11: [6, 7, 10, 13, 20, 21, 26, 27], 12: [1, 3, 4, 8, 10, 11, 18, 19, 25] },
    "rudri-jurne": { 1: [1, 6, 8, 9, 12, 15, 16, 19, 23, 24, 27, 30, 31], 2: [4, 7, 8, 10, 14, 15, 18, 21, 22, 25, 28, 29], 3: [2, 5, 6, 9, 12, 13, 17, 20, 21, 24, 27, 32], 4: [2, 3, 7, 10, 11, 14, 17, 18, 21, 24, 25, 29], 5: [1, 2, 5, 8, 9, 10, 13, 16, 17, 19, 22, 23, 28, 31], 6: [1, 4, 7, 8, 11, 14, 15, 18, 20, 21, 26, 29, 30, 31], 7: [3, 6, 7, 10, 12, 13, 16, 19, 20, 25, 28, 29], 8: [2, 3, 6, 9, 12, 15, 18, 19, 25, 28, 29], 9: [3, 6, 7, 12, 13, 16, 19, 20, 25, 26, 29, 30], 10: [3, 6, 9, 12, 15, 19, 20, 25, 28, 29], 11: [3, 6, 7, 9, 12, 13, 16, 19, 20, 21, 26, 29, 30], 12: [3, 5, 6, 9, 12, 13, 16, 19, 20, 25, 28, 29] },
    "agni-jurne": { 1: [1, 3, 6, 9, 11, 13, 15, 17, 19, 20, 23, 25, 28, 30], 2: [1, 3, 5, 7, 9, 10, 13, 15, 18, 20, 22, 24, 26, 28, 30, 31], 3: [3, 5, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 29, 32], 4: [3, 5, 7, 9, 11, 13, 15, 18, 20, 22, 24, 27, 28, 30], 5: [1, 3, 5, 8, 9, 11, 13, 14, 16, 18, 20, 21, 23, 25, 28, 30], 6: [1, 3, 4, 6, 8, 10, 12, 14, 16, 19, 21, 23, 25, 27, 29], 7: [2, 4, 6, 8, 10, 11, 13, 15, 17, 19, 21, 22, 25, 27, 29], 8: [1, 3, 5, 6, 8, 10, 12, 13, 15, 17, 19, 21, 24, 26, 28], 9: [1, 3, 6, 8, 10, 13, 15, 17, 19, 21, 23, 24, 26, 28, 30], 10: [2, 3, 5, 7, 9, 10, 12, 14, 16, 17, 18, 20, 22, 24, 26, 28], 11: [1, 3, 5, 7, 10, 12, 14, 17, 19, 20, 22, 23, 26, 28, 30], 12: [2, 5, 7, 9, 11, 13, 14, 16, 18, 20, 22, 25, 27, 28, 30] },
    annaprasan: { 1: [2, 7, 10, 16, 18, 21, 25, 28, 31], 2: [1], 3: [3, 10, 17, 18, 19, 22, 25, 31], 4: [4, 8, 13, 15, 18, 20, 25], 5: [1, 3, 10, 11, 12, 15, 29], 6: [1, 5, 8, 12, 15, 16, 19, 26], 7: [4, 9, 11, 13, 20, 25, 30], 8: [10, 17, 28], 9: [1, 8, 10, 15, 17, 27, 30], 10: [1, 6, 8, 14, 21, 25, 28], 11: [6, 7, 10, 13, 21, 26, 27], 12: [1, 3, 8, 10, 11, 18, 25] },
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
