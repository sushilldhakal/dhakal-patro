import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageShell";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { useLocale } from "@/i18n/locale";
import {
  GRAHA_PAGE_DESCRIPTIONS,
  type GrahaPageDescription,
} from "@/lib/graha-detail-descriptions";
import { BS_SUPPORTED_END_YEAR, BS_SUPPORTED_START_YEAR } from "@/lib/bs-calendar";
import { patroCard, patroMdRail, patroSelect } from "@/lib/patro-classes";
import { cn } from "@/lib/utils";

const BS_YEAR_OPTIONS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i,
);

/** Secondary-band banner reused as the graha-page hero (matches ElementPage). */
export function GrahaBanner({
  icon,
  ne,
  en,
  blurbNe,
  blurbEn,
}: {
  icon: React.ReactNode;
  ne: string;
  en: string;
  blurbNe: string;
  blurbEn: string;
}) {
  const { pick } = useLocale();
  return (
    <div className="flex items-center justify-center relative left-1/2 -translate-x-1/2 w-[calc(100vw-1rem)] -mt-8 mb-8 bg-secondary py-8 text-accent dark:bg-background dark:text-secondary">
      <PageHeader icon={icon} title={pick(ne, en)} subtitle={pick(blurbNe, blurbEn)} />
    </div>
  );
}

/** Year stepper + location selector for the yearly graha pages. */
export function GrahaYearHeader({
  year,
  onYearChange,
  currentYear,
  location,
  onLocationChange,
}: {
  year: number;
  onYearChange: (y: number) => void;
  currentYear: number;
  location: PanchangaLocation;
  onLocationChange: (location: PanchangaLocation) => void;
}) {
  const { pick, digits } = useLocale();
  const clamp = (y: number) =>
    Math.min(Math.max(y, BS_SUPPORTED_START_YEAR), BS_SUPPORTED_END_YEAR);
  return (
    <div
      className={cn(
        patroMdRail,
        "flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={pick("अघिल्लो वर्ष", "Previous year")}
          onClick={() => onYearChange(clamp(year - 1))}
          disabled={year <= BS_SUPPORTED_START_YEAR}
          className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-foreground disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <select
          className={patroSelect}
          aria-label={pick("वर्ष", "Year")}
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
        >
          {BS_YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>
              {digits(y)} {pick("वि.सं.", "BS")}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-label={pick("अर्को वर्ष", "Next year")}
          onClick={() => onYearChange(clamp(year + 1))}
          disabled={year >= BS_SUPPORTED_END_YEAR}
          className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-foreground disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        {year !== currentYear ? (
          <button
            type="button"
            onClick={() => onYearChange(currentYear)}
            className="ml-1 rounded-full border border-border bg-card px-3 py-1 text-sm font-semibold text-foreground"
          >
            {pick("यो वर्ष", "This year")}
          </button>
        ) : null}
      </div>
      <div className="shrink-0">
        <LocationSelector
          compact
          location={location}
          onLocationChange={onLocationChange}
          className="h-8 min-w-0 w-auto max-w-[12.5rem]"
        />
      </div>
    </div>
  );
}

/** "About" block — what it is · how it's calculated · what it means. */
export function GrahaDescription({ pageId }: { pageId: string }) {
  const { pick } = useLocale();
  const desc: GrahaPageDescription | undefined = GRAHA_PAGE_DESCRIPTIONS[pageId];
  if (!desc) return null;

  const blocks: { titleNe: string; titleEn: string; body: { ne: string; en: string } }[] = [
    { titleNe: "यो के हो", titleEn: "What it is", body: desc.what },
    { titleNe: "कसरी गणना गरिन्छ", titleEn: "How it's calculated", body: desc.how },
    { titleNe: "यसको अर्थ", titleEn: "What it means", body: desc.meaning },
  ];

  return (
    <section className={cn(patroCard, "mt-6 p-4")} aria-label={pick("विवरण", "About")}>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-secondary">
        {pick("बारेमा", "About")}
      </h2>
      <div className="flex flex-col gap-4">
        {blocks.map((b) => (
          <div key={b.titleEn} className="flex flex-col gap-1">
            <h3 className="text-sm font-bold text-foreground">{pick(b.titleNe, b.titleEn)}</h3>
            <p className="m-0 text-sm leading-relaxed text-muted-foreground">
              {pick(b.body.ne, b.body.en)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
