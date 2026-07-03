import {
  AVAKAHADA,
  RASHI_META,
  type Gana,
  type Varna,
} from "@/lib/avakahada-data";
import {
  localizeGana,
  localizeVarna,
  localizeYoni,
  isEnglishLocale,
} from "@/lib/avakahada-locale";
import { janmaTaraFromNakIndex } from "@/lib/janma-patrika-fields";
import { nadiPatrikaFromNakIndex } from "@/lib/janma-patrika-fields";
import type { NakshatraPadaResult } from "@/lib/panchang-elements";

export type KutaId =
  | "varna"
  | "vashya"
  | "tara"
  | "yoni"
  | "maitri"
  | "gana"
  | "bhakuta"
  | "nadi";

export interface MilanPersonInput {
  name: string;
  moonRashiNum: number;
  moonLongitude: number;
  nakshatra: NakshatraPadaResult;
}

export interface KutaRow {
  id: KutaId;
  max: number;
  obtained: number;
  boyValue: string;
  girlValue: string;
  areaOfLife: string;
  areaOfLifeNe: string;
  info: string;
  infoNe: string;
}

export interface AshtakutaResult {
  kutas: KutaRow[];
  totalObtained: number;
  totalMax: 36;
  recommendation: "excellent" | "very_good" | "middling" | "inauspicious";
  recommendationLabel: string;
  recommendationLabelNe: string;
  nadiDosha: boolean;
  bhakutaUnfavorable: boolean;
  notes: string[];
  notesNe: string[];
}

const VARNA_RANK: Record<Varna, number> = {
  विप्र: 1,
  क्षत्रिय: 2,
  वैश्य: 3,
  शूद्र: 4,
};

const RASHI_LORD = [
  "mars",
  "venus",
  "mercury",
  "moon",
  "sun",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "saturn",
  "jupiter",
] as const;

type Lord = (typeof RASHI_LORD)[number];

const LORD_FRIENDS: Record<Lord, Lord[]> = {
  sun: ["moon", "mars", "jupiter"],
  moon: ["sun", "mercury"],
  mars: ["sun", "moon", "jupiter"],
  mercury: ["sun", "venus"],
  jupiter: ["sun", "moon", "mars"],
  venus: ["mercury", "saturn"],
  saturn: ["mercury", "venus"],
};

const LORD_ENEMIES: Record<Lord, Lord[]> = {
  sun: ["venus", "saturn"],
  moon: [],
  mars: ["mercury"],
  mercury: ["moon"],
  jupiter: ["mercury", "venus"],
  venus: ["sun", "moon"],
  saturn: ["sun", "moon", "mars"],
};

/** Ashtakoot वश्य groups keyed by rashi number (1–12). */
const ASHTA_VASHYA_NE = [
  "चतुष्पद",
  "चतुष्पद",
  "मानव",
  "जलचर",
  "वनचर",
  "मानव",
  "मानव",
  "कीट",
  "मानव",
  "जलचर",
  "मानव",
  "जलचर",
] as const;

const ASHTA_VASHYA_EN = [
  "Chatushpad",
  "Chatushpad",
  "Manava",
  "Jalachara",
  "Vanachara",
  "Manava",
  "Manava",
  "Keet",
  "Manava",
  "Jalachara",
  "Manava",
  "Jalachara",
] as const;

/** 2-point matrix for वश्य कूट (rows = boy, cols = girl). */
const VASHYA_POINTS: Record<string, Record<string, number>> = {
  चतुष्पद: { चतुष्पद: 2, मानव: 1, जलचर: 1, वनचर: 1.5, कीट: 1 },
  मानव: { चतुष्पद: 1, मानव: 2, जलचर: 1.5, वनचर: 0, कीट: 1 },
  जलचर: { चतुष्पद: 1, मानव: 1.5, जलचर: 2, वनचर: 1.5, कीट: 1 },
  वनचर: { चतुष्पद: 0, मानव: 0, जलचर: 0, वनचर: 2, कीट: 0 },
  कीट: { चतुष्पद: 1, मानव: 0, जलचर: 1, वनचर: 0, कीट: 2 },
};

