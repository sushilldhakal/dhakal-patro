import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { CalendarView } from "../components/CalendarView";
import { PageShell, PageHeader } from "../components/PageShell";
import { HoraRing } from "@/components/panchanga/HoraRing";
import { TithiMechanics } from "@/components/tithi-mechanics/TithiMechanics";
import { fetchPanchanga, panchangaKeys } from "@/lib/api";
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";

export function Calendar() {
  const todayAd = useMemo(
    () => todayAdStringInTimezone(new Date(), "Asia/Kathmandu"),
    [],
  );

  const panchangaQ = useQuery({
    queryKey: panchangaKeys.day(todayAd, "ad"),
    queryFn: () => fetchPanchanga(todayAd, "ad"),
    staleTime: 1000 * 60 * 30,
  });

  const p = panchangaQ.data;
  const timezone = resolveTimeZone(p?.location?.timezone);

  return (
    <PageShell>
      <PageHeader
        icon={<CalendarDays className="w-6 h-6 text-secondary" />}
        title="Nepali Calendar"
        subtitle="BS Patro with tithi, nakshatra & festival markers"
      />
      <CalendarView />
      <TithiMechanics />
      {p && <HoraRing p={p} isToday timezone={timezone} />}
    </PageShell>
  );
}
