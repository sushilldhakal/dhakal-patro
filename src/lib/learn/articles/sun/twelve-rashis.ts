import type { ArticleData } from "../../article-schema";

export const twelveRashis: ArticleData = {
  slug: "twelve-rashis",
  seeAlso: ["rashi", "sauramana", "sankranti", "nakshatra"],
  sections: [
    {
      title: { ne: "बाह्र राशि, बाह्र महिना", en: "Twelve rashis, twelve months" },
      eyebrow: "The full list",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "राशिचक्र मेषबाट सुरु भई मीनमा टुङ्गिन्छ। प्रत्येक राशिको `३०°` सीमा, संस्कृत नाम, पश्चिमी समकक्ष र त्यसले सुरु गर्ने नेपाली महिना तल छ।",
            en: "The zodiac runs from Mesha to Meena. Below is each rashi's `30°` span, Sanskrit name, Western equivalent and the Nepali month it opens.",
          },
        },
        {
          kind: "table",
          caption: {
            ne: "बाह्र राशिको पूर्ण सूची",
            en: "The complete list of twelve rashis",
          },
          headers: [
            { ne: "#", en: "#" },
            { ne: "राशि", en: "Rashi" },
            { ne: "देशान्तर", en: "Longitude" },
            { ne: "पश्चिमी", en: "Western" },
            { ne: "नेपाली महिना", en: "Nepali month" },
          ],
          rows: [
            ["1", "मेष · Mesha", "0°–30°", "Aries", "बैशाख · Baisakh"],
            ["2", "वृषभ · Vrishabha", "30°–60°", "Taurus", "जेठ · Jestha"],
            ["3", "मिथुन · Mithuna", "60°–90°", "Gemini", "असार · Asar"],
            ["4", "कर्क · Karka", "90°–120°", "Cancer", "साउन · Shrawan"],
            ["5", "सिंह · Simha", "120°–150°", "Leo", "भदौ · Bhadra"],
            ["6", "कन्या · Kanya", "150°–180°", "Virgo", "असोज · Ashwin"],
            ["7", "तुला · Tula", "180°–210°", "Libra", "कात्तिक · Kartik"],
            ["8", "वृश्चिक · Vrishchika", "210°–240°", "Scorpio", "मंसिर · Mangsir"],
            ["9", "धनु · Dhanu", "240°–270°", "Sagittarius", "पुष · Poush"],
            ["10", "मकर · Makara", "270°–300°", "Capricorn", "माघ · Magh"],
            ["11", "कुम्भ · Kumbha", "300°–330°", "Aquarius", "फागुन · Falgun"],
            ["12", "मीन · Meena", "330°–360°", "Pisces", "चैत · Chaitra"],
          ],
        },
      ],
    },
    {
      title: { ne: "राशिको वर्गीकरण", en: "How the rashis are grouped" },
      eyebrow: "Element, quality, ruler",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "बाह्र राशिलाई परम्परागत रूपमा तीन किसिमले वर्गीकृत गरिन्छ — तत्त्व, गुण र स्वामी ग्रह।",
            en: "The twelve are traditionally grouped three ways — by element, by quality, and by ruling graha.",
          },
        },
        {
          kind: "table",
          headers: [
            { ne: "तत्त्व", en: "Element" },
            { ne: "राशि", en: "Rashis" },
          ],
          rows: [
            [{ ne: "अग्नि · Fire", en: "Agni · Fire" }, "मेष · सिंह · धनु"],
            [{ ne: "पृथ्वी · Earth", en: "Prithvi · Earth" }, "वृषभ · कन्या · मकर"],
            [{ ne: "वायु · Air", en: "Vayu · Air" }, "मिथुन · तुला · कुम्भ"],
            [{ ne: "जल · Water", en: "Jala · Water" }, "कर्क · वृश्चिक · मीन"],
          ],
        },
        {
          kind: "keys",
          items: [
            {
              h: { ne: "चर (Movable)", en: "Chara (Movable)" },
              p: { ne: "मेष, कर्क, तुला, मकर — प्रत्येक ऋतुको आरम्भ।", en: "Mesha, Karka, Tula, Makara — each opens a season." },
            },
            {
              h: { ne: "स्थिर (Fixed)", en: "Sthira (Fixed)" },
              p: { ne: "वृषभ, सिंह, वृश्चिक, कुम्भ — ऋतुको मध्य।", en: "Vrishabha, Simha, Vrishchika, Kumbha — the middle of a season." },
            },
            {
              h: { ne: "द्विस्वभाव (Dual)", en: "Dvisvabhava (Dual)" },
              p: { ne: "मिथुन, कन्या, धनु, मीन — ऋतुको सन्धि।", en: "Mithuna, Kanya, Dhanu, Meena — the turn between seasons." },
            },
          ],
        },
      ],
    },
    {
      title: { ne: "स्वामी ग्रह", en: "The ruling grahas" },
      eyebrow: "Sun and Moon take one each",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "सात परम्परागत ग्रहले बाह्र राशिमा स्वामित्व बाँड्छन् — सूर्य र चन्द्रले एक–एक, बाँकी पाँचले दुई–दुई।",
            en: "The seven traditional grahas share rulership of the twelve — the Sun and Moon take one each, the other five take two apiece.",
          },
        },
        {
          kind: "table",
          headers: [
            { ne: "ग्रह", en: "Graha" },
            { ne: "राशि", en: "Rashi(s)" },
          ],
          rows: [
            [{ ne: "सूर्य · Sun", en: "Surya · Sun" }, "सिंह"],
            [{ ne: "चन्द्र · Moon", en: "Chandra · Moon" }, "कर्क"],
            [{ ne: "मंगल · Mars", en: "Mangal · Mars" }, "मेष · वृश्चिक"],
            [{ ne: "बुध · Mercury", en: "Budha · Mercury" }, "मिथुन · कन्या"],
            [{ ne: "बृहस्पति · Jupiter", en: "Brihaspati · Jupiter" }, "धनु · मीन"],
            [{ ne: "शुक्र · Venus", en: "Shukra · Venus" }, "वृषभ · तुला"],
            [{ ne: "शनि · Saturn", en: "Shani · Saturn" }, "मकर · कुम्भ"],
          ],
        },
        {
          kind: "diagram",
          id: "table-graha",
        },
        {
          kind: "note",
          text: {
            ne: "यी वर्गीकरण ज्योतिषका लागि हुन्; पात्रोको गणनाका लागि भने राशिको `३०°` सीमा मात्र चाहिन्छ।",
            en: "These groupings belong to jyotish; for calendar computation only the `30°` boundaries are needed.",
          },
        },
      ],
    },
  ],
};
