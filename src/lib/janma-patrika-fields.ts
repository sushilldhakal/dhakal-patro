import { isEnglishLocale } from "@/lib/avakahada-locale";
import { navataraFromNumber } from "@/lib/navatara-bala";
import { toNepaliDigits } from "@/lib/panchanga-format";

const PAYA_NE = ["सुवर्ण", "रजत", "ताम्र", "लोह"] as const;
const PAYA_EN = ["Gold", "Silver", "Copper", "Iron"] as const;

/** Moon bhava from lagna (1–12). */
export function moonBhavaFromLagna(moonRashiNum: number, lagnaRashiNum: number): number {
  return ((moonRashiNum - lagnaRashiNum + 12) % 12) + 1;
}

/** Drik-style राशि पाय — Moon house from Lagna. */
export function rashiPayaFromBhava(bhava: number, lang?: string): string {
  const idx =
    bhava === 1 || bhava === 6 || bhava === 11
      ? 0
      : bhava === 2 || bhava === 5 || bhava === 9
        ? 1
        : bhava === 3 || bhava === 7 || bhava === 10
          ? 2
          : 3;
  return isEnglishLocale(lang) ? PAYA_EN[idx]! : PAYA_NE[idx]!;
}

/** Nakshatra index 0–26 → Drik-style नक्षत्र पाय. */
const NAKSHATRA_PAYA_BY_INDEX: readonly (0 | 1 | 2 | 3)[] = [
  0, 0, 3, 3, 3, // Ashwini–Mrigashira
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // Ardra–Anuradha
  2, 2, 2, 2, 2, 2, 2, 2, 2, // Jyeshtha–Uttara Bhadrapada
  0, // Revati
];

export function nakshatraPayaFromIndex(nakIndex: number, lang?: string): string | undefined {
  if (nakIndex < 0 || nakIndex > 26) return undefined;
  const idx = NAKSHATRA_PAYA_BY_INDEX[nakIndex]!;
  return isEnglishLocale(lang) ? PAYA_EN[idx] : PAYA_NE[idx];
}

const YUNJA_NE = ["आदि", "मध्य", "अन्त्य"] as const;
const YUNJA_EN = ["Adi", "Madhya", "Antya"] as const;

/** Yunja by nakshatra groups of nine (Drik / classical). */
export function yunjaFromNakIndex(nakIndex: number, lang?: string): string {
  const idx = nakIndex < 9 ? 0 : nakIndex < 18 ? 1 : 2;
  return isEnglishLocale(lang) ? YUNJA_EN[idx]! : YUNJA_NE[idx]!;
}

const NADI_PATRIKA_NE = ["आद्य", "मध्य", "अन्त्य"] as const;
const NADI_PATRIKA_EN = ["Aadi", "Madhya", "Antya"] as const;

/** Tri-nadi for जन्म पत्रीका (nakshatra index mod 3). */
export function nadiPatrikaFromNakIndex(nakIndex: number, lang?: string): string {
  const idx = nakIndex % 3;
  return isEnglishLocale(lang) ? NADI_PATRIKA_EN[idx]! : NADI_PATRIKA_NE[idx]!;
}

/** जन्म तारा — 9-fold cycle from nakshatra index (Drik). */
export function janmaTaraFromNakIndex(nakIndex: number, lang?: string): string {
  const taraNum = (nakIndex % 9) + 1;
  const meta = navataraFromNumber(taraNum);
  if (isEnglishLocale(lang)) {
    const en: Record<string, string> = {
      जन्म: "Janma",
      सम्पत्: "Sampat",
      विपत्: "Vipat",
      क्षेम: "Kshema",
      प्रत्यक्: "Pratyak",
      साधना: "Sadhana",
      निधन: "Naidhana",
      मित्र: "Mitra",
      "परम मित्र": "Param Mitra",
    };
    return en[meta.tara] ?? meta.tara;
  }
  return meta.tara;
}

/** Ashtakoot-style वश्य labels for जन्म पत्रीका. */
const PATRIKA_VASHYA_NE = [
  "चतुष्पद", // मेष
  "चतुष्पद", // वृष
  "मानव", // मिथुन
  "जलचर", // कर्क
  "वनचर", // सिंह
  "मानव", // कन्या
  "मानव", // तुला
  "कीट", // वृश्चिक
  "मानव", // धनु
  "जलचर", // मकर
  "मानव", // कुम्भ
  "जलचर", // मीन
] as const;

const PATRIKA_VASHYA_EN = [
  "Quadruped",
  "Quadruped",
  "Manava",
  "Aquatic",
  "Wild",
  "Manava",
  "Manava",
  "Insect",
  "Manava",
  "Aquatic",
  "Manava",
  "Aquatic",
] as const;

export function patrikaVashyaFromRashiNum(rashiNum: number, lang?: string): string | undefined {
  if (rashiNum < 1 || rashiNum > 12) return undefined;
  const idx = rashiNum - 1;
  return isEnglishLocale(lang) ? PATRIKA_VASHYA_EN[idx] : PATRIKA_VASHYA_NE[idx];
}

export type GhadiPalaVipala = { ghadi: number; pala: number; vipala: number };

export function formatGhadiPalaVipala(
  { ghadi, pala, vipala }: GhadiPalaVipala,
  lang?: string,
): string {
  if (isEnglishLocale(lang)) {
    return `${ghadi} Ghati ${pala} Pala ${vipala} Vipala`;
  }
  return `${toNepaliDigits(ghadi)} घडी ${toNepaliDigits(pala)} पला ${toNepaliDigits(vipala)} विपला`;
}
