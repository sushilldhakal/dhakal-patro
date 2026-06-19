import { useMemo, useState } from "react";
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
} from "lucide-react";
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
    chip: "bg-sky-500/15 text-sky-300 border-sky-500/25",
    ring: "group-hover:ring-sky-500/30",
  },
  calendars: {
    icon: CalendarRange,
    chip: "bg-amber-500/15 text-amber-200 border-amber-500/25",
    ring: "group-hover:ring-amber-500/30",
  },
  panchanga: {
    icon: ScrollText,
    chip: "bg-teal-500/15 text-teal-200 border-teal-500/25",
    ring: "group-hover:ring-teal-500/30",
  },
  eclipses: {
    icon: Moon,
    chip: "bg-violet-500/15 text-violet-200 border-violet-500/25",
    ring: "group-hover:ring-violet-500/30",
  },
  kundali: {
    icon: Compass,
    chip: "bg-rose-500/15 text-rose-200 border-rose-500/25",
    ring: "group-hover:ring-rose-500/30",
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
  const Icon = topic.icon;
  const category = categoryForTopic(topic);
  const meta = CATEGORY_META[topic.category];

  if (variant === "featured") {
    return (
      <Link
        to="/learn/$slug"
        params={{ slug: topic.slug }}
        className="learn-featured-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-all hover:border-[#6fd4d2]/40 hover:bg-white/[0.07]"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#6fd4d2]/15 text-[#6fd4d2] ring-1 ring-[#6fd4d2]/20">
            <Icon className="h-5 w-5" />
          </span>
          {category && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
              {category.en}
            </span>
          )}
        </div>
        <h3 className="text-base font-bold leading-snug text-[#eaf3f1]">
          {topic.titleNe}
        </h3>
        <p className="mt-1 text-xs font-medium text-[#ffd70a]/90">{topic.titleEn}</p>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-white/60">
          {topic.summary}
        </p>
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#6fd4d2]">
          पढ्न सुरु गर्नुहोस्
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link
        to="/learn/$slug"
        params={{ slug: topic.slug }}
        className="group flex items-center gap-3 rounded-xl border border-border bg-card/60 px-3 py-2.5 transition-colors hover:border-secondary/50 hover:bg-secondary/[0.05]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">
            {topic.titleNe}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {topic.titleEn}
          </span>
        </span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-secondary" />
      </Link>
    );
  }

  return (
    <Link
      to="/learn/$slug"
      params={{ slug: topic.slug }}
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-secondary/45 hover:shadow-md",
        meta?.ring && `hover:ring-2 ${meta.ring}`,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition-colors group-hover:bg-secondary/15">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        {category && meta && (
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
              meta.chip,
            )}
          >
            {category.ne}
          </span>
        )}
      </div>
      <div>
        <h3 className="font-bold leading-snug text-foreground">{topic.titleNe}</h3>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
          {topic.titleEn}
        </p>
      </div>
      <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
        {topic.summary}
      </p>
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary">
        विस्तृत पढ्नुहोस्
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function Learn() {
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
      <section className="learn-hero relative overflow-hidden rounded-3xl border border-border">
        <div className="learn-hero-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#ffd70a]/25 bg-[#ffd70a]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ffd70a]">
                <BookOpen className="h-3.5 w-3.5" />
                ज्ञानकेन्द्र
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[#eaf3f1] sm:text-4xl">
                नेपाली पात्रो र पञ्चाङ्ग
                <span className="block text-[#6fd4d2]">सरल भाषामा बुझौं</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
                तिथि, नक्षत्र, ग्रहण, विक्रम सम्वत् र कुण्डली — खगोलीय आधारदेखि
                दैनिक प्रयोगसम्मका लेखहरू।
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="learn-stat-pill">
                  <GraduationCap className="h-4 w-4 text-[#6fd4d2]" />
                  <span>{LEARN_TOPICS.length} विषय</span>
                </div>
                <div className="learn-stat-pill">
                  <Layers3 className="h-4 w-4 text-[#ffd70a]" />
                  <span>{LEARN_CATEGORIES.length} श्रेणी</span>
                </div>
              </div>
            </div>

            <div className="w-full max-w-md shrink-0">
              <label htmlFor="learn-search" className="sr-only">
                विषय खोज्नुहोस्
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                <Input
                  id="learn-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="तिथि, ग्रहण, अयनांश…"
                  className="h-11 border-white/15 bg-black/25 pl-10 pr-10 text-[#eaf3f1] placeholder:text-white/40 focus-visible:border-[#6fd4d2]/60 focus-visible:ring-[#6fd4d2]/25"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="खोज मेट्नुहोस्"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {!isFiltering && (
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {featuredTopics.map((topic) => (
                <TopicCard key={topic.slug} topic={topic} variant="featured" />
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              activeCategory === "all"
                ? "border-secondary bg-secondary text-secondary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-secondary/40 hover:text-foreground",
            )}
          >
            सबै
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
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
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
          <p className="text-sm text-muted-foreground">
            {filteredTopics.length} विषय भेटियो
          </p>
        )}
      </div>

      {!isFiltering && (
        <section className="rounded-2xl border border-border bg-card/50 p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-secondary" />
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-foreground">
              सुरुवाती मार्ग
            </h2>
            <span className="text-xs text-muted-foreground">· Suggested path</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {starterPath.map((topic, index) => (
              <div key={topic.slug} className="relative">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-secondary/80">
                  चरण {index + 1}
                </span>
                <TopicCard topic={topic} variant="compact" />
              </div>
            ))}
          </div>
        </section>
      )}

      {filteredTopics.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
          <p className="text-base font-medium text-foreground">कुनै विषय भेटिएन</p>
          <p className="mt-1 text-sm text-muted-foreground">
            फरक शब्द वा श्रेणी छानेर फेरि प्रयास गर्नुहोस्।
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveCategory("all");
            }}
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:underline"
          >
            सबै फिल्टर हटाउनुहोस्
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
                      <h2 className="text-xl font-bold text-foreground">{cat.ne}</h2>
                      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                        {cat.en} · {topics.length} articles
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className="text-xs font-semibold text-secondary hover:underline"
                  >
                    यो श्रेणी मात्र हेर्नुहोस्
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
