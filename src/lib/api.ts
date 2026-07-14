// Same-origin by default: nginx proxies "/api" → the FastAPI backend, so the
// browser never makes a cross-origin request (no CORS). Override with
// VITE_API_BASE_URL for a split host (e.g. http://localhost:8080 in dev).
const BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

// Public, cacheable data endpoints live under a version segment (…/api/v1/…) so
// a backend engine bump (v1 → v2) becomes a brand-new CDN object — no Cloudflare
// purge needed. Auth/profile calls stay on the unversioned API_BASE.
const API_VERSION = import.meta.env.VITE_API_VERSION ?? "v1";
const DATA_BASE = `${BASE}/${API_VERSION}`;

/**
 * Bumps with backend `CACHE_PAYLOAD_VERSION` (nepali-holiday-api). Appended as
 * `cv=` on panchanga URLs so Cloudflare edge keys change on engine deploys
 * without a manual purge.
 */
export const PANCHANGA_CACHE_VERSION =
  import.meta.env.VITE_PANCHANGA_CACHE_VERSION ?? "25";

/**
 * Sait listings are CDN-cached too. Appended as `sv=` so a change in the sait
 * source/engine (e.g. official → computed) mints fresh Cloudflare objects
 * instead of serving the stale cached listing. Bump when the sait engine changes.
 */
export const SAIT_CACHE_VERSION =
  import.meta.env.VITE_SAIT_CACHE_VERSION ?? "8";

