import { Link, Navigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { useRouteLoading } from "@/lib/route-loading";
import { PageShell } from "../components/PageShell";
import {
  LEARN_CATEGORIES,
  LEARN_TOPICS_BY_SLUG,
  adjacentTopics,
} from "@/lib/learn/learn-topics";

const LEGACY_ECLIPSE_SLUGS: Record<string, string> = {
  "lunar-eclipse": "eclipses",
  "solar-eclipse": "eclipses",
};

export function LearnArticle() {
  useRouteLoading(false);
  const { slug } = useParams({ strict: false }) as { slug?: string };

  if (slug && LEGACY_ECLIPSE_SLUGS[slug]) {
    return <Navigate to="/learn/$slug" params={{ slug: LEGACY_ECLIPSE_SLUGS[slug] }} replace />;
  }

  const topic = slug ? LEARN_TOPICS_BY_SLUG[slug] : undefined;

  if (!topic) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">यो विषय भेटिएन।</p>
          <Link
            to="/learn"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> ज्ञानकेन्द्रमा फर्कनुहोस्
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
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> ज्ञानकेन्द्र
      </Link>

      <article className="tm-page rounded-2xl border border-border overflow-hidden">
        <div className="tm-wrap">
          <header className="tm-hero">
            <div className="tm-hero-eyebrow">
              {category ? `${category.ne} · ` : ""}
              {topic.titleEn}
            </div>
            <h1 className="tm-hero-title">{topic.titleNe}</h1>
            <p className="tm-hero-sub">{topic.summary}</p>
          </header>

          <Content />

          <nav className="mt-12 flex flex-col gap-3 sm:flex-row sm:justify-between">
            {prev ? (
              <Link
                to="/learn/$slug"
                params={{ slug: prev.slug }}
                className="group flex flex-1 items-center gap-2 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-secondary/60"
              >
                <ArrowLeft className="h-4 w-4 shrink-0 text-secondary" />
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                    अघिल्लो
                  </span>
                  <span className="block truncate text-sm font-medium text-foreground">
                    {prev.titleNe}
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
                  <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                    अर्को
                  </span>
                  <span className="block truncate text-sm font-medium text-foreground">
                    {next.titleNe}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-secondary" />
              </Link>
            ) : (
              <span className="hidden flex-1 sm:block" />
            )}
          </nav>

          <div className="mt-6 text-center">
            <Link
              to="/learn"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary"
            >
              <BookOpen className="h-4 w-4" /> सबै विषय हेर्नुहोस्
            </Link>
          </div>
        </div>
      </article>
    </PageShell>
  );
}

export default LearnArticle;
