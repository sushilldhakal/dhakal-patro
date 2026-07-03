import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";

export type DashaLord =
  | "ketu"
  | "venus"
  | "sun"
  | "moon"
  | "mars"
  | "rahu"
  | "jupiter"
  | "saturn"
  | "mercury";

/** Fixed Vimshottari sequence — total 120 years. */
export const DASHA_SEQUENCE: DashaLord[] = [
  "ketu", "venus", "sun", "moon", "mars", "rahu", "jupiter", "saturn", "mercury",
];

export const DASHA_YEARS: Record<DashaLord, number> = {
  ketu: 7,
  venus: 20,
  sun: 6,
  moon: 10,
  mars: 7,
  rahu: 18,
  jupiter: 16,
  saturn: 19,
  mercury: 17,
};

export const DASHA_LORD_NE: Record<DashaLord, string> = {
  ketu: "केतु",
  venus: "शुक्र",
  sun: "सूर्य",
  moon: "चन्द्र",
  mars: "मङ्गल",
  rahu: "राहु",
  jupiter: "गुरु",
  saturn: "शनि",
  mercury: "बुध",
};

const NE_TO_LORD: Record<string, DashaLord> = {
  केतु: "ketu",
  शुक्र: "venus",
  सूर्य: "sun",
  चन्द्र: "moon",
  मङ्गल: "mars",
  मंगल: "mars",
  राहु: "rahu",
  गुरु: "jupiter",
  बृहस्पति: "jupiter",
  शनि: "saturn",
  बुध: "mercury",
};

const NAKSHATRA_SPAN_DEG = 360 / 27;
const YEAR_DAYS = 365.2425;

export const DASHA_YEAR_MS = YEAR_DAYS * 86400000;

export const DASHA_LORD_EN: Record<DashaLord, string> = {
  ketu: "Ketu",
  venus: "Shukra",
  sun: "Surya",
  moon: "Chandra",
  mars: "Mangal",
  rahu: "Rahu",
  jupiter: "Guru",
  saturn: "Shani",
  mercury: "Budha",
};

/** Resolve a DashaLord from an API `lord` key or Nepali name. */
export function dashaLordFromString(value?: string): DashaLord | undefined {
  if (!value) return undefined;
  const key = value.toLowerCase() as DashaLord;
  if (DASHA_YEARS[key] != null) return key;
  return NE_TO_LORD[value];
}

/** One dasha period at any level of the Vimshottari hierarchy. */
export interface DashaSpan {
  lord: DashaLord;
  start: Date;
  end: Date;
}

/**
 * Sub-periods of a Vimshottari span: nine parts proportional to the dasha
 * years, starting from the span's own lord. Works at every level —
 * maha→antar, antar→pratyantar, pratyantar→sukshma, sukshma→prana.
 */
export function subdivideDasha(span: DashaSpan): DashaSpan[] {
  const total = span.end.getTime() - span.start.getTime();
  const startIdx = DASHA_SEQUENCE.indexOf(span.lord);
  let cursor = span.start.getTime();
  return DASHA_SEQUENCE.map((_, i) => {
    const lord = DASHA_SEQUENCE[(startIdx + i) % DASHA_SEQUENCE.length]!;
    const start = cursor;
    cursor += (total * DASHA_YEARS[lord]) / 120;
    return { lord, start: new Date(start), end: new Date(cursor) };
  });
}

const MONTH_DAYS = 30.4369;
/** Sub-day unit: 1 yoga ≈ 53m 20s (1/27 of a civil day). */
const YOGA_MS = 86400000 / 27;

export interface DashaDurationParts {
  years: number;
  months: number;
  days: number;
  yogas: number;
}

/** Vimshottari-style breakdown: years, months, days, and sub-day yogas. */
export function breakdownDashaDuration(ms: number): DashaDurationParts {
  const totalDays = ms / 86400000;
  const years = Math.floor(totalDays / YEAR_DAYS);
  const remDaysAfterYears = totalDays - years * YEAR_DAYS;
  const months = Math.floor(remDaysAfterYears / MONTH_DAYS);
  const remDaysAfterMonths = remDaysAfterYears - months * MONTH_DAYS;
  const days = Math.round(remDaysAfterMonths);
  const accountedMs = (years * YEAR_DAYS + months * MONTH_DAYS + days) * 86400000;
  const remMs = Math.max(0, ms - accountedMs);
  const yogas = remMs >= YOGA_MS / 2 ? Math.round(remMs / YOGA_MS) : 0;
  return { years, months, days, yogas };
}

