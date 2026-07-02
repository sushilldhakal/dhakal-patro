import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { WHEEL_YOGAS } from "@/lib/tithi-wheel-data";

const NAKSHATRA_SPAN_DEG = 360 / 27;
const PADA_SPAN_DEG = NAKSHATRA_SPAN_DEG / 4;
const YOGA_SPAN_DEG = 360 / 27;

export interface NakshatraPadaResult {
  index: number;
  ne: string;
  pada: number;
  /** Nakshatra lord (नक्षत्रेश) in Nepali — the Vimshottari ruling planet. */
  lordNe: string;
}

/** Nakshatra + pada (1-4) from a sidereal Moon longitude. Ayanamsha-dependent. */
export function nakshatraPadaFromLongitude(moonSiderealLonDeg: number): NakshatraPadaResult {
  const lon = ((moonSiderealLonDeg % 360) + 360) % 360;
  const index = Math.min(Math.floor(lon / NAKSHATRA_SPAN_DEG), 26);
  const withinNakshatra = lon - index * NAKSHATRA_SPAN_DEG;
  const pada = Math.min(Math.floor(withinNakshatra / PADA_SPAN_DEG) + 1, 4);
  return {
    index,
    ne: NAKSHATRA_ICONS[index]?.ne ?? "—",
    pada,
    lordNe: NAKSHATRA_ICONS[index]?.lord_ne ?? "—",
  };
}

type NakshatraAnga = {
  number?: number;
  name_ne?: string;
  name?: string;
  progress?: number;
  pada?: number;
};

/**
 * Birth nakshatra + pada — prefer instant panchanga block (at-time API) over
 * recomputing from planet longitude alone.
 */
export function resolveJanmaNakshatra(
  p: { mode?: string; nakshatra?: NakshatraAnga },
  detailNakshatra: NakshatraAnga | undefined,
  moonSiderealLon?: number | null,
): NakshatraPadaResult | undefined {
  const block =
    (p.mode === "ephemeris" ? p.nakshatra : undefined) ?? detailNakshatra ?? p.nakshatra;

  if (block?.number != null && block.number >= 1 && block.number <= 27) {
    const index = block.number - 1;
    const progress = block.progress ?? 0;
    const pada =
      block.pada != null && block.pada >= 1 && block.pada <= 4
        ? block.pada
        : Math.min(Math.floor(progress * 4) + 1, 4);
    return {
      index,
      ne: block.name_ne ?? NAKSHATRA_ICONS[index]?.ne ?? "—",
      pada,
      lordNe: NAKSHATRA_ICONS[index]?.lord_ne ?? "—",
    };
  }

  if (moonSiderealLon != null) {
    return nakshatraPadaFromLongitude(moonSiderealLon);
  }
  return undefined;
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
