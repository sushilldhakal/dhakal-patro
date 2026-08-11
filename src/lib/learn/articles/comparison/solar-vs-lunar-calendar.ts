import type { ArticleData } from "../../article-schema";

export const solarVsLunarCalendar: ArticleData = {
  slug: "solar-vs-lunar-calendar",
  seeAlso: ["bs-calendar", "lunar-solar-drift", "calendar-differences", "leap-years"],
  sections: [
    {
      title: { ne: "तीन किसिमका पात्रो", en: "Three kinds of calendar" },
      eyebrow: "What each keeps aligned",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "हरेक पात्रोले एउटा छनोट गर्नुपर्छ — **ऋतुसँग मिल्ने** कि **चन्द्रको कलासँग**? दुवै सँगै पूर्ण रूपमा मिलाउन सकिँदैन, किनभने दुई चक्र पूर्णाङ्कमा मिल्दैनन्।",
            en: "Every calendar must choose — stay aligned with **the seasons** or with **the Moon's phases**? Both cannot be held perfectly, because the two cycles do not divide evenly.",
          },
        },
        {
          kind: "table",
          headers: [
            { ne: "प्रकार", en: "Type" },
            { ne: "के मिलाउँछ", en: "Keeps aligned with" },
            { ne: "के छाड्छ", en: "Gives up" },
            { ne: "उदाहरण", en: "Example" },
          ],
          rows: [
            [
              { ne: "सौर", en: "Solar" },
              { ne: "ऋतु", en: "The seasons" },
              { ne: "चन्द्रको कला", en: "The Moon's phases" },
              { ne: "ग्रेगोरियन", en: "Gregorian" },
            ],
            [
              { ne: "चान्द्र", en: "Lunar" },
              { ne: "चन्द्रको कला", en: "The Moon's phases" },
              { ne: "ऋतु", en: "The seasons" },
              { ne: "इस्लामी (हिजरी)", en: "Islamic (Hijri)" },
            ],
            [
              { ne: "चान्द्र–सौर", en: "Lunisolar" },
              { ne: "दुवै — सुधारसहित", en: "Both — with a correction" },
              { ne: "महिनाको स्थिर लम्बाइ", en: "A fixed number of months" },
              { ne: "बि.सं., हिब्रू, चिनियाँ", en: "BS, Hebrew, Chinese" },
            ],
          ],
        },
      ],
    },
    {
      title: { ne: "प्रत्येकको मूल्य", en: "What each choice costs" },
      eyebrow: "There is no free option",
      blocks: [
        {
          kind: "keys",
          items: [
            {
              h: { ne: "शुद्ध सौर", en: "Purely solar" },
              p: {
                ne: "महिना चन्द्रसँग सम्बन्धित रहँदैन — ग्रेगोरियन “महिना” आकाशमा केही पनि होइन, केवल गणना।",
                en: "Months lose all connection to the Moon — a Gregorian \"month\" corresponds to nothing in the sky.",
              },
            },
            {
              h: { ne: "शुद्ध चान्द्र", en: "Purely lunar" },
              p: {
                ne: "हरेक महिना साँच्चै चन्द्र चक्र हो, तर वर्ष ११ दिन छोटो — पर्व ३३ वर्षमा पूरै ऋतु घुम्छन्।",
                en: "Every month is a real lunar cycle, but the year runs 11 days short — festivals circle the seasons in 33 years.",
              },
            },
            {
              h: { ne: "चान्द्र–सौर", en: "Lunisolar" },
              p: {
                ne: "दुवै जोगिन्छन्, तर मूल्य — कुनै वर्षमा १२ महिना, कुनैमा १३। जटिलता नै मूल्य हो।",
                en: "Both are preserved, at the cost of years with 12 months and years with 13. Complexity is the price.",
              },
            },
          ],
        },
        {
          kind: "para",
          text: {
            ne: "नेपाली पात्रोले तेस्रो बाटो रोज्छ, तर एउटा थप मोडसहित — **महिनाको नाम चान्द्र, तर गतेको लम्बाइ सौर**। यसैले बि.सं. सामान्य चान्द्र–सौर पात्रोभन्दा पनि एक तह बढी संयुक्त छ।",
            en: "The Nepali calendar takes the third road with an extra twist — **lunar month names, but solar month lengths**. That makes BS one layer more hybrid than a standard lunisolar calendar.",
          },
        },
      ],
    },
    {
      title: { ne: "किन कसैले हिजरी छाडेन", en: "Why nobody abandoned the Hijri calendar" },
      eyebrow: "A calendar serves a purpose",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "शुद्ध चान्द्र पात्रो “त्रुटिपूर्ण” होइन — यसले फरक काम गर्छ। इस्लामी परम्परामा धार्मिक तिथि चन्द्र दर्शनसँग बाँधिएका छन्, ऋतुसँग होइन।",
            en: "A purely lunar calendar is not defective — it does a different job. In Islamic practice religious dates are tied to sighting the Moon, not to the seasons.",
          },
        },
        {
          kind: "para",
          text: {
            ne: "त्यसैले रमजान ऋतुभरि घुम्नु समस्या होइन, **विशेषता** हो — हरेक पुस्ताले यसलाई विभिन्न ऋतुमा अनुभव गर्छ। नेपाली परम्परामा भने दसैँ शरद्‌मै पर्नुपर्ने भएकाले फरक समाधान चाहियो।",
            en: "So Ramadan travelling through the seasons is not a flaw but a **feature** — every generation experiences it in each season. Nepali practice, needing Dashain to stay in autumn, required a different solution.",
          },
        },
        {
          kind: "note",
          text: {
            ne: "पात्रो कुनै अमूर्त शुद्धताको खोजी होइन — यो **समाजले समय कसरी प्रयोग गर्छ** भन्ने कुराको प्रतिबिम्ब हो।",
            en: "A calendar is not a search for abstract correctness — it is a reflection of **how a society uses time**.",
          },
        },
      ],
    },
  ],
};
