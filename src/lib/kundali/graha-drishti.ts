/** Graha-drishti (aspect) nature and effect blurbs, shown when a planet is
 * clicked on a D1 chart. House targets come from bhava.ts (aspectHousesFor /
 * drishtiTargetHouses) — this file only carries the descriptive content. */

import type { GrahaKey } from "@/lib/graha-details";

export interface GrahaDrishtiInfo {
  isMalefic: boolean;
  /** राहु/केतु — shadow points rather than physical bodies. */
  isChaya: boolean;
  summaryNe: string;
  summaryEn: string;
}

export const GRAHA_DRISHTI: Record<GrahaKey, GrahaDrishtiInfo> = {
  sun: {
    isMalefic: true,
    isChaya: false,
    summaryNe:
      "सूर्यको दृष्टि आत्मबल, अधिकार र नेतृत्वको भाव हो — पर्ने भावका विषयलाई उजिल्याउँछ तर अहंकार वा अधिकारको टकराव पनि ल्याउन सक्छ। शुभ सम्बन्धमा भए पद, प्रतिष्ठा र निर्णय क्षमता बढाउँछ; अशुभ भए पितासँगको सम्बन्ध, स्वास्थ्य वा अधिकारमा तनाव देखिन्छ। सूर्यले सधैं आफ्नो भावबाट सातौं भावमा मात्र दृष्टि दिन्छ — त्यहीँ यसको अधिकार वा तनाव सबैभन्दा प्रत्यक्ष देखिन्छ।",
    summaryEn:
      "Sun's aspect represents will, authority and leadership — it illuminates the affairs of the house it falls on but can also bring ego clashes or friction over control. Well placed, it lifts status, reputation and decisiveness; afflicted, it strains relations with the father, health, or authority. The Sun casts only the universal 7th aspect, where that authority or tension shows most directly.",
  },
  moon: {
    isMalefic: false,
    isChaya: false,
    summaryNe:
      "चन्द्रको दृष्टि मन, भावना र सार्वजनिक धारणासँग जोडिन्छ — पर्ने भावका विषयमा संवेदनशीलता, हेरचाह र उतारचढाव ल्याउँछ। शुभ चन्द्र भए त्यो भावमा लोकप्रियता, पोषण र मानसिक सन्तुष्टि दिन्छ; कमजोर वा पीडित चन्द्र भए चिन्ता, अस्थिरता वा भावनात्मक उतारचढाव देखिन सक्छ। चन्द्रले सधैं सातौं भावमा मात्र दृष्टि दिन्छ, जहाँ यी प्रभाव सबैभन्दा बढी देखिन्छ।",
    summaryEn:
      "Moon's aspect touches the mind, emotions and public perception — it brings sensitivity, nurture and fluctuation to the house it falls on. A well-placed Moon brings popularity, nourishment and contentment there; a weak or afflicted Moon can bring worry, instability or emotional swings. Like the Sun, the Moon casts only the universal 7th aspect, where these effects show strongest.",
  },
  mars: {
    isMalefic: true,
    isChaya: false,
    summaryNe:
      "मंगलको दृष्टि तीव्र, ऊर्जावान र कहिलेकाहीँ आक्रमक मानिन्छ — पर्ने भावका विषयमा साहस, गतिविधि र द्वन्द्व दुवै ल्याउन सक्छ। शुभ सम्बन्धमा भए साहस, भूमि-सम्पत्ति वा प्रतिस्पर्धामा जित दिन्छ; अशुभ भए झगडा, दुर्घटना वा तनाव ल्याउन सक्छ। मंगलको ४, ७, ८ भावमा दृष्टि पर्छ: चौथोमा घर-सम्पत्ति र मनको शान्तिमा तनाव, सातौंमा दाम्पत्य वा साझेदारीमा घर्षण वा जोश, आठौंमा अचानक घटना, दुर्घटना वा गुप्त कुराको जोखिम। मंगलको दृष्टि परेको भाव सक्रिय तर सावधानी माग्ने हुन्छ।",
    summaryEn:
      "Mars's aspect is sharp, energetic and at times aggressive — it can bring courage, drive and conflict to the house it falls on. Favourably placed, it brings courage, property gains or victory in competition; afflicted, it can bring quarrels, accidents or tension. Mars aspects houses 4, 7 and 8: the 4th feels pressure on home/property and peace of mind, the 7th brings friction or passion in marriage and partnerships, the 8th carries risk of sudden events, accidents or hidden matters. Houses under Mars's gaze stay active but need caution.",
  },
  mercury: {
    isMalefic: false,
    isChaya: false,
    summaryNe:
      "बुधको दृष्टि बुद्धि, सञ्चार र व्यापारसँग जोडिन्छ — पर्ने भावका विषयमा विश्लेषण, छलफल र व्यावहारिक सोच ल्याउँछ। शुभ बुध भए त्यो भावमा सिप, व्यापार वा लेखन-सञ्चारमा लाभ दिन्छ; पीडित बुध भए अनिर्णय, अत्यधिक चिन्ता वा गलत सञ्चार देखिन सक्छ। बुधले सधैं सातौं भावमा मात्र दृष्टि दिन्छ।",
    summaryEn:
      "Mercury's aspect relates to intellect, communication and commerce — it brings analysis, discussion and practical thinking to the house it touches. A well-placed Mercury brings gains through skill, trade or writing there; an afflicted Mercury can bring indecision, overthinking or miscommunication. Mercury, too, casts only the universal 7th aspect.",
  },
  jupiter: {
    isMalefic: false,
    isChaya: false,
    summaryNe:
      "बृहस्पतिको दृष्टि सबैभन्दा शुभ मानिन्छ — पर्ने भावका विषयमा ज्ञान, समृद्धि, गुरु-कृपा र नैतिक बल ल्याउँछ र सामान्यतया त्यो भावलाई सुरक्षा र वृद्धि दिन्छ, तर अत्यधिक हुँदा आलस्य वा अतिआत्मविश्वास पनि ल्याउन सक्छ। बृहस्पतिको ५, ७, ९ भावमा दृष्टि पर्छ: पाँचौंमा सन्तान, बुद्धि र शिक्षामा शुभता, सातौंमा दाम्पत्य र साझेदारीमा स्थिरता र सद्भाव, नवौंमा भाग्य, धर्म र गुरुजनको आशीर्वाद। बृहस्पतिको दृष्टि परेको भाव सामान्यतया संरक्षित र फलदायी हुन्छ।",
    summaryEn:
      "Jupiter's aspect is considered the most benevolent — it brings wisdom, prosperity, guidance and moral strength to the house it falls on, generally protecting and growing that house's matters, though in excess it can bring complacency or overconfidence. Jupiter aspects houses 5, 7 and 9: the 5th gains in children, intellect and education, the 7th gains stability and harmony in marriage and partnership, the 9th brings fortune, dharma and the blessing of teachers and elders. A house under Jupiter's gaze is usually protected and fruitful.",
  },
  venus: {
    isMalefic: false,
    isChaya: false,
    summaryNe:
      "शुक्रको दृष्टि सौन्दर्य, प्रेम, कला र सुख-सुविधासँग जोडिन्छ — पर्ने भावका विषयमा आकर्षण, सामाजिकता र भोगविलास ल्याउँछ। शुभ शुक्र भए त्यो भावमा सम्बन्ध, कला वा धन-सुखमा वृद्धि दिन्छ; पीडित शुक्र भए अत्यधिक भोग, ऋण वा सम्बन्धमा असन्तुलन देखिन सक्छ। शुक्रले सधैं सातौं भावमा मात्र दृष्टि दिन्छ, जहाँ यसको प्रभाव सबैभन्दा प्रत्यक्ष देखिन्छ।",
    summaryEn:
      "Venus's aspect relates to beauty, love, art and comfort — it brings charm, sociability and enjoyment to the house it touches. A well-placed Venus brings growth in relationships, art or material comfort there; an afflicted Venus can bring overindulgence, debt or imbalance in relationships. Like the Sun, Moon and Mercury, Venus casts only the universal 7th aspect, where its influence is most direct.",
  },
  saturn: {
    isMalefic: true,
    isChaya: false,
    summaryNe:
      "शनिको दृष्टि ढिलो तर स्थायी मानिन्छ — पर्ने भावका विषयमा अनुशासन, जिम्मेवारी र परिश्रम ल्याउँछ, तर अवरोध, ढिलाइ वा भारीपन पनि दिन सक्छ। शुभ सम्बन्धमा भए दीर्घकालीन सफलता र स्थिरता दिन्छ; अशुभ भए निराशा, कमजोरी वा दीर्घकालीन कष्ट ल्याउन सक्छ। शनिको ३, ७, १० भावमा दृष्टि पर्छ: तेस्रोमा साहस र भाइबहिनीको सम्बन्धमा जिम्मेवारी वा तनाव, सातौंमा दाम्पत्यमा ढिलाइ वा गम्भीरता, दशौंमा पेशा र कर्ममा अनुशासन तथा परिश्रमपछिको सफलता। शनिको दृष्टि परेको भावमा नतिजा ढिलो तर टिकाउ हुन्छ।",
    summaryEn:
      "Saturn's aspect is slow but lasting — it brings discipline, responsibility and hard work to the house it falls on, but can also bring obstacles, delay or heaviness. Favourably placed, it brings long-term success and stability; afflicted, it can bring disappointment, weakness or prolonged hardship. Saturn aspects houses 3, 7 and 10: the 3rd brings responsibility or strain around courage and siblings, the 7th brings delay or seriousness in marriage, the 10th brings discipline in career and success earned through sustained effort. Results under Saturn's gaze come late but tend to endure.",
  },
  rahu: {
    isMalefic: true,
    isChaya: true,
    summaryNe:
      "राहुको दृष्टि रहस्यमय र तीव्र मानिन्छ — यसले पर्ने भावका विषयलाई अचानक बढाउँछ, विदेशी वा अपरम्परागत बाटो दिन्छ र तीव्र महत्त्वाकांक्षा जगाउँछ। शुभ सम्बन्धमा भए त्यस भावमा प्रविधि, राजनीति, विदेश-लाभ, अनुसन्धान वा असाधारण उन्नति दिन्छ; अशुभ भए भ्रम, धोका, अफवाह, चिन्ता वा अस्थिरता ल्याउन सक्छ। राहुको ५, ७, ९ भावमा दृष्टि पर्छ: पाँचौंमा असामान्य बुद्धि तर सन्तान-चिन्ता, सातौंमा सम्बन्धमा तीव्र आकर्षण वा भ्रम, नवौंमा भाग्य र विश्वासमा उतारचढाव। राहुको दृष्टि परेको भाव अत्यधिक, तीव्र र सांसारिक इच्छाले भरिएको हुन्छ — विवेक आवश्यक हुन्छ।",
    summaryEn:
      "Rahu's aspect is considered mysterious and intense — it suddenly amplifies the affairs of the house it falls on, opens foreign or unconventional paths, and stirs fierce ambition. Well placed, it brings gains through technology, politics, foreign connections, research or an extraordinary rise; afflicted, it can bring illusion, deception, rumour, anxiety or instability. Rahu aspects houses 5, 7 and 9: the 5th brings unusual intellect but worry over children, the 7th brings intense attraction or confusion in relationships, the 9th brings swings in fortune and belief. A house under Rahu's gaze fills with excess, intensity and worldly craving — discretion is needed.",
  },
  ketu: {
    isMalefic: true,
    isChaya: true,
    summaryNe:
      "केतुको दृष्टि रहस्यमय, आत्मिक र वैराग्यको मानिन्छ — पर्ने भावका विषयबाट मोहभंग वा अलगाव ल्याउन सक्छ, तर गहिरो अनुभूति र मोक्षमार्गी सोच पनि दिन्छ। शुभ सम्बन्धमा भए त्यस भावमा गुह्य ज्ञान, अनुसन्धान वा आत्मिक उन्नति दिन्छ; अशुभ भए हानि, अलगाव, भ्रम वा अनिश्चितता ल्याउन सक्छ। केतुको ५, ७, ९ भावमा दृष्टि पर्छ: पाँचौंमा असामान्य कल्पनाशक्ति तर सन्तान वा शिक्षामा अनिश्चितता, सातौंमा सम्बन्धमा अलगाव वा असामान्य आकर्षण, नवौंमा भाग्य र विश्वासमा उतारचढाव वा आत्मिक झुकाव। केतुको दृष्टि परेको भाव अस्पष्ट तर गहिरो अर्थपूर्ण हुन्छ — धैर्य र विवेक आवश्यक हुन्छ।",
    summaryEn:
      "Ketu's aspect is considered mysterious, spiritual and detached — it can bring disillusionment or separation from the affairs of the house it falls on, but also deep insight and a pull toward liberation. Well placed, it brings occult knowledge, research ability or spiritual growth to that house; afflicted, it can bring loss, separation, confusion or uncertainty. Ketu aspects houses 5, 7 and 9: the 5th brings unusual imagination but uncertainty around children or education, the 7th brings detachment or an unconventional pull in relationships, the 9th brings swings in fortune and belief or a spiritual leaning. A house under Ketu's gaze feels unclear yet deeply meaningful — patience and discretion are needed.",
  },
};

/** "क्रूर (छाया) दृष्टि" / "Malefic (Shadow) Aspect" badge text. */
export function drishtiBadgeText(key: GrahaKey, lang: "ne" | "en"): string {
  const info = GRAHA_DRISHTI[key];
  if (lang === "en") {
    const nature = info.isMalefic ? "Malefic" : "Benefic";
    return info.isChaya ? `${nature} (Shadow) Aspect` : `${nature} Aspect`;
  }
  const nature = info.isMalefic ? "क्रूर" : "सौम्य";
  return info.isChaya ? `${nature} (छाया) दृष्टि` : `${nature} दृष्टि`;
}
