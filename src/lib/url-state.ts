import type { LocationParams } from "@/lib/api";
import {
  buildPageSearch,
  getLanguageForEra,
  parseEraFromUrl,
  type Era,
  type EraSelection,
} from "@/lib/era";
import {
  readCalendarEra,
  validatePatroBrowseMonth,
  type CalendarEra,
  type PatroMonthBrowseSearch,
  type PatroYearBrowseSearch,
} from "@/lib/patro-era";
import type { PatroMonthBrowse } from "@/hooks/use-patro-month-browse";
import type { PatroYearBrowse } from "@/hooks/use-patro-year-browse";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { ELEMENT_BY_ID } from "@/lib/panchanga-elements";
import {
  buildPatroDayPageSearch,
  parsePatroDayUrl,
  type PatroDayFetchState,
} from "@/lib/patro-day-url";

/**
 * Shareable URL state.
 *
 * The app is a single-page Vite build; nginx falls back to `index.html` for
 * any unknown path, so the "server" already serves any route. What makes a view
 * shareable is encoding the user's selections (date, time, month, paksha,
 * location, …) into the URL search params and reading them back on load — the
 * same approach the `/panchanga/year` route already uses for `year`.
 *
 * These helpers parse/validate the raw search object (used by each route's
 * `validateSearch`) and convert a chosen location to/from search params.
 */

/** Location-describing search params, shared across patro pages. */
export interface LocationSearch {
  /** Numeric city id understood by the API. */
  city?: number;
  /** Latitude for a coordinate-based location. */
  lat?: number;
  /** Longitude for a coordinate-based location. */
  lon?: number;
  /** IANA timezone, e.g. "Asia/Kathmandu". */
  tz?: string;
  /** Human-readable place label, preserved so shared links show the same name. */
  place?: string;
}

export interface PanchangaSearch extends LocationSearch {
  /** Display era — labels only; does not parse date keys. */
  era?: CalendarEra;
  language?: "en" | "ne";
  /** Civil-day Julian identity (from API `jd_ut`). */
  jd?: number;
  /** Input calendar when year/month/day name a civil or Vikram day. */
  inputEra?: CalendarEra;
  year?: number;
  month?: number;
  day?: number;
  /** Day vs. month view. */
  view?: "day" | "month";
  /** Sunrise (udaya) vs. instant (समय-आधारित) reckoning. */
  mode?: "udaya" | "instant";
  /** Clock for instant mode, "HH:MM". */
  time?: string;
}

export interface DainikKrantiSearch extends LocationSearch, PatroMonthBrowseSearch {
  /** Paksha filter. */
  paksha?: "all" | "krishna" | "shukla";
}

export interface PanchangaYearSearch extends LocationSearch, PatroYearBrowseSearch {
  /** Range end (inclusive) BS year. Omitted / equal to `year` ⇒ single year. */
  to?: number;
}

export interface AbhijitSearch extends LocationSearch, PatroMonthBrowseSearch {}

/** Element detail pages — day browse (`date`) and span month browse (`era`/`year`/`month`). */
export type ElementPageSearch = LocationSearch & PanchangaSearch & PatroMonthBrowseSearch;

function toNum(v: unknown): number | undefined {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function toInt(v: unknown): number | undefined {
  const n = toNum(v);
  return n != null ? Math.trunc(n) : undefined;
}

function toStr(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() !== "" ? v : undefined;
}

function validClock(v: unknown): string | undefined {
  return typeof v === "string" && /^\d{2}:\d{2}$/.test(v) ? v : undefined;
}

function fallbackLanguageFromUi(): "en" | "ne" {
  return readCalendarEra() === "ad" ? "en" : "ne";
}

function eraSelectionFromYearBrowse(browse: PatroYearBrowse): EraSelection {
  return {
    era: browse.era,
    language: getLanguageForEra(browse.era),
    year: browse.year,
  };
}

function eraSelectionFromMonthBrowse(browse: PatroMonthBrowse): EraSelection {
  return {
    era: browse.era,
    language: getLanguageForEra(browse.era),
    year: browse.year,
    month: browse.month,
  };
}

/** Pull the location-describing keys out of a raw search object. */
export function validateLocationSearch(search: Record<string, unknown>): LocationSearch {
  const out: LocationSearch = {};
  const city = toInt(search.city);
  if (city != null) out.city = city;
  const lat = toNum(search.lat);
  if (lat != null) out.lat = lat;
  const lon = toNum(search.lon);
  if (lon != null) out.lon = lon;
  const tz = toStr(search.tz);
  if (tz) out.tz = tz;
  const place = toStr(search.place);
  if (place) out.place = place;
  return out;
}

/** Encode a chosen location as search params. */
export function locationToSearch(loc: PanchangaLocation): LocationSearch {
  const { params, label } = loc;
  const out: LocationSearch = {};
  if (params.lat != null && params.lon != null) {
    out.lat = params.lat;
    out.lon = params.lon;
  } else if (params.city_id != null) {
    out.city = params.city_id;
  }
  if (params.timezone) out.tz = params.timezone;
  if (label) out.place = label;
  return out;
}

/** Build era-aware month browse search params (+ optional route-specific keys). */
export function buildPatroMonthBrowseSearch(
  loc: PanchangaLocation,
  browse: PatroMonthBrowse,
  extra?: Record<string, unknown>,
): PatroMonthBrowseSearch & LocationSearch {
  const mergedExtra: Record<string, unknown> = {};
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      // Omit default paksha so URLs stay stable and sameSearch matches validated search.
      if (key === "paksha" && (value === "all" || value == null)) continue;
      mergedExtra[key] = value;
    }
  }
  return {
    ...locationToSearch(loc),
    ...buildPageSearch(eraSelectionFromMonthBrowse(browse), mergedExtra),
  } as PatroMonthBrowseSearch & LocationSearch;
}

