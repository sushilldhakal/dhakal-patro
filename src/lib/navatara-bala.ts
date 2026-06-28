import type { PanchangaDay } from "@/lib/api";
import nakshatraData from "@/lib/nakshatra-icons-data.json";
import { getPanchangaDetail } from "@/lib/panchanga-format";

export type NavataraTone = "best" | "good" | "neutral" | "bad" | "worst";

export type NavataraEntry = {
  name: string;
  tara: string;
  quality: string;
  tone: NavataraTone;
  taraNum: number;
};

export const NAVATARA_TYPES: {
  id: number;
  tara: string;
  quality: string;
  tone: NavataraTone;
}[] = [
  { id: 1, tara: "जन्म", quality: "मध्यम", tone: "neutral" },
  { id: 2, tara: "सम्पत्", quality: "अति शुभ", tone: "best" },
  { id: 3, tara: "विपत्", quality: "अशुभ", tone: "bad" },
  { id: 4, tara: "क्षेम", quality: "अति शुभ", tone: "best" },
  { id: 5, tara: "प्रत्यक्", quality: "अशुभ", tone: "bad" },
  { id: 6, tara: "साधना", quality: "अति शुभ", tone: "best" },
  { id: 7, tara: "निधन", quality: "घातक", tone: "worst" },
  { id: 8, tara: "मित्र", quality: "शुभ", tone: "good" },
  { id: 9, tara: "परम मित्र", quality: "अति शुभ", tone: "best" },
];

export const NAKSHATRA_NAMES_NE = nakshatraData.map((n) => n.ne);

export const RASHI_NAMES_NE = [
  "मेष", "वृष", "मिथुन", "कर्कट", "सिंह", "कन्या",
  "तुला", "वृश्चिक", "धनु", "मकर", "कुम्भ", "मीन",
] as const;

export function computeNavataraNumber(
  moonIdx: number,
  targetIdx: number,
  cycleSize: 27 | 12,
): number {
  const diff = (targetIdx - moonIdx + cycleSize) % cycleSize;
  if (diff === 0) return 1;
  return ((9 - (diff % 9)) % 9) + 1;
}

export function navataraFromNumber(taraNum: number): Omit<NavataraEntry, "name" | "taraNum"> {
  const row = NAVATARA_TYPES.find((t) => t.id === taraNum) ?? NAVATARA_TYPES[0]!;
  return { tara: row.tara, quality: row.quality, tone: row.tone };
}

export function buildNavataraTable(
  moonIdx: number,
  names: readonly string[],
  cycleSize: 27 | 12,
): NavataraEntry[] {
  return names.map((name, idx) => {
    const taraNum = computeNavataraNumber(moonIdx, idx, cycleSize);
    const meta = navataraFromNumber(taraNum);
    return { name, taraNum, ...meta };
  });
}

type AngaBlock = { number?: number; name_ne?: string; name?: string };

function readAngaIndex(
  p: PanchangaDay,
  key: "nakshatra" | "chandra_rashi",
  fallbackNames: readonly string[],
): { idx: number | null; label: string | null } {
  const detail = getPanchangaDetail(p);
  const block = (detail?.[key] ?? p[key]) as AngaBlock | undefined;
  if (block?.number != null) {
    return {
      idx: block.number - 1,
      label: block.name_ne ?? block.name ?? fallbackNames[block.number - 1] ?? null,
    };
  }
  const name = block?.name_ne ?? block?.name;
  if (!name) return { idx: null, label: null };
  const idx = fallbackNames.findIndex(
    (n) => n === name || name.includes(n) || n.includes(name),
  );
  return { idx: idx >= 0 ? idx : null, label: name };
}

export function getMoonNakshatraRef(p: PanchangaDay) {
  return readAngaIndex(p, "nakshatra", NAKSHATRA_NAMES_NE);
}

export function getMoonRashiRef(p: PanchangaDay) {
  return readAngaIndex(p, "chandra_rashi", RASHI_NAMES_NE);
}

export function buildTaraBalaTable(p: PanchangaDay): {
  moonLabel: string | null;
  rows: NavataraEntry[];
} {
  const { idx, label } = getMoonNakshatraRef(p);
  if (idx == null) return { moonLabel: label, rows: [] };
  return {
    moonLabel: label ?? NAKSHATRA_NAMES_NE[idx],
    rows: buildNavataraTable(idx, NAKSHATRA_NAMES_NE, 27),
  };
}

export function buildChandraBalaTable(p: PanchangaDay): {
  moonLabel: string | null;
  rows: NavataraEntry[];
} {
  const { idx, label } = getMoonRashiRef(p);
  if (idx == null) return { moonLabel: label, rows: [] };
  return {
    moonLabel: label ?? RASHI_NAMES_NE[idx],
    rows: buildNavataraTable(idx, RASHI_NAMES_NE, 12),
  };
}
