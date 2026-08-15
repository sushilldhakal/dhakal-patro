import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Axis3d,
  Calculator,
  CalendarClock,
  CalendarRange,
  CircleDot,
  Compass,
  Eclipse,
  GitCompare,
  Globe,
  History,
  Hourglass,
  Layers,
  Locate,
  MapPin,
  Milestone,
  Moon,
  Network,
  Rotate3d,
  RotateCw,
  Ruler,
  ScrollText,
  Server,
  Sigma,
  Sun,
  SunMoon,
  Sunrise,
  Telescope,
  Timer,
  Workflow,
} from "lucide-react";

import type { Bi } from "./article-schema";

/**
 * The Learn library — the single source of truth for what exists in the
 * knowledge section, in reading order.
 *
 * The section runs as one course rather than a bag of loose pages: a reader
 * who starts at "sky basics" and follows prev/next moves Earth → Sun →
 * zodiac → Moon → panchanga → how a BS date is built → how we compute it →
 * eclipses → deeper astronomy → comparison. The order follows the reader's
 * own questions: what moves, how we measure it, what it produces, and only
 * then how the computation runs. Array order *is* that path, so insert a
 * topic where it belongs in the sequence.
 *
 * `status` separates the map from the territory. `planned` entries hold a
 * slug and title so the outline stays visible in one place while the article
 * is written, but they are filtered out of the hub, the router, the sitemap
 * and SEO metadata — nothing ships as an empty page. Writing the body and
 * flipping `planned` → `published` is all a new article needs.
 */

export type TopicStatus = "published" | "planned";

export interface LibraryTopic {
  slug: string;
  section: string;
  title: Bi;
  summary: Bi;
  icon: LucideIcon;
  status: TopicStatus;
  /** Set when the topic renders from its own page instead of the article shell. */
  path?: string;
}

export interface LibrarySection {
  id: string;
  title: Bi;
  /** One line on what the section covers, shown on the hub. */
  blurb: Bi;
  icon: LucideIcon;
}

export const LEARN_SECTIONS: LibrarySection[] = [
  {
    id: "start",
    icon: Compass,
    title: { ne: "सुरुवात", en: "Start Here" },
    blurb: {
      ne: "पात्रो भनेको के हो, दिन कसरी नापिन्छ, विक्रम सम्वत् र पञ्चाङ्ग के हुन् — बाँकी सबै यहीँबाट सुरु हुन्छ।",
      en: "What a calendar is, how a day is measured, what Bikram Sambat and a panchanga are — everything else starts here.",
    },
  },
  {
    id: "earth-sky",
    icon: Rotate3d,
    title: { ne: "पृथ्वी र आकाश", en: "Earth and Sky" },
    blurb: {
      ne: "पृथ्वीको घुर्णन र परिक्रमा, २३.४४° अक्ष झुकाव, ऋतु, विषुव र अयनान्त — सबै गतिको स्रोत।",
      en: "Earth's rotation and orbit, the 23.44° tilt, seasons, equinoxes and solstices — where every motion begins.",
    },
  },
  {
    id: "sun",
    icon: Sun,
    title: { ne: "सूर्य र सौरमान", en: "The Sun and the Solar Month" },
    blurb: {
      ne: "राशि, सङ्क्रान्ति, अयन र सायन–निरयन राशिचक्र — सौर पात्रोको सम्पूर्ण आधार।",
      en: "Rashi, sankranti, the ayanas and the two zodiacs — everything the solar calendar rests on.",
    },
  },
  {
    id: "moon",
    icon: Moon,
    title: { ne: "चन्द्र र चान्द्रमान", en: "The Moon and the Lunar Month" },
    blurb: {
      ne: "तिथि, पक्ष, चान्द्र मास र अधिक–क्षय मास — चन्द्रले पात्रोमा ल्याउने लय।",
      en: "Tithi, paksha, the lunar month and the extra or skipped month the Moon brings.",
    },
  },
  {
    id: "panchanga",
    icon: ScrollText,
    title: { ne: "पञ्चाङ्ग", en: "The Panchanga" },
    blurb: {
      ne: "वार, नक्षत्र, योग, करण — पाँच अङ्ग, तिनको पारस्परिक सम्बन्ध र दिनभित्रका परम्परागत समय एकाइ।",
      en: "Vara, nakshatra, yoga and karana — the five limbs, how they interlock, and the traditional units inside a day.",
    },
  },
  {
    id: "calculation",
    icon: Calculator,
    title: { ne: "गणना", en: "How a Date Is Calculated" },
    blurb: {
      ne: "सूर्योदय, सङ्क्रान्ति, तिथि र नक्षत्र — प्रत्येक अङ्क कुन सूत्र र कुन ग्रहपातबाट आउँछ।",
      en: "Sunrise, sankranti, tithi and nakshatra — which formula and which ephemeris each number comes from.",
    },
  },
  {
    id: "deeper",
    icon: Telescope,
    title: { ne: "गहिराइ", en: "Going Deeper" },
    blurb: {
      ne: "भूकेन्द्रित र सूर्यकेन्द्रित दृष्टि, वक्री गति, अयन चलन, ग्रहण — पात्रोभन्दा पर खगोलशास्त्र।",
      en: "Geocentric and heliocentric views, retrograde motion, precession and eclipses — the astronomy beyond the calendar.",
    },
  },
  {
    id: "comparison",
    icon: GitCompare,
    title: { ne: "तुलना र इतिहास", en: "Comparison and History" },
    blurb: {
      ne: "नेपाली, वैदिक र ग्रेगोरियन पात्रो आमनेसामने — लीप वर्ष, चलन र प्राचीन पात्रोको इतिहास।",
      en: "The Nepali, Vedic and Gregorian calendars side by side — leap years, drift, and where ancient calendars came from.",
    },
  },
];

