import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CalendarRange,
  Compass,
  Eclipse,
  Grid3x3,
  Heart,
  HeartHandshake,
  Moon,
  MoonStar,
  Orbit,
  PartyPopper,
  Route,
  RotateCcw,
  Sparkles,
  Sprout,
  Sunrise,
  type LucideIcon,
} from "lucide-react";
import { useCalendarEra } from "@/hooks/use-calendar-era";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { elementBlurb, elementTitle } from "@/lib/panchanga-i18n";
import { LEARN_TOPICS_BY_SLUG } from "@/lib/learn/learn-topics-meta";
import { useLocale, bilingualText } from "@/i18n/locale";
import {
  getRelatedLearnSlugs,
  getRelatedSiteLinkIds,
  resolveSitePageId,
  shouldShowRelatedLinks,
  siteLinkRouteProps,
  SITE_LINK_BLURB_KEY,
  SITE_LINK_LABEL_KEY,
} from "@/lib/related-page-links";
import { cn } from "@/lib/utils";

const SITE_LINK_ICONS: Record<string, LucideIcon> = {
  panchanga: CalendarClock,
  "aakash-gochar": Orbit,
  holidays: PartyPopper,
  converter: ArrowLeftRight,
  suryakranti: Sunrise,
  "panchanga-year": CalendarRange,
  dainikkranti: Moon,
  "panchak-patro": CalendarClock,
  ritu: Sprout,
  "avakahada-chakra": Grid3x3,
  "abhijit-muhurta": Sparkles,
  kundali: Sparkles,
  "kundali-milan": Heart,
  gochar: Route,
  "graha-sthiti": Orbit,
  "graha-asta": Sunrise,
  "graha-vakri": RotateCcw,
  "chandra-grahan": MoonStar,
  "surya-grahan": Eclipse,
};

function iconForLinkId(id: string): LucideIcon {
  if (id.startsWith("element:") || id.startsWith("sait:")) return HeartHandshake;
  return SITE_LINK_ICONS[id] ?? Compass;
}

function RelatedNavCard({
  label,
  description,
  icon: Icon,
  to,
  params,
  search,
}: {
  label: string;
  description?: string;
  icon: LucideIcon;
  to: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
}) {
  return (
    <Link
      to={to}
      params={params}
      search={search}
      className="group flex items-start gap-2.5 rounded-xl border border-border/70 bg-card px-3 py-2.5 transition-colors hover:border-secondary/60 hover:bg-secondary/[0.04]"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground line-clamp-2">
            {description}
          </span>
        ) : null}
      </span>
      <ArrowRight
        className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-secondary"
        aria-hidden
      />
    </Link>
  );
}

export function RelatedPageLinks({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { lang } = useLocale();
  const { location } = usePanchangaLocation();
  const era = useCalendarEra();

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const params = useRouterState({
    select: (s) => {
      const match = s.matches[s.matches.length - 1];
      return (match?.params ?? {}) as Record<string, string>;
    },
  });

  if (!shouldShowRelatedLinks(pathname)) return null;

  const pageId = resolveSitePageId(pathname, params);
  if (!pageId) return null;

  const siteIds = getRelatedSiteLinkIds(pageId);
  const learnSlugs = getRelatedLearnSlugs(pageId);
  if (siteIds.length === 0 && learnSlugs.length === 0) return null;

  return (
    <aside
      className={cn("mt-10 border-t border-border pt-8", className)}
      aria-label={t("related_pages.aria")}
    >
      {siteIds.length > 0 ? (
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-secondary">
            <Compass className="size-4" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">{t("related_pages.heading")}</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {siteIds.map((linkId) => {
              const route = siteLinkRouteProps(linkId, location, era);
              const Icon = iconForLinkId(linkId);
              let label: string;
              let description: string | undefined;

              if (linkId.startsWith("element:")) {
                const elId = linkId.slice(8);
                label = elementTitle(elId);
                description = elementBlurb(elId);
              } else if (linkId.startsWith("sait:")) {
                const cat = linkId.slice(5);
                label = t(`sait.categories.${cat}`);
                description = t("sidebar_nav.items.sait_moment.blurb");
              } else {
                const labelKey = SITE_LINK_LABEL_KEY[linkId];
                label = labelKey ? t(labelKey) : linkId;
                const blurbKey = SITE_LINK_BLURB_KEY[linkId];
                description = blurbKey ? t(blurbKey) : undefined;
              }

              return (
                <RelatedNavCard
                  key={linkId}
                  label={label}
                  description={description}
                  icon={Icon}
                  to={route.to}
                  params={route.params}
                  search={route.search}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      {learnSlugs.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center gap-2 text-secondary">
            <BookOpen className="size-4" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">{t("related_pages.learn_heading")}</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {learnSlugs.map((slug) => {
              const topic = LEARN_TOPICS_BY_SLUG[slug];
              if (!topic) return null;
              const Icon = topic.icon;
              return (
                <Link
                  key={slug}
                  to="/learn/$slug"
                  params={{ slug }}
                  className="group flex items-start gap-2.5 rounded-xl border border-border/70 bg-card px-3 py-2.5 transition-colors hover:border-secondary/60 hover:bg-secondary/[0.04]"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {bilingualText(lang, topic.titleNe, topic.titleEn)}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground line-clamp-2">
                      {bilingualText(lang, topic.summary, topic.summaryEn)}
                    </span>
                  </span>
                  <ArrowRight
                    className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-secondary"
                    aria-hidden
                  />
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </aside>
  );
}
