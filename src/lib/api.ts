const BASE =
  import.meta.env.VITE_API_BASE_URL ?? "https://193-123-67-133.sslip.io";

/** Shared API base URL — also used by the auth client. */
export const API_BASE = BASE;

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
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

export interface City {
  id: number;
  name: string;
  ascii_name: string;
  lat: number;
  lon: number;
  country: string;
  population: number;
  timezone: string;
}

export interface CitiesSearchResponse {
  query: string;
  count: number;
  cities: City[];
}

export const cityKeys = {
  search: (q: string) => ["cities", "search", q] as const,
  popular: () => ["cities", "popular"] as const,
};

export const searchCities = (q: string, limit = 10) =>
  get<CitiesSearchResponse>(
    `/nepal/cities/search?q=${encodeURIComponent(q)}&limit=${limit}`
  );

export const fetchPopularCities = () =>
  get<{ count: number; cities: City[] }>("/nepal/cities/popular");

// ─── Panchanga ────────────────────────────────────────────────────────────────

export const panchangaKeys = {
  today: (location?: LocationParams) =>
    ["panchanga", "today", locationCacheKey(location)] as const,
  day: (date: string, era: string, location?: LocationParams) =>
    ["panchanga", "day", date, era, locationCacheKey(location)] as const,
  nepalDay: (date: string, location?: LocationParams) =>
    ["panchanga", "nepal", date, locationCacheKey(location)] as const,
  month: (year: number, month: number, location?: LocationParams, full = true) =>
    ["panchanga", "month", year, month, locationCacheKey(location), full ? "full" : "lite"] as const,
  monthAtClock: (
    year: number,
    month: number,
    clock: string,
    location?: LocationParams
  ) =>
    ["panchanga", "month", "clock", year, month, clock, locationCacheKey(location)] as const,
  atTime: (datetime: string, location?: LocationParams) =>
    ["panchanga", "at-time", datetime, locationCacheKey(location)] as const,
  header: (year: number, month: number, location?: LocationParams) =>
    ["calendar", "header", year, month, locationCacheKey(location)] as const,
};

export const fetchTodayPanchanga = (location?: LocationParams) => {
  const today = new Date().toISOString().split("T")[0];
  return get<PanchangaDay>(
    appendLocation(`/panchanga/${today}?era=ad&festivals=true&detail=true`, location)
  );
};

export const fetchPanchanga = (
  date: string,
  era: "bs" | "ad" = "bs",
  location?: LocationParams
) =>
  get<PanchangaDay>(
    appendLocation(`/panchanga/${date}?era=${era}&festivals=true&detail=true`, location)
  );

export const fetchNepalPanchanga = (dateAd: string, location?: LocationParams) =>
  get<PanchangaDay>(
    appendLocation(`/nepal/panchanga/${dateAd}?era=ad`, location)
  );

export const fetchPanchangaAtTime = (
  datetime: string,
  location?: LocationParams,
  options?: { ayanamsha?: string }
) => {
  const params = new URLSearchParams();
  params.set("datetime", datetime);
  if (options?.ayanamsha) params.set("ayanamsha", options.ayanamsha);
  return get<PanchangaDay>(
    appendLocation(`/panchanga/at-time?${params.toString()}`, location)
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

function normalizeMonthDay(day: RawMonthDay): CalendarDay {
  const nested = day.panchanga;
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
    moonrise: day.moonrise ?? nested?.moon?.rise,
    moonrise_local: day.moonrise_local,
    moonset: day.moonset ?? nested?.moon?.set,
    moonset_local: day.moonset_local,
  };
}

export const fetchMonthCalendar = async (
  year: number,
  month: number,
  location?: LocationParams,
  options?: { clock?: string; full?: boolean }
): Promise<MonthCalendar> => {
  const full = options?.full !== false;
  const params = new URLSearchParams();
  if (full) params.set("full", "true");
  if (options?.clock) params.set("clock", options.clock);
  const qs = params.toString();
  const path = appendLocation(
    `/panchanga/${year}/${month}${qs ? `?${qs}` : ""}`,
    location
  );
  const data = await get<MonthCalendar & { calendar: RawMonthDay[] }>(path);
  return {
    ...data,
    calendar: data.calendar.map(normalizeMonthDay),
  };
};

export const fetchCalendarHeader = (year: number, month: number) =>
  get<CalendarHeader>(`/calendar/header/${year}/${month}`);

// ─── Patro ────────────────────────────────────────────────────────────────────

export const patroKeys = {
  month: (year: number, month: number) => ["patro", "month", year, month] as const,
};

export const fetchPatroMonth = (year: number, month: number) =>
  get<PatroMonth>(`/nepal/patro/${year}/${month}`);

// ─── Holidays & Festivals ─────────────────────────────────────────────────────

export const holidayKeys = {
  holidays: (year: number) => ["holidays", year] as const,
  festivals: (year: number) => ["festivals", year] as const,
};

export const fetchHolidays = (year: number) =>
  get<HolidaysResponse>(`/nepal/holidays?year=${year}&era=bs`);

export const fetchFestivals = (year: number) =>
  get<FestivalsResponse>(`/nepal/festivals?year=${year}&era=bs`);

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
  mahadasha: {
    lord: string;
    lord_en: string;
    lord_ne: string;
    antardasha?: string;
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
  options: { ayanamsha?: string } | undefined,
  onRecord: (record: ReportRecord) => void,
  signal?: AbortSignal
): Promise<void> {
  const params = new URLSearchParams();
  params.set("datetime", datetime);
  if (options?.ayanamsha) params.set("ayanamsha", options.ayanamsha);
  const path = appendLocation(`/kundali/report?${params.toString()}`, location);

  const res = await fetch(`${BASE}${path}`, {
    signal,
    headers: { Accept: "application/x-ndjson" },
  });
  if (!res.ok || !res.body) {
    throw new Error(`API ${res.status}: ${path}`);
  }

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
}

// ─── Types ────────────────────────────────────────────────────────────────────

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
  panchaka_rahita?: PanchakaSegment[];
  udaya_lagna?: UdayaLagnaRow[];
  ritu?: { name_ne?: string; season?: string } | string;
  ritu_ne?: string;
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
  dinamaan?: { label_en?: string; label_ne?: string };
  aayan?: { name?: string; name_ne?: string };
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
