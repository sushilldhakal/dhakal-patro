import type { GocharGraha } from "@/lib/api";
import { adToBS } from "@/lib/bs-calendar";
import { formatBsIsoDateNepali } from "@/lib/panchanga-format";

export const RASHI_NE = [
  "मेष", "वृष", "मिथुन", "कर्क", "सिंह", "कन्या",
  "तुला", "वृश्चिक", "धनु", "मकर", "कुम्भ", "मीन",
] as const;

/** English rāśi names from the gochar API, aligned to RASHI_NE order. */
export const RASHI_EN = [
  "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
  "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
] as const;

export const GRAHA_CHART_LABEL: Record<string, string> = {
  sun: "सू.",
  moon: "च.",
  mars: "मं.",
  mercury: "बु.",
  jupiter: "बृ.",
  venus: "शु.",
  saturn: "श.",
  rahu: "रा.",
  ketu: "के.",
};

export function rashiEnToNe(en?: string | null): string | undefined {
  if (!en) return undefined;
  const key = en.trim().toLowerCase();
  const i = RASHI_EN.findIndex((r) => r.toLowerCase() === key);
  if (i >= 0) return RASHI_NE[i];
  const partial = RASHI_EN.findIndex((r) => key.startsWith(r.toLowerCase().slice(0, 4)));
  return partial >= 0 ? RASHI_NE[partial] : en;
}

export function rashiNoFromGraha(g: GocharGraha): number | undefined {
  const raw = g.rashi_no;
  if (typeof raw === "number" && raw >= 1 && raw <= 12) return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    if (!Number.isNaN(n) && n >= 1 && n <= 12) return n;
  }
  const fromName = rashiEnToNe(g.rashi);
  if (!fromName) return undefined;
  const idx = RASHI_NE.indexOf(fromName as (typeof RASHI_NE)[number]);
  return idx >= 0 ? idx + 1 : undefined;
}

export function grahaChartLabel(key: string, g: GocharGraha): string {
  return GRAHA_CHART_LABEL[key] ?? g.name_ne?.slice(0, 2) ?? key.slice(0, 2);
}

export function grahaRashiNe(g: GocharGraha): string | undefined {
  return g.rashi_ne ?? rashiEnToNe(g.rashi);
}

export function buildPlanetsByRashi(
  grahas: Array<GocharGraha & { key: string }>,
): Record<number, string[]> {
  const out: Record<number, string[]> = {};
  for (const g of grahas) {
    const num = rashiNoFromGraha(g);
    if (num == null) continue;
    (out[num] ??= []).push(grahaChartLabel(g.key, g));
  }
  return out;
}

export function formatGocharBsLabel(dateBs?: string | null, dateAd?: string | null): string | undefined {
  const fromBs = formatBsIsoDateNepali(dateBs);
  if (fromBs) return fromBs;
  if (!dateAd) return undefined;
  const [y, m, d] = dateAd.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  const bs = adToBS(new Date(y, m - 1, d));
  return formatBsIsoDateNepali(`${bs.year}-${bs.month}-${bs.day}`);
}
