import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, UserSearch } from "lucide-react";
import { PageShell, PageHeader } from "../components/PageShell";
import { useRouteLoading } from "@/lib/route-loading";
import {
  fetchVimshottari,
  fetchShadbala,
  vimshottariKeys,
  shadbalaKeys,
} from "@/lib/api";
import { buildAtTimeDatetime } from "@/lib/ephemeris-adapters";
import { KundaliControls } from "@/components/kundali/KundaliControls";
import { ShantiVidhiPanel } from "@/components/kundali/ShantiVidhiPanel";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { defaultClockForTimezone } from "@/components/panchanga/use-panchanga-mode";

function toAdStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ShantiVidhi() {
  const { location, setLocation } = usePanchangaLocation();
  const [date, setDate] = useState(() => new Date());
  const [era, setEra] = useState<"bs" | "ad">("ad");
  const timezone = location.params.timezone ?? "Asia/Kathmandu";
  const [clock, setClock] = useState(() => defaultClockForTimezone(timezone));

  const adDateStr = toAdStr(date);
  const atTimeDatetime = buildAtTimeDatetime(adDateStr, clock);

  const vimshottariQ = useQuery({
    queryKey: vimshottariKeys.atTime(atTimeDatetime, location.params),
    queryFn: () => fetchVimshottari(atTimeDatetime, location.params),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(atTimeDatetime),
  });

  const shadbalaQ = useQuery({
    queryKey: shadbalaKeys.atTime(atTimeDatetime, location.params),
    queryFn: () => fetchShadbala(atTimeDatetime, location.params),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(atTimeDatetime),
  });

  useRouteLoading(vimshottariQ.isLoading || shadbalaQ.isLoading);

  return (
    <PageShell>
      <PageHeader
        icon={<Flame className="h-7 w-7 text-secondary" />}
        title="शान्ति विधि"
        subtitle="नवग्रह शान्ति — जन्म विवरणबाट पीडित ग्रह पत्ता लगाउनुहोस् वा ग्रह छानेर बीज मन्त्र, समिधा, रत्न र दान हेर्नुहोस्।"
      />

      {/* व्यक्तिगत गणना (birth-details → afflicted graha) */}
      <section className="rounded-2xl border border-border">
        <header className="flex items-center gap-1.5 border-b border-border px-4 py-3">
          <UserSearch className="h-4 w-4 text-secondary" />
          <h2 className="text-sm font-semibold text-foreground">जन्म विवरणबाट गणना</h2>
          <span className="ml-auto text-[11px] text-muted-foreground">मिति · समय · स्थान</span>
        </header>

        <div className="space-y-4 p-4">
          <KundaliControls
            date={date}
            onDateChange={setDate}
            era={era}
            onEraChange={setEra}
            clock={clock}
            onClockChange={setClock}
            location={location}
            onLocationChange={setLocation}
          />

          <ShantiVidhiPanel
            vimshottari={vimshottariQ.data}
            shadbala={shadbalaQ.data}
            isError={vimshottariQ.isError && shadbalaQ.isError}
          />
        </div>
      </section>
    </PageShell>
  );
}

export default ShantiVidhi;
