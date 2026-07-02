import { DASHA_SEQUENCE, DASHA_YEARS, type DashaLord } from "@/lib/dasha";

/** Nine grahas keyed the same way as the API planet blocks. */
export type GrahaKey =
  | "sun"
  | "moon"
  | "mars"
  | "mercury"
  | "jupiter"
  | "venus"
  | "saturn"
  | "rahu"
  | "ketu";

export const GRAHA_DETAIL_ORDER: GrahaKey[] = [
  "sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu",
];

export const GRAHA_NAME: Record<GrahaKey, { ne: string; en: string }> = {
  sun: { ne: "सूर्य", en: "Sun" },
  moon: { ne: "चन्द्र", en: "Moon" },
  mars: { ne: "मंगल", en: "Mars" },
  mercury: { ne: "बुध", en: "Mercury" },
  jupiter: { ne: "बृहस्पति", en: "Jupiter" },
  venus: { ne: "शुक्र", en: "Venus" },
  saturn: { ne: "शनि", en: "Saturn" },
  rahu: { ne: "राहु", en: "Rahu" },
  ketu: { ne: "केतु", en: "Ketu" },
};

export const RASHI_EN_NAMES = [
  "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
  "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
] as const;

/** Sign lords, index 0 = Mesha. */
const RASHI_LORD_KEYS: GrahaKey[] = [
  "mars", "venus", "mercury", "moon", "sun", "mercury",
  "venus", "mars", "jupiter", "saturn", "saturn", "jupiter",
];

export function rashiLordKey(rashi: number): GrahaKey {
  return RASHI_LORD_KEYS[(((rashi - 1) % 12) + 12) % 12]!;
}

/** Signs (1–12) ruled by a graha; rahu/ketu rule none in the Parashari scheme. */
export function ownedRashis(graha: GrahaKey): number[] {
  const out: number[] = [];
  RASHI_LORD_KEYS.forEach((lord, i) => {
    if (lord === graha) out.push(i + 1);
  });
  return out;
}

/** Naisargika (natural) friendships per Parashara; nodes per common convention. */
const FRIENDS: Record<GrahaKey, GrahaKey[]> = {
  sun: ["moon", "mars", "jupiter"],
  moon: ["sun", "mercury"],
  mars: ["sun", "moon", "jupiter"],
  mercury: ["sun", "venus"],
  jupiter: ["sun", "moon", "mars"],
  venus: ["mercury", "saturn"],
  saturn: ["mercury", "venus"],
  rahu: ["mercury", "venus", "saturn"],
  ketu: ["mars", "venus", "saturn"],
};

const ENEMIES: Record<GrahaKey, GrahaKey[]> = {
  sun: ["venus", "saturn"],
  moon: [],
  mars: ["mercury"],
  mercury: ["moon"],
  jupiter: ["mercury", "venus"],
  venus: ["sun", "moon"],
  saturn: ["sun", "moon", "mars"],
  rahu: ["sun", "moon", "mars"],
  ketu: ["sun", "moon"],
};

export type GrahaRelation = "self" | "friend" | "enemy" | "neutral";

export const RELATION_LABELS: Record<GrahaRelation, { ne: string; en: string }> = {
  self: { ne: "स्वयं", en: "Self" },
  friend: { ne: "मित्र", en: "Friend" },
  enemy: { ne: "शत्रु", en: "Enemy" },
  neutral: { ne: "सम", en: "Neutral" },
};

export function naturalRelation(graha: GrahaKey, other: GrahaKey): GrahaRelation {
  if (graha === other) return "self";
  if (FRIENDS[graha].includes(other)) return "friend";
  if (ENEMIES[graha].includes(other)) return "enemy";
  return "neutral";
}

type DignityData = {
  exalt?: number;
  debil?: number;
  moola?: { rashi: number; to: number };
  own: number[];
};

/** Exaltation / debilitation / moolatrikona (degree band) / own signs. */
const DIGNITY_DATA: Record<GrahaKey, DignityData> = {
  sun: { exalt: 1, debil: 7, moola: { rashi: 5, to: 20 }, own: [5] },
  moon: { exalt: 2, debil: 8, moola: { rashi: 2, to: 30 }, own: [4] },
  mars: { exalt: 10, debil: 4, moola: { rashi: 1, to: 12 }, own: [1, 8] },
  mercury: { exalt: 6, debil: 12, moola: { rashi: 6, to: 20 }, own: [3, 6] },
  jupiter: { exalt: 4, debil: 10, moola: { rashi: 9, to: 10 }, own: [9, 12] },
  venus: { exalt: 12, debil: 6, moola: { rashi: 7, to: 15 }, own: [2, 7] },
  saturn: { exalt: 7, debil: 1, moola: { rashi: 11, to: 20 }, own: [10, 11] },
  rahu: { exalt: 2, debil: 8, own: [11] },
  ketu: { exalt: 8, debil: 2, own: [8] },
};

