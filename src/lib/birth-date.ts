/**
 * Birth date/time input helpers — used by the profile form (live masking) and
 * the Kundali page (parsing saved values). Tolerant of Nepali digits so Nepali
 * users can type either script.
 */

const NE_DIGITS = "०१२३४५६७८९";

/** Convert Devanagari digits (०१२…) to ASCII (012…). */
export function toAsciiDigits(s: string): string {
  return s.replace(/[०-९]/g, (c) => String(NE_DIGITS.indexOf(c)));
}

/**
 * Mask a date input to YYYY-MM-DD as the user types: dashes are inserted
 * automatically after the year and the month. Non-digits (slashes, dots) are
 * ignored, so "2050/02/30" and "20500230" both become "2050-02-30".
 */
export function formatDateInput(raw: string): string {
  const d = toAsciiDigits(raw).replace(/\D/g, "").slice(0, 8);
  let out = d.slice(0, 4);
  if (d.length > 4) out += "-" + d.slice(4, 6);
  if (d.length > 6) out += "-" + d.slice(6, 8);
  return out;
}

/** Mask a time input to HH:MM, inserting the colon after the hour. */
export function formatTimeInput(raw: string): string {
  const d = toAsciiDigits(raw).replace(/\D/g, "").slice(0, 4);
  let out = d.slice(0, 2);
  if (d.length > 2) out += ":" + d.slice(2, 4);
  return out;
}

/**
 * Parse a stored birth date (any separator, Nepali or ASCII digits) into
 * year/month/day. Returns null if it can't find a YYYY M D pattern.
 */
export function parseBirthDateParts(raw: string): { y: number; m: number; d: number } | null {
  const s = toAsciiDigits(raw).trim();
  const sep = /(\d{4})\s*\D+\s*(\d{1,2})\s*\D+\s*(\d{1,2})/.exec(s);
  if (sep) return { y: +sep[1], m: +sep[2], d: +sep[3] };
  const digits = s.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return { y: +digits.slice(0, 4), m: +digits.slice(4, 6), d: +digits.slice(6, 8) };
}
