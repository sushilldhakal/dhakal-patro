import { Link } from "@tanstack/react-router";
import { BookOpen, ArrowRight } from "lucide-react";
import { PageShell, PageHeader } from "../components/PageShell";
import {
  LEARN_CATEGORIES,
  topicsInCategory,
} from "@/lib/learn/learn-topics";

export function Learn() {
  return (
    <PageShell>
      <PageHeader
        icon={<BookOpen className="w-6 h-6 text-secondary" />}
        title="ज्ञानकेन्द्र · Learn"
        subtitle="नेपाली पात्रो, पञ्चाङ्ग, ग्रहण र ज्योतिषका आधारभूत कुरा सरल भाषामा"
      />

      <div className="space-y-10">
        {LEARN_CATEGORIES.map((cat) => {
          const topics = topicsInCategory(cat.id);
          if (topics.length === 0) return null;
          return (
            <section key={cat.id}>
              <div className="flex items-baseline gap-3 mb-4">
                <h2 className="text-lg font-bold text-foreground">{cat.ne}</h2>
                <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  {cat.en}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {topics.map((t) => {
                  const Icon = t.icon;
                  return (
                    <Link
                      key={t.slug}
                      to="/learn/$slug"
                      params={{ slug: t.slug }}
                      className="group relative flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-secondary/60 hover:bg-secondary/[0.04]"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                          <Icon className="h-[18px] w-[18px]" />
                        </span>
                        <span className="font-semibold leading-tight text-foreground">
                          {t.titleNe}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {t.summary}
                      </p>
                      <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-medium text-secondary opacity-0 transition-opacity group-hover:opacity-100">
                        पढ्नुहोस् <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </PageShell>
  );
}

export default Learn;