export type GrahaDignity =
  | "exalted"
  | "moolatrikona"
  | "own"
  | "friend_house"
  | "neutral_house"
  | "enemy_house"
  | "debilitated";

export const DIGNITY_LABELS: Record<GrahaDignity, { ne: string; en: string }> = {
  exalted: { ne: "उच्च", en: "Exalted" },
  moolatrikona: { ne: "मूलत्रिकोण", en: "Moolatrikona" },
  own: { ne: "स्वगृह", en: "Own sign" },
  friend_house: { ne: "मित्र गृह", en: "Friend's sign" },
  neutral_house: { ne: "सम गृह", en: "Neutral sign" },
  enemy_house: { ne: "शत्रु गृह", en: "Enemy's sign" },
  debilitated: { ne: "नीच", en: "Debilitated" },
};

/**
 * Sign-based dignity of a graha. Pass `degInRashi` for D1 positions so the
 * moolatrikona degree bands apply; for divisional positions leave it
 * undefined and the whole sign counts.
 */
export function grahaDignity(
  graha: GrahaKey,
  rashi: number,
  degInRashi?: number,
): GrahaDignity {
  const d = DIGNITY_DATA[graha];
  if (rashi === d.debil) return "debilitated";
  if (rashi === d.exalt) {
    if (degInRashi != null) {
      // Moon: Taurus 0–3° exalted, 3–30° moolatrikona.
      if (graha === "moon") return degInRashi < 3 ? "exalted" : "moolatrikona";
      // Mercury: Virgo 0–15° exalted, 15–20° moolatrikona, rest own.
      if (graha === "mercury") {
        return degInRashi < 15 ? "exalted" : degInRashi < 20 ? "moolatrikona" : "own";
      }
    }
    return "exalted";
  }
  if (d.moola && rashi === d.moola.rashi) {
    return degInRashi == null || degInRashi < d.moola.to ? "moolatrikona" : "own";
  }
  if (d.own.includes(rashi)) return "own";
  const rel = naturalRelation(graha, rashiLordKey(rashi));
  if (rel === "friend") return "friend_house";
  if (rel === "enemy") return "enemy_house";
  return "neutral_house";
}

const NAKSHATRA_SPAN_DEG = 360 / 27;

/** Nakshatra (Vimshottari) lord for a sidereal longitude. */
export function nakshatraLordKey(longitude: number): DashaLord {
  const lon = ((longitude % 360) + 360) % 360;
  const index = Math.min(Math.floor(lon / NAKSHATRA_SPAN_DEG), 26);
  return DASHA_SEQUENCE[index % 9]!;
}

/**
 * KP sub-lord: each nakshatra is split into 9 parts proportional to the
 * Vimshottari years, starting from the nakshatra's own lord.
 */
export function kpSubLordFromLongitude(longitude: number): DashaLord {
  const lon = ((longitude % 360) + 360) % 360;
  const index = Math.min(Math.floor(lon / NAKSHATRA_SPAN_DEG), 26);
  const startIdx = index % 9;
  let elapsed = ((lon - index * NAKSHATRA_SPAN_DEG) / NAKSHATRA_SPAN_DEG) * 120;
  for (let i = 0; i < 9; i++) {
    const lord = DASHA_SEQUENCE[(startIdx + i) % 9]!;
    if (elapsed < DASHA_YEARS[lord]) return lord;
    elapsed -= DASHA_YEARS[lord];
  }
  return DASHA_SEQUENCE[startIdx]!;
}

export interface LongitudeDmsParts {
  rashiNum: number;
  deg: number;
  min: number;
  sec: number;
}

/** Degrees • minutes • seconds inside the occupied rashi. */
export function longitudeDmsParts(longitude: number): LongitudeDmsParts {
  const lon = ((longitude % 360) + 360) % 360;
  const rashiNum = Math.floor(lon / 30) + 1;
  let totalSec = Math.round((lon % 30) * 3600);
  if (totalSec >= 30 * 3600) totalSec = 30 * 3600 - 1;
  const deg = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  return { rashiNum, deg, min, sec };
}
