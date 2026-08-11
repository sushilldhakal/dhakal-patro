import type { ArticleData } from "../article-schema";

import { bikramSambat } from "./foundation/bikram-sambat";
import { bsAdOffset } from "./foundation/bs-ad-offset";
import { bsVsAd } from "./foundation/bs-vs-ad";
import { chandramana } from "./foundation/chandramana";
import { nepaliCalendarBasics } from "./foundation/nepali-calendar-basics";
import { sauramana } from "./foundation/sauramana";
import { whyLocationMatters } from "./foundation/why-location-matters";
import { yearBeginsBaisakh } from "./foundation/year-begins-baisakh";

import { amavasyaPurnima } from "./moon/amavasya-purnima";
import { kshayaMaas } from "./moon/kshaya-maas";
import { lunarMonth } from "./moon/lunar-month";
import { lunarSolarDrift } from "./moon/lunar-solar-drift";
import { moonLunarCalendar } from "./moon/moon-lunar-calendar";
import { shuklaKrishnaPaksha } from "./moon/shukla-krishna-paksha";
import { tithiNot24Hours } from "./moon/tithi-not-24-hours";

import { karkaSankranti } from "./sun/karka-sankranti";
import { makaraSankranti } from "./sun/makara-sankranti";
import { meshaSankranti } from "./sun/mesha-sankranti";
import { rashi } from "./sun/rashi";
import { sankrantiVsSolstice } from "./sun/sankranti-vs-solstice";
import { siderealVsTropical } from "./sun/sidereal-vs-tropical";
import { solarYear } from "./sun/solar-year";
import { twelveRashis } from "./sun/twelve-rashis";
import { uttarayanaDakshinayana } from "./sun/uttarayana-dakshinayana";

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

  /* The Moon */
  tithiNot24Hours,
  shuklaKrishnaPaksha,
  amavasyaPurnima,
  lunarMonth,
  moonLunarCalendar,
  lunarSolarDrift,
  kshayaMaas,

  /* The Sun */
  solarYear,
  rashi,
  twelveRashis,
  meshaSankranti,
  makaraSankranti,
  karkaSankranti,
  uttarayanaDakshinayana,
  sankrantiVsSolstice,
  siderealVsTropical,
];

export const DATA_ARTICLES: Record<string, ArticleData | undefined> = Object.fromEntries(
  ALL.map((article) => [article.slug, article]),
);
