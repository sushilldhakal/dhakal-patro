import type { GocharGraha } from "@/lib/api";
import { adToBS } from "@/lib/bs-calendar";
import { GOCHAR_RASHI_TO_HOUSE } from "@/lib/kundali/north-indian-layout";
import {
  formatRashiByNumber,
  rashiNeFromApiEn,
  rashiNumberFromName,
  resolveRashiDisplay,
} from "@/lib/rashi-i18n";
import { formatBsIsoDateNepali, toNepaliDigits } from "@/lib/panchanga-format";


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
  return rashiNeFromApiEn(en);
}

export function rashiNoFromGraha(g: GocharGraha): number | undefined {
  const raw = g.rashi_no;
  if (typeof raw === "number" && raw >= 1 && raw <= 12) return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    if (!Number.isNaN(n) && n >= 1 && n <= 12) return n;
  }
  const fromName = rashiNumberFromName(g.rashi_ne) ?? rashiNumberFromName(g.rashi);
  return fromName;
}

export function grahaChartLabel(key: string, g: GocharGraha): string {
  return GRAHA_CHART_LABEL[key] ?? g.name_ne?.slice(0, 2) ?? key.slice(0, 2);
}

export function grahaRashiNe(g: GocharGraha): string | undefined {
  return g.rashi_ne ?? rashiNeFromApiEn(g.rashi);
}

export function grahaRashiDisplay(g: GocharGraha, lang?: string): string | undefined {
  return resolveRashiDisplay(g.rashi_ne, g.rashi, lang);
}

export type GocharChartPlanet = {
  key: string;
  label: string;
  isRetrograde?: boolean;
  isCombust?: boolean;
};

export function buildPlanetsByRashi(
  grahas: Array<GocharGraha & { key: string }>,
): Record<number, GocharChartPlanet[]> {
  const out: Record<number, GocharChartPlanet[]> = {};
  for (const g of grahas) {
    const num = rashiNoFromGraha(g);
    if (num == null) continue;
    (out[num] ??= []).push({
      key: g.key,
      label: grahaChartLabel(g.key, g),
      isRetrograde: g.is_retrograde,
      isCombust: g.is_combust,
    });
  }
  return out;
}

/** पापाशाः — पाप ग्रहको गोचर कुण्डली घर (जस्तै म.८, रा.५, के.११) */
const PAPA_GRAHA_ORDER = ["mars", "saturn", "rahu", "ketu"] as const;

const PAPA_GRAHA_ABBREV: Record<(typeof PAPA_GRAHA_ORDER)[number], string> = {
  mars: "म",
  saturn: "श",
  rahu: "रा",
  ketu: "के",
};

export function buildPapanshaCodes(
  grahas: Array<GocharGraha & { key: string }>,
): string[] {
  const codes: string[] = [];
  for (const key of PAPA_GRAHA_ORDER) {
    const g = grahas.find((row) => row.key === key);
    if (!g) continue;
    const rashi = rashiNoFromGraha(g);
    if (rashi == null) continue;
    const house = GOCHAR_RASHI_TO_HOUSE[rashi];
    if (house == null) continue;
    codes.push(`${PAPA_GRAHA_ABBREV[key]}.${toNepaliDigits(house)}`);
  }
  return codes;
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

export function rashiEnFromNumber(rashi: number): string {
  return formatRashiByNumber(rashi, "en");
}
