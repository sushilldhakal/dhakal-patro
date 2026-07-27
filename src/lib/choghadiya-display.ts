/** Choghadiya muhurta labels — shared by element page, timeline, and muhurta aside. */

export type ChoghadiyaTone = "good" | "bad" | "neutral";

export interface ChoghadiyaTypeMeta {
  nameNe: string;
  nameEn: string;
  qualityNe: string;
  qualityEn: string;
  tone: ChoghadiyaTone;
}

export const CHOGHADIYA_TYPES: ChoghadiyaTypeMeta[] = [
  {
    nameNe: "अमृत",
    nameEn: "Amrita",
    qualityNe: "उत्तम (अत्यन्त शुभ)",
    qualityEn: "Excellent (Highly Auspicious)",
    tone: "good",
  },
  {
    nameNe: "शुभ",
    nameEn: "Shubha",
    qualityNe: "शुभ",
    qualityEn: "Auspicious",
    tone: "good",
  },
  {
    nameNe: "लाभ",
    nameEn: "Labha",
    qualityNe: "लाभ",
    qualityEn: "Gain",
    tone: "good",
  },
  {
    nameNe: "चर",
    nameEn: "Chara",
    qualityNe: "यात्रा र चलचलका लागि राम्रो",
    qualityEn: "Good for Movement & Travel",
    tone: "neutral",
  },
  {
    nameNe: "रोग",
    nameEn: "Roga",
    qualityNe: "रोग (महत्त्वपूर्ण काम टाढा राख्नुहोस्)",
    qualityEn: "Disease (Avoid Important Tasks)",
    tone: "bad",
  },
  {
    nameNe: "काल",
    nameEn: "Kala",
    qualityNe: "अशुभ",
    qualityEn: "Inauspicious",
    tone: "bad",
  },
  {
    nameNe: "उद्वेग",
    nameEn: "Udvega",
    qualityNe: "चिन्ता (महत्त्वपूर्ण काम टाढा राख्नुहोस्)",
    qualityEn: "Anxiety (Avoid Important Tasks)",
    tone: "bad",
  },
];

export const CHOGHADIYA_EN: Record<string, string> = Object.fromEntries(
  CHOGHADIYA_TYPES.map((t) => [t.nameNe, t.nameEn]),
);

const BY_NE = new Map(CHOGHADIYA_TYPES.map((t) => [t.nameNe, t]));

function resolveMeta(nameNe: string, bad?: boolean): ChoghadiyaTypeMeta | undefined {
  const meta = BY_NE.get(nameNe);
  if (!meta) return undefined;
  if (bad && meta.tone !== "bad") {
    return { ...meta, tone: "bad" };
  }
  return meta;
}

export function choghadiyaTone(nameNe: string, bad?: boolean): ChoghadiyaTone {
  const meta = resolveMeta(nameNe, bad);
  if (meta) return meta.tone;
  if (bad) return "bad";
  return "neutral";
}

export function choghadiyaName(nameNe: string, lang: string): string {
  const meta = BY_NE.get(nameNe);
  if (!meta) return nameNe;
  return lang.slice(0, 2) === "en" ? meta.nameEn : meta.nameNe;
}

export function choghadiyaQuality(nameNe: string, lang: string, bad?: boolean): string {
  const meta = resolveMeta(nameNe, bad);
  if (!meta) return lang.slice(0, 2) === "en" ? (bad ? "Inauspicious" : "Neutral") : bad ? "अशुभ" : "सामान्य";
  return lang.slice(0, 2) === "en" ? meta.qualityEn : meta.qualityNe;
}

/** Full row label, e.g. `Amrita — Excellent (Highly Auspicious)`. */
export function choghadiyaRowLabel(nameNe: string, lang: string, bad?: boolean): string {
  return `${choghadiyaName(nameNe, lang)} — ${choghadiyaQuality(nameNe, lang, bad)}`;
}

export function choghadiyaLegendMarker(tone: ChoghadiyaTone): string {
  if (tone === "good") return "🟢";
  if (tone === "bad") return "🔴";
  return "🟡";
}
