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
import { HowWeCalculateArticle } from "@/components/learn/HowWeCalculateStudy";
import {
  adjacentTopicMetas,
  LEARN_CATEGORIES,
  LEARN_TOPIC_METAS,
  type LearnCategory,
  type LearnTopicMeta,
} from "./learn-topics-meta";

/** Routed at `/learn/history` — body lives in `History` page, not LearnArticle shell. */

export type { LearnCategory, LearnTopicMeta };
export { LEARN_CATEGORIES, LEARN_TOPIC_METAS };

export function topicsInCategory(categoryId: string): LearnTopic[] {
  return LEARN_TOPICS.filter((t) => t.category === categoryId);
}

export interface LearnTopic extends LearnTopicMeta {
  Content: () => React.ReactNode;
}

const CONTENT_BY_SLUG: Record<string, () => React.ReactNode> = {
  "astronomy-basics": AstronomyBasics,
  "solar-system": SolarSystem,
  "bs-calendar": BsCalendar,
  "calendar-differences": CalendarDifferences,
  "adhik-maas": AdhikMaas,
  "ritu-drift": RituDrift,
  "what-is-panchang": WhatIsPanchang,
  tithi: TithiArticle,
  "tithi-vriddhi": TithiVriddhi,
  "tithi-kshaya": TithiKshaya,
  nakshatra: Nakshatra,
  yoga: Yoga,
  karana: Karana,
  sankranti: Sankranti,
  hora: HoraArticle,
  eclipses: Eclipses,
  ayanamsha: Ayanamsha,
  "how-we-calculate": HowWeCalculateArticle,
};

export const LEARN_TOPICS: LearnTopic[] = LEARN_TOPIC_METAS.map((meta) => ({
  ...meta,
  Content: CONTENT_BY_SLUG[meta.slug] ?? (() => null),
}));

export const LEARN_TOPICS_BY_SLUG: Record<string, LearnTopic> = Object.fromEntries(
  LEARN_TOPICS.map((t) => [t.slug, t]),
);

export function adjacentTopics(slug: string): {
  prev: LearnTopic | null;
  next: LearnTopic | null;
} {
  const { prev, next } = adjacentTopicMetas(slug);
  return {
    prev: prev ? LEARN_TOPICS_BY_SLUG[prev.slug] ?? null : null,
    next: next ? LEARN_TOPICS_BY_SLUG[next.slug] ?? null : null,
  };
}
