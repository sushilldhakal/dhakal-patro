/**
 * Per-ceremony sāit explanation — the "how these dates are computed" paragraph
 * and the classical rule list — shown on every /sait page and the vivāha page.
 *
 * This lives in the frontend on purpose: the text must ALWAYS render, with no
 * dependency on a backend deploy. These dates are our own system's ephemeris
 * computation — NOT the Nepal Panchanga Nirnayak Samiti list or any external
 * listing. Keep the wording in sync with the engine (patro).
 */
import type { SaitCategoryId } from "@/lib/sait-data";

export interface BilingualText {
  ne: string;
  en: string;
}

export interface SaitContent {
  description: BilingualText;
  /** The "text line" explaining how the dates are calculated (intro paragraph). */
  method: BilingualText;
  /** The classical rules the engine applies for this ceremony. */
  rules: BilingualText[];
  requiresBirthDate?: boolean;
}

const MUHURTA_INTRO: BilingualText = {
  ne: "यी मितिहरू हाम्रो आफ्नै प्रणालीले स्विस एफेमेरिसबाट गणना गर्छ — कुनै बाह्य सूची पछ्याइएको छैन। प्रत्येक दिनको सूर्योदयदेखि अर्को सूर्योदयसम्म हरेक अन्तरालमा तिथि, नक्षत्र, योग, करण, वार र लग्न निकालेर तलका शास्त्रीय नियमहरू लगाइन्छ। कुनै एक शुद्ध लग्न विण्डो भेटिए मात्र दिन प्रकाशित हुन्छ।",
  en: "These dates are computed by our own system from the Swiss Ephemeris — no external list is followed. For each day the engine derives tithi, nakṣatra, yoga, karaṇa, vāra and lagna at every interval from sunrise to the next sunrise, then applies the classical rules below. A day is published only if at least one clean lagna window survives.",
};

const DAYTIME_INTRO: BilingualText = {
  ne: "यी मितिहरू हाम्रो आफ्नै प्रणालीले स्विस एफेमेरिसबाट गणना गर्छ — कुनै बाह्य सूची पछ्याइएको छैन। प्रत्येक दिनको सूर्योदयदेखि सूर्यास्तसम्म हरेक अन्तरालमा तिथि, नक्षत्र, योग, करण, वार र लग्न निकालेर तलका नियमहरू लगाइन्छ। दिनको शुद्ध मुहूर्त भेटिए मात्र दिन प्रकाशित हुन्छ।",
  en: "These dates are computed by our own system from the Swiss Ephemeris — no external list is followed. For each day the engine derives tithi, nakṣatra, yoga, karaṇa, vāra and lagna at every interval from sunrise to sunset, then applies the rules below. A day is published only if a clean daytime muhūrta survives.",
};

