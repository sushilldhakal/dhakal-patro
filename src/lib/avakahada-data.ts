/**
 * अवकहडा चक्र — the classical naming / matching grid.
 *
 * 27 नक्षत्र × 4 चरण = 108 पद. Each पद carries a नामाक्षर (naming syllable) and
 * falls in one राशि (every राशि = 9 पद = 2¼ नक्षत्र). From the राशि come the
 * स्वामी, वर्ण and वश्य; from the नक्षत्र come the योनि, गण and नाडी. The वैरि-योनि
 * (enemy) and नाडी follow fixed rules, so they are derived rather than retyped.
 *
 * Values are the standard Avakahada figures (cross-checked against the printed
 * चक्र). अभिजित् is the intercalary 28th — noted separately, as in most patro.
 */

export type Varna = "विप्र" | "क्षत्रिय" | "वैश्य" | "शूद्र";

export interface RashiMeta {
  ne: string;
  lord: string;
  varna: Varna;
  vashya: string;
}

export const RASHI_META: Record<string, RashiMeta> = {
  मेष: { ne: "मेष", lord: "भौम", varna: "क्षत्रिय", vashya: "चतुष्पद" },
  वृष: { ne: "वृष", lord: "शुक्र", varna: "वैश्य", vashya: "चतुष्पद" },
  मिथुन: { ne: "मिथुन", lord: "बुध", varna: "शूद्र", vashya: "द्विपद" },
  कर्क: { ne: "कर्क", lord: "चन्द्र", varna: "विप्र", vashya: "जलचर" },
  सिंह: { ne: "सिंह", lord: "सूर्य", varna: "क्षत्रिय", vashya: "वनचर" },
  कन्या: { ne: "कन्या", lord: "बुध", varna: "वैश्य", vashya: "द्विपद" },
  तुला: { ne: "तुला", lord: "शुक्र", varna: "शूद्र", vashya: "द्विपद" },
  वृश्चिक: { ne: "वृश्चिक", lord: "भौम", varna: "विप्र", vashya: "कीट" },
  धनु: { ne: "धनु", lord: "गुरु", varna: "क्षत्रिय", vashya: "द्विपद" },
  मकर: { ne: "मकर", lord: "शनि", varna: "वैश्य", vashya: "जलचर" },
  कुम्भ: { ne: "कुम्भ", lord: "शनि", varna: "शूद्र", vashya: "द्विपद" },
  मीन: { ne: "मीन", lord: "गुरु", varna: "विप्र", vashya: "जलचर" },
};

export type Gana = "देव" | "नर" | "राक्षस";
export type Nadi = "आध्य" | "मध्य" | "अन्त्य";

/** नाडी repeats in a fixed 6-step zig-zag across the नक्षत्र sequence. */
const NADI_CYCLE: Nadi[] = ["आध्य", "मध्य", "अन्त्य", "अन्त्य", "मध्य", "आध्य"];

/** योनि → वैरि-योनि (natural-enemy) pairs. */
const ENEMY: Record<string, string> = {
  अश्व: "महिष", महिष: "अश्व",
  गज: "सिंह", सिंह: "गज",
  अज: "वानर", वानर: "अज",
  सर्प: "नकुल", नकुल: "सर्प",
  श्वान: "मृग", मृग: "श्वान",
  मार्जार: "मूषक", मूषक: "मार्जार",
  गौ: "व्याघ्र", व्याघ्र: "गौ",
};

interface RawNakshatra {
  ne: string;
  en: string; // key for findNakshatraIcon
  aksharas: [string, string, string, string];
  rashis: [string, string, string, string]; // राशि of each चरण
  yoni: string;
  gana: Gana;
}

