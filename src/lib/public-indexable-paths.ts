import { LEARN_TOPIC_METAS } from "@/lib/learn/learn-topics-meta";
import { CEREMONY_META, ELEMENT_META } from "@/lib/panchanga-elements";

export type SitemapEntry = {
  path: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: string;
};

/** Static public routes (no dynamic segments). Keep in sync with scripts/indexable-routes.mjs */
const STATIC_ENTRIES: SitemapEntry[] = [
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

const DYNAMIC_ENTRIES: SitemapEntry[] = [
  ...LEARN_TOPIC_METAS.map((t) => ({
    path: `/learn/${t.slug}`,
    changefreq: "monthly" as const,
    priority: "0.6",
  })),
  ...ELEMENT_META.map((e) => ({
    path: `/panchanga/element/${e.id}`,
    changefreq: "weekly" as const,
    priority: "0.6",
  })),
  ...CEREMONY_META.map((c) => ({
    path: `/sait/${c.id}`,
    changefreq: "weekly" as const,
    priority: "0.7",
  })),
];

function dedupeByPath(entries: SitemapEntry[]): SitemapEntry[] {
  const seen = new Set<string>();
  const out: SitemapEntry[] = [];
  for (const entry of entries) {
    if (seen.has(entry.path)) continue;
    seen.add(entry.path);
    out.push(entry);
  }
  return out;
}

/** All routes that should appear in sitemap.xml (index, follow). */
export const SITEMAP_ENTRIES: SitemapEntry[] = dedupeByPath([
  ...STATIC_ENTRIES,
  ...DYNAMIC_ENTRIES,
]);

export const PUBLIC_INDEXABLE_PATHS: string[] = SITEMAP_ENTRIES.map((e) => e.path);

/** Build-time prerender: indexable pages plus auth screens (noindex in robots). */
export const PRERENDER_EXTRA_PATHS = ["/account", "/verify-email", "/reset-password"] as const;

export const PRERENDER_PATHS: string[] = [
  ...PUBLIC_INDEXABLE_PATHS,
  ...PRERENDER_EXTRA_PATHS,
];
