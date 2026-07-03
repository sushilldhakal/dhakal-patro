import type { ShadbalaPlanet } from "@/lib/api";

/** Tara grahas that may enter planetary war (Graha Yuddha). */
const TARA_GRAHAS = ["mars", "mercury", "jupiter", "venus", "saturn"] as const;

/** Disc diameter in arc-seconds (Bimba Parimana) per B.V. Raman Art. 77. */
const DISC_ARCSEC: Record<string, number> = {
  mars: 9.4,
  mercury: 6.6,
  jupiter: 190.4,
  venus: 16.6,
  saturn: 158.0,
};

const WAR_ORB_DEG = 1;

export type YuddhaWar = {
  winner: string;
  loser: string;
  /** Yuddha bala virupas added to winner / subtracted from loser. */
  yuddhaVirupas: number;
  separationDeg: number;
};

export type YuddhaResult = {
  wars: YuddhaWar[];
  /** Net yuddha adjustment per planet key (positive = gained, negative = lost). */
  byPlanet: Record<string, number>;
};

/** Kala bala components used in yuddha tri-bala (ayana excluded). */
function kalaForYuddha(p: ShadbalaPlanet): number {
  const k = p.sub_balas?.kala;
  if (!k) return p.breakdown.kala;
  return (
    (k.nathonnatha ?? 0) +
    (k.paksha ?? 0) +
    (k.tribhaga ?? 0) +
    (k.varshadhipati ?? 0) +
    (k.masadhipati ?? 0) +
    (k.varadhipati ?? 0) +
    (k.horadhipati ?? 0)
  );
}

function triBala(p: ShadbalaPlanet): number {
  return p.breakdown.sthana + p.breakdown.dig + kalaForYuddha(p);
}

/**
 * Classical Graha Yuddha (planetary war): two tara grahas within 1° longitude.
 * Victor = lower longitude; yuddha virupas = |tri-bala diff| / |disc diff|.
 */
export function computeYuddhaBala(
  planets: ShadbalaPlanet[],
  longitudes: Record<string, number>,
): YuddhaResult {
  const byPlanet: Record<string, number> = {};
  const wars: YuddhaWar[] = [];

  const tara: { key: string; planet: ShadbalaPlanet; lon: number }[] = [];
  for (const key of TARA_GRAHAS) {
    const planet = planets.find((p) => p.key === key);
    const lon = longitudes[key];
    if (planet != null && lon != null) {
      tara.push({ key, planet, lon });
    }
  }

  for (let i = 0; i < tara.length; i++) {
    for (let j = i + 1; j < tara.length; j++) {
      const a = tara[i]!;
      const b = tara[j]!;
      let sep = Math.abs(a.lon - b.lon) % 360;
      if (sep > 180) sep = 360 - sep;
      if (sep >= WAR_ORB_DEG) continue;

      const winner = a.lon <= b.lon ? a : b;
      const loser = a.lon <= b.lon ? b : a;
      const triDiff = Math.abs(triBala(winner.planet) - triBala(loser.planet));
      const discDiff = Math.abs(
        (DISC_ARCSEC[winner.key] ?? 1) - (DISC_ARCSEC[loser.key] ?? 1),
      );
      const yuddhaVirupas = discDiff > 0 ? triDiff / discDiff : 0;

      wars.push({
        winner: winner.key,
        loser: loser.key,
        yuddhaVirupas,
        separationDeg: sep,
      });

      byPlanet[winner.key] = (byPlanet[winner.key] ?? 0) + yuddhaVirupas;
      byPlanet[loser.key] = (byPlanet[loser.key] ?? 0) - yuddhaVirupas;
    }
  }

  return { wars, byPlanet };
}

/** Yuddha virupas for display — API value overlaid with client war correction. */
export function yuddhaVirupasForPlanet(
  planet: ShadbalaPlanet,
  yuddha: YuddhaResult,
): number {
  const api = planet.sub_balas?.kala?.yuddha;
  const adj = yuddha.byPlanet[planet.key] ?? 0;
  if (api != null && api !== 0) return api;
  return adj;
}
