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
  const totalDays = Math.round(years * YEAR_DAYS);
  const y = Math.floor(totalDays / YEAR_DAYS);
  const remDaysAfterYears = totalDays - Math.round(y * YEAR_DAYS);
  const m = Math.floor(remDaysAfterYears / 30.4369);
  const d = Math.round(remDaysAfterYears - m * 30.4369);
  const parts: string[] = [];
  if (y > 0) parts.push(`${y} वर्ष`);
  if (m > 0) parts.push(`${m} महिना`);
  if (d > 0 || parts.length === 0) parts.push(`${d} दिन`);
  return parts.join(" ");
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
