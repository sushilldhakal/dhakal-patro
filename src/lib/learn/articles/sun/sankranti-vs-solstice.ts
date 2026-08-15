import type { ArticleData } from "../../article-schema";

export const sankrantiVsSolstice: ArticleData = {
  slug: "sankranti-vs-solstice",
  seeAlso: ["makara-sankranti", "equinox-solstice", "sidereal-vs-tropical", "ritu-drift"],
  sections: [
    {
      title: { ne: "दुई फरक प्रश्नका दुई फरक उत्तर", en: "Two different questions, two different answers" },
      eyebrow: "Longitude vs declination",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "सङ्क्रान्ति र अयनान्त दुवै सूर्यसँग सम्बन्धित छन्, र कहिलेकाहीँ नजिक पनि पर्छन् — तर यी **फरक सन्दर्भ प्रणालीमा** परिभाषित छन्।",
            en: "Both a sankranti and a solstice concern the Sun, and they sometimes fall close together — but they are defined in **different reference systems**.",
          },
        },
        {
          kind: "keys",
          items: [
            {
              h: { ne: "सङ्क्रान्ति", en: "Sankranti" },
              p: {
                ne: "प्रश्न: *सूर्य ताराको सापेक्ष कहाँ छ?* उत्तर देशान्तरमा — `३०°` को सीमा नाघ्नु।",
                en: "The question is *where is the Sun against the stars?* — answered in longitude, at a `30°` boundary.",
              },
            },
            {
              h: { ne: "अयनान्त", en: "Solstice" },
              p: {
                ne: "प्रश्न: *सूर्य विषुवत् रेखाभन्दा कति उत्तर वा दक्षिण छ?* उत्तर क्रान्तिमा — चरम `±२३.४४°`।",
                en: "The question is *how far north or south of the equator is the Sun?* — answered in declination, at the extreme of `±23.44°`.",
              },
            },
          ],
        },
        {
          kind: "para",
          text: {
            ne: "एउटा **कहाँ** भन्ने प्रश्न हो, अर्को **कति माथि/तल** भन्ने। यी दुई नाप एकअर्कासँग बाँधिएका छैनन्।",
            en: "One asks **where along**, the other asks **how far above or below**. The two measurements are not locked to each other.",
          },
        },
      ],
    },
    {
      title: { ne: "कुनै समय यी मिल्थे", en: "They used to coincide" },
      eyebrow: "Around 285 CE",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "जब अयनांश शून्य थियो — झन्डै `२८५` ई.मा — सायन र निरयन राशिचक्र ठ्याक्कै मिलेका थिए। त्यसबेला मकर सङ्क्रान्ति र शीत अयनान्त एउटै दिन पर्थे।",
            en: "When the ayanamsha was zero — around `285` CE — the tropical and sidereal zodiacs lined up exactly. Makara Sankranti and the winter solstice fell on the same day.",
          },
        },
        {
          kind: "figure",
          art: `~285 ई. / CE          आज / today            ~२९०० ई. / CE
अयनांश ० / 0°         अयनांश ~24°           अयनांश ~३६° / ~36°

अयनान्त ─┐            अयनान्त ─┐            अयनान्त ─┐
सङ्क्रान्ति ─┘  (एउटै)   │  ~24 दिन/days     │  ~३६ दिन/days
                     सङ्क्रान्ति ─┘         सङ्क्रान्ति ─┘`,
          caption: {
            ne: "अयन चलनले दुई घटनालाई शताब्दीयौँमा बिस्तारै अलग गर्दै लगेको छ।",
            en: "Precession has been prising the two events apart, century by century.",
          },
        },
        {
          kind: "para",
          text: {
            ne: "यसैले पुराना ग्रन्थमा “मकर सङ्क्रान्तिमा सूर्य उत्तर लाग्छ” लेखिएको भेटिन्छ — त्यो लेखिँदा **ठ्याक्कै सही** थियो। आज त्यो नाम मात्र बाँकी छ, घटना सरिसकेको छ।",
            en: "So when older texts say the Sun turns north at Makara Sankranti, they were **exactly right** when written. Today only the name remains; the event has moved.",
          },
        },
      ],
    },
    {
      title: { ne: "किन दुवै राख्ने", en: "Why keep both" },
      eyebrow: "Each does a job",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "यदि दुई प्रणाली छुट्टिँदै छन् भने एउटा छाडे हुँदैन? हुँदैन — किनभने दुवैले फरक काम गर्छन्।",
            en: "If the two systems are drifting apart, why not drop one? Because each does a different job.",
          },
        },
        {
          kind: "table",
          headers: [
            { ne: "कामका लागि", en: "For" },
            { ne: "कुन प्रणाली", en: "Which system" },
            { ne: "किन", en: "Why" },
          ],
          rows: [
            [
              { ne: "ऋतु, कृषि, दिनको लम्बाइ", en: "Seasons, farming, day length" },
              { ne: "सायन (अयनान्त–विषुव)", en: "Tropical (solstice–equinox)" },
              { ne: "यी सूर्यको क्रान्तिमा निर्भर छन्।", en: "These depend on the Sun's declination." },
            ],
            [
              { ne: "महिना, गते, ग्रह स्थिति", en: "Months, gate, planetary positions" },
              { ne: "निरयन (राशि–सङ्क्रान्ति)", en: "Sidereal (rashi–sankranti)" },
              { ne: "यी ताराको सन्दर्भमा नापिन्छन्।", en: "These are measured against the stars." },
            ],
          ],
        },
        {
          kind: "note",
          text: {
            ne: "पञ्चाङ्गले दुवै बोक्छ — ऋतुको हिसाब सायनबाट, महिनाको हिसाब निरयनबाट। भ्रम तब मात्र हुन्छ जब एउटा प्रणालीको नामलाई अर्को प्रणालीको घटना ठानिन्छ।",
            en: "A panchanga carries both — ṛtus from the tropical frame, months from the sidereal one. Confusion arises only when a name from one system is mistaken for an event in the other.",
          },
        },
      ],
    },
  ],
};
