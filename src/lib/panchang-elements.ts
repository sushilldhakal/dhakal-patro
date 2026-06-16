import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { WHEEL_YOGAS } from "@/lib/tithi-wheel-data";

const NAKSHATRA_SPAN_DEG = 360 / 27;
const PADA_SPAN_DEG = NAKSHATRA_SPAN_DEG / 4;
const YOGA_SPAN_DEG = 360 / 27;

export interface NakshatraPadaResult {
  index: number;
  ne: string;
  pada: number;
}

/** Nakshatra + pada (1-4) from a sidereal Moon longitude. Ayanamsha-dependent. */
export function nakshatraPadaFromLongitude(moonSiderealLonDeg: number): NakshatraPadaResult {
  const lon = ((moonSiderealLonDeg % 360) + 360) % 360;
  const index = Math.floor(lon / NAKSHATRA_SPAN_DEG);
  const withinNakshatra = lon % NAKSHATRA_SPAN_DEG;
  const pada = Math.floor(withinNakshatra / PADA_SPAN_DEG) + 1;
  return { index, ne: NAKSHATRA_ICONS[index]?.ne ?? "—", pada };
}

export interface YogaResult {
  index: number;
  ne: string;
}

/** Yoga from the sum of sidereal Sun + Moon longitudes. Ayanamsha-dependent (shifts 2x offset). */
export function yogaFromLongitudes(sunSiderealLonDeg: number, moonSiderealLonDeg: number): YogaResult {
  const sum = ((sunSiderealLonDeg + moonSiderealLonDeg) % 360 + 360) % 360;
  const index = Math.floor(sum / YOGA_SPAN_DEG);
  return { index, ne: WHEEL_YOGAS[index] ?? "—" };
}