export const SAIT_RULES_CONTENT: Record<SaitCategoryId, SaitContent> = {
  vivah: {
    description: {
      ne: "विवाह संस्कारका लागि शुभ साइत — शुभ तिथि, नक्षत्र र लग्न विचार गरी गणना गरिएका शुद्ध विवाह मुहूर्तहरू।",
      en: "Auspicious dates for the marriage ceremony — clean vivāha muhūrtas computed on favourable tithi, nakṣatra and lagna.",
    },
    method: MUHURTA_INTRO,
    rules: [
      { ne: "महिना — विवाहका लागि शास्त्रसम्मत चन्द्रमास मात्र (मार्गशीर्ष, माघ, फाल्गुन, वैशाख, ज्येष्ठ, आषाढ); अधिकमास र चातुर्मास वर्जित।", en: "Month — only the śāstra vivāha lunar months (Mārgaśīrṣa, Māgha, Phālguna, Vaiśākha, Jyeṣṭha, Āṣāḍha); Adhik-māsa & Chaturmāsa barred." },
      { ne: "सौर मास — सूर्य मेष, वृष, मिथुन, वृश्चिक, मकर वा कुम्भ राशिमा हुनुपर्छ (शास्त्रले पहिले सौर मास हेर्छ)।", en: "Solar month — the Sun must be in Meṣa, Vṛṣabha, Mithuna, Vṛśchika, Makara or Kumbha (the śāstra checks the Sun-sign first)." },
      { ne: "तिथि — शुभ तिथि मात्र (२,३,५,७,१०,११,१३); रिक्ता (४,९,१४), अष्टमी, षष्ठी, अमावस्या, पूर्णिमा वर्जित।", en: "Tithi — only śubha tithis (2,3,5,7,10,11,13); rikta (4,9,14), Aṣṭamī, Ṣaṣṭhī, Amāvasyā, Pūrṇimā out." },
      { ne: "नक्षत्र — शास्त्रीय विवाह नक्षत्र मात्र: रोहिणी, मृगशिरा, मघा, उत्तराफाल्गुनी, हस्त, स्वाती, अनुराधा, मूल, उत्तराषाढा, उत्तरभाद्रपदा, रेवती।", en: "Nakṣatra — the classical 11: Rohiṇī, Mṛgaśira, Maghā, U.Phalgunī, Hasta, Svātī, Anurādhā, Mūla, U.Aṣāḍhā, U.Bhādrapada, Revatī." },
      { ne: "योग — नवै अशुभ योग (विष्कुम्भ, अतिगण्ड, शूल, गण्ड, व्याघात, वज्र, व्यतीपात, परिघ, वैधृति) वर्जित।", en: "Yoga — all nine aśubha yogas (Viṣkambha, Atigaṇḍa, Śūla, Gaṇḍa, Vyāghāta, Vajra, Vyatīpāta, Parigha, Vaidhṛti) barred." },
      { ne: "करण — विष्टि (भद्रा) र चार स्थिर करण (शकुनि, चतुष्पाद, नाग, किंस्तुघ्न) वर्जित।", en: "Karaṇa — Viṣṭi (Bhadrā) and the four fixed karaṇas (Śakuni, Catuṣpāda, Nāga, Kiṃstughna) barred." },
      { ne: "वार — मंगलबार र शनिबार वर्जित।", en: "Vāra — Tuesday and Saturday barred." },
      { ne: "दोष — दग्धा, शून्य, भद्रा र मलेफिक लत्ता (सूर्य/मंगल/शनि/राहु/केतु) परेको दिन पूरै त्याज्य; गोधूलिले पनि छुट दिँदैन।", en: "Doṣa — Dagdha, Śūnya, Bhadrā, and malefic Latta (Sun/Mars/Saturn/Rāhu/Ketu) scrub the whole day; no Godhūli rescue." },
      { ne: "ग्रह — गुरु र शुक्र अस्त हुनुहुँदैन, न त बाल्य/वृद्ध (उदय वा अस्तको सन्निकट कमजोर); संक्रान्तिको सन्निकट समय र ग्रहण ±३ दिन वर्जित।", en: "Graha — Jupiter & Venus must be udaya — neither combust nor bāla/vṛddha (weak just after rising or before setting); Sankrānti buffers and eclipse ±3 days excluded." },
      { ne: "सिंहस्थ गुरु — बृहस्पति सिंह राशिमा रहेको सम्पूर्ण अवधि विवाह वर्जित।", en: "Simhastha Guru — marriage is barred for the whole transit of Jupiter through Siṃha (Leo)." },
      { ne: "क्षय पक्ष — एउटै पक्षमा दुई तिथि क्षय भई १३ तिथिको पक्ष बन्यो भने (अतिनिन्द्य) पूरै अवधि वर्जित; यसलाई अरू कुनै शुभ योगले पनि काट्दैन।", en: "Kṣaya Pakṣa — if a fortnight loses two tithis and becomes a 13-tithi pakṣa (atinindya), the whole period is barred; no other favourable factor overrides it." },
    ],
  },
  bratabandha: {
    description: {
      ne: "उपनयन (ब्रतबन्ध) संस्कारका लागि शुभ मिति — बालकको विद्यारम्भ र यज्ञोपवीत धारणका शुभ दिन।",
      en: "Auspicious dates for the Upanayana (Bratabandha) sacred-thread rite marking the start of a boy's formal study.",
    },
    method: DAYTIME_INTRO,
    rules: [
      { ne: "काल — गुरु उत्तरायणमा हुनुपर्छ (सूर्य मकरदेखि मिथुनसम्म: माघ–असार); चातुर्मास र अधिकमास वर्जित।", en: "Season — Sun in an Uttarāyaṇa rāśi (Makara→Mithuna: Māgha–Āṣāḍha); Chaturmāsa & Adhik-māsa barred." },
      { ne: "तिथि — शुक्ल २,३,५,१०,११,१२ वा कृष्ण २,३,५; रिक्ता र अमावस्या वर्जित।", en: "Tithi — śukla 2,3,5,10,11,12 or kṛṣṇa 2,3,5; rikta & Amāvasyā out." },
      { ne: "नक्षत्र — भरणी, कृत्तिका, मघा, विशाखा र ज्येष्ठा बाहेक सबै शुभ नक्षत्र।", en: "Nakṣatra — all except Bharaṇī, Kṛttikā, Maghā, Viśākhā, Jyeṣṭhā." },
      { ne: "वार — मंगलबार र शनिबार वर्जित; दिनको समय (सूर्योदय–सूर्यास्त) मात्र।", en: "Vāra — Tuesday & Saturday barred; daytime only (sunrise→sunset)." },
      { ne: "ग्रह — गुरु र शुक्र अस्त हुनुहुँदैन।", en: "Graha — Jupiter & Venus must be udaya (not combust)." },
      { ne: "योग/करण — व्यतीपात र वैधृति योग तथा विष्टि (भद्रा) करण वर्जित।", en: "Yoga/Karaṇa — Vyatīpāta & Vaidhṛti yoga and Viṣṭi (Bhadrā) karaṇa barred." },
      { ne: "संक्रान्ति र ग्रहण (±३ दिन) वर्जित; दुर्मुहूर्त परेको अवधि मात्र छाडिन्छ (पूरै दिन होइन)।", en: "Sankrānti and eclipse (±3 days) barred; Dur-muhūrta skips only the affected period (not the whole day)." },
      { ne: "दोष — दग्धा, शून्य र मंगल/राहुको लत्ता परेको दिन वर्जित।", en: "Doṣa — Dagdha, Śūnya, and Mars/Rāhu Latta days excluded." },
    ],
  },
  "griha-aarambha": {
    description: {
      ne: "घर निर्माण आरम्भ (जग हाल्ने) का लागि शुभ मिति — भवन निर्माणको मंगलमय शुरुवात।",
      en: "Auspicious dates to begin house construction (laying the foundation).",
    },
    method: DAYTIME_INTRO,
    rules: [
      { ne: "समय — शिलान्यास (जग हाल्ने) दिनको समयमा मात्र (सूर्योदय–सूर्यास्त)।", en: "Time — foundation-laying is a daytime rite (sunrise→sunset only)." },
      { ne: "सूर्य राशि — मेष, कर्कट, तुला, वृश्चिक, धनु, मकर, कुम्भ (वास्तु अनुकूल); अधिकमास वर्जित।", en: "Sun-sign — Meṣa, Karka, Tulā, Vṛśchika, Dhanu, Makara, Kumbha (Vāstu-facing); Adhik-māsa barred." },
      { ne: "तिथि — २,३,५,७,१०,११,१२ मात्र; प्रतिपदा, त्रयोदशी, रिक्ता (४,९,१४) र अमावस्या वर्जित।", en: "Tithi — only 2,3,5,7,10,11,12; Pratipadā, Trayodaśī, rikta (4,9,14) and Amāvasyā out." },
      { ne: "नक्षत्र — शास्त्रसम्मत निर्माण नक्षत्रहरूको निश्चित सूची: रोहिणी, मृगशिरा, पुनर्वसु, उत्तराफाल्गुनी, हस्त, चित्रा, स्वाती, अनुराधा, उत्तराषाढा, श्रवण, धनिष्ठा, उत्तरभाद्रपदा, रेवती।", en: "Nakṣatra — a fixed list of the śāstra-sanctioned construction nakṣatras: Rohiṇī, Mṛgaśira, Punarvasu, U.Phalgunī, Hasta, Chitrā, Svātī, Anurādhā, U.Aṣāḍhā, Śravaṇa, Dhaniṣṭhā, U.Bhādrapada, Revatī." },
      { ne: "योग/करण — व्यतीपात र वैधृति योग तथा विष्टि (भद्रा) करण वर्जित।", en: "Yoga/Karaṇa — Vyatīpāta & Vaidhṛti yoga and Viṣṭi (Bhadrā) karaṇa barred." },
      { ne: "लग्न — स्थिर (वृष, सिंह, वृश्चिक, कुम्भ) प्राथमिकता, द्विस्वभाव स्वीकार्य; चर लग्न वर्जित — भवन स्थिर रहोस्।", en: "Lagna — fixed (Vṛṣa, Siṃha, Vṛśchika, Kumbha) preferred, dual accepted; movable lagnas barred — so the building is stable." },
      { ne: "दुर्मुहूर्त परेको अवधि छाडिन्छ (पूरै दिन होइन); संक्रान्ति (साधारण ±६ घण्टा, प्रमुख ±१६ घण्टा) र ग्रहणको दिन वर्जित।", en: "Dur-muhūrta skips only the affected period (not the whole day); Sankrānti (ordinary ±6h, cardinal ±16h) and the eclipse day are barred." },
      { ne: "निर्माणकार्य चातुर्मासमा रोकिँदैन — त्यसैले चातुर्मास वर्जित छैन।", en: "Construction is not paused during Chaturmāsa, so it is not barred here." },
    ],
  },
  "griha-pravesh": {
    description: {
      ne: "नयाँ घरमा प्रवेश (गृह प्रवेश) का लागि शुभ मिति — सपरिवार नयाँ निवासमा बसाइँ सर्ने शुभ दिन।",
      en: "Auspicious dates for entering and settling into a new home.",
    },
    method: MUHURTA_INTRO,
    rules: [
      { ne: "महिना — माघ, फागुन, चैत, वैशाख, ज्येष्ठ, मंसिर मात्र; अधिकमास र चातुर्मास वर्जित।", en: "Month — only Māgha, Phālguna, Chaitra, Vaiśākha, Jyeṣṭha, Mārgaśīrṣa; Adhik-māsa & Chaturmāsa barred." },
      { ne: "सूर्यबल — सूर्य मिथुन, वृश्चिक वा मीनमा हुनुहुँदैन (मलमास तुल्य)।", en: "Surya Bala — Sun not in Mithuna, Vṛśchika or Mīna (Malamas-like)." },
      { ne: "तिथि — शुक्ल पक्षका वृद्धि तिथि २,३,५,७,१०,११,१३ मात्र।", en: "Tithi — only the śukla-pakṣa growth tithis 2,3,5,7,10,11,13." },
      { ne: "नक्षत्र — स्थिर/मृदु ८ नक्षत्र: रोहिणी, मृगशिरा, उत्तराफाल्गुनी, चित्रा, अनुराधा, उत्तराषाढा, उत्तरभाद्रपदा, रेवती। (कुनै वर्षमा १२ भन्दा कम दिन भए हस्त, स्वाती, श्रवण, धनिष्ठा पनि थपिन्छन्।)", en: "Nakṣatra — the conservative 8 (sthira/mṛdu): Rohiṇī, Mṛgaśira, U.Phalgunī, Chitrā, Anurādhā, U.Aṣāḍhā, U.Bhādrapada, Revatī. (If a year has fewer than 12 days, Hasta, Svātī, Śravaṇa & Dhaniṣṭhā are also admitted.)" },
      { ne: "योग/करण — व्यतीपात र वैधृति योग तथा विष्टि (भद्रा) करण वर्जित।", en: "Yoga/Karaṇa — Vyatīpāta & Vaidhṛti yoga and Viṣṭi (Bhadrā) karaṇa barred." },
      { ne: "ग्रह — गुरु र शुक्र अस्त हुनुहुँदैन; चन्द्रमा लग्नबाट २/४/५/८/९/१२ भावमा हुनुहुँदैन।", en: "Graha — Jupiter & Venus must be udaya; Moon not in the 2/4/5/8/9/12 house from the lagna." },
      { ne: "लग्न — स्थिर र द्विस्वभाव लग्न मात्र स्वीकार्य; चर लग्न वर्जित।", en: "Lagna — only fixed (sthira) and dual (dvisvabhāva) ascendants accepted; movable ascendants rejected." },
      { ne: "दोष — दग्धा, शून्य, मलेफिक लत्ता (सूर्य/मंगल/शनि/राहु/केतु), दुर्मुहूर्त (अवधि मात्र), संक्रान्ति र ग्रहणको दिन वर्जित।", en: "Doṣa — Dagdha, Śūnya, malefic Latta (Sun/Mars/Saturn/Rāhu/Ketu), Dur-muhūrta (period only), Sankrānti and the eclipse day excluded." },
    ],
  },
  "byaparik-pratisthan": {
    description: {
      ne: "नयाँ व्यापार, पसल वा प्रतिष्ठान उद्घाटनका लागि शुभ मिति।",
      en: "Auspicious dates for opening a new business, shop or establishment.",
    },
    method: DAYTIME_INTRO,
    rules: [
      { ne: "महिना — अधिकमास बाहेक सबै चन्द्रमास (चातुर्मास पनि स्वीकार्य); संक्रान्तिको दिन वर्जित।", en: "Month — all lunar months except Adhik-māsa (Chaturmāsa is allowed); the Sankrānti day is barred." },
      { ne: "तिथि — दुवै पक्षका २,३,५,७,१०,११,१३; पूर्णिमा पनि स्वीकार्य।", en: "Tithi — 2,3,5,7,10,11,13 of both pakṣas; Pūrṇimā also accepted." },
      { ne: "नक्षत्र — व्यापारका लागि उपयुक्त निश्चित सूची: अश्विनी, रोहिणी, मृगशिरा, पुनर्वसु, पुष्य, उत्तराफाल्गुनी, हस्त, चित्रा, स्वाती, अनुराधा, उत्तराषाढा, श्रवण, धनिष्ठा, शतभिषा, उत्तरभाद्रपदा, रेवती।", en: "Nakṣatra — a fixed list of trade-favourable nakṣatras: Aśvinī, Rohiṇī, Mṛgaśira, Punarvasu, Puṣya, U.Phalgunī, Hasta, Chitrā, Svātī, Anurādhā, U.Aṣāḍhā, Śravaṇa, Dhaniṣṭhā, Śatabhiṣā, U.Bhādrapada, Revatī." },
      { ne: "वार — सोम, बुध, बिहि, शुक्र मात्र (आइत/मंगल/शनि वर्जित)।", en: "Vāra — only Mon/Wed/Thu/Fri (Sun/Tue/Sat barred)." },
      { ne: "लग्न — स्थिर र द्विस्वभाव लग्न मात्र स्वीकार्य; चर लग्न वर्जित।", en: "Lagna — only fixed (sthira) and dual (dvisvabhāva) ascendants accepted; movable rejected." },
      { ne: "योग/करण — व्यतीपात र वैधृति योग तथा विष्टि (भद्रा) करण वर्जित।", en: "Yoga/Karaṇa — Vyatīpāta & Vaidhṛti yoga and Viṣṭi (Bhadrā) karaṇa barred." },
      { ne: "दोष — दुर्मुहूर्त (अवधि मात्र), संक्रान्ति र ग्रहणको दिन वर्जित।", en: "Doṣa — Dur-muhūrta (period only), Sankrānti and the eclipse day excluded." },
      { ne: "ग्रह — व्यापार आरम्भ अन्य संस्कारभन्दा उदार भएकाले गुरु/शुक्र उदय अनिवार्य छैन; दिनको समय (सूर्योदय–सूर्यास्त) मात्र।", en: "Graha — business opening is more lenient than other rites, so Guru/Śukra udaya is NOT required; daytime only (sunrise→sunset)." },
    ],
  },
  "rudri-jurne": {
    description: {
      ne: "रुद्री पाठ तथा हवनका लागि शुभ मिति — शिव आराधनासम्बन्धी अनुष्ठानका दिन।",
      en: "Auspicious dates for the Rudri recitation and homa in worship of Śiva.",
    },
    method: {
      ne: "यी मितिहरू हाम्रो आफ्नै प्रणालीले गणना गर्छ। यो साइत लग्नमा आधारित होइन — प्रत्येक दिनको तिथिबाट तलको शिववास सूत्र लगाएर शुभ दिन निकालिन्छ।",
      en: "These dates are computed by our own system. This sāit is not lagna-based — for each day the Śiva-vāsa formula below is applied to the tithi.",
    },
    rules: [
      { ne: "शिववास सूत्र — पूर्ण तिथि (१–३०) मा (२×तिथि+५) लाई ७ ले भाग गर्दा शेष १/२/३ (कैलाश/गौरी/नन्दी) भए शुभ।", en: "Śiva-vāsa — on the absolute tithi (1–30), (2×tithi+5) mod 7 ∈ {1,2,3} (Kailāsa/Gaurī/Nandi) is auspicious." },
      { ne: "सभा, भोजन, क्रीडा, श्मशान (शेष ४/५/६/०) वर्जित; अमावस्या वर्जित।", en: "Sabhā, Bhojana, Krīḍā, Śmaśāna (remainders 4/5/6/0) avoided; Amāvasyā excluded." },
      { ne: "यो दिनको सूर्योदय पञ्चाङ्गमा गणना हुन्छ — लग्न विण्डो आवश्यक पर्दैन।", en: "Evaluated on the day's sunrise panchāṅga — no lagna window is needed." },
    ],
  },
  "agni-jurne": {
    description: {
      ne: "यज्ञ/हवनका लागि अग्नि स्थापना गर्ने शुभ मिति।",
      en: "Auspicious dates for establishing the sacred fire (Agni) to begin a yajña or homa.",
    },
    method: {
      ne: "यी मितिहरू हाम्रो आफ्नै प्रणालीले गणना गर्छ। यो साइत लग्नमा आधारित होइन — प्रत्येक दिनको तिथि र वारबाट तलको अग्निवास सूत्र लगाएर शुभ दिन निकालिन्छ।",
      en: "These dates are computed by our own system. This sāit is not lagna-based — for each day the Agni-vāsa formula below is applied to the tithi and weekday.",
    },
    rules: [
      { ne: "अग्निवास सूत्र — (तिथि+वार) लाई ४ ले भाग गर्दा शेष २ वा ३ भए अग्नि पृथ्वी/पातालमा — हवनका लागि शुभ।", en: "Agni-vāsa — when (tithi+vāra) mod 4 ∈ {2,3}, Agni resides on Earth/Pātāla — auspicious for havan." },
      { ne: "पूर्ण तिथि (शुक्ल १–१५, कृष्ण १६–३०) र वार (आइत=१ … शनि=७) मा गणना।", en: "Computed on the absolute tithi (śukla 1–15, kṛṣṇa 16–30) and vāra (Sun=1 … Sat=7)." },
      { ne: "यो दिनको तिथि–वारमा आधारित छ — लग्न विण्डो आवश्यक पर्दैन।", en: "Based on the day's tithi–vāra — no lagna window is needed." },
    ],
  },
  annaprasan: {
    description: {
      ne: "शिशुलाई पहिलो पटक अन्न ख्वाउने (अन्नप्रासन) संस्कारका लागि शुभ मिति।",
      en: "Auspicious dates for a baby's first feeding of solid food (Annaprasan).",
    },
    method: DAYTIME_INTRO,
    requiresBirthDate: true,
    rules: [
      { ne: "महिना — अधिकमास बाहेक सबै मास; रिक्ता र अमावस्या वर्जित।", en: "Month — all months except Adhik-māsa; rikta & Amāvasyā out." },
      { ne: "तिथि — शुक्ल २,३,५,७,१०,१३,१५ वा कृष्ण २,३,५,७,१०,१३; अष्टमी वर्जित।", en: "Tithi — śukla 2,3,5,7,10,13,15 or kṛṣṇa 2,3,5,7,10,13; Aṣṭamī out." },
      { ne: "नक्षत्र — निश्चित सूची: अश्विनी, रोहिणी, मृगशिरा, पुनर्वसु, पुष्य, उत्तराफाल्गुनी, हस्त, चित्रा, स्वाती, अनुराधा, उत्तराषाढा, श्रवण, धनिष्ठा, शतभिषा, उत्तरभाद्रपदा, रेवती।", en: "Nakṣatra — the fixed list: Aśvinī, Rohiṇī, Mṛgaśira, Punarvasu, Puṣya, U.Phalgunī, Hasta, Chitrā, Svātī, Anurādhā, U.Aṣāḍhā, Śravaṇa, Dhaniṣṭhā, Śatabhiṣā, U.Bhādrapada, Revatī." },
      { ne: "वार — सोम, बुध, बिहि, शुक्र मात्र; दिनको समय (सूर्योदय–सूर्यास्त) मात्र।", en: "Vāra — Mon/Wed/Thu/Fri only; daytime (sunrise→sunset) only." },
      { ne: "लग्न — मेष, वृश्चिक र मीन बाहेक सबै लग्न स्वीकार्य (उमेर विण्डोले पहिले नै सूची घटाउने भएकाले उदार राखिएको)।", en: "Lagna — all ascendants except Meṣa, Vṛśchika and Mīna (kept broad, since the age window already thins the set)." },
      { ne: "दोष — व्यतीपात/वैधृति योग, विष्टि (भद्रा) करण, दुर्मुहूर्त (अवधि मात्र) र ग्रहणको दिन वर्जित।", en: "Doṣa — Vyatīpāta/Vaidhṛti yoga, Viṣṭi (Bhadrā) karaṇa, Dur-muhūrta (period only) and the eclipse day excluded." },
      { ne: "यसको सटीक मिति शिशुको जन्ममितिमा भर पर्छ (५–८ महिनाको उमेर); सूचीले उपयुक्त दिन देखाउँछ।", en: "The exact date depends on the child's birth (5–8 month window); the list shows the suitable days." },
    ],
  },
};
