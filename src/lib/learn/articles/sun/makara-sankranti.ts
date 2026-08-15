import type { ArticleData } from "../../article-schema";

export const makaraSankranti: ArticleData = {
  slug: "makara-sankranti",
  seeAlso: ["sankranti-vs-solstice", "uttarayana-dakshinayana", "sankranti", "solstices"],
  sections: [
    {
      title: { ne: "माघे सङ्क्रान्ति", en: "Maghe Sankranti" },
      eyebrow: "Sun enters Makara",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "*मकर सङ्क्रान्ति* सूर्य मकर राशिमा प्रवेश गर्ने क्षण हो — निरयन देशान्तर `२७०°`। नेपालमा यो **माघे सङ्क्रान्ति** हो, र माघ १ गते पर्छ।",
            en: "*Makara Sankranti* is the moment the Sun enters Makara — sidereal longitude `270°`. In Nepal this is **Maghe Sankranti**, and it falls on Magh 1.",
          },
        },
        {
          kind: "para",
          text: {
            ne: "ग्रेगोरियन पात्रोमा यो सामान्यतया `१४`–`१५` जनवरीमा पर्छ, र वर्षभरिका सङ्क्रान्तिमध्ये सबैभन्दा व्यापक रूपमा मनाइने पर्व हो — तरुल, चाकु, तिलको लड्डु र घिउ–चाम्रे खाने चलनसहित।",
            en: "In the Gregorian calendar it usually falls on `14`–`15` January, and it is the most widely observed of the year's sankrantis — marked with yam, chaku, sesame sweets and ghee.",
          },
        },
      ],
    },
    {
      title: { ne: "यो शीत अयनान्त होइन", en: "It is not the winter solstice" },
      eyebrow: "A common confusion",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "मकर सङ्क्रान्तिलाई प्रायः “सबैभन्दा छोटो दिन” वा शीत अयनान्त भनेर बुझिन्छ। यो **सही होइन** — दुई फरक खगोलीय घटना हुन्।",
            en: "Makara Sankranti is often taken to be the shortest day, the winter solstice. That is **not correct** — they are two different astronomical events.",
          },
        },
        {
          kind: "table",
          headers: [
            { ne: "घटना", en: "Event" },
            { ne: "कसरी परिभाषित", en: "Defined by" },
            { ne: "मिति", en: "Date" },
          ],
          rows: [
            [
              { ne: "शीत अयनान्त", en: "Winter solstice" },
              { ne: "सूर्यको क्रान्ति दक्षिणतम — सबैभन्दा छोटो दिन", en: "The Sun's southernmost declination — the shortest day" },
              { ne: "~पुष ६–७", en: "~21–22 Dec" },
            ],
            [
              { ne: "मकर सङ्क्रान्ति", en: "Makara Sankranti" },
              { ne: "निरयन देशान्तर २७०° — राशि सीमा नाघ्नु", en: "Sidereal longitude 270° — crossing a sign boundary" },
              { ne: "माघ १", en: "~14–15 Jan" },
            ],
          ],
        },
        {
          kind: "para",
          text: {
            ne: "दुईबीच झन्डै `२४` दिनको अन्तर छ — ठ्याक्कै अयनांश जति। कारण उही: एउटा **सायन** (विषुव–अयनान्तमा आधारित) घटना हो, अर्को **निरयन** (ताराको सापेक्ष) घटना।",
            en: "The two sit about `24` days apart — exactly the ayanamsha. The reason is the same as always: one is a **tropical** event, defined by the equinox–solstice frame; the other is **sidereal**, defined against the stars.",
          },
        },
        {
          kind: "diagram",
          id: "equinox-precession",
        },
      ],
    },
    {
      title: { ne: "अनि उत्तरायणसँगको सम्बन्ध", en: "And its link with Uttarāyaṇa" },
      eyebrow: "Once they coincided",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "परम्परामा मकर सङ्क्रान्तिलाई ~उत्तरायण~ को आरम्भ भनिन्छ — सूर्य उत्तरतिर फर्किने अवधि। यो भनाइ **कुनै समय ठ्याक्कै सही थियो**।",
            en: "Tradition calls Makara Sankranti the start of ~Uttarāyaṇa~, the Sun's northward half-year. That statement **was once exactly true**.",
          },
        },
        {
          kind: "para",
          text: {
            ne: "झन्डै `१७००` वर्ष अघि अयनांश शून्य थियो — त्यसबेला सूर्य मकरमा पस्ने क्षण र शीत अयनान्त एउटै दिन पर्थे। अयन चलनले तिनलाई बिस्तारै छुट्याउँदै लग्यो, तर परम्परागत नाम त्यही रह्यो।",
            en: "About `1,700` years ago the ayanamsha was zero, and the Sun's entry into Makara coincided with the winter solstice. Precession has slowly pulled them apart, while the traditional name stayed put.",
          },
        },
        {
          kind: "note",
          text: {
            ne: "त्यसैले माघे सङ्क्रान्तिलाई “सूर्य उत्तर लाग्यो” भन्नु **ऐतिहासिक रूपमा सही** हो, तर आजको खगोलीय अवस्थाको वर्णन होइन। वास्तविक उत्तरायण पुष `६`–`७` तिरै सुरु भइसकेको हुन्छ।",
            en: "Calling Maghe Sankranti the Sun's turn to the north is therefore **historically accurate** rather than a description of today's sky. The actual northward turn has already happened, back around `22` December.",
          },
        },
      ],
    },
  ],
};
