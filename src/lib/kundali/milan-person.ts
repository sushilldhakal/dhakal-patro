import type { PanchangaDay } from "@/lib/api";
import { getAyanamshaModeInfo, type AyanamshaMode } from "@/lib/ayanamsha";
import { resolveJanmaNakshatra } from "@/lib/panchang-elements";
import { getPanchangaDetail, rashiNeFromNumber } from "@/lib/panchanga-format";
import type { MilanPersonInput } from "@/lib/ashtakuta";

type PlanetDetail = {
  longitude?: number;
  rashi?: number;
  rashi_ne?: string;
};

export function moonDataFromPanchanga(
  p: PanchangaDay,
  _ayanamsha: AyanamshaMode,
): { longitude: number; rashiNum: number; rashiNe: string } | null {
  const detail = getPanchangaDetail(p);
  const planets = (detail?.planets ?? p.planets) as Record<string, PlanetDetail | string> | undefined;
  const moon = planets?.moon;
  if (!moon || typeof moon === "string") return null;

  const chandra = (detail?.chandra_rashi ?? p.chandra_rashi) as
    | { number?: number; name_ne?: string }
    | undefined;

  const longitude = moon.longitude;
  if (longitude == null) return null;

  const rashiNum = moon.rashi ?? chandra?.number ?? Math.floor(((longitude % 360) + 360) % 360 / 30) + 1;
  const rashiNe = moon.rashi_ne ?? chandra?.name_ne ?? rashiNeFromNumber(rashiNum) ?? "—";

  return { longitude, rashiNum, rashiNe };
}

export function buildMilanPersonInput(
  name: string,
  p: PanchangaDay,
  ayanamsha: AyanamshaMode,
): MilanPersonInput | null {
  const moon = moonDataFromPanchanga(p, ayanamsha);
  if (!moon) return null;

  const detail = getPanchangaDetail(p);
  const nakshatra = resolveJanmaNakshatra(
    p,
    detail?.nakshatra as { number?: number; name_ne?: string; pada?: number } | undefined,
    moon.longitude,
  );
  if (!nakshatra) return null;

  return {
    name,
    moonRashiNum: moon.rashiNum,
    moonLongitude: moon.longitude,
    nakshatra,
  };
}

export function ayanamshaLabel(mode: AyanamshaMode, lang?: string): string {
  const info = getAyanamshaModeInfo(mode);
  return (lang ?? "ne").startsWith("en") ? info.label : info.labelNe;
}