/** Unversioned base — used by the auth client (/auth, /profiles). */
export const API_BASE = BASE;
/** Versioned base for public, cacheable data endpoints. */
export const API_DATA_BASE = DATA_BASE;

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${DATA_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

// ─── Location ─────────────────────────────────────────────────────────────────

export interface LocationParams {
  city_id?: number;
  city?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
}

export function locationCacheKey(location?: LocationParams): string {
  if (!location) return "default";
  if (location.city_id != null) return `city:${location.city_id}`;
  if (location.lat != null && location.lon != null) {
    return `coords:${location.lat.toFixed(4)},${location.lon.toFixed(4)}`;
  }
  if (location.city) return `name:${location.city}`;
  return "default";
}

function appendLocation(path: string, location?: LocationParams): string {
  if (!location) return path;
  const params = new URLSearchParams();
  if (location.city_id != null) {
    params.set("city_id", String(location.city_id));
  } else if (location.city) {
    params.set("city", location.city);
  } else {
    if (location.lat != null) params.set("lat", String(location.lat));
    if (location.lon != null) params.set("lon", String(location.lon));
    if (location.timezone) params.set("timezone", location.timezone);
  }
  const qs = params.toString();
  if (!qs) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${qs}`;
}

/** Append engine cache version for CDN-safe panchanga GET URLs. */
function withPanchangaCacheVersion(path: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}cv=${PANCHANGA_CACHE_VERSION}`;
}

/** Append the sait cache version so CDN-cached sait URLs refresh on engine changes. */
function withSaitCacheVersion(path: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}sv=${SAIT_CACHE_VERSION}`;
}

export interface City {
  id: number;
  name: string;
  ascii_name: string;
  lat: number;
  lon: number;
  country: string;
  population: number;
  timezone: string;
  admin1?: string | null;
  admin1_name?: string | null;
  /** Curated Nepal entry — location is built from lat/lon, not a backend city_id. */
  local?: boolean;
}

export interface CitiesSearchResponse {
  query: string;
  count: number;
  cities: City[];
}

export const cityKeys = {
  search: (q: string, country?: string) => ["cities", "search", q, country ?? "all"] as const,
  popular: () => ["cities", "popular"] as const,
};

export const searchCities = (q: string, limit = 15, country?: string) => {
  const params = new URLSearchParams({
    q,
    limit: String(limit),
  });
  if (country) params.set("country", country);
  return get<CitiesSearchResponse>(`/nepal/cities/search?${params.toString()}`);
};

export const fetchPopularCities = () =>
  get<{ count: number; cities: City[] }>("/nepal/cities/popular");

export interface NearestCityResponse {
  lat: number;
  lon: number;
  city: City;
}

/**
 * Snap raw GPS coordinates to the nearest named city in the GeoNames DB. The
 * backend always returns a city (no distance limit), so "use my location" can
 * resolve to a named place even when the point is far from any town.
 */
export const fetchNearestCity = (lat: number, lon: number, country?: string) => {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  if (country) params.set("country", country);
  return get<NearestCityResponse>(`/nepal/cities/nearest?${params.toString()}`);
};

// ─── Panchanga ────────────────────────────────────────────────────────────────

export const panchangaKeys = {
  today: (location?: LocationParams) =>
    ["panchanga", "today", locationCacheKey(location)] as const,
  day: (date: string, era: string, location?: LocationParams) =>
    ["panchanga", "day", PANCHANGA_CACHE_VERSION, date, era, locationCacheKey(location)] as const,
  nepalDay: (date: string, location?: LocationParams) =>
    ["panchanga", "nepal", date, locationCacheKey(location)] as const,
  month: (
    year: number,
    month: number,
    location?: LocationParams,
    full = true,
    excludeInternational = false,
  ) =>
    ["panchanga", "month", year, month, locationCacheKey(location), full ? "full" : "lite", excludeInternational ? "nointl" : "intl"] as const,
  year: (year: number, location?: LocationParams, full = true) =>
    ["panchanga", "year", year, locationCacheKey(location), full ? "full" : "lite"] as const,
  monthAtClock: (
    year: number,
    month: number,
    clock: string,
    location?: LocationParams,
    excludeInternational = false,
  ) =>
    ["panchanga", "month", "clock", year, month, clock, locationCacheKey(location), excludeInternational ? "nointl" : "intl"] as const,
  atTime: (datetime: string, location?: LocationParams) =>
    ["panchanga", "at-time", PANCHANGA_CACHE_VERSION, datetime, locationCacheKey(location)] as const,
  civil: (date: string, location?: LocationParams) =>
    ["panchanga", "civil", PANCHANGA_CACHE_VERSION, date, locationCacheKey(location)] as const,
  header: (year: number, month: number, location?: LocationParams) =>
    ["calendar", "header", year, month, locationCacheKey(location)] as const,
};

export const fetchTodayPanchanga = (location?: LocationParams) => {
  const today = new Date().toISOString().split("T")[0];
  return get<PanchangaDay>(
    appendLocation(
      withPanchangaCacheVersion(
        `/panchanga/${today}?era=ad&festivals=true&detail=true`,
      ),
      location,
    ),
  );
};

export const fetchPanchanga = (
  date: string,
  era: "bs" | "ad" = "bs",
  location?: LocationParams
) =>
  get<PanchangaDay>(
    appendLocation(
      withPanchangaCacheVersion(
        `/panchanga/${date}?era=${era}&festivals=true&detail=true`,
      ),
      location,
    ),
  );

export const fetchNepalPanchanga = (dateAd: string, location?: LocationParams) =>
  get<PanchangaDay>(
    appendLocation(`/nepal/panchanga/${dateAd}?era=ad`, location)
  );

/** Civil-day (midnight→midnight) timeline — minutes-from-midnight positions. */
export interface CivilTimelineSeg {
  name_ne?: string | null;
  name?: string | null;
  end_min: number;
}
export interface CivilTimelineBand {
  name_ne?: string | null;
  bad?: boolean;
  start_min: number;
  end_min: number;
}
export interface CivilTimelineHora {
  planet_ne?: string | null;
  planet_en?: string | null;
  bad?: boolean;
  start_min: number;
  end_min: number;
}
export interface CivilTimelineLagna {
  name_ne?: string | null;
  name?: string | null;
  start_min: number;
  end_min: number;
}
export interface CivilTimeline {
  anchor: "civil";
  date_ad: string;
  sunrise_min: number;
  sunset_min: number | null;
  moonrise_min: number | null;
  moonset_min: number | null;
  weekday_ne?: string | null;
  weekday_en?: string | null;
  paksha_ne?: string | null;
  rows: {
    tithi: CivilTimelineSeg[];
    nakshatra: CivilTimelineSeg[];
    yoga: CivilTimelineSeg[];
    karana: CivilTimelineSeg[];
  };
  choghadiya: CivilTimelineBand[];
  hora: CivilTimelineHora[];
  lagna: CivilTimelineLagna[];
  planets?: PanchangaDay["planets"];
  planets_anchor?: unknown;
}

export const fetchCivilTimeline = (
  date: string,
  era: "bs" | "ad" = "ad",
  location?: LocationParams,
) =>
  get<{ civil_timeline: CivilTimeline }>(
    appendLocation(
      withPanchangaCacheVersion(
        `/panchanga/${date}?era=${era}&detail=false&civil=true`,
      ),
      location,
    ),
  ).then((r) => r.civil_timeline);

export const fetchPanchangaAtTime = (
  datetime: string,
  location?: LocationParams,
  options?: { ayanamsha?: string }
) => {
  const params = new URLSearchParams();
  params.set("datetime", datetime);
  if (options?.ayanamsha) params.set("ayanamsha", options.ayanamsha);
  return get<PanchangaDay>(
    appendLocation(
      withPanchangaCacheVersion(`/panchanga/at-time?${params.toString()}`),
      location,
    ),
  );
};

// ─── Tropical seasons ─────────────────────────────────────────────────────────

export interface TropicalSeasonBoundary {
  slot: number;
  angle: number;
  start_instant_utc: string;
  start_ad: string;
  start_bs: string;
  is_current: boolean;
}

export interface TropicalSeasonsResponse {
  timezone: string;
  latitude?: number;
  southern_hemisphere: boolean;
  boundaries: TropicalSeasonBoundary[];
}

export const seasonsKeys = {
  tropical: (location?: LocationParams) =>
    ["seasons", "tropical", locationCacheKey(location)] as const,
};

export const fetchTropicalSeasons = (location?: LocationParams) =>
  get<TropicalSeasonsResponse>(appendLocation("/seasons/tropical", location));

// ─── Vimshottari dasha ───────────────────────────────────────────────────────

export interface VimshottariPeriod {
  lord: string;
  lord_ne: string;
  start: string;
  end: string;
  years: number;
}

export interface VimshottariResponse {
  ayanamsha: string;
  moon_longitude: number;
  nakshatra_index: number;
  mahadasha_lord: string;
  mahadasha_lord_ne: string;
  balance_years: number;
  balance_label: string;
  sequence: VimshottariPeriod[];
  query_instant?: string;
}

export const vimshottariKeys = {
  atTime: (datetime: string, location?: LocationParams, ayanamsha?: string) =>
    ["vimshottari", datetime, locationCacheKey(location), ayanamsha ?? "lahiri"] as const,
};

export const fetchVimshottari = (
  datetime: string,
  location?: LocationParams,
  options?: { ayanamsha?: string; cycles?: number }
) => {
  const params = new URLSearchParams();
  params.set("datetime", datetime);
  if (options?.ayanamsha) params.set("ayanamsha", options.ayanamsha);
  if (options?.cycles != null) params.set("cycles", String(options.cycles));
  return get<VimshottariResponse>(
    appendLocation(`/kundali/vimshottari?${params.toString()}`, location)
  );
};

// ─── Gochar (planetary transits) ─────────────────────────────────────────────

export interface GocharNextEntry {
  to_rashi?: string;
  to_rashi_ne?: string;
  to_nakshatra?: string;
  to_nakshatra_ne?: string;
  to_pada?: number;
  to_pada_ne?: string;
  label_ne?: string;
  entry_time_local: string;
  entry_time_local_short?: string;
  entry_time_utc?: string;
}

export interface GocharIngressEvent {
  graha: string;
  graha_ne: string;
  level: string;
  to_rashi?: string;
  to_rashi_ne?: string;
  from_rashi?: string;
  from_rashi_ne?: string;
  to_nakshatra?: string;
  to_nakshatra_ne?: string;
  to_pada?: number;
  to_pada_ne?: string;
  label_ne?: string;
  entry_time_local: string;
  entry_time_local_short?: string;
  entry_time_utc?: string;
  entry_date_ad?: string;
  /** Vedic day (sunrise–sunrise) civil date — patro गते row key. */
  entry_vedic_date_ad?: string;
  /** udayast only */
  event?: "udaya" | "asta";
  hemisphere?: "east" | "west";
  motion_ne?: string;
}

export interface GocharIngressResponse {
  from_date_ad: string;
  to_date_ad: string;
  level: string;
  location?: Record<string, unknown>;
  events: GocharIngressEvent[];
}

export interface GocharGraha {
  name_ne: string;
  name_vedic?: string;
  symbol: string;
  rashi?: string;
  rashi_ne?: string;
  rashi_no?: number;
  deg_in_rashi?: number;
  dms_in_rashi?: string;
  dms_absolute?: string;
  longitude?: number;
  speed_deg_day?: number;
  /** "Margi" (direct) or "Vakri" (retrograde). */
  motion?: string;
  is_retrograde?: boolean;
  next_rashi_entry?: GocharNextEntry | null;
  next_nakshatra_entry?: GocharNextEntry | null;
  next_pada_entry?: GocharNextEntry | null;
}

export interface GocharResponse {
  date_ad: string;
  date_bs?: string;
  gochar: Record<string, GocharGraha>;
}

export const gocharKeys = {
  day: (date: string, era: string, location?: LocationParams) =>
    ["gochar", date, era, locationCacheKey(location)] as const,
  ingress: (
    from: string,
    to: string,
    level: string,
    location?: LocationParams
  ) => ["gochar", "ingress", from, to, level, locationCacheKey(location)] as const,
};

export const fetchGochar = (
  date: string,
  era: "bs" | "ad" = "ad",
  location?: LocationParams
) =>
  get<GocharResponse>(
    appendLocation(`/nepal/gochar/${date}?era=${era}`, location)
  );

export const fetchGocharIngress = (
  from: string,
  to: string,
  location?: LocationParams,
  options?: { level?: "pada" | "nakshatra" | "rashi" | "patro" | "udayast"; era?: "bs" | "ad" }
) => {
  const params = new URLSearchParams();
  params.set("from", from);
  params.set("to", to);
  params.set("era", options?.era ?? "ad");
  params.set("level", options?.level ?? "pada");
  return get<GocharIngressResponse>(
    appendLocation(`/nepal/gochar/ingress?${params.toString()}`, location)
  );
};

type RawMonthDay = CalendarDay;

function parsePakshaName(label?: string): string | undefined {
  if (!label) return undefined;
  const lower = label.toLowerCase();
  if (lower.includes("shukla") || label.includes("शुक्ल")) return "shukla";
  if (lower.includes("krishna") || label.includes("कृष्ण")) return "krishna";
  return undefined;
}

function parsePakshaNeShort(label?: string): string | undefined {
  if (!label) return undefined;
  if (label.includes("शुक्ल")) return "शुक्ल";
  if (label.includes("कृष्ण")) return "कृष्ण";
  return undefined;
}

function resolveNestedChandraRashi(nested?: CalendarDay["panchanga"]) {
  const raw = nested?.chandra_rashi;
  if (raw && typeof raw === "object") {
    const obj = raw as { name?: string; name_ne?: string };
    return { en: obj.name, ne: obj.name_ne ?? nested?.chandra_rashi_ne };
  }
  return {
    en: typeof raw === "string" ? raw : undefined,
    ne: nested?.chandra_rashi_ne,
  };
}

function normalizeMonthDay(day: RawMonthDay): CalendarDay {
  const nested = day.panchanga;
  const nestedRashi = resolveNestedChandraRashi(nested);
  const paksha =
    day.paksha ??
    parsePakshaName(nested?.paksha) ??
    parsePakshaName(nested?.paksha_ne);
  const pakshaNe =
    day.paksha_ne ??
    parsePakshaNeShort(nested?.paksha_ne) ??
    nested?.paksha_ne;

  return {
    ...day,
    paksha,
    paksha_ne: pakshaNe,
    aayan: day.aayan ?? nested?.aayan,
    aayan_ne: day.aayan_ne ?? nested?.aayan_ne,
    ayana_mark: day.ayana_mark ?? nested?.ayana_mark,
    nakshatra: day.nakshatra ?? nested?.nakshatra?.name,
    nakshatra_ne: day.nakshatra_ne ?? nested?.nakshatra?.name_ne,
    yoga: day.yoga ?? nested?.yoga?.name,
    yoga_ne: day.yoga_ne ?? nested?.yoga?.name_ne,
    karana: day.karana ?? nested?.karana?.name,
    karana_ne: day.karana_ne ?? nested?.karana?.name_ne,
    moonrise: day.moonrise ?? nested?.moon?.rise,
    moonrise_local: day.moonrise_local,
    moonset: day.moonset ?? nested?.moon?.set,
    moonset_local: day.moonset_local,
    chandra_rashi: day.chandra_rashi ?? nestedRashi.en,
    chandra_rashi_ne: day.chandra_rashi_ne ?? nestedRashi.ne,
  };
}

export const fetchMonthCalendar = async (
  year: number,
  month: number,
  location?: LocationParams,
  options?: { clock?: string; full?: boolean; excludeInternational?: boolean }
): Promise<MonthCalendar> => {
  const full = options?.full !== false;
  const params = new URLSearchParams();
  if (full) params.set("full", "true");
  if (options?.clock) params.set("clock", options.clock);
  if (options?.excludeInternational) params.set("exclude_international", "true");
  const qs = params.toString();
  const path = appendLocation(
    withPanchangaCacheVersion(`/panchanga/${year}/${month}${qs ? `?${qs}` : ""}`),
    location
  );
  const data = await get<MonthCalendar & { calendar: RawMonthDay[] }>(path);
  return {
    ...data,
    calendar: data.calendar.map(normalizeMonthDay),
  };
};

export const fetchYearCalendar = async (
  year: number,
  location?: LocationParams,
  options?: { full?: boolean; wheel?: boolean },
): Promise<YearCalendar> => {
  const params = new URLSearchParams();
  if (options?.wheel) {
    // Slim year-wheel payload: days once in `calendar` with wheel-only state,
    // `months` metadata only (no duplicated per-day grids). ~90% smaller.
    params.set("wheel", "true");
  } else if (options?.full !== false) {
    params.set("full", "true");
  }
  const qs = params.toString();
  const path = appendLocation(
    withPanchangaCacheVersion(`/panchanga/year/${year}${qs ? `?${qs}` : ""}`),
    location,
  );
  const data = await get<YearCalendar & { calendar: RawMonthDay[]; months: Array<MonthCalendar & { calendar?: RawMonthDay[] }> }>(path);
  // The wheel reads only each day's nested `panchanga` block (see seedDayRow), so
  // normalizing — which reconstructs the ~20 flat per-day fields the server just
  // trimmed away — would re-bloat the payload before it's parsed/persisted and
  // burn CPU over 365 days for nothing. Skip it for the wheel; keep it for the
  // (fuller) default shape whose consumers rely on the flat fields.
  if (options?.wheel) {
    return { ...data, calendar: data.calendar as CalendarDay[], months: data.months ?? [] };
  }
  return {
    ...data,
    calendar: data.calendar.map(normalizeMonthDay),
    months: (data.months ?? []).map((month) => ({
      ...month,
      calendar: (month.calendar ?? []).map(normalizeMonthDay),
    })),
  };
};

// ─── Year sun times (सूर्यक्रान्ति) ───────────────────────────────────────────
// Slim per-day payload (sunrise/sunset/ayana only) — ~4 KB for a whole year
// and served from the API's year cache in milliseconds.

export interface SunYearDay {
  day: number;
  date_ad: string;
  sunrise?: string;
  sunset?: string;
  aayan?: string;
  aayan_ne?: string;
  ayana_mark?: "उ" | "द";
}

export interface SunYearMonth {
  month_bs: number;
  month_name: string;
  month_name_ne: string;
  month_start_ad: string;
  month_length: number;
  calendar: SunYearDay[];
}

export interface SunYearResponse {
  year_bs: number;
  location?: PanchangaDay["location"];
  months: SunYearMonth[];
}

// Bump when year sun-times payload logic changes (invalidates React Query + IDB).
export const SUN_YEAR_DATA_VERSION = 15;

export const sunYearKeys = {
  year: (year: number, location?: LocationParams) =>
    ["sun-times", "year", SUN_YEAR_DATA_VERSION, year, locationCacheKey(location)] as const,
};

export const fetchYearSunTimes = (year: number, location?: LocationParams) =>
  get<SunYearResponse>(appendLocation(`/panchanga/year/${year}/sun`, location));

export const fetchCalendarHeader = (year: number, month: number) =>
  get<CalendarHeader>(`/calendar/header/${year}/${month}`);

// ─── Patro ────────────────────────────────────────────────────────────────────

export const patroKeys = {
  month: (year: number, month: number) => ["patro", "month", year, month] as const,
};

export const fetchPatroMonth = (year: number, month: number) =>
  get<PatroMonth>(withPanchangaCacheVersion(`/nepal/patro/${year}/${month}`));

// ─── Holidays & Festivals ─────────────────────────────────────────────────────

export const holidayKeys = {
  holidays: (year: number) => ["holidays", year] as const,
  festivals: (year: number, month?: number) =>
    month != null
      ? (["festivals", year, month] as const)
      : (["festivals", year] as const),
  upcoming: (days = 90, limit = 15, holidaysOnly = false) =>
    ["festivals", "upcoming", days, limit, holidaysOnly] as const,
};

export const fetchHolidays = (year: number) =>
  get<HolidaysResponse>(withPanchangaCacheVersion(`/nepal/holidays?year=${year}&era=bs`));

export const fetchFestivals = (year: number, month?: number) => {
  const params = new URLSearchParams({ year: String(year), era: "bs" });
  if (month != null) params.set("month", String(month));
  return get<FestivalsResponse>(withPanchangaCacheVersion(`/nepal/festivals?${params}`));
};

/** Festival with countdown, as returned by /nepal/festivals/upcoming. */
export interface UpcomingFestival extends Festival {
  days_until: number;
}

export interface UpcomingFestivalsResponse {
  from: string;
  days: number;
  count: number;
  festivals: UpcomingFestival[];
}

/** Next festivals from today (observer TZ), across the BS-year boundary. */
export const fetchUpcomingFestivals = (
  days = 90,
  limit = 15,
  holidaysOnly = false
) => {
  const params = new URLSearchParams({
    days: String(days),
    limit: String(limit),
  });
  if (holidaysOnly) params.set("holidays_only", "true");
  return get<UpcomingFestivalsResponse>(`/nepal/festivals/upcoming?${params}`);
};

// ─── Sait (auspicious dates) ──────────────────────────────────────────────────

export interface SaitMonthEntry {
  month: number;
  month_name_ne: string;
  days: number[];
}

export interface SaitResponse {
  bs_year: number;
  category: string;
  category_label_ne: string;
  months: SaitMonthEntry[];
}

export const saitKeys = {
  years: () => ["sait", "years"] as const,
  entries: (year: number, category: string, location?: LocationParams) =>
    ["sait", SAIT_CACHE_VERSION, year, category, locationCacheKey(location)] as const,
};

export const fetchSaitYears = () => get<{ years: number[] }>("/nepal/sait/years");

export const fetchSait = (year: number, category: string, location?: LocationParams) =>
  get<SaitResponse>(
    withSaitCacheVersion(appendLocation(`/nepal/sait/${year}/${category}`, location)),
  );

/** Per-day muhūrta reason for each qualifying day (why it was selected). */
export interface SaitDetailDay {
  bs_month: number;
  bs_day: number;
  bs_month_name_ne: string;
  gregorian: string;
  weekday_en: string;
  weekday_ne: string;
  window_start: string;
  window_end: string;
  tithi_num: number;
  tithi_en: string;
  tithi_ne: string;
  paksha: string;
  paksha_ne: string;
  nakshatra_num: number;
  nakshatra_en: string;
  nakshatra_ne: string;
  yoga_en: string;
  yoga_ne: string;
  karana_en: string;
  karana_ne: string;
  lagna_en: string;
  lunar_month_en: string | null;
  lunar_month_ne: string | null;
}

export interface SaitDetailResponse {
  bs_year: number;
  category: string;
  category_label_ne: string;
  engine_version?: string;
  days: SaitDetailDay[];
}

export const saitDetailKey = (year: number, category: string, location?: LocationParams) =>
  ["sait", "detail", SAIT_CACHE_VERSION, year, category, locationCacheKey(location)] as const;

export const fetchSaitDetail = (year: number, category: string, location?: LocationParams) =>
  get<SaitDetailResponse>(
    withSaitCacheVersion(appendLocation(`/nepal/sait/${year}/${category}/detail`, location)),
  );

export interface SaitRuleItem {
  ne: string;
  en: string;
}
export interface SaitAboutCategory {
  id: string;
  label_ne: string;
  label_en: string;
  description_ne?: string;
  description_en?: string;
  requires_birth_date?: boolean;
  source?: string;
  method?: { ne?: string; en?: string };
  /** Classical rules the engine applies for this ceremony (per-category). */
  rules?: SaitRuleItem[];
}
export interface SaitAboutResponse {
  source: string;
  method: { ne?: string; en?: string };
  categories: SaitAboutCategory[];
}

export const fetchSaitAbout = () => get<SaitAboutResponse>("/nepal/sait/about");
export const fetchSaitAboutCategory = (category: string) =>
  get<SaitAboutCategory>(`/nepal/sait/${category}/about`);

// ─── Panchanga elements (per-element addressable pages) ───────────────────────

export type ElementKind = "span" | "table";

export interface ElementInfo {
  id: string;
  label_ne: string;
  label_en: string;
  kind: ElementKind;
}

/** A boundary instant — machine ISO plus pre-formatted display strings. */
export interface ElementStamp {
  iso: string;
  weekday: string;
  date_label: string;
  time_label: string;
  display: string;
}

export interface ElementSpan {
  number: number;
  name: string;
  name_ne: string;
  begins: ElementStamp;
  ends: ElementStamp;
  paksha?: string;
  progress?: number;
}

export interface ElementSpansResponse {
  element: string;
  kind: "span";
  label_ne: string;
  label_en: string;
  timezone: string;
  window: { start: string; end: string };
  spans: ElementSpan[];
}

export interface ElementMonthDay {
  date_ad: string;
  bs_day: number;
  weekday_ne?: string;
  weekday_en?: string;
  sunrise?: string;
  sunset?: string;
  data: unknown;
}

export interface ElementMonthResponse {
  element: string;
  kind: ElementKind;
  label_ne: string;
  label_en: string;
  bs_year: number;
  bs_month: number;
  start_ad: string;
  days: ElementMonthDay[];
}

export interface ElementDayResponse {
  element: string;
  kind: ElementKind;
  label_ne: string;
  label_en: string;
  date_ad: string;
  sunrise?: string;
  sunset?: string;
  data: unknown;
}

export const elementKeys = {
  list: () => ["element", "list"] as const,
  spans: (name: string, start: string, end: string, location?: LocationParams) =>
    ["element", "spans", name, start, end, locationCacheKey(location)] as const,
  month: (name: string, bsYear: number, bsMonth: number, location?: LocationParams) =>
    ["element", "month", name, bsYear, bsMonth, locationCacheKey(location)] as const,
  day: (name: string, date: string, location?: LocationParams) =>
    ["element", "day", name, date, locationCacheKey(location)] as const,
};

export const fetchElements = () =>
  get<{ elements: ElementInfo[] }>(withPanchangaCacheVersion("/panchanga/elements")).then(
    (r) => r.elements,
  );

export const fetchElementSpans = (
  name: string,
  range: { start: string; end: string } | { bsYear: number; bsMonth: number },
  location?: LocationParams,
) => {
  const query =
    "bsYear" in range
      ? `bs_year=${range.bsYear}&bs_month=${range.bsMonth}`
      : `start=${range.start}&end=${range.end}`;
  return get<ElementSpansResponse>(
    appendLocation(
      withPanchangaCacheVersion(`/panchanga/element/${name}/spans?${query}`),
      location,
    ),
  );
};

export const fetchElementMonth = (
  name: string,
  bsYear: number,
  bsMonth: number,
  location?: LocationParams,
) =>
  get<ElementMonthResponse>(
    appendLocation(
      withPanchangaCacheVersion(`/panchanga/element/${name}/month/${bsYear}/${bsMonth}`),
      location,
    ),
  );

export const fetchElementDay = (name: string, dateAd: string, location?: LocationParams) =>
  get<ElementDayResponse>(
    appendLocation(
      withPanchangaCacheVersion(`/panchanga/element/${name}/day/${dateAd}?era=ad`),
      location,
    ),
  );

// ─── Convertor ────────────────────────────────────────────────────────────────

export const convertorKeys = {
  adToBs: (date: string) => ["convert", "ad-to-bs", date] as const,
  bsToAd: (date: string) => ["convert", "bs-to-ad", date] as const,
};

export const fetchAdToBs = (date: string) =>
  get<ConvertAdToBs>(`/convert/ad-to-bs/${date}`);

export const fetchBsToAd = (date: string) =>
  get<ConvertBsToAd>(`/convert/bs-to-ad/${date}`);

// ─── Special months (adhik / kshaya maas) ─────────────────────────────────────

export interface SpecialMonthsResponse {
  bs_year: number;
  adhik_maas?: {
    has_adhik_maas?: boolean;
    month_name?: string;
    full_name_en?: string;
    full_name_ne?: string;
    start_date?: string;
    end_date?: string;
    purnima_date?: string;
    note?: string;
  };
  kshaya_maas?: {
    is_kshaya?: boolean;
    month_name?: string;
  };
}

export const specialMonthsKeys = {
  year: (year: number) => ["special-months", year] as const,
};

export const fetchSpecialMonths = (year: number) =>
  get<SpecialMonthsResponse>(`/nepal/special-months/${year}`);

// ─── Kundali ──────────────────────────────────────────────────────────────────

export const kundaliKeys = {
  udaya: (date: string, era: string, location?: LocationParams) =>
    ["kundali", "udaya", date, era, locationCacheKey(location)] as const,
  atTime: (datetime: string, location?: LocationParams, ayanamsha?: string) =>
    ["kundali", "at-time", datetime, locationCacheKey(location), ayanamsha ?? "lahiri"] as const,
};

export const fetchKundali = (
  date: string,
  era: "bs" | "ad" = "ad",
  location?: LocationParams
) =>
  get<KundaliResponse>(
    appendLocation(`/kundali/${date}?era=${era}`, location)
  );

// ─── Shadbala ─────────────────────────────────────────────────────────────────

export type ShadbalaStatus =
  | "Exceptional"
  | "Strong"
  | "Adequate"
  | "Borderline"
  | "Weak";

export interface ShadbalaBreakdown {
  sthana: number;
  dig: number;
  kala: number;
  cheshta: number;
  naisargika: number;
  drik: number;
}

export interface ShadbalaSubBalas {
  sthana: Record<string, number>;
  kala: Record<string, number>;
}

export interface ShadbalaPlanet {
  key: string;
  name: string;
  name_ne: string;
  total_virupas: number;
  rupas: number;
  required: number;
  ratio: number;
  status: ShadbalaStatus;
  top_bala: string;
  weakest_bala: string;
  breakdown: ShadbalaBreakdown;
  /** Component virupas within sthana and kala (newer API). */
  sub_balas?: ShadbalaSubBalas;
  ishta_phala?: number;
  kashta_phala?: number;
}

export interface ShadbalaSummaryRef {
  key: string;
  name: string;
  name_ne: string;
  status: ShadbalaStatus;
  ratio: number;
}

export interface ShadbalaResponse {
  planets: ShadbalaPlanet[];
  summary: {
    strongest: ShadbalaSummaryRef;
    weakest: ShadbalaSummaryRef;
    average_rupas: number;
    average_virupas: number;
    meeting_threshold: number;
    total_planets: number;
    counts: Record<ShadbalaStatus, number>;
  };
  method: string;
  location?: Record<string, unknown>;
  query_instant?: string;
}

export const shadbalaKeys = {
  atTime: (datetime: string, location?: LocationParams) =>
    ["shadbala", "at-time", datetime, locationCacheKey(location)] as const,
};

export const fetchShadbala = (datetime: string, location?: LocationParams) =>
  get<ShadbalaResponse>(
    appendLocation(
      `/shadbala?datetime=${encodeURIComponent(datetime)}`,
      location
    )
  );

// ─── Kundali detail — full server-computed jyotish payload ───────────────────
// All astrology math (vargas, ashtakavarga, bhava bala, yuddha, yogas,
// avakahada, dasha tree, birth kalas) is computed by the API; the client
// only renders these blocks.

export interface DmsParts {
  rashiNum: number;
  deg: number;
  min: number;
  sec: number;
}

export type GrahaRelation = "self" | "friend" | "enemy" | "neutral";

export type GrahaDignity =
  | "exalted"
  | "moolatrikona"
  | "own"
  | "friend_house"
  | "neutral_house"
  | "enemy_house"
  | "debilitated";

export interface VargaChartEntry {
  key: string;
  vargaRashi: number;
  dms: DmsParts;
  nakshatraIndex: number;
  pada: number;
  nakshatraLord: string;
  subLord: string;
  ownerKey: string;
  relation: GrahaRelation | null;
  dignity: GrahaDignity | null;
  retrograde?: boolean;
}

export interface VargaCharts {
  divisions: number[];
  points: Record<string, { longitude: number; retrograde?: boolean }>;
  /** Keyed by division as a string ("1", "9", …). */
  entries: Record<string, VargaChartEntry[]>;
  ownedRashis: Record<string, number[]>;
}

export interface AshtakavargaSignRow {
  rashi: number;
  rashiEn: string;
  rashiNe: string;
  bindus: Record<string, number>;
  sarvashtaka: number;
}

export interface ShodhyaPindaRow {
  target: string;
  rashiPinda: number;
  grahaPinda: number;
  shodhyaPinda: number;
}

export interface AshtakavargaData {
  raw: AshtakavargaSignRow[];
  reduced: AshtakavargaSignRow[];
  shodhyaPinda: ShodhyaPindaRow[];
  signs: Record<string, number>;
}

export interface BhavaBalaHouse {
  house: number;
  madhyaLongitude: number;
  lordKey: string;
  lordName: string;
  bhavadhipati: number;
  disha: number;
  drishti: number;
  totalVirupas: number;
  totalPinda: number;
  rupas: number;
  percent: number;
}

export interface BhavaBalaData {
  houses: BhavaBalaHouse[];
  strongest: BhavaBalaHouse;
  weakest: BhavaBalaHouse;
  /** Mean house-strength % across houses ruled by each graha. */
  rulershipPercent: Record<string, number>;
  referenceVirupas: number;
}

export interface YuddhaWar {
  winner: string;
  loser: string;
  yuddhaVirupas: number;
  separationDeg: number;
}

export interface YuddhaData {
  wars: YuddhaWar[];
  byPlanet: Record<string, number>;
}

export interface KundaliYoga {
  key: string;
  nameEn: string;
  nameNe: string;
  nature: "auspicious" | "inauspicious" | "mixed" | "caution";
  present: boolean;
  descEn: string;
  descNe: string;
}

export interface BilingualValue {
  ne: string;
  en: string;
}

export interface JanmaAvakahadaData {
  nakshatra: BilingualValue;
  nakshatraIndex: number;
  pada: number;
  rashiPaya: BilingualValue;
  nakshatraPaya: BilingualValue;
  tattva: BilingualValue;
  yunja: BilingualValue;
  vashya: BilingualValue;
  tara: BilingualValue;
  gana: BilingualValue;
  akshara: BilingualValue;
  nadi: BilingualValue;
  asana: BilingualValue;
  yoni: BilingualValue;
  jati: BilingualValue;
}

export interface GhadiPalaVipala {
  ghadi: number;
  pala: number;
  vipala: number;
}

export interface KundaliBirthMeta {
  birthClock: string;
  isDayBirth: boolean | null;
  ishtaKala: GhadiPalaVipala | null;
  ahoratriIshtaKala: GhadiPalaVipala | null;
  choghadiyaAtBirth: {
    nameNe: string;
    nameEn?: string;
    quality: "शुभ" | "अशुभ" | "सामान्य";
    bad: boolean;
  } | null;
  solarCorrectionMinutes: number;
  moonNakshatra: { index: number; number: number; pada: number } | null;
  yoga: { index: number; number: number } | null;
}

export interface DashaTreeNode {
  lord: string;
  lord_ne: string;
  start: string;
  end: string;
  children?: DashaTreeNode[];
}

export interface DashaTreeResponse extends VimshottariResponse {
  tree: DashaTreeNode[];
  tree_depth: number;
  system?: string;
  cycle_years?: number;
  tribhaga?: number;
}

export interface UpagrahaDetailRow {
  key: string;
  name?: string;
  name_ne?: string;
  longitude: number;
  dms: DmsParts;
  nakshatraIndex: number;
  pada: number;
  nakshatraLord: string;
}

export interface KundaliDetailResponse {
  panchanga: PanchangaDay;
  shadbala: ShadbalaResponse;
  dasha: DashaTreeResponse | null;
  tribhagiDasha: DashaTreeResponse | null;
  yoginiDasha: DashaTreeResponse | null;
  yuddha: YuddhaData;
  bhavaBala: BhavaBalaData | null;
  ashtakavarga: AshtakavargaData | null;
  yogas: KundaliYoga[];
  vargaCharts: VargaCharts;
  upagrahas: UpagrahaDetailRow[];
  avakahada: JanmaAvakahadaData | null;
  birthMeta: KundaliBirthMeta;
  combustion: Record<string, boolean | null>;
  lagnaRashi: number | null;
  ayanamsha: string;
  location?: Record<string, unknown>;
  birth_instant: string;
}

export const kundaliDetailKeys = {
  atTime: (datetime: string, location?: LocationParams, ayanamsha?: string) =>
    ["kundali", "detail", datetime, locationCacheKey(location), ayanamsha ?? "lahiri"] as const,
};

export const fetchKundaliDetail = (
  datetime: string,
  location?: LocationParams,
  options?: { ayanamsha?: string }
) => {
  const params = new URLSearchParams();
  params.set("datetime", datetime);
  if (options?.ayanamsha) params.set("ayanamsha", options.ayanamsha);
  return get<KundaliDetailResponse>(
    appendLocation(`/kundali/detail?${params.toString()}`, location)
  );
};

export const dashaExpandKeys = {
  span: (lord: string, start: string, end: string, system = "vimshottari") =>
    ["dasha", "expand", lord, start, end, system] as const,
};

export type DashaSystem = "vimshottari" | "tribhagi" | "yogini";

export const fetchDashaChildren = (
  lord: string,
  start: string,
  end: string,
  system: DashaSystem = "vimshottari",
) => {
  const params = new URLSearchParams({ lord, start, end, system });
  return get<{ lord: string; system: string; children: DashaTreeNode[] }>(
    `/kundali/dasha/expand?${params.toString()}`
  );
};

// ─── Kundali milan (ashtakuta) — server-computed ─────────────────────────────

export type KutaId =
  | "varna"
  | "vashya"
  | "tara"
  | "yoni"
  | "maitri"
  | "gana"
  | "bhakuta"
  | "nadi";

export interface KutaRow {
  id: KutaId;
  max: number;
  obtained: number;
  boyValue: string;
  girlValue: string;
  areaOfLife: string;
  areaOfLifeNe: string;
  info: string;
  infoNe: string;
}

export interface MilanDoshaRow {
  id: "nadi" | "bhakuta" | "gana" | "tara" | "yoni" | "varna";
  labelEn: string;
  labelNe: string;
  present: boolean;
}

export interface AshtakutaResult {
  kutas: KutaRow[];
  totalObtained: number;
  totalMax: 36;
  recommendation: "excellent" | "very_good" | "middling" | "inauspicious";
  recommendationLabel: string;
  recommendationLabelNe: string;
  nadiDosha: boolean;
  nadiDoshaAdvisory?: string | null;
  nadiDoshaAdvisoryNe?: string | null;
  bhakutaUnfavorable: boolean;
  doshaAnalysis: MilanDoshaRow[];
  notes: string[];
  notesNe: string[];
}

export interface MilanPerson {
  moonLongitude: number;
  moonRashiNum: number;
  moonRashiNe: string;
  moonRashiEn: string;
  nakshatraIndex: number;
  nakshatraNe: string;
  nakshatraEn: string;
  pada: number;
  birth_instant: string;
  location?: Record<string, unknown>;
}

export interface KundaliMilanResponse {
  result: AshtakutaResult;
  boy: MilanPerson;
  girl: MilanPerson;
  ayanamsha: string;
  lang: string;
}

export interface MilanPersonQuery {
  datetime: string;
  lat?: number;
  lon?: number;
  timezone?: string;
}

export const milanKeys = {
  match: (
    boy: MilanPersonQuery,
    girl: MilanPersonQuery,
    ayanamsha?: string,
    lang?: string
  ) =>
    [
      "kundali",
      "milan",
      boy.datetime,
      `${boy.lat ?? ""},${boy.lon ?? ""},${boy.timezone ?? ""}`,
      girl.datetime,
      `${girl.lat ?? ""},${girl.lon ?? ""},${girl.timezone ?? ""}`,
      ayanamsha ?? "lahiri",
      lang ?? "ne",
    ] as const,
};

export const fetchKundaliMilan = (
  boy: MilanPersonQuery,
  girl: MilanPersonQuery,
  options?: { ayanamsha?: string; lang?: string }
) => {
  const params = new URLSearchParams();
  params.set("boy_datetime", boy.datetime);
  params.set("girl_datetime", girl.datetime);
  if (boy.lat != null) params.set("boy_lat", String(boy.lat));
  if (boy.lon != null) params.set("boy_lon", String(boy.lon));
  if (boy.timezone) params.set("boy_timezone", boy.timezone);
  if (girl.lat != null) params.set("girl_lat", String(girl.lat));
  if (girl.lon != null) params.set("girl_lon", String(girl.lon));
  if (girl.timezone) params.set("girl_timezone", girl.timezone);
  if (options?.ayanamsha) params.set("ayanamsha", options.ayanamsha);
  if (options?.lang) params.set("lang", options.lang);
  return get<KundaliMilanResponse>(`/kundali/milan?${params.toString()}`);
};

// ─── Kundali interpretation report (streamed, deterministic) ──────────────────

/** How strongly the supporting factors agree for one insight. */
export type ReportConfidence = "strong" | "moderate" | "mixed" | "tentative";

export interface ReportItem {
  label: string;
  confidence: ReportConfidence;
  factors?: string[];
  text: string;
  polarity?: "benefic" | "mixed" | "caution";
}

export interface ReportSection {
  kind: "section";
  index: number;
  total: number;
  id: string;
  title_en: string;
  title_ne: string;
  body: string[];
  confidence?: ReportConfidence;
  factors?: string[];
  items?: ReportItem[];
  optional?: boolean;
}

export interface ReportRashiRef {
  sign: number;
  name_en: string;
  name_ne: string;
}

export interface ReportMeta {
  kind: "meta";
  lagna: ReportRashiRef;
  moon_sign: ReportRashiRef;
  sun_sign: ReportRashiRef;
  nakshatra?: {
    name_en: string;
    name_ne: string;
    pada: number;
    lord_en: string;
  };
  mahadasha: {
    lord: string;
    lord_en: string;
    lord_ne: string;
    ends?: string;
    antardasha?: string;
    antardasha_en?: string;
    antardasha_ne?: string;
    antardasha_ends?: string;
    window?: [string, string];
  } | null;
  yoga_count: number;
  generated_at: string;
  method: string;
  disclaimer: string;
}

export interface ReportHeader {
  kind: "header";
  ayanamsha: string;
  location: Record<string, unknown>;
  birth_instant: string;
}

export type ReportRecord =
  | ReportHeader
  | ReportMeta
  | ReportSection
  | { kind: "done"; total: number };

/**
 * Stream the deterministic kundali report as NDJSON, invoking `onRecord` for
 * each line (header, meta, one per section, then done) so the UI can render
 * sections progressively. Pass an AbortSignal to cancel an in-flight report.
 */
export async function streamKundaliReport(
  datetime: string,
  location: LocationParams | undefined,
  options: { ayanamsha?: string; lang?: string; force?: boolean } | undefined,
  onRecord: (record: ReportRecord) => void,
  signal?: AbortSignal
): Promise<{ fromCache: boolean }> {
  const params = new URLSearchParams();
  params.set("datetime", datetime);
  if (options?.ayanamsha) params.set("ayanamsha", options.ayanamsha);
  if (options?.lang) params.set("lang", options.lang);
  if (options?.force) params.set("force", "true");
  const path = appendLocation(`/kundali/report?${params.toString()}`, location);

  const res = await fetch(`${DATA_BASE}${path}`, {
    signal,
    headers: { Accept: "application/x-ndjson" },
  });
  if (!res.ok || !res.body) {
    throw new Error(`API ${res.status}: ${path}`);
  }

  const fromCache = res.headers.get("X-Report-Cache") === "hit";

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const flush = (chunk: string, final = false) => {
    buffer += chunk;
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line) onRecord(JSON.parse(line) as ReportRecord);
    }
    if (final && buffer.trim()) {
      onRecord(JSON.parse(buffer.trim()) as ReportRecord);
      buffer = "";
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    flush(decoder.decode(value, { stream: true }));
  }
  flush(decoder.decode(), true);

  return { fromCache };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PushkaraNavamshaHit {
  degree?: number;
  degree_dms?: string;
  local_time?: string;
  local_time_short?: string;
}

export interface LagnaSpan {
  number?: number;
  name?: string;
  name_ne?: string;
  degree_in_rashi?: number;
  longitude?: number;
  start_time?: string;
  end_time?: string;
  start_ghati_clock?: string;
  start_hours_clock?: string;
  start_local_time?: string;
  start_local_time_short?: string;
  end_ghati_clock?: string;
  end_hours_clock?: string;
  end_local_time?: string;
  end_local_time_short?: string;
  pushkara_navamsha?: PushkaraNavamshaHit[];
}

export interface RashiSpan {
  number?: number;
  name?: string;
  name_ne?: string;
  end_local_time?: string;
  end_local_time_short?: string;
  end_hours_clock?: string;
  end_ghati_clock?: string;
}

export interface NakshatraPadaSpan {
  nakshatra_number?: number;
  nakshatra_name?: string;
  nakshatra_name_ne?: string;
  pada?: number;
  pada_ne?: string;
  end_local_time?: string;
  end_local_time_short?: string;
  end_hours_clock?: string;
  end_ghati_clock?: string;
}

export interface SuryaNakshatra {
  number?: number;
  name?: string;
  name_ne?: string;
}

export interface BalamChip {
  number?: number;
  name?: string;
  name_ne?: string;
}

export interface BalamTill {
  end_local_time_short?: string;
  end_local_time?: string;
  end_hours_clock?: string;
}

export interface BalamBlock {
  till?: BalamTill | null;
  set1?: BalamChip[];
  set2?: BalamChip[];
}

export type NavataraTone = "best" | "good" | "neutral" | "bad" | "worst";

export interface NavataraRow {
  index: number;
  name: string;
  name_en?: string;
  tara: string;
  quality: string;
  tone: NavataraTone;
  tara_num: number;
}

export interface NavataraTableBlock {
  moon_index: number;
  moon_label: string;
  moon_label_en?: string;
  rows: NavataraRow[];
}

export interface ApiHoraSlot {
  index: number;
  phase: "day" | "night";
  phase_ne: string;
  planet: string;
  planet_ne: string;
  planet_en: string;
  quality_ne: "शुभ" | "अशुभ";
  tone: "good" | "bad";
  bad: boolean;
  start_local_time_short: string;
  end_local_time_short: string;
  start_g: number;
  end_g: number;
}

export interface PanchakaSegment {
  name?: string;
  name_ne?: string;
  good?: boolean;
  start_local_time_short?: string;
  end_local_time_short?: string;
  start_local_time?: string;
  end_local_time?: string;
  start_hours_clock?: string;
  end_hours_clock?: string;
}

export interface UdayaLagnaRow {
  number?: number;
  name?: string;
  name_ne?: string;
  start_local_time_short?: string;
  end_local_time_short?: string;
  start_local_time?: string;
  end_local_time?: string;
  start_hours_clock?: string;
  end_hours_clock?: string;
  pushkara_navamsha?: PushkaraNavamshaHit[];
}

export interface NivasShoolDirection {
  direction_key?: string;
  name_en?: string;
  name_ne?: string;
}

export interface NivasShoolSegment extends NivasShoolDirection {
  key?: string;
  symbol?: string;
  name_en?: string;
  name_ne?: string;
  subtitle_en?: string;
  subtitle_ne?: string;
  is_auspicious?: boolean;
  end_local_time_short?: string;
  until_full_night?: boolean;
  start_local_time_short?: string;
  loka?: string;
}

export interface NivasShoolBlock {
  homahuti?: { current?: NivasShoolSegment; segments?: NivasShoolSegment[] };
  disha_shool?: NivasShoolDirection & { auspicious_directions?: NivasShoolDirection[] };
  rahu_vasa?: NivasShoolDirection;
  agnivasa?: { current?: NivasShoolSegment; segments?: NivasShoolSegment[] };
  shivavasa?: { current?: NivasShoolSegment; segments?: NivasShoolSegment[] };
  chandra_vasa?: { current?: NivasShoolSegment; segments?: NivasShoolSegment[] };
  bhadravasa?: { active?: boolean; segments?: NivasShoolSegment[] };
  kumbha_chakra?: { current?: NivasShoolSegment; segments?: NivasShoolSegment[] };
}

export interface MuhurtaNowBlock {
  active?: boolean;
  start_time?: string;
  end_time?: string;
  start_local?: string;
  end_local?: string;
  label_ne?: string;
  label_en?: string;
}

export interface PanchangaAtTime {
  mode: "ephemeris";
  query_instant: string;
  query_instant_local?: string;
  panchanga_date_ad?: string;
  date_ad?: string;
  date_bs?: string;
  before_sunrise_of_civil_day?: boolean;
  bs_date?: { year: number; month: number; day: number };
  vaara?: { name_ne?: string; name_english?: string };
  weekday?: string;
  sunrise?: { local_time_short?: string } | string;
  sunset?: { local_time_short?: string } | string;
  tithi?: PanchangaDay["tithi"];
  nakshatra?: PanchangaDay["nakshatra"];
  yoga?: PanchangaDay["yoga"];
  karana?: PanchangaDay["karana"];
  planets?: Record<string, PlanetInfo | string>;
  lagna?: PanchangaDay["lagna"];
  muhurta?: PanchangaDay["muhurta"];
  muhurta_now?: {
    rahu_kalam?: MuhurtaNowBlock;
    yamaganda?: MuhurtaNowBlock;
    gulika?: MuhurtaNowBlock;
    abhijit?: MuhurtaNowBlock;
  };
  planets_anchor?: { type?: string; local_time?: string; label_ne?: string; label_en?: string };
  location?: PanchangaDay["location"];
}

export interface PanchangaDay {
  mode?: "ephemeris" | "udaya";
  query_instant?: string;
  query_instant_local?: string;
  panchanga_date_ad?: string;
  before_sunrise_of_civil_day?: boolean;
  muhurta_now?: PanchangaAtTime["muhurta_now"];
  planets_anchor?: PanchangaAtTime["planets_anchor"];
  location?: { name?: string; lat?: number; lon?: number; timezone?: string; city_id?: number };
  date_bs?: string;
  date_ad?: string;
  bs_date?: { year: number; month: number; day: number; month_name_ne?: string };
  samvatsara?: {
    key: string;
    name_en: string;
    name_ne: string;
    cycle: number;
    deity: string;
    index: number;
  };
  display?: { bs_ne?: string; gregorian_en?: string; ns_ne?: string };
  weekday?: string;
  sunrise?: { local_time_short?: string } | string;
  sunset?: { local_time_short?: string } | string;
  moonrise?: { local?: string; local_time_short?: string };
  moonset?: { local?: string; local_time_short?: string };
  tithi?: { name?: string; name_ne?: string; end_ghati_clock?: string; next?: { name_ne?: string } };
  nakshatra?: { name?: string; name_ne?: string; next?: { name_ne?: string } };
  yoga?: { name?: string; name_ne?: string; next?: { name_ne?: string } };
  karana?: { name?: string; name_ne?: string; next?: { name_ne?: string } };
  paksha?: { label_ne?: string; label_en?: string; is_adhik?: boolean };
  paksha_ne?: string;
  chandra_rashi?: { name_ne?: string; number?: number; name?: string };
  chandra_rashi_spans?: RashiSpan[];
  nakshatra_pada_spans?: NakshatraPadaSpan[];
  surya_rashi?: { name_ne?: string; number?: number; name?: string };
  surya_rashi_ne?: string;
  surya_nakshatra?: SuryaNakshatra;
  chandrabalam?: BalamBlock;
  tarabalam?: BalamBlock;
  tarabala_table?: NavataraTableBlock;
  chandrabala_table?: NavataraTableBlock;
  hora?: ApiHoraSlot[];
  hora_day?: ApiHoraSlot[];
  choghadiya?: Array<{
    name_ne: string;
    start_g: number;
    end_g: number;
    bad?: boolean;
    phase?: string;
  }>;
  panchaka_rahita?: PanchakaSegment[];
  udaya_lagna?: UdayaLagnaRow[];
  ritu?: { name?: string; name_ne?: string; season?: string } | string;
  ritu_ne?: string;
  ritu_pauranik?: { name?: string; name_ne?: string; season?: string };
  ritu_vedic?: { name?: string; name_ne?: string; season?: string };
  lagna?: { name?: string; name_ne?: string; degree_in_rashi?: number; longitude?: number };
  lagna_spans?: LagnaSpan[];
  detail?: {
    lagna_spans?: LagnaSpan[];
    day_ghati?: number;
    choghadiya?: Array<{
      name_ne: string;
      start_g: number;
      end_g: number;
      bad?: boolean;
      phase?: string;
    }>;
    [key: string]: unknown;
  };
  dinamaan?: {
    label_en?: string;
    label_ne?: string;
    label_en_full?: string;
    label_ne_full?: string;
    hours?: number;
    minutes?: number;
    seconds?: number;
  };
  ratrimana?: {
    label_en?: string;
    label_ne?: string;
    label_en_full?: string;
    label_ne_full?: string;
    hours?: number;
    minutes?: number;
    seconds?: number;
  };
  madhyahna?: { local_time_short?: string; local_time?: string };
  aayan?: { name?: string; name_ne?: string };
  aayan_pauranik?: { name?: string; name_ne?: string };
  aayan_vedic?: { name?: string; name_ne?: string };
  lahiri_ayanamsa?: { degrees?: number };
  festivals?: Festival[];
  is_public_holiday?: boolean;
  sun?: { sunrise?: string; sunset?: string };
  moon?: { rise?: string; set?: string };
  muhurta?: {
    rahu_kalam?: { start_time?: string; end_time?: string };
    abhijit?: { start_time?: string; end_time?: string };
    yamaganda?: { start_time?: string; end_time?: string };
    gulika?: { start_time?: string; end_time?: string };
  };
  nivas_shool?: NivasShoolBlock;
  planets?: Record<string, PlanetInfo | string>;
}

export interface PlanetInfo {
  rashi?: string;
  rashi_ne?: string;
  rashi_name?: string;
  rashi_no?: number;
  degrees?: number;
  deg_in_rashi?: number;
  dms_in_rashi?: string;
  retrograde?: boolean;
  is_retrograde?: boolean;
  longitude?: number;
  speed?: number;
  motion?: string;
}

export interface Festival {
  id: string;
  name?: string;
  name_en?: string;
  name_ne?: string;
  type?: string;
  category?: string;
  is_public_holiday?: boolean;
  start_date?: string;
  end_date?: string;
  bs_start_date?: string;
  bs_end_date?: string;
  duration_days?: number;
  importance?: string;
  notes?: string;
}

export interface MonthCalendar {
  year_bs: number;
  month_bs: number;
  month_name: string;
  month_name_ne?: string;
  month_start_ad: string;
  month_length: number;
  mode?: "ephemeris" | "udaya";
  clock?: string;
  calendar: CalendarDay[];
}

export interface YearCalendar {
  year_bs: number;
  year_length: number;
  location?: PanchangaDay["location"];
  months: MonthCalendar[];
  calendar: CalendarDay[];
}

/**
 * A panchanga aṅga (tithi / nakshatra / yoga / karaṇa) as returned in the
 * month-calendar nested `panchanga` block. Unlike `PanchangaDay`'s aṅga shape,
 * the calendar endpoint carries plain `start`/`end` datetime strings
 * (e.g. "2026-06-20 16:02") and string `next`/`next_ne` names — including
 * end-times for yoga and karaṇa.
 */
export interface CalendarDayAnga {
  name?: string;
  name_ne?: string;
  start?: string;
  end?: string;
  next?: string;
  next_ne?: string;
}

/** Full per-day detail embedded under each month-calendar day when `full=true`. */
export interface CalendarDayDetail {
  paksha?: string;
  paksha_ne?: string;
  aayan?: string;
  aayan_ne?: string;
  ayana_mark?: "उ" | "द";
  tithi?: CalendarDayAnga;
  nakshatra?: CalendarDayAnga;
  yoga?: CalendarDayAnga;
  karana?: CalendarDayAnga;
  surya_rashi?: string;
  surya_rashi_ne?: string;
  chandra_rashi?: string;
  chandra_rashi_ne?: string;
  sun?: { sunrise?: string; sunset?: string; noon?: string };
  moon?: { rise?: string; set?: string };
  dinamaan?: string;
  ritu_ne?: string;
  lunar_month?: LunarLayer & { name_ne?: string };
  lagna_spans?: LagnaSpan[];
  udaya_lagna?: UdayaLagnaRow[];
  planets?: Record<string, PlanetInfo>;
  planets_anchor?: {
    type?: string;
    local_time?: string;
    label_ne?: string;
    label_en?: string;
  };
  solar_corrections?: {
    belaantar?: {
      minutes?: number;
      seconds?: number;
      sign?: "dhan" | "rin";
      sign_ne?: string;
      label_ne?: string;
      name_ne?: string;
    };
    deshaantar?: {
      minutes?: number;
      seconds?: number;
      sign?: "dhan" | "rin";
      sign_ne?: string;
      label_ne?: string;
      name_ne?: string;
    };
    ishtakaal_note_ne?: string;
    sunrise_includes_corrections?: boolean;
  };
  /**
   * Both lunar reckonings, as merged by the backend's
   * `merge_lunar_month_for_day()`. `purnimant` is the model Nepali patro uses
   * (months run pūrṇimā→pūrṇimā); `amanta` runs new-moon→new-moon.
   */
  lunar_calendar?: {
    adhik_maas?: { year_has_adhik?: boolean; name?: string; name_ne?: string };
    amanta?: LunarLayer;
    purnimant?: LunarLayer;
    festival_masa?: string;
  };
}

export interface LunarLayer {
  name?: string;
  full_name?: string;
  is_adhik?: boolean;
  type?: string;
  paksha_model?: string;
  window_start?: string;
  window_end?: string;
  solar_name?: string;
  festival_masa?: string;
}

export interface CalendarDay {
  day: number;
  date_ad: string;
  weekday: string;
  weekday_en?: string;
  weekday_ne?: string;
  tithi: string;
  tithi_ne?: string;
  paksha?: string;
  paksha_ne?: string;
  nakshatra?: string;
  nakshatra_ne?: string;
  yoga?: string;
  yoga_ne?: string;
  karana?: string;
  karana_ne?: string;
  chandra_rashi?: string;
  chandra_rashi_ne?: string;
  sunrise?: string;
  sunset?: string;
  aayan?: string;
  aayan_ne?: string;
  ayana_mark?: "उ" | "द";
  moonrise?: string;
  moonrise_local?: string;
  moonset?: string;
  moonset_local?: string;
  festivals: string[];
  /** Embedded full panchanga (present when the month is fetched with `full=true`). */
  panchanga?: CalendarDayDetail;
  mode?: "ephemeris";
  query_instant?: string;
  /** Leading/trailing cells from adjacent BS months in the home grid. */
  outsideMonth?: boolean;
}

export interface PatroMonth {
  bs_year: number;
  bs_month: number;
  bs_month_name: string;
  bs_month_name_ne?: string;
  month_start: string;
  month_length: number;
  location: object;
  days: PatroDay[];
}

export interface PatroDay {
  bs_day: number;
  date: string;
  festivals: Festival[];
  panchanga?: {
    vaara?: { name_ne?: string; name_english?: string };
    tithi?: { name?: string; name_ne?: string };
    nakshatra?: { name?: string };
    sunrise?: string;
    sunset?: string;
    markers?: { is_public_holiday?: boolean };
  };
  weekday?: string;
  weekday_ne?: string;
  tithi?: string;
  tithi_ne?: string;
  nakshatra?: string;
  sunrise?: string;
  sunset?: string;
}

export interface HolidaysResponse {
  bs_year?: number;
  era: string;
  gregorian_range?: { start: string; end: string };
  count: number;
  holidays: Holiday[];
}

export interface FestivalsResponse {
  bs_year?: number;
  era: string;
  gregorian_range?: { start: string; end: string };
  count: number;
  festivals: Festival[];
}

export interface Holiday {
  id: string;
  name_en?: string;
  name_ne?: string;
  start_date: string;
  end_date: string;
  bs_start_date?: string;
  bs_end_date?: string;
  duration_days?: number;
  type?: string;
  category?: string;
  importance?: string;
  is_public_holiday?: boolean;
  notes?: string;
}

export interface ConvertAdToBs {
  ad_date: string;
  bs_year: number;
  bs_month: number;
  bs_day: number;
  bs_date: string;
  bs_month_name: string;
  bs_month_name_ne: string;
  weekday: string;
}

export interface ConvertBsToAd {
  bs_date: string;
  bs_year: number;
  bs_month: number;
  bs_day: number;
  bs_month_name: string;
  bs_month_name_ne: string;
  ad_date: string;
  weekday: string;
}

export interface KundaliResponse {
  date_bs?: string;
  date_ad?: string;
  location?: PanchangaDay["location"];
  sunrise?: { local_time_short?: string };
  planets?: Record<string, PlanetInfo | string>;
  planets_detail?: Record<string, PlanetInfo & { rashi_name?: string; is_retrograde?: boolean }>;
  lagna_note?: string;
}

export interface CalendarHeader {
  bikram_sambat: string;
  bikram_sambat_month: string;
  gregorian: string;
  lunar_month: string;
  shaka_sambat: string;
  nepal_sambat: string;
}
