import { drekkanaRashiFromLongitude } from "@/lib/drekkana";
import { navamsaRashiFromLongitude } from "@/lib/navamsa";

export type VargaDivision =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  | 16 | 20 | 24 | 27 | 30 | 40 | 45 | 60;

export type ChartAnchor =
  | "lagna"
  | "sun"
  | "moon"
  | "mars"
  | "mercury"
  | "jupiter"
  | "venus"
  | "saturn"
  | "rahu"
  | "ketu";

export const GRAHA_ANCHOR_ORDER: ChartAnchor[] = [
  "sun",
  "moon",
  "mars",
  "mercury",
  "jupiter",
  "venus",
  "saturn",
  "rahu",
  "ketu",
];

export const CHART_ANCHOR_LABELS: Record<
  ChartAnchor,
  { labelNe: string; labelEn: string }
> = {
  lagna: { labelNe: "लग्न", labelEn: "Lagna" },
  sun: { labelNe: "सूर्य", labelEn: "Sun" },
  moon: { labelNe: "चन्द्र", labelEn: "Moon" },
  mars: { labelNe: "मंगल", labelEn: "Mars" },
  mercury: { labelNe: "बुध", labelEn: "Mercury" },
  jupiter: { labelNe: "बृहस्पति", labelEn: "Jupiter" },
  venus: { labelNe: "शुक्र", labelEn: "Venus" },
  saturn: { labelNe: "शनि", labelEn: "Saturn" },
  rahu: { labelNe: "राहु", labelEn: "Rahu" },
  ketu: { labelNe: "केतु", labelEn: "Ketu" },
};

export const VARGA_OPTIONS: {
  division: VargaDivision;
  labelNe: string;
  labelEn: string;
  short: string;
}[] = [
  { division: 1, labelNe: "राशि", labelEn: "Rashi", short: "D1" },
  { division: 2, labelNe: "होरा", labelEn: "Hora", short: "D2" },
  { division: 3, labelNe: "द्रेष्काण", labelEn: "Drekkana", short: "D3" },
  { division: 4, labelNe: "चतुर्थांश", labelEn: "Chaturthamsa", short: "D4" },
  { division: 5, labelNe: "पञ्चांश", labelEn: "Panchamsa", short: "D5" },
  { division: 6, labelNe: "षष्ठांश", labelEn: "Shashthamsa", short: "D6" },
  { division: 7, labelNe: "सप्तांश", labelEn: "Saptamsa", short: "D7" },
  { division: 8, labelNe: "अष्टांश", labelEn: "Ashtamsa", short: "D8" },
  { division: 9, labelNe: "नवांश", labelEn: "Navamsa", short: "D9" },
  { division: 10, labelNe: "दशांश", labelEn: "Dasamsa", short: "D10" },
  { division: 11, labelNe: "एकादशांश", labelEn: "Ekadashamsa", short: "D11" },
  { division: 12, labelNe: "द्वादशांश", labelEn: "Dwadashamsa", short: "D12" },
  { division: 16, labelNe: "षोडशांश", labelEn: "Shodashamsa", short: "D16" },
  { division: 20, labelNe: "विंशांश", labelEn: "Vimsamsa", short: "D20" },
  { division: 24, labelNe: "चतुर्विंशांश", labelEn: "Chaturvimsamsa", short: "D24" },
  { division: 27, labelNe: "सप्तविंशांश", labelEn: "Saptavimsamsa", short: "D27" },
  { division: 30, labelNe: "त्रिंशांश", labelEn: "Trimsamsa", short: "D30" },
  { division: 40, labelNe: "खवेदांश", labelEn: "Khavedamsa", short: "D40" },
  { division: 45, labelNe: "अक्षवेदांश", labelEn: "Akshavedamsa", short: "D45" },
  { division: 60, labelNe: "षष्ट्यंश", labelEn: "Shashtiamsa", short: "D60" },
];

function normLon(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}

function signIndex(longitude: number): number {
  return Math.floor(normLon(longitude) / 30);
}

function degInSign(longitude: number): number {
  return normLon(longitude) % 30;
}

