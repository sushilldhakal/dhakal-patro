import type { LocationParams } from "@/lib/api";
import {
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
} from "@/lib/bs-calendar";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";

/**
 * Shareable URL state.
 *
 * The app is a single-page Vite build; `vercel.json` rewrites every path to
 * `index.html`, so the "server" already serves any route. What makes a view
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
  /** Selected day in AD, "YYYY-MM-DD". */
  date?: string;
  /** Day vs. month view. */
  view?: "day" | "month";
  /** Sunrise (udaya) vs. instant (समय-आधारित) reckoning. */
  mode?: "udaya" | "instant";
  /** Clock for instant mode, "HH:MM". */
  time?: string;
}

export interface DainikKrantiSearch extends LocationSearch {
  /** Bikram Sambat year. */
  year?: number;
  /** Bikram Sambat month, 1-12. */
  month?: number;
  /** Paksha filter. */
  paksha?: "all" | "krishna" | "shukla";
}

export interface PanchangaYearSearch extends LocationSearch {
  /** Range start / currently-active BS year. */
  year?: number;
  /** Range end (inclusive) BS year. Omitted / equal to `year` ⇒ single year. */
  to?: number;
}

export interface AbhijitSearch extends LocationSearch {
  year?: number;
  month?: number;
}

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

function validIsoDate(v: unknown): string | undefined {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
}

function validClock(v: unknown): string | undefined {
  return typeof v === "string" && /^\d{2}:\d{2}$/.test(v) ? v : undefined;
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

/** Shareable `/dainikkranti` search — location + BS month on screen. */
export function buildDainikKrantiSearch(
  loc: PanchangaLocation,
  year: number,
  month: number,
  paksha: NonNullable<DainikKrantiSearch["paksha"]> = "all",
): DainikKrantiSearch {
  return {
    ...locationToSearch(loc),
    year,
    month,
    paksha,
  };
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

/** Shallow equality for two search objects (only the keys each side defines). */
export function sameSearch(a: object, b: object): boolean {
  const ae = a as Record<string, unknown>;
  const be = b as Record<string, unknown>;
  const ak = Object.keys(ae);
  const bk = Object.keys(be);
  if (ak.length !== bk.length) return false;
  return ak.every((k) => ae[k] === be[k]);
}

export function validatePanchangaSearch(search: Record<string, unknown>): PanchangaSearch {
  const out: PanchangaSearch = { ...validateLocationSearch(search) };
  const date = validIsoDate(search.date);
  if (date) out.date = date;
  if (search.view === "day" || search.view === "month") out.view = search.view;
  if (search.mode === "udaya" || search.mode === "instant") out.mode = search.mode;
  const time = validClock(search.time);
  if (time) out.time = time;
  return out;
}

export function validateDainikKrantiSearch(
  search: Record<string, unknown>
): DainikKrantiSearch {
  const out: DainikKrantiSearch = { ...validateLocationSearch(search) };
  const year = toInt(search.year);
  if (year != null && year >= BS_SUPPORTED_START_YEAR && year <= BS_SUPPORTED_END_YEAR) {
    out.year = year;
  }
  const month = toInt(search.month);
  if (month != null && month >= 1 && month <= 12) out.month = month;
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
  const out: PanchangaYearSearch = { ...validateLocationSearch(search) };
  const year = toInt(search.year);
  if (year != null && year >= BS_SUPPORTED_START_YEAR && year <= BS_SUPPORTED_END_YEAR) {
    out.year = year;
  }
  const to = toInt(search.to);
  if (
    to != null &&
    to >= BS_SUPPORTED_START_YEAR &&
    to <= BS_SUPPORTED_END_YEAR &&
    (out.year == null || to >= out.year)
  ) {
    out.to = to;
  }
  return out;
}

export function validateAbhijitSearch(search: Record<string, unknown>): AbhijitSearch {
  const out: AbhijitSearch = { ...validateLocationSearch(search) };
  const year = toInt(search.year);
  if (year != null && year >= BS_SUPPORTED_START_YEAR && year <= BS_SUPPORTED_END_YEAR) {
    out.year = year;
  }
  const month = toInt(search.month);
  if (month != null && month >= 1 && month <= 12) out.month = month;
  return out;
}
