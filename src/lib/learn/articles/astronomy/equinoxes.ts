import type { ArticleData } from "../../article-schema";

export const equinoxes: ArticleData = {
  slug: "equinoxes",
  seeAlso: ["solstices", "celestial-equator", "sidereal-vs-tropical", "declination"],
  sections: [
    {
      title: { ne: "विषुव — सूर्य विषुवत् रेखा काट्ने क्षण", en: "The moment the Sun crosses the equator" },
      eyebrow: "Declination zero",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "*विषुव* (equinox) त्यो क्षण हो जब सूर्यको क्रान्ति ठ्याक्कै `०°` हुन्छ — अर्थात् सूर्य खगोलीय विषुवत् रेखा काट्छ। वर्षमा दुई पटक हुन्छ।",
            en: "An *equinox* is the instant the Sun's declination is exactly `0°` — the Sun crossing the celestial equator. It happens twice a year.",
          },
        },
        {
          kind: "keys",
          items: [
            {
              h: { ne: "वसन्त विषुव · ~चैत ६–७", en: "Vernal equinox · ~21 March" },
              p: {
                ne: "सूर्य दक्षिणबाट उत्तरतिर काट्छ। सायन राशिचक्रको **शून्य बिन्दु** यही हो।",
                en: "The Sun crosses south to north. This is the **zero point** of the tropical zodiac.",
              },
            },
            {
              h: { ne: "शरद् विषुव · ~असोज ६–७", en: "Autumnal equinox · ~23 September" },
              p: {
                ne: "सूर्य उत्तरबाट दक्षिणतिर काट्छ। सायन तुलाको आरम्भ।",
                en: "The Sun crosses north to south — the start of tropical Libra.",
              },
            },
          ],
        },
        {
          kind: "para",
          text: {
            ne: "नाम लैटिनबाट आएको हो: *aequi* (बराबर) + *nox* (रात) — दिन र रात बराबर हुने दिन।",
            en: "The name is Latin: *aequi* (equal) + *nox* (night) — the day on which day and night are equal.",
          },
        },
      ],
    },
    {
      title: { ne: "दिन र रात ठ्याक्कै बराबर हुँदैनन्", en: "Day and night are not exactly equal" },
      eyebrow: "A small surprise",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "नामले जे भने पनि, विषुवको दिन दिन र रात ठ्याक्कै `१२`–`१२` घण्टा हुँदैनन् — दिन झन्डै `८` मिनेट लामो हुन्छ। दुई कारणले।",
            en: "Despite the name, day and night are not exactly `12` hours each at an equinox — the day runs about `8` minutes longer. For two reasons.",
          },
        },
        {
          kind: "keys",
          items: [
            {
              h: { ne: "सूर्यको बिम्ब", en: "The Sun has a disc" },
              p: {
                ne: "सूर्योदय भनेको बिम्बको **माथिल्लो किनारा** देखिनु हो, केन्द्र होइन — यसैले केही मिनेट थपिन्छ।",
                en: "Sunrise is when the disc's **upper edge** appears, not its centre — which adds a few minutes.",
              },
            },
            {
              h: { ne: "वायुमण्डलीय अपवर्तन", en: "Atmospheric refraction" },
              p: {
                ne: "वायुमण्डलले प्रकाश बङ्ग्याउँछ, त्यसैले सूर्य वास्तवमा क्षितिजमुनि हुँदै देखिन थाल्छ।",
                en: "The atmosphere bends light, so the Sun becomes visible while still physically below the horizon.",
              },
            },
          ],
        },
        {
          kind: "para",
          text: {
            ne: "दिन र रात साँच्चै बराबर हुने दिनलाई ~इक्विलक्स~ (equilux) भनिन्छ, र यो विषुवभन्दा केही दिन अगाडि वा पछाडि पर्छ — अक्षांशअनुसार फरक।",
            en: "The day on which they truly are equal is called the ~equilux~, and it falls a few days before or after the equinox, depending on latitude.",
          },
        },
      ],
    },
    {
      title: { ne: "पात्रोका लागि किन महत्त्वपूर्ण", en: "Why it matters to a calendar" },
      eyebrow: "The tropical anchor",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "वसन्त विषुव सायन प्रणालीको **आधारशिला** हो। ग्रेगोरियन पात्रोको लीप वर्ष नियम यसैलाई `२१` मार्चतिर स्थिर राख्न बनाइएको हो।",
            en: "The vernal equinox is the **anchor** of the tropical system. The Gregorian leap-year rule exists to hold it near `21` March.",
          },
        },
        {
          kind: "para",
          text: {
            ne: "नेपाली पात्रो भने निरयन भएकाले विषुवलाई सन्दर्भ मान्दैन — त्यसैले नेपाली नयाँ वर्ष विषुवको दिन नभई त्यसको झन्डै `२४` दिनपछि पर्छ। यही अन्तर ~अयनांश~ हो।",
            en: "The Nepali calendar, being sidereal, does not use the equinox as its reference — which is why its new year falls not on the equinox but about `24` days later. That interval is the ~ayanamsha~.",
          },
        },
        {
          kind: "diagram",
          id: "equinox-precession",
          caption: {
            ne: "विषुव बिन्दु ताराको सापेक्ष बिस्तारै सर्दै — सायन र निरयन प्रणालीको मूल भिन्नता।",
            en: "The equinox point sliding against the stars — the root difference between the tropical and sidereal systems.",
          },
        },
      ],
    },
  ],
};
