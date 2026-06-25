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
  colorNe: string;
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
  /** Donation (daan) items in Nepali. */
  daan: string[];
  adhidevataNe: string;
  /** One-line note on the affliction this śānti addresses. */
  remedyNe: string;
}

export const NAVAGRAHA_SHANTI: GrahaShanti[] = [
  {
    key: "sun",
    nameNe: "सूर्य",
    nameEn: "Surya (Sun)",
    symbol: "☉",
    vaaraNe: "आइतबार",
    colorNe: "रातो",
    colorHex: "#e23b3b",
    beejMantra: "ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः",
    japa: 7000,
    samidhaNe: "आक (मदार)",
    samidhaEn: "Arka / Calotropis",
    gemNe: "माणिक्य",
    gemEn: "Ruby",
    metalNe: "तामा",
    daan: ["गहुँ", "गुड", "तामा", "रातो कपडा", "माणिक्य"],
    adhidevataNe: "शिव / अग्नि",
    remedyNe: "आत्मबल, पिता, स्वास्थ्य र पदप्रतिष्ठाको पीडा शान्त गर्न।",
  },
  {
    key: "moon",
    nameNe: "चन्द्र",
    nameEn: "Chandra (Moon)",
    symbol: "☽",
    vaaraNe: "सोमबार",
    colorNe: "सेतो",
    colorHex: "#cfd6e6",
    beejMantra: "ॐ श्रां श्रीं श्रौं सः चन्द्राय नमः",
    japa: 11000,
    samidhaNe: "पलाश (ढाक)",
    samidhaEn: "Palasha / Butea",
    gemNe: "मोती",
    gemEn: "Pearl",
    metalNe: "चाँदी",
    daan: ["चामल", "सेतो कपडा", "चाँदी", "मोती", "दही", "चिनी"],
    adhidevataNe: "पार्वती / जल",
    remedyNe: "मन, माता, शान्ति र भावनात्मक स्थिरताको लागि।",
  },
  {
    key: "mars",
    nameNe: "मंगल",
    nameEn: "Mangal (Mars)",
    symbol: "♂",
    vaaraNe: "मंगलबार",
    colorNe: "रातो",
    colorHex: "#d4452f",
    beejMantra: "ॐ क्रां क्रीं क्रौं सः भौमाय नमः",
    japa: 10000,
    samidhaNe: "खैर",
    samidhaEn: "Khadira / Acacia",
    gemNe: "मूँगा",
    gemEn: "Red Coral",
    metalNe: "तामा",
    daan: ["मसुरको दाल", "रातो कपडा", "तामा", "गुड", "मूँगा"],
    adhidevataNe: "स्कन्द (कार्तिकेय) / पृथ्वी",
    remedyNe: "रक्त, ऋण, भाइ, साहस र मंगल दोष शान्त गर्न।",
  },
  {
    key: "mercury",
    nameNe: "बुध",
    nameEn: "Budha (Mercury)",
    symbol: "☿",
    vaaraNe: "बुधबार",
    colorNe: "हरियो",
    colorHex: "#2fae6a",
    beejMantra: "ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः",
    japa: 9000,
    samidhaNe: "अपामार्ग (दतिवन)",
    samidhaEn: "Apamarga / Achyranthes",
    gemNe: "पन्ना",
    gemEn: "Emerald",
    metalNe: "काँसा",
    daan: ["मूगको दाल", "हरियो कपडा", "पन्ना", "हात्तीदाँत", "गुड"],
    adhidevataNe: "विष्णु",
    remedyNe: "बुद्धि, वाणी, व्यापार र शिक्षा सुधारका लागि।",
  },
  {
    key: "jupiter",
    nameNe: "गुरु (बृहस्पति)",
    nameEn: "Guru (Jupiter)",
    symbol: "♃",
    vaaraNe: "बिहिबार",
    colorNe: "पहेँलो",
    colorHex: "#e0a92e",
    beejMantra: "ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः",
    japa: 19000,
    samidhaNe: "पीपल",
    samidhaEn: "Pippala / Ashwattha",
    gemNe: "पुखराज",
    gemEn: "Yellow Sapphire",
    metalNe: "सुन",
    daan: ["चना दाल", "बेसार", "पहेँलो कपडा", "सुन", "पुखराज", "पुस्तक"],
    adhidevataNe: "ब्रह्मा / इन्द्र",
    remedyNe: "ज्ञान, सन्तान, विवाह र धन-धर्मको शुभताका लागि।",
  },
  {
    key: "venus",
    nameNe: "शुक्र",
    nameEn: "Shukra (Venus)",
    symbol: "♀",
    vaaraNe: "शुक्रबार",
    colorNe: "सेतो / चहकिलो",
    colorHex: "#d9c7e8",
    beejMantra: "ॐ द्रां द्रीं द्रौं सः शुक्राय नमः",
    japa: 16000,
    samidhaNe: "गूलर (डुम्री)",
    samidhaEn: "Audumbara / Cluster Fig",
    gemNe: "हीरा",
    gemEn: "Diamond",
    metalNe: "चाँदी",
    daan: ["चामल", "सेतो/रेशमी कपडा", "चाँदी", "हीरा", "घ्यू", "सुगन्ध"],
    adhidevataNe: "इन्द्राणी / लक्ष्मी",
    remedyNe: "प्रेम, वैवाहिक सुख, सौन्दर्य र भोग-ऐश्वर्यका लागि।",
  },
  {
    key: "saturn",
    nameNe: "शनि",
    nameEn: "Shani (Saturn)",
    symbol: "♄",
    vaaraNe: "शनिबार",
    colorNe: "कालो / गाढा नीलो",
    colorHex: "#3a4a6b",
    beejMantra: "ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः",
    japa: 23000,
    samidhaNe: "शमी (सजिवन)",
    samidhaEn: "Shami / Prosopis",
    gemNe: "नीलम",
    gemEn: "Blue Sapphire",
    metalNe: "फलाम",
    daan: ["कालो तिल", "कालो कपडा", "फलाम", "नीलम", "तोरीको तेल", "कालो दाल (उडद)", "जुत्ता"],
    adhidevataNe: "यम / प्रजापति",
    remedyNe: "साढेसाती, ढैया, बाधा, रोग र कर्मफल शान्त गर्न।",
  },
  {
    key: "rahu",
    nameNe: "राहु",
    nameEn: "Rahu (North Node)",
    symbol: "☊",
    vaaraNe: "शनिबार",
    colorNe: "धुम्रो / नीलो",
    colorHex: "#6b6f7a",
    beejMantra: "ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः",
    japa: 18000,
    samidhaNe: "दुबो",
    samidhaEn: "Durva grass",
    gemNe: "गोमेद",
    gemEn: "Hessonite",
    metalNe: "सिसा (अष्टधातु)",
    daan: ["कालो तिल", "नीलो/मिश्रित कपडा", "गोमेद", "तोरी", "कम्बल", "नरिवल"],
    adhidevataNe: "दुर्गा / सर्प",
    remedyNe: "भ्रम, अकस्मात बाधा, मानसिक तनाव र राहु दोष शान्त गर्न।",
  },
  {
    key: "ketu",
    nameNe: "केतु",
    nameEn: "Ketu (South Node)",
    symbol: "☋",
    vaaraNe: "मंगलबार",
    colorNe: "धुम्रो / खैरो",
    colorHex: "#8a7a5c",
    beejMantra: "ॐ स्रां स्रीं स्रौं सः केतवे नमः",
    japa: 17000,
    samidhaNe: "कुश",
    samidhaEn: "Kusha grass",
    gemNe: "लहसुनिया",
    gemEn: "Cat's Eye",
    metalNe: "अष्टधातु",
    daan: ["तिल", "मिश्रित कपडा", "लहसुनिया", "कम्बल", "बोका (बाख्रा)"],
    adhidevataNe: "चित्रगुप्त / गणेश",
    remedyNe: "मोक्ष-बाधा, रहस्यमय रोग र केतु दोष शान्त गर्न।",
  },
];

export function getGrahaShanti(key: string): GrahaShanti | undefined {
  return NAVAGRAHA_SHANTI.find((g) => g.key === key);
}
