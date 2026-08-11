import type { ArticleData } from "../../article-schema";

export const rashi: ArticleData = {
  slug: "rashi",
  seeAlso: ["twelve-rashis", "sankranti", "zodiac-belt", "nakshatra"],
  sections: [
    {
      title: { ne: "राशि — आकाशको ३०° खण्ड", en: "A rashi is a 30° slice of sky" },
      eyebrow: "A coordinate frame",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "*राशि* राशिचक्रको बाह्र भागमध्ये एक हो। प्रत्येक राशि ठ्याक्कै `३०°` को हुन्छ, र `१२ × ३०° = ३६०°` — पूरै वृत्त।",
            en: "A *rashi* is one of the twelve divisions of the zodiac. Each spans exactly `30°`, and `12 × 30° = 360°` — the complete circle.",
          },
        },
        {
          kind: "para",
          text: {
            ne: "यहाँ बुझ्नुपर्ने मुख्य कुरा यो हो — राशि तारापुञ्जको आकार होइन, **समन्वय प्रणाली** हो। यसले आकाशीय देशान्तर नाप्न बाह्र बराबर खण्डको ढाँचा दिन्छ।",
            en: "The key idea is that a rashi is not the shape of a constellation but a **coordinate system** — a frame of twelve equal slices for describing celestial longitude.",
          },
        },
        {
          kind: "diagram",
          id: "ecliptic-belt",
          caption: {
            ne: "क्रान्तिवृत्तको वरिपरि बाह्र बराबर राशि खण्ड।",
            en: "The twelve equal rashi slices laid around the ecliptic.",
          },
        },
      ],
    },
    {
      title: { ne: "राशि र तारापुञ्ज एउटै होइनन्", en: "Rashi and constellation are not the same" },
      eyebrow: "Equal slices vs ragged shapes",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "आकाशमा देखिने तारापुञ्ज (constellation) असमान आकारका छन् — कुनै फराकिलो, कुनै साँघुरो। राशि भने सधैँ बराबर `३०°` का हुन्छन्।",
            en: "The constellations we actually see are unequal — some sprawling, some cramped. Rashis are always an even `30°`.",
          },
        },
        {
          kind: "keys",
          items: [
            {
              h: { ne: "तारापुञ्ज", en: "Constellation" },
              p: {
                ne: "आकाशमा देखिने तारा समूह — असमान चौडाइ। कन्या तारापुञ्ज ~४४° फैलिएको छ, वृश्चिक ~७° मात्र।",
                en: "An actual group of stars, of uneven width. The constellation Virgo spans some 44°, Scorpius barely 7°.",
              },
            },
            {
              h: { ne: "राशि", en: "Rashi" },
              p: {
                ne: "गणनाको खण्ड — सधैँ ठ्याक्कै ३०°। नाम तारापुञ्जबाट लिइएको, तर सीमा गणितीय।",
                en: "A computational slice, always exactly 30°. The name is borrowed from a constellation; the boundary is mathematical.",
              },
            },
          ],
        },
        {
          kind: "para",
          text: {
            ne: "यसैले “सूर्य मेष राशिमा छ” भन्नुको अर्थ सूर्य मेष तारापुञ्जको अगाडि छ भन्ने होइन — यसको अर्थ सूर्यको निरयन देशान्तर `०°` र `३०°` को बीचमा छ भन्ने हो।",
            en: "So \"the Sun is in Mesha\" does not mean the Sun sits in front of the stars of Aries. It means the Sun's sidereal longitude lies between `0°` and `30°`.",
          },
        },
      ],
    },
    {
      title: { ne: "राशि कहाँ–कहाँ प्रयोग हुन्छ", en: "Where rashis are used" },
      eyebrow: "Beyond the calendar",
      blocks: [
        {
          kind: "list",
          items: [
            {
              ne: "**सौर महिना** — सूर्य कुन राशिमा छ भन्नेले नेपाली महिना तय गर्छ।",
              en: "**Solar months** — which rashi the Sun occupies decides the Nepali month.",
            },
            {
              ne: "**चन्द्र राशि** — जन्मको समय चन्द्र कुन राशिमा थियो; नेपालमा “राशि” भन्नेबित्तिकै प्रायः यही बुझिन्छ।",
              en: "**Moon sign** — the rashi the Moon occupied at birth; in Nepal this is usually what \"rashi\" means in everyday speech.",
            },
            {
              ne: "**लग्न** — जन्मको क्षणमा पूर्वी क्षितिजमा उदाउँदै गरेको राशि; कुण्डलीको पहिलो भाव।",
              en: "**Lagna** — the rashi rising on the eastern horizon at birth; the first house of a kundali.",
            },
            {
              ne: "**ग्रह स्थिति** — हरेक ग्रहको स्थान कुन राशिको कति अंशमा भनेर लेखिन्छ।",
              en: "**Planetary positions** — every graha's place is written as so many degrees within a named rashi.",
            },
          ],
        },
        {
          kind: "diagram",
          id: "table-rashi",
        },
      ],
    },
  ],
};
