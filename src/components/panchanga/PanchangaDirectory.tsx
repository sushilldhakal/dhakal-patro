import {
  CalendarClock,
  HeartHandshake,
  MoonStar,
  type LucideIcon,
} from "lucide-react";
import {
  QuickLinkCard,
} from "@/components/home/HomeQuickLinks";
import { useLocale } from "@/i18n/locale";
import { CEREMONY_META, ELEMENT_META } from "@/lib/panchanga-elements";
import { cn } from "@/lib/utils";

function SectionTitle({
  ne,
  en,
  className,
}: {
  ne: string;
  en: string;
  className?: string;
}) {
  const { pick } = useLocale();
  return (
    <h2
      className={cn(
        "mb-3 mt-8 text-center text-sm font-bold uppercase tracking-wider text-muted-foreground",
        className,
      )}
    >
      {pick(ne, en)}
    </h2>
  );
}

function DirectoryCard({
  to,
  params,
  ne,
  en,
  blurbNe,
  blurbEn,
  icon,
}: {
  to: "/panchanga/element/$name" | "/sait/$category";
  params: Record<string, string>;
  ne: string;
  en: string;
  blurbNe: string;
  blurbEn: string;
  icon: LucideIcon;
}) {
  const { pick } = useLocale();
  return (
    <QuickLinkCard
      to={to}
      params={params}
      icon={icon}
      label={pick(ne, en)}
      description={pick(blurbNe, blurbEn)}
    />
  );
}

/** Categorized link grid: transition elements → daily tables → shubha muhurta. */
export function PanchangaDirectory({ className }: { className?: string }) {
  const spans = ELEMENT_META.filter((e) => e.kind === "span");
  const tables = ELEMENT_META.filter((e) => e.kind === "table");

  return (
    <div className={className}>
      <SectionTitle ne="सङ्क्रमण तत्त्व (आरम्भ–अन्त्य)" en="Transition elements (begin–end)" />
      <div className="flex flex-wrap items-stretch justify-center gap-3">
        {spans.map((e) => (
          <DirectoryCard
            key={e.id}
            to="/panchanga/element/$name"
            params={{ name: e.id }}
            ne={e.ne}
            en={e.en}
            blurbNe={e.blurbNe}
            blurbEn={e.blurbEn}
            icon={MoonStar}
          />
        ))}
      </div>

      <SectionTitle ne="दैनिक तालिका" en="Daily tables" />
      <div className="flex flex-wrap items-stretch justify-center gap-3">
        {tables.map((e) => (
          <DirectoryCard
            key={e.id}
            to="/panchanga/element/$name"
            params={{ name: e.id }}
            ne={e.ne}
            en={e.en}
            blurbNe={e.blurbNe}
            blurbEn={e.blurbEn}
            icon={CalendarClock}
          />
        ))}
      </div>

      <SectionTitle ne="शुभ मुहूर्त" en="Auspicious ceremonies" />
      <div className="flex flex-wrap items-stretch justify-center gap-3">
        {CEREMONY_META.map((c) => (
          <DirectoryCard
            key={c.id}
            to="/sait/$category"
            params={{ category: c.id }}
            ne={`${c.ne} साइत`}
            en={`${c.en} muhurta`}
            blurbNe="शुभ मिति र व्याख्या"
            blurbEn="Auspicious dates & explanation"
            icon={HeartHandshake}
          />
        ))}
      </div>
    </div>
  );
}
