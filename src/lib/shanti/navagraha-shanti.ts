/**
 * Navagraha Śānti reference table (Module 1 — Remedial Engine).
 *
 * Classical Vedic remedial data for each of the nine grahas: bīja mantra,
 * japa-saṅkhyā, samidhā (homa wood), ratna (gem), metal, daan (donation)
 * items, presiding deity and the weekday for the remedy. These are the
 * standard śānti prescriptions; refine the figures against the Surya
 * Panchanga 2083 (pp. 58–59) source if any differ.
 */

export interface GrahaShanti {
  key: string;
  nameNe: string;
  nameEn: string;
  symbol: string;
  /** Weekday best suited for the graha's remedy. */
  vaaraNe: string;
  vaaraEn: string;
  colorNe: string;
  colorEn: string;
  /** Representative swatch colour (works on light + dark). */
  colorHex: string;
  beejMantra: string;
  /** Traditional japa count for the bīja mantra. */
  japa: number;
  samidhaNe: string;
  samidhaEn: string;
  gemNe: string;
  gemEn: string;
  metalNe: string;
  metalEn: string;
  /** Donation (daan) items in Nepali. */
  daan: string[];
  daanEn: string[];
  adhidevataNe: string;
  adhidevataEn: string;
  /** One-line note on the affliction this śānti addresses. */
  remedyNe: string;
  remedyEn: string;
}

