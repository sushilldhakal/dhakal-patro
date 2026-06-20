/**
 * Simplified Sun–Earth–Moon system (circular orbits) used to compare the
 * ~365-day solar year (12 solar months) against the ~12.37 lunar months
 * (~29.53 days each) that fit inside it — the source of the ~11-day gap
 * that adhik maas corrects.
 */

export const RAD = Math.PI / 180;

export const SEM = {
  W: 1100,
  H: 760,
  cx: 550,
  cy: 392,
  sunR: 58,
  earthOrbitR: 292,
  earthR: 26,
  moonOrbitR: 66,
  moonR: 11,
} as const;

export const SYNODIC_MONTH = 29.530588;
export const TROPICAL_YEAR = 365.2422;

export const BS_MONTHS = [
  "बैशाख",
  "जेठ",
  "असार",
  "श्रावण",
  "भदौ",
  "आश्विन",
  "कार्तिक",
  "मंसिर",
  "पुष",
  "माघ",
  "फागुन",
  "चैत्र",
] as const;

export function pol(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = deg * RAD;
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
}

export function yearAngleFromDay(day: number): number {
  return (((day / TROPICAL_YEAR) * 360) % 360 + 360) % 360;
}

export function dayFromYearAngle(angle: number): number {
  return ((((angle % 360) + 360) % 360) / 360) * TROPICAL_YEAR;
}

export function elongationFromDay(day: number): number {
  return (((day % SYNODIC_MONTH) / SYNODIC_MONTH) * 360 + 360) % 360;
}

export function lunarMonthsCompleted(day: number): number {
  return Math.floor(day / SYNODIC_MONTH);
}

export function monthIndexFromAngle(deg: number): number {
  return Math.floor((((deg % 360) + 360) % 360) / 30);
}
