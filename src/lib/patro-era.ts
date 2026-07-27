/**
 * Single source of truth for AD vs BS calendar era across patro browse surfaces.
 *
 * Resolution order: explicit URL `era` → year magnitude heuristic → UI language.
 * URL builders/validators live in `@/lib/url-state`; browse hooks in
 * `@/hooks/use-patro-url-browse`, `@/hooks/use-patro-month-browse`,
 * `@/hooks/use-patro-year-browse`.
 */
import i18n from "@/i18n";
import { normalizeLang } from "@/i18n/locale";
import { getStoredLanguage } from "@/lib/user-preferences";
import {
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  getCurrentBs,
  getSupportedAdBounds,
} from "@/lib/bs-calendar";
import { clampAdYear, clampBsYear } from "@/lib/patro-date-options";

/** Gregorian (AD) vs Bikram Sambat — one enum for every patro browse surface. */
export type CalendarEra = "bs" | "ad";

/** BS patro share links typically use 2070+; AD years in English stay below this. */
export const PATRO_BS_YEAR_URL_THRESHOLD = 2070;

/** Legacy URLs with year below this are treated as BS when era is omitted. */
export const PATRO_LEGACY_BS_YEAR_MAX = 1943;

/** UI language default: English → AD Jan–Dec, Nepali → BS Baisakh–Chaitra. */
export function readCalendarEra(): CalendarEra {
  const lang = normalizeLang(i18n.resolvedLanguage ?? i18n.language);
  if (lang === "en") return "ad";
  if (getStoredLanguage() === "en") return "ad";
  return "bs";
}

export function parseCalendarEra(raw: unknown): CalendarEra | undefined {
  return raw === "ad" || raw === "bs" ? raw : undefined;
}

export function yearLooksLikeBsInUrl(year: number): boolean {
  return year >= PATRO_BS_YEAR_URL_THRESHOLD || year < PATRO_LEGACY_BS_YEAR_MAX;
}

/**
 * Resolve browse era from URL + UI language.
 * 1. explicit `era` param
 * 2. year magnitude heuristic (2070+ / &lt;1943 → BS)
 * 3. {@link readCalendarEra}
 */
export function resolvePatroEra(search: {
  era?: CalendarEra;
  year?: number;
}): CalendarEra {
  const explicit = parseCalendarEra(search.era);
  if (explicit) return explicit;
  if (search.year != null && yearLooksLikeBsInUrl(search.year)) return "bs";
  return readCalendarEra();
}

const AD_BOUNDS = getSupportedAdBounds();

export function validatePatroBrowseYear(
  rawYear: number | undefined,
  era: CalendarEra,
): number | undefined {
  if (rawYear == null) return undefined;
  if (era === "ad") {
    return rawYear >= AD_BOUNDS.minYear && rawYear <= AD_BOUNDS.maxYear
      ? rawYear
      : undefined;
  }
  if (rawYear >= BS_SUPPORTED_START_YEAR && rawYear <= BS_SUPPORTED_END_YEAR) {
    return rawYear;
  }
  if (rawYear >= AD_BOUNDS.minYear && rawYear <= AD_BOUNDS.maxYear) {
    return rawYear;
  }
  return undefined;
}

export function validatePatroBrowseMonth(rawMonth: number | undefined): number | undefined {
  if (rawMonth == null || rawMonth < 1 || rawMonth > 12) return undefined;
  return rawMonth;
}

export function defaultPatroBrowseYear(era: CalendarEra): number {
  if (era === "ad") return new Date().getFullYear();
  return getCurrentBs().year;
}

export function defaultPatroBrowseMonth(era: CalendarEra): number {
  if (era === "ad") return new Date().getMonth() + 1;
  return getCurrentBs().month;
}

/** Era-aware year + month keys shared by month-browse patro routes. */
export interface PatroMonthBrowseSearch {
  era?: CalendarEra;
  year?: number;
  month?: number;
}

export type PatroMonthBrowseInit = {
  era: CalendarEra;
  initial:
    | { adYear: number; adMonth: number }
    | { year: number; month: number };
};

export function patroMonthBrowseInit(search: PatroMonthBrowseSearch): PatroMonthBrowseInit {
  const era = resolvePatroEra(search);
  const year = search.year ?? defaultPatroBrowseYear(era);
  const month = search.month ?? defaultPatroBrowseMonth(era);
  if (era === "ad") {
    return { era, initial: { adYear: year, adMonth: month } };
  }
  return { era, initial: { year, month } };
}

export type PatroMonthBrowseState = {
  era: CalendarEra;
  adYear: number;
  adMonth: number;
  bsYear: number;
  bsMonth: number;
  setFromAd: (year: number, month: number) => void;
  setFromBs: (year: number, month: number) => void;
};

export function applyPatroMonthSearchToBrowse(
  search: PatroMonthBrowseSearch,
  browse: PatroMonthBrowseState,
): void {
  if (search.year == null && search.month == null && search.era == null) return;
  const urlEra = resolvePatroEra(search);
  // UI language drives browse era; while the URL still carries the old era
  // (e.g. after a language toggle), let the mirror effect rewrite it first.
  if (urlEra !== browse.era) return;
  const y = search.year ?? (urlEra === "ad" ? browse.adYear : browse.bsYear);
  const m = search.month ?? (urlEra === "ad" ? browse.adMonth : browse.bsMonth);
  if (urlEra === "ad") {
    if (y !== browse.adYear || m !== browse.adMonth) browse.setFromAd(y, m);
  } else if (y !== browse.bsYear || m !== browse.bsMonth) {
    browse.setFromBs(y, m);
  }
}

/** Era-aware year key shared by year-browse patro routes. */
export interface PatroYearBrowseSearch {
  era?: CalendarEra;
  year?: number;
}

export type PatroYearBrowseState = {
  era: CalendarEra;
  browseYear: number;
  setBrowseYear: (year: number) => void;
  setFromBs: (year: number) => void;
};

/** Apply URL year (+ optional era) to year browse state. */
export function applyPatroYearSearchToBrowse(
  search: PatroYearBrowseSearch,
  browse: PatroYearBrowseState,
): void {
  if (search.year == null && search.era == null) return;
  const urlEra = resolvePatroEra(search);
  if (urlEra !== browse.era) return;
  if (search.year == null) return;

  if (urlEra === "bs") {
    browse.setFromBs(clampBsYear(search.year));
    return;
  }

  const likelyBsShareLink =
    search.year >= BS_SUPPORTED_START_YEAR &&
    search.year <= BS_SUPPORTED_END_YEAR &&
    search.year > new Date().getFullYear() + 20 &&
    search.era == null;

  if (likelyBsShareLink) {
    browse.setFromBs(clampBsYear(search.year));
  } else {
    browse.setBrowseYear(clampAdYear(search.year));
  }
}

export function patroYearBrowseInit(search: PatroYearBrowseSearch): {
  era: CalendarEra;
  initialBsYear?: number;
  initialAdYear?: number;
} {
  const era = resolvePatroEra(search);
  if (search.year == null) return { era };

  if (era === "bs") {
    return { era, initialBsYear: clampBsYear(search.year) };
  }

  const likelyBsShareLink =
    search.year >= BS_SUPPORTED_START_YEAR &&
    search.year <= BS_SUPPORTED_END_YEAR &&
    search.year > new Date().getFullYear() + 20 &&
    search.era == null;

  if (likelyBsShareLink) {
    return { era: "bs", initialBsYear: clampBsYear(search.year) };
  }
  return { era: "ad", initialAdYear: clampAdYear(search.year) };
}
