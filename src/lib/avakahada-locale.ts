import type { Gana, Nadi, NakshatraRow } from "@/lib/avakahada-data";
import { RASHI_META } from "@/lib/avakahada-data";
import { resolveRashiDisplay } from "@/lib/rashi-i18n";

export function isEnglishLocale(lang?: string): boolean {
  return (lang ?? "ne").startsWith("en");
}

const LORD_NE_TO_EN: Record<string, string> = {
  मंगल: "Mars",
  मङ्गल: "Mars",
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
  घोडा: "Horse",
  महिष: "Buffalo",
  भैंस: "Buffalo",
  रांगो: "Buffalo",
  गज: "Elephant",
  हात्ती: "Elephant",
  सिंह: "Lion",
  अज: "Goat",
  बोका: "Goat",
  वानर: "Monkey",
  बाँदर: "Monkey",
  सर्प: "Serpent",
  नकुल: "Mongoose",
  श्वान: "Dog",
  कुकुर: "Dog",
  मृग: "Deer",
  हरिण: "Deer",
  मार्जार: "Cat",
  बिरालो: "Cat",
  मूषक: "Rat",
  मुसा: "Rat",
  गौ: "Cow",
  गाई: "Cow",
  व्याघ्र: "Tiger",
  बाघ: "Tiger",
  मेष: "Ram",
};

/** Patro-style Nepali labels (not Sanskrit) for the योनि / वैरि-योनि columns. */
const YONI_DISPLAY_NE: Record<string, string> = {
  अश्व: "घोडा",
  महिष: "रांगो",
  गज: "हात्ती",
  सिंह: "सिंह",
  अज: "बोका",
  वानर: "बाँदर",
  सर्प: "सर्प",
  नकुल: "नकुल",
  श्वान: "कुकुर",
  मृग: "हरिण",
  मार्जार: "बिरालो",
  मूषक: "मुसा",
  गौ: "गाई",
  व्याघ्र: "बाघ",
};

const GANA_NE_TO_EN: Record<Gana, string> = {
  देव: "Deva",
  नर: "Manushya",
  राक्षस: "Rakshasa",
};

const NADI_NE_TO_EN: Record<Nadi, string> = {
  आध्य: "Adya",
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
  return resolveRashiDisplay(ne, undefined, "en") ?? ne;
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
  if (!isEnglishLocale(lang)) return YONI_DISPLAY_NE[yoni] ?? yoni;
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

const DEITY_NE_TO_EN: Record<string, string> = {
  "अश्विनी कुमार": "Ashvini Kumaras",
  "अ.क.": "Ashvini Kumaras",
  यम: "Yama",
  अग्नि: "Agni",
  ब्रम्हा: "Brahma",
  चन्द्र: "Chandra",
  शिव: "Shiva",
  अदिति: "Aditi",
  वृहस्पति: "Brihaspati",
  सर्प: "Serpent",
  पितर: "Pitrs",
  भग: "Bhaga",
  अर्यमा: "Aryaman",
  सूर्य: "Surya",
  विश्वकर्मा: "Vishvakarma",
  वायु: "Vayu",
  इन्द्राग्नि: "Indra-Agni",
  मित्र: "Mitra",
  इन्द्र: "Indra",
  राक्षस: "Rakshasa",
  जल: "Jala",
  विश्वदेव: "Vishvedevas",
  विष्णु: "Vishnu",
  वसु: "Vasu",
  वरुण: "Varuna",
  अजेकपा: "Ajaikapada",
  अहिध्य: "Ahirbudhnya",
  पूषा: "Pusha",
};

const JATI_NE_TO_EN: Record<string, string> = {
  वैश्य: "Vaishya",
  चाण्डाल: "Chandala",
  ब्राम्हण: "Brahmin",
  शूद्र: "Shudra",
  कृषक: "Krishaka (farmer)",
  करजाति: "Karajati",
  क्षत्रिय: "Kshatriya",
  कूरजाति: "Kurajati",
};

const SANJNA_NE_TO_EN: Record<string, string> = {
  "ल.": "Laghu",
  "क्षि.": "Kshipra",
  "उ.कू.": "Ugra",
  "उ.क.": "Ugra",
  "मि.सा.": "Mishra",
  "धु.स्थि.": "Dhruva-Sthira",
  "ध्रु.स्थि.": "Dhruva-Sthira",
  "धू.स्थि.": "Dhruva-Sthira",
  "म.मै.": "Mridu",
  "मु.मै.": "Mridu",
  "ती.दा.": "Tikshna",
  "च.च.": "Chara",
  "ल.क्षि.": "Laghu-Kshipra",
};

const SANJNA_FULL_NE: Record<string, string> = {
  "ल.": "लघु",
  "क्षि.": "क्षिप्र",
  "उ.कू.": "उग्र",
  "उ.क.": "उग्र",
  "मि.सा.": "मिश्र",
  "धु.स्थि.": "ध्रुव/स्थिर",
  "ध्रु.स्थि.": "ध्रुव/स्थिर",
  "धू.स्थि.": "ध्रुव/स्थिर",
  "म.मै.": "मृदु",
  "मु.मै.": "मृदु",
  "ती.दा.": "तीक्ष्ण",
  "च.च.": "चर",
  "ल.क्षि.": "लघु-क्षिप्र",
};

const MUKHA_NE_TO_EN: Record<string, string> = {
  तिर्यङ: "Horizontal",
  अधो: "Downward",
  ऊर्ध्व: "Upward",
};

export function localizeDeity(deity: string, lang?: string): string {
  if (!isEnglishLocale(lang)) return deity;
  return DEITY_NE_TO_EN[deity] ?? deity;
}

export function localizeJati(jati: string, lang?: string): string {
  if (!isEnglishLocale(lang)) return jati;
  return JATI_NE_TO_EN[jati] ?? jati;
}

export function localizeSanjna(sanjna: string, lang?: string): string {
  if (!isEnglishLocale(lang)) return sanjna;
  return SANJNA_NE_TO_EN[sanjna] ?? sanjna;
}

export function sanjnaTitle(sanjna: string, lang?: string): string | undefined {
  if (isEnglishLocale(lang)) return SANJNA_NE_TO_EN[sanjna];
  return SANJNA_FULL_NE[sanjna];
}

export function localizeMukha(mukha: string, lang?: string): string {
  if (!isEnglishLocale(lang)) return mukha;
  return MUKHA_NE_TO_EN[mukha] ?? mukha;
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
