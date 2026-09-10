/** Static classical bhava (house) reference content + the fixed rashi-lord
 * table, used by the house-click detail dialog. Distinct from graha-drishti.ts
 * (per-graha aspect content) and janma-phala-tables.ts (per-graha-in-house
 * classical phala phrases), which this dialog also draws on. */

import type { GrahaKey } from "@/lib/graha-details";
import type { BhavaHouse } from "@/lib/bhava";
import { drishtiTargetHouses } from "@/lib/bhava";

/** Rashi (1-12) → its ruling graha. Fixed classical rulership, independent of
 * any individual chart (unlike vargaCharts.ownedRashis from the API, which
 * mirrors this same fact per-chart for the divisional-chart lord tables). */
export const RASHI_LORD: Record<number, GrahaKey> = {
  1: "mars",
  2: "venus",
  3: "mercury",
  4: "moon",
  5: "sun",
  6: "mercury",
  7: "venus",
  8: "mars",
  9: "jupiter",
  10: "saturn",
  11: "saturn",
  12: "jupiter",
};

/** Sanskrit ordinal house names, 1st house first — used in dialog titles
 * ("भाव २ — द्वितीय भाव"). */
export const HOUSE_ORDINAL_NE = [
  "प्रथम", "द्वितीय", "तृतीय", "चतुर्थ", "पञ्चम", "षष्ठ",
  "सप्तम", "अष्टम", "नवम", "दशम", "एकादश", "द्वादश",
] as const;

export const HOUSE_ORDINAL_EN = [
  "First", "Second", "Third", "Fourth", "Fifth", "Sixth",
  "Seventh", "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth",
] as const;

export interface HouseInfo {
  themeNe: string;
  themeEn: string;
  summaryNe: string;
  summaryEn: string;
  medicalNe: string;
  medicalEn: string;
  /** Short "if benefics are strong here" / "if malefics afflict here" effect phrases. */
  beneficEffectNe: string;
  beneficEffectEn: string;
  maleficEffectNe: string;
  maleficEffectEn: string;
}