/** Build era-aware year browse search params (+ optional route-specific keys). */
export function buildPatroYearBrowseSearch(
  loc: PanchangaLocation | undefined,
  browse: PatroYearBrowse,
  extra?: Record<string, unknown>,
): PatroYearBrowseSearch & LocationSearch {
  return {
    ...(loc ? locationToSearch(loc) : {}),
    ...buildPageSearch(eraSelectionFromYearBrowse(browse), extra),
  } as PatroYearBrowseSearch & LocationSearch;
}

/** Shareable `/dainikkranti` search — location + era-aware month on screen. */
export function buildDainikKrantiSearch(
  loc: PanchangaLocation,
  year: number,
  month: number,
  paksha: NonNullable<DainikKrantiSearch["paksha"]> = "all",
  era: CalendarEra = readCalendarEra(),
): DainikKrantiSearch {
  const selection: EraSelection = {
    era: era as Era,
    language: getLanguageForEra(era as Era),
    year,
    month,
  };
  return {
    ...locationToSearch(loc),
    ...buildPageSearch(selection, { paksha }),
  } as DainikKrantiSearch;
}

/** Build era-aware year range search (Panchanga year wheel). */
export function buildPatroYearRangeSearch(
  loc: PanchangaLocation,
  era: CalendarEra,
  year: number,
  to?: number,
): PanchangaYearSearch & LocationSearch {
  const selection: EraSelection = {
    era: era as Era,
    language: getLanguageForEra(era as Era),
    year,
  };
  const extra = to != null && to > year ? { to } : undefined;
  return {
    ...locationToSearch(loc),
    ...buildPageSearch(selection, extra),
  } as PanchangaYearSearch & LocationSearch;
}

/** Build shareable day-browse search (panchanga, graha sthiti, element tables). */
export function buildPatroDaySearch(
  loc: PanchangaLocation,
  state: PatroDayFetchState,
): PanchangaSearch & LocationSearch {
  return {
    ...locationToSearch(loc),
    ...buildPatroDayPageSearch(state),
  } as PanchangaSearch & LocationSearch;
}

/** Build shareable panchanga search — day + clock time + location. */
export function buildPatroPanchangaSearch(
  loc: PanchangaLocation,
  state: PatroDayFetchState,
  time: string,
): PanchangaSearch & LocationSearch {
  return {
    ...buildPatroDaySearch(loc, state),
    time,
  };
}
export function currentPatroMonthLinkSearch(
  loc: PanchangaLocation,
  era: CalendarEra = readCalendarEra(),
): DainikKrantiSearch {
  const selection: EraSelection = {
    era: era as Era,
    language: getLanguageForEra(era as Era),
  };
  return {
    ...locationToSearch(loc),
    ...buildPageSearch(selection, { paksha: "all" }),
  } as DainikKrantiSearch;
}

/** Shareable year-browse search (holidays, suryakranti, graha yearly, sait, …). */
export function currentPatroYearLinkSearch(
  loc: PanchangaLocation,
  era: CalendarEra = readCalendarEra(),
): PatroYearBrowseSearch & LocationSearch {
  const selection: EraSelection = {
    era: era as Era,
    language: getLanguageForEra(era as Era),
  };
  return {
    ...locationToSearch(loc),
    ...buildPageSearch(selection),
  } as PatroYearBrowseSearch & LocationSearch;
}

