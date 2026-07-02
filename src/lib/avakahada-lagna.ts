import { AVAKAHADA, RASHI_META, type Gana, type Varna } from "@/lib/avakahada-data";
import {
  localizeGana,
  localizeNadi,
  localizeYoni,
  isEnglishLocale,
} from "@/lib/avakahada-locale";
import { nakshatraPadaFromLongitude } from "@/lib/panchang-elements";

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

export type LagnaAvakahada = {
  nakshatraNe: string;
  pada: number;
  gana: string;
  akshara: string;
  nadi: string;
  asana: string;
  yoni: string;
  jati: string;
};

export function lagnaAvakahadaFromLongitude(
  lagnaLongitude: number,
  lang?: string,
  lagnaRashiNe?: string,
): LagnaAvakahada | null {
  const nak = nakshatraPadaFromLongitude(lagnaLongitude);
  const row = AVAKAHADA[nak.index];
  if (!row) return null;

  const padaIndex = nak.pada - 1;
  const lagnaVarna = lagnaRashiNe ? RASHI_META[lagnaRashiNe]?.varna : undefined;
  const charanRashi = row.charanRashis[padaIndex];
  const varna = lagnaVarna ?? (charanRashi ? RASHI_META[charanRashi]?.varna : undefined);
  if (!varna) return null;

  const en = isEnglishLocale(lang);

  return {
    nakshatraNe: nak.ne,
    pada: nak.pada,
    gana: en ? localizeGana(row.gana, lang) : GANA_NE[row.gana],
    akshara: row.aksharas[padaIndex] ?? "—",
    nadi: en ? localizeNadi(row.nadi, lang) : row.nadi,
    asana: en ? ASANA_BY_PADA_EN[padaIndex]! : ASANA_BY_PADA_NE[padaIndex]!,
    yoni: en ? localizeYoni(row.yoni, lang) : row.yoni,
    jati: en ? JATI_EN[varna] : JATI_NE[varna],
  };
}
