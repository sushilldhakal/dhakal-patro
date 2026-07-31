import {
  bsToAdOrNull,
  getBSMonthLength,
  getSupportedAdBounds,
} from "@/lib/bs-calendar";
import { fetchPanchangaDay, type LocationParams } from "@/lib/api";
import { getLanguageForEra } from "@/lib/era";
import { patroDayFetchFromApiBsParts } from "@/lib/patro-day-url";
import { DEFAULT_PANCHANGA_LOCATION } from "@/components/panchanga/use-panchanga-location";
import { parseCivilIsoToDate } from "@/lib/patro-day";
import type { Era } from "@/lib/era";
import {
  BBS_URL_YEAR_MAX,
  PATRO_EPHEMERIS_SIGNED_MAX,
  PATRO_SIGNED_YEAR_MAX,
  PATRO_SIGNED_YEAR_MIN,
} from "@/lib/patro-year-axis";

const AD_BOUNDS = getSupportedAdBounds();

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
  onDateChange: (
    d: Date,
    bsParts?: { year: number; month: number; day: number },
  ) => void,
  year: number,
  month: number,
  day: number,
  location?: LocationParams,
): void {
  const len = getBSMonthLength(year, month);
  const safeDay = Math.min(day, len);
  const parts = { year, month, day: safeDay };
  const ad = bsToAdOrNull(year, month, safeDay);
  if (ad) {
    onDateChange(ad, parts);
    return;
  }
  const params = location ?? DEFAULT_PANCHANGA_LOCATION.params;
  void fetchPanchangaDay(
    patroDayFetchFromApiBsParts(parts, {
      era: "bs",
      language: getLanguageForEra("bs"),
    }),
    params,
  ).then((p) => {
    if (p.date_ad) onDateChange(parseCivilIsoToDate(p.date_ad), parts);
  });
}

export function isAtMinBsDay(year: number, month: number, day: number): boolean {
  return year === PATRO_SIGNED_YEAR_MIN && month === 1 && day === 1;
}

export function isAtMaxBsDay(year: number, month: number, day: number): boolean {
  return (
    year === PATRO_SIGNED_YEAR_MAX &&
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

/** Gregorian years that overlap the supported BS range (picker options). */
export function buildPatroAdYearOptions(): number[] {
  return Array.from(
    { length: AD_BOUNDS.maxYear - AD_BOUNDS.minYear + 1 },
    (_, i) => AD_BOUNDS.minYear + i,
  );
}

/** Positive years offered in era-aware browse pickers (ephemeris window for Vikram eras). */
export function buildPatroBrowseYearOptions(era: Era): number[] {
  if (era === "ad" || era === "bc") return buildPatroAdYearOptions();
  if (era === "bbs") {
    return Array.from({ length: BBS_URL_YEAR_MAX }, (_, i) => i + 1);
  }
  return Array.from({ length: PATRO_EPHEMERIS_SIGNED_MAX }, (_, i) => i + 1);
}
