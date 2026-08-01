/**
 * Canonical list of public indexable URLs (sitemap + prerender).
 * Keep STATIC_SITEMAP_ENTRIES and slug/id lists in sync with src/lib/public-indexable-paths.ts
 */

/** @typedef {{ path: string; changefreq: "daily" | "weekly" | "monthly"; priority: string }} SitemapEntry */

/** @type {SitemapEntry[]} */
export const STATIC_SITEMAP_ENTRIES = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/panchanga", changefreq: "daily", priority: "0.9" },
  { path: "/panchanga/year", changefreq: "weekly", priority: "0.7" },
  { path: "/panchanga/details", changefreq: "monthly", priority: "0.7" },
  { path: "/panchanga/avakahada-chakra", changefreq: "monthly", priority: "0.6" },
  { path: "/panchanga/graha-sthiti", changefreq: "weekly", priority: "0.7" },
  { path: "/panchanga/graha-asta", changefreq: "weekly", priority: "0.7" },
  { path: "/panchanga/graha-vakri", changefreq: "weekly", priority: "0.7" },
  { path: "/panchanga/surya-grahan", changefreq: "monthly", priority: "0.7" },
  { path: "/panchanga/chandra-grahan", changefreq: "monthly", priority: "0.7" },
  { path: "/dainikkranti", changefreq: "weekly", priority: "0.8" },
  { path: "/shanti-vidhi", changefreq: "monthly", priority: "0.6" },
  { path: "/converter", changefreq: "monthly", priority: "0.8" },
  { path: "/holidays", changefreq: "weekly", priority: "0.8" },
  { path: "/ritu", changefreq: "weekly", priority: "0.7" },
  { path: "/kundali", changefreq: "monthly", priority: "0.7" },
  { path: "/jyotish/kundali-milan", changefreq: "monthly", priority: "0.7" },
  { path: "/learn", changefreq: "weekly", priority: "0.8" },
  { path: "/learn/history", changefreq: "monthly", priority: "0.6" },
  { path: "/suryakranti", changefreq: "weekly", priority: "0.7" },
  { path: "/abhijit-muhurta", changefreq: "weekly", priority: "0.7" },
  { path: "/panchak-patro", changefreq: "monthly", priority: "0.7" },
  { path: "/vivah-sait", changefreq: "weekly", priority: "0.8" },
];

/** Keep in sync with LEARN_TOPICS in src/lib/learn/learn-topics.tsx */
export const LEARN_ARTICLE_SLUGS = [
  "history",
  "astronomy-basics",
  "solar-system",
  "bs-calendar",
  "calendar-differences",
  "adhik-maas",
  "ritu-drift",
  "what-is-panchang",
  "tithi",
  "tithi-vriddhi",
  "tithi-kshaya",
  "nakshatra",
  "yoga",
  "karana",
  "sankranti",
  "hora",
  "eclipses",
  "ayanamsha",
];

/** Keep in sync with ELEMENT_META in src/lib/panchanga-elements.ts */
export const PANCHANGA_ELEMENT_IDS = [
  "tithi",
  "nakshatra",
  "yoga",
  "karana",
  "chandra-rashi",
  "choghadiya",
  "hora",
  "lagna",
  "udaya-lagna",
  "chandrabala",
  "tarabala",
  "panchaka-rahita",
  "pushkara",
];

/** Keep in sync with CEREMONY_META in src/lib/panchanga-elements.ts */
export const SAIT_CATEGORY_IDS = [
  "vivah",
  "bratabandha",
  "griha-aarambha",
  "griha-pravesh",
  "byaparik-pratisthan",
  "rudri-jurne",
  "agni-jurne",
  "annaprasan",
];

export const PRERENDER_EXTRA_PATHS = ["/account", "/verify-email", "/reset-password"];

/** @returns {SitemapEntry[]} */
export function buildSitemapEntries() {
  /** @type {SitemapEntry[]} */
  const entries = [
    ...STATIC_SITEMAP_ENTRIES,
    ...LEARN_ARTICLE_SLUGS.map((slug) => ({
      path: `/learn/${slug}`,
      changefreq: "monthly",
      priority: "0.6",
    })),
    ...PANCHANGA_ELEMENT_IDS.map((id) => ({
      path: `/panchanga/element/${id}`,
      changefreq: "weekly",
      priority: "0.6",
    })),
    ...SAIT_CATEGORY_IDS.map((id) => ({
      path: `/sait/${id}`,
      changefreq: "weekly",
      priority: "0.7",
    })),
  ];

  const seen = new Set();
  return entries.filter((e) => {
    if (seen.has(e.path)) return false;
    seen.add(e.path);
    return true;
  });
}

export const SITEMAP_ENTRIES = buildSitemapEntries();

export const PUBLIC_INDEXABLE_PATHS = SITEMAP_ENTRIES.map((e) => e.path);

export const PRERENDER_PATHS = [...PUBLIC_INDEXABLE_PATHS, ...PRERENDER_EXTRA_PATHS];
