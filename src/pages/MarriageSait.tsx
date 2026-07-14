import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CalendarHeart, ChevronLeft, ChevronRight } from "lucide-react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { useLocale } from "@/i18n/locale";
import { adToBS } from "@/lib/bs-calendar";
import { useRouteLoading } from "@/lib/route-loading";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { SaitRulesSection } from "@/components/sait/SaitRulesSection";
import { SaitDayCard } from "@/components/sait/SaitDayCard";
import { fetchSaitAboutCategory, fetchSaitDetail, saitDetailKey } from "@/lib/api";

export function MarriageSait() {
  const { pick, digits } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const todayBs = adToBS(new Date());
  const [year, setYear] = useState(todayBs.year);

  // The rules and method text come from the backend about endpoint — the same
  // single source of truth every /sait/{category} page uses.
  const aboutQuery = useQuery({
    queryKey: ["sait", "about", "vivah"],
    queryFn: () => fetchSaitAboutCategory("vivah"),
    staleTime: Infinity,
  });

  const detailQuery = useQuery({
    queryKey: saitDetailKey(year, "vivah", location.params),
    queryFn: () => fetchSaitDetail(year, "vivah", location.params),
    staleTime: 1000 * 60 * 60,
    placeholderData: keepPreviousData,
  });

  useRouteLoading(detailQuery.isLoading && !detailQuery.data);

  const about = aboutQuery.data;
  const days = detailQuery.data?.days ?? [];

  return (
    <PageShell>
      <PageHeader
        icon={<CalendarHeart className="h-6 w-6 text-secondary" />}
        title={pick("विवाह साइत", "Marriage Saait")}
        subtitle={pick(
          "शास्त्रअनुसार कडाइका साथ गणना गरिएका शुद्ध विवाह मुहूर्तहरू — समितिको सूचीलाई पछ्याइएको छैन।",
          "Strict, śāstra-derived vivāha muhūrtas — computed by the book, not tracking the committee list.",
        )}
      />

      <SaitRulesSection
        method={about?.method}
        rules={about?.rules}
        engineVersion={detailQuery.data?.engine_version}
      />

      {/* Year + location */}
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

      {detailQuery.isLoading && !detailQuery.data ? (
        <p className="text-sm">{pick("लोड हुँदै…", "Loading…")}</p>
      ) : days.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            {pick(
              `वि.सं. ${digits(year)} मा ${digits(days.length)} शुद्ध विवाह दिन।`,
              `${digits(days.length)} strict vivāha days in BS ${digits(year)}.`,
            )}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {days.map((d) => (
              <SaitDayCard key={`${d.bs_month}-${d.bs_day}`} d={d} />
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm">{pick("यस वर्ष कुनै शुद्ध विवाह मुहूर्त छैन।", "No strict vivāha muhūrta this year.")}</p>
      )}

      <p className="text-sm">
        <Link to="/panchanga/details" className="text-primary underline">
          {pick("← सबै शुभ मुहूर्त", "← All ceremonies")}
        </Link>
      </p>
    </PageShell>
  );
}

export default MarriageSait;