const YONI_FRIENDS: Record<string, string[]> = {
  अश्व: ["गज", "मेष"],
  गज: ["अश्व", "मेष"],
  सिंह: ["मार्जार"],
  मार्जार: ["सिंह", "मूषक"],
  मूषक: ["मार्जार"],
  सर्प: ["मृग"],
  मृग: ["सर्प"],
  श्वान: ["मृग"],
  गौ: ["महिष"],
  महिष: ["गौ"],
  वानर: ["नकुल"],
  नकुल: ["वानर"],
};

const KUTA_META: Record<
  KutaId,
  { max: number; areaEn: string; areaNe: string; infoEn: string; infoNe: string }
> = {
  varna: {
    max: 1,
    areaEn: "Obedience",
    areaNe: "आज्ञापालन",
    infoEn:
      "Varna Kuta is assigned 1 point. Varna Kuta represents mutual love, comfort and obedience. Grade of spiritual development also depends on Varna Kuta.",
    infoNe:
      "वर्ण कूट १ अङ्कको हुन्छ। यसले पारस्परिक प्रेम, सुख र आज्ञापालन देखाउँछ। आध्यात्मिक विकासको स्तर पनि वर्ण कूटमा निर्भर गर्दछ।",
  },
  vashya: {
    max: 2,
    areaEn: "Mutual Control",
    areaNe: "पारस्परिक नियन्त्रण",
    infoEn:
      "Vashya Kuta is assigned 2 points. Vashya Kuta represents mutual control or dominance. It also shows friendship and amenability between the couple.",
    infoNe:
      "वश्य कूट २ अङ्कको हुन्छ। यसले पारस्परिक नियन्त्रण वा प्रभुत्व देखाउँछ र दम्पतीबीच मित्रता तथा अनुनय-मनुनय पनि।",
  },
  tara: {
    max: 3,
    areaEn: "Luck",
    areaNe: "भाग्य",
    infoEn:
      "Tara Kuta is assigned 3 points. Tara Kuta represents luck, auspiciousness and transmission of mutual beneficence between the couple.",
    infoNe:
      "तारा कूट ३ अङ्कको हुन्छ। यसले भाग्य, शुभता र दम्पतीबीच पारस्परिक कल्याणको संचार देखाउँछ।",
  },
  yoni: {
    max: 4,
    areaEn: "Sexual Aspects",
    areaNe: "काम सम्बन्ध",
    infoEn:
      "Yoni Kuta is assigned 4 points. Yoni Kuta, as name suggests, represents sexual aspects including sexual urge and copulatory organs.",
    infoNe:
      "योनि कूट ४ अङ्कको हुन्छ। यसले यौन इच्छा र यौन अङ्गसम्बन्धी पक्ष देखाउँछ।",
  },
  maitri: {
    max: 5,
    areaEn: "Affection",
    areaNe: "स्नेह",
    infoEn:
      "Maitri Kuta is assigned 5 points. Graha Maitri represents psychological disposition, mental qualities and affection between the couple.",
    infoNe:
      "मैत्री कूट ५ अङ्कको हुन्छ। ग्रह मैत्रीले मानसिक स्वभाव, गुण र दम्पतीबीच स्नेह देखाउँछ।",
  },
  gana: {
    max: 6,
    areaEn: "Nature",
    areaNe: "स्वभाव",
    infoEn:
      "Gana Kuta is assigned 6 points. Gana Kuta represents nature, longevity, wealth, prosperity and love.",
    infoNe:
      "गण कूट ६ अङ्कको हुन्छ। यसले स्वभाव, दीर्घायु, धन, समृद्धि र प्रेम देखाउँछ।",
  },
  bhakuta: {
    max: 7,
    areaEn: "Love",
    areaNe: "प्रेम",
    infoEn:
      "Bhakuta Kuta is assigned 7 points. Bhakuta Kuta represents children, wealth, comforts, good luck and growth of the family.",
    infoNe:
      "भकूट कूट ७ अङ्कको हुन्छ। यसले सन्तान, धन, सुख, भाग्य र परिवारको वृद्धि देखाउँछ।",
  },
  nadi: {
    max: 8,
    areaEn: "Health",
    areaNe: "स्वास्थ्य",
    infoEn:
      "Nadi Kuta is assigned 8 points. Nadi Kuta represents temperament, nervous energy, and affliction.",
    infoNe:
      "नाडी कूट ८ अङ्कको हुन्छ। यसले स्वभाव, स्नायु ऊर्जा र पीडा देखाउँछ।",
  },
};

