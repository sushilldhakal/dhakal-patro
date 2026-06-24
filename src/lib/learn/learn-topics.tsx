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
    Content: AstronomyBasics,
  },
  {
    slug: "solar-system",
    category: "astronomy",
    titleNe: "सौर्यमण्डल र चन्द्र गति",
    titleEn: "Solar System & Lunar Motion",
    icon: Orbit,
    summary: "पृथ्वीको परिक्रमा र चन्द्रको गति — सबै पात्रो गणनाको खगोलीय जग।",
    Content: SolarSystem,
  },
  {
    slug: "bs-calendar",
    category: "calendars",
    titleNe: "सौर vs चान्द्र — विक्रम सम्वत् कसरी बन्छ",
    titleEn: "Solar vs Lunar & How the BS Calendar is Formed",
    icon: CalendarRange,
    summary: "सूर्य र चन्द्र आधारित दुई पात्रो किन फरक पर्छन्, र बि.सं. का महिना सूर्यको राशि–गतिले कसरी तय हुन्छन्।",
    Content: BsCalendar,
  },
  {
    slug: "calendar-differences",
    category: "calendars",
    titleNe: "नेपाली, भारतीय र ग्रेगोरियन भिन्नता",
    titleEn: "Nepali vs Indian vs Gregorian",
    icon: Globe,
    summary: "तीन पात्रो प्रणालीको आधार, वर्षारम्भ र महिना–लम्बाइको तुलना।",
    Content: CalendarDifferences,
  },
  {
    slug: "adhik-maas",
    category: "calendars",
    titleNe: "अधिक मास — थपिने महिना",
    titleEn: "Adhik Maas (Extra Month)",
    icon: Layers,
    summary: "चान्द्र र सौर मासको फरकले किन झन्डै तीन वर्षमा एक महिना थपिन्छ।",
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
    Content: RituDrift,
  },
  {
    slug: "what-is-panchang",
    category: "panchanga",
    titleNe: "पञ्चाङ्ग भनेको के हो?",
    titleEn: "What is Panchang?",
    icon: ScrollText,
    summary: "तिथि, वार, नक्षत्र, योग र करण — पञ्चाङ्गका पाँच अङ्गको परिचय।",
    Content: WhatIsPanchang,
  },
  {
    slug: "tithi",
    category: "panchanga",
    titleNe: "तिथि कसरी गणना हुन्छ",
    titleEn: "How Tithi is Calculated",
    icon: Sigma,
    summary: "चन्द्र–सूर्यको १२° कोणीय दूरीले तिथि कसरी बन्छ — अन्तर्क्रियात्मक चित्रसहित।",
    Content: TithiArticle,
  },
  {
    slug: "tithi-vriddhi",
    category: "panchanga",
    titleNe: "तिथि किन दोहोरिन्छ",
    titleEn: "Why Tithi Repeats (Vriddhi)",
    icon: Repeat,
    summary: "चन्द्र मन्द गतिमा हिँड्दा एउटै तिथि किन दुई दिन पर्छ।",
    Content: TithiVriddhi,
  },
  {
    slug: "tithi-kshaya",
    category: "panchanga",
    titleNe: "तिथि किन हराउँछ",
    titleEn: "Why Tithi Skips (Kshaya)",
    icon: Scissors,
    summary: "चन्द्र द्रुत गतिमा हिँड्दा कुनै तिथि किन पात्रोबाट हराउँछ।",
    Content: TithiKshaya,
  },
  {
    slug: "nakshatra",
    category: "panchanga",
    titleNe: "नक्षत्र",
    titleEn: "Nakshatra Explained",
    icon: Star,
    summary: "आकाशका २७ तारापुञ्ज, पाद र चन्द्रको स्थानले के बुझाउँछ।",
    Content: Nakshatra,
  },
  {
    slug: "yoga",
    category: "panchanga",
    titleNe: "योग",
    titleEn: "Yoga Explained",
    icon: Spline,
    summary: "सूर्य र चन्द्रको देशान्तर जोडबाट बन्ने २७ योग र तिनको प्रयोग।",
    Content: Yoga,
  },
  {
    slug: "karana",
    category: "panchanga",
    titleNe: "करण",
    titleEn: "Karana Explained",
    icon: Scissors,
    summary: "तिथिको आधा भाग — ११ करण, चर र स्थिर, अनि भद्रा।",
    Content: Karana,
  },
  {
    slug: "sankranti",
    category: "panchanga",
    titleNe: "सङ्क्रान्ति",
    titleEn: "Sankranti Explained",
    icon: Sun,
    summary: "सूर्यको राशि परिवर्तनको क्षण — नयाँ महिनाको पहिलो गते।",
    Content: Sankranti,
  },
  {
    slug: "hora",
    category: "panchanga",
    titleNe: "होरा · ग्रहीय होरा",
    titleEn: "Planetary Hora (Hours)",
    icon: Clock,
    summary: "सात ग्रहले पालैपालो शासन गर्ने दिनका चौबीस होरा — र दिनको नाम कसरी बन्छ।",
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
    Content: Eclipses,
  },
  {
    slug: "ayanamsha",
    category: "kundali",
    titleNe: "अयनांश",
    titleEn: "Ayanamsha (Lahiri, Raman, KP)",
    icon: Compass,
    summary: "सायन र निरयन राशिबीचको फरक र तीन प्रमुख अयनांश प्रणाली।",
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
