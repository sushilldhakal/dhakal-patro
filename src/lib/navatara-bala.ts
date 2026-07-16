import type { NavataraTone } from "@/lib/api";
import { normalizeLang } from "@/i18n/locale";

export type { NavataraRow, NavataraTableBlock, NavataraTone } from "@/lib/api";

export function navataraSlotTone(tone: NavataraTone): "good" | "bad" | "neutral" {
  if (tone === "best" || tone === "good") return "good";
  if (tone === "bad" || tone === "worst") return "bad";
  return "neutral";
}

/** Tara names shown in daily muhurta (API often returns Nepali only). */
const TARA_NE_TO_EN: Record<string, string> = {
  जन्म: "Janma",
  सम्पत्: "Sampat",
  विपत्: "Vipat",
  क्षेम: "Kshema",
  प्रत्यरि: "Pratyari",
  प्रत्यक्: "Pratyari",
  साधक: "Sadhaka",
  साधना: "Sadhaka",
  वध: "Vadha",
  निधन: "Nidhana",
  मित्र: "Mitra",
  अतिमित्र: "Ati-mitra",
  "परम मित्र": "Parama Mitra",
  परममित्र: "Parama Mitra",
};

/** Quality labels paired with tara (शुभ / अशुभ / …). */
const QUALITY_NE_TO_EN: Record<string, string> = {
  "अति शुभ": "Very auspicious",
  अतिशुभ: "Very auspicious",
  शुभ: "Auspicious",
  अशुभ: "Inauspicious",
  घातक: "Fatal",
  सामान्य: "Neutral",
  मध्यम: "Medium",
};

function translateToken(value: string, map: Record<string, string>): string {
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (map[trimmed]) return map[trimmed];
  // Already Latin — keep as-is.
  if (!/[\u0900-\u097F]/.test(trimmed)) return trimmed;
  return map[trimmed] ?? trimmed;
}

/** Locale-aware tara label (जन्म → Janma). */
export function formatNavataraTara(tara: string, lang?: string): string {
  if (normalizeLang(lang) !== "en") return tara;
  return translateToken(tara, TARA_NE_TO_EN);
}

/** Locale-aware quality label (अति शुभ → Very auspicious). */
export function formatNavataraQuality(quality: string, lang?: string): string {
  if (normalizeLang(lang) !== "en") return quality;
  return translateToken(quality, QUALITY_NE_TO_EN);
}
