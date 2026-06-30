#!/usr/bin/env node
/**
 * Regenerates public/sitemap.xml from the app route list.
 * Run: node scripts/generate-sitemap.mjs
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SITE = "https://www.vedicpatro.com";

const LEARN_SLUGS = [
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

/** @type {{ path: string; changefreq: string; priority: string }[]} */
const ROUTES = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/panchanga", changefreq: "daily", priority: "0.9" },
  { path: "/panchanga/year", changefreq: "weekly", priority: "0.7" },
  { path: "/panchanga/avakahada-chakra", changefreq: "monthly", priority: "0.6" },
  { path: "/chandrakranti", changefreq: "weekly", priority: "0.8" },
  { path: "/shanti-vidhi", changefreq: "monthly", priority: "0.6" },
  { path: "/converter", changefreq: "monthly", priority: "0.8" },
  { path: "/holidays", changefreq: "weekly", priority: "0.8" },
  { path: "/kundali", changefreq: "monthly", priority: "0.7" },
  { path: "/learn", changefreq: "weekly", priority: "0.8" },
  { path: "/learn/history", changefreq: "monthly", priority: "0.6" },
  { path: "/suryakranti", changefreq: "weekly", priority: "0.7" },
  { path: "/abhijit-muhurta", changefreq: "weekly", priority: "0.7" },
  ...LEARN_SLUGS.map((slug) => ({
    path: `/learn/${slug}`,
    changefreq: "monthly",
    priority: "0.6",
  })),
];

const urls = ROUTES.map(
  (r) => `  <url>
    <loc>${SITE}${r.path}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
).join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "..", "public", "sitemap.xml");
writeFileSync(out, xml, "utf8");
console.log(`Wrote ${ROUTES.length} URLs → public/sitemap.xml`);
