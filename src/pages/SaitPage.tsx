import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CalendarHeart, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import { patroCard } from "@/lib/patro-classes";
import { adToBS } from "@/lib/bs-calendar";
import { useRouteLoading } from "@/lib/route-loading";
import { CEREMONY_META } from "@/lib/panchanga-elements";
import { fetchSait, fetchSaitAboutCategory, saitKeys } from "@/lib/api";

export function SaitPage() {
  const { category } = useParams({ strict: false }) as { category?: string };
  const { pick, digits, lang } = useLocale();
  const meta = CEREMONY_META.find((c) => c.id === category);

  const todayBs = adToBS(new Date());
  const [year, setYear] = useState(todayBs.year);

  const aboutQuery = useQuery({
    queryKey: ["sait", "about", category ?? ""],
    queryFn: () => fetchSaitAboutCategory(category!),
    enabled: Boolean(category),
    staleTime: Infinity,
  });

  const datesQuery = useQuery({
    queryKey: saitKeys.entries(year, category ?? ""),
    queryFn: () => fetchSait(year, category!),
    enabled: Boolean(category),
    staleTime: 1000 * 60 * 60,
    placeholderData: keepPreviousData,
  });

  useRouteLoading(Boolean(meta) && datesQuery.isLoading && !datesQuery.data);

  if (!meta) {
    return (
      <PageShell>
        <PageHeader icon={<CalendarHeart className="h-6 w-6 text-secondary" />} title={pick("अज्ञात मुहूर्त", "Unknown ceremony")} />
        <Link to="/panchanga/details" className="text-sm text-primary underline">
          {pick("पञ्चाङ्ग विवरणमा फर्कनुहोस्", "Back to panchanga details")}
        </Link>
      </PageShell>
    );
  }

  const about = aboutQuery.data;
  const method = about?.method ? pick(about.method.ne ?? "", about.method.en ?? "") : "";

  return (
    <PageShell>
      <PageHeader
        icon={<CalendarHeart className="h-6 w-6 text-secondary" />}
        title={pick(`${meta.ne} साइत`, `${meta.en} muhurta`)}
        subtitle={about ? pick(about.description_ne ?? "", about.description_en ?? "") : undefined}
      />

      {method ? (
        <div className={cn(patroCard, "mb-4 flex gap-2.5 border-l-2 border-secondary p-3.5")}>
          <Info className="mt-0.5 size-4 shrink-0 text-secondary" />
          <div className="flex flex-col gap-1">
            <p className="text-[13px] leading-relaxed text-foreground">{method}</p>
            {about?.source ? (
              <p className="text-[11px] text-muted-foreground">
                {pick("स्रोत", "Source")}: {about.source}
              </p>
            ) : null}
            {about?.requires_birth_date ? (
              <p className="text-[11px] font-medium text-danger">
                {pick("यसका लागि शिशुको जन्म मिति आवश्यक पर्दछ।", "Requires the child's birth date.")}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Year navigator */}
      <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-2 py-1.5">
        <button type="button" onClick={() => setYear((y) => y - 1)} className="flex size-8 items-center justify-center rounded-md hover:bg-surface-hover" aria-label={pick("अघिल्लो वर्ष", "Previous year")}>
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold text-foreground">{pick(`वि.सं. ${digits(year)}`, `BS ${digits(year)}`)}</span>
        <button type="button" onClick={() => setYear((y) => y + 1)} className="flex size-8 items-center justify-center rounded-md hover:bg-surface-hover" aria-label={pick("अर्को वर्ष", "Next year")}>
          <ChevronRight size={18} />
        </button>
      </div>

      {datesQuery.isLoading && !datesQuery.data ? (
        <p className="text-sm text-muted-foreground">{pick("लोड हुँदै…", "Loading…")}</p>
      ) : datesQuery.data && datesQuery.data.months.length > 0 ? (
        <div className="flex flex-col gap-2">
          {datesQuery.data.months.map((m) => (
            <div key={m.month} className={cn(patroCard, "flex flex-col gap-1.5 p-3 sm:flex-row sm:items-center sm:gap-3")}>
              <span className="w-24 shrink-0 text-[13px] font-bold text-foreground">
                {lang === "en" ? `Month ${digits(m.month)}` : m.month_name_ne}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {m.days.map((d) => (
                  <span key={d} className="font-num inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-success/12 px-1.5 text-[12.5px] font-semibold text-success-foreground tabular-nums dark:text-success">
                    {digits(d)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{pick("यस वर्षका लागि साइत सूची उपलब्ध छैन।", "No auspicious dates listed for this year.")}</p>
      )}

      <p className="mt-6 text-[12px] text-muted-foreground">
        <Link to="/panchanga/details" className="text-primary underline">
          {pick("← सबै शुभ मुहूर्त", "← All ceremonies")}
        </Link>
      </p>
    </PageShell>
  );
}

export default SaitPage;