const RASHI_NAMES_NE = Object.keys(RASHI_META);
const RASHI_NAMES_EN = [
  "Mesha",
  "Vrishabha",
  "Mithuna",
  "Karka",
  "Simha",
  "Kanya",
  "Tula",
  "Vrishchika",
  "Dhanu",
  "Makara",
  "Kumbha",
  "Meena",
] as const;

function varnaFromRashiNum(rashiNum: number): Varna | undefined {
  const names = Object.keys(RASHI_META);
  const key = names[rashiNum - 1];
  if (!key) return undefined;
  return RASHI_META[key]?.varna;
}

function vashyaNeFromRashiNum(rashiNum: number): string {
  if (rashiNum < 1 || rashiNum > 12) return "—";
  return ASHTA_VASHYA_NE[rashiNum - 1]!;
}

function vashyaEnFromRashiNum(rashiNum: number): string {
  if (rashiNum < 1 || rashiNum > 12) return "—";
  return ASHTA_VASHYA_EN[rashiNum - 1]!;
}

function lordOfRashi(rashiNum: number): Lord {
  return RASHI_LORD[rashiNum - 1] ?? "moon";
}

function isFriend(a: Lord, b: Lord): boolean {
  return a === b || LORD_FRIENDS[a]?.includes(b) === true;
}

function isEnemy(a: Lord, b: Lord): boolean {
  return LORD_ENEMIES[a]?.includes(b) === true;
}

function grahaMaitriPoints(boyRashi: number, girlRashi: number): number {
  const a = lordOfRashi(boyRashi);
  const b = lordOfRashi(girlRashi);
  if (a === b) return 5;

  const aFriendB = isFriend(a, b);
  const bFriendA = isFriend(b, a);
  const aEnemyB = isEnemy(a, b);
  const bEnemyA = isEnemy(b, a);

  if (aFriendB && bFriendA) return 5;
  if (aEnemyB && bEnemyA) return 0;
  if ((aFriendB && bEnemyA) || (aEnemyB && bFriendA)) return 0;
  if (aFriendB || bFriendA) return 4;
  return 3;
}

function lordDisplay(lord: Lord, lang?: string): string {
  const ne: Record<Lord, string> = {
    sun: "सूर्य",
    moon: "चन्द्र",
    mars: "मंगल",
    mercury: "बुध",
    jupiter: "गुरु",
    venus: "शुक्र",
    saturn: "शनि",
  };
  const en: Record<Lord, string> = {
    sun: "Sun",
    moon: "Moon",
    mars: "Mars",
    mercury: "Mercury",
    jupiter: "Jupiter",
    venus: "Venus",
    saturn: "Saturn",
  };
  return isEnglishLocale(lang) ? en[lord] : ne[lord];
}

function varnaPoints(boyRashi: number, girlRashi: number): number {
  const boyV = varnaFromRashiNum(boyRashi);
  const girlV = varnaFromRashiNum(girlRashi);
  if (!boyV || !girlV) return 0;
  return VARNA_RANK[boyV] <= VARNA_RANK[girlV] ? 1 : 0;
}

function vashyaPoints(boyRashi: number, girlRashi: number): number {
  const boyV = vashyaNeFromRashiNum(boyRashi);
  const girlV = vashyaNeFromRashiNum(girlRashi);
  return VASHYA_POINTS[boyV]?.[girlV] ?? 0;
}

