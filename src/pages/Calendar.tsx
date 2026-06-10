import { CalendarDays } from "lucide-react";
import { CalendarView } from "../components/CalendarView";
import { PageShell, PageHeader } from "../components/PageShell";

export function Calendar() {
  return (
    <PageShell>
      <PageHeader
        icon={<CalendarDays className="w-6 h-6 text-secondary" />}
        title="Nepali Calendar"
        subtitle="BS Patro with tithi, nakshatra & festival markers"
      />
      <CalendarView />
    </PageShell>
  );
}
