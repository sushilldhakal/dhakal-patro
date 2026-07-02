import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/i18n/locale";
import {
  ChevronDown,
  CircleAlert,
  Info,
  Loader2,
  RefreshCw,
  ScrollText,
  Sparkles,
} from "lucide-react";
import {
  streamKundaliReport,
  type LocationParams,
  type ReportConfidence,
  type ReportItem,
  type ReportMeta,
  type ReportSection,
} from "@/lib/api";
import { PanchangaSection } from "@/components/panchanga/PanchangaLayout";
import { cn } from "@/lib/utils";

type Status = "idle" | "streaming" | "done" | "error";

const CONFIDENCE_STYLE: Record<
  ReportConfidence,
  { label: string; labelNe: string; cls: string }
> = {
  strong: {
    label: "Strong",
    labelNe: "बलियो",
    cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  moderate: {
    label: "Moderate",
    labelNe: "मध्यम",
    cls: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  },
  mixed: {
    label: "Mixed / conditional",
    labelNe: "मिश्रित",
    cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  tentative: {
    label: "Tentative",
    labelNe: "अनिश्चित",
    cls: "bg-muted text-muted-foreground border-border",
  },
};

function ConfidenceBadge({
  level,
  className,
}: {
  level: ReportConfidence;
  className?: string;
}) {
  const s = CONFIDENCE_STYLE[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold leading-none",
        s.cls,
        className
      )}
      title={`Confidence: ${s.label} — how strongly the chart factors agree`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
        aria-hidden
      />
      {s.label}
    </span>
  );
}

/** Collapsible "why this grade" — the factors the confidence weighed. */
function FactorList({ factors }: { factors?: string[] }) {
  const [open, setOpen] = useState(false);
  if (!factors || factors.length === 0) return null;
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Info className="h-3 w-3" />
        Based on {factors.length} factor{factors.length > 1 ? "s" : ""}
        <ChevronDown
          className={cn("h-3 w-3 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <ul className="mt-1.5 space-y-1 border-l-2 border-border pl-3">
          {factors.map((f, i) => (
            <li key={i} className="text-[11.5px] leading-snug text-muted-foreground">
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemCard({ item }: { item: ReportItem }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 dark:bg-background/20 p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{item.label}</p>
        <ConfidenceBadge level={item.confidence} />
      </div>
      <p className="text-[13px] leading-relaxed text-muted-foreground">{item.text}</p>
      <FactorList factors={item.factors} />
    </div>
  );
}

function SectionCard({ section }: { section: ReportSection }) {
  const isGrid = section.id === "planet_by_planet" || section.id === "house_by_house";
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/60 p-4",
        section.optional && "border-dashed"
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <h3 className="text-base font-bold text-foreground">{section.title_ne}</h3>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {section.title_en}
        </span>
        {section.confidence && (
          <ConfidenceBadge level={section.confidence} className="ml-auto" />
        )}
      </div>

      {section.body.length > 0 && (
        <div className="space-y-2">
          {section.body.map((p, i) => (
            <p key={i} className="text-[13.5px] leading-relaxed text-muted-foreground">
              {p}
            </p>
          ))}
        </div>
      )}

      {section.confidence && <FactorList factors={section.factors} />}

      {section.items && section.items.length > 0 && (
        <div
          className={cn(
            "mt-3 grid gap-2.5",
            isGrid ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"
          )}
        >
          {section.items.map((it, i) => (
            <ItemCard key={i} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}

function MetaStrip({ meta }: { meta: ReportMeta }) {
  const { pick } = useLocale();
  const cells: { label: string; value: string; sub?: string }[] = [
    { label: pick("लग्न · Lagna", "Lagna"), value: pick(`${meta.lagna.name_ne} (${meta.lagna.name_en})`, meta.lagna.name_en) },
    {
      label: pick("नक्षत्र · Nakshatra", "Nakshatra"),
      value: meta.nakshatra
        ? pick(meta.nakshatra.name_ne, meta.nakshatra.name_en)
        : pick(meta.moon_sign.name_ne, meta.moon_sign.name_en),
      sub: meta.nakshatra
        ? `${meta.nakshatra.name_en} · pada ${meta.nakshatra.pada}`
        : "Moon sign",
    },
    {
      label: pick("सूर्य · Sun", "Sun"),
      value: pick(meta.sun_sign.name_ne, meta.sun_sign.name_en),
      sub: meta.sun_sign.name_en,
    },
    {
      label: pick("महादशा · Mahadasha", "Mahadasha"),
      value: meta.mahadasha
        ? `${meta.mahadasha.lord_ne}${
            meta.mahadasha.antardasha ? ` / ${meta.mahadasha.antardasha}` : ""
          }`
        : "—",
      sub:
        meta.mahadasha && meta.mahadasha.antardasha_ends
          ? `antar ends ${meta.mahadasha.antardasha_ends}`
          : undefined,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {cells.map((c) => (
        <div
          key={c.label}
          className="rounded-lg border border-border bg-background/50 px-3 py-2"
        >
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {c.label}
          </p>
          <p className="text-sm font-bold leading-tight text-foreground">{c.value}</p>
          {c.sub && <p className="mt-0.5 text-[10.5px] text-muted-foreground">{c.sub}</p>}
        </div>
      ))}
    </div>
  );
}

export function KundaliReport({
  datetime,
  location,
  ayanamsha,
  disabled,
}: {
  datetime: string;
  location?: LocationParams;
  ayanamsha?: string;
  disabled?: boolean;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [meta, setMeta] = useState<ReportMeta | null>(null);
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // This component is remounted (via a `key` on the chart inputs) whenever the
  // birth moment changes, so its state resets naturally — no stale report is
  // ever shown for a different chart. Here we only abort any in-flight stream
  // when the component goes away.
  useEffect(() => () => abortRef.current?.abort(), []);

  const generate = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("streaming");
    setMeta(null);
    setSections([]);
    setProgress({ done: 0, total: 0 });
    setError(null);

    streamKundaliReport(
      datetime,
      location,
      ayanamsha ? { ayanamsha } : undefined,
      (record) => {
        if (record.kind === "meta") {
          setMeta(record);
        } else if (record.kind === "section") {
          setSections((prev) => [...prev, record]);
          setProgress({ done: record.index + 1, total: record.total });
        } else if (record.kind === "done") {
          setStatus("done");
        }
      },
      controller.signal
    ).catch((err: unknown) => {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Could not generate the report.");
      setStatus("error");
    });
  }, [datetime, location, ayanamsha]);

  const streaming = status === "streaming";

  return (
    <PanchangaSection titleNe="ज्योतिष विश्लेषण" titleEn="AI-Free Astrology Report">
      <div className="space-y-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            A comprehensive, balanced reading computed{" "}
            <span className="font-medium text-foreground">deterministically</span> from
            your chart — D1, D9, Shadbala, yogas and the running dasha. Every section
            shows a{" "}
            <span className="font-medium text-foreground">confidence indicator</span>:
            when the factors agree it reads as a stronger tendency; when they conflict
            it is flagged mixed or conditional.
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {(status === "done" || status === "error") && (
              <button
                type="button"
                onClick={generate}
                disabled={disabled}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </button>
            )}
            {status === "idle" && (
              <button
                type="button"
                onClick={generate}
                disabled={disabled}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                Generate report
              </button>
            )}
            {streaming && (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {progress.total
                  ? `Writing ${progress.done}/${progress.total}…`
                  : "Reading the chart…"}
              </span>
            )}
          </div>
        </div>

        {/* Confidence legend */}
        {(streaming || status === "done") && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-medium">Confidence:</span>
            {(["strong", "moderate", "mixed", "tentative"] as ReportConfidence[]).map(
              (lvl) => (
                <ConfidenceBadge key={lvl} level={lvl} />
              )
            )}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {meta && <MetaStrip meta={meta} />}

        {sections.length > 0 && (
          <div className="space-y-3">
            {sections.map((s) => (
              <SectionCard key={s.id} section={s} />
            ))}
          </div>
        )}

        {status === "idle" && (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            <ScrollText className="h-5 w-5 shrink-0" />
            Generate a full personality, career, relationship, health, dasha-timing and
            yoga reading — each insight weighed for confidence.
          </div>
        )}

        {meta && (status === "done" || streaming) && (
          <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
            {meta.disclaimer} · {meta.method}.
          </p>
        )}
      </div>
    </PanchangaSection>
  );
}

export default KundaliReport;
