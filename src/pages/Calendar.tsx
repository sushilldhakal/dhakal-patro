import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { CalendarView } from "../components/CalendarView";
import { PageShell, PageHeader } from "../components/PageShell";
import { HoraRing } from "@/components/panchanga/HoraRing";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import {
  resolveLocationTimezone,
  usePanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";
import { LearnMoreCard } from "@/components/LearnMoreCard";
import { fetchPanchanga, panchangaKeys } from "@/lib/api";
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";

export function Calendar() {
  const { location, setLocation } = usePanchangaLocation();

  const todayAd = useMemo(
    () => todayAdStringInTimezone(new Date(), resolveLocationTimezone(location)),
    [location],
  );

  const panchangaQ = useQuery({
    queryKey: panchangaKeys.day(todayAd, "ad", location.params),
    queryFn: () => fetchPanchanga(todayAd, "ad", location.params),
    staleTime: 1000 * 60 * 30,
  });

  const p = panchangaQ.data;
  const timezone = resolveTimeZone(p?.location?.timezone, location.params.timezone);

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
      {p && <HoraRing p={p} isToday timezone={timezone} />}
      <LearnMoreCard
        slugs={["tithi", "bs-calendar", "adhik-maas"]}
        heading="नेपाली पात्रो कसरी बन्छ?"
      />
    </PageShell>
  );
}
