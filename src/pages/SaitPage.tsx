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
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { CEREMONY_META } from "@/lib/panchanga-elements";
import { isMuhurtaSaitCategory, type SaitCategoryId } from "@/lib/sait-data";
import { SAIT_RULES_CONTENT } from "@/lib/sait-rules-content";
import { SaitRulesSection } from "@/components/sait/SaitRulesSection";
import { SaitDayCard } from "@/components/sait/SaitDayCard";
import { fetchSait, fetchSaitDetail, saitDetailKey, saitKeys } from "@/lib/api";

export function SaitPage() {
  const { category } = useParams({ strict: false }) as { category?: string };
  const { pick, digits, lang } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const meta = CEREMONY_META.find((c) => c.id === category);
  const isMuhurta = category ? isMuhurtaSaitCategory(category) : false;
  const content = meta ? SAIT_RULES_CONTENT[meta.id as SaitCategoryId] : undefined;

  const todayBs = adToBS(new Date());
  const [year, setYear] = useState(todayBs.year);

  // Lagna-based ceremonies get the full per-day muhūrta detail (like vivāha);
  // the deterministic Vās ceremonies (rudri / agni) only have a month/day list.
  const detailQuery = useQuery({
    queryKey: saitDetailKey(year, category ?? "", location.params),
    queryFn: () => fetchSaitDetail(year, category!, location.params),
    enabled: Boolean(category) && isMuhurta,
    staleTime: 1000 * 60 * 60,
    placeholderData: keepPreviousData,
  });

  const datesQuery = useQuery({
    queryKey: saitKeys.entries(year, category ?? "", location.params),
    queryFn: () => fetchSait(year, category!, location.params),
    enabled: Boolean(category) && !isMuhurta,
    staleTime: 1000 * 60 * 60,
    placeholderData: keepPreviousData,
  });

  const activeQuery = isMuhurta ? detailQuery : datesQuery;
  useRouteLoading(Boolean(meta) && activeQuery.isLoading && !activeQuery.data);

  if (!meta || !content) {
    return (
      <PageShell>
        <PageHeader icon={<CalendarHeart className="h-6 w-6 text-secondary" />} title={pick("अज्ञात मुहूर्त", "Unknown ceremony")} />
        <Link to="/panchanga/details" className="text-sm text-primary underline">
          {pick("पञ्चाङ्ग विवरणमा फर्कनुहोस्", "Back to panchanga details")}
        </Link>
      </PageShell>
    );
  }

  const days = detailQuery.data?.days ?? [];

  return (
    <PageShell>
      <PageHeader
        icon={<CalendarHeart className="h-6 w-6 text-secondary" />}
        title={pick(`${meta.ne} साइत`, `${meta.en} muhurta`)}
        subtitle={pick(content.description.ne, content.description.en)}
      />

      {/* How the dates for this ceremony are computed (per-ceremony rules). */}
      <SaitRulesSection
        method={content.method}
        rules={content.rules}
        engineVersion={detailQuery.data?.engine_version}
      />

      {content.requiresBirthDate ? (
        <div className={cn(patroCard, "flex gap-2.5 border-l-2 border-secondary p-3.5")}>
          <Info className="mt-0.5 size-4 shrink-0 text-secondary" />
          <p className="text-sm text-danger">
            {pick("यसका लागि शिशुको जन्म मिति आवश्यक पर्दछ।", "Requires the child's birth date.")}
          </p>
        </div>
      ) : null}

      {/* Year navigator + location */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5">
          <button type="button" onClick={() => setYear((y) => y - 1)} className="flex size-8 items-center justify-center rounded-md hover:bg-surface-hover" aria-label={pick("अघिल्लो वर्ष", "Previous year")}>
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-[6rem] text-center text-sm font-bold text-foreground">{pick(`वि.सं. ${digits(year)}`, `BS ${digits(year)}`)}</span>
          <button type="button" onClick={() => setYear((y) => y + 1)} className="flex size-8 items-center justify-center rounded-md hover:bg-surface-hover" aria-label={pick("अर्को वर्ष", "Next year")}>
            <ChevronRight size={18} />
          </button>
        </div>
        <LocationSelector
          compact
          location={location}
          onLocationChange={setLocation}
          className="ml-auto h-9 min-w-0 w-auto max-w-[12.5rem]"
        />
      </div>

      {isMuhurta ? (
        detailQuery.isLoading && !detailQuery.data ? (
          <p className="text-sm">{pick("लोड हुँदै…", "Loading…")}</p>
        ) : days.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground">
              {pick(
                `वि.सं. ${digits(year)} मा ${digits(days.length)} शुभ दिन।`,
                `${digits(days.length)} auspicious days in BS ${digits(year)}.`,
              )}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {days.map((d) => (
                <SaitDayCard key={`${d.bs_month}-${d.bs_day}`} d={d} />
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm">{pick("यस वर्ष कुनै शुभ मुहूर्त छैन।", "No auspicious muhūrta this year.")}</p>
        )
      ) : datesQuery.isLoading && !datesQuery.data ? (
        <p className="text-sm">{pick("लोड हुँदै…", "Loading…")}</p>
      ) : datesQuery.data && datesQuery.data.months.length > 0 ? (
        <div className="flex flex-col gap-2">
          {datesQuery.data.months.map((m) => (
            <div key={m.month} className={cn(patroCard, "flex flex-col gap-1.5 p-3 sm:flex-row sm:items-center sm:gap-3")}>
              <span className="w-24 shrink-0 text-sm font-bold text-foreground">
                {lang === "en" ? `Month ${digits(m.month)}` : m.month_name_ne}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {m.days.map((d) => (
                  <span key={d} className="font-num inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-success/12 px-1.5 text-sm font-semibold text-success-foreground tabular-nums dark:text-success">
                    {digits(d)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm">{pick("यस वर्षका लागि साइत सूची उपलब्ध छैन।", "No auspicious dates listed for this year.")}</p>
      )}

      <p className="mt-6 text-sm">
        <Link to="/panchanga/details" className="text-primary underline">
          {pick("← सबै शुभ मुहूर्त", "← All ceremonies")}
        </Link>
      </p>
    </PageShell>
  );
}

export default SaitPage;