export const HOUSE_INFO: Record<number, HouseInfo> = {
  1: {
    themeNe: "शरीर, स्वभाव, व्यक्तित्व",
    themeEn: "Body, nature, personality",
    summaryNe:
      "पहिलो भाव (लग्न) व्यक्तिको शरीर, स्वभाव, अनुहार र सामान्य जीवनशैलीको प्रतिनिधित्व गर्छ। यो भाव समग्र स्वास्थ्य, आत्मविश्वास र व्यक्तित्वको आधार मानिन्छ।",
    summaryEn:
      "The 1st house (Lagna) represents the body, temperament, appearance and general disposition. It is treated as the foundation of overall health, confidence and personality.",
    medicalNe: "शिर, अनुहार र समग्र शारीरिक बनावट",
    medicalEn: "Head, face and overall physical constitution",
    beneficEffectNe: "स्वस्थ शरीर, आत्मविश्वासी, राम्रो व्यक्तित्व",
    beneficEffectEn: "Healthy body, confident, strong personality",
    maleficEffectNe: "स्वास्थ्य समस्या, कमजोर आत्मविश्वास",
    maleficEffectEn: "Health issues, low confidence",
  },
  2: {
    themeNe: "धन, परिवार, वाणी",
    themeEn: "Wealth, family, speech",
    summaryNe:
      "दोस्रो भाव सम्पत्ति, आम्दानी, परिवार, वाणीको शैली र भोजनप्रतिको रुचिसँग जोडिन्छ। यसले धन कमाउने र जोगाउने क्षमता, परिवारसँगको सम्बन्ध र बोलीचालीको प्रभाव देखाउँछ।",
    summaryEn:
      "The 2nd house relates to wealth, income, family, manner of speech and food habits. It shows the ability to earn and save, family relations, and how one's words land.",
    medicalNe: "अनुहार, दायाँ आँखा, दाँत र घाँटी सम्बन्धी अंग",
    medicalEn: "Face, right eye, teeth and throat",
    beneficEffectNe: "धनवान, मधुरवाणी, सुखी परिवार",
    beneficEffectEn: "Wealthy, sweet-voiced, happy family",
    maleficEffectNe: "धन हानि, परिवारमा कलह",
    maleficEffectEn: "Loss of wealth, family discord",
  },
  3: {
    themeNe: "साहस, भाइबहिनी, सञ्चार",
    themeEn: "Courage, siblings, communication",
    summaryNe:
      "तेस्रो भाव साहस, आँट, भाइबहिनीसँगको सम्बन्ध, छोटो यात्रा र सञ्चार सीपसँग जोडिन्छ।",
    summaryEn:
      "The 3rd house relates to courage, siblings, short journeys and communication skills.",
    medicalNe: "काँध, हात र फोक्सोको माथिल्लो भाग",
    medicalEn: "Shoulders, arms and upper lungs",
    beneficEffectNe: "साहसी, राम्रो सम्बन्ध, सिपालु",
    beneficEffectEn: "Courageous, good sibling ties, skilled",
    maleficEffectNe: "डरपोक, भाइबहिनीसँग विवाद",
    maleficEffectEn: "Timid, disputes with siblings",
  },
  4: {
    themeNe: "घर, आमा, सुख",
    themeEn: "Home, mother, happiness",
    summaryNe:
      "चौथो भाव घर-जग्गा, आमासँगको सम्बन्ध, मानसिक शान्ति र भित्री सुखसँग जोडिन्छ।",
    summaryEn:
      "The 4th house relates to home and property, the mother, inner peace and domestic happiness.",
    medicalNe: "छाती, फोक्सो र मुटु सम्बन्धी अंग",
    medicalEn: "Chest, lungs and the heart region",
    beneficEffectNe: "घर-सम्पत्ति, मानसिक सुख",
    beneficEffectEn: "Home/property gains, peace of mind",
    maleficEffectNe: "घर-जग्गामा समस्या, अशान्ति",
    maleficEffectEn: "Property trouble, domestic unrest",
  },
  5: {
    themeNe: "सन्तान, बुद्धि, शिक्षा",
    themeEn: "Children, intellect, education",
    summaryNe:
      "पाँचौं भाव सन्तान, बुद्धि, शिक्षा, रचनात्मकता र पूर्वपुण्य (पूर्वजन्मको फल) सँग जोडिन्छ।",
    summaryEn:
      "The 5th house relates to children, intellect, education, creativity and past-life merit.",
    medicalNe: "पेट, कम्मरको माथिल्लो भाग र मुटुको छेउ",
    medicalEn: "Stomach, upper abdomen and around the heart",
    beneficEffectNe: "बुद्धिमानी, भाग्यशाली सन्तान",
    beneficEffectEn: "Intelligent, fortunate children",
    maleficEffectNe: "सन्तान-चिन्ता, शिक्षामा बाधा",
    maleficEffectEn: "Worry over children, blocked education",
  },
  6: {
    themeNe: "रोग, ऋण, शत्रु, सेवा",
    themeEn: "Disease, debt, rivals, service",
    summaryNe:
      "छैटौं भाव रोग, ऋण, शत्रु, प्रतिस्पर्धा र सेवा-कार्यसँग जोडिन्छ। यो भावले कठिनाइसँग जुध्ने क्षमता पनि देखाउँछ।",
    summaryEn:
      "The 6th house relates to disease, debt, rivals, competition and service. It also shows one's capacity to fight through difficulty.",
    medicalNe: "आन्द्रा, पेटको तल्लो भाग र पाचन प्रणाली",
    medicalEn: "Intestines, lower abdomen and the digestive system",
    beneficEffectNe: "रोगमुक्त, ऋणमुक्त, प्रतिस्पर्धामा जित",
    beneficEffectEn: "Free of disease/debt, wins rivalries",
    maleficEffectNe: "रोग, ऋण, शत्रुबाट हानि",
    maleficEffectEn: "Disease, debt, harm from rivals",
  },
  7: {
    themeNe: "विवाह, साझेदारी, दाम्पत्य",
    themeEn: "Marriage, partnership, spouse",
    summaryNe:
      "सातौं भाव विवाह, दाम्पत्य जीवन, व्यावसायिक साझेदारी र सार्वजनिक सम्बन्धसँग जोडिन्छ।",
    summaryEn:
      "The 7th house relates to marriage, married life, business partnerships and public relationships.",
    medicalNe: "कम्मरको तल्लो भाग र प्रजनन प्रणाली",
    medicalEn: "Lower back and the reproductive system",
    beneficEffectNe: "सुखी दाम्पत्य, राम्रो साझेदारी",
    beneficEffectEn: "Happy marriage, good partnerships",
    maleficEffectNe: "दाम्पत्यमा कलह, साझेदारीमा धोका",
    maleficEffectEn: "Marital discord, betrayal in partnership",
  },
  8: {
    themeNe: "आयु, रूपान्तरण, गुप्त कुरा",
    themeEn: "Longevity, transformation, hidden matters",
    summaryNe:
      "आठौं भाव आयु, अचानक घटना, गुप्त ज्ञान, विरासत र जीवनका ठूला रूपान्तरणसँग जोडिन्छ।",
    summaryEn:
      "The 8th house relates to longevity, sudden events, hidden knowledge, inheritance and major transformations in life.",
    medicalNe: "गुप्तांग, उत्सर्जन प्रणाली र दीर्घकालीन स्वास्थ्य",
    medicalEn: "Reproductive/excretory organs and chronic health",
    beneficEffectNe: "दीर्घायु, गुप्त विद्यामा सिप",
    beneficEffectEn: "Long life, skill in hidden sciences",
    maleficEffectNe: "दुर्घटना, आकस्मिक हानि",
    maleficEffectEn: "Accidents, sudden loss",
  },
  9: {
    themeNe: "भाग्य, धर्म, गुरु, पिता",
    themeEn: "Fortune, dharma, teachers, father",
    summaryNe:
      "नवौं भाव भाग्य, धर्म, उच्च शिक्षा, लामो यात्रा, गुरुजन र पितासँगको सम्बन्धसँग जोडिन्छ।",
    summaryEn:
      "The 9th house relates to fortune, dharma, higher education, long journeys, teachers and the father.",
    medicalNe: "जुँघा (हिप) र तिघ्रा",
    medicalEn: "Hips and thighs",
    beneficEffectNe: "भाग्यशाली, धर्मपरायण, गुरुको आशीर्वाद",
    beneficEffectEn: "Fortunate, righteous, blessed by teachers",
    maleficEffectNe: "भाग्यमा बाधा, पितासँग तनाव",
    maleficEffectEn: "Blocked fortune, tension with father",
  },
  10: {
    themeNe: "पेशा, कर्म, प्रतिष्ठा",
    themeEn: "Career, karma, status",
    summaryNe:
      "दशौं भाव पेशा, सामाजिक प्रतिष्ठा, अधिकार र कर्मक्षेत्रमा उपलब्धिसँग जोडिन्छ।",
    summaryEn:
      "The 10th house relates to career, social standing, authority and achievement in one's field of work.",
    medicalNe: "घुँडा र जोर्नी",
    medicalEn: "Knees and joints",
    beneficEffectNe: "उच्च पद, प्रतिष्ठा, सफल कर्म",
    beneficEffectEn: "High position, successful career",
    maleficEffectNe: "पेशामा बाधा, प्रतिष्ठामा आँच",
    maleficEffectEn: "Career obstacles, reputation damage",
  },
  11: {
    themeNe: "आम्दानी, लाभ, मित्र",
    themeEn: "Income, gains, friends",
    summaryNe:
      "एघारौं भाव आम्दानी, लाभ, इच्छापूर्ति, ठूला दाजुभाइ र सामाजिक सञ्जालसँग जोडिन्छ।",
    summaryEn:
      "The 11th house relates to income, gains, fulfilment of desires, elder siblings and social networks.",
    medicalNe: "पिँडुला र गोलीगाँठो",
    medicalEn: "Calves and ankles",
    beneficEffectNe: "प्रशस्त आम्दानी, इच्छापूर्ति",
    beneficEffectEn: "Ample income, desires fulfilled",
    maleficEffectNe: "आम्दानीमा बाधा, इच्छा अपूर्ण",
    maleficEffectEn: "Blocked income, unfulfilled desires",
  },
  12: {
    themeNe: "व्यय, मोक्ष, विदेश",
    themeEn: "Expenditure, moksha, foreign lands",
    summaryNe:
      "बाह्रौं भाव खर्च, हानि, विदेश-बसाइ, निद्रा र आत्मिक मुक्ति (मोक्ष) सँग जोडिन्छ।",
    summaryEn:
      "The 12th house relates to expenditure, loss, foreign residence, sleep and spiritual liberation (moksha).",
    medicalNe: "पाउ र समग्र निद्रा-आराम प्रणाली",
    medicalEn: "Feet and the sleep/rest cycle",
    beneficEffectNe: "आत्मिक शान्ति, विदेशबाट लाभ",
    beneficEffectEn: "Inner peace, gains from abroad",
    maleficEffectNe: "अनावश्यक खर्च, हानि, निद्रा-समस्या",
    maleficEffectEn: "Needless expense, loss, poor sleep",
  },
};

/** Every graha that casts a graha-drishti onto `targetHouse`, given where each
 * graha sits across the whole chart. Mirrors buildBhavaTable's aspectedBy
 * logic in bhava.ts, recomputed here since D1Chart doesn't carry that table. */
export function computeAspectedBy(houses: BhavaHouse[], targetHouse: number): string[] {
  const result: string[] = [];
  for (const house of houses) {
    for (const planet of house.planets) {
      if (drishtiTargetHouses(planet.key, house.house).includes(targetHouse)) {
        result.push(planet.key);
      }
    }
  }
  return result;
}
