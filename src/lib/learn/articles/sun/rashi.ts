import type { ArticleData } from "../../article-schema";

export const rashi: ArticleData = {
  slug: "rashi",
  seeAlso: ["sankranti", "zodiac-belt", "nakshatra"],
  sections: [
    {
      title: { ne: "राशि — आकाशको ३०° खण्ड", en: "A rashi is a 30° slice of sky" },
      eyebrow: "A coordinate frame",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "*राशि* राशिचक्रको बाह्र भागमध्ये एक हो। प्रत्येक राशि ठ्याक्कै `३०°` को हुन्छ, र `१२ × ३०° = ३६०°` — पूरै वृत्त।",
            en: "A *rashi* is one of the twelve divisions of the zodiac. Each spans exactly `30°`, and `12 × 30° = 360°` — the complete circle.",
          },
        },
        {
          kind: "para",
          text: {
            ne: "यहाँ बुझ्नुपर्ने मुख्य कुरा यो हो — राशि तारापुञ्जको आकार होइन, **समन्वय प्रणाली** हो। यसले आकाशीय देशान्तर नाप्न बाह्र बराबर खण्डको ढाँचा दिन्छ।",
            en: "The key idea is that a rashi is not the shape of a constellation but a **coordinate system** — a frame of twelve equal slices for describing celestial longitude.",
          },
        },
        {
          kind: "diagram",
          id: "ecliptic-belt",
          caption: {
            ne: "क्रान्तिवृत्तको वरिपरि बाह्र बराबर राशि खण्ड।",
            en: "The twelve equal rashi slices laid around the ecliptic.",
          },
        },
      ],
    },
    {
      title: { ne: "राशि र तारापुञ्ज एउटै होइनन्", en: "Rashi and constellation are not the same" },
      eyebrow: "Equal slices vs ragged shapes",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "आकाशमा देखिने तारापुञ्ज (constellation) असमान आकारका छन् — कुनै फराकिलो, कुनै साँघुरो। राशि भने सधैँ बराबर `३०°` का हुन्छन्।",
            en: "The constellations we actually see are unequal — some sprawling, some cramped. Rashis are always an even `30°`.",
          },
        },
        {
          kind: "keys",
          items: [
            {
              h: { ne: "तारापुञ्ज", en: "Constellation" },
              p: {
                ne: "आकाशमा देखिने तारा समूह — असमान चौडाइ। कन्या तारापुञ्ज ~४४° फैलिएको छ, वृश्चिक ~७° मात्र।",
                en: "An actual group of stars, of uneven width. The constellation Virgo spans some 44°, Scorpius barely 7°.",
              },
            },
            {
              h: { ne: "राशि", en: "Rashi" },
              p: {
                ne: "गणनाको खण्ड — सधैँ ठ्याक्कै ३०°। नाम तारापुञ्जबाट लिइएको, तर सीमा गणितीय।",
                en: "A computational slice, always exactly 30°. The name is borrowed from a constellation; the boundary is mathematical.",
              },
            },
          ],
        },
        {
          kind: "para",
          text: {
            ne: "यसैले “सूर्य मेष राशिमा छ” भन्नुको अर्थ सूर्य मेष तारापुञ्जको अगाडि छ भन्ने होइन — यसको अर्थ सूर्यको निरयन देशान्तर `०°` र `३०°` को बीचमा छ भन्ने हो।",
            en: "So \"the Sun is in Mesha\" does not mean the Sun sits in front of the stars of Aries. It means the Sun's sidereal longitude lies between `0°` and `30°`.",
          },
        },
      ],
    },
    {
      title: { ne: "राशि कहाँ–कहाँ प्रयोग हुन्छ", en: "Where rashis are used" },
      eyebrow: "Beyond the calendar",
      blocks: [
        {
          kind: "list",
          items: [
            {
              ne: "**सौर महिना** — सूर्य कुन राशिमा छ भन्नेले नेपाली महिना तय गर्छ।",
              en: "**Solar months** — which rashi the Sun occupies decides the Nepali month.",
            },
            {
              ne: "**चन्द्र राशि** — जन्मको समय चन्द्र कुन राशिमा थियो; नेपालमा “राशि” भन्नेबित्तिकै प्रायः यही बुझिन्छ।",
              en: "**Moon sign** — the rashi the Moon occupied at birth; in Nepal this is usually what \"rashi\" means in everyday speech.",
            },
            {
              ne: "**लग्न** — जन्मको क्षणमा पूर्वी क्षितिजमा उदाउँदै गरेको राशि; कुण्डलीको पहिलो भाव।",
              en: "**Lagna** — the rashi rising on the eastern horizon at birth; the first house of a kundali.",
            },
            {
              ne: "**ग्रह स्थिति** — हरेक ग्रहको स्थान कुन राशिको कति अंशमा भनेर लेखिन्छ।",
              en: "**Planetary positions** — every graha's place is written as so many degrees within a named rashi.",
            },
          ],
        },
      ],
    },

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
        {
          kind: "note",
          text: {
            ne: "यो ऋतु–भाषा **सायन** राशिचक्रबाट आएको हो, जब दुई राशिचक्र मिलेका थिए। आज निरयन मेष वसन्त विषुवभन्दा `~२४` दिन पछाडि पर्छ, त्यसैले चर राशिले अब ऋतु ठ्याक्कै सुरु गर्दैनन् — वर्गीकरण परम्परागत रूपमै चलिरहेको छ। ऋतुको वास्तविक सन्धि ~विषुव र अयनान्त~ मा हुन्छ।",
            en: "This season language comes from the **tropical** zodiac, from when the two zodiacs still coincided. Today sidereal Mesha sits `~24` days after the spring equinox, so a chara sign no longer opens a season exactly — the grouping continues by tradition. The real seasonal hinges are the ~equinoxes and solstices~.",
          },
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
    {
      title: { ne: "सन्दर्भ तालिका", en: "Reference table" },
      eyebrow: "All twelve at a glance",
      blocks: [
        {
          kind: "diagram",
          id: "table-rashi",
        },
      ],
    },
  ],
};
