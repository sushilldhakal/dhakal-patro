import {
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  bsToAD,
  getBSMonthLength,
  getSupportedAdBounds,
} from "@/lib/bs-calendar";

/** Bikram Sambat years available in month/year/day pickers. */
export const PATRO_BS_YEAR_OPTIONS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i,
);

const AD_BOUNDS = getSupportedAdBounds();

/** Gregorian years that overlap the supported BS range. */
export const PATRO_AD_YEAR_OPTIONS = Array.from(
  { length: AD_BOUNDS.maxYear - AD_BOUNDS.minYear + 1 },
  (_, i) => AD_BOUNDS.minYear + i,
);

export function buildBsDayOptions(
  year: number,
  month: number,
  digitFn: (n: number) => string,
): { value: number; label: string }[] {
  const len = getBSMonthLength(year, month);
  return Array.from({ length: len }, (_, i) => ({
    value: i + 1,
    label: digitFn(i + 1),
  }));
}

export function pickBsDate(
  onDateChange: (d: Date) => void,
  year: number,
  month: number,
  day: number,
): void {
  const safeDay = Math.min(day, getBSMonthLength(year, month));
  onDateChange(bsToAD(year, month, safeDay));
}

export function isAtMinBsDay(year: number, month: number, day: number): boolean {
  return year === BS_SUPPORTED_START_YEAR && month === 1 && day === 1;
}

export function isAtMaxBsDay(year: number, month: number, day: number): boolean {
  return (
    year === BS_SUPPORTED_END_YEAR &&
    month === 12 &&
    day === getBSMonthLength(year, month)
  );
}

export function getAdMonthLength(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function buildAdDayOptions(
  year: number,
  month: number,
  digitFn: (n: number) => string,
): { value: number; label: string }[] {
  const len = getAdMonthLength(year, month);
  return Array.from({ length: len }, (_, i) => ({
    value: i + 1,
    label: digitFn(i + 1),
  }));
}

export function pickAdDate(
  onDateChange: (d: Date) => void,
  year: number,
  month: number,
  day: number,
): void {
  const safeDay = Math.min(day, getAdMonthLength(year, month));
  onDateChange(new Date(year, month - 1, safeDay));
}

export function isAtMinAdDay(year: number, month: number, day: number): boolean {
  return (
    year === AD_BOUNDS.minYear &&
    month === AD_BOUNDS.minMonth &&
    day === 1
  );
}

export function isAtMaxAdDay(year: number, month: number, day: number): boolean {
  return (
    year === AD_BOUNDS.maxYear &&
    month === AD_BOUNDS.maxMonth &&
    day === getAdMonthLength(year, month)
  );
}

export function clampBsYear(
  year: number,
  options: number[] = PATRO_BS_YEAR_OPTIONS,
): number {
  const min = options[0] ?? BS_SUPPORTED_START_YEAR;
  const max = options[options.length - 1] ?? BS_SUPPORTED_END_YEAR;
  return Math.min(Math.max(year, min), max);
}

export function clampAdYear(
  year: number,
  options: number[] = PATRO_AD_YEAR_OPTIONS,
): number {
  const min = options[0] ?? AD_BOUNDS.minYear;
  const max = options[options.length - 1] ?? AD_BOUNDS.maxYear;
  return Math.min(Math.max(year, min), max);
}
