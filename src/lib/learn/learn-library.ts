import type { LucideIcon } from "lucide-react";
import {
  Aperture,
  ArrowLeftRight,
  Axis3d,
  Calculator,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  CircleDot,
  Clock,
  CloudSun,
  Compass,
  Crosshair,
  Eclipse,
  Eye,
  Flame,
  Gauge,
  GitCompare,
  Globe,
  Grid2x2,
  History,
  Hourglass,
  Landmark,
  Layers,
  Locate,
  Map,
  MapPin,
  Milestone,
  Moon,
  Navigation,
  Network,
  Orbit,
  Pi,
  Radar,
  Repeat,
  Rotate3d,
  RotateCw,
  Route,
  Ruler,
  Scale,
  Scissors,
  ScrollText,
  Server,
  Sigma,
  Snowflake,
  Spline,
  Split,
  Star,
  Sun,
  SunMoon,
  Sunrise,
  Sunset,
  Telescope,
  Thermometer,
  Timer,
  TrendingUp,
  Workflow,
} from "lucide-react";

import type { Bi } from "./article-schema";

/**
 * The Learn library — the single source of truth for what exists in the
 * knowledge section, in reading order.
 *
 * The section runs as one course rather than a bag of loose pages: a reader
 * who starts at "how the Nepali calendar works" and follows prev/next moves
 * Sun → Moon → Rashi → Sankranti → Tithi → month → year → BS. Array order
 * *is* that path, so insert a topic where it belongs in the sequence.
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
    id: "foundation",
    icon: Globe,
    title: { ne: "आधार", en: "Foundation" },
    blurb: {
      ne: "पात्रो कसरी बन्छ, विक्रम सम्वत् के हो, र सौर–चान्द्र दुई मापन प्रणालीको परिचय।",
      en: "How a calendar is built, what Bikram Sambat is, and the two systems of measuring time.",
    },
  },
  {
    id: "sun",
    icon: Sun,
    title: { ne: "सूर्य", en: "The Sun" },
    blurb: {
      ne: "राशि, सङ्क्रान्ति, अयन र सायन–निरयन राशिचक्र — सौर पात्रोको सम्पूर्ण आधार।",
      en: "Rashi, sankranti, the ayanas and the two zodiacs — everything the solar calendar rests on.",
    },
  },
  {
    id: "moon",
    icon: Moon,
    title: { ne: "चन्द्र", en: "The Moon" },
    blurb: {
      ne: "तिथि, पक्ष, चान्द्र मास र अधिक–क्षय मास — चन्द्रले पात्रोमा ल्याउने लय।",
      en: "Tithi, paksha, the lunar month and the extra or skipped month the Moon brings.",
    },
  },
  {
    id: "five-limbs",
    icon: ScrollText,
    title: { ne: "पञ्चाङ्गका पाँच अङ्ग", en: "The Five Limbs" },
    blurb: {
      ne: "तिथि, वार, नक्षत्र, योग र करण — प्रत्येक अङ्ग र तिनको पारस्परिक सम्बन्ध।",
      en: "Tithi, vara, nakshatra, yoga and karana — each limb and how they work together.",
    },
  },
  {
    id: "astronomy",
    icon: Orbit,
    title: { ne: "पात्रोपछाडिको खगोल विज्ञान", en: "Astronomy Behind the Calendar" },
    blurb: {
      ne: "पृथ्वीको घुर्णन, परिक्रमा, अक्ष झुकाव, विषुव–अयनान्त र अयन चलन।",
      en: "Earth's rotation and orbit, axial tilt, equinoxes, solstices and precession.",
    },
  },
  {
    id: "eclipses",
    icon: Eclipse,
    title: { ne: "ग्रहण", en: "Eclipses" },
    blurb: {
      ne: "राहु–केतु, पात रेखा, सूर्यग्रहण र चन्द्रग्रहणको ज्यामिति।",
      en: "Rahu–Ketu, the node line, and the geometry of solar and lunar eclipses.",
    },
  },
  {
    id: "calculation",
    icon: Calculator,
    title: { ne: "गणना कसरी हुन्छ", en: "How a Date Is Calculated" },
    blurb: {
      ne: "सूर्योदय, सङ्क्रान्ति, तिथि, नक्षत्र — Vedic Patro भित्रको वास्तविक गणना।",
      en: "Sunrise, sankranti, tithi, nakshatra — the actual computation inside Vedic Patro.",
    },
  },
  {
    id: "comparison",
    icon: GitCompare,
    title: { ne: "पात्रो तुलना", en: "Calendar Comparison" },
    blurb: {
      ne: "वैदिक, ग्रेगोरियन, सौर र चान्द्र पात्रोको आमनेसामने तुलना।",
      en: "The Vedic, Gregorian, solar and lunar calendars side by side.",
    },
  },
  {
    id: "deeper",
    icon: Telescope,
    title: { ne: "गहन ज्ञान", en: "Deeper Knowledge" },
    blurb: {
      ne: "सूर्य सिद्धान्त, ग्रह गति, वक्री गति र खगोलीय गोलाको समन्वय प्रणाली।",
      en: "The Surya Siddhanta, planetary motion, retrogression and the celestial sphere.",
    },
  },
];

/* ------------------------------------------------------------------ */
/* Topics, in reading order                                            */
/* ------------------------------------------------------------------ */

