import {
  bsToAdOrNull,
  getBSMonthLength,
  getSupportedAdBounds,
} from "@/lib/bs-calendar";
import { fetchPanchangaDay, type LocationParams } from "@/lib/api";
import { getLanguageForEra } from "@/lib/era";
import { patroDayFetchFromApiBsParts } from "@/lib/patro-day-url";
import { DEFAULT_PANCHANGA_LOCATION } from "@/components/panchanga/use-panchanga-location";
import {
  civilAnchorFromPanchangaDay,
  parseCivilIsoToDate,
} from "@/lib/patro-day";
import type { Era } from "@/lib/era";
import {
  BBS_URL_YEAR_MAX,
  bbsFromSigned,
  isBbsSigned,
  PATRO_AD_BROWSE_YEAR_MAX,
  PATRO_AD_BROWSE_YEAR_MIN,
  PATRO_BC_BROWSE_YEAR_MAX,
  PATRO_BC_BROWSE_YEAR_MIN,
  PATRO_EPHEMERIS_SIGNED_MAX,
  PATRO_SIGNED_YEAR_MAX,
  PATRO_SIGNED_YEAR_MIN,
  signedPatroYearFromBrowse,
  stepPatroSignedYear,
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

/** Step one Vikram year on month rollover (BS +1 forward; BBS uses the signed axis). */
function stepSignedAcrossVikramYear(signed: number, monthDelta: number): number {
  if (monthDelta > 0) {
    return isBbsSigned(signed)
      ? stepPatroSignedYear(signed, -1)
      : stepPatroSignedYear(signed, 1);
  }
  return isBbsSigned(signed)
    ? stepPatroSignedYear(signed, 1)
    : stepPatroSignedYear(signed, -1);
}

export function stepBrowseVikramMonth(
  browseEra: Era,
  browseYear: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  let signed = signedPatroYearFromBrowse(browseEra, browseYear);
  let m = month + delta;
  while (m < 1) {
    m += 12;
    signed = stepSignedAcrossVikramYear(signed, -1);
  }
  while (m > 12) {
    m -= 12;
    signed = stepSignedAcrossVikramYear(signed, 1);
  }
  const year = browseEra === "bbs" ? bbsFromSigned(signed) : signed;
  return { year, month: m };
}

export function stepBrowseVikramDay(
  browseEra: Era,
  browseYear: number,
  month: number,
  day: number,
  delta: number,
): { year: number; month: number; day: number } {
  let signed = signedPatroYearFromBrowse(browseEra, browseYear);
  let m = month;
  let d = day + delta;
  while (d < 1) {
    m -= 1;
    if (m < 1) {
      m = 12;
      signed = stepSignedAcrossVikramYear(signed, -1);
    }
    d += getBSMonthLength(signed, m);
  }
  while (d > getBSMonthLength(signed, m)) {
    d -= getBSMonthLength(signed, m);
    m += 1;
    if (m > 12) {
      m = 1;
      signed = stepSignedAcrossVikramYear(signed, 1);
    }
  }
  const year = browseEra === "bbs" ? bbsFromSigned(signed) : signed;
  return { year, month: m, day: d };
}

export function pickBrowseVikramDate(
  onDateChange: (
    d: Date,
    bsParts?: { year: number; month: number; day: number },
  ) => void,
  browseEra: Era,
  browseYear: number,
  month: number,
  day: number,
  location?: LocationParams,
): void {
  const signed = signedPatroYearFromBrowse(browseEra, browseYear);
  const len = getBSMonthLength(signed, month);
  const safeDay = Math.min(day, len);
  const parts = { year: browseYear, month, day: safeDay };
  const ad = bsToAdOrNull(signed, month, safeDay);
  if (ad) {
    onDateChange(ad, parts);
    return;
  }
  const params = location ?? DEFAULT_PANCHANGA_LOCATION.params;
  const displayEra: Era = browseEra === "bbs" ? "bbs" : "bs";
  void fetchPanchangaDay(
    patroDayFetchFromApiBsParts(parts, {
      era: displayEra,
      language: getLanguageForEra(displayEra),
    }),
    params,
  ).then((p) => {
    const anchor = civilAnchorFromPanchangaDay(p);
    if (anchor) onDateChange(parseCivilIsoToDate(anchor), parts);
  });
}

/** @deprecated Prefer {@link pickBrowseVikramDate} with the URL browse era (BS or BBS). */
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
  pickBrowseVikramDate(onDateChange, "bs", year, month, day, location);
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

let cachedAdBrowseYears: number[] | null = null;
let cachedBcBrowseYears: number[] | null = null;
let cachedBsBrowseYears: number[] | null = null;
let cachedBbsBrowseYears: number[] | null = null;

/**
 * CE Gregorian years in the AD browse picker (aligned with BS ephemeris max).
 */
export function buildPatroAdYearOptions(): number[] {
  if (cachedAdBrowseYears) return cachedAdBrowseYears;
  cachedAdBrowseYears = Array.from(
    { length: PATRO_AD_BROWSE_YEAR_MAX - PATRO_AD_BROWSE_YEAR_MIN + 1 },
    (_, i) => PATRO_AD_BROWSE_YEAR_MIN + i,
  );
  return cachedAdBrowseYears;
}

/** BCE Gregorian years in the BC browse picker (aligned with BBS ephemeris depth). */
export function buildPatroBcYearOptions(): number[] {
  if (cachedBcBrowseYears) return cachedBcBrowseYears;
  cachedBcBrowseYears = Array.from(
    { length: PATRO_BC_BROWSE_YEAR_MAX - PATRO_BC_BROWSE_YEAR_MIN + 1 },
    (_, i) => PATRO_BC_BROWSE_YEAR_MIN + i,
  );
  return cachedBcBrowseYears;
}

/** Positive years offered in era-aware browse pickers (ephemeris window for Vikram eras). */
export function buildPatroBrowseYearOptions(era: Era): number[] {
  if (era === "ad") return buildPatroAdYearOptions();
  if (era === "bc") return buildPatroBcYearOptions();
  if (era === "bbs") {
    if (!cachedBbsBrowseYears) {
      cachedBbsBrowseYears = Array.from({ length: BBS_URL_YEAR_MAX }, (_, i) => i + 1);
    }
    return cachedBbsBrowseYears;
  }
  if (!cachedBsBrowseYears) {
    cachedBsBrowseYears = Array.from(
      { length: PATRO_EPHEMERIS_SIGNED_MAX },
      (_, i) => i + 1,
    );
  }
  return cachedBsBrowseYears;
}