function taraPoints(boyNak: number, girlNak: number, boyPada: number, girlPada: number): number {
  let count: number;
  if (boyNak === girlNak) {
    if (boyPada !== girlPada) return 3;
    count = 27;
  } else {
    count = ((boyNak - girlNak + 27) % 27) + 1;
  }
  while (count > 9) count -= 9;
  if ([2, 4, 6, 8, 9].includes(count)) return 3;
  if ([3, 7].includes(count)) return 1.5;
  return 0;
}

function yoniPoints(boyYoni: string, girlYoni: string): number {
  if (boyYoni === girlYoni) return 4;
  if (YONI_FRIENDS[boyYoni]?.includes(girlYoni) || YONI_FRIENDS[girlYoni]?.includes(boyYoni)) {
    return 3;
  }
  const boyRow = AVAKAHADA.find((r) => r.yoni === boyYoni);
  if (boyRow?.vairiYoni === girlYoni) return 0;
  return 2;
}

function ganaPoints(boyGana: Gana, girlGana: Gana): number {
  if (boyGana === girlGana) return 6;
  if (boyGana === "देव" && girlGana === "नर") return 6;
  if (boyGana === "नर" && girlGana === "देव") return 6;
  if (boyGana === "राक्षस" && girlGana === "राक्षस") return 6;
  return 0;
}

function bhakutaPoints(boyRashi: number, girlRashi: number): number {
  const diff = (boyRashi - girlRashi + 12) % 12;
  if (diff === 0) return 0;
  if (diff === 1 || diff === 7) return 7;
  if (diff === 3 || diff === 11) return 7;
  if (diff === 4 || diff === 10) return 7;
  return 0;
}

function nadiPoints(boyNak: number, girlNak: number): number {
  const boyNadi = boyNak % 3;
  const girlNadi = girlNak % 3;
  return boyNadi === girlNadi ? 0 : 8;
}

function recommendationFromScore(
  score: number,
  bhakutaUnfavorable: boolean,
  nadiDosha: boolean,
): Pick<AshtakutaResult, "recommendation" | "recommendationLabel" | "recommendationLabelNe"> {
  if (nadiDosha) {
    return {
      recommendation: "inauspicious",
      recommendationLabel: "Union is NOT Recommended due to Nadi Dosha",
      recommendationLabelNe: "नाडी दोषका कारण मिलन सिफारिस योग्य छैन",
    };
  }

  if (!bhakutaUnfavorable) {
    if (score >= 31) {
      return {
        recommendation: "excellent",
        recommendationLabel: "Excellent match",
        recommendationLabelNe: "उत्कृष्ट मिलन",
      };
    }
    if (score >= 21) {
      return {
        recommendation: "very_good",
        recommendationLabel: "Very good match",
        recommendationLabelNe: "अत्यन्त राम्रो मिलन",
      };
    }
    if (score >= 17) {
      return {
        recommendation: "middling",
        recommendationLabel: "Middling match",
        recommendationLabelNe: "मध्यम मिलन",
      };
    }
    return {
      recommendation: "inauspicious",
      recommendationLabel: "Inauspicious match",
      recommendationLabelNe: "अशुभ मिलन",
    };
  }

  if (score >= 26) {
    return {
      recommendation: "very_good",
      recommendationLabel: "Very good match (Bhakuta unfavorable)",
      recommendationLabelNe: "अत्यन्त राम्रो मिलन (भकूट अनुकूल छैन)",
    };
  }
  if (score >= 21) {
    return {
      recommendation: "middling",
      recommendationLabel: "Middling match (Bhakuta unfavorable)",
      recommendationLabelNe: "मध्यम मिलन (भकूट अनुकूल छैन)",
    };
  }
  return {
    recommendation: "inauspicious",
    recommendationLabel: "Inauspicious match (Bhakuta unfavorable)",
    recommendationLabelNe: "अशुभ मिलन (भकूट अनुकूल छैन)",
  };
}