/** Long duration label for अवधि (BS) column. */
export function formatDashaDurationParts(
  parts: DashaDurationParts,
  lang: "ne" | "en",
): string {
  const chunks: string[] = [];
  const unit =
    lang === "en"
      ? { y: "y", m: "m", d: "d", yog: "yoga" }
      : { y: " वर्ष", m: " मास", d: " दिन", yog: " योग" };
  if (parts.years > 0) chunks.push(`${parts.years}${unit.y}`);
  if (parts.months > 0) chunks.push(`${parts.months}${unit.m}`);
  if (parts.days > 0 || chunks.length === 0) chunks.push(`${parts.days}${unit.d}`);
  if (parts.yogas > 0) chunks.push(`${parts.yogas}${unit.yog}`);
  return chunks.join(lang === "en" ? " " : "");
}

/** Compact duration label: "16y 11m", "3m 12d", "103d", "18h". */
export function formatDashaDuration(ms: number, lang: "ne" | "en"): string {
  const days = ms / 86400000;
  const unit =
    lang === "en"
      ? { y: "y", m: "m", d: "d", h: "h", sep: " " }
      : { y: " वर्ष", m: " महिना", d: " दिन", h: " घण्टा", sep: " " };
  if (days >= 360) {
    const years = ms / DASHA_YEAR_MS;
    const y = Math.floor(years);
    const m = Math.floor((years - y) * 12);
    return m > 0 ? `${y}${unit.y}${unit.sep}${m}${unit.m}` : `${y}${unit.y}`;
  }
  if (days >= 60) {
    const m = Math.floor(days / 30.44);
    const d = Math.round(days - m * 30.44);
    return d > 0 ? `${m}${unit.m}${unit.sep}${d}${unit.d}` : `${m}${unit.m}`;
  }
  if (days >= 2) return `${Math.round(days)}${unit.d}`;
  return `${Math.round(ms / 3600000)}${unit.h}`;
}

export interface DashaPeriod {
  lord: DashaLord;
  lordNe: string;
  startDate: Date;
  endDate: Date;
  years: number;
}

export interface VimshottariResult {
  nakshatraIndex: number;
  mahadashaLord: DashaLord;
  mahadashaLordNe: string;
  balanceYears: number;
  balanceLabel: string;
  sequence: DashaPeriod[];
}

function addYears(date: Date, years: number): Date {
  return new Date(date.getTime() + years * YEAR_DAYS * 86400000);
}

function formatYearsLabel(years: number): string {
  return formatDashaDurationParts(breakdownDashaDuration(years * YEAR_DAYS), "ne");
}

/**
 * Vimshottari Mahadasha from Moon's sidereal longitude, with balance at
 * birth and the chronological lord sequence for `cycles` full 120-year
 * cycles (default 1) following the birth dasha.
 */
export function vimshottariDasha(
  moonSiderealLonDeg: number,
  birthDate: Date,
  cycles = 1
): VimshottariResult {
  const lon = ((moonSiderealLonDeg % 360) + 360) % 360;
  const nakshatraIndex = Math.floor(lon / NAKSHATRA_SPAN_DEG);
  const lordNe = NAKSHATRA_ICONS[nakshatraIndex]?.lord_ne ?? "केतु";
  const mahadashaLord = NE_TO_LORD[lordNe] ?? "ketu";

  const fractionElapsed = (lon % NAKSHATRA_SPAN_DEG) / NAKSHATRA_SPAN_DEG;
  const fullYears = DASHA_YEARS[mahadashaLord];
  const balanceYears = (1 - fractionElapsed) * fullYears;

  const sequence: DashaPeriod[] = [];
  let cursor = birthDate;
  const startIdx = DASHA_SEQUENCE.indexOf(mahadashaLord);

  sequence.push({
    lord: mahadashaLord,
    lordNe: DASHA_LORD_NE[mahadashaLord],
    startDate: cursor,
    endDate: addYears(cursor, balanceYears),
    years: balanceYears,
  });
  cursor = sequence[0]!.endDate;

  const totalSteps = DASHA_SEQUENCE.length * cycles;
  for (let step = 1; step < totalSteps; step++) {
    const lord = DASHA_SEQUENCE[(startIdx + step) % DASHA_SEQUENCE.length]!;
    const years = DASHA_YEARS[lord];
    const endDate = addYears(cursor, years);
    sequence.push({ lord, lordNe: DASHA_LORD_NE[lord], startDate: cursor, endDate, years });
    cursor = endDate;
  }

  return {
    nakshatraIndex,
    mahadashaLord,
    mahadashaLordNe: DASHA_LORD_NE[mahadashaLord],
    balanceYears,
    balanceLabel: formatYearsLabel(balanceYears),
    sequence,
  };
}
