import { toNepaliDigits } from "@/lib/panchanga-format";

/** Bikram Sambat epoch begins at Gregorian 57 BCE (वि.सं. १). */
export const BS_EPOCH_BCE = 57;

/** वि.सं. is 57 years ahead of AD at year boundaries. */
export const BS_AD_OFFSET = 57;

/** BBSE year count for BCE dates before the वि.सं. epoch (bce > 57). */
export function bceToBbse(bce: number): number {
  return bce - BS_EPOCH_BCE + 1;
}

/** BCE 57…1 → वि.सं. १…५७. */
export function bceToBs(bce: number): number {
  return BS_EPOCH_BCE - bce + 1;
}

export function adToBs(ad: number): number {
  return ad + BS_AD_OFFSET;
}

/** Before Bikram Sambat Era — वि.सं. युग अघि. */
export function formatBbse(bce: number): string {
  return `${toNepaliDigits(bceToBbse(bce))} BBSE`;
}

export function formatBsFromBce(bce: number): string {
  return `वि.सं. ${toNepaliDigits(bceToBs(bce))}`;
}

export function formatBsFromAd(ad: number): string {
  return `वि.सं. ${toNepaliDigits(adToBs(ad))}`;
}

/** BBSE if before epoch, otherwise वि.सं. */
export function formatFromBce(bce: number): string {
  if (bce > BS_EPOCH_BCE) return formatBbse(bce);
  return formatBsFromBce(bce);
}

export function formatBbseRange(fromBce: number, toBce: number): string {
  return `${formatBbse(fromBce)} देखि ${formatBbse(toBce)}`;
}

/**
 * Panchang / solar-month label with BBSE year.
 * Use चैत्र, वैशाख, जेठ, etc. — never Gregorian month names with BBSE.
 */
export function formatBbseEvent(panchangLabel: string, bce: number): string {
  return `${panchangLabel}, ${formatBbse(bce)}`;
}

/** BBSE year with genitive panchang label, e.g. ६७२२ BBSE को चैत्र शुक्ल प्रतिपदा */
export function formatBbseYearEvent(bce: number, panchangLabel: string): string {
  return `${formatBbse(bce)} को ${panchangLabel}`;
}

export const HISTORY_ERA_NOTE = {
  bbse: "वि.सं. १ भन्दा अगाडिका वर्ष — बिक्रम संवत् सुरु हुनु अघि",
  bs: "बिक्रम संवत् — नेपाली पात्रो प्रणाली",
} as const;