function isOddSign(sign: number): boolean {
  return sign % 2 === 0;
}

function modality(sign: number): 0 | 1 | 2 {
  return (sign % 3) as 0 | 1 | 2;
}

/** Parashari divisional rashi (1–12) from sidereal longitude. */
export function vargaRashiFromLongitude(division: VargaDivision, longitude: number): number {
  const lon = normLon(longitude);
  const s = signIndex(lon);
  const d = degInSign(lon);

  switch (division) {
    case 1:
      return s + 1;
    case 2: {
      const half = d < 15 ? 0 : 1;
      return isOddSign(s) ? (half === 0 ? 5 : 4) : half === 0 ? 4 : 5;
    }
    case 3:
      return drekkanaRashiFromLongitude(lon);
    case 4: {
      const p = Math.floor(d / 7.5);
      return ((s + p) % 12) + 1;
    }
    case 5: {
      const p = Math.floor(d / 6);
      const start = isOddSign(s) ? 0 : 6;
      return ((start + p) % 12) + 1;
    }
    case 6: {
      const p = Math.floor(d / 5);
      return ((s + p) % 12) + 1;
    }
    case 7: {
      const p = Math.floor(d / (30 / 7));
      const start = isOddSign(s) ? s : (s + 6) % 12;
      return ((start + p) % 12) + 1;
    }
    case 8: {
      const p = Math.floor(d / 3.75);
      const start = modality(s) === 0 ? 0 : modality(s) === 1 ? 4 : 8;
      return ((start + p) % 12) + 1;
    }
    case 9:
      return navamsaRashiFromLongitude(lon);
    case 10: {
      const p = Math.floor(d / 3);
      const start = isOddSign(s) ? s : (s + 8) % 12;
      return ((start + p) % 12) + 1;
    }
    case 11: {
      const p = Math.floor(d / (30 / 11));
      const start = isOddSign(s) ? 0 : 6;
      return ((start + p) % 12) + 1;
    }
    case 12: {
      const p = Math.floor(d / 2.5);
      return ((s + p) % 12) + 1;
    }
    case 16: {
      const p = Math.floor(d / (30 / 16));
      const start = modality(s) === 0 ? 0 : modality(s) === 1 ? 4 : 8;
      return ((start + p) % 12) + 1;
    }
    case 20: {
      const p = Math.floor(d / 1.5);
      const start = modality(s) === 0 ? 0 : modality(s) === 1 ? 8 : 4;
      return ((start + p) % 12) + 1;
    }
    case 24: {
      const p = Math.floor(d / 1.25);
      const start = isOddSign(s) ? 4 : 3;
      return ((start + p) % 12) + 1;
    }
    case 27: {
      const p = Math.floor(d / (30 / 27));
      const start = modality(s) === 0 ? 0 : modality(s) === 1 ? 3 : 6;
      return ((start + p) % 12) + 1;
    }
    case 30: {
      if (isOddSign(s)) {
        if (d < 5) return 1;
        if (d < 10) return 11;
        if (d < 18) return 9;
        if (d < 25) return 3;
        return 7;
      }
      if (d < 5) return 2;
      if (d < 12) return 6;
      if (d < 20) return 12;
      if (d < 25) return 10;
      return 8;
    }
    case 40: {
      const p = Math.floor(d / 0.75);
      const start = isOddSign(s) ? 0 : 6;
      return ((start + p) % 12) + 1;
    }
    case 45: {
      const p = Math.floor(d / (30 / 45));
      const start = modality(s) === 0 ? 0 : modality(s) === 1 ? 4 : 8;
      return ((start + p) % 12) + 1;
    }
    case 60: {
      const p = Math.floor(d / 0.5);
      const start = isOddSign(s) ? s : (s + 6) % 12;
      return ((start + p) % 12) + 1;
    }
    default:
      return s + 1;
  }
}

export function vargaOption(division: VargaDivision) {
  return VARGA_OPTIONS.find((v) => v.division === division) ?? VARGA_OPTIONS[0]!;
}
