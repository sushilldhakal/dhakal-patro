import type { ArticleData } from "../../article-schema";

export const uttarayanaDakshinayana: ArticleData = {
  slug: "uttarayana-dakshinayana",
  seeAlso: ["declination", "makara-sankranti", "karka-sankranti", "solstices"],
  sections: [
    {
      title: { ne: "सूर्यको उत्तर–दक्षिण यात्रा", en: "The Sun's north–south journey" },
      eyebrow: "Two half-years",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "वर्षभरि सूर्य क्षितिजमा उही ठाउँबाट उदाउँदैन। यो बिस्तारै उत्तरतिर सर्छ, फेरि दक्षिणतिर फर्किन्छ — र यही आवतजावतले वर्षलाई दुई *अयन* मा बाँड्छ।",
            en: "The Sun does not rise from the same spot on the horizon all year. It drifts north, then turns back south — and that swing divides the year into two *ayanas*.",
          },
        },
        {
          kind: "keys",
          items: [
            {
              h: { ne: "उत्तरायण", en: "Uttarāyaṇa" },
              p: {
                ne: "सूर्य दक्षिणबाट **उत्तरतिर** सर्ने छ महिना — दिन लामो हुँदै जान्छ। परम्परामा शुभ अवधि मानिन्छ।",
                en: "The six months in which the Sun moves **northward** — days lengthen. Traditionally an auspicious period.",
              },
            },
            {
              h: { ne: "दक्षिणायन", en: "Dakṣiṇāyana" },
              p: {
                ne: "सूर्य उत्तरबाट **दक्षिणतिर** सर्ने छ महिना — दिन छोटो हुँदै जान्छ। वर्षा र चतुर्मास यही अवधिमा।",
                en: "The six months in which the Sun moves **southward** — days shorten. The monsoon and Chaturmas fall here.",
              },
            },
          ],
        },
        {
          kind: "diagram",
          id: "earth-rotation",
          caption: {
            ne: "पृथ्वीको झुकिएको अक्षले सूर्यलाई वर्षभरि उत्तर–दक्षिण सारेको देखाउँछ।",
            en: "Earth's tilted axis is what makes the Sun appear to swing north and south through the year.",
          },
        },
      ],
    },
    {
      title: { ne: "यो वास्तवमा क्रान्तिको कुरा हो", en: "What is really moving is declination" },
      eyebrow: "±23.44°",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "“सूर्य उत्तर लाग्यो” भन्नुको खगोलीय अर्थ हो — सूर्यको ~क्रान्ति~ (declination) बढ्दै छ, अर्थात् सूर्य खगोलीय विषुवत् रेखाभन्दा उत्तरतिर सर्दै छ।",
            en: "Astronomically, \"the Sun turns north\" means its ~declination~ is increasing — the Sun is moving north of the celestial equator.",
          },
        },
        {
          kind: "formula",
          cards: [
            {
              big: "+23.44°",
              label: { ne: "उत्तरतम क्रान्ति", en: "Northernmost declination" },
              desc: { ne: "ग्रीष्म अयनान्त, ~२१ जुन — उत्तरी गोलार्धमा सबैभन्दा लामो दिन।", en: "Summer solstice, ~21 June — the longest day in the northern hemisphere." },
            },
            {
              big: "0°",
              label: { ne: "विषुव", en: "Equinox" },
              desc: { ne: "सूर्य विषुवत् रेखामा — दिन र रात झन्डै बराबर।", en: "The Sun on the celestial equator — day and night nearly equal." },
            },
            {
              big: "−23.44°",
              label: { ne: "दक्षिणतम क्रान्ति", en: "Southernmost declination" },
              desc: { ne: "शीत अयनान्त, ~२२ डिसेम्बर — सबैभन्दा छोटो दिन।", en: "Winter solstice, ~22 December — the shortest day." },
            },
          ],
        },
        {
          kind: "para",
          text: {
            ne: "अयनान्त भनेको क्रान्ति **चरम बिन्दुमा पुगेर फर्किने क्षण** हो। त्यसैले अयन (उत्तरायण/दक्षिणायन) को वास्तविक सन्धि अयनान्तमै हुन्छ — डिसेम्बर र जुनमा।",
            en: "A solstice is the moment declination **reaches its extreme and reverses**. So the true turn between the ayanas happens at the solstices — in December and June.",
          },
        },
      ],
    },
    {
      title: { ne: "परम्परागत मिति र वास्तविक मिति", en: "The traditional date and the real one" },
      eyebrow: "24 days apart",
      blocks: [
        {
          kind: "lede",
          text: {
            ne: "परम्परामा उत्तरायण मकर सङ्क्रान्ति (माघ १) बाट र दक्षिणायन कर्क सङ्क्रान्ति (साउन १) बाट गनिन्छ। खगोलीय रूपमा भने यी अयनान्तमा सुरु हुन्छन्।",
            en: "Tradition counts Uttarāyaṇa from Makara Sankranti (Magh 1) and Dakshinayana from Karka Sankranti (Shrawan 1). Astronomically, though, they begin at the solstices.",
          },
        },
        {
          kind: "table",
          headers: [
            { ne: "अयन", en: "Ayana" },
            { ne: "परम्परागत आरम्भ", en: "Traditional start" },
            { ne: "खगोलीय आरम्भ", en: "Astronomical start" },
          ],
          rows: [
            [
              { ne: "उत्तरायण", en: "Uttarāyaṇa" },
              { ne: "मकर सङ्क्रान्ति · ~१४ जनवरी", en: "Makara Sankranti · ~14 Jan" },
              { ne: "शीत अयनान्त · ~२२ डिसेम्बर", en: "Winter solstice · ~22 Dec" },
            ],
            [
              { ne: "दक्षिणायन", en: "Dakṣiṇāyana" },
              { ne: "कर्क सङ्क्रान्ति · ~१६ जुलाई", en: "Karka Sankranti · ~16 Jul" },
              { ne: "ग्रीष्म अयनान्त · ~२१ जुन", en: "Summer solstice · ~21 Jun" },
            ],
          ],
        },
        {
          kind: "note",
          text: {
            ne: "यो `~२४` दिनको फरक त्रुटि होइन — अयन चलनको सञ्चित परिणाम हो। कुनै समय दुवै एउटै दिन पर्थे; अब पर्दैनन्, र भविष्यमा झन् टाढा हुँदै जानेछन्।",
            en: "That `~24`-day gap is not an error but the accumulated effect of precession. The two once fell on the same day; they no longer do, and they will keep drifting further apart.",
          },
        },
      ],
    },
  ],
};
