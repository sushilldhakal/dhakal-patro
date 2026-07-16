import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CalendarHeart, Info } from "lucide-react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import { patroCard } from "@/lib/patro-classes";
import { adToBS } from "@/lib/bs-calendar";
import { useRouteLoading } from "@/lib/route-loading";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { CEREMONY_META } from "@/lib/panchanga-elements";
import { isMuhurtaSaitCategory, type SaitCategoryId } from "@/lib/sait-data";
import { SAIT_RULES_CONTENT } from "@/lib/sait-rules-content";
import { SaitCeremonyLayout } from "@/components/sait/SaitCeremonyLayout";
import {
  fetchSait,
  fetchSaitDetail,
  saitDetailKey,
  saitKeys,
  type BratabandhaNakshatraMode,
} from "@/lib/api";

export function SaitPage() {
  const { category } = useParams({ strict: false }) as { category?: string };
  const { pick, digits, lang } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const meta = CEREMONY_META.find((c) => c.id === category);
  const isMuhurta = category ? isMuhurtaSaitCategory(category) : false;
  const content = meta ? SAIT_RULES_CONTENT[meta.id as SaitCategoryId] : undefined;
  const isBratabandha = category === "bratabandha";

  const todayBs = adToBS(new Date());
  const [year, setYear] = useState(todayBs.year);

  // Community rule toggles: ids the user has switched OFF. Reset when the
  // ceremony changes so one ceremony's picks don't leak into another.
  const [disabledRules, setDisabledRules] = useState<Set<string>>(() => new Set());
  const [nakshatraMode, setNakshatraMode] =
    useState<BratabandhaNakshatraMode>("classical");
  useEffect(() => {
    setDisabledRules(new Set());
    setNakshatraMode("classical");
  }, [category]);

  const toggleableIds = useMemo(
    () =>
      (content?.rules ?? [])
        .map((r) => r.id)
        .filter((id): id is string => Boolean(id)),
    [content],
  );
  const hasToggles = isMuhurta && toggleableIds.length > 0;
  const enabledRuleIds = useMemo(
    () => new Set(toggleableIds.filter((id) => !disabledRules.has(id))),
    [toggleableIds, disabledRules],
  );
  const excludeRules = useMemo(() => [...disabledRules], [disabledRules]);
  const handleToggleRule = (id: string, enabled: boolean) =>
    setDisabledRules((prev) => {
      const next = new Set(prev);
      if (enabled) next.delete(id);
      else next.add(id);
      return next;
    });

  const detailQuery = useQuery({
    queryKey: saitDetailKey(
      year,
      category ?? "",
      location.params,
      excludeRules,
      isBratabandha ? nakshatraMode : null,
    ),
    queryFn: () =>
      fetchSaitDetail(
        year,
        category!,
        location.params,
        excludeRules,
        isBratabandha ? nakshatraMode : null,
      ),
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
        <PageHeader
          icon={<CalendarHeart className="h-6 w-6 text-secondary" />}
          title={pick("अज्ञात मुहूर्त", "Unknown ceremony")}
        />
        <Link to="/panchanga/details" className="text-sm text-primary underline">
          {pick("पञ्चाङ्ग विवरणमा फर्कनुहोस्", "Back to panchanga details")}
        </Link>
      </PageShell>
    );
  }

  return (
    <SaitCeremonyLayout
      title={pick(`${meta.ne} साइत`, `${meta.en} Saait`)}
      subtitle={pick(content.description.ne, content.description.en)}
      year={year}
      onYearChange={setYear}
      location={location}
      onLocationChange={setLocation}
      method={content.method}
      rules={content.rules}
      engineVersion={detailQuery.data?.engine_version}
      enabledRuleIds={hasToggles ? enabledRuleIds : undefined}
      onToggleRule={hasToggles ? handleToggleRule : undefined}
      rulesBusy={detailQuery.isFetching && !detailQuery.isLoading}
      nakshatraMode={isBratabandha ? nakshatraMode : null}
      onNakshatraModeChange={isBratabandha ? setNakshatraMode : undefined}
      days={isMuhurta ? (detailQuery.data?.days ?? []) : []}
      loading={activeQuery.isLoading && !activeQuery.data}
      notice={
        content.requiresBirthDate ? (
          <div className={cn(patroCard, "flex gap-2.5 border-l-2 border-secondary p-3.5")}>
            <Info className="mt-0.5 size-4 shrink-0 text-secondary" />
            <p className="m-0 text-sm text-danger">
              {pick("यसका लागि शिशुको जन्म मिति आवश्यक पर्दछ।", "Requires the child's birth date.")}
            </p>
          </div>
        ) : null
      }
      emptyLabel={{
        ne: "यस वर्ष कुनै शुभ मुहूर्त छैन।",
        en: "No auspicious muhūrta this year.",
      }}
      countLabel={(count, y) => ({
        ne: `वि.सं. ${digits(y)} मा ${digits(count)} शुभ दिन`,
        en: `${digits(count)} auspicious days in BS ${digits(y)}`,
      })}
    >
      {!isMuhurta ? (
        datesQuery.isLoading && !datesQuery.data ? (
          <div className="grid gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-muted" />
            ))}
          </div>
        ) : datesQuery.data && datesQuery.data.months.length > 0 ? (
          <div className="flex flex-col gap-2">
            {datesQuery.data.months.map((m) => (
              <div
                key={m.month}
                className={cn(
                  patroCard,
                  "flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:gap-4",
                )}
              >
                <span className="w-28 shrink-0 text-sm font-bold text-foreground">
                  {lang === "en" ? `Month ${digits(m.month)}` : m.month_name_ne}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {m.days.map((d) => (
                    <span
                      key={d}
                      className="font-num inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-success/12 px-2 text-sm font-semibold text-success-foreground tabular-nums dark:text-success"
                    >
                      {digits(d)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-surface-inset px-6 py-12 text-center">
            <p className="m-0 text-sm text-muted-foreground">
              {pick(
                "यस वर्षका लागि साइत सूची उपलब्ध छैन।",
                "No auspicious dates listed for this year.",
              )}
            </p>
          </div>
        )
      ) : null}
    </SaitCeremonyLayout>
  );
}

export default SaitPage;
