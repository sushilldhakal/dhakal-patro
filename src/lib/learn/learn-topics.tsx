import type { LucideIcon } from "lucide-react";
import {
  Orbit,
  CalendarRange,
  Globe,
  Layers,
  ScrollText,
  Sigma,
  Repeat,
  Star,
  Spline,
  Scissors,
  Compass,
  Clock,
  Eclipse,
  Eye,
  Sun,
  History,
} from "lucide-react";
import {
  AstronomyBasics,
  SolarSystem,
  BsCalendar,
  CalendarDifferences,
  WhatIsPanchang,
  TithiArticle,
  TithiVriddhi,
  TithiKshaya,
  AdhikMaas,
  Nakshatra,
  Yoga,
  Karana,
  Sankranti,
  HoraArticle,
  Eclipses,
  Ayanamsha,
  RituDrift,
} from "./learn-articles";

export interface LearnTopic {
  slug: string;
  category: string;
  titleNe: string;
  titleEn: string;
  icon: LucideIcon;
  summary: string;
  summaryEn: string;
  Content: () => React.ReactNode;
}

export interface LearnCategory {
  id: string;
  ne: string;
  en: string;
}

export const LEARN_CATEGORIES: LearnCategory[] = [
  { id: "astronomy", ne: "खगोल आधार", en: "Astronomy" },
  { id: "calendars", ne: "पात्रो", en: "Calendars" },
  { id: "panchanga", ne: "पञ्चाङ्ग", en: "Panchanga" },
  { id: "eclipses", ne: "ग्रहण", en: "Eclipses" },
  { id: "kundali", ne: "कुण्डली", en: "Kundali" },
];

