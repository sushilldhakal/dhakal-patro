import type { ArticleData } from "../article-schema";

import { bikramSambat } from "./foundation/bikram-sambat";
import { bsAdOffset } from "./foundation/bs-ad-offset";
import { bsVsAd } from "./foundation/bs-vs-ad";
import { chandramana } from "./foundation/chandramana";
import { nepaliCalendarBasics } from "./foundation/nepali-calendar-basics";
import { sauramana } from "./foundation/sauramana";
import { whyLocationMatters } from "./foundation/why-location-matters";
import { yearBeginsBaisakh } from "./foundation/year-begins-baisakh";

/**
 * Every data-driven article body, keyed by slug.
 *
 * Articles still written as React components live in `learn-articles.tsx` and
 * are wired up in `learn-topics.tsx`; both kinds render inside the same shell,
 * so an old article can be converted to data one at a time.
 */
const ALL: ArticleData[] = [
  /* Foundation */
  nepaliCalendarBasics,
  bikramSambat,
  yearBeginsBaisakh,
  bsVsAd,
  bsAdOffset,
  sauramana,
  chandramana,
  whyLocationMatters,
];

export const DATA_ARTICLES: Record<string, ArticleData | undefined> = Object.fromEntries(
  ALL.map((article) => [article.slug, article]),
);
