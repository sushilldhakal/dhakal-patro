/**
 * Signed patro year on one axis (URL / pickers when `era=bs`):
 *
 * - **1 … 3000** → Vikram **BS**
 * - **−1 … −13201** → **BBS** (Before Bikram Sambat), display as BBS `|year|`
 * - **0** → invalid
 *
 * BS 1 ≈ 57 BCE. BBS 6722 ≈ tradition / Surya Siddhanta deep anchor (~6778 BCE).
 *
 * Swiss Ephemeris (typical install): usable Sun/Moon roughly **3001 BCE–3003 CE**
 * (Moshier JD band). Deeper than ~**BBS 2600** (`PATRO_SANKRANTI_SIGNED_MIN`) may
 * not build sankranti months until extra `.se1` files are installed.
 * Full server panchanga (tithi/nakshatra) for BBS when sankranti grid works (~≥ PATRO_SANKRANTI_SIGNED_MIN)
 * and for BS ≥ 1 on CE civil dates.
 */

import type { Era } from "@/lib/era";

/**
 * The axis — what a URL, picker or label may name. Sized to the full Swiss
 * Ephemeris span (11 Aug 13000 BCE, JD −3026604.5 … 7 Jan 17000 CE), i.e. the
 * deepest the library can reach once every `.se1` file is installed.
 */
export const PATRO_SIGNED_YEAR_MIN = -13202;
export const PATRO_SIGNED_YEAR_MAX = 17248;

/**
 * What the server's installed `.se1` set can actually compute — mirrors
 * `PATRO_EPHEMERIS_SIGNED_MIN/MAX` in engine/vedic/patro_year_axis.py. Outside
 * this the API answers 400 with an "install more .se1" message, so the UI should
 * not offer those years. Keep both files in step when ephemeris files change.
 */
export const PATRO_EPHEMERIS_SIGNED_MIN = -13201; // BBS 13201 ≈ 13201 BCE
export const PATRO_EPHEMERIS_SIGNED_MAX = 17247; // BS 17247 ≈ AD 17191 CE

/** Retained aliases — both gates are the same ephemeris window now. */
export const PATRO_SANKRANTI_SIGNED_MIN = PATRO_EPHEMERIS_SIGNED_MIN;
export const PATRO_PANCHANGA_SIGNED_MIN = PATRO_EPHEMERIS_SIGNED_MIN;

/** MoHA / lunar festival rules — same floor as `BS_PANCHANGA_SIGNED_MIN` on the API. */
export const BS_FESTIVAL_STACK_MIN_YEAR = 60;

/** Positive BBS year bounds in share URLs (`era=bbs&year=…`). */
export const BBS_URL_YEAR_MIN = 1;
export const BBS_URL_YEAR_MAX = -PATRO_EPHEMERIS_SIGNED_MIN;

/** Gregorian browse pickers — mirror ``AD_YEAR_*`` / ``BC_YEAR_*`` on the API. */
export const PATRO_AD_BROWSE_YEAR_MIN = 1;
export const PATRO_AD_BROWSE_YEAR_MAX = 17191;
export const PATRO_BC_BROWSE_YEAR_MIN = 1;
export const PATRO_BC_BROWSE_YEAR_MAX = BBS_URL_YEAR_MAX;

export function validatePatroSignedYear(year: number): void {
  if (
    year === 0 ||
    year < PATRO_SIGNED_YEAR_MIN ||
    year > PATRO_SIGNED_YEAR_MAX
  ) {
    throw new Error(
      `Patro year must be ${PATRO_SIGNED_YEAR_MIN}..-1 or 1..${PATRO_SIGNED_YEAR_MAX} (0 invalid)`,
    );
  }
}

export function isBbsSigned(signed: number): boolean {
  return signed <= -1;
}

export function isBsSigned(signed: number): boolean {
  return signed >= 1;
}

export function bbsFromSigned(signed: number): number {
  if (signed >= 0) throw new Error("bbsFromSigned expects signed <= -1");
  return -signed;
}

export function signedFromBbs(bbs: number): number {
  if (bbs < 1) throw new Error("bbs must be >= 1");
  return -bbs;
}

export function clampPatroSignedYear(year: number): number {
  if (year === 0) return year < 0 ? -1 : 1;
  return Math.min(Math.max(year, PATRO_SIGNED_YEAR_MIN), PATRO_SIGNED_YEAR_MAX);
}

/** Step by one on the signed axis (skips invalid year 0). */
export function stepPatroSignedYear(year: number, delta: -1 | 1): number {
  let next = year + delta;
  if (next === 0) next = delta > 0 ? 1 : -1;
  return clampPatroSignedYear(next);
}

