import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Sunrise } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import {
  GrahaBanner,
  GrahaDescription,
  GrahaYearHeader,
} from "@/components/graha/GrahaPageParts";
import { useLocale } from "@/i18n/locale";
import { getCurrentBs } from "@/lib/bs-calendar";
import { useRouteLoading } from "@/lib/route-loading";
import { patroCard } from "@/lib/patro-classes";
import { cn } from "@/lib/utils";
import {
  fetchGrahaAstaYear,
  grahaDetailKeys,
  type AstaStamp,
  type GrahaAstaPeriod,
} from "@/lib/api";

const GRAHA_ORDER = ["mercury", "venus", "moon", "mars", "jupiter", "saturn"];
const GRAHA_NE: Record<string, string> = {
  mercury: "बुध",
  venus: "शुक्र",
  moon: "चन्द्र",
  mars: "मङ्गल",
  jupiter: "बृहस्पति",
  saturn: "शनि",
};
const GRAHA_EN: Record<string, string> = {
  mercury: "Mercury",
  venus: "Venus",
  moon: "Moon",
  mars: "Mars",
  jupiter: "Jupiter",
  saturn: "Saturn",
};

function StampLine({
  label,
  stamp,
  tone,
}: {
  label: string;
  stamp: AstaStamp | null;
  tone: "asta" | "udaya";
}) {
  const { pick, digits } = useLocale();
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className={cn("font-semibold", tone === "asta" ? "text-danger" : "text-success")}>
        {label}
      </span>
      <span className="text-right font-num tabular-nums text-foreground">
        {stamp ? (
          <>
            {stamp.date_bs ? digits(stamp.date_bs) : digits(stamp.date_ad)}
            <span className="text-muted-foreground"> · {digits(stamp.time_short)}</span>
          </>
        ) : (
          <span className="text-muted-foreground">{pick("वर्ष बाहिर", "outside year")}</span>
        )}
      </span>
    </div>
  );
}

function PeriodCard({ period }: { period: GrahaAstaPeriod }) {
  const { pick, digits } = useLocale();
  const hemi =
    period.hemisphere === "east"
      ? pick("पूर्वमा (बिहान)", "East (morning)")
      : period.hemisphere === "west"
        ? pick("पश्चिममा (साँझ)", "West (evening)")
        : null;
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border/70 bg-foreground/[0.02] p-2.5 text-sm">
      <StampLine label={pick("अस्त आरम्भ", "Asta begins")} stamp={period.start} tone="asta" />
      <StampLine label={pick("उदय (अन्त्य)", "Udaya (ends)")} stamp={period.end} tone="udaya" />
      <div className="flex items-baseline justify-between gap-2 border-t border-border/60 pt-1 text-xs text-muted-foreground">
        <span>{hemi}</span>
        {period.duration_days != null ? (
          <span>{pick(`${digits(period.duration_days)} दिन`, `${period.duration_days} days`)}</span>
        ) : null}
      </div>
    </div>
  );
}

export function GrahaAsta() {
  const { pick } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const currentBs = getCurrentBs();
  const [year, setYear] = useState(currentBs.year);

  const query = useQuery({
    queryKey: grahaDetailKeys.asta(year, location.params),
    queryFn: () => fetchGrahaAstaYear(year, location.params),
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  useRouteLoading(query.isLoading && !query.data);

  const byGraha = new Map<string, GrahaAstaPeriod[]>();
  for (const g of GRAHA_ORDER) byGraha.set(g, []);
  for (const p of query.data?.periods ?? []) {
    if (!byGraha.has(p.graha)) byGraha.set(p.graha, []);
    byGraha.get(p.graha)!.push(p);
  }

  return (
    <PageShell>
      <GrahaBanner
        icon={<Sunrise className="h-6 w-6 text-accent dark:text-secondary" />}
        ne="ग्रह अस्त"
        en="Heliacal combustion"
        blurbNe="वर्षभरका ग्रह अस्त र चन्द्र तारा अस्त अवधि"
        blurbEn="Yearly asta (combustion) windows incl. Moon Tara Asta"
      />

      <div className="space-y-3">
        <GrahaYearHeader
          year={year}
          onYearChange={setYear}
          currentYear={currentBs.year}
          location={location}
          onLocationChange={setLocation}
        />
      </div>

      {query.isLoading && !query.data ? (
        <p className="text-sm">{pick("लोड हुँदै…", "Loading…")}</p>
      ) : query.data ? (
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GRAHA_ORDER.map((g) => {
            const periods = byGraha.get(g) ?? [];
            const isMoon = g === "moon";
            return (
              <div key={g} className={cn(patroCard, "flex flex-col")}>
                <div className="flex items-baseline justify-between gap-2 border-b border-border bg-secondary/[0.09] px-3 py-2 dark:bg-secondary/20">
                  <span className="text-base font-bold text-foreground">
                    {pick(GRAHA_NE[g], GRAHA_EN[g])}
                    {isMoon ? (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        {pick("(तारा अस्त)", "(Tara Asta)")}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {periods.length
                      ? pick(`${periods.length} पटक`, `${periods.length}×`)
                      : pick("छैन", "none")}
                  </span>
                </div>
                <div className="flex flex-col gap-2 p-2">
                  {periods.length ? (
                    periods.map((p, i) => <PeriodCard key={i} period={p} />)
                  ) : (
                    <p className="px-2 py-1.5 text-sm text-muted-foreground">
                      {pick("यस वर्ष अस्त छैन।", "No asta this year.")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-danger">{pick("लोड गर्न सकिएन।", "Could not load.")}</p>
      )}

      <GrahaDescription pageId="graha-asta" />

      <p className="mt-6 text-sm">
        <Link to="/panchanga/details" className="text-primary underline">
          {pick("← सबै पञ्चाङ्ग तत्त्वहरू", "← All panchanga elements")}
        </Link>
      </p>
    </PageShell>
  );
}

export default GrahaAsta;
