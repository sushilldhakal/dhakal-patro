import {
  CalendarClock,
  Eclipse,
  HeartHandshake,
  MoonStar,
  Orbit,
  RotateCcw,
  Sunrise,
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

/** Standalone graha-detail pages (positions, combustion, retrograde, eclipses). */
const GRAHA_PAGES = [
  {
    to: "/panchanga/graha-sthiti" as const,
    ne: "ग्रह स्थिति",
    en: "Planetary positions",
    blurbNe: "नौ ग्रह र लग्नको दैनिक स्थिति",
    blurbEn: "Daily positions of 9 grahas + lagna",
    icon: Orbit,
  },
  {
    to: "/panchanga/graha-asta" as const,
    ne: "ग्रह अस्त",
    en: "Heliacal set",
    blurbNe: "वर्षभरका उदय–अस्त क्षण",
    blurbEn: "Yearly rising & setting",
    icon: Sunrise,
  },
  {
    to: "/panchanga/graha-vakri" as const,
    ne: "ग्रह वक्री",
    en: "Retrograde",
    blurbNe: "वर्षभरका वक्री–मार्गी क्षण",
    blurbEn: "Yearly retrograde stations",
    icon: RotateCcw,
  },
  {
    to: "/panchanga/chandra-grahan" as const,
    ne: "चन्द्र ग्रहण",
    en: "Lunar eclipse",
    blurbNe: "वर्षका चन्द्र ग्रहण",
    blurbEn: "The year's lunar eclipses",
    icon: MoonStar,
  },
  {
    to: "/panchanga/surya-grahan" as const,
    ne: "सूर्य ग्रहण",
    en: "Solar eclipse",
    blurbNe: "वर्षका सूर्य ग्रहण",
    blurbEn: "The year's solar eclipses",
    icon: Eclipse,
  },
];

/** Categorized link grid: transition elements → graha detail → daily tables → shubha muhurta. */
export function PanchangaDirectory({ className }: { className?: string }) {
  const { pick } = useLocale();
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

      <SectionTitle ne="ग्रह विवरण" en="Planet details" />
      <div className="flex flex-wrap items-stretch justify-center gap-3">
        {GRAHA_PAGES.map((g) => (
          <QuickLinkCard
            key={g.to}
            to={g.to}
            icon={g.icon}
            label={pick(g.ne, g.en)}
            description={pick(g.blurbNe, g.blurbEn)}
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
