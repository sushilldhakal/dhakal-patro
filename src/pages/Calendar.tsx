import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { CalendarView } from "../components/CalendarView";
import { PageShell, PageHeader } from "../components/PageShell";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import {
  resolveLocationTimezone,
  usePanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";
import { LearnMoreCard } from "@/components/LearnMoreCard";
import { todayAdStringInTimezone } from "@/lib/zoned-time";

export function Calendar() {
  const { location, setLocation } = usePanchangaLocation();

  const todayAd = useMemo(
    () => todayAdStringInTimezone(new Date(), resolveLocationTimezone(location)),
    [location],
  );

  return (
    <PageShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          icon={<CalendarDays className="w-6 h-6 text-secondary" />}
          title="Nepali Calendar"
          subtitle="BS Patro with tithi, nakshatra & festival markers"
        />
        <LocationSelector
          compact
          className="shrink-0 w-full sm:w-auto"
          location={location}
          onLocationChange={setLocation}
        />
      </div>
      <CalendarView location={location} todayAd={todayAd} />
      <LearnMoreCard
        slugs={["tithi", "bs-calendar", "hora", "adhik-maas"]}
        heading="नेपाली पात्रो कसरी बन्छ?"
      />
    </PageShell>
  );
}
