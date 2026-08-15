import type { ArticleData } from "../../article-schema";

export const solstices: ArticleData = {
  slug: "solstices",
  seeAlso: ["equinoxes", "uttarayana-dakshinayana", "sankranti-vs-solstice", "axial-tilt"],
  sections: [
    {
      title: { ne: "अयनान्त — सूर्य फर्किने क्षण", en: "The solstice — where the Sun turns" },
      eyebrow: "Declination extremes",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "*अयनान्त* (solstice) त्यो क्षण हो जब सूर्यको क्रान्ति चरम बिन्दुमा पुगेर **फर्किन्छ** — `+२३.४४°` वा `−२३.४४°`।",
            en: "A *solstice* is the instant the Sun's declination reaches its extreme and **reverses** — `+23.44°` or `−23.44°`.",
          },
        },
        {
          kind: "para",
          text: {
            ne: "नाम आफैँले यही बताउँछ: लैटिन *sol* (सूर्य) + *sistere* (रोकिनु) — सूर्य उत्तर–दक्षिण यात्रामा क्षणभर रोकिएझैँ देखिने बिन्दु।",
            en: "The name says as much: Latin *sol* (sun) + *sistere* (to stand still) — the point where the Sun seems to pause in its north–south travel.",
          },
        },
        {
          kind: "table",
          headers: [
            { ne: "अयनान्त", en: "Solstice" },
            { ne: "मिति", en: "Date" },
            { ne: "क्रान्ति", en: "Declination" },
            { ne: "नेपालमा", en: "In Nepal" },
          ],
          rows: [
            [
              { ne: "ग्रीष्म अयनान्त", en: "Summer solstice" },
              { ne: "~असार ६–७", en: "~21 Jun" },
              "+23.44°",
              { ne: "सबैभन्दा लामो दिन", en: "Longest day" },
            ],
            [
              { ne: "शीत अयनान्त", en: "Winter solstice" },
              { ne: "~पुष ६–७", en: "~22 Dec" },
              "−23.44°",
              { ne: "सबैभन्दा छोटो दिन", en: "Shortest day" },
            ],
          ],
        },
      ],
    },
    {
      title: { ne: "अयनान्तमा के देखिन्छ", en: "What you can actually see" },
      eyebrow: "The standstill",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "अयनान्त वरिपरि केही दिनसम्म सूर्य क्षितिजको झन्डै उही ठाउँबाट उदाउँछ — क्रान्तिको परिवर्तन दर शून्यतिर झर्ने भएकाले।",
            en: "For several days around a solstice the Sun rises from almost the same spot on the horizon, because the rate of change of declination drops to nearly zero.",
          },
        },
        {
          kind: "figure",
          art: `क्रान्ति वर्षभरि / declination through the year

+23.44° ─────────╮ ग्रीष्म अयनान्त / summer solstice
                 │╲        (परिवर्तन ~शून्य / change ~zero)
      0° ────────┼──╲──── विषुव / equinox (सबैभन्दा छिटो परिवर्तन)
                 │    ╲              (fastest change)
−23.44° ─────────╯      ╰─ शीत अयनान्त / winter solstice`,
          caption: {
            ne: "विषुवमा सूर्य सबैभन्दा छिटो उत्तर–दक्षिण सर्छ; अयनान्तमा झन्डै रोकिन्छ।",
            en: "At the equinoxes the Sun shifts north–south fastest; at the solstices it nearly halts.",
          },
        },
        {
          kind: "para",
          text: {
            ne: "यही कारण प्राचीन कालमा अयनान्त पत्ता लगाउन सजिलो थियो — छायाँको लम्बाइ नाप्ने ~गनोमन~ ले वर्षको सबैभन्दा लामो र छोटो मध्याह्न छायाँ देखाउँथ्यो।",
            en: "This is why solstices were easy to detect in antiquity — a ~gnomon~ measuring shadow length showed the year's longest and shortest noon shadow.",
          },
        },
      ],
    },
    {
      title: { ne: "अयनान्त र सङ्क्रान्ति — नमिसाउनुहोस्", en: "Do not confuse solstice with sankranti" },
      eyebrow: "Different frames",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "अयनान्त **सायन** घटना हो — सूर्यको क्रान्तिले परिभाषित। मकर र कर्क सङ्क्रान्ति **निरयन** घटना हुन् — राशि सीमाले परिभाषित।",
            en: "A solstice is a **tropical** event, defined by declination. Makara and Karka Sankranti are **sidereal** events, defined by sign boundaries.",
          },
        },
        {
          kind: "para",
          text: {
            ne: "आज यीबीच झन्डै `२४` दिनको अन्तर छ, र अयन चलनका कारण यो बढ्दै जान्छ। कुनै समय यी मिल्थे — त्यसैले परम्परागत नामले अझै पुरानो मेल झल्काउँछ।",
            en: "Today they sit about `24` days apart, and precession keeps widening the gap. They once coincided, which is why the traditional names still echo the old alignment.",
          },
        },
        {
          kind: "note",
          text: {
            ne: "छोटोमा: सबैभन्दा छोटो दिन पुषमा हुन्छ, माघे सङ्क्रान्तिमा होइन।",
            en: "In short: the shortest day is in December, not at Maghe Sankranti.",
          },
        },
      ],
    },
  ],
};
