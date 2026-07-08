import { LEARN_TOPICS, LEARN_TOPICS_BY_SLUG } from "@/lib/learn/learn-topics";

export const SITE_NAME = "Vedic Patro";
export const SITE_URL = "https://www.vedicpatro.com";

export interface PageSeoMeta {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  noindex: boolean;
  type: "website" | "article";
}

type TFunc = (key: string) => string;

const ROUTE_SEO_KEYS: Record<string, string> = {
  "/": "seo.routes.home",
  "/panchanga": "seo.routes.panchanga",
  "/panchanga/year": "seo.routes.panchanga_year",
  "/panchanga/avakahada-chakra": "seo.routes.avakahada",
  "/dainikkranti": "seo.routes.dainikkranti",
  "/chandrakranti": "seo.routes.dainikkranti",
  "/दैनिकक्रान्ति": "seo.routes.dainikkranti",
  "/shanti-vidhi": "seo.routes.shanti_vidhi",
  "/converter": "seo.routes.converter",
  "/holidays": "seo.routes.holidays",
  "/ritu": "seo.routes.ritu",
  "/kundali": "seo.routes.kundali",
  "/jyotish/kundali-milan": "seo.routes.kundali_milan",
  "/learn": "seo.routes.learn",
  "/learn/history": "seo.routes.learn_history",
  "/suryakranti": "seo.routes.suryakranti",
  "/abhijit-muhurta": "seo.routes.abhijit_muhurta",
  "/panchak-patro": "seo.routes.panchak_patro",
  "/account": "seo.routes.account",
  "/verify-email": "seo.routes.verify_email",
  "/reset-password": "seo.routes.reset_password",
};

function isNoindexPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  return (
    normalized === "/account" ||
    normalized === "/verify-email" ||
    normalized === "/reset-password" ||
    /^\/kundali\/[^/]+/.test(normalized)
  );
}

export function resolvePageSeo(pathname: string, t: TFunc, _lang: string): PageSeoMeta {
  const normalized = pathname.replace(/\/$/, "") || "/";
  const canonical = `${SITE_URL}${normalized}`;
  const noindex = isNoindexPath(normalized);

  const learnMatch = normalized.match(/^\/learn\/([^/]+)$/);
  if (learnMatch && learnMatch[1] !== "history") {
    const topic = LEARN_TOPICS_BY_SLUG[learnMatch[1]!];
    if (topic) {
      return {
        title: `${topic.titleEn} | ${SITE_NAME}`,
        description: topic.summary,
        keywords: t("seo.site_keywords"),
        canonical,
        noindex,
        type: "article",
      };
    }
  }

  const routeKey = ROUTE_SEO_KEYS[normalized];
  if (routeKey) {
    const keywords = t(`${routeKey}.keywords`);
    return {
      title: t(`${routeKey}.title`),
      description: t(`${routeKey}.description`),
      keywords: keywords || t("seo.site_keywords"),
      canonical,
      noindex,
      type: "website",
    };
  }

  return {
    title: t("seo.routes.home.title"),
    description: t("seo.default_description"),
    keywords: t("seo.site_keywords"),
    canonical,
    noindex,
    type: "website",
  };
}

export function buildJsonLd(meta: PageSeoMeta): Record<string, unknown> {
  if (meta.type === "article") {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: meta.title,
      description: meta.description,
      url: meta.canonical,
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    description: meta.description,
    url: meta.canonical,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Static head tags injected at prerender time (Nepali default locale). */
export function buildHeadHtml(pathname: string, t: TFunc): string {
  const meta = resolvePageSeo(pathname, t, "ne");
  const jsonLd = JSON.stringify(buildJsonLd(meta)).replace(/</g, "\\u003c");

  const lines = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="keywords" content="${escapeHtml(meta.keywords)}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
    meta.noindex
      ? `<meta name="robots" content="noindex, nofollow" />`
      : `<meta name="robots" content="index, follow" />`,
    `<meta property="og:type" content="${meta.type === "article" ? "article" : "website"}" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`,
    `<meta property="og:locale" content="ne_NP" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<script type="application/ld+json">${jsonLd}</script>`,
  ];

  return lines.join("\n    ");
}

/** Public routes pre-rendered at build time for crawlers and first paint. */
export const PRERENDER_PATHS: string[] = [
  "/",
  "/panchanga",
  "/panchanga/year",
  "/panchanga/avakahada-chakra",
  "/dainikkranti",
  "/shanti-vidhi",
  "/converter",
  "/holidays",
  "/ritu",
  "/kundali",
  "/jyotish/kundali-milan",
  "/learn",
  "/learn/history",
  "/suryakranti",
  "/abhijit-muhurta",
  "/panchak-patro",
  "/account",
  "/verify-email",
  "/reset-password",
  ...LEARN_TOPICS.map((t) => `/learn/${t.slug}`),
];
