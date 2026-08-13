import type { ArticleData } from "../../article-schema";

export const bsCalendar: ArticleData = {
  slug: "bs-calendar",
  seeAlso: ["sauramana", "chandramana", "adhik-maas", "bikram-sambat"],
  sections: [
    {
      title: { ne: "दुई फरक घडी", en: "Two different clocks" },
      eyebrow: "Solar · Lunar",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "~सौर पात्रो~ सूर्यको स्थितिमा आधारित हुन्छ — ऋतुसँग मिल्छ। *चान्द्र पात्रो* चन्द्रको कलामा आधारित हुन्छ — तिथि र पर्वसँग मिल्छ।",
            en: "A ~solar calendar~ is based on the Sun's position — it matches the seasons. A *lunar calendar* is based on the Moon's phases — it matches tithis and festivals.",
          },
        },
        {
          kind: "para",
          text: {
            ne: "नेपाली विक्रम सम्वत् यी दुईमध्ये कुनै एक होइन। यो **चान्द्र–सौर** पात्रो हो, जसले दुवैलाई मिलाएर चलाउँछ।",
            en: "The Nepali Bikram Sambat is neither one alone. It is a **lunisolar** calendar that runs by aligning both.",
          },
        },
        {
          kind: "keys",
          items: [
            {
              h: { ne: "सौर", en: "Solar" },
              p: {
                ne: "सूर्य → ऋतु, ~सङ्क्रान्ति~, गते। ग्रेगोरियन पात्रो शुद्ध सौर हो।",
                en: "Sun → seasons, ~sankranti~, gate. The Gregorian calendar is purely solar.",
              },
            },
            {
              h: { ne: "चान्द्र", en: "Lunar" },
              p: {
                ne: "चन्द्र → *तिथि*, पक्ष, पूर्णिमा/औंसी। इस्लामी पात्रो शुद्ध चान्द्र हो।",
                en: "Moon → *tithi*, paksha, full and new moon. The Islamic calendar is purely lunar.",
              },
            },
            {
              h: { ne: "चान्द्र–सौर", en: "Lunisolar" },
              p: {
                ne: "दुवैको मेल — बि.सं. र हिन्दू पात्रो। ~अधिक मास~ले सन्तुलन राख्छ।",
                en: "A blend of both — BS and the Hindu calendar. An ~adhik maas~ keeps the balance.",
              },
            },
          ],
        },
      ],
    },
    {
      title: { ne: "किन फरक पर्छ", en: "Why they differ" },
      eyebrow: "The 11-day gap",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "१२ चान्द्र मास र एक सौर वर्ष बराबर हुँदैनन् — र यही असमानताले पात्रोको सम्पूर्ण संरचना तय गर्छ।",
            en: "Twelve lunar months and one solar year are not equal — and that single mismatch shapes the whole structure of the calendar.",
          },
        },
        {
          kind: "formula",
          cards: [
            {
              big: "३५४",
              unit: { ne: "दिन", en: "days" },
              label: { ne: "१२ चान्द्र मास", en: "Twelve lunar months" },
              desc: {
                ne: "प्रत्येक मास ~२९.५ दिनको — चन्द्रको एक पूर्ण कला चक्र।",
                en: "Each month ~29.5 days — one full cycle of the Moon's phases.",
              },
            },
            {
              big: "३६५",
              unit: { ne: "दिन", en: "days" },
              label: { ne: "एक सौर वर्ष", en: "One solar year" },
              desc: {
                ne: "सूर्य राशिचक्रको एक फेरो पूरा गर्न लाग्ने समय।",
                en: "The time the Sun takes to travel once around the zodiac.",
              },
            },
            {
              big: "११",
              unit: { ne: "दिन", en: "days" },
              label: { ne: "वार्षिक फरक", en: "The yearly shortfall" },
              desc: {
                ne: "हरेक वर्ष जम्मा हुने अन्तर — तीन वर्षमा झन्डै एक महिना।",
                en: "The gap that accumulates each year — nearly a whole month every three years.",
              },
            },
          ],
        },
        {
          kind: "para",
          text: {
            ne: "यही फरक नमिलाए चाडपर्व बिस्तारै ऋतुबाट सर्दै जान्थे — दशैँ कालान्तरमा गर्मीमा पर्थ्यो। त्यसैले बीच–बीचमा ~अधिक मास~ थपिन्छ, र चान्द्र गणना फेरि सूर्यसँग मिल्न आउँछ।",
            en: "Left uncorrected, festivals would drift out of their seasons — Dashain would eventually land in summer. So an ~adhik maas~ is inserted periodically, pulling the lunar count back into step with the Sun.",
          },
        },
      ],
    },
    {
      title: { ne: "सूर्य · पृथ्वी · चन्द्र एकसाथ", en: "Sun · Earth · Moon together" },
      eyebrow: "Both cycles at once",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "यी दुई चक्र पालैपालो चल्दैनन् — एकैसाथ चल्छन्। तलको दृश्यमा पृथ्वी सूर्यको वरिपरि (वर्ष, **१२ सौर महिनामा** बाँडिएको) र चन्द्रमा पृथ्वीको वरिपरि (हरेक फेरो एक **चान्द्र महिना**) घुम्छन्।",
            en: "The two cycles do not take turns — they run at the same time. Below, the Earth orbits the Sun (the year, divided into **twelve solar months**) while the Moon orbits the Earth (each loop one **lunar month**).",
          },
        },
        {
          kind: "para",
          text: {
            ne: "दुवै आफ्नै अक्षमा पनि घुम्छन् — पृथ्वी दैनिक, चन्द्र एक फेरोमा एक पटक, त्यसैले चन्द्रको सधैँ उस्तै पट्टि देखिन्छ।",
            en: "Both also spin on their own axes — Earth daily, the Moon once per orbit, which is why the same face of the Moon always shows.",
          },
        },
        {
          kind: "diagram",
          id: "sun-earth-moon",
          caption: {
            ne: "प्ले थिचेर वा तानेर हेर्नुहोस् — पृथ्वीले वर्ष पूरा गर्दा चन्द्रले झन्डै १२ फेरो लगाइसकेको हुन्छ, तर ठ्याक्कै होइन। त्यही बाँकी अंश नै ११ दिनको फरक हो।",
            en: "Press play or drag — by the time the Earth completes a year the Moon has looped nearly twelve times, but not exactly. That leftover is the eleven-day gap.",
          },
        },
      ],
    },
    {
      title: { ne: "विक्रम सम्वत् कहाँ अटाउँछ", en: "Where Bikram Sambat fits" },
      eyebrow: "Bikram Sambat",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "विक्रम सम्वत् (बि.सं.) नेपालको आधिकारिक पात्रो हो, जुन ग्रेगोरियनभन्दा झन्डै `५६`–`५७` वर्ष अगाडि चल्छ।",
            en: "Bikram Sambat (BS) is Nepal's official calendar, running about `56`–`57` years ahead of the Gregorian.",
          },
        },
        {
          kind: "para",
          text: {
            ne: "यो *चान्द्र–सौर* पात्रो हो, र यसको दुई भाग फरक स्रोतबाट आउँछन् — महिनाको **नाम** चान्द्र मासबाट आउँछ भने महिनाको **लम्बाइ** सूर्यको राशि–गतिले तय गर्छ।",
            en: "It is a *lunisolar* calendar, and its two halves come from different sources — the month **names** come from the lunar months, while the month **lengths** are set by the Sun's motion through the signs.",
          },
        },
      ],
    },
    {
      title: { ne: "महिना कसरी बन्छ", en: "How the months form" },
      eyebrow: "Solar months",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "सूर्य एक राशिबाट अर्को राशिमा प्रवेश गर्ने क्षणलाई ~सङ्क्रान्ति~ भनिन्छ, र त्यही दिन नयाँ महिना सुरु हुन्छ।",
            en: "The moment the Sun crosses from one rashi into the next is called a ~sankranti~, and a new month begins that day.",
          },
        },
        {
          kind: "para",
          text: {
            ne: "सूर्य कुनै राशिमा `२९` देखि `३२` दिनसम्म बस्ने हुनाले बि.सं. का महिना **२९–३२ दिनका** हुन्छन् — र हरेक वर्ष फरक पर्न सक्छन्।",
            en: "Since the Sun stays in a sign anywhere from `29` to `32` days, BS months run **29–32 days** long — and can differ from one year to the next.",
          },
        },
        {
          kind: "keys",
          items: [
            {
              h: { ne: "गते = सौर दिन", en: "Gate = a solar day" },
              p: {
                ne: "सङ्क्रान्तिदेखि गनिने दिन — बैशाख १ गते सूर्य मेषमा पस्दा।",
                en: "The day counted from the sankranti — Baisakh 1 is when the Sun enters Mesha.",
              },
            },
            {
              h: { ne: "महिनाको अस्थिर लम्बाइ", en: "Variable month length" },
              p: {
                ne: "पृथ्वीको कक्ष अण्डाकार भएकाले सूर्यको देखिने गति घटबढ हुन्छ।",
                en: "Because Earth's orbit is elliptical, the Sun's apparent speed rises and falls.",
              },
            },
            {
              h: { ne: "नयाँ वर्ष बैशाखमा", en: "The year starts in Baisakh" },
              p: {
                ne: "~मेष सङ्क्रान्ति~ — सामान्यतया अप्रिल मध्यतिर पर्छ।",
                en: "~Mesha Sankranti~ — usually falling around the middle of April.",
              },
            },
          ],
        },
        {
          kind: "note",
          text: {
            ne: "यसैकारण आउँदो वर्षको पात्रो पहिल्यै ठ्याक्कै भन्न **खगोलीय गणना** चाहिन्छ — महिनाको दिन–सङ्ख्या सूर्यको वास्तविक स्थितिले तय गर्छ, कुनै निश्चित नियमले होइन।",
            en: "This is why stating next year's calendar exactly in advance needs **astronomical calculation** — the number of days in a month is set by the Sun's actual position, not by a fixed rule.",
          },
        },
      ],
    },
  ],
};