export const LEARN_LIBRARY: LibraryTopic[] = [
  /* ── 🌍 FOUNDATION ────────────────────────────────────────────── */
  {
    slug: "nepali-calendar-basics",
    section: "foundation",
    status: "published",
    icon: CalendarDays,
    title: { ne: "नेपाली पात्रो कसरी चल्छ", en: "How the Nepali Calendar Works" },
    summary: {
      ne: "नेपाली पात्रो दिन गन्ने प्रणाली मात्र होइन — खगोलीय गतिबाट बनेको समय प्रणाली हो। सुरुदेखि सम्पूर्ण चित्र।",
      en: "The Nepali calendar is not a numbering system for days but a time system built from astronomical cycles — the whole picture, from the start.",
    },
  },
  {
    slug: "bikram-sambat",
    section: "foundation",
    status: "published",
    icon: CalendarRange,
    title: { ne: "विक्रम सम्वत् के हो", en: "What Is Bikram Sambat?" },
    summary: {
      ne: "बि.सं. सम्वत् (वर्ष गणना) हो, र महिना–गते छुट्टै खगोलीय नियमले तय हुन्छन् — यी दुई फरक प्रश्न हुन्।",
      en: "BS is an era — a way of numbering years — while its months and dates come from separate astronomical rules. Two different questions.",
    },
  },
  {
    slug: "year-begins-baisakh",
    section: "foundation",
    status: "published",
    icon: Sunrise,
    title: { ne: "नेपाली वर्ष बैशाखमा किन सुरु हुन्छ", en: "Why the Nepali Year Begins in Baisakh" },
    summary: {
      ne: "मेष सङ्क्रान्ति — सूर्य मेष राशिमा प्रवेश गर्ने क्षणले सौर वर्षको आरम्भ तय गर्छ, कुनै मनपरी मिति होइन।",
      en: "Mesha Sankranti — the Sun's entry into Mesha sets the start of the solar year, not an arbitrary chosen date.",
    },
  },
  {
    slug: "bs-vs-ad",
    section: "foundation",
    status: "published",
    icon: ArrowLeftRight,
    title: { ne: "बि.सं. र ई.सं. कसरी फरक छन्", en: "BS vs AD: How the Two Calendars Differ" },
    summary: {
      ne: "वर्षारम्भ, महिनाको लम्बाइ, दिनको सीमा र आधार — दुई पात्रो कहाँ–कहाँ बाझिन्छन्।",
      en: "Year start, month length, day boundary and underlying basis — every point where the two calendars part ways.",
    },
  },
  {
    slug: "bs-ad-offset",
    section: "foundation",
    status: "published",
    icon: Sigma,
    title: { ne: "बि.सं. र ई.सं.बीच स्थिर फरक किन हुँदैन", en: "Why BS and AD Have No Fixed Offset" },
    summary: {
      ne: "“५६–५७ वर्ष अगाडि” अनुमान मात्र हो। मिति = वर्ष + महिना + गते, र प्रत्येकको सीमा फरक नियमले तय हुन्छ।",
      en: "\"56–57 years ahead\" is a rough guide. A date is year + month + day, and each boundary follows different rules.",
    },
  },
  {
    slug: "bs-calendar",
    section: "foundation",
    status: "published",
    icon: SunMoon,
    title: {
      ne: "सौर, चान्द्र र चान्द्र–सौर पात्रो",
      en: "Solar, Lunar and Lunisolar Calendars",
    },
    summary: {
      ne: "सूर्य र चन्द्र आधारित दुई पात्रो किन फरक पर्छन्, र बि.सं. का महिना सूर्यको राशि–गतिले कसरी तय हुन्छन्।",
      en: "Why the two Sun- and Moon-based calendars differ, and how the Sun's sign motion sets the BS months.",
    },
  },
  {
    slug: "sauramana",
    section: "foundation",
    status: "published",
    icon: Sun,
    title: { ne: "सौरमान के हो", en: "What Is Sauramāna?" },
    summary: {
      ne: "सूर्यको राशि–भ्रमणमा आधारित सौर मापन — गते, सङ्क्रान्ति र महिनाको लम्बाइ यहीँबाट आउँछ।",
      en: "The solar measure of time based on the Sun's travel through the zodiac — the source of gate, sankranti and month length.",
    },
  },
  {
    slug: "chandramana",
    section: "foundation",
    status: "published",
    icon: Moon,
    title: { ne: "चान्द्रमान के हो", en: "What Is Chāndramāna?" },
    summary: {
      ne: "चन्द्र–सूर्य सम्बन्धमा आधारित चान्द्र मापन — तिथि, पक्ष, चान्द्र मास र चाडपर्वको आधार।",
      en: "The lunar measure of time based on the Moon's relationship with the Sun — the basis of tithi, paksha and festivals.",
    },
  },
  {
    slug: "what-is-panchang",
    section: "foundation",
    status: "published",
    icon: ScrollText,
    title: { ne: "पञ्चाङ्ग भनेको के हो?", en: "What Is a Panchanga?" },
    summary: {
      ne: "तिथि, वार, नक्षत्र, योग र करण — पञ्चाङ्गका पाँच अङ्गको परिचय।",
      en: "An introduction to the five limbs of the panchanga — tithi, vaara, nakshatra, yoga and karana.",
    },
  },
  {
    slug: "why-location-matters",
    section: "foundation",
    status: "published",
    icon: MapPin,
    title: { ne: "पञ्चाङ्गमा स्थानले किन फरक पार्छ", en: "Why Location Matters in a Panchanga" },
    summary: {
      ne: "खगोलीय घटनाको क्षण एक हुन्छ, तर सूर्योदय र दिनको सीमा स्थानअनुसार फरक — काठमाडौँ, मेलबर्न र न्युयोर्कमा एउटै तिथि किन फरक देखिन्छ।",
      en: "An astronomical event has one instant, but sunrise and the day boundary are local — why one tithi shows differently in Kathmandu, Melbourne and New York.",
    },
  },

  /* ── ☀️ THE SUN ───────────────────────────────────────────────── */
  {
    slug: "solar-year",
    section: "sun",
    status: "published",
    icon: Orbit,
    title: { ne: "सूर्यले सौर वर्ष कसरी तय गर्छ", en: "How the Sun Defines the Solar Year" },
    summary: {
      ne: "राशिचक्रको ३६०° पूरा गर्दा एक सौर वर्ष — सूर्यको देशान्तर र वर्षको लम्बाइ।",
      en: "One solar year is a full 360° of the zodiac — solar longitude and the length of the year.",
    },
  },
  {
    slug: "rashi",
    section: "sun",
    status: "published",
    icon: CircleDot,
    title: { ne: "राशि के हो", en: "What Is a Rashi?" },
    summary: {
      ne: "राशिचक्रको ३०° को एक भाग — आकाशीय देशान्तर नाप्ने समन्वय प्रणाली।",
      en: "A 30° division of the zodiac — the coordinate frame for describing celestial longitude.",
    },
  },
  {
    slug: "twelve-rashis",
    section: "sun",
    status: "published",
    icon: Grid2x2,
    title: { ne: "बाह्र राशिको परिचय", en: "The 12 Rashis Explained" },
    summary: {
      ne: "मेषदेखि मीनसम्म — प्रत्येक राशिको संस्कृत नाम, पश्चिमी समकक्ष र सीमा।",
      en: "Mesha to Meena — each rashi's Sanskrit name, Western equivalent and boundaries.",
    },
  },
  {
    slug: "sankranti",
    section: "sun",
    status: "published",
    icon: Sun,
    title: { ne: "सङ्क्रान्ति", en: "What Is Sankranti?" },
    summary: {
      ne: "सूर्यको राशि परिवर्तनको क्षण — नयाँ महिनाको पहिलो गते।",
      en: "The moment the Sun changes sign — the first day of a new month.",
    },
  },
  {
    slug: "mesha-sankranti",
    section: "sun",
    status: "published",
    icon: Sunrise,
    title: { ne: "मेष सङ्क्रान्ति र बैशाखको आरम्भ", en: "Mesha Sankranti and the Start of Baisakh" },
    summary: {
      ne: "सौर वर्षको सन्दर्भ बिन्दु — नववर्षको खगोलीय अर्थ।",
      en: "The solar year's reference point — the astronomy of the new year.",
    },
  },
  {
    slug: "makara-sankranti",
    section: "sun",
    status: "published",
    icon: Snowflake,
    title: { ne: "मकर सङ्क्रान्ति", en: "Makara Sankranti Explained" },
    summary: {
      ne: "माघे सङ्क्रान्ति — सूर्य मकरमा प्रवेश, र यो शीत अयनान्तसँग किन मिल्दैन।",
      en: "Maghe Sankranti — the Sun's entry into Makara, and why it is not the winter solstice.",
    },
  },
  {
    slug: "karka-sankranti",
    section: "sun",
    status: "published",
    icon: Thermometer,
    title: { ne: "कर्क सङ्क्रान्ति", en: "Karka Sankranti Explained" },
    summary: {
      ne: "सूर्य कर्क राशिमा — दक्षिणायनको आरम्भ र वर्षा ऋतुसँगको सम्बन्ध।",
      en: "The Sun in Karka — the start of Dakshinayana and its link with the monsoon.",
    },
  },
  {
    slug: "uttarayana-dakshinayana",
    section: "sun",
    status: "published",
    icon: TrendingUp,
    title: { ne: "उत्तरायण र दक्षिणायन", en: "Uttarāyaṇa and Dakṣiṇāyana" },
    summary: {
      ne: "सूर्यको उत्तर–दक्षिण यात्राका दुई आधावार्षिक चरण, र क्रान्ति (declination) सँगको सम्बन्ध।",
      en: "The two half-year phases of the Sun's north–south journey, and how they relate to declination.",
    },
  },
  {
    slug: "sankranti-vs-solstice",
    section: "sun",
    status: "published",
    icon: Split,
    title: { ne: "सङ्क्रान्ति र अयनान्त — फरक के?", en: "Sankranti vs Solstice" },
    summary: {
      ne: "एउटा राशि सीमामा आधारित, अर्को सूर्यको क्रान्तिमा — दुई फरक सन्दर्भ प्रणाली।",
      en: "One is defined by a zodiac boundary, the other by the Sun's declination — two different reference systems.",
    },
  },
  {
    slug: "sidereal-vs-tropical",
    section: "sun",
    status: "published",
    icon: Compass,
    title: { ne: "निरयन र सायन राशिचक्र", en: "Sidereal vs Tropical Zodiac" },
    summary: {
      ne: "ताराको सन्दर्भ vs विषुवको सन्दर्भ — भारतीय पात्रो ग्रेगोरियन ऋतु ढाँचाभन्दा किन फरक छ।",
      en: "A stellar reference against an equinox reference — why Indian calendars differ from the Gregorian seasonal frame.",
    },
  },
  {
    slug: "ayanamsha",
    section: "sun",
    status: "published",
    icon: Compass,
    title: { ne: "अयनांश", en: "Ayanamsha (Lahiri, Raman, KP)" },
    summary: {
      ne: "सायन र निरयन राशिबीचको फरक र तीन प्रमुख अयनांश प्रणाली।",
      en: "The difference between the tropical and sidereal zodiac and the three main ayanamsha systems.",
    },
  },
  {
    slug: "ritu-drift",
    section: "sun",
    status: "published",
    icon: History,
    title: { ne: "ऋतु किन सर्छ — सायन vs निरयन", en: "Why Ṛtu Drifts — Tropical vs Sidereal" },
    summary: {
      ne: "ऋतु सायन (विषुव–अयनान्त) ले, महिना निरयन (राशि–सङ्क्रान्ति) ले — अयन चलनले हरेक ~७२ वर्षमा १ दिन फरक पार्छ; दुवै सँगै स्थिर राख्न सकिँदैन।",
      en: "Ṛtu follows the tropical (equinox–solstice) zodiac, months follow the sidereal (sign–sankranti) one — precession shifts them by ~1 day every 72 years; both cannot stay fixed together.",
    },
  },

  /* ── 🌙 THE MOON ──────────────────────────────────────────────── */
  {
    slug: "tithi",
    section: "moon",
    status: "published",
    icon: Sigma,
    title: { ne: "तिथि कसरी गणना हुन्छ", en: "How Tithi Is Calculated" },
    summary: {
      ne: "चन्द्र–सूर्यको १२° कोणीय दूरीले तिथि कसरी बन्छ — अन्तर्क्रियात्मक चित्रसहित।",
      en: "How the 12° angular gap between the Moon and Sun forms a tithi — with an interactive diagram.",
    },
  },
  {
    slug: "tithi-not-24-hours",
    section: "moon",
    status: "published",
    icon: Hourglass,
    title: { ne: "तिथि २४ घण्टाको किन हुँदैन", en: "Why a Tithi Is Not 24 Hours" },
    summary: {
      ne: "चन्द्र र सूर्यको कोणीय गति स्थिर नभएकाले १२° पूरा हुने समय घटबढ हुन्छ।",
      en: "Because neither the Moon nor the Sun moves at a constant angular speed, the time to cover 12° varies.",
    },
  },
  {
    slug: "tithi-vriddhi",
    section: "moon",
    status: "published",
    icon: Repeat,
    title: { ne: "तिथि किन दोहोरिन्छ", en: "Why Tithi Repeats (Vriddhi)" },
    summary: {
      ne: "चन्द्र मन्द गतिमा हिँड्दा एउटै तिथि किन दुई दिन पर्छ।",
      en: "Why one tithi spans two days when the Moon moves slowly.",
    },
  },
  {
    slug: "tithi-kshaya",
    section: "moon",
    status: "published",
    icon: Scissors,
    title: { ne: "तिथि किन हराउँछ", en: "Why Tithi Skips (Kshaya)" },
    summary: {
      ne: "चन्द्र द्रुत गतिमा हिँड्दा कुनै तिथि किन पात्रोबाट हराउँछ।",
      en: "Why a tithi disappears from the calendar when the Moon moves quickly.",
    },
  },
  {
    slug: "shukla-krishna-paksha",
    section: "moon",
    status: "published",
    icon: SunMoon,
    title: { ne: "शुक्ल र कृष्ण पक्ष", en: "Shukla Paksha and Krishna Paksha" },
    summary: {
      ne: "बढ्दो र घट्दो चन्द्रका दुई पन्ध्र–तिथि खण्ड।",
      en: "The waxing and waning halves, each of fifteen tithis.",
    },
  },
  {
    slug: "amavasya-purnima",
    section: "moon",
    status: "published",
    icon: CircleDot,
    title: { ne: "औंसी र पूर्णिमा", en: "Amāvasyā and Pūrṇimā" },
    summary: {
      ne: "०° र १८०° कोणान्तर — चान्द्र मासका दुई सन्धि बिन्दु।",
      en: "0° and 180° elongation — the two hinge points of the lunar month.",
    },
  },
  {
    slug: "lunar-month",
    section: "moon",
    status: "published",
    icon: CalendarClock,
    title: { ne: "चान्द्र मास के हो", en: "What Is a Lunar Month?" },
    summary: {
      ne: "एक औंसीदेखि अर्कोसम्म ~२९.५३ दिन — सांयोगिक (synodic) मास।",
      en: "From one new moon to the next, about 29.53 days — the synodic month.",
    },
  },
  {
    slug: "moon-lunar-calendar",
    section: "moon",
    status: "published",
    icon: Moon,
    title: { ne: "चन्द्रले चान्द्र पात्रो कसरी बनाउँछ", en: "How the Moon Creates the Lunar Calendar" },
    summary: {
      ne: "तिथिबाट पक्ष, पक्षबाट मास — चान्द्र पात्रोको संरचना।",
      en: "Tithi into paksha, paksha into month — the structure of the lunar calendar.",
    },
  },
  {
    slug: "lunar-solar-drift",
    section: "moon",
    status: "published",
    icon: Split,
    title: { ne: "चान्द्र र सौर पात्रो किन छुट्टिन्छन्", en: "Why Lunar and Solar Calendars Drift Apart" },
    summary: {
      ne: "वर्षमा ~१०.८७ दिनको फरक — तीन वर्षमा झन्डै एक महिना।",
      en: "About 10.87 days a year — nearly a whole month in three years.",
    },
  },
  {
    slug: "adhik-maas",
    section: "moon",
    status: "published",
    icon: Layers,
    title: { ne: "अधिक मास — थपिने महिना", en: "Adhika Māsa — The Extra Lunar Month" },
    summary: {
      ne: "चान्द्र र सौर मासको फरकले किन झन्डै तीन वर्षमा एक महिना थपिन्छ।",
      en: "Why the gap between lunar and solar months adds an extra month roughly every three years.",
    },
  },
  {
    slug: "kshaya-maas",
    section: "moon",
    status: "published",
    icon: Scissors,
    title: { ne: "क्षय मास — घट्ने महिना", en: "Kṣaya Māsa — When a Lunar Month Is Skipped" },
    summary: {
      ne: "एउटै चान्द्र मासमा दुई सङ्क्रान्ति पर्दा महिना पात्रोबाट हराउँछ — दुर्लभ अवस्था।",
      en: "When two sankrantis fall inside one lunar month it drops from the calendar — a rare case.",
    },
  },

  /* ── ⭐ THE FIVE LIMBS ────────────────────────────────────────── */
  {
    slug: "vara",
    section: "five-limbs",
    status: "planned",
    icon: CalendarDays,
    title: { ne: "वार", en: "Vāra — The Weekday" },
    summary: {
      ne: "सात वार, तिनका ग्रह स्वामी, र सूर्योदयदेखि सूर्योदयसम्मको वैदिक दिन।",
      en: "The seven weekdays, their planetary rulers, and the sunrise-to-sunrise Vedic day.",
    },
  },
  {
    slug: "hora",
    section: "five-limbs",
    status: "published",
    icon: Clock,
    title: { ne: "होरा · ग्रहीय होरा", en: "Planetary Hora (Hours)" },
    summary: {
      ne: "सात ग्रहले पालैपालो शासन गर्ने दिनका चौबीस होरा — र दिनको नाम कसरी बन्छ।",
      en: "The day's twenty-four horas ruled in turn by the seven planets — and how the day gets its name.",
    },
  },
  {
    slug: "nakshatra",
    section: "five-limbs",
    status: "published",
    icon: Star,
    title: { ne: "नक्षत्र", en: "Nakshatra Explained" },
    summary: {
      ne: "आकाशका २७ तारापुञ्ज, पद र चन्द्रको स्थानले के बुझाउँछ।",
      en: "What the sky's 27 star-clusters, their padas and the Moon's position signify.",
    },
  },
  {
    slug: "yoga",
    section: "five-limbs",
    status: "published",
    icon: Spline,
    title: { ne: "योग", en: "Yoga Explained" },
    summary: {
      ne: "सूर्य र चन्द्रको देशान्तर जोडबाट बन्ने २७ योग र तिनको प्रयोग।",
      en: "The 27 yogas formed from the sum of the Sun's and Moon's longitudes, and their use.",
    },
  },
  {
    slug: "karana",
    section: "five-limbs",
    status: "published",
    icon: Scissors,
    title: { ne: "करण", en: "Karana Explained" },
    summary: {
      ne: "तिथिको आधा भाग — ११ करण, चर र स्थिर, अनि भद्रा।",
      en: "Half of a tithi — the 11 karanas, movable and fixed, and Bhadra.",
    },
  },
  {
    slug: "five-limbs-together",
    section: "five-limbs",
    status: "planned",
    icon: Workflow,
    title: { ne: "पाँच अङ्ग सँगै कसरी काम गर्छन्", en: "How the Five Elements Work Together" },
    summary: {
      ne: "एउटै दिनको पञ्चाङ्ग पङ्क्ति कसरी पढ्ने — पाँच अङ्गको संयुक्त अर्थ।",
      en: "How to read a single day's panchanga line — the five limbs taken together.",
    },
  },

  /* ── 🌌 ASTRONOMY BEHIND THE CALENDAR ────────────────────────── */
  {
    slug: "astronomy-basics",
    section: "astronomy",
    status: "published",
    icon: Eye,
    title: { ne: "गहिरो जानुअघि — खगोलीय आधार", en: "Before Going Deeper — Sky Basics" },
    summary: {
      ne: "आकाश, कोण, १२ राशि, ९ ग्रह, २७ नक्षत्र, तिथि, योग, करण — गहिरो पढ्नुअघि पूरा सूची।",
      en: "The sky, angles, 12 rashis, 9 grahas, 27 nakshatras, tithi, yoga, karana — the full list before reading deeper.",
    },
  },
  {
    slug: "earth-rotation-day",
    section: "astronomy",
    status: "planned",
    icon: RotateCw,
    title: { ne: "पृथ्वीको घुर्णन र दिनको लम्बाइ", en: "Earth's Rotation and the Length of a Day" },
    summary: {
      ne: "नाक्षत्र दिन र सौर दिनबीचको ~४ मिनेटको फरक किन?",
      en: "Why a sidereal day and a solar day differ by about 4 minutes.",
    },
  },
  {
    slug: "solar-system",
    section: "astronomy",
    status: "published",
    icon: Orbit,
    title: { ne: "सौर्यमण्डल र चन्द्र गति", en: "Earth's Revolution and Lunar Motion" },
    summary: {
      ne: "पृथ्वीको परिक्रमा र चन्द्रको गति — सबै पात्रो गणनाको खगोलीय जग।",
      en: "Earth's orbit and the Moon's motion — the astronomical basis of all patro calculations.",
    },
  },
  {
    slug: "axial-tilt",
    section: "astronomy",
    status: "planned",
    icon: Axis3d,
    title: { ne: "पृथ्वीको २३.४४° अक्ष झुकाव", en: "Earth's 23.44° Axial Tilt" },
    summary: {
      ne: "क्रान्तिवृत्त र खगोलीय विषुवत् रेखाबीचको कोण — ऋतुको मूल कारण।",
      en: "The angle between the ecliptic and the celestial equator — the root cause of the seasons.",
    },
  },
  {
    slug: "why-seasons",
    section: "astronomy",
    status: "planned",
    icon: CloudSun,
    title: { ne: "ऋतु किन हुन्छन्", en: "Why Seasons Occur" },
    summary: {
      ne: "दूरी होइन, झुकाव — सूर्यको किरणको कोण र दिनको लम्बाइले ऋतु बनाउँछ।",
      en: "Tilt, not distance — the angle of sunlight and the length of day make the seasons.",
    },
  },
  {
    slug: "equinoxes",
    section: "astronomy",
    status: "planned",
    icon: Scale,
    title: { ne: "विषुव", en: "Equinoxes Explained" },
    summary: {
      ne: "सूर्य खगोलीय विषुवत् रेखा काट्ने दुई क्षण — दिन र रात बराबर।",
      en: "The two moments the Sun crosses the celestial equator — day and night in balance.",
    },
  },
  {
    slug: "solstices",
    section: "astronomy",
    status: "planned",
    icon: Flame,
    title: { ne: "अयनान्त", en: "Solstices Explained" },
    summary: {
      ne: "सूर्यको क्रान्ति उच्चतम वा न्यूनतम हुने क्षण — सबैभन्दा लामो र छोटो दिन।",
      en: "When the Sun's declination reaches its extreme — the longest and shortest days.",
    },
  },
  {
    slug: "precession",
    section: "astronomy",
    status: "planned",
    icon: Rotate3d,
    title: { ne: "पृथ्वीको अक्षको अयन चलन", en: "Precession of Earth's Axis" },
    summary: {
      ne: "~२६,००० वर्षको चक्र जसले विषुव र तारापुञ्जको सम्बन्ध बिस्तारै बदल्छ।",
      en: "The ~26,000-year cycle that slowly changes the relationship between equinox and stars.",
    },
  },
  {
    slug: "pole-star-changes",
    section: "astronomy",
    status: "planned",
    icon: Star,
    title: { ne: "ध्रुव तारा किन फेरिन्छ", en: "Why the Pole Star Changes" },
    summary: {
      ne: "अक्ष घुम्दै जाँदा उत्तर आकाशीय ध्रुवले फरक तारा देखाउँछ।",
      en: "As the axis swings, the north celestial pole points at a different star.",
    },
  },
  {
    slug: "ancient-sky",
    section: "astronomy",
    status: "planned",
    icon: Landmark,
    title: { ne: "प्राचीन आकाश कस्तो देखिन्थ्यो", en: "How the Ancient Sky Looked Different" },
    summary: {
      ne: "हजारौँ वर्ष अघिको विषुव, नक्षत्र र ऋतुको सम्बन्ध।",
      en: "The relationship between equinox, nakshatra and season thousands of years ago.",
    },
  },
  {
    slug: "sidereal-time",
    section: "astronomy",
    status: "planned",
    icon: Timer,
    title: { ne: "नाक्षत्र काल", en: "Sidereal Time" },
    summary: {
      ne: "ताराको सापेक्ष नापिने समय — लग्न र भाव गणनाको आधार।",
      en: "Time measured against the stars — the basis of lagna and house calculation.",
    },
  },
  {
    slug: "solar-longitude",
    section: "astronomy",
    status: "planned",
    icon: Navigation,
    title: { ne: "सूर्यको देशान्तर", en: "Solar Longitude" },
    summary: {
      ne: "क्रान्तिवृत्तमा सूर्यको ०–३६०° स्थान — गते र सङ्क्रान्ति यहीँबाट निस्कन्छ।",
      en: "The Sun's 0–360° place on the ecliptic — where gate and sankranti come from.",
    },
  },
  {
    slug: "lunar-longitude",
    section: "astronomy",
    status: "planned",
    icon: Locate,
    title: { ne: "चन्द्रको देशान्तर", en: "Lunar Longitude" },
    summary: {
      ne: "क्रान्तिवृत्तमा चन्द्रको स्थान — तिथि, नक्षत्र र योगको इनपुट।",
      en: "The Moon's place on the ecliptic — the input to tithi, nakshatra and yoga.",
    },
  },
  {
    slug: "declination",
    section: "astronomy",
    status: "planned",
    icon: Crosshair,
    title: { ne: "क्रान्ति र सूर्यको उत्तर–दक्षिण गति", en: "Declination and the Sun's North–South Motion" },
    summary: {
      ne: "सूर्य विषुवत् रेखाबाट कति उत्तर वा दक्षिण — सूर्योदयको समय यसैले बदल्छ।",
      en: "How far north or south of the equator the Sun stands — what shifts sunrise through the year.",
    },
  },

  /* ── 🌑 ECLIPSES ──────────────────────────────────────────────── */
  {
    slug: "eclipses",
    section: "eclipses",
    status: "published",
    icon: Eclipse,
    title: { ne: "ग्रहण — सूर्य र चन्द्र", en: "Solar & Lunar Eclipses" },
    summary: {
      ne: "राहु–केतु, पात रेखा, चन्द्रग्रहण (पूर्णिमा) र सूर्यग्रहण (औंसी) — प्रकार, चित्र र सावधानी।",
      en: "Rahu–Ketu, the node line, lunar eclipses (full moon) and solar eclipses (new moon) — types, diagrams and precautions.",
    },
  },
  {
    slug: "rahu-ketu-nodes",
    section: "eclipses",
    status: "planned",
    icon: Aperture,
    title: { ne: "राहु–केतु र पात रेखा", en: "Rahu–Ketu and the Node Line" },
    summary: {
      ne: "चन्द्र कक्ष र क्रान्तिवृत्त काटिने दुई बिन्दु — ग्रहण यहीँ मात्र सम्भव।",
      en: "The two points where the Moon's orbit crosses the ecliptic — the only places an eclipse can happen.",
    },
  },
  {
    slug: "eclipse-seasons",
    section: "eclipses",
    status: "planned",
    icon: Radar,
    title: { ne: "ग्रहण ऋतु र चक्र", en: "Eclipse Seasons and Cycles" },
    summary: {
      ne: "ग्रहण किन झुण्डमा आउँछन्, र सरोस चक्र कसरी दोहोरिन्छ।",
      en: "Why eclipses come in groups, and how the saros cycle repeats.",
    },
  },

  /* ── 🧮 HOW A DATE IS CALCULATED ─────────────────────────────── */
  {
    slug: "how-we-calculate",
    section: "calculation",
    status: "published",
    icon: Server,
    title: { ne: "हामी यो कसरी गणना गर्छौं", en: "How We Calculate It" },
    summary: {
      ne: "nepali-holiday-api को pipeline — राशि पट्टी, झुकाव, अयन चलन, Swiss Ephemeris सूत्र, daily.py र HTTP routes; अन्तरक्रियात्मक चित्र सहित।",
      en: "The nepali-holiday-api pipeline — rashi belt, axial tilt, precession, Swiss Ephemeris formulas, daily.py, and routes — with interactive sky diagrams.",
    },
  },
  {
    slug: "calc-sunrise",
    section: "calculation",
    status: "planned",
    icon: Sunrise,
    title: { ne: "सूर्योदय कसरी गणना हुन्छ", en: "How Sunrise Is Calculated" },
    summary: {
      ne: "अक्षांश, क्रान्ति, वायुमण्डलीय अपवर्तन र सूर्यको बिम्ब — उदयको ठ्याक्कै क्षण।",
      en: "Latitude, declination, atmospheric refraction and the Sun's disc — the exact instant of rising.",
    },
  },
  {
    slug: "calc-sunset",
    section: "calculation",
    status: "planned",
    icon: Sunset,
    title: { ne: "सूर्यास्त कसरी गणना हुन्छ", en: "How Sunset Is Calculated" },
    summary: {
      ne: "उदयको उल्टो गणना, र दिनमानको लम्बाइ कसरी निकालिन्छ।",
      en: "The mirror of sunrise, and how the length of the day follows from it.",
    },
  },
  {
    slug: "calc-sankranti",
    section: "calculation",
    status: "planned",
    icon: Sun,
    title: { ne: "सङ्क्रान्ति कसरी गणना हुन्छ", en: "How Sankranti Is Calculated" },
    summary: {
      ne: "सूर्यको निरयन देशान्तर ३०° को गुणाङ्क छुने क्षण खोज्ने विधि।",
      en: "Finding the instant the Sun's sidereal longitude crosses a multiple of 30°.",
    },
  },
  {
    slug: "calc-tithi",
    section: "calculation",
    status: "planned",
    icon: Sigma,
    title: { ne: "तिथि कसरी गणना हुन्छ (सूत्र)", en: "How Tithi Is Computed (Formula)" },
    summary: {
      ne: "(चन्द्र − सूर्य) देशान्तर ÷ १२° — र सन्धि समय निकाल्ने पुनरावृत्ति।",
      en: "(Moon − Sun) longitude ÷ 12°, and the iteration that finds the end time.",
    },
  },
  {
    slug: "calc-nakshatra",
    section: "calculation",
    status: "planned",
    icon: Star,
    title: { ne: "नक्षत्र कसरी गणना हुन्छ", en: "How Nakshatra Is Calculated" },
    summary: {
      ne: "चन्द्रको निरयन देशान्तर ÷ १३°२०′ — पद सहित।",
      en: "The Moon's sidereal longitude ÷ 13°20′, padas included.",
    },
  },
  {
    slug: "calc-yoga",
    section: "calculation",
    status: "planned",
    icon: Spline,
    title: { ne: "योग कसरी गणना हुन्छ", en: "How Yoga Is Calculated" },
    summary: {
      ne: "(सूर्य + चन्द्र) देशान्तर ÷ १३°२०′ — २७ योगको सूत्र।",
      en: "(Sun + Moon) longitude ÷ 13°20′ — the formula for the 27 yogas.",
    },
  },
  {
    slug: "calc-karana",
    section: "calculation",
    status: "planned",
    icon: Scissors,
    title: { ne: "करण कसरी गणना हुन्छ", en: "How Karana Is Calculated" },
    summary: {
      ne: "कोणान्तर ÷ ६° — ६० करण खण्ड र ११ नामको चक्र।",
      en: "Elongation ÷ 6° — the 60 karana slots cycling through 11 names.",
    },
  },
  {
    slug: "calc-moonrise",
    section: "calculation",
    status: "planned",
    icon: Moon,
    title: { ne: "चन्द्रोदय र चन्द्रास्त कसरी गणना हुन्छ", en: "How Moonrise and Moonset Are Calculated" },
    summary: {
      ne: "चन्द्रको द्रुत गति र लम्बन (parallax) ले किन अतिरिक्त पुनरावृत्ति चाहिन्छ।",
      en: "Why the Moon's fast motion and parallax demand extra iteration.",
    },
  },
  {
    slug: "location-different-results",
    section: "calculation",
    status: "planned",
    icon: Map,
    title: { ne: "दुई स्थानमा पञ्चाङ्ग किन फरक हुन्छ", en: "Why Two Locations Differ" },
    summary: {
      ne: "एउटै क्षण, फरक सूर्योदय — स्थानीय दिन सीमाले नतिजा बदल्छ।",
      en: "One instant, different sunrises — the local day boundary changes the answer.",
    },
  },
  {
    slug: "time-scales",
    section: "calculation",
    status: "planned",
    icon: Gauge,
    title: { ne: "गणनालाई शुद्ध काल मापन किन चाहिन्छ", en: "Why Calculations Need a Precise Time Scale" },
    summary: {
      ne: "UT, TT र ΔT — कुन घडीमा गणना गर्दा फरक पर्छ।",
      en: "UT, TT and ΔT — which clock you compute in, and why it matters.",
    },
  },

  /* ── 🗓️ CALENDAR COMPARISON ──────────────────────────────────── */
  {
    slug: "calendar-differences",
    section: "comparison",
    status: "published",
    icon: Globe,
    title: { ne: "नेपाली, वैदिक र ग्रेगोरियन भिन्नता", en: "Nepali vs Indian vs Gregorian" },
    summary: {
      ne: "तीन पात्रो प्रणालीको आधार, वर्षारम्भ र महिना–लम्बाइको तुलना।",
      en: "A comparison of the three calendar systems — their basis, year-start and month lengths.",
    },
  },
  {
    slug: "solar-vs-lunar-calendar",
    section: "comparison",
    status: "planned",
    icon: SunMoon,
    title: { ne: "सौर पात्रो vs चान्द्र पात्रो", en: "Solar Calendar vs Lunar Calendar" },
    summary: {
      ne: "ग्रेगोरियन, इस्लामी र चान्द्र–सौर पात्रो — कुनले के मिलाउँछ।",
      en: "Gregorian, Islamic and lunisolar calendars — what each one keeps aligned.",
    },
  },
  {
    slug: "sidereal-vs-tropical-year",
    section: "comparison",
    status: "planned",
    icon: Ruler,
    title: { ne: "नाक्षत्र वर्ष vs सायन वर्ष", en: "Sidereal Year vs Tropical Year" },
    summary: {
      ne: "३६५.२५६४ vs ३६५.२४२२ दिन — वर्षमा ~२० मिनेटको फरक र त्यसको परिणाम।",
      en: "365.2564 against 365.2422 days — about 20 minutes a year, and what it accumulates into.",
    },
  },
  {
    slug: "leap-years",
    section: "comparison",
    status: "planned",
    icon: CalendarRange,
    title: { ne: "लीप वर्ष किन चाहिन्छ", en: "Why Leap Years Exist" },
    summary: {
      ne: "०.२४२२ दिनको अंश मिलाउने ग्रेगोरियन नियम, र वैदिक पात्रोमा यसको समकक्ष।",
      en: "The Gregorian rule that absorbs the 0.2422-day remainder, and its Vedic counterpart.",
    },
  },
  {
    slug: "calendar-drift",
    section: "comparison",
    status: "planned",
    icon: TrendingUp,
    title: { ne: "पात्रोको मिति बिस्तारै किन सर्छ", en: "Why Calendar Dates Slowly Drift" },
    summary: {
      ne: "साना अंश शताब्दीभरि जम्मा हुँदा जुलियनदेखि ग्रेगोरियन सुधारसम्म।",
      en: "How small remainders piled up over centuries, from the Julian calendar to the Gregorian reform.",
    },
  },
  {
    slug: "calendars-aligned-with-nature",
    section: "comparison",
    status: "planned",
    icon: Milestone,
    title: { ne: "पात्रो प्रकृतिसँग कसरी मिलिरहन्छ", en: "How Calendars Stay Aligned With Nature" },
    summary: {
      ne: "अन्तर्वेशन (intercalation) र सुधार — पात्रोलाई आकाशसँग बाँध्ने उपाय।",
      en: "Intercalation and reform — the devices that tie a calendar back to the sky.",
    },
  },
  {
    slug: "ancient-calendars",
    section: "comparison",
    status: "planned",
    icon: Landmark,
    title: { ne: "प्राचीन पात्रोले समय कसरी नाप्थे", en: "How Ancient Calendars Measured Time" },
    summary: {
      ne: "छायाँ, गनोमन, जल घडी र नक्षत्र अवलोकन।",
      en: "Shadows, gnomons, water clocks and nakshatra observation.",
    },
  },

  /* ── 🔭 DEEPER KNOWLEDGE ─────────────────────────────────────── */
  {
    slug: "history",
    section: "deeper",
    status: "published",
    icon: History,
    path: "/learn/history",
    title: { ne: "मयासुरको सूर्य सिद्धान्त", en: "Mayasura's Surya Siddhanta" },
    summary: {
      ne: "नेपाली पात्रोको खगोलीय जग — सूर्य सिद्धान्तको इतिहास, कालक्रम र स्रोतहरू।",
      en: "The astronomical roots of the Nepali patro — history, timeline and sources of the Surya Siddhanta.",
    },
  },
  {
    slug: "ancient-planetary-motion",
    section: "deeper",
    status: "planned",
    icon: Orbit,
    title: { ne: "प्राचीन ज्योतिषीले ग्रह गति कसरी वर्णन गर्थे", en: "How Ancient Astronomers Described Planetary Motion" },
    summary: {
      ne: "मन्दोच्च, शीघ्रोच्च र सिद्धान्तिक सुधार चक्र।",
      en: "Manda and shighra corrections, and the cycles of siddhantic astronomy.",
    },
  },
  {
    slug: "mean-vs-true-motion",
    section: "deeper",
    status: "planned",
    icon: Gauge,
    title: { ne: "मध्यम गति र स्पष्ट गति", en: "Mean Motion vs True Motion" },
    summary: {
      ne: "औसत गतिबाट वास्तविक स्थानमा पुग्ने सुधार — मध्यम ग्रहबाट स्पष्ट ग्रह।",
      en: "The correction from an average rate to a real position — madhyama to spashta.",
    },
  },
  {
    slug: "retrograde-motion",
    section: "deeper",
    status: "planned",
    icon: Repeat,
    title: { ne: "वक्री गति", en: "Retrograde Motion Explained" },
    summary: {
      ne: "ग्रह पछाडि हिँडेको किन देखिन्छ — सापेक्ष गतिको ज्यामिति।",
      en: "Why a planet appears to move backwards — the geometry of relative motion.",
    },
  },
  {
    slug: "geocentric-heliocentric",
    section: "deeper",
    status: "planned",
    icon: Network,
    title: { ne: "भूकेन्द्रित र सूर्यकेन्द्रित दृष्टिकोण", en: "Geocentric vs Heliocentric Views" },
    summary: {
      ne: "पञ्चाङ्ग पृथ्वीबाट देखिने आकाश वर्णन गर्छ — दुई दृष्टिकोण किन दुवै सही छन्।",
      en: "A panchanga describes the sky as seen from Earth — why both frames are valid.",
    },
  },
  {
    slug: "celestial-sphere",
    section: "deeper",
    status: "planned",
    icon: Globe,
    title: { ne: "खगोलीय गोला", en: "The Celestial Sphere" },
    summary: {
      ne: "आकाशलाई गोलाकार मानी स्थान नाप्ने ढाँचा।",
      en: "The frame that treats the sky as a sphere so positions can be measured.",
    },
  },
  {
    slug: "ecliptic",
    section: "deeper",
    status: "planned",
    icon: Spline,
    title: { ne: "क्रान्तिवृत्त", en: "The Ecliptic" },
    summary: {
      ne: "सूर्यको वार्षिक मार्ग — राशि र नक्षत्र यसैमा नापिन्छन्।",
      en: "The Sun's annual path — the line along which rashi and nakshatra are measured.",
    },
  },
  {
    slug: "celestial-equator",
    section: "deeper",
    status: "planned",
    icon: Scale,
    title: { ne: "खगोलीय विषुवत् रेखा", en: "The Celestial Equator" },
    summary: {
      ne: "पृथ्वीको विषुवत् रेखाको आकाशीय प्रक्षेप — विषुव यहीँ बन्छ।",
      en: "Earth's equator projected onto the sky — where the equinoxes are defined.",
    },
  },
  {
    slug: "right-ascension",
    section: "deeper",
    status: "planned",
    icon: Pi,
    title: { ne: "विषुवांश (Right Ascension)", en: "Right Ascension" },
    summary: {
      ne: "विषुवत् प्रणालीको देशान्तर — घण्टामा नापिने आकाशीय समन्वय।",
      en: "Longitude in the equatorial system — a celestial coordinate measured in hours.",
    },
  },
  {
    slug: "zodiac-belt",
    section: "deeper",
    status: "planned",
    icon: Grid2x2,
    title: { ne: "राशि पट्टी", en: "The Zodiac Belt" },
    summary: {
      ne: "क्रान्तिवृत्तको दुईतिर ~९° को पट्टी जहाँ सूर्य, चन्द्र र ग्रह हिँड्छन्।",
      en: "The ~9° band either side of the ecliptic in which Sun, Moon and planets travel.",
    },
  },
  {
    slug: "sky-rotation",
    section: "deeper",
    status: "planned",
    icon: Route,
    title: { ne: "पृथ्वीबाट आकाश कसरी घुमेको देखिन्छ", en: "How the Sky Appears to Rotate From Earth" },
    summary: {
      ne: "दैनिक घुर्णन, ध्रुव र अक्षांशअनुसार आकाशको फरक दृश्य।",
      en: "Daily rotation, the poles, and how the view of the sky changes with latitude.",
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
