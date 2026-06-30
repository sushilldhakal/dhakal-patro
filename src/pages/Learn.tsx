import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ArrowRight,
  Search,
  Sparkles,
  Orbit,
  CalendarRange,
  ScrollText,
  Moon,
  Compass,
  X,
  GraduationCap,
  Layers3,
  History as HistoryIcon,
} from "lucide-react";
import { useRouteLoading } from "@/lib/route-loading";
import { PageShell } from "../components/PageShell";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  LEARN_CATEGORIES,
  LEARN_TOPICS,
  topicsInCategory,
  type LearnCategory,
  type LearnTopic,
} from "@/lib/learn/learn-topics";

const FEATURED_SLUGS = ["what-is-panchang", "tithi", "solar-system"] as const;

const STARTER_PATH_SLUGS = [
  "astronomy-basics",
  "solar-system",
  "what-is-panchang",
  "tithi",
  "nakshatra",
] as const;

const CATEGORY_META: Record<
  string,
  { icon: LucideIcon; chip: string; ring: string }
> = {
  astronomy: {
    icon: Orbit,
    chip: "bg-sky-500/10 text-sky-800 border-sky-500/25 dark:text-sky-200",
    ring: "group-hover:ring-sky-500/25",
  },
  calendars: {
    icon: CalendarRange,
    chip: "bg-amber-500/10 text-amber-900 border-amber-500/25 dark:text-amber-200",
    ring: "group-hover:ring-amber-500/25",
  },
  panchanga: {
    icon: ScrollText,
    chip: "bg-teal-500/10 text-teal-900 border-teal-500/25 dark:text-teal-200",
    ring: "group-hover:ring-teal-500/25",
  },
  eclipses: {
    icon: Moon,
    chip: "bg-violet-500/10 text-violet-900 border-violet-500/25 dark:text-violet-200",
    ring: "group-hover:ring-violet-500/25",
  },
  kundali: {
    icon: Compass,
    chip: "bg-rose-500/10 text-rose-900 border-rose-500/25 dark:text-rose-200",
    ring: "group-hover:ring-rose-500/25",
  },
};

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function topicMatchesQuery(topic: LearnTopic, query: string) {
  if (!query) return true;
  return (
    topic.titleNe.toLowerCase().includes(query) ||
    topic.titleEn.toLowerCase().includes(query) ||
    topic.summary.toLowerCase().includes(query) ||
    topic.slug.includes(query)
  );
}

function categoryForTopic(topic: LearnTopic): LearnCategory | undefined {
  return LEARN_CATEGORIES.find((c) => c.id === topic.category);
}

