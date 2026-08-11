import type { ArticleData } from "../../article-schema";

export const calcNakshatra: ArticleData = {
  slug: "calc-nakshatra",
  seeAlso: ["nakshatra", "lunar-longitude", "calc-yoga", "calc-tithi"],
  sections: [
    {
      title: { ne: "नक्षत्र — एउटै भाग", en: "Nakshatra — a single division" },
      eyebrow: "360° ÷ 27",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "नक्षत्र पञ्चाङ्गको सबैभन्दा सरल गणना हो — यसलाई सूर्यको स्थान पनि चाहिँदैन। **चन्द्रको निरयन देशान्तर** मात्र पुग्छ।",
            en: "Nakshatra is the simplest of the panchanga computations — it does not even need the Sun. The **Moon's sidereal longitude** alone suffices.",
          },
        },
        {
          kind: "figure",
          art: `NAKSHATRA_SPAN = 360° / 27 = 13.3333…°  =  13°20′

नक्षत्र / nakshatra = ⌊ चन्द्रको देशान्तर / 13°20′ ⌋ + 1

पद / pada = ⌊ (बाँकी / remainder) / 3°20′ ⌋ + 1     (प्रत्येक नक्षत्रका ४ पद / 4 padas each)

उदाहरण / example:  चन्द्र / Moon = 100.5°
   100.5 / 13.3333 = 7.5375  →  नक्षत्र 8 (पुष्य / Pushya)
   बाँकी / remainder 0.5375  →  पद 3`,
          caption: {
            ne: "एउटै भागले नक्षत्र र पद दुवै दिन्छ।",
            en: "One division yields both the nakshatra and its pada.",
          },
        },
        {
          kind: "para",
          text: {
            ne: "engine मा यो `NAKSHATRA_SPAN = 360.0 / 27.0` का रूपमा छ। `२७` नक्षत्रका नाम एउटा सूचीमा राखिएका छन्, र भागको पूर्णाङ्कले सूचीमा सूचकाङ्क दिन्छ।",
            en: "In the engine this is `NAKSHATRA_SPAN = 360.0 / 27.0`. The `27` names sit in a list, and the integer part of the division indexes into it.",
          },
        },
      ],
    },
    {
      title: { ne: "चन्द्र छिटो हिँड्छ", en: "The Moon moves fast" },
      eyebrow: "About a day per nakshatra",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "चन्द्र दिनको झन्डै `१३.२°` हिँड्छ, र नक्षत्र `१३°२०′` को हुन्छ। त्यसैले चन्द्र प्रत्येक नक्षत्रमा झन्डै **एक दिन** बस्छ।",
            en: "The Moon covers about `13.2°` a day, and a nakshatra spans `13°20′`. So the Moon spends roughly **one day** in each.",
          },
        },
        {
          kind: "formula",
          cards: [
            {
              big: "27.32",
              unit: { ne: "दिन", en: "days" },
              label: { ne: "नाक्षत्र मास", en: "Sidereal month" },
              desc: { ne: "सबै २७ नक्षत्र पार गर्न लाग्ने समय।", en: "The time to pass through all 27." },
            },
            {
              big: "~24",
              unit: { ne: "घण्टा", en: "hours" },
              label: { ne: "प्रति नक्षत्र", en: "Per nakshatra" },
              desc: { ne: "औसतमा — तर चन्द्रको गतिअनुसार २०–२७ घण्टा।", en: "On average — but 20 to 27 hours depending on the Moon's speed." },
            },
            {
              big: "4",
              label: { ne: "पद", en: "Padas" },
              desc: { ne: "प्रत्येक नक्षत्रका चार भाग, ३°२०′ का — नामकरणमा प्रयोग हुन्छ।", en: "Four quarters of 3°20′ each — used in naming a child." },
            },
          ],
        },
        {
          kind: "para",
          text: {
            ne: "सन्धि समय निकाल्ने विधि तिथिकै हो — द्विआधारी खोज, तर सञ्झ्याल केही फरक, किनभने नक्षत्रको अवधि तिथिभन्दा अलि लामो हुन सक्छ।",
            en: "Finding the boundary times uses the same binary search as the tithi, with a slightly different window, since a nakshatra can run a little longer than a tithi.",
          },
        },
      ],
    },
    {
      title: { ne: "अभिजित — २८ औँ नक्षत्र", en: "Abhijit — the 28th nakshatra" },
      eyebrow: "Present, but not in the count",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "परम्परामा `२८` नक्षत्रको उल्लेख पनि भेटिन्छ। थपिने नक्षत्र *अभिजित* हो, जुन उत्तराषाढा र श्रवणको बीचमा पर्छ।",
            en: "Tradition also knows a list of `28`. The additional one is *Abhijit*, lying between Uttarashadha and Shravana.",
          },
        },
        {
          kind: "para",
          text: {
            ne: "तर आधुनिक पञ्चाङ्ग गणनामा **२७ को विभाजन नै प्रयोग हुन्छ**, किनभने `२८` ले `३६०°` लाई सफा भाग गर्दैन। अभिजितलाई छुट्टै शुभ अवधिका रूपमा राखिन्छ — दिनको मध्याह्न वरिपरिको ~अभिजित मुहूर्त~ — नक्षत्र चक्रको भागका रूपमा होइन।",
            en: "Modern panchanga computation nonetheless uses the **27-fold division**, because `28` does not divide `360°` cleanly. Abhijit survives as a separate auspicious window — the ~Abhijit muhurta~ around midday — rather than as a slot in the nakshatra cycle.",
          },
        },
        {
          kind: "diagram",
          id: "table-nakshatra",
        },
      ],
    },
  ],
};
