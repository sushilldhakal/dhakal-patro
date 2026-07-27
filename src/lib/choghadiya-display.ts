/** Choghadiya muhurta labels — names and qualities from ne.json / en.json. */

import i18n from "@/i18n";
import { normalizeLang, type Lang } from "@/i18n/locale";

export type ChoghadiyaTone = "good" | "bad" | "neutral";

/** Devanagari name → i18n key under choghadiya.types.* */
export const CHOGHADIYA_KEY_BY_NE: Record<string, string> = {
  अमृत: "amrita",
  शुभ: "shubha",
  लाभ: "labha",
  चर: "chara",
  रोग: "roga",
  काल: "kala",
  उद्वेग: "udvega",
};

export const CHOGHADIYA_TYPE_KEYS = [
  "amrita",
  "shubha",
  "labha",
  "chara",
  "roga",
  "kala",
  "udvega",
] as const;

export type ChoghadiyaTypeKey = (typeof CHOGHADIYA_TYPE_KEYS)[number];

export const TONE_BY_KEY: Record<ChoghadiyaTypeKey, ChoghadiyaTone> = {
  amrita: "good",
  shubha: "good",
  labha: "good",
  chara: "neutral",
  roga: "bad",
  kala: "bad",
  udvega: "bad",
};

function resolveLng(lang?: string | Lang): Lang {
  return lang ? normalizeLang(lang) : normalizeLang(i18n.language);
}

function typeKey(nameNe: string): string | undefined {
  return CHOGHADIYA_KEY_BY_NE[nameNe];
}

/** Legacy map for timeline code — built from i18n at call time. */
export function choghadiyaEnMap(lang?: string | Lang): Record<string, string> {
  const lng = resolveLng(lang);
  const out: Record<string, string> = {};
  for (const [ne, key] of Object.entries(CHOGHADIYA_KEY_BY_NE)) {
    out[ne] = i18n.t(`choghadiya.types.${key}.name`, { lng });
  }
  return out;
}

/** @deprecated Use {@link choghadiyaName} — kept for re-export compatibility. */
export const CHOGHADIYA_EN: Record<string, string> = new Proxy({} as Record<string, string>, {
  get(_t, prop: string) {
    const key = CHOGHADIYA_KEY_BY_NE[prop];
    if (!key) return prop;
    return i18n.t(`choghadiya.types.${key}.name`);
  },
});

export function choghadiyaTone(nameNe: string, bad?: boolean): ChoghadiyaTone {
  const key = typeKey(nameNe) as ChoghadiyaTypeKey | undefined;
  if (key) return TONE_BY_KEY[key];
  if (bad) return "bad";
  return "neutral";
}

export function choghadiyaName(nameNe: string, lang?: string | Lang): string {
  const key = typeKey(nameNe);
  if (!key) return nameNe;
  return i18n.t(`choghadiya.types.${key}.name`, { lng: resolveLng(lang) });
}

export function choghadiyaQuality(nameNe: string, lang?: string | Lang, bad?: boolean): string {
  const key = typeKey(nameNe);
  const lng = resolveLng(lang);
  if (key) {
    return i18n.t(`choghadiya.types.${key}.quality`, { lng });
  }
  if (lng === "en") return bad ? i18n.t("choghadiya.quality_bad", { lng }) : i18n.t("choghadiya.quality_neutral", { lng });
  return bad ? i18n.t("choghadiya.quality_bad", { lng }) : i18n.t("choghadiya.quality_neutral", { lng });
}

/** Full row label, e.g. `Amrita — Excellent (Highly Auspicious)`. */
export function choghadiyaRowLabel(nameNe: string, lang?: string | Lang, bad?: boolean): string {
  return `${choghadiyaName(nameNe, lang)} — ${choghadiyaQuality(nameNe, lang, bad)}`;
}

export function choghadiyaLegendMarker(tone: ChoghadiyaTone): string {
  if (tone === "good") return "🟢";
  if (tone === "bad") return "🔴";
  return "🟡";
}

export function choghadiyaLegendLabel(typeKey: ChoghadiyaTypeKey, lang?: string | Lang): string {
  const lng = resolveLng(lang);
  const name = i18n.t(`choghadiya.types.${typeKey}.name`, { lng });
  const quality = i18n.t(`choghadiya.types.${typeKey}.quality`, { lng });
  return `${name} — ${quality}`;
}
