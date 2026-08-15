import type { ArticleData } from "../../article-schema";

export const siderealVsTropicalYear: ArticleData = {
  slug: "sidereal-vs-tropical-year",
  seeAlso: ["solar-year", "sidereal-vs-tropical", "calendar-drift", "ritu-drift"],
  sections: [
    {
      title: { ne: "२० मिनेटको फरक", en: "Twenty minutes" },
      eyebrow: "365.2564 vs 365.2422",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "दुई किसिमका “वर्ष” छन्, र यीबीचको फरक प्रति वर्ष झन्डै `२०` मिनेटको मात्र छ। तर यही सानो फरकले वैदिक र पश्चिमी पात्रोलाई अलग बाटोमा लैजान्छ।",
            en: "There are two kinds of \"year\", and they differ by only about `20` minutes. Yet that small gap is what sends the Vedic and Western calendars down separate roads.",
          },
        },
        {
          kind: "formula",
          cards: [
            {
              big: "365.2564",
              unit: { ne: "दिन", en: "days" },
              label: { ne: "नाक्षत्र वर्ष", en: "Sidereal year" },
              desc: { ne: "पृथ्वी ताराको सापेक्ष उही स्थानमा — वास्तविक परिक्रमा काल।", en: "Earth back to the same place against the stars — the true orbital period." },
            },
            {
              big: "365.2422",
              unit: { ne: "दिन", en: "days" },
              label: { ne: "सायन वर्ष", en: "Tropical year" },
              desc: { ne: "विषुवदेखि विषुव — ऋतुचक्रको वास्तविक अवधि।", en: "Equinox to equinox — the real period of the seasonal cycle." },
            },
            {
              big: "0.0142",
              unit: { ne: "दिन", en: "day" },
              label: { ne: "फरक", en: "The difference" },
              desc: { ne: "२० मिनेट २४ सेकेन्ड — अयन चलनको प्रत्यक्ष परिणाम।", en: "20 minutes 24 seconds — a direct consequence of precession." },
            },
          ],
        },
        {
          kind: "para",
          text: {
            ne: "किन फरक? किनभने विषुव बिन्दु आफैँ **पछाडि सर्दै** छ। पृथ्वीले तारासँग मेल खान पूरा परिक्रमा पूरा गर्नुपर्छ; तर विषुवसँग मेल खान त्योभन्दा **अलिकति कम** पुग्छ, किनभने विषुव आफैँ भेट्न आउँदै छ।",
            en: "Why the gap? Because the equinox point is itself **sliding backwards**. To meet the stars Earth must finish a full orbit; to meet the equinox it needs **slightly less**, since the equinox is coming to meet it.",
          },
        },
      ],
    },
    {
      title: { ne: "जम्मा हुँदै जाने", en: "How it accumulates" },
      eyebrow: "One day in 72 years",
      blocks: [
        {
          kind: "figure",
          art: `प्रति वर्ष / per year        20 मिनेट 24 सेकेन्ड / 20m 24s
72 वर्षमा / in 72 years      ≈ 1 दिन / day
2,160 वर्षमा / years         ≈ 30 दिन / days  ≈ 1 राशि / one full sign
25,800 वर्षमा / years        ≈ 1 पूरा वर्ष / a whole year — चक्र पूरा / cycle closes`,
          caption: {
            ne: "प्रति वर्ष २० मिनेटले २५,८०० वर्षमा पूरै वर्षको फेरो लगाउँछ।",
            en: "Twenty minutes a year comes full circle after 25,800 years.",
          },
        },
        {
          kind: "para",
          text: {
            ne: "यही कारण नेपाली नयाँ वर्ष बिस्तारै पछाडि सर्दै छ। `२८५` ई.मा यो विषुवकै दिन पर्थ्यो; आज `२४` दिन पछि; `४,४००` ई.तिर यो जुन महिनामा पुग्नेछ।",
            en: "This is why the Nepali new year keeps creeping later. In `285` CE it fell on the equinox itself; today it is `24` days after; by around `4,400` CE it will have reached June.",
          },
        },
        {
          kind: "diagram",
          id: "equinox-precession",
        },
      ],
    },
    {
      title: { ne: "कुन “सही” वर्ष हो", en: "Which is the \"real\" year" },
      eyebrow: "Depends what you want it for",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "भौतिक रूपमा **नाक्षत्र वर्ष** पृथ्वीको वास्तविक परिक्रमा काल हो। तर व्यावहारिक रूपमा **सायन वर्ष** ले ऋतु दिन्छ — र मानव जीवन ऋतुमा चल्छ।",
            en: "Physically the **sidereal year** is Earth's true orbital period. Practically the **tropical year** is the one that delivers the seasons — and human life runs on seasons.",
          },
        },
        {
          kind: "table",
          headers: [
            { ne: "यदि तपाईंलाई चाहिन्छ", en: "If you want" },
            { ne: "प्रयोग गर्नुहोस्", en: "Use" },
          ],
          rows: [
            [
              { ne: "कहिले धान रोप्ने", en: "To know when to plant rice" },
              { ne: "सायन — ऋतुसँग बाँधिएको", en: "Tropical — it tracks the seasons" },
            ],
            [
              { ne: "सूर्य कुन ताराको अगाडि", en: "To know which stars the Sun is among" },
              { ne: "नाक्षत्र — ताराको सापेक्ष", en: "Sidereal — it tracks the stars" },
            ],
            [
              { ne: "पृथ्वीको वास्तविक परिक्रमा काल", en: "Earth's actual orbital period" },
              { ne: "नाक्षत्र — यही भौतिक उत्तर हो", en: "Sidereal — that is the physical answer" },
            ],
          ],
        },
        {
          kind: "note",
          text: {
            ne: "ग्रेगोरियनको लीप वर्ष नियम **सायन** वर्षलाई पछ्याउन बनाइएको हो। यदि यसले नाक्षत्र वर्ष पछ्याएको भए ऋतु बिस्तारै सर्दै जान्थे — ठ्याक्कै निरयन पात्रोमा भइरहेकोजस्तै।",
            en: "The Gregorian leap rule is tuned to the **tropical** year. Had it tracked the sidereal one, its seasons would drift — exactly as they do in a sidereal calendar.",
          },
        },
      ],
    },
  ],
};