/** Shareable day-browse search (panchanga, graha sthiti, element tables). */
export function currentPatroDayLinkSearch(
  loc: PanchangaLocation,
  _dateAd?: string,
  era: CalendarEra = readCalendarEra(),
): PanchangaSearch & LocationSearch {
  const displayEra = era as Era;
  return buildPatroDaySearch(loc, {
    kind: "today",
    display: { era: displayEra, language: getLanguageForEra(displayEra) },
  });
}

/** Location-only share link (ritu, converter with a place). */
export function currentPatroLocationLinkSearch(loc: PanchangaLocation): LocationSearch {
  return locationToSearch(loc);
}

/** Shareable panchanga year wheel search. */
export function currentPatroYearRangeLinkSearch(
  loc: PanchangaLocation,
  era: CalendarEra = readCalendarEra(),
): PanchangaYearSearch & LocationSearch {
  const selection: EraSelection = {
    era: era as Era,
    language: getLanguageForEra(era as Era),
  };
  return {
    ...locationToSearch(loc),
    ...buildPageSearch(selection),
  } as PanchangaYearSearch & LocationSearch;
}

/** Element detail pages — span (month) vs table (day) pick the right URL keys. */
export function patroElementLinkSearch(
  elementId: string,
  loc: PanchangaLocation,
  era: CalendarEra = readCalendarEra(),
): ElementPageSearch {
  const meta = ELEMENT_BY_ID[elementId];
  if (meta?.kind === "table") {
    return currentPatroDayLinkSearch(loc);
  }
  const selection: EraSelection = {
    era: era as Era,
    language: getLanguageForEra(era as Era),
  };
  return {
    ...locationToSearch(loc),
    ...buildPageSearch(selection),
  } as ElementPageSearch;
}

/**
 * Best-effort shareable search for a patro route path.
 * Used by sidebar, home quick links, and directory cards.
 */
export function patroRouteLinkSearch(
  route: string,
  loc: PanchangaLocation,
  era: CalendarEra = readCalendarEra(),
): Record<string, unknown> {
  const normalized = route.replace(/\/$/, "");
  if (normalized === "/ritu" || normalized === "/converter") {
    return currentPatroLocationLinkSearch(loc) as Record<string, unknown>;
  }
  if (normalized === "/dainikkranti" || normalized === "/abhijit-muhurta") {
    return currentPatroMonthLinkSearch(loc, era) as Record<string, unknown>;
  }
  if (normalized === "/panchanga/year") {
    return currentPatroYearRangeLinkSearch(loc, era) as Record<string, unknown>;
  }
  if (normalized === "/panchanga/graha-sthiti" || normalized === "/panchanga") {
    return currentPatroDayLinkSearch(loc) as Record<string, unknown>;
  }
  if (
    normalized === "/holidays" ||
    normalized === "/suryakranti" ||
    normalized === "/panchak-patro" ||
    normalized === "/panchanga/graha-asta" ||
    normalized === "/panchanga/graha-vakri" ||
    normalized === "/panchanga/chandra-grahan" ||
    normalized === "/panchanga/surya-grahan"
  ) {
    return currentPatroYearLinkSearch(loc, era) as Record<string, unknown>;
  }
  if (normalized.startsWith("/sait/")) {
    return currentPatroYearLinkSearch(loc, era) as Record<string, unknown>;
  }
  if (normalized.startsWith("/panchanga/element/")) {
    const elementId = normalized.split("/").pop() ?? "";
    return patroElementLinkSearch(elementId, loc, era) as Record<string, unknown>;
  }
  return currentPatroLocationLinkSearch(loc) as Record<string, unknown>;
}

/** Year browse with an explicit year (e.g. home sait aside for the visible BS year). */
export function patroYearLinkSearch(
  loc: PanchangaLocation,
  year: number,
  era: CalendarEra = readCalendarEra(),
): PatroYearBrowseSearch & LocationSearch {
  const selection: EraSelection = {
    era: era as Era,
    language: getLanguageForEra(era as Era),
    year,
  };
  return {
    ...locationToSearch(loc),
    ...buildPageSearch(selection),
  } as PatroYearBrowseSearch & LocationSearch;
}

/**
 * Reconstruct a location from search params, or `undefined` when the URL
 * carries no location (so callers can fall back to the stored preference).
 */