const RAW: RawNakshatra[] = [
  { ne: "अश्विनी", en: "ashvini", aksharas: ["चू", "चे", "चो", "ला"], rashis: ["मेष", "मेष", "मेष", "मेष"], yoni: "अश्व", gana: "देव" },
  { ne: "भरणी", en: "bharani", aksharas: ["ली", "लू", "ले", "लो"], rashis: ["मेष", "मेष", "मेष", "मेष"], yoni: "गज", gana: "नर" },
  { ne: "कृत्तिका", en: "krittika", aksharas: ["अ", "ई", "उ", "ए"], rashis: ["मेष", "वृष", "वृष", "वृष"], yoni: "अज", gana: "राक्षस" },
  { ne: "रोहिणी", en: "rohini", aksharas: ["ओ", "वा", "वी", "वू"], rashis: ["वृष", "वृष", "वृष", "वृष"], yoni: "सर्प", gana: "नर" },
  { ne: "मृगशिरा", en: "mrigashira", aksharas: ["वे", "वो", "का", "की"], rashis: ["वृष", "वृष", "मिथुन", "मिथुन"], yoni: "सर्प", gana: "देव" },
  { ne: "आर्द्रा", en: "ardra", aksharas: ["कु", "घ", "ङ", "छ"], rashis: ["मिथुन", "मिथुन", "मिथुन", "मिथुन"], yoni: "श्वान", gana: "नर" },
  { ne: "पुनर्वसु", en: "punarvasu", aksharas: ["के", "को", "हा", "ही"], rashis: ["मिथुन", "मिथुन", "मिथुन", "कर्क"], yoni: "मार्जार", gana: "देव" },
  { ne: "पुष्य", en: "pushya", aksharas: ["हु", "हे", "हो", "डा"], rashis: ["कर्क", "कर्क", "कर्क", "कर्क"], yoni: "अज", gana: "देव" },
  { ne: "आश्रेषा", en: "ashlesha", aksharas: ["डी", "डू", "डे", "डो"], rashis: ["कर्क", "कर्क", "कर्क", "कर्क"], yoni: "मार्जार", gana: "राक्षस" },
  { ne: "मघा", en: "magha", aksharas: ["मा", "मी", "मू", "मे"], rashis: ["सिंह", "सिंह", "सिंह", "सिंह"], yoni: "मूषक", gana: "राक्षस" },
  { ne: "पूर्वाफाल्गुनी", en: "purvaphalguni", aksharas: ["मो", "टा", "टी", "टू"], rashis: ["सिंह", "सिंह", "सिंह", "सिंह"], yoni: "मूषक", gana: "नर" },
  { ne: "उत्तराफाल्गुनी", en: "uttaraphalguni", aksharas: ["टे", "टो", "पा", "पी"], rashis: ["सिंह", "कन्या", "कन्या", "कन्या"], yoni: "गौ", gana: "नर" },
  { ne: "हस्त", en: "hasta", aksharas: ["पू", "ष", "ण", "ठ"], rashis: ["कन्या", "कन्या", "कन्या", "कन्या"], yoni: "महिष", gana: "देव" },
  { ne: "चित्रा", en: "chitra", aksharas: ["पे", "पो", "रा", "री"], rashis: ["कन्या", "कन्या", "तुला", "तुला"], yoni: "व्याघ्र", gana: "राक्षस" },
  { ne: "स्वाती", en: "swati", aksharas: ["रू", "रे", "रो", "ता"], rashis: ["तुला", "तुला", "तुला", "तुला"], yoni: "महिष", gana: "देव" },
  { ne: "विशाखा", en: "vishakha", aksharas: ["ती", "तू", "ते", "तो"], rashis: ["तुला", "तुला", "तुला", "वृश्चिक"], yoni: "व्याघ्र", gana: "राक्षस" },
  { ne: "अनुराधा", en: "anuradha", aksharas: ["ना", "नी", "नू", "ने"], rashis: ["वृश्चिक", "वृश्चिक", "वृश्चिक", "वृश्चिक"], yoni: "मृग", gana: "देव" },
  { ne: "ज्येष्ठा", en: "jyeshtha", aksharas: ["नो", "या", "यी", "यू"], rashis: ["वृश्चिक", "वृश्चिक", "वृश्चिक", "वृश्चिक"], yoni: "मृग", gana: "राक्षस" },
  { ne: "मूल", en: "mula", aksharas: ["ये", "यो", "भा", "भी"], rashis: ["धनु", "धनु", "धनु", "धनु"], yoni: "श्वान", gana: "राक्षस" },
  { ne: "पूर्वाषाढा", en: "purvashada", aksharas: ["भू", "धा", "फा", "ढा"], rashis: ["धनु", "धनु", "धनु", "धनु"], yoni: "वानर", gana: "नर" },
  { ne: "उत्तराषाढा", en: "uttarashada", aksharas: ["भे", "भो", "जा", "जी"], rashis: ["धनु", "मकर", "मकर", "मकर"], yoni: "नकुल", gana: "नर" },
  { ne: "श्रवण", en: "shravana", aksharas: ["खी", "खू", "खे", "खो"], rashis: ["मकर", "मकर", "मकर", "मकर"], yoni: "वानर", gana: "देव" },
  { ne: "धनिष्ठा", en: "dhanishta", aksharas: ["गा", "गी", "गु", "गे"], rashis: ["मकर", "मकर", "कुम्भ", "कुम्भ"], yoni: "सिंह", gana: "राक्षस" },
  { ne: "शतभिषा", en: "shatabhisha", aksharas: ["गो", "सा", "सी", "सू"], rashis: ["कुम्भ", "कुम्भ", "कुम्भ", "कुम्भ"], yoni: "अश्व", gana: "राक्षस" },
  { ne: "पूर्वाभाद्रपदा", en: "purvabhadrapada", aksharas: ["से", "सो", "दा", "दी"], rashis: ["कुम्भ", "कुम्भ", "कुम्भ", "मीन"], yoni: "सिंह", gana: "नर" },
  { ne: "उत्तराभाद्रपदा", en: "uttarabhadrapada", aksharas: ["दू", "थ", "झ", "ञ"], rashis: ["मीन", "मीन", "मीन", "मीन"], yoni: "गौ", gana: "नर" },
  { ne: "रेवती", en: "revati", aksharas: ["दे", "दो", "च", "ची"], rashis: ["मीन", "मीन", "मीन", "मीन"], yoni: "गज", gana: "देव" },
];

