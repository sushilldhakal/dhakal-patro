import type { Gana, Nadi, NakshatraRow } from "@/lib/avakahada-data";
import { RASHI_META } from "@/lib/avakahada-data";

export function isEnglishLocale(lang?: string): boolean {
  return (lang ?? "ne").startsWith("en");
}

const RASHI_NE_TO_EN: Record<string, string> = {
  मेष: "Mesha",
  वृष: "Vrishabha",
  मिथुन: "Mithuna",
  कर्क: "Karka",
  सिंह: "Simha",
  कन्या: "Kanya",
  तुला: "Tula",
  वृश्चिक: "Vrishchika",
  धनु: "Dhanu",
  मकर: "Makara",
  कुम्भ: "Kumbha",
  मीन: "Meena",
};

const LORD_NE_TO_EN: Record<string, string> = {
  भौम: "Mars",
  शुक्र: "Venus",
  बुध: "Mercury",
  चन्द्र: "Moon",
  सूर्य: "Sun",
  गुरु: "Jupiter",
  शनि: "Saturn",
};

const VARNA_NE_TO_EN: Record<string, string> = {
  विप्र: "Brahmin",
  क्षत्रिय: "Kshatriya",
  वैश्य: "Vaishya",
  शूद्र: "Shudra",
};

const VASHYA_NE_TO_EN: Record<string, string> = {
  चतुष्पद: "Quadruped",
  द्विपद: "Biped",
  जलचर: "Aquatic",
  वनचर: "Forest",
  कीट: "Insect",
};

const VASHYA_SHORT_EN: Record<string, string> = {
  Quadruped: "Quad",
  Biped: "Biped",
  Aquatic: "Aqua",
  Forest: "Forest",
  Insect: "Insect",
};

const YONI_NE_TO_EN: Record<string, string> = {
  अश्व: "Horse",
  महिष: "Buffalo",
  गज: "Elephant",
  सिंह: "Lion",
  अज: "Goat",
  वानर: "Monkey",
  सर्प: "Serpent",
  नकुल: "Mongoose",
  श्वान: "Dog",
  मृग: "Deer",
  मार्जार: "Cat",
  मूषक: "Rat",
  गौ: "Cow",
  व्याघ्र: "Tiger",
  मेष: "Ram",
};

const GANA_NE_TO_EN: Record<Gana, string> = {
  देव: "Deva",
  नर: "Manushya",
  राक्षस: "Rakshasa",
};

const NADI_NE_TO_EN: Record<Nadi, string> = {
  आद्य: "Adya",
  मध्य: "Madhya",
  अन्त्य: "Antya",
};

const NAKSHATRA_SLUG_TO_EN: Record<string, string> = {
  ashvini: "Ashwini",
  bharani: "Bharani",
  krittika: "Krittika",
  rohini: "Rohini",
  mrigashira: "Mrigashira",
  ardra: "Ardra",
  punarvasu: "Punarvasu",
  pushya: "Pushya",
  ashlesha: "Ashlesha",
  magha: "Magha",
  purvaphalguni: "Purva Phalguni",
  uttaraphalguni: "Uttara Phalguni",
  hasta: "Hasta",
  chitra: "Chitra",
  swati: "Swati",
  vishakha: "Vishakha",
  anuradha: "Anuradha",
  jyeshtha: "Jyeshtha",
  mula: "Mula",
  purvashada: "Purva Ashadha",
  uttarashada: "Uttara Ashadha",
  shravana: "Shravana",
  dhanishta: "Dhanishta",
  shatabhisha: "Shatabhisha",
  purvabhadrapada: "Purva Bhadrapada",
  uttarabhadrapada: "Uttara Bhadrapada",
  revati: "Revati",
};

const VARGA_NE_TO_EN: Record<string, string> = {
  गरुड: "Garuda",
  सर्प: "Serpent",
  मार्जार: "Cat",
  मूषक: "Rat",
  सिंह: "Lion",
  मृग: "Deer",
  श्वान: "Dog",
  मेष: "Ram",
};

function mapJoined(value: string, map: Record<string, string>): string {
  return value
    .split(" / ")
    .map((v) => map[v.trim()] ?? v)
    .join(" / ");
}

export function localizeRashi(ne: string, lang?: string): string {
  if (!isEnglishLocale(lang)) return ne;
  return RASHI_NE_TO_EN[ne] ?? ne;
}

export function localizeRashis(rashis: string[], lang?: string): string {
  if (!isEnglishLocale(lang)) return rashis.join(" / ");
  return rashis.map((r) => localizeRashi(r, lang)).join(" / ");
}

export function localizeLord(lord: string, lang?: string): string {
  if (!isEnglishLocale(lang)) return lord;
  return mapJoined(lord, LORD_NE_TO_EN);
}

export function localizeVarna(varna: string, lang?: string): string {
  if (!isEnglishLocale(lang)) return varna;
  return mapJoined(varna, VARNA_NE_TO_EN);
}

export function localizeVashya(vashya: string, lang?: string, short = false): string {
  if (!isEnglishLocale(lang)) {
    if (!short) return vashya;
    const shortNe: Record<string, string> = {
      चतुष्पद: "चतु",
      द्विपद: "द्वि",
      जलचर: "जल",
      वनचर: "वन",
    };
    return vashya
      .split(" / ")
      .map((v) => shortNe[v] ?? v)
      .join("·");
  }
  const en = mapJoined(vashya, VASHYA_NE_TO_EN);
  if (!short) return en;
  return en
    .split(" / ")
    .map((v) => VASHYA_SHORT_EN[v] ?? v)
    .join("·");
}

export function localizeYoni(yoni: string, lang?: string): string {
  if (!isEnglishLocale(lang)) return yoni;
  return YONI_NE_TO_EN[yoni] ?? yoni;
}

export function localizeGana(gana: Gana, lang?: string): string {
  if (!isEnglishLocale(lang)) return gana;
  return GANA_NE_TO_EN[gana];
}

export function localizeNadi(nadi: Nadi | string, lang?: string): string {
  if (!isEnglishLocale(lang)) return nadi;
  return NADI_NE_TO_EN[nadi as Nadi] ?? nadi;
}

export function localizeNakshatra(row: Pick<NakshatraRow, "ne" | "en">, lang?: string): string {
  if (!isEnglishLocale(lang)) return row.ne;
  return NAKSHATRA_SLUG_TO_EN[row.en] ?? row.en;
}

export function localizeVarga(varga: string, lang?: string): string {
  if (!isEnglishLocale(lang)) return varga;
  return VARGA_NE_TO_EN[varga] ?? varga;
}

export function rowMetaFromCharans(charanRashis: string[]) {
  const metas = charanRashis.map((x) => RASHI_META[x]!);
  const uniq = (xs: string[]) => [...new Set(xs)];
  return {
    lord: uniq(metas.map((m) => m.lord)).join(" / "),
    varna: uniq(metas.map((m) => m.varna)).join(" / "),
    vashya: uniq(metas.map((m) => m.vashya)).join(" / "),
  };
}
