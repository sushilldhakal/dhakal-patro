import type { ArticleData } from "../../article-schema";

export const kshayaMaas: ArticleData = {
  slug: "kshaya-maas",
  seeAlso: ["adhik-maas", "lunar-solar-drift", "sankranti", "lunar-month"],
  sections: [
    {
      title: { ne: "घट्ने महिना", en: "The month that disappears" },
      eyebrow: "The rare opposite",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "अधिक मास थपिन्छ भन्ने सबैलाई थाहा छ। तर विपरीत पनि सम्भव छ — कुनै चान्द्र मास पात्रोबाट **हराउन** सक्छ। यसलाई *क्षय मास* भनिन्छ।",
            en: "That an extra month gets added is widely known. The opposite is also possible — a lunar month can **vanish** from the calendar. That is a *kṣaya māsa*.",
          },
        },
        {
          kind: "para",
          text: {
            ne: "नियम अधिक मासकै ऐनामा उभिन्छ:",
            en: "The rule is the mirror image of the one for an extra month:",
          },
        },
        {
          kind: "keys",
          items: [
            {
              h: { ne: "अधिक मास", en: "Adhika māsa" },
              p: {
                ne: "चान्द्र मासभित्र **कुनै सङ्क्रान्ति परेन** → मास दोहोरिन्छ।",
                en: "A lunar month contains **no sankranti** → the month is doubled.",
              },
            },
            {
              h: { ne: "क्षय मास", en: "Kṣaya māsa" },
              p: {
                ne: "चान्द्र मासभित्र **दुई सङ्क्रान्ति परे** → एक मास घट्छ।",
                en: "A lunar month contains **two sankrantis** → a month is dropped.",
              },
            },
          ],
        },
      ],
    },
    {
      title: { ne: "दुई सङ्क्रान्ति कसरी अटाउँछन्", en: "How two sankrantis fit inside one month" },
      eyebrow: "Perihelion",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "चान्द्र मास `२९.५३` दिनको हुन्छ। सौर मास सामान्यतया `३०`–`३१` दिनको — त्यसैले प्रायः एक चान्द्र मासमा एउटै सङ्क्रान्ति पर्छ।",
            en: "A lunar month runs `29.53` days. A solar month is usually `30`–`31` days, so normally exactly one sankranti falls inside each lunar month.",
          },
        },
        {
          kind: "para",
          text: {
            ne: "तर पुष–माघतिर पृथ्वी ~उपसौर~ (perihelion) नजिक हुन्छ। त्यसबेला सूर्य सबैभन्दा छिटो हिँड्छ र सौर मास घटेर `२९` दिनसम्म झर्छ — चान्द्र मासभन्दा छोटो। तब दुई सङ्क्रान्ति एउटै चान्द्र मासभित्र अटाउन सक्छन्।",
            en: "Around Pauṣa–Māgha, though, Earth is near ~perihelion~. The Sun then moves at its fastest and a solar month shrinks to about `29` days — shorter than a lunar month. Two sankrantis can then fit inside one lunar month.",
          },
        },
        {
          kind: "figure",
          art: `सामान्य / Normal
  ├──── चान्द्र मास (29.53 दिन/days) ────┤
        ↑ सङ्क्रान्ति / sankranti          (एक / one)

क्षय मास / Kshaya masa   (उपसौर नजिक / near perihelion)
  ├──── चान्द्र मास (29.53 दिन/days) ────┤
   ↑                                  ↑
   सङ्क्रान्ति                       सङ्क्रान्ति   (दुई / two)
   → एक सौर मासको नाम प्रयोग नै हुँदैन
     one solar month name is never used`,
          caption: {
            ne: "छोटो सौर मास चान्द्र मासभित्र पूरै अटाउँदा त्यसको नाम पात्रोमा देखिँदैन।",
            en: "When a short solar month fits entirely inside a lunar month, its name never appears in the calendar.",
          },
        },
      ],
    },
    {
      title: { ne: "कति दुर्लभ छ", en: "How rare it is" },
      eyebrow: "Once in a lifetime",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "क्षय मास अत्यन्तै दुर्लभ छ — औसतमा `१४०` देखि `१९०` वर्षमा एक पटक। अधिक मास हरेक करिब तीन वर्षमा आउने कुरासँग तुलना गर्नुहोस्।",
            en: "A kṣaya māsa is genuinely rare — on average once every `140` to `190` years. Compare that with an extra month roughly every three.",
          },
        },
        {
          kind: "list",
          items: [
            {
              ne: "यो सधैँ **कार्तिक, मार्गशीर्ष वा पौष** मध्ये कुनै एक हुन्छ — उपसौर यही समयमा पर्ने भएकाले।",
              en: "It is always one of **Kārtika, Mārgaśīrṣa or Pauṣa** — because that is when perihelion falls.",
            },
            {
              ne: "क्षय मास पर्ने वर्षमा **सधैँ दुई अधिक मास** पनि हुन्छन् — एउटा अगाडि, एउटा पछाडि — जसले वर्षको सन्तुलन कायम राख्छ।",
              en: "A year containing a kṣaya māsa **always carries two adhika māsas** as well, one before and one after, which keeps the year in balance.",
            },
            {
              ne: "पृथ्वीको उपसौर बिन्दु आफैँ बिस्तारै सर्ने हुनाले, शताब्दीयौँपछि क्षय मास फरक महिनामा पर्न थाल्नेछ।",
              en: "Because Earth's perihelion itself slowly shifts, in future centuries the kṣaya māsa will start landing in different months.",
            },
          ],
        },
        {
          kind: "note",
          text: {
            ne: "क्षय मास पात्रोको त्रुटि होइन — यो नियमको इमानदार परिणाम हो। सूर्य र चन्द्र दुवैको वास्तविक गति पछ्याउँदा यस्ता दुर्लभ अवस्था आउनु स्वाभाविक हो।",
            en: "A kṣaya māsa is not a calendar error but an honest consequence of the rule. Follow the true motion of both Sun and Moon and rare cases like this are bound to arise.",
          },
        },
      ],
    },
  ],
};
