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
  type GrahaAstaEvent,
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

function EventRow({ ev }: { ev: GrahaAstaEvent }) {
  const { pick, digits } = useLocale();
  const isAsta = ev.event === "asta";
  return (
    <div className="flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm odd:bg-foreground/[0.03]">
      <span className="flex items-center gap-1.5">
        <span
          className={cn(
            "inline-block h-2 w-2 rounded-full",
            isAsta ? "bg-danger" : "bg-success",
          )}
        />
        <span className={cn("font-semibold", isAsta ? "text-danger" : "text-success")}>
          {pick(isAsta ? "अस्त" : "उदय", isAsta ? "Set" : "Rise")}
        </span>
        <span className="text-muted-foreground">{ev.label_ne ? digits(ev.label_ne) : ""}</span>
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

  const byGraha = new Map<string, GrahaAstaEvent[]>();
  for (const g of GRAHA_ORDER) byGraha.set(g, []);
  for (const ev of query.data?.events ?? []) {
    if (!byGraha.has(ev.graha)) byGraha.set(ev.graha, []);
    byGraha.get(ev.graha)!.push(ev);
  }

  return (
    <PageShell>
      <GrahaBanner
        icon={<Sunrise className="h-6 w-6 text-accent dark:text-secondary" />}
        ne="ग्रह अस्त"
        en="Heliacal rising & setting"
        blurbNe="वर्षभरका ग्रह उदय–अस्त क्षण"
        blurbEn="Yearly udaya / asta (combustion) moments"
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
            const events = byGraha.get(g) ?? [];
            return (
              <div key={g} className={cn(patroCard, "flex flex-col")}>
                <div className="flex items-baseline justify-between gap-2 border-b border-border bg-secondary/[0.09] px-3 py-2 dark:bg-secondary/20">
                  <span className="text-base font-bold text-foreground">
                    {pick(GRAHA_NE[g], GRAHA_EN[g])}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {events.length
                      ? pick(`${events.length} घटना`, `${events.length} events`)
                      : pick("कुनै घटना छैन", "no events")}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 p-2">
                  {events.length ? (
                    events.map((ev, i) => <EventRow key={i} ev={ev} />)
                  ) : (
                    <p className="px-2 py-1.5 text-sm text-muted-foreground">
                      {g === "moon"
                        ? pick("चन्द्रमा सूर्यसमीप अस्त हुँदैन।", "The Moon does not undergo heliacal combustion.")
                        : pick("यस वर्ष कुनै उदय–अस्त छैन।", "No rise/set this year.")}
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
