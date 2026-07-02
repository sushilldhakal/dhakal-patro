import { AVAKAHADA, RASHI_META, type Gana, type Varna } from "@/lib/avakahada-data";
import {
  localizeGana,
  localizeYoni,
  isEnglishLocale,
} from "@/lib/avakahada-locale";
import {
  janmaTaraFromNakIndex,
  moonBhavaFromLagna,
  nadiPatrikaFromNakIndex,
  nakshatraPayaFromIndex,
  patrikaVashyaFromRashiNum,
  rashiPayaFromBhava,
  yunjaFromNakIndex,
} from "@/lib/janma-patrika-fields";
import { nakshatraPadaFromLongitude, resolveJanmaNakshatra } from "@/lib/panchang-elements";
import { TATTVA_EN } from "@/lib/wheel-locale";
import { RASHI_ELEM } from "@/lib/wheel-data";

/** Classical आसन by nakshatra pada (१–४). */
const ASANA_BY_PADA_NE = ["खट्वाङ्ग", "मञ्च", "भद्रपीठ", "शयन"] as const;
const ASANA_BY_PADA_EN = ["Khattvanga", "Mancha", "Bhadrasana", "Shayana"] as const;

const GANA_NE: Record<Gana, string> = {
  देव: "देव",
  नर: "मनुष्य",
  राक्षस: "राक्षस",
};

const JATI_NE: Record<Varna, string> = {
  विप्र: "ब्राह्मण",
  क्षत्रिय: "क्षत्रिय",
  वैश्य: "वैश्य",
  शूद्र: "शूद्र",
};

const JATI_EN: Record<Varna, string> = {
  विप्र: "Brahmin",
  क्षत्रिय: "Kshatriya",
  वैश्य: "Vaishya",
  शूद्र: "Shudra",
};

/** Patro राशि labels → avakahada RASHI_META keys (e.g. कर्कट → कर्क). */
const RASHI_META_KEY: Record<string, string> = {
  कर्कट: "कर्क",
  वृषभ: "वृष",
};

export type JanmaAvakahada = {
  nakshatraNe: string;
  pada: number;
  rashiPaya: string;
  nakshatraPaya: string;
  tattva: string;
  yunja: string;
  vashya: string;
  tara: string;
  gana: string;
  akshara: string;
  nadi: string;
  asana: string;
  yoni: string;
  jati: string;
};

/** @deprecated use janmaAvakahadaFromLongitude */
export type LagnaAvakahada = JanmaAvakahada;

/**
 * अवकहडा / जन्म पत्रीका गुण from चन्द्र nakshatra at birth.
 * Prefer resolved nakshatra+pada (panchanga API) over raw longitude floor math.
 */
export function janmaAvakahadaFromLongitude(
  siderealLongitude: number,
  lang?: string,
  /** चन्द्र राशि for जात / तत्त्व. */
  chandraRashiNe?: string,
  /** चन्द्र राशि number (1–12). */
  chandraRashiNum?: number,
  /** लग्न राशि number (1–12) for राशि पाय. */
  lagnaRashiNum?: number,
  /** When set, drives nakshatra+pada (and अक्षर) instead of longitude alone. */
  resolvedNakshatra?: { index: number; ne: string; pada: number } | null,
): JanmaAvakahada | null {
  const nak =
    resolvedNakshatra ??
    nakshatraPadaFromLongitude(siderealLongitude);
  const row = AVAKAHADA[nak.index];
  if (!row) return null;

  const padaIndex = nak.pada - 1;
  const charanRashi = row.charanRashis[padaIndex];
  const chandraMetaKey = chandraRashiNe
    ? (RASHI_META_KEY[chandraRashiNe] ?? chandraRashiNe)
    : undefined;
  const chandraVarna = chandraMetaKey ? RASHI_META[chandraMetaKey]?.varna : undefined;
  const varna =
    chandraVarna ?? (charanRashi ? RASHI_META[charanRashi]?.varna : undefined);
  if (!varna) return null;

  const en = isEnglishLocale(lang);
  const tattvaNe =
    chandraRashiNum != null && chandraRashiNum >= 1 && chandraRashiNum <= 12
      ? RASHI_ELEM[chandraRashiNum - 1]!
      : undefined;

  const rashiPaya =
    chandraRashiNum != null && lagnaRashiNum != null
      ? rashiPayaFromBhava(moonBhavaFromLagna(chandraRashiNum, lagnaRashiNum), lang)
      : "—";

  return {
    nakshatraNe: nak.ne,
    pada: nak.pada,
    rashiPaya,
    nakshatraPaya: nakshatraPayaFromIndex(nak.index, lang) ?? "—",
    tattva: tattvaNe ? (en ? TATTVA_EN[tattvaNe] ?? tattvaNe : tattvaNe) : "—",
    yunja: yunjaFromNakIndex(nak.index, lang),
    vashya:
      chandraRashiNum != null
        ? (patrikaVashyaFromRashiNum(chandraRashiNum, lang) ?? "—")
        : "—",
    tara: janmaTaraFromNakIndex(nak.index, lang),
    gana: en ? localizeGana(row.gana, lang) : GANA_NE[row.gana],
    akshara: row.aksharas[padaIndex] ?? "—",
    nadi: nadiPatrikaFromNakIndex(nak.index, lang),
    asana: en ? ASANA_BY_PADA_EN[padaIndex]! : ASANA_BY_PADA_NE[padaIndex]!,
    yoni: en ? localizeYoni(row.yoni, lang) : row.yoni,
    jati: en ? JATI_EN[varna] : JATI_NE[varna],
  };
}

export function lagnaAvakahadaFromLongitude(
  lagnaLongitude: number,
  lang?: string,
  lagnaRashiNe?: string,
): JanmaAvakahada | null {
  return janmaAvakahadaFromLongitude(lagnaLongitude, lang, lagnaRashiNe);
}
