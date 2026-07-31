import { Link, Navigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useLocale, bilingualText } from "@/i18n/locale";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouteLoading } from "@/lib/route-loading";
import { PageShell } from "../components/PageShell";
import { History as HistoryPage } from "@/pages/History";
import {
  LEARN_CATEGORIES,
  LEARN_TOPICS_BY_SLUG,
  adjacentTopics,
} from "@/lib/learn/learn-topics";
import {
  tmHero,
  tmHeroEyebrow,
  tmHeroSub,
  tmHeroTitle,
  tmPageShell,
  tmWrap,
} from "@/lib/learn-classes";

const LEGACY_ECLIPSE_SLUGS: Record<string, string> = {
  "lunar-eclipse": "eclipses",
  "solar-eclipse": "eclipses",
};

export function LearnArticle() {
  const { t } = useTranslation();
  const { lang } = useLocale();
  useRouteLoading(false);
  const { slug } = useParams({ strict: false }) as { slug?: string };

  if (slug && LEGACY_ECLIPSE_SLUGS[slug]) {
    return <Navigate to="/learn/$slug" params={{ slug: LEGACY_ECLIPSE_SLUGS[slug] }} replace />;
  }

  if (slug === "history") {
    return <HistoryPage />;
  }

  const topic = slug ? LEARN_TOPICS_BY_SLUG[slug] : undefined;

  if (!topic) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p>{t("learn_page.topic_not_found")}</p>
          <Link
            to="/learn"
            className="inline-flex items-center gap-1.5 text-sm text-secondary"
          >
            <ArrowLeft className="size-4" /> {t("learn_page.back_hub")}
          </Link>
        </div>
      </PageShell>
    );
  }

  const category = LEARN_CATEGORIES.find((c) => c.id === topic.category);
  const { prev, next } = adjacentTopics(topic.slug);
  const Content = topic.Content;

  return (
    <PageShell>
      <Link
        to="/learn"
        className="inline-flex items-center gap-1.5 text-sm transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {t("learn_page.eyebrow")}
      </Link>

      <article className={cn(tmPageShell, "rounded-2xl border border-border overflow-hidden")}>
        <div className={tmWrap}>
          <header className={tmHero}>
            <div className={tmHeroEyebrow}>
              {category ? `${bilingualText(lang, category.ne, category.en)} · ` : ""}
              {bilingualText(lang, topic.titleEn, topic.titleNe)}
            </div>
            <h1 className={tmHeroTitle}>{bilingualText(lang, topic.titleNe, topic.titleEn)}</h1>
            <p className={tmHeroSub}>{bilingualText(lang, topic.summary, topic.summaryEn)}</p>
          </header>

          <Content />

          <nav className="mt-12 flex flex-col gap-3 sm:flex-row sm:justify-between">
            {prev ? (
              <Link
                to="/learn/$slug"
                params={{ slug: prev.slug }}
                className="group flex flex-1 items-center gap-2 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-secondary/60"
              >
                <ArrowLeft className="size-4 shrink-0 text-secondary" />
                <span className="min-w-0">
                  <span className="block text-sm uppercase tracking-wide">
                    {t("learn_page.prev")}
                  </span>
                  <span className="block truncate text-sm text-foreground">
                    {bilingualText(lang, prev.titleNe, prev.titleEn)}
                  </span>
                </span>
              </Link>
            ) : (
              <span className="hidden flex-1 sm:block" />
            )}
            {next ? (
              <Link
                to="/learn/$slug"
                params={{ slug: next.slug }}
                className="group flex flex-1 items-center justify-end gap-2 rounded-xl border border-border bg-card p-3 text-right transition-colors hover:border-secondary/60"
              >
                <span className="min-w-0">
                  <span className="block text-sm uppercase tracking-wide">
                    {t("learn_page.next")}
                  </span>
                  <span className="block truncate text-sm text-foreground">
                    {bilingualText(lang, next.titleNe, next.titleEn)}
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-secondary" />
              </Link>
            ) : (
              <span className="hidden flex-1 sm:block" />
            )}
          </nav>

          <div className="mt-6 text-center">
            <Link
              to="/learn"
              className="inline-flex items-center gap-1.5 text-sm text-secondary"
            >
              <BookOpen className="size-4" /> {t("learn_page.all_topics")}
            </Link>
          </div>
        </div>
      </article>
    </PageShell>
  );
}

export default LearnArticle;
