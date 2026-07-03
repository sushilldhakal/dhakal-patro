import { useTranslation } from "react-i18next";
import { Sprout } from "lucide-react";
import { PageHeader, PageShell } from "@/components/PageShell";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { RituSeasons } from "@/components/RituSeasons";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { useRouteLoading } from "@/lib/route-loading";

export function Ritu() {
  const { t } = useTranslation();
  const { location, setLocation } = usePanchangaLocation();

  useRouteLoading(false);

  const subtitle = `${t("ritu.subtitle")}${location.label ? ` · ${location.label}` : ""}`;

  return (
    <PageShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          icon={<Sprout className="size-7 text-secondary dark:text-primary" strokeWidth={1.8} />}
          title={t("ritu.title")}
          subtitle={subtitle}
        />
        <LocationSelector compact location={location} onLocationChange={setLocation} />
      </div>

      <RituSeasons location={location} showHeader={false} />
    </PageShell>
  );
}

export default Ritu;
