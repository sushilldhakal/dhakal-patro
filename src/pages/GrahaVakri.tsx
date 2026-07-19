import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
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
  fetchGrahaVakriYear,
  grahaDetailKeys,
  type GrahaVakriEvent,
} from "@/lib/api";

const GRAHA_ORDER = ["mercury", "venus", "mars", "jupiter", "saturn"];
const GRAHA_NE: Record<string, string> = {
  mercury: "बुध",
  venus: "शुक्र",
  mars: "मङ्गल",
  jupiter: "बृहस्पति",
  saturn: "शनि",
};
const GRAHA_EN: Record<string, string> = {
  mercury: "Mercury",
  venus: "Venus",
  mars: "Mars",
  jupiter: "Jupiter",
  saturn: "Saturn",
};

function EventRow({ ev }: { ev: GrahaVakriEvent }) {
  const { pick, digits } = useLocale();
  const isVakri = ev.is_retrograde === true || ev.motion === "Vakri";
  return (
    <div className="flex items-center font-semibold justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm odd:bg-foreground/[0.03]">
      <span className="flex items-center gap-1.5">
        <span className={cn(isVakri ? "text-danger" : "text-success")}>
          {isVakri ? "↺" : "→"}
        </span>
        <span className={cn("font-semibold", isVakri ? "text-danger" : "text-success")}>
          {pick(isVakri ? "वक्री" : "मार्गी", isVakri ? "Retrograde" : "Direct")}
        </span>
      </span>
      <span className="text-right">
        <span className="font-num tabular-nums text-foreground">
          {ev.entry_date_bs ? digits(ev.entry_date_bs) : ""}
        </span>
        <span className="text-muted-foreground">
          {" "}
          · {ev.entry_time_local_short ? digits(ev.entry_time_local_short) : ""}
        </span>
      </span>
    </div>
  );
}

export function GrahaVakri() {
  const { pick } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const currentBs = getCurrentBs();
  const [year, setYear] = useState(currentBs.year);

  const query = useQuery({
    queryKey: grahaDetailKeys.vakri(year, location.params),
    queryFn: () => fetchGrahaVakriYear(year, location.params),
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  useRouteLoading(query.isLoading && !query.data);

  const byGraha = new Map<string, GrahaVakriEvent[]>();
  for (const g of GRAHA_ORDER) byGraha.set(g, []);
  for (const ev of query.data?.events ?? []) {
    if (!byGraha.has(ev.graha)) byGraha.set(ev.graha, []);
    byGraha.get(ev.graha)!.push(ev);
  }

  return (
    <PageShell>
      <GrahaBanner
        icon={<RotateCcw className="h-6 w-6 text-accent dark:text-secondary" />}
        ne="ग्रह वक्री"
        en="Retrograde motion"
        blurbNe="वर्षभरका ग्रह वक्री–मार्गी क्षण"
        blurbEn="Yearly vakri / margi (retrograde) stations"
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
        <div className="mt-2 columns-1 gap-3 sm:columns-2 lg:columns-3">
          {GRAHA_ORDER.map((g) => {
            const events = byGraha.get(g) ?? [];
            return (
              <div key={g} className={cn(patroCard, "mb-3 flex break-inside-avoid flex-col")}>
                <div className="flex items-baseline justify-between gap-2 border-b border-border bg-secondary/[0.09] px-3 py-2 dark:bg-secondary/20">
                  <span className="text-base font-bold text-foreground">
                    {pick(GRAHA_NE[g], GRAHA_EN[g])}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {events.length
                      ? pick(`${events.length} स्थिति`, `${events.length} stations`)
                      : pick("कुनै स्थिति छैन", "no stations")}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 p-2">
                  {events.length ? (
                    events.map((ev, i) => <EventRow key={i} ev={ev} />)
                  ) : (
                    <p className="px-2 py-1.5 text-sm text-muted-foreground">
                      {pick("यस वर्ष वक्री हुँदैन।", "No retrograde this year.")}
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

      <GrahaDescription pageId="graha-vakri" />

      <p className="mt-6 text-sm">
        <Link to="/panchanga/details" className="text-primary underline">
          {pick("← सबै पञ्चाङ्ग तत्त्वहरू", "← All panchanga elements")}
        </Link>
      </p>
    </PageShell>
  );
}

export default GrahaVakri;
