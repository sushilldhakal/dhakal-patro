export type AyanamshaMode = "nepal" | "lahiri" | "raman" | "kp" | "true_citra";

export interface AyanamshaModeInfo {
  id: AyanamshaMode;
  label: string;
  labelNe: string;
  tagline: string;
  taglineNe: string;
  tier: "default" | "advanced";
}

export const AYANAMSHA_MODES: AyanamshaModeInfo[] = [
  {
    id: "nepal",
    label: "Nepal Panchang",
    labelNe: "नेपाल पञ्चाङ्ग",
    tagline: "Matches Nepal Panchang Nirnayak Samiti & Nepali calendars",
    taglineNe: "नेपाल पञ्चाङ्ग निर्णायक समिति र नेपाली पात्रोसँग मिल्ने",
    tier: "default",
  },
  {
    id: "lahiri",
    label: "Lahiri (Standard Vedic)",
    labelNe: "लाहिरी (मानक वैदिक)",
    tagline: "Industry standard — used by most Vedic astrology software",
    taglineNe: "धेरैजसो ज्योतिष सफ्टवेयरले प्रयोग गर्ने मानक अयनांश",
    tier: "advanced",
  },
  {
    id: "raman",
    label: "Raman",
    labelNe: "रमन",
    tagline: "For the B.V. Raman astrology tradition",
    taglineNe: "बि.भि. रमन परम्पराका ज्योतिषीहरूका लागि",
    tier: "advanced",
  },
  {
    id: "kp",
    label: "Krishnamurti (KP)",
    labelNe: "कृष्णमूर्ति (KP)",
    tagline: "For KP astrology — sub-lord & cuspal analysis",
    taglineNe: "केपी ज्योतिष (सब-लर्ड तथा कस्पल विश्लेषण) का लागि",
    tier: "advanced",
  },
  {
    id: "true_citra",
    label: "True Chitrapaksha",
    labelNe: "ट्रू चित्रपक्ष",
    tagline: "Most astronomically precise — tracks the star Spica directly",
    taglineNe: "चित्रा तारा (स्पाइका) को वास्तविक स्थितिमा आधारित — अनुसन्धान/उन्नत प्रयोगका लागि",
    tier: "advanced",
  },
];

/**
 * Degrees to ADD to a Lahiri-based sidereal longitude to express it under the
 * target ayanamsha. Raman and Krishnamurti both anchor at Swiss Ephemeris's
 * J1900 reference epoch (ayan_t0 = 21.0144° and 22.3639° respectively); since
 * all classical ayanamshas share the same lunisolar precession rate, their
 * offset from Lahiri (≈22.4610° at the same epoch, back-computed from
 * Lahiri's own t0=1956 definition) stays close to constant across centuries.
 * Nepal Panchang publications and True Chitrapaksha are both treated as
 * equal to Lahiri here: NPNS uses a Lahiri-equivalent ayanamsha, and True
 * Chitrapaksha's star-locked definition differs from Lahiri by well under an
 * arcminute in the current era.
 */
const OFFSET_FROM_LAHIRI_DEG: Record<AyanamshaMode, number> = {
  nepal: 0,
  lahiri: 0,
  raman: -1.4465,
  kp: -0.0971,
  true_citra: 0,
};

export function getAyanamshaOffsetDeg(mode: AyanamshaMode): number {
  return OFFSET_FROM_LAHIRI_DEG[mode] ?? 0;
}

export function shiftSiderealLongitude(longitudeDeg: number, mode: AyanamshaMode): number {
  const shifted = (longitudeDeg + getAyanamshaOffsetDeg(mode)) % 360;
  return shifted < 0 ? shifted + 360 : shifted;
}

/** True for modes recomputed client-side from Lahiri-based data rather than fetched directly. */
export function isApproximateMode(mode: AyanamshaMode): boolean {
  return mode === "raman" || mode === "kp" || mode === "true_citra";
}

export function getAyanamshaModeInfo(mode: AyanamshaMode): AyanamshaModeInfo {
  return AYANAMSHA_MODES.find((m) => m.id === mode) ?? AYANAMSHA_MODES[0]!;
}