export function searchToLocation(search: LocationSearch): PanchangaLocation | undefined {
  if (search.lat != null && search.lon != null) {
    return {
      label: search.place ?? `${search.lat.toFixed(2)}°, ${search.lon.toFixed(2)}°`,
      params: {
        lat: search.lat,
        lon: search.lon,
        ...(search.tz ? { timezone: search.tz } : {}),
      },
    };
  }
  if (search.city != null) {
    return {
      label: search.place ?? `City #${search.city}`,
      params: {
        city_id: search.city,
        ...(search.tz ? { timezone: search.tz } : {}),
      },
    };
  }
  return undefined;
}

/** Whether two location param sets resolve to the same place. */
export function sameLocationParams(a: LocationParams, b: LocationParams): boolean {
  return (
    a.city_id === b.city_id &&
    a.lat === b.lat &&
    a.lon === b.lon &&
    a.city === b.city &&
    a.timezone === b.timezone
  );
}

/** Shallow equality for two search objects (union of keys; missing paksha = "all"). */
export function sameSearch(a: object, b: object): boolean {
  const ae = a as Record<string, unknown>;
  const be = b as Record<string, unknown>;
  const keys = new Set([...Object.keys(ae), ...Object.keys(be)]);
  return [...keys].every((k) => {
    let av = ae[k];
    let bv = be[k];
    if (k === "paksha") {
      av = av ?? "all";
      bv = bv ?? "all";
    }
    return av === bv;
  });
}

export function validatePanchangaSearch(search: Record<string, unknown>): PanchangaSearch {
  const out: PanchangaSearch = { ...validateLocationSearch(search) };
  const parsed = parsePatroDayUrl(search, fallbackLanguageFromUi());
  Object.assign(out, buildPatroDayPageSearch(parsed));
  if (search.view === "day" || search.view === "month") out.view = search.view;
  if (search.mode === "udaya" || search.mode === "instant") out.mode = search.mode;
  const time = validClock(search.time);
  if (time) out.time = time;
  return out;
}

export function validatePatroMonthBrowseSearch(
  search: Record<string, unknown>,
): PatroMonthBrowseSearch & LocationSearch {
  const out: PatroMonthBrowseSearch & LocationSearch = { ...validateLocationSearch(search) };
  const parsed = parseEraFromUrl(search, fallbackLanguageFromUi());
  out.era = parsed.era as CalendarEra;
  out.language = parsed.language;
  if (parsed.year != null) out.year = parsed.year;

  const month = validatePatroBrowseMonth(toInt(search.month));
  if (month != null) out.month = month;
  return out;
}

export function validatePatroYearBrowseSearch(
  search: Record<string, unknown>,
): PatroYearBrowseSearch & LocationSearch {
  const out: PatroYearBrowseSearch & LocationSearch = { ...validateLocationSearch(search) };
  const parsed = parseEraFromUrl(search, fallbackLanguageFromUi());
  out.era = parsed.era as CalendarEra;
  out.language = parsed.language;
  if (parsed.year != null) out.year = parsed.year;
  return out;
}

/** Nepal holiday/festival lists are keyed by BS or AD year only — not BC/BBS browse. */
export function validateHolidaysSearch(
  search: Record<string, unknown>,
): PatroYearBrowseSearch & LocationSearch {
  const out = validatePatroYearBrowseSearch(search);
  if (out.era === "bc" || out.era === "bbs") {
    out.era = "bs";
  }
  return out;
}

export function validateDainikKrantiSearch(
  search: Record<string, unknown>
): DainikKrantiSearch {
  const out: DainikKrantiSearch = { ...validatePatroMonthBrowseSearch(search) };
  if (
    search.paksha === "all" ||
    search.paksha === "krishna" ||
    search.paksha === "shukla"
  ) {
    out.paksha = search.paksha;
  }
  return out;
}

export function validatePanchangaYearSearch(
  search: Record<string, unknown>,
): PanchangaYearSearch {
  const out: PanchangaYearSearch = { ...validatePatroYearBrowseSearch(search) };
  const to = toInt(search.to);
  if (to != null && to >= 1 && (out.year == null || to >= out.year)) {
    out.to = to;
  }
  return out;
}

export function validateAbhijitSearch(search: Record<string, unknown>): AbhijitSearch {
  return validatePatroMonthBrowseSearch(search);
}

export function validateElementPageSearch(
  search: Record<string, unknown>,
): ElementPageSearch {
  return {
    ...validatePatroMonthBrowseSearch(search),
    ...validatePanchangaSearch(search),
  } as ElementPageSearch;
}

/** Graha sthiti and other single-day browse pages. */
export function validateGrahaDaySearch(
  search: Record<string, unknown>,
): PanchangaSearch {
  return validatePanchangaSearch(search);
}
