import type { PanchangaDay } from "@/lib/api";
import {
  formatGhadiPalaVipala,
  type GhadiPalaVipala,
} from "@/lib/janma-patrika-fields";
import {
  getPanchangaDetail,
  getSolarCorrections,
  getSunrise,
  getSunriseDisplay,
  getSunsetDisplay,
  getSuryaNakshatra,
  getSuryaRashi,
  getVaaraNe,
  totalSolarCorrectionMinutes,
} from "@/lib/panchanga-format";
import { nakshatraPadaFromLongitude } from "@/lib/panchang-elements";

export type PlanetSnapshot = {
  rashi?: string;
  rashiNum?: number;
  longitude?: number;
};

function parseClockMinutes(time?: string | null): number | null {
  if (!time) return null;
  const m = time.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function elapsedMinutesFromSunrise(sunriseMin: number, birthMin: number): number {
  let delta = birthMin - sunriseMin;
  if (delta < 0) delta += 24 * 60;
  return delta;
}

/** Ghadi-pala-vipala from elapsed minutes (1 ghadi = 24 min, 1 pala = 24 sec). */
export function ghadiPalaVipalaFromMinutes(totalMinutes: number): GhadiPalaVipala {
  const totalSec = Math.round(totalMinutes * 60);
  const ghadi = Math.floor(totalSec / (24 * 60));
  const rem = totalSec % (24 * 60);
  const pala = Math.floor(rem / 24);
  const vipala = Math.floor((rem % 24) * (60 / 24));
  return { ghadi, pala, vipala };
}

/**
 * Drik-style birth-time ghati clocks:
 * - अहोरात्र इष्ट काल = civil elapsed from listed sunrise
 * - इष्ट काल = subtract बेलान्तर+देशान्तर (listed sunrise already corrected)
 */
export function computeBirthIshtaKalas(
  sunriseShort: string | undefined,
  birthClock: string,
  solarCorrectionMin = 0,
): { ishta: GhadiPalaVipala; ahoratriIshta: GhadiPalaVipala } | undefined {
  const sunriseMin = parseClockMinutes(sunriseShort);
  const birthMin = parseClockMinutes(birthClock);
  if (sunriseMin == null || birthMin == null) return undefined;

  const ahoratriMin = elapsedMinutesFromSunrise(sunriseMin, birthMin);
  const ishtaMin = Math.max(0, ahoratriMin - solarCorrectionMin);

  return {
    ahoratriIshta: ghadiPalaVipalaFromMinutes(ahoratriMin),
    ishta: ghadiPalaVipalaFromMinutes(ishtaMin),
  };
}

export function getVaaraEn(p: PanchangaDay, fallback?: string): string | undefined {
  const detail = getPanchangaDetail(p);
  return (
    (detail?.vaara as { name_english?: string } | undefined)?.name_english ??
    fallback
  );
}

export type BirthPanchangaMeta = {
  sunriseNe: string | undefined;
  sunsetNe: string | undefined;
  ishtaKalaNe: string | undefined;
  ishtaKalaEn: string | undefined;
  ahoratriIshtaNe: string | undefined;
  ahoratriIshtaEn: string | undefined;
  vaaraNe: string | undefined;
  vaaraEn: string | undefined;
  suryaRashiNe: string | undefined;
  suryaRashiEn: string | undefined;
  suryaNakshatra?: { ne: string; en?: string; pada?: number };
};

export function buildBirthPanchangaMeta(
  p: PanchangaDay,
  birthClock: string,
  fallbacks?: { sun?: PlanetSnapshot },
): BirthPanchangaMeta {
  const sunrise = getSunrise(p);
  const suryaRashi = getSuryaRashi(p);
  const suryaNak = getSuryaNakshatra(p);
  const sun = fallbacks?.sun;
  const correctionMin = totalSolarCorrectionMinutes(getSolarCorrections(p));
  const kalas = computeBirthIshtaKalas(sunrise, birthClock, correctionMin);

  const suryaNakshatra =
    sun?.longitude != null
      ? (() => {
          const nak = nakshatraPadaFromLongitude(sun.longitude);
          return {
            ne: suryaNak?.name_ne ?? nak.ne,
            en: suryaNak?.name,
            pada: nak.pada,
          };
        })()
      : suryaNak?.name_ne || suryaNak?.name
        ? {
            ne: suryaNak.name_ne ?? suryaNak.name!,
            en: suryaNak.name,
          }
        : undefined;

  return {
    sunriseNe: getSunriseDisplay(p),
    sunsetNe: getSunsetDisplay(p),
    ishtaKalaNe: kalas ? formatGhadiPalaVipala(kalas.ishta, "ne") : undefined,
    ishtaKalaEn: kalas ? formatGhadiPalaVipala(kalas.ishta, "en") : undefined,
    ahoratriIshtaNe: kalas ? formatGhadiPalaVipala(kalas.ahoratriIshta, "ne") : undefined,
    ahoratriIshtaEn: kalas ? formatGhadiPalaVipala(kalas.ahoratriIshta, "en") : undefined,
    vaaraNe: getVaaraNe(p, p.weekday),
    vaaraEn: getVaaraEn(p, p.weekday),
    suryaRashiNe: suryaRashi?.name_ne ?? sun?.rashi,
    suryaRashiEn: suryaRashi?.name,
    suryaNakshatra,
  };
}