export function computeAshtakuta(
  boy: MilanPersonInput,
  girl: MilanPersonInput,
  lang?: string,
): AshtakutaResult {
  const en = isEnglishLocale(lang);
  const boyNakRow = AVAKAHADA[boy.nakshatra.index]!;
  const girlNakRow = AVAKAHADA[girl.nakshatra.index]!;

  const boyVarna = varnaFromRashiNum(boy.moonRashiNum);
  const girlVarna = varnaFromRashiNum(girl.moonRashiNum);

  const kutas: KutaRow[] = [
    {
      id: "varna",
      max: 1,
      obtained: varnaPoints(boy.moonRashiNum, girl.moonRashiNum),
      boyValue: boyVarna ? (en ? localizeVarna(boyVarna, lang) : boyVarna) : "—",
      girlValue: girlVarna ? (en ? localizeVarna(girlVarna, lang) : girlVarna) : "—",
      areaOfLife: KUTA_META.varna.areaEn,
      areaOfLifeNe: KUTA_META.varna.areaNe,
      info: KUTA_META.varna.infoEn,
      infoNe: KUTA_META.varna.infoNe,
    },
    {
      id: "vashya",
      max: 2,
      obtained: vashyaPoints(boy.moonRashiNum, girl.moonRashiNum),
      boyValue: en ? vashyaEnFromRashiNum(boy.moonRashiNum) : vashyaNeFromRashiNum(boy.moonRashiNum),
      girlValue: en
        ? vashyaEnFromRashiNum(girl.moonRashiNum)
        : vashyaNeFromRashiNum(girl.moonRashiNum),
      areaOfLife: KUTA_META.vashya.areaEn,
      areaOfLifeNe: KUTA_META.vashya.areaNe,
      info: KUTA_META.vashya.infoEn,
      infoNe: KUTA_META.vashya.infoNe,
    },
    {
      id: "tara",
      max: 3,
      obtained: taraPoints(
        boy.nakshatra.index,
        girl.nakshatra.index,
        boy.nakshatra.pada,
        girl.nakshatra.pada,
      ),
      boyValue: janmaTaraFromNakIndex(boy.nakshatra.index, lang),
      girlValue: janmaTaraFromNakIndex(girl.nakshatra.index, lang),
      areaOfLife: KUTA_META.tara.areaEn,
      areaOfLifeNe: KUTA_META.tara.areaNe,
      info: KUTA_META.tara.infoEn,
      infoNe: KUTA_META.tara.infoNe,
    },
    {
      id: "yoni",
      max: 4,
      obtained: yoniPoints(boyNakRow.yoni, girlNakRow.yoni),
      boyValue: en ? localizeYoni(boyNakRow.yoni, lang) : boyNakRow.yoni,
      girlValue: en ? localizeYoni(girlNakRow.yoni, lang) : girlNakRow.yoni,
      areaOfLife: KUTA_META.yoni.areaEn,
      areaOfLifeNe: KUTA_META.yoni.areaNe,
      info: KUTA_META.yoni.infoEn,
      infoNe: KUTA_META.yoni.infoNe,
    },
    {
      id: "maitri",
      max: 5,
      obtained: grahaMaitriPoints(boy.moonRashiNum, girl.moonRashiNum),
      boyValue: lordDisplay(lordOfRashi(boy.moonRashiNum), lang),
      girlValue: lordDisplay(lordOfRashi(girl.moonRashiNum), lang),
      areaOfLife: KUTA_META.maitri.areaEn,
      areaOfLifeNe: KUTA_META.maitri.areaNe,
      info: KUTA_META.maitri.infoEn,
      infoNe: KUTA_META.maitri.infoNe,
    },
    {
      id: "gana",
      max: 6,
      obtained: ganaPoints(boyNakRow.gana, girlNakRow.gana),
      boyValue: en ? localizeGana(boyNakRow.gana, lang) : boyNakRow.gana,
      girlValue: en ? localizeGana(girlNakRow.gana, lang) : girlNakRow.gana,
      areaOfLife: KUTA_META.gana.areaEn,
      areaOfLifeNe: KUTA_META.gana.areaNe,
      info: KUTA_META.gana.infoEn,
      infoNe: KUTA_META.gana.infoNe,
    },
    {
      id: "bhakuta",
      max: 7,
      obtained: bhakutaPoints(boy.moonRashiNum, girl.moonRashiNum),
      boyValue: en
        ? RASHI_NAMES_EN[boy.moonRashiNum - 1] ?? "—"
        : RASHI_NAMES_NE[boy.moonRashiNum - 1] ?? "—",
      girlValue: en
        ? RASHI_NAMES_EN[girl.moonRashiNum - 1] ?? "—"
        : RASHI_NAMES_NE[girl.moonRashiNum - 1] ?? "—",
      areaOfLife: KUTA_META.bhakuta.areaEn,
      areaOfLifeNe: KUTA_META.bhakuta.areaNe,
      info: KUTA_META.bhakuta.infoEn,
      infoNe: KUTA_META.bhakuta.infoNe,
    },
    {
      id: "nadi",
      max: 8,
      obtained: nadiPoints(boy.nakshatra.index, girl.nakshatra.index),
      boyValue: nadiPatrikaFromNakIndex(boy.nakshatra.index, lang),
      girlValue: nadiPatrikaFromNakIndex(girl.nakshatra.index, lang),
      areaOfLife: KUTA_META.nadi.areaEn,
      areaOfLifeNe: KUTA_META.nadi.areaNe,
      info: KUTA_META.nadi.infoEn,
      infoNe: KUTA_META.nadi.infoNe,
    },
  ];

  const totalObtained = kutas.reduce((sum, k) => sum + k.obtained, 0);
  const bhakutaUnfavorable = kutas.find((k) => k.id === "bhakuta")!.obtained === 0;
  const nadiDosha = kutas.find((k) => k.id === "nadi")!.obtained === 0;

  const rec = recommendationFromScore(totalObtained, bhakutaUnfavorable, nadiDosha);

  const notes = [
    "In Ashta-Kuta system of match making, the maximum number of Gunas are 36. If total Gunas between the couple are between 31 and 36 (both inclusive) then the union is excellent, Gunas between 21 and 30 (both inclusive) are very good, Gunas between 17 and 20 (both inclusive) are middling and Gunas between 0 and 16 (both inclusive) are inauspicious.",
    "It is also opined that the above grouping is applicable when Bhakuta Kuta is favorable. If Bhakuta Kuta is unfavorable then union is never excellent, Gunas between 26 and 29 (both inclusive) are very good, Gunas between 21 and 25 (both inclusive) are middling and Gunas between 0 and 20 (both inclusive) are inauspicious.",
    "It should be noted that Nadi Kuta is given supreme priority during match making. If Nadi Kuta is unfavorable then a match with 28 Gunas is also considered inauspicious.",
    "Note - Mangal Dosha which is also known as Kuja Dosha is NOT considered while Ashtakuta match making. If Mangal Dosha is present then both Vara and Kanya should have Mangal Dosha. It is advised not to perform match making between Mangalik and Non-Mangalik couple.",
  ];

  const notesNe = [
    "अष्टकूट मिलनमा अधिकतम ३६ गुण हुन्छन्। ३१ देखि ३६ सम्म उत्कृष्ट, २१ देखि ३० सम्म अत्यन्त राम्रो, १७ देखि २० सम्म मध्यम र ० देखि १६ सम्म अशुभ मानिन्छ।",
    "भकूट कूट अनुकूल नभएमा माथिको वर्गीकरण लागू हुँदैन — २६–२९ अत्यन्त राम्रो, २१–२५ मध्यम, ०–२० अशुभ।",
    "नाडी कूटलाई सर्वोच्च प्राथमिकता दिइन्छ। नाडी दोष भए २८ गुण भए पनि मिलन अशुभ मानिन्छ।",
    "अष्टकूट मिलनमा मंगल दोष विचार गरिँदैन। मंगल दोष भए दुवै पक्षमा हुनुपर्छ; मंगलीक र अ-मंगलीकबीच मिलन नगर्न सल्लाह दिइन्छ।",
  ];

  return {
    kutas,
    totalObtained,
    totalMax: 36,
    ...rec,
    bhakutaUnfavorable,
    nadiDosha,
    notes,
    notesNe,
  };
}
