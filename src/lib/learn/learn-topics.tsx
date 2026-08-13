import {
  AstronomyBasics,
  SolarSystem,
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
import { ArticleBody } from "./article-render";
import { DATA_ARTICLES } from "./articles";
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

/**
 * Article bodies still written as React components.
 *
 * New articles should be data (see `articles/`); these predate that format and
 * keep working unchanged. A slug found here wins over a data article, so a
 * conversion is: add the data file, delete the entry here.
 */
const COMPONENT_CONTENT_BY_SLUG: Record<string, () => React.ReactNode> = {
  "astronomy-basics": AstronomyBasics,
  "solar-system": SolarSystem,
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

function contentForSlug(slug: string): () => React.ReactNode {
  const component = COMPONENT_CONTENT_BY_SLUG[slug];
  if (component) return component;

  const data = DATA_ARTICLES[slug];
  if (data) return () => <ArticleBody article={data} />;

  return () => null;
}

export const LEARN_TOPICS: LearnTopic[] = LEARN_TOPIC_METAS.map((meta) => ({
  ...meta,
  Content: contentForSlug(meta.slug),
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