/** Both ends matter: the axis reaches BS 17055; extended ephemeris reaches BS 16799. */
export function patroYearWithinEphemeris(signed: number): boolean {
  return (
    signed !== 0 &&
    signed >= PATRO_EPHEMERIS_SIGNED_MIN &&
    signed <= PATRO_EPHEMERIS_SIGNED_MAX
  );
}

/** Browse URL year → signed axis (`era=bbs&year=N` → `−N`). */
export function signedPatroYearFromBrowse(era: Era, browseYear: number): number {
  if (era === "bbs") return signedFromBbs(browseYear);
  return browseYear;
}

/** Ephemeris window check for positive browse URL years. */
export function patroBrowseYearWithinEphemeris(era: Era, browseYear: number): boolean {
  if (era === "ad") {
    return browseYear >= PATRO_AD_BROWSE_YEAR_MIN && browseYear <= PATRO_AD_BROWSE_YEAR_MAX;
  }
  if (era === "bc") {
    return browseYear >= PATRO_BC_BROWSE_YEAR_MIN && browseYear <= PATRO_BC_BROWSE_YEAR_MAX;
  }
  return patroYearWithinEphemeris(signedPatroYearFromBrowse(era, browseYear));
}

/** Max positive year in the year picker for the active browse era. */
export function maxBrowseYearForEra(era: Era): number | undefined {
  if (era === "bs") return PATRO_EPHEMERIS_SIGNED_MAX;
  if (era === "bbs") return BBS_URL_YEAR_MAX;
  if (era === "ad") return PATRO_AD_BROWSE_YEAR_MAX;
  if (era === "bc") return PATRO_BC_BROWSE_YEAR_MAX;
  return undefined;
}

/** Whether `year` is allowed while `era` is selected (picker + URL, no era flip). */
export function isValidBrowseYear(era: Era, year: number): boolean {
  if (!Number.isFinite(year) || year < 1) return false;
  if (era === "bs") return year <= PATRO_EPHEMERIS_SIGNED_MAX;
  if (era === "bbs") return year <= BBS_URL_YEAR_MAX;
  if (era === "ad") return year <= PATRO_AD_BROWSE_YEAR_MAX;
  if (era === "bc") return year <= PATRO_BC_BROWSE_YEAR_MAX;
  return true;
}

export function patroYearSupportsSankrantiGrid(signed: number): boolean {
  return patroYearWithinEphemeris(signed);
}

export function patroYearSupportsPanchanga(signed: number): boolean {
  return patroYearWithinEphemeris(signed);
}

/** Nepali / English abbreviations for negative signed years (पूर्व बिक्रम संवत्). */
export const PATRO_PBBS_ABBR_NE = "पू.वि.सं.";
export const PATRO_PBBS_ABBR_EN = "BBS";

/** UI chip: `BBS 6722` / `BS 2082` / `पू.वि.सं. ६७२२` / `वि.सं. २०८२`. */
export function formatSignedPatroYear(
  signed: number,
  lang: string,
  digits: (n: number | string) => string = String,
): string {
  validatePatroSignedYear(signed);
  const isEn = lang.slice(0, 2) === "en";
  if (isBbsSigned(signed)) {
    const n = bbsFromSigned(signed);
    const abbr = isEn ? PATRO_PBBS_ABBR_EN : PATRO_PBBS_ABBR_NE;
    return `${abbr} ${digits(n)}`;
  }
  return isEn ? `BS ${digits(signed)}` : `वि.सं. ${digits(signed)}`;
}


/** Positive browse-year label for URL era (`era` carries BC/BBS semantics). */
export function formatBrowsePatroYear(
  era: Era,
  year: number,
  lang: string,
  digits: (n: number | string) => string = String,
): string {
  if (!Number.isFinite(year) || year < 1) {
    throw new Error("browse year must be a positive integer");
  }
  const isEn = lang.slice(0, 2) === "en";
  if (era === "ad") return digits(year);
  if (era === "bc") {
    return isEn ? `${digits(year)} BC` : `${digits(year)} ई.पू.`;
  }
  if (era === "bbs") {
    const abbr = isEn ? PATRO_PBBS_ABBR_EN : PATRO_PBBS_ABBR_NE;
    return `${abbr} ${digits(year)}`;
  }
  return isEn ? `BS ${digits(year)}` : `वि.सं. ${digits(year)}`;
}

/** Year dropdown row — digits only; era lives in the page header and era toggle. */
export function formatBrowsePatroYearPicker(
  year: number,
  digits: (n: number | string) => string = String,
): string {
  if (!Number.isFinite(year) || year < 1) {
    return digits("—");
  }
  return digits(year);
}
