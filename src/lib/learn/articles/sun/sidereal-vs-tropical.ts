import type { ArticleData } from "../../article-schema";

export const siderealVsTropical: ArticleData = {
  slug: "sidereal-vs-tropical",
  seeAlso: ["ayanamsha", "ritu-drift", "precession", "sidereal-vs-tropical-year"],
  sections: [
    {
      title: { ne: "राशिचक्र कहाँबाट नाप्ने?", en: "Where do you start measuring the zodiac?" },
      eyebrow: "The zero-point problem",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "राशिचक्र `३६०°` को वृत्त हो। तर वृत्तको **शून्य कहाँ राख्ने**? यो एउटै प्रश्नले वैदिक र पश्चिमी पात्रोलाई अलग बनाउँछ।",
            en: "The zodiac is a `360°` circle. But **where do you put its zero**? That single question is what separates the Vedic and Western calendars.",
          },
        },
        {
          kind: "keys",
          items: [
            {
              h: { ne: "सायन राशिचक्र", en: "Tropical zodiac" },
              p: {
                ne: "शून्य = **वसन्त विषुव**। ऋतुसँग बाँधिएको; मेषको आरम्भ ग्रेगोरियन पात्रोमा सधैँ ~२१ मार्च।",
                en: "Zero = the **vernal equinox**. Tied to the seasons; the start of Aries is always ~21 March.",
              },
            },
            {
              h: { ne: "निरयन राशिचक्र", en: "Sidereal zodiac" },
              p: {
                ne: "शून्य = **ताराको एक निश्चित बिन्दु**। तारापुञ्जसँग बाँधिएको; ऋतुबाट बिस्तारै सर्छ।",
                en: "Zero = a **fixed point among the stars**. Tied to the constellations; slowly slips against the seasons.",
              },
            },
          ],
        },
        {
          kind: "diagram",
          id: "ayanamsha-wheel",
          caption: {
            ne: "दुई राशिचक्र एकमाथि अर्को — बीचको कोणीय फरक नै अयनांश हो।",
            en: "The two zodiacs superimposed — the angular gap between them is the ayanamsha.",
          },
        },
      ],
    },
    {
      title: { ne: "फरक किन बढ्दै जान्छ", en: "Why the gap keeps growing" },
      eyebrow: "Precession",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "पृथ्वीको घुर्णन अक्ष स्थिर छैन — यो लट्टुझैँ बिस्तारै घुम्छ, र एक फेरो पूरा गर्न झन्डै `२६,०००` वर्ष लाग्छ। यसलाई ~अयन चलन~ (precession) भनिन्छ।",
            en: "Earth's axis of rotation is not fixed — it wobbles like a top, taking about `26,000` years for one full turn. This is ~precession~.",
          },
        },
        {
          kind: "para",
          text: {
            ne: "अक्ष सर्दा विषुव बिन्दु पनि सर्छ, तर तारा आफ्नै ठाउँमा रहन्छन्। त्यसैले सायन शून्य तारापुञ्जको सापेक्ष बिस्तारै पछाडि हट्दै जान्छ — प्रति वर्ष `~५०` विकला, हरेक `७२` वर्षमा झन्डै `१°`।",
            en: "As the axis shifts so does the equinox point, while the stars stay put. The tropical zero therefore slides backwards against the constellations — about `50` arc-seconds a year, roughly `1°` every `72` years.",
          },
        },
        {
          kind: "diagram",
          id: "precession-cone",
        },
        {
          kind: "formula",
          cards: [
            {
              big: "~24°",
              label: { ne: "आजको अयनांश", en: "Ayanamsha today" },
              desc: { ne: "लाहिरी प्रणालीअनुसार — दुई राशिचक्रबीचको वर्तमान फरक।", en: "By the Lahiri system — the present gap between the two zodiacs." },
            },
            {
              big: "~2,160",
              unit: { ne: "वर्ष", en: "years" },
              label: { ne: "एक राशि सर्न", en: "To shift one full sign" },
              desc: { ne: "३०° ÷ (१° प्रति ७२ वर्ष) — त्यसैले “युग” को अवधारणा।", en: "30° ÷ (1° per 72 years) — hence the notion of an \"age\"." },
            },
          ],
        },
      ],
    },
    {
      title: { ne: "कुन सही हो?", en: "Which one is correct?" },
      eyebrow: "Neither — they answer different questions",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "यो प्रश्न आफैँ गलत छ। दुवै **सही** छन्, किनभने दुवैले फरक कुरा नाप्छन्। प्रश्न यो होइन कि कुन सही हो, प्रश्न यो हो कि तपाईंलाई के चाहिएको छ।",
            en: "The question is itself misframed. Both are **correct**, because they measure different things. The real question is not which is right but what you need.",
          },
        },
        {
          kind: "list",
          items: [
            {
              ne: "**ऋतु कहिले आउँछ** जान्न चाहनुहुन्छ? सायन प्रयोग गर्नुहोस् — ग्रेगोरियन पात्रोले त्यही गर्छ।",
              en: "Want to know **when a season arrives**? Use the tropical frame — which is what the Gregorian calendar does.",
            },
            {
              ne: "**सूर्य कुन ताराको अगाडि छ** जान्न चाहनुहुन्छ? निरयन प्रयोग गर्नुहोस् — वैदिक पात्रोले त्यही गर्छ।",
              en: "Want to know **which stars the Sun stands before**? Use the sidereal frame — which is what the Vedic calendar does.",
            },
          ],
        },
        {
          kind: "para",
          text: {
            ne: "समस्या तब मात्र आउँछ जब दुई प्रणाली मिसिन्छन् — जस्तै पश्चिमी पत्रिकाको राशिफल (सायन) र नेपाली जन्म राशि (निरयन) एउटै हो भनी ठान्नु। यी झन्डै एक राशि फरक हुन्छन्।",
            en: "Trouble comes only from mixing them — taking a Western newspaper horoscope (tropical) and a Nepali birth rashi (sidereal) to be the same thing. They differ by nearly a whole sign.",
          },
        },
        {
          kind: "note",
          text: {
            ne: "अयनांशका कैयन् प्रणाली छन् — लाहिरी, रमन, केपी — र प्रत्येकले शून्य बिन्दु अलि फरक ठाउँमा राख्छ। नेपाल र भारतको सरकारी पात्रोले **लाहिरी** प्रयोग गर्छ।",
            en: "There are several ayanamsha systems — Lahiri, Raman, KP — each placing the zero slightly differently. The official calendars of Nepal and India use **Lahiri**.",
          },
        },
      ],
    },
  ],
};
