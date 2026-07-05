/** Whole-sign house (bhava) mapping, derived from the Lagna's rashi. */

export interface BhavaPlanetEntry {
  key: string;
  labelNe: string;
}

export interface BhavaHouse {
  house: number;
  rashi: number;
  rashiNe: string;
  isLagna: boolean;
  planets: BhavaPlanetEntry[];
}

/** Rashi (1-12) occupying a given house, under whole-sign houses. */
export function houseRashi(lagnaRashi: number, house: number): number {
  return ((lagnaRashi - 1 + (house - 1)) % 12) + 1;
}

/** House (1-12) a planet falls into given its rashi and the Lagna's rashi. */
export function rashiToHouse(planetRashi: number, lagnaRashi: number): number {
  return ((planetRashi - lagnaRashi + 12) % 12) + 1;
}

export function buildBhavaChart(
  lagnaRashi: number,
  planetRashis: { key: string; labelNe: string; rashi: number }[],
  rashiNeFromNumber: (rashi?: number) => string | undefined
): BhavaHouse[] {
  const houses: BhavaHouse[] = Array.from({ length: 12 }, (_, i) => {
    const house = i + 1;
    const rashi = houseRashi(lagnaRashi, house);
    return {
      house,
      rashi,
      rashiNe: rashiNeFromNumber(rashi) ?? "—",
      isLagna: house === 1,
      planets: [],
    };
  });

  for (const planet of planetRashis) {
    const house = rashiToHouse(planet.rashi, lagnaRashi);
    houses[house - 1]!.planets.push({ key: planet.key, labelNe: planet.labelNe });
  }

  return houses;
}

// ── Bhava (house) table: residents, owner, qualities, aspects ──────────────

const KENDRA_HOUSES = new Set([1, 4, 7, 10]);
const TRIKONA_HOUSES = new Set([1, 5, 9]);

/** "Q" for kendra (angle), "T" for trikona (trine), else undefined. Houses
 * that are both (only house 1) show as kendra — the stronger classical label. */
export function houseBadge(house: number): "Q" | "T" | undefined {
  if (KENDRA_HOUSES.has(house)) return "Q";
  if (TRIKONA_HOUSES.has(house)) return "T";
  return undefined;
}

/** Gender + modality per rashi (1-12) — fixed classical attributes, not chart-dependent. */
export const RASHI_QUALITIES: { ne: string; en: string }[] = [
  { ne: "पुं, चर", en: "Mas, Movable" },   // 1 Mesha
  { ne: "स्त्री, स्थिर", en: "Fem, Fixed" },  // 2 Vrishabha
  { ne: "पुं, द्विस्वभाव", en: "Mas, Common" }, // 3 Mithuna
  { ne: "स्त्री, चर", en: "Fem, Movable" },  // 4 Karka
  { ne: "पुं, स्थिर", en: "Mas, Fixed" },    // 5 Simha
  { ne: "स्त्री, द्विस्वभाव", en: "Fem, Common" }, // 6 Kanya
  { ne: "पुं, चर", en: "Mas, Movable" },   // 7 Tula
  { ne: "स्त्री, स्थिर", en: "Fem, Fixed" },  // 8 Vrishchika
  { ne: "पुं, द्विस्वभाव", en: "Mas, Common" }, // 9 Dhanu
  { ne: "स्त्री, चर", en: "Fem, Movable" },  // 10 Makara
  { ne: "पुं, स्थिर", en: "Mas, Fixed" },    // 11 Kumbha
  { ne: "स्त्री, द्विस्वभाव", en: "Fem, Common" }, // 12 Meena
];

/** Graha-drishti offsets (house-distance from the aspecting planet) beyond
 * the universal 7th aspect every planet casts. Mirrors the server's
 * SPECIAL_ASPECTS table (engine/vedic/interpretation.py). */
const SPECIAL_ASPECT_HOUSES: Record<string, number[]> = {
  mars: [4, 7, 8],
  jupiter: [5, 7, 9],
  saturn: [3, 7, 10],
  rahu: [5, 7, 9],
  ketu: [5, 7, 9],
};

function aspectHousesFor(key: string): number[] {
  return SPECIAL_ASPECT_HOUSES[key] ?? [7];
}

export interface BhavaTableRow {
  house: number;
  badge?: "Q" | "T";
  residents: BhavaPlanetEntry[];
  owner?: string;
  rashi: number;
  rashiNe: string;
  aspectedBy: string[];
}

/**
 * Per-house table: residents, rashi owner (lord), rashi qualities and which
 * planets cast a graha-drishti onto that house — everything already
 * derivable client-side from data the API returns for the chart.
 */
export function buildBhavaTable(
  lagnaRashi: number,
  planetRashis: { key: string; labelNe: string; rashi: number }[],
  ownedRashis: Record<string, number[]>,
  rashiNeFromNumber: (rashi?: number) => string | undefined
): BhavaTableRow[] {
  const houses = buildBhavaChart(lagnaRashi, planetRashis, rashiNeFromNumber);

  const rashiOwner = new Map<number, string>();
  for (const [ownerKey, rashis] of Object.entries(ownedRashis)) {
    for (const rashi of rashis) rashiOwner.set(rashi, ownerKey);
  }

  const planetHouse = new Map<string, number>();
  for (const planet of planetRashis) {
    planetHouse.set(planet.key, rashiToHouse(planet.rashi, lagnaRashi));
  }

  return houses.map((h) => {
    const aspectedBy: string[] = [];
    for (const [key, fromHouse] of planetHouse) {
      const distance = ((h.house - fromHouse + 12) % 12) + 1;
      if (aspectHousesFor(key).includes(distance)) aspectedBy.push(key);
    }
    return {
      house: h.house,
      badge: houseBadge(h.house),
      residents: h.planets,
      owner: rashiOwner.get(h.rashi),
      rashi: h.rashi,
      rashiNe: h.rashiNe,
      aspectedBy,
    };
  });
}
