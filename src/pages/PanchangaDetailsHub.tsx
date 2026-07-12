import { Link } from "@tanstack/react-router";
import { CalendarHeart, LayoutGrid } from "lucide-react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import { patroCard } from "@/lib/patro-classes";
import { useRouteLoading } from "@/lib/route-loading";
import { CEREMONY_META, ELEMENT_META } from "@/lib/panchanga-elements";

function SectionTitle({ ne, en }: { ne: string; en: string }) {
  const { pick } = useLocale();
  return <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">{pick(ne, en)}</h2>;
}

export function PanchangaDetailsHub() {
  const { pick } = useLocale();
  useRouteLoading(false);
  const spans = ELEMENT_META.filter((e) => e.kind === "span");
  const tables = ELEMENT_META.filter((e) => e.kind === "table");

  const card = (to: string, params: Record<string, string>, ne: string, en: string, blurbNe: string, blurbEn: string) => (
    <Link
      key={to + JSON.stringify(params)}
      to={to}
      params={params}
      className={cn(patroCard, "flex flex-col gap-0.5 p-3 transition-colors hover:bg-surface-hover")}
    >
      <span className="text-[14px] font-bold text-foreground">{pick(ne, en)}</span>
      <span className="text-[11.5px] text-muted-foreground">{pick(blurbNe, blurbEn)}</span>
    </Link>
  );

  return (
    <PageShell>
      <PageHeader
        icon={<LayoutGrid className="h-6 w-6 text-secondary" />}
        title={pick("पञ्चाङ्ग विवरण", "Panchanga details")}
        subtitle={pick("प्रत्येक तत्त्वको छुट्टै पृष्ठ — आरम्भ, अन्त्य र तालिका", "Every element on its own page — begin, end & tables")}
      />

      <SectionTitle ne="सङ्क्रमण तत्त्व (आरम्भ–अन्त्य)" en="Transition elements (begin–end)" />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {spans.map((e) => card("/panchanga/element/$name", { name: e.id }, e.ne, e.en, e.blurbNe, e.blurbEn))}
      </div>

      <SectionTitle ne="दैनिक तालिका" en="Daily tables" />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((e) => card("/panchanga/element/$name", { name: e.id }, e.ne, e.en, e.blurbNe, e.blurbEn))}
      </div>

      <div className="mt-6 flex items-center gap-2">
        <CalendarHeart className="size-4 text-secondary" />
        <SectionTitle ne="शुभ मुहूर्त" en="Auspicious ceremonies" />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {CEREMONY_META.map((c) =>
          card("/sait/$category", { category: c.id }, `${c.ne} साइत`, `${c.en} muhurta`, "शुभ मिति र व्याख्या", "Auspicious dates & explanation"),
        )}
      </div>
    </PageShell>
  );
}

export default PanchangaDetailsHub;
