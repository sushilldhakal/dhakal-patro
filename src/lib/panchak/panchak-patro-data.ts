import { PANCHAK_PATRO_2083 } from "./panchak-patro-2083";

export interface PanchakMoment {
  bsYear: number;
  bsMonth: number;
  bsDay: number;
  timeNe: string;
  timeEn: string;
  ad: string;
}

export interface PanchakPeriod {
  start: PanchakMoment;
  end: PanchakMoment;
  durationNe: string;
  durationEn: string;
}

const BY_YEAR: Partial<Record<number, PanchakPeriod[]>> = {
  2083: PANCHAK_PATRO_2083,
};

export const PANCHAK_PATRO_YEARS = Object.keys(BY_YEAR)
  .map(Number)
  .sort((a, b) => a - b);

export function getPanchakPatroForYear(year: number): PanchakPeriod[] | undefined {
  return BY_YEAR[year];
}

export function defaultPanchakPatroYear(): number {
  return PANCHAK_PATRO_YEARS.at(-1) ?? 2083;
}