export const LEARN_TOPICS: LearnTopic[] = [
  {
    slug: "astronomy-basics",
    category: "astronomy",
    titleNe: "गहिरो जानुअघि — खगोलीय आधार",
    titleEn: "Before Going Deeper — Sky Basics",
    icon: Eye,
    summary: "आकाश, कोण, १२ राशि, ९ ग्रह, २७ नक्षत्र, तिथि, योग, करण — गहिरो पढ्नुअघि पूरा सूची।",
    summaryEn: "The sky, angles, 12 rashis, 9 grahas, 27 nakshatras, tithi, yoga, karana — the full list before reading deeper.",
    Content: AstronomyBasics,
  },
  {
    slug: "solar-system",
    category: "astronomy",
    titleNe: "सौर्यमण्डल र चन्द्र गति",
    titleEn: "Solar System & Lunar Motion",
    icon: Orbit,
    summary: "पृथ्वीको परिक्रमा र चन्द्रको गति — सबै पात्रो गणनाको खगोलीय जग।",
    summaryEn: "Earth's orbit and the Moon's motion — the astronomical basis of all patro calculations.",
    Content: SolarSystem,
  },
  {
    slug: "bs-calendar",
    category: "calendars",
    titleNe: "सौर vs चान्द्र — विक्रम सम्वत् कसरी बन्छ",
    titleEn: "Solar vs Lunar & How the BS Calendar is Formed",
    icon: CalendarRange,
    summary: "सूर्य र चन्द्र आधारित दुई पात्रो किन फरक पर्छन्, र बि.सं. का महिना सूर्यको राशि–गतिले कसरी तय हुन्छन्।",
    summaryEn: "Why the two Sun- and Moon-based calendars differ, and how the Sun's sign motion sets the BS months.",
    Content: BsCalendar,
  },
  {
    slug: "calendar-differences",
    category: "calendars",
    titleNe: "नेपाली, वैदिक र ग्रेगोरियन भिन्नता",
    titleEn: "Nepali vs Indian vs Gregorian",
    icon: Globe,
    summary: "तीन पात्रो प्रणालीको आधार, वर्षारम्भ र महिना–लम्बाइको तुलना।",
    summaryEn: "A comparison of the three calendar systems — their basis, year-start and month lengths.",
    Content: CalendarDifferences,
  },
  {
    slug: "adhik-maas",
    category: "calendars",
    titleNe: "अधिक मास — थपिने महिना",
    titleEn: "Adhik Maas (Extra Month)",
    icon: Layers,
    summary: "चान्द्र र सौर मासको फरकले किन झन्डै तीन वर्षमा एक महिना थपिन्छ।",
    summaryEn: "Why the gap between lunar and solar months adds an extra month roughly every three years.",
    Content: AdhikMaas,
  },
  {
    slug: "ritu-drift",
    category: "calendars",
    titleNe: "ऋतु किन सर्छ — सायन vs निरयन",
    titleEn: "Why Ṛtu Drifts — Tropical vs Sidereal",
    icon: History,
    summary:
      "ऋतु सायन (विषुव–अयनान्त) ले, महिना निरयन (राशि–सङ्क्रान्ति) ले — अयन चलनले हरेक ~७२ वर्षमा १ दिन फरक पार्छ; दुवै सँगै स्थिर राख्न सकिँदैन।",
    summaryEn:
      "Ṛtu follows the tropical (equinox–solstice) zodiac, months follow the sidereal (sign–sankranti) one — precession shifts them by ~1 day every 72 years; both cannot stay fixed together.",
    Content: RituDrift,
  },
  {
    slug: "what-is-panchang",
    category: "panchanga",
    titleNe: "पञ्चाङ्ग भनेको के हो?",
    titleEn: "What is Panchang?",
    icon: ScrollText,
    summary: "तिथि, वार, नक्षत्र, योग र करण — पञ्चाङ्गका पाँच अङ्गको परिचय।",
    summaryEn: "An introduction to the five limbs of the panchanga — tithi, vaara, nakshatra, yoga and karana.",
    Content: WhatIsPanchang,
  },
  {
    slug: "tithi",
    category: "panchanga",
    titleNe: "तिथि कसरी गणना हुन्छ",
    titleEn: "How Tithi is Calculated",
    icon: Sigma,
    summary: "चन्द्र–सूर्यको १२° कोणीय दूरीले तिथि कसरी बन्छ — अन्तर्क्रियात्मक चित्रसहित।",
    summaryEn: "How the 12° angular gap between the Moon and Sun forms a tithi — with an interactive diagram.",
    Content: TithiArticle,
  },
  {
    slug: "tithi-vriddhi",
    category: "panchanga",
    titleNe: "तिथि किन दोहोरिन्छ",
    titleEn: "Why Tithi Repeats (Vriddhi)",
    icon: Repeat,
    summary: "चन्द्र मन्द गतिमा हिँड्दा एउटै तिथि किन दुई दिन पर्छ।",
    summaryEn: "Why one tithi spans two days when the Moon moves slowly.",
    Content: TithiVriddhi,
  },
  {
    slug: "tithi-kshaya",
    category: "panchanga",
    titleNe: "तिथि किन हराउँछ",
    titleEn: "Why Tithi Skips (Kshaya)",
    icon: Scissors,
    summary: "चन्द्र द्रुत गतिमा हिँड्दा कुनै तिथि किन पात्रोबाट हराउँछ।",
    summaryEn: "Why a tithi disappears from the calendar when the Moon moves quickly.",
    Content: TithiKshaya,
  },
  {
    slug: "nakshatra",
    category: "panchanga",
    titleNe: "नक्षत्र",
    titleEn: "Nakshatra Explained",
    icon: Star,
    summary: "आकाशका २७ तारापुञ्ज, पद र चन्द्रको स्थानले के बुझाउँछ।",
    summaryEn: "What the sky's 27 star-clusters, their padas and the Moon's position signify.",
    Content: Nakshatra,
  },
  {
    slug: "yoga",
    category: "panchanga",
    titleNe: "योग",
    titleEn: "Yoga Explained",
    icon: Spline,
    summary: "सूर्य र चन्द्रको देशान्तर जोडबाट बन्ने २७ योग र तिनको प्रयोग।",
    summaryEn: "The 27 yogas formed from the sum of the Sun's and Moon's longitudes, and their use.",
    Content: Yoga,
  },
  {
    slug: "karana",
    category: "panchanga",
    titleNe: "करण",
    titleEn: "Karana Explained",
    icon: Scissors,
    summary: "तिथिको आधा भाग — ११ करण, चर र स्थिर, अनि भद्रा।",
    summaryEn: "Half of a tithi — the 11 karanas, movable and fixed, and Bhadra.",
    Content: Karana,
  },
  {
    slug: "sankranti",
    category: "panchanga",
    titleNe: "सङ्क्रान्ति",
    titleEn: "Sankranti Explained",
    icon: Sun,
    summary: "सूर्यको राशि परिवर्तनको क्षण — नयाँ महिनाको पहिलो गते।",
    summaryEn: "The moment the Sun changes sign — the first day of a new month.",
    Content: Sankranti,
  },
  {
    slug: "hora",
    category: "panchanga",
    titleNe: "होरा · ग्रहीय होरा",
    titleEn: "Planetary Hora (Hours)",
    icon: Clock,
    summary: "सात ग्रहले पालैपालो शासन गर्ने दिनका चौबीस होरा — र दिनको नाम कसरी बन्छ।",
    summaryEn: "The day's twenty-four horas ruled in turn by the seven planets — and how the day gets its name.",
    Content: HoraArticle,
  },
  {
    slug: "eclipses",
    category: "eclipses",
    titleNe: "ग्रहण — सूर्य र चन्द्र",
    titleEn: "Solar & Lunar Eclipses",
    icon: Eclipse,
    summary:
      "राहु–केतु, पात रेखा, चन्द्रग्रहण (पूर्णिमा) र सूर्यग्रहण (अमावस्या) — प्रकार, चित्र र सावधानी।",
    summaryEn:
      "Rahu–Ketu, the node line, lunar eclipses (full moon) and solar eclipses (new moon) — types, diagrams and precautions.",
    Content: Eclipses,
  },
  {
    slug: "ayanamsha",
    category: "kundali",
    titleNe: "अयनांश",
    titleEn: "Ayanamsha (Lahiri, Raman, KP)",
    icon: Compass,
    summary: "सायन र निरयन राशिबीचको फरक र तीन प्रमुख अयनांश प्रणाली।",
    summaryEn: "The difference between the tropical and sidereal zodiac and the three main ayanamsha systems.",
    Content: Ayanamsha,
  },
];

export const LEARN_TOPICS_BY_SLUG: Record<string, LearnTopic> = Object.fromEntries(
  LEARN_TOPICS.map((t) => [t.slug, t]),
);

export function topicsInCategory(categoryId: string): LearnTopic[] {
  return LEARN_TOPICS.filter((t) => t.category === categoryId);
}

export function adjacentTopics(slug: string): {
  prev: LearnTopic | null;
  next: LearnTopic | null;
} {
  const i = LEARN_TOPICS.findIndex((t) => t.slug === slug);
  return {
    prev: i > 0 ? LEARN_TOPICS[i - 1]! : null,
    next: i >= 0 && i < LEARN_TOPICS.length - 1 ? LEARN_TOPICS[i + 1]! : null,
  };
}