export interface NakshatraRow {
  index: number; // 1-based
  ne: string;
  en: string;
  aksharas: string[];
  /** distinct राशि the four पद fall in (1 or 2). */
  rashis: string[];
  charanRashis: string[]; // राशि per चरण (length 4)
  yoni: string;
  vairiYoni: string;
  gana: Gana;
  nadi: Nadi;
}

export const AVAKAHADA: NakshatraRow[] = RAW.map((r, i) => ({
  index: i + 1,
  ne: r.ne,
  en: r.en,
  aksharas: r.aksharas,
  charanRashis: r.rashis,
  rashis: [...new Set(r.rashis)],
  yoni: r.yoni,
  vairiYoni: ENEMY[r.yoni] ?? "—",
  gana: r.gana,
  nadi: NADI_CYCLE[i % 6]!,
}));

/** भौमदोष (मङ्गल दोष) classification of the eight नामाक्षर वर्ग, with शत्रु pair. */
export const MANGLI_VARGAS: { varga: string; shatru: string }[] = [
  { varga: "गरुड", shatru: "सर्प" },
  { varga: "मार्जार", shatru: "मूषक" },
  { varga: "सिंह", shatru: "मृग" },
  { varga: "श्वान", shatru: "मेष" },
];

/** Standard भौमदोष / मङ्गली श्लोक. */
export const BHAUMA_DOSHA_SHLOKAS: string[] = [
  "लग्ने (१) व्यये (१२) च पाताले (४) जामित्रे (७) चाष्टमे (८) कुजे। पत्नीं हन्ति स्वभर्तारं भर्ता भार्यां न संशयः॥",
  "जामित्रे च यदा सौरिर्लग्ने वा हिबुकेऽथ वा। नवमे द्वादशे चैव भौमदोषो न विद्यते॥",
  "चन्द्रभृगू द्वितीये न मङ्गली, यस्य जीवः। न मङ्गली केन्द्रगते च राहौ, र्न मङ्गली मङ्गलराहुयोगे॥",
];

export const ABHIJIT_NOTE =
  "अभिजित् — उत्तराषाढाको चौथो पाउ र श्रवणको सुरुको १५ भागमध्ये १ भाग मिलेर बन्ने अन्तरकालीन (२८औँ) नक्षत्र हो; नामाक्षर: जु, जे, जो, ख।";