export const NAVAGRAHA_SHANTI: GrahaShanti[] = [
  {
    key: "sun",
    nameNe: "सूर्य",
    nameEn: "Surya (Sun)",
    symbol: "☉",
    vaaraNe: "आइतबार",
    vaaraEn: "Sunday",
    colorNe: "रातो",
    colorEn: "Red",
    colorHex: "#e23b3b",
    beejMantra: "ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः",
    japa: 7000,
    samidhaNe: "आक (मदार)",
    samidhaEn: "Arka / Calotropis",
    gemNe: "माणिक्य",
    gemEn: "Ruby",
    metalNe: "तामा",
    metalEn: "Copper",
    daan: ["गहुँ", "गुड", "तामा", "रातो कपडा", "माणिक्य"],
    daanEn: ["Wheat", "Jaggery", "Copper", "Red cloth", "Ruby"],
    adhidevataNe: "शिव / अग्नि",
    adhidevataEn: "Shiva / Agni",
    remedyNe: "आत्मबल, पिता, स्वास्थ्य र पदप्रतिष्ठाको पीडा शान्त गर्न।",
    remedyEn: "To ease afflictions of self-confidence, father, health and status.",
  },
  {
    key: "moon",
    nameNe: "चन्द्र",
    nameEn: "Chandra (Moon)",
    symbol: "☽",
    vaaraNe: "सोमबार",
    vaaraEn: "Monday",
    colorNe: "सेतो",
    colorEn: "White",
    colorHex: "#cfd6e6",
    beejMantra: "ॐ श्रां श्रीं श्रौं सः चन्द्राय नमः",
    japa: 11000,
    samidhaNe: "पलाश (ढाक)",
    samidhaEn: "Palasha / Butea",
    gemNe: "मोती",
    gemEn: "Pearl",
    metalNe: "चाँदी",
    metalEn: "Silver",
    daan: ["चामल", "सेतो कपडा", "चाँदी", "मोती", "दही", "चिनी"],
    daanEn: ["Rice", "White cloth", "Silver", "Pearl", "Curd", "Sugar"],
    adhidevataNe: "पार्वती / जल",
    adhidevataEn: "Parvati / Jala (Water)",
    remedyNe: "मन, माता, शान्ति र भावनात्मक स्थिरताको लागि।",
    remedyEn: "For the mind, mother, peace and emotional stability.",
  },
  {
    key: "mars",
    nameNe: "मंगल",
    nameEn: "Mangal (Mars)",
    symbol: "♂",
    vaaraNe: "मंगलबार",
    vaaraEn: "Tuesday",
    colorNe: "रातो",
    colorEn: "Red",
    colorHex: "#d4452f",
    beejMantra: "ॐ क्रां क्रीं क्रौं सः भौमाय नमः",
    japa: 10000,
    samidhaNe: "खैर",
    samidhaEn: "Khadira / Acacia",
    gemNe: "मूँगा",
    gemEn: "Red Coral",
    metalNe: "तामा",
    metalEn: "Copper",
    daan: ["मसुरको दाल", "रातो कपडा", "तामा", "गुड", "मूँगा"],
    daanEn: ["Red lentils", "Red cloth", "Copper", "Jaggery", "Red coral"],
    adhidevataNe: "स्कन्द (कार्तिकेय) / पृथ्वी",
    adhidevataEn: "Skanda (Kartikeya) / Prithvi (Earth)",
    remedyNe: "रक्त, ऋण, भाइ, साहस र मंगल दोष शान्त गर्न।",
    remedyEn: "To ease blood, debt, siblings, courage and Mangal dosha.",
  },
  {
    key: "mercury",
    nameNe: "बुध",
    nameEn: "Budha (Mercury)",
    symbol: "☿",
    vaaraNe: "बुधबार",
    vaaraEn: "Wednesday",
    colorNe: "हरियो",
    colorEn: "Green",
    colorHex: "#2fae6a",
    beejMantra: "ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः",
    japa: 9000,
    samidhaNe: "अपामार्ग (दतिवन)",
    samidhaEn: "Apamarga / Achyranthes",
    gemNe: "पन्ना",
    gemEn: "Emerald",
    metalNe: "काँसा",
    metalEn: "Bronze",
    daan: ["मूगको दाल", "हरियो कपडा", "पन्ना", "हात्तीदाँत", "गुड"],
    daanEn: ["Green gram", "Green cloth", "Emerald", "Ivory", "Jaggery"],
    adhidevataNe: "विष्णु",
    adhidevataEn: "Vishnu",
    remedyNe: "बुद्धि, वाणी, व्यापार र शिक्षा सुधारका लागि।",
    remedyEn: "To improve intellect, speech, business and education.",
  },
  {
    key: "jupiter",
    nameNe: "गुरु (बृहस्पति)",
    nameEn: "Guru (Jupiter)",
    symbol: "♃",
    vaaraNe: "बिहिबार",
    vaaraEn: "Thursday",
    colorNe: "पहेँलो",
    colorEn: "Yellow",
    colorHex: "#e0a92e",
    beejMantra: "ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः",
    japa: 19000,
    samidhaNe: "पीपल",
    samidhaEn: "Pippala / Ashwattha",
    gemNe: "पुखराज",
    gemEn: "Yellow Sapphire",
    metalNe: "सुन",
    metalEn: "Gold",
    daan: ["चना दाल", "बेसार", "पहेँलो कपडा", "सुन", "पुखराज", "पुस्तक"],
    daanEn: ["Chickpea lentils", "Turmeric", "Yellow cloth", "Gold", "Yellow sapphire", "Books"],
    adhidevataNe: "ब्रह्मा / इन्द्र",
    adhidevataEn: "Brahma / Indra",
    remedyNe: "ज्ञान, सन्तान, विवाह र धन-धर्मको शुभताका लागि।",
    remedyEn: "For knowledge, children, marriage and prosperity of wealth & dharma.",
  },
  {
    key: "venus",
    nameNe: "शुक्र",
    nameEn: "Shukra (Venus)",
    symbol: "♀",
    vaaraNe: "शुक्रबार",
    vaaraEn: "Friday",
    colorNe: "सेतो / चहकिलो",
    colorEn: "White / bright",
    colorHex: "#d9c7e8",
    beejMantra: "ॐ द्रां द्रीं द्रौं सः शुक्राय नमः",
    japa: 16000,
    samidhaNe: "गूलर (डुम्री)",
    samidhaEn: "Audumbara / Cluster Fig",
    gemNe: "हीरा",
    gemEn: "Diamond",
    metalNe: "चाँदी",
    metalEn: "Silver",
    daan: ["चामल", "सेतो/रेशमी कपडा", "चाँदी", "हीरा", "घ्यू", "सुगन्ध"],
    daanEn: ["Rice", "White/silk cloth", "Silver", "Diamond", "Ghee", "Perfume"],
    adhidevataNe: "इन्द्राणी / लक्ष्मी",
    adhidevataEn: "Indrani / Lakshmi",
    remedyNe: "प्रेम, वैवाहिक सुख, सौन्दर्य र भोग-ऐश्वर्यका लागि।",
    remedyEn: "For love, marital happiness, beauty and comforts & luxury.",
  },
  {
    key: "saturn",
    nameNe: "शनि",
    nameEn: "Shani (Saturn)",
    symbol: "♄",
    vaaraNe: "शनिबार",
    vaaraEn: "Saturday",
    colorNe: "कालो / गाढा नीलो",
    colorEn: "Black / dark blue",
    colorHex: "#3a4a6b",
    beejMantra: "ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः",
    japa: 23000,
    samidhaNe: "शमी (सजिवन)",
    samidhaEn: "Shami / Prosopis",
    gemNe: "नीलम",
    gemEn: "Blue Sapphire",
    metalNe: "फलाम",
    metalEn: "Iron",
    daan: ["कालो तिल", "कालो कपडा", "फलाम", "नीलम", "तोरीको तेल", "कालो दाल (उडद)", "जुत्ता"],
    daanEn: ["Black sesame", "Black cloth", "Iron", "Blue sapphire", "Mustard oil", "Black gram", "Shoes"],
    adhidevataNe: "यम / प्रजापति",
    adhidevataEn: "Yama / Prajapati",
    remedyNe: "साढेसाती, ढैया, बाधा, रोग र कर्मफल शान्त गर्न।",
    remedyEn: "To ease Sade-Sati, Dhaiya, obstacles, illness and karmic results.",
  },
  {
    key: "rahu",
    nameNe: "राहु",
    nameEn: "Rahu (North Node)",
    symbol: "☊",
    vaaraNe: "शनिबार",
    vaaraEn: "Saturday",
    colorNe: "धुम्रो / नीलो",
    colorEn: "Smoky / blue",
    colorHex: "#6b6f7a",
    beejMantra: "ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः",
    japa: 18000,
    samidhaNe: "दुबो",
    samidhaEn: "Durva grass",
    gemNe: "गोमेद",
    gemEn: "Hessonite",
    metalNe: "सिसा (अष्टधातु)",
    metalEn: "Lead (Ashtadhatu)",
    daan: ["कालो तिल", "नीलो/मिश्रित कपडा", "गोमेद", "तोरी", "कम्बल", "नरिवल"],
    daanEn: ["Black sesame", "Blue/mixed cloth", "Hessonite", "Mustard", "Blanket", "Coconut"],
    adhidevataNe: "दुर्गा / सर्प",
    adhidevataEn: "Durga / Sarpa (Serpent)",
    remedyNe: "भ्रम, अकस्मात बाधा, मानसिक तनाव र राहु दोष शान्त गर्न।",
    remedyEn: "To ease confusion, sudden obstacles, mental stress and Rahu dosha.",
  },
  {
    key: "ketu",
    nameNe: "केतु",
    nameEn: "Ketu (South Node)",
    symbol: "☋",
    vaaraNe: "मंगलबार",
    vaaraEn: "Tuesday",
    colorNe: "धुम्रो / खैरो",
    colorEn: "Smoky / brown",
    colorHex: "#8a7a5c",
    beejMantra: "ॐ स्रां स्रीं स्रौं सः केतवे नमः",
    japa: 17000,
    samidhaNe: "कुश",
    samidhaEn: "Kusha grass",
    gemNe: "लहसुनिया",
    gemEn: "Cat's Eye",
    metalNe: "अष्टधातु",
    metalEn: "Ashtadhatu (eight-metal alloy)",
    daan: ["तिल", "मिश्रित कपडा", "लहसुनिया", "कम्बल", "बोका (बाख्रा)"],
    daanEn: ["Sesame", "Mixed cloth", "Cat's Eye", "Blanket", "Goat"],
    adhidevataNe: "चित्रगुप्त / गणेश",
    adhidevataEn: "Chitragupta / Ganesha",
    remedyNe: "मोक्ष-बाधा, रहस्यमय रोग र केतु दोष शान्त गर्न।",
    remedyEn: "To ease obstacles to moksha, mysterious illness and Ketu dosha.",
  },
];

export function getGrahaShanti(key: string): GrahaShanti | undefined {
  return NAVAGRAHA_SHANTI.find((g) => g.key === key);
}