function TopicCard({
  topic,
  variant = "default",
}: {
  topic: LearnTopic;
  variant?: "default" | "featured" | "compact";
}) {
  const { t } = useTranslation();
  const Icon = topic.icon;
  const category = categoryForTopic(topic);
  const meta = CATEGORY_META[topic.category];

  if (variant === "featured") {
    return (
      <Link
        to="/learn/$slug"
        params={{ slug: topic.slug }}
        className="group relative flex h-full flex-col rounded-2xl border border-secondary/25 bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-secondary/50 hover:shadow-md"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/12 text-secondary">
            <Icon className="h-6 w-6" />
          </span>
          {category && meta && (
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                meta.chip,
              )}
            >
              {category.ne}
            </span>
          )}
        </div>
        <h3 className="text-xl font-bold leading-snug text-foreground">
          {topic.titleNe}
        </h3>
        <p className="mt-1 text-sm font-medium text-muted-foreground">{topic.titleEn}</p>
        <p className="mt-3 flex-1 text-base leading-relaxed text-foreground/80">
          {topic.summary}
        </p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary">
          {t("learn_page.read_start")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link
        to="/learn/$slug"
        params={{ slug: topic.slug }}
        className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-secondary/50 hover:bg-secondary/[0.05]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-semibold text-foreground">
            {topic.titleNe}
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            {topic.titleEn}
          </span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-secondary" />
      </Link>
    );
  }

  return (
    <Link
      to="/learn/$slug"
      params={{ slug: topic.slug }}
      className={cn(
        "group relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-secondary/45 hover:shadow-md",
        meta?.ring && `hover:ring-2 ${meta.ring}`,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition-colors group-hover:bg-secondary/15">
          <Icon className="h-5 w-5" />
        </span>
        {category && meta && (
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
              meta.chip,
            )}
          >
            {category.ne}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-lg font-bold leading-snug text-foreground">{topic.titleNe}</h3>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          {topic.titleEn}
        </p>
      </div>
      <p className="flex-1 text-base leading-relaxed text-foreground/80">
        {topic.summary}
      </p>
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary">
        {t("learn_page.read_detail")}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function Learn() {
  const { t } = useTranslation();
  useRouteLoading(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const normalizedQuery = normalizeSearch(query);
  const isFiltering = normalizedQuery.length > 0 || activeCategory !== "all";

  const featuredTopics = useMemo(
    () =>
      FEATURED_SLUGS.map((slug) => LEARN_TOPICS.find((t) => t.slug === slug)).filter(
        (t): t is LearnTopic => Boolean(t),
      ),
    [],
  );

  const starterPath = useMemo(
    () =>
      STARTER_PATH_SLUGS.map((slug) => LEARN_TOPICS.find((t) => t.slug === slug)).filter(
        (t): t is LearnTopic => Boolean(t),
      ),
    [],
  );

  const filteredTopics = useMemo(() => {
    return LEARN_TOPICS.filter((topic) => {
      const matchesCategory =
        activeCategory === "all" || topic.category === activeCategory;
      return matchesCategory && topicMatchesQuery(topic, normalizedQuery);
    });
  }, [activeCategory, normalizedQuery]);

  const visibleCategories = useMemo(() => {
    if (!isFiltering) return LEARN_CATEGORIES;
    const ids = new Set(filteredTopics.map((t) => t.category));
    return LEARN_CATEGORIES.filter((c) => ids.has(c.id));
  }, [filteredTopics, isFiltering]);

  return (
    <PageShell className="space-y-8">
      <section className="learn-hero rounded-3xl border border-border bg-card px-6 py-8 sm:px-10 sm:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary/8 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-secondary">
              <BookOpen className="h-4 w-4" />
              {t("learn_page.eyebrow")}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("learn_page.title")}
              <span className="block text-secondary">{t("learn_page.title_accent")}</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-foreground/80 sm:text-lg">
              {t("learn_page.subtitle")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="learn-stat-pill">
                <GraduationCap className="h-4 w-4 text-secondary" />
                <span>{t("learn_page.topics_count", { count: LEARN_TOPICS.length })}</span>
              </div>
              <div className="learn-stat-pill">
                <Layers3 className="h-4 w-4 text-secondary" />
                <span>{t("learn_page.categories_count", { count: LEARN_CATEGORIES.length })}</span>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md shrink-0">
            <label htmlFor="learn-search" className="sr-only">
              {t("learn_page.search_label")}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="learn-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("learn_page.search_placeholder")}
                className="h-12 pl-11 pr-11 text-base"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                  aria-label={t("common.clear_search")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {!isFiltering && (
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">{t("learn_page.featured_title")}</h2>
            <p className="mt-1 text-base text-muted-foreground">
              {t("learn_page.featured_sub")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTopics.map((topic) => (
              <TopicCard key={topic.slug} topic={topic} variant="featured" />
            ))}
          </div>
        </section>
      )}

      {!isFiltering && (
        <Link
          to="/learn/history"
          className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-secondary/50 sm:flex-row sm:items-center sm:gap-6 sm:p-7"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <HistoryIcon className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-secondary">
              {t("learn_page.history_eyebrow")}
            </div>
            <h2 className="mt-0.5 text-lg font-bold text-foreground sm:text-xl">
              {t("learn_page.history_title")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("learn_page.history_desc")}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-secondary">
            {t("common.read_more")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              activeCategory === "all"
                ? "border-secondary bg-secondary text-secondary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-secondary/40 hover:text-foreground",
            )}
          >
            {t("common.all")}
          </button>
          {LEARN_CATEGORIES.map((cat) => {
            const MetaIcon = CATEGORY_META[cat.id]?.icon ?? BookOpen;
            const count = topicsInCategory(cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  activeCategory === cat.id
                    ? "border-secondary bg-secondary text-secondary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-secondary/40 hover:text-foreground",
                )}
              >
                <MetaIcon className="h-3.5 w-3.5" />
                {cat.ne}
                <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
        {isFiltering && (
          <p className="text-base text-muted-foreground">
            {t("learn_page.results_count", { count: filteredTopics.length })}
          </p>
        )}
      </div>

      {!isFiltering && (
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-7">
          <div className="mb-5 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-secondary" />
            <h2 className="text-lg font-bold text-foreground sm:text-xl">
              {t("learn_page.starter_path")}
            </h2>
            <span className="text-sm text-muted-foreground">· {t("learn_page.suggested_path_sub")}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {starterPath.map((topic, index) => (
              <div key={topic.slug} className="relative">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-secondary">
                  {t("learn_page.step", { n: index + 1 })}
                </span>
                <TopicCard topic={topic} variant="compact" />
              </div>
            ))}
          </div>
        </section>
      )}

      {filteredTopics.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
          <p className="text-base font-medium text-foreground">{t("learn_page.no_topics")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("learn_page.no_topics_hint")}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveCategory("all");
            }}
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:underline"
          >
            {t("learn_page.clear_filters")}
          </button>
        </div>
      ) : isFiltering ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredTopics.map((topic) => (
            <TopicCard key={topic.slug} topic={topic} />
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          {visibleCategories.map((cat) => {
            const topics = topicsInCategory(cat.id);
            if (topics.length === 0) return null;
            const CatIcon = CATEGORY_META[cat.id]?.icon ?? BookOpen;

            return (
              <section key={cat.id} id={`learn-${cat.id}`}>
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                      <CatIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{cat.ne}</h2>
                      <p className="text-sm text-muted-foreground">
                        {cat.en} · {topics.length} articles
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className="text-sm font-semibold text-secondary hover:underline"
                  >
                    {t("learn_page.view_category")}
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {topics.map((topic) => (
                    <TopicCard key={topic.slug} topic={topic} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

export default Learn;
