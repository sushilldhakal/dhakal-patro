import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
        title={t("shanti_vidhi.title")}
        subtitle={t("shanti_vidhi.subtitle")}
      />

      <section className="rounded-2xl border border-border">
        <header className="flex items-center gap-1.5 border-b border-border px-4 py-3">
          <UserSearch className="h-4 w-4 text-secondary" />
          <h2 className="text-sm font-semibold text-foreground">{t("shanti_vidhi.birth_section")}</h2>
          <span className="ml-auto text-sm">{t("shanti_vidhi.birth_meta")}</span>
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