/* ------------------------------------------------------------------ */
/* Topics, in reading order                                            */
/* ------------------------------------------------------------------ */

export const LEARN_LIBRARY: LibraryTopic[] = [
  {
    slug: "bikram-sambat",
    section: "start",
    status: "published",
    icon: CalendarRange,
    title: { ne: "विक्रम सम्वत् — वर्ष कसरी बन्छ", en: "Bikram Sambat — How the Year Is Built" },
    summary: {
      ne: "बि.सं. के हो, वर्ष बैशाखमा किन सुरु हुन्छ, र ई.सं.सँगको फरक किन स्थिर हुँदैन।",
      en: "What Bikram Sambat is, why the year opens in Baisakh, and why its offset from AD is never fixed.",
    },
  },
  {
    slug: "what-is-panchang",
    section: "start",
    status: "published",
    icon: ScrollText,
    title: { ne: "पञ्चाङ्ग र नेपाली पात्रो", en: "The Panchanga and the Nepali Calendar" },
    summary: {
      ne: "पञ्चाङ्ग भनेको के हो, नेपाली पात्रो कसरी चल्छ, र त्यसका पछाडिको खगोलीय आधार — सबै एकै ठाउँमा।",
      en: "What a panchanga is, how the Nepali calendar runs, and the sky it rests on — in one place.",
    },
  },
  {
    slug: "bs-calendar",
    section: "start",
    status: "published",
    icon: SunMoon,
    title: { ne: "सौर, चान्द्र र चान्द्र–सौर पात्रो", en: "Solar, Lunar and Lunisolar Calendars" },
    summary: {
      ne: "समय नाप्ने तीन ढाँचा, र नेपाली पात्रोले प्रयोग गर्ने सौरमान र चान्द्रमान दुवै गणना।",
      en: "The three ways of measuring time, with both reckonings the Nepali calendar uses — sauramāna and chāndramāna.",
    },
  },
  {
    slug: "baisakh-1",
    section: "start",
    status: "planned",
    icon: Milestone,
    title: { ne: "बैशाख १ कसरी तय हुन्छ", en: "How Baisakh 1 Is Fixed" },
    summary: {
      ne: "मेष सङ्क्रान्तिको क्षण र सूर्योदयको नियमले वर्षको पहिलो गते कसरी छान्छ।",
      en: "How the instant of Mesha Sankranti and the sunrise rule together pick the first day of the year.",
    },
  },
  {
    slug: "solar-month-first-gate",
    section: "start",
    status: "planned",
    icon: CalendarClock,
    title: { ne: "सौर महिनाको पहिलो गते कसरी आउँछ", en: "How the First Gate of a Solar Month Arrives" },
    summary: {
      ne: "सङ्क्रान्ति दिनको कुन समयमा पर्‍यो भन्नेले गते १ त्यही दिन कि भोलि हुन्छ भन्ने तय गर्छ।",
      en: "Where the sankranti falls within a day decides whether gate 1 is that day or the next.",
    },
  },
  {
    slug: "sankranti-to-month",
    section: "start",
    status: "planned",
    icon: Workflow,
    title: { ne: "सङ्क्रान्तिबाट महिना कसरी बन्छ", en: "From Sankranti to a Calendar Month" },
    summary: {
      ne: "दुई सङ्क्रान्तिबीचको अवधि नै एक नेपाली महिना — गते गन्ती यसैभित्र चल्छ।",
      en: "The span between two sankrantis is one Nepali month, and the gate count runs inside it.",
    },
  },
  {
    slug: "nepali-month-length",
    section: "start",
    status: "planned",
    icon: Ruler,
    title: { ne: "नेपाली महिनाको लम्बाइ किन फरक हुन्छ", en: "Why Nepali Months Have Different Lengths" },
    summary: {
      ne: "पृथ्वीको अण्डाकार कक्षले सूर्यको गति बदल्छ, त्यसैले महिना २९ देखि ३२ दिनसम्मको हुन्छ।",
      en: "Earth's elliptical orbit changes the Sun's apparent speed, so months run from 29 to 32 days.",
    },
  },
  {
    slug: "bs-year-formation",
    section: "start",
    status: "planned",
    icon: CalendarRange,
    title: { ne: "बि.सं. को वर्ष कसरी बन्छ", en: "How a Bikram Sambat Year Is Formed" },
    summary: {
      ne: "बाह्र सौर महिना जोडिएर एक बि.सं. वर्ष बन्छ — र त्यो वर्ष सधैँ ३६५ दिनको हुँदैन।",
      en: "Twelve solar months make one BS year — and that year is not always 365 days long.",
    },
  },
  {
    slug: "bs-date-determination",
    section: "start",
    status: "planned",
    icon: Locate,
    title: { ne: "एक बि.सं. मिति कसरी निर्धारण हुन्छ", en: "How a Single BS Date Is Determined" },
    summary: {
      ne: "वर्ष, महिना र गते — तीनवटै छुट्टै नियमबाट आउँछन्, र सँगै एउटा मिति बनाउँछन्।",
      en: "Year, month and gate each come from a separate rule, and together they make one date.",
    },
  },
  {
    slug: "month-days-vary",
    section: "start",
    status: "planned",
    icon: Layers,
    title: { ne: "एउटै महिनाका दिन वर्षैपिच्छे किन फरक हुन्छन्", en: "Why the Same Month Has Different Day Counts" },
    summary: {
      ne: "गत वर्ष ३१ दिनको भदौ यस वर्ष ३२ दिनको किन — सङ्क्रान्तिको क्षण सर्दै जाने कारण।",
      en: "Why a 31-day Bhadau becomes 32 days the next year — the sankranti instant keeps shifting.",
    },
  },
  {
    slug: "bs-ad-conversion",
    section: "start",
    status: "planned",
    icon: ArrowLeftRight,
    title: { ne: "बि.सं. र ई.सं. मिति कसरी रूपान्तरण हुन्छ", en: "How BS and AD Dates Are Converted" },
    summary: {
      ne: "तालिका होइन, गणना — जुलियन दिनमार्फत दुई पात्रोबीच मिति कसरी सारिन्छ।",
      en: "Not a lookup table but a computation — how a date moves between the two calendars via the Julian Day.",
    },
  },
  {
    slug: "earth-rotation-day",
    section: "earth-sky",
    status: "published",
    icon: RotateCw,
    title: { ne: "पृथ्वीको घुर्णन, परिक्रमा र दिन", en: "Earth's Rotation, Orbit and the Day" },
    summary: {
      ne: "दिन के हो, पृथ्वी कसरी घुम्छ र घुम्दा आकाश कसरी घुमेको देखिन्छ।",
      en: "What a day is, how Earth turns and orbits, and how that makes the sky appear to wheel.",
    },
  },
  {
    slug: "axial-tilt",
    section: "earth-sky",
    status: "published",
    icon: Axis3d,
    title: { ne: "अक्ष झुकाव, ऋतु र अयनान्त", en: "The Tilt, the Seasons and the Solstices" },
    summary: {
      ne: "२३.४४° को झुकावले ऋतु बनाउँछ — विषुव, अयनान्त र क्रान्तिको पूरा कथा।",
      en: "The 23.44° tilt that makes the seasons — equinoxes, solstices and declination, end to end.",
    },
  },
  {
    slug: "celestial-sphere",
    section: "earth-sky",
    status: "published",
    icon: Globe,
    title: { ne: "आकाशीय ढाँचा र निर्देशांक", en: "The Celestial Frame and Its Coordinates" },
    summary: {
      ne: "खगोलीय गोला, क्रान्तिवृत्त, विषुवत् रेखा, राशि पट्टी र आकाशमा स्थान नाप्ने सबै एकाइ।",
      en: "The celestial sphere, ecliptic, equator, zodiac belt and every coordinate used to pin a position.",
    },
  },
  {
    slug: "rashi",
    section: "sun",
    status: "published",
    icon: CircleDot,
    title: { ne: "राशि, सङ्क्रान्ति र सौर वर्ष", en: "Rashi, Sankranti and the Solar Year" },
    summary: {
      ne: "सूर्यले वर्ष कसरी तय गर्छ, राशि के हो, र राशि सीमा नाघ्ने क्षण — सङ्क्रान्ति।",
      en: "How the Sun fixes the year, what a rashi is, and the moment it crosses a boundary — the sankranti.",
    },
  },
  {
    slug: "mesha-sankranti",
    section: "sun",
    status: "published",
    icon: Sunrise,
    title: { ne: "मेष, मकर र कर्क सङ्क्रान्ति", en: "The Mesha, Makara and Karka Sankrantis" },
    summary: {
      ne: "वर्ष खोल्ने र अयन फर्काउने तीन प्रमुख सङ्क्रान्ति, तिनका पर्व र तिनका भ्रम।",
      en: "The three sankrantis that open the year and turn the ayanas — their festivals, and the confusions around them.",
    },
  },
  {
    slug: "sidereal-vs-tropical",
    section: "sun",
    status: "published",
    icon: Compass,
    title: { ne: "निरयन र सायन — अयनांश र ऋतु चलन", en: "Sidereal and Tropical — Ayanamsha and Drift" },
    summary: {
      ne: "दुई राशिचक्र, बीचको अयनांश, अयनको सन्धि र ऋतु किन सर्दै जान्छ।",
      en: "The two zodiacs, the ayanamsha between them, where the ayanas turn, and why the ṛtus drift.",
    },
  },
  {
    slug: "lunar-month",
    section: "moon",
    status: "published",
    icon: CalendarClock,
    title: { ne: "चान्द्र मास, पक्ष र चन्द्र कला", en: "The Lunar Month, the Pakshas and the Phases" },
    summary: {
      ne: "चन्द्रले पात्रो कसरी बनाउँछ — चान्द्र मास, औंसी–पूर्णिमा र दुई पक्ष।",
      en: "How the Moon builds a calendar — the lunar month, new and full, and the two pakshas.",
    },
  },
  {
    slug: "tithi",
    section: "moon",
    status: "published",
    icon: Sigma,
    title: { ne: "तिथि — गणना, लम्बाइ, वृद्धि र क्षय", en: "Tithi — Its Calculation, Length, Repeats and Skips" },
    summary: {
      ne: "तिथि कसरी बन्छ, किन २४ घण्टाको हुँदैन, र किन कुनै दोहोरिन्छ भने कुनै हराउँछ।",
      en: "How a tithi forms, why it is never 24 hours, and why some repeat while others vanish.",
    },
  },
  {
    slug: "adhik-kshaya-maas",
    section: "moon",
    status: "published",
    icon: CalendarRange,
    title: { ne: "चान्द्र–सौर फरक, अधिक र क्षय मास", en: "The Lunisolar Gap, and the Extra or Skipped Month" },
    summary: {
      ne: "वर्षेनि ११ दिनको फरक कसरी जम्मा हुन्छ, र पात्रोले अधिक वा क्षय मासले कसरी मिलाउँछ।",
      en: "How the 11-day annual shortfall accumulates, and how an extra or a dropped month settles it.",
    },
  },
  {
    slug: "five-limbs-together",
    section: "panchanga",
    status: "published",
    icon: Workflow,
    title: { ne: "पञ्चाङ्गका पाँच अङ्ग", en: "The Five Limbs of the Panchanga" },
    summary: {
      ne: "वार, तिथि, नक्षत्र, योग र करण — पाँचै अङ्ग, तिनको सम्बन्ध र ग्रहीय होरा।",
      en: "Vāra, tithi, nakshatra, yoga and karana — all five, how they interlock, and the planetary hora.",
    },
  },
  {
    slug: "day-night-divisions",
    section: "panchanga",
    status: "planned",
    icon: SunMoon,
    title: { ne: "दिन र रात कसरी बाँडिन्छ", en: "How Day and Night Are Divided" },
    summary: {
      ne: "सूर्योदयदेखि सूर्यास्तसम्मको दिनमान र रात्रिमान — वैदिक दिन घडीको २४ घण्टासँग किन मिल्दैन।",
      en: "Dinamana and ratrimana, from sunrise to sunset — why the Vedic day does not match a 24-hour clock.",
    },
  },
  {
    slug: "muhurta",
    section: "panchanga",
    status: "planned",
    icon: Timer,
    title: { ne: "मुहूर्त", en: "Muhurta" },
    summary: {
      ne: "दिनलाई ३० भागमा बाँड्ने वैदिक समय एकाइ र शुभ–अशुभ मुहूर्तको आधार।",
      en: "The Vedic time unit that splits the day into thirty parts, and the basis of auspicious timing.",
    },
  },
  {
    slug: "ghati-pala",
    section: "panchanga",
    status: "planned",
    icon: Hourglass,
    title: { ne: "घटी, पला र विपला", en: "Ghati, Pala and Vipala" },
    summary: {
      ne: "पञ्चाङ्गमा समय लेख्ने परम्परागत एकाइ — घटी–पलालाई घण्टा–मिनेटमा कसरी पढ्ने।",
      en: "The traditional units a panchanga writes time in — how to read ghati and pala as hours and minutes.",
    },
  },
  {
    slug: "why-location-matters",
    section: "calculation",
    status: "published",
    icon: MapPin,
    title: { ne: "स्थानले किन फरक पार्छ", en: "Why Location Changes the Answer" },
    summary: {
      ne: "सूर्योदय स्थानसापेक्ष हुनाले तिथि पनि स्थानसापेक्ष बन्छ — दुई सहरमा फरक उत्तर।",
      en: "Sunrise is local, so the tithi is too — and two cities can both be right.",
    },
  },
  {
    slug: "how-we-calculate",
    section: "calculation",
    status: "published",
    icon: Server,
    title: { ne: "हामी यो कसरी गणना गर्छौं", en: "How We Compute It" },
    summary: {
      ne: "ग्रहपात, काल मापन र गणना शृंखला — पात्रोका अङ्क कहाँबाट आउँछन्।",
      en: "Ephemeris, time scales and the computation chain — where the numbers in this patro come from.",
    },
  },
  {
    slug: "calc-sunrise",
    section: "calculation",
    status: "published",
    icon: Sunrise,
    title: { ne: "सूर्योदय, सूर्यास्त र चन्द्रोदय", en: "Sunrise, Sunset and Moonrise" },
    summary: {
      ne: "क्षितिजका घटना कसरी गणना हुन्छन् — घण्टा कोण, अपवर्तन र चन्द्रको दैनिक ढिलाइ।",
      en: "How the horizon events are computed — hour angle, refraction, and the Moon's daily slip.",
    },
  },
  {
    slug: "calc-tithi",
    section: "calculation",
    status: "published",
    icon: Sigma,
    title: { ne: "पञ्चाङ्गका अङ्गको गणना", en: "Computing the Limbs of the Panchanga" },
    summary: {
      ne: "सङ्क्रान्ति, तिथि, नक्षत्र, योग र करण — प्रत्येकको सूत्र र उदाहरणसहित गणना।",
      en: "Sankranti, tithi, nakshatra, yoga and karana — each formula, worked through.",
    },
  },
  {
    slug: "geocentric-heliocentric",
    section: "deeper",
    status: "published",
    icon: Network,
    title: { ne: "देखिने गति — दृष्टिकोण, वक्री र प्राचीन सुधार", en: "Apparent Motion — Viewpoint, Retrograde and the Ancient Corrections" },
    summary: {
      ne: "भूकेन्द्रित र सूर्यकेन्द्रित दृष्टि, मध्यम र स्पष्ट गति, वक्री लूप र मन्द–शीघ्र संस्कार।",
      en: "Geocentric and heliocentric views, mean and true motion, the retrograde loop, and the manda and shighra corrections.",
    },
  },
  {
    slug: "precession",
    section: "deeper",
    status: "published",
    icon: Rotate3d,
    title: { ne: "अयन चलन, ध्रुव तारा र प्राचीन आकाश", en: "Precession, the Pole Star and the Ancient Sky" },
    summary: {
      ne: "२६,००० वर्षे लट्टु — त्यसले ध्रुव तारा फेर्छ र प्राचीन अवलोकनलाई आजको आकाशसँग नमिल्ने बनाउँछ।",
      en: "The 26,000-year wobble — it changes the pole star and puts ancient observations out of step with today's sky.",
    },
  },
  {
    slug: "eclipses",
    section: "deeper",
    status: "published",
    icon: Eclipse,
    title: { ne: "ग्रहण — पात, ऋतु र चक्र", en: "Eclipses — Nodes, Seasons and Cycles" },
    summary: {
      ne: "राहु–केतुको पात रेखा, ग्रहण किन जोडीमा आउँछन्, र तिनका दोहोरिने चक्र।",
      en: "The Rahu–Ketu node line, why eclipses come in pairs, and the cycles they repeat on.",
    },
  },
  {
    slug: "calendar-differences",
    section: "comparison",
    status: "published",
    icon: Globe,
    title: { ne: "पात्रोको तुलना र इतिहास", en: "Comparing Calendars, and Where They Came From" },
    summary: {
      ne: "नेपाली, वैदिक र ग्रेगोरियन आमनेसामने — लीप वर्ष, चलन, र प्राचीन पात्रोले समय कसरी नाप्थे।",
      en: "Nepali, Vedic and Gregorian side by side — leap years, drift, and how ancient calendars measured time.",
    },
  },
  {
    slug: "history",
    section: "comparison",
    status: "published",
    icon: History,
    path: "/learn/history",
    title: { ne: "मयासुरको सूर्य सिद्धान्त", en: "Mayasura's Surya Siddhanta" },
    summary: {
      ne: "नेपाली पात्रोको खगोलीय जग — सूर्य सिद्धान्तको इतिहास, कालक्रम र स्रोतहरू।",
      en: "The astronomical roots of the Nepali patro — history, timeline and sources of the Surya Siddhanta.",
    },
  },
];

