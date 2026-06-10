const BASE = "https://193-123-67-133.sslip.io";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

// ─── Panchanga ────────────────────────────────────────────────────────────────

export const panchangaKeys = {
  today: () => ["panchanga", "today"] as const,
  day: (date: string, era: string) => ["panchanga", "day", date, era] as const,
  nepalDay: (date: string) => ["panchanga", "nepal", date] as const,
  month: (year: number, month: number) => ["panchanga", "month", year, month] as const,
  header: (year: number, month: number) => ["calendar", "header", year, month] as const,
};

export const fetchTodayPanchanga = () => {
  const today = new Date().toISOString().split("T")[0];
  return get<PanchangaDay>(`/panchanga/${today}?era=ad&festivals=true`);
};

export const fetchPanchanga = (date: string, era: "bs" | "ad" = "bs") =>
  get<PanchangaDay>(`/panchanga/${date}?era=${era}&festivals=true`);

export const fetchNepalPanchanga = (dateAd: string) =>
  get<PanchangaDay>(`/nepal/panchanga/${dateAd}?era=ad`);

export const fetchMonthCalendar = (year: number, month: number) =>
  get<MonthCalendar>(`/panchanga/${year}/${month}`);

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

// ─── Kundali ──────────────────────────────────────────────────────────────────

export const kundaliKeys = {
  kundali: (date: string, era: string) => ["kundali", date, era] as const,
};

export const fetchKundali = (date: string, era: "bs" | "ad" = "ad") =>
  get<KundaliResponse>(`/kundali/${date}?era=${era}`);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PanchangaDay {
  date_bs?: string;
  date_ad?: string;
  bs_date?: { year: number; month: number; day: number; month_name_ne?: string };
  display?: { bs_ne?: string; gregorian_en?: string; ns_ne?: string };
  weekday?: string;
  sunrise?: { local_time_short?: string } | string;
  sunset?: { local_time_short?: string } | string;
  moonrise?: { local_time_short?: string };
  moonset?: { local_time_short?: string };
  tithi?: { name?: string; name_ne?: string; end_ghati_clock?: string; next?: { name_ne?: string } };
  nakshatra?: { name?: string; name_ne?: string; next?: { name_ne?: string } };
  yoga?: { name?: string; name_ne?: string; next?: { name_ne?: string } };
  karana?: { name?: string; name_ne?: string; next?: { name_ne?: string } };
  paksha?: { label_ne?: string; label_en?: string; is_adhik?: boolean };
  paksha_ne?: string;
  chandra_rashi?: { name_ne?: string };
  ritu?: { name_ne?: string; season?: string };
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
  degrees?: number;
  retrograde?: boolean;
  longitude?: number;
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
  calendar: CalendarDay[];
}

export interface CalendarDay {
  day: number;
  date_ad: string;
  weekday: string;
  weekday_en?: string;
  weekday_ne?: string;
  tithi: string;
  tithi_ne?: string;
  nakshatra?: string;
  sunrise?: string;
  sunset?: string;
  festivals: string[];
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
  sunrise?: { local_time_short?: string };
  planets?: Record<string, PlanetInfo>;
  planets_detail?: Record<string, object>;
}

export interface CalendarHeader {
  bikram_sambat: string;
  bikram_sambat_month: string;
  gregorian: string;
  lunar_month: string;
  shaka_sambat: string;
  nepal_sambat: string;
}
