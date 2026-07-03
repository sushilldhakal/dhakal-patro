import type { ShadbalaPlanet } from "@/lib/api";
import { houseRashi } from "@/lib/bhava";
import { rashiLordKey, type GrahaKey } from "@/lib/graha-details";
import { normLon, totalDrishtiOnPoint } from "@/lib/shadbala-drishti";

/** Reference virupas (7 rupas) for comparative Bhava Bala %. */
export const BHAVA_BALA_REFERENCE_VIRUPAS = 420;

export type BhavaBalaHouse = {
  house: number;
  madhyaLongitude: number;
  lordKey: GrahaKey;
  lordName: string;
  bhavadhipati: number;
  disha: number;
  drishti: number;
  totalVirupas: number;
  totalPinda: number;
  rupas: number;
  percent: number;
};

export type BhavaBalaResult = {
  houses: BhavaBalaHouse[];
  strongest: BhavaBalaHouse;
  weakest: BhavaBalaHouse;
};

type SignKind = "keeta" | "chatushpada" | "nara" | "jala";

function rashiFromLon(longitude: number): number {
  return Math.floor(normLon(longitude) / 30) + 1;
}

function degInRashi(longitude: number): number {
  return normLon(longitude) % 30;
}

/** Sign group at a sidereal longitude (B.V. Raman Art. 127–130). */
function signKind(longitude: number): SignKind {
  const rashi = rashiFromLon(longitude);
  const deg = degInRashi(longitude);

  if (rashi === 8) return "keeta";
  if (rashi === 4 || rashi === 12 || (rashi === 10 && deg >= 15)) return "jala";
  if (
    rashi === 1 ||
    rashi === 2 ||
    rashi === 5 ||
    (rashi === 9 && deg >= 15) ||
    (rashi === 10 && deg < 15)
  ) {
    return "chatushpada";
  }
  return "nara";
}

/**
 * Bhava Digbala per BPHS 27.26–29 / Raman Art. 131.
 * Deduct the reference house (Lagna, 4th, 7th or 10th) from the bhava number.
 */
export function bhavaDigBala(house: number, madhyaLon: number): number {
  const kind = signKind(madhyaLon);
  const referenceHouse =
    kind === "keeta" ? 1 : kind === "chatushpada" ? 4 : kind === "nara" ? 7 : 10;

  let diff = Math.abs(house - referenceHouse);
  if (diff > 6) diff = 12 - diff;
  return diff * 10;
}

/** Whole-sign bhava madhya: centre of the sign occupying the house. */
export function bhavaMadhyaLongitude(lagnaRashi: number, house: number): number {
  const rashi = houseRashi(lagnaRashi, house);
  return (rashi - 1) * 30 + 15;
}

function isBeneficForBhavaDrishti(key: string, moonPaksha?: number): boolean {
  if (key === "jupiter" || key === "venus" || key === "mercury") return true;
  if (key === "moon") {
    // Waxing Moon (higher paksha bala) counts as benefic; waning as malefic.
    return moonPaksha == null || moonPaksha >= 45;
  }
  return false;
}

function bhavaDrishtiBala(
  madhyaLon: number,
  planetLongitudes: Record<string, number>,
  moonPaksha?: number,
): number {
  const aspectKeys = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];
  let subha = 0;
  let papa = 0;

  for (const key of aspectKeys) {
    const lon = planetLongitudes[key];
    if (lon == null) continue;

    const raw = totalDrishtiOnPoint(madhyaLon, lon, key);
    if (raw <= 0) continue;

    const weighted =
      key === "jupiter" || key === "mercury" ? raw : raw / 4;

    if (isBeneficForBhavaDrishti(key, moonPaksha)) {
      subha += weighted;
    } else {
      papa += weighted;
    }
  }

  return subha - papa;
}

const LORD_LABEL: Record<string, string> = {
  sun: "Sun",
  moon: "Moon",
  mars: "Mars",
  mercury: "Mercury",
  jupiter: "Jupiter",
  venus: "Venus",
  saturn: "Saturn",
};

/**
 * Bhava Bala = Bhavadhipati + Bhava Disha + Bhava Drishti (B.V. Raman Ch. IX).
 * Uses whole-sign houses and planet Shadbala totals from the API.
 */
export function computeBhavaBala(
  lagnaRashi: number,
  shadbalaPlanets: ShadbalaPlanet[],
  planetLongitudes: Record<string, number>,
): BhavaBalaResult {
  const virupasByKey = new Map(
    shadbalaPlanets.map((p) => [p.key, p.total_virupas]),
  );
  const moonPaksha = shadbalaPlanets.find((p) => p.key === "moon")?.sub_balas?.kala
    ?.paksha;

  const houses: BhavaBalaHouse[] = [];

  for (let house = 1; house <= 12; house++) {
    const madhya = bhavaMadhyaLongitude(lagnaRashi, house);
    const lordKey = rashiLordKey(rashiFromLon(madhya));
    const bhavadhipati = virupasByKey.get(lordKey) ?? 0;
    const disha = bhavaDigBala(house, madhya);
    const drishti = bhavaDrishtiBala(madhya, planetLongitudes, moonPaksha);
    const totalVirupas = bhavadhipati + disha + drishti;

    houses.push({
      house,
      madhyaLongitude: madhya,
      lordKey,
      lordName: LORD_LABEL[lordKey] ?? lordKey,
      bhavadhipati,
      disha,
      drishti,
      totalVirupas,
      totalPinda: totalVirupas,
      rupas: totalVirupas / 60,
      percent: (totalVirupas / BHAVA_BALA_REFERENCE_VIRUPAS) * 100,
    });
  }

  const sorted = [...houses].sort((a, b) => b.totalVirupas - a.totalVirupas);
  return {
    houses,
    strongest: sorted[0]!,
    weakest: sorted[sorted.length - 1]!,
  };
}

/** Mean Bhava (%) across houses this graha rules (for the Shadbala matrix row). */
export function planetRulershipBhavaPercent(
  planetKey: string,
  result: BhavaBalaResult,
): number | null {
  const ruled = result.houses.filter((h) => h.lordKey === planetKey);
  if (ruled.length === 0) return null;
  return ruled.reduce((s, h) => s + h.percent, 0) / ruled.length;
}