/* ------------------------------------------------------------------ */
/* Derived lookups                                                     */
/* ------------------------------------------------------------------ */

export const LEARN_LIBRARY_BY_SLUG: Record<string, LibraryTopic | undefined> =
  Object.fromEntries(LEARN_LIBRARY.map((t) => [t.slug, t]));

/** Everything a reader can actually open, in reading order. */
export const PUBLISHED_TOPICS: LibraryTopic[] = LEARN_LIBRARY.filter(
  (t) => t.status === "published",
);

/** Outlined but unwritten — kept for planning, never routed or indexed. */
export const PLANNED_TOPICS: LibraryTopic[] = LEARN_LIBRARY.filter(
  (t) => t.status === "planned",
);

export const LEARN_SECTIONS_BY_ID: Record<string, LibrarySection | undefined> =
  Object.fromEntries(LEARN_SECTIONS.map((s) => [s.id, s]));

export function publishedInSection(sectionId: string): LibraryTopic[] {
  return PUBLISHED_TOPICS.filter((t) => t.section === sectionId);
}

export function plannedInSection(sectionId: string): LibraryTopic[] {
  return PLANNED_TOPICS.filter((t) => t.section === sectionId);
}

/** Route for a topic — a few topics render from their own page. */
export function topicPath(topic: LibraryTopic): string {
  return topic.path ?? `/learn/${topic.slug}`;
}

const KNOWN_SECTION_IDS = new Set(LEARN_SECTIONS.map((s) => s.id));

/**
 * Guards the two mistakes this registry invites: a topic filed under a
 * section that does not exist (it would vanish from the hub, since the hub
 * iterates sections) and a duplicated slug (the later entry would shadow the
 * earlier one in every lookup). Both are silent in production, so fail loudly
 * in development instead.
 */
/*
 * `import.meta.env` is a Vite injection, and this module is also imported by
 * the sitemap script under plain tsx — where it is undefined. Check for it
 * before reading DEV rather than crashing the build.
 */
if (typeof import.meta.env !== "undefined" && import.meta.env.DEV) {
  const seen = new Set<string>();
  for (const topic of LEARN_LIBRARY) {
    if (seen.has(topic.slug)) {
      throw new Error(`Learn library: duplicate slug "${topic.slug}"`);
    }
    seen.add(topic.slug);
    if (!KNOWN_SECTION_IDS.has(topic.section)) {
      throw new Error(
        `Learn library: topic "${topic.slug}" has unknown section "${topic.section}"`,
      );
    }
  }
}
