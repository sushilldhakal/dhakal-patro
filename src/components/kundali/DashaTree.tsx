import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useLocale } from "@/i18n/locale";
import { dashaExpandKeys, fetchDashaChildren, type DashaSystem, type DashaTreeNode } from "@/lib/api";
import { formatZonedBsMoment } from "@/lib/bs-calendar";
import {
  DASHA_LORD_EN,
  DASHA_LORD_NE,
  breakdownDashaDuration,
  formatDashaDuration,
  formatDashaDurationParts,
  type DashaLord,
  type DashaSpan,
} from "@/lib/dasha";
import { cn } from "@/lib/utils";

const LEVEL_LABELS: { ne: string; en: string }[] = [
  { ne: "महादशा", en: "Maha Dasha" },
  { ne: "अन्तर्दशा", en: "Antar Dasha" },
  { ne: "प्रत्यन्तर्दशा", en: "Pratyantar Dasha" },
  { ne: "सूक्ष्म दशा", en: "Sukshma Dasha" },
  { ne: "प्राण दशा", en: "Prana Dasha" },
];

const MAX_LEVEL = LEVEL_LABELS.length - 1;

const LORD_GLYPH: Record<DashaLord, string> = {
  sun: "☉",
  moon: "☽",
  mars: "♂",
  mercury: "☿",
  jupiter: "♃",
  venus: "♀",
  saturn: "♄",
  rahu: "☊",
  ketu: "☋",
};

const LORD_ACCENT: Record<DashaLord, string> = {
  sun: "border-amber-500/35 bg-amber-500/[0.08]",
  moon: "border-slate-400/35 bg-slate-400/[0.08]",
  mars: "border-red-500/35 bg-red-500/[0.08]",
  mercury: "border-emerald-500/35 bg-emerald-500/[0.08]",
  jupiter: "border-yellow-600/35 bg-yellow-600/[0.08]",
  venus: "border-pink-500/35 bg-pink-500/[0.08]",
  saturn: "border-violet-500/35 bg-violet-500/[0.08]",
  rahu: "border-neutral-500/35 bg-neutral-500/[0.08]",
  ketu: "border-orange-600/35 bg-orange-600/[0.08]",
};

const YOGINI_ACCENT: Record<string, string> = {
  mangala: "border-rose-500/35 bg-rose-500/[0.08]",
  pingala: "border-orange-500/35 bg-orange-500/[0.08]",
  dhanya: "border-amber-500/35 bg-amber-500/[0.08]",
  bhramari: "border-yellow-600/35 bg-yellow-600/[0.08]",
  bhadrika: "border-lime-600/35 bg-lime-600/[0.08]",
  ulka: "border-cyan-500/35 bg-cyan-500/[0.08]",
  siddha: "border-sky-500/35 bg-sky-500/[0.08]",
  sankata: "border-violet-500/35 bg-violet-500/[0.08]",
};

const YOGINI_DOT: Record<string, string> = {
  mangala: "bg-rose-500",
  pingala: "bg-orange-500",
  dhanya: "bg-amber-500",
  bhramari: "bg-yellow-600",
  bhadrika: "bg-lime-600",
  ulka: "bg-cyan-500",
  siddha: "bg-sky-500",
  sankata: "bg-violet-500",
};

const LORD_DOT: Record<DashaLord, string> = {
  sun: "bg-amber-500",
  moon: "bg-slate-400",
  mars: "bg-red-500",
  mercury: "bg-emerald-500",
  jupiter: "bg-yellow-600",
  venus: "bg-pink-500",
  saturn: "bg-violet-500",
  rahu: "bg-neutral-500",
  ketu: "bg-orange-600",
};

function lordAccent(lord: string, system: DashaSystem): string {
  if (system === "yogini") return YOGINI_ACCENT[lord] ?? "border-border/50 bg-muted/20";
  return LORD_ACCENT[(lord as DashaLord) in LORD_ACCENT ? (lord as DashaLord) : "ketu"];
}

function lordDot(lord: string, system: DashaSystem): string {
  if (system === "yogini") return YOGINI_DOT[lord] ?? "bg-muted-foreground";
  return LORD_DOT[(lord as DashaLord) in LORD_DOT ? (lord as DashaLord) : "ketu"];
}

function formatMoment(
  date: Date,
  lang: string,
  timeZone?: string,
  digits?: (v: string | number) => string,
): string {
  return formatZonedBsMoment(date, { lang, timeZone, digits });
}

function MomentLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[11.5px] leading-snug text-muted-foreground">
      <span className="inline-block w-14 shrink-0 font-semibold uppercase tracking-wide text-[9.5px] text-muted-foreground/70">
        {label}
      </span>
      <span className="font-medium text-foreground/80">{value}</span>
    </p>
  );
}

function TimelineDot({
  running,
  level,
  lord,
  system,
}: {
  running: boolean;
  level: number;
  lord: string;
  system: DashaSystem;
}) {
  const size =
    level === 0 ? "size-3.5 -left-[8px]" : level === 1 ? "size-2.5 -left-[6px]" : "size-2 -left-[5px]";

  return (
    <span
      className={cn(
        "absolute top-[1.125rem] z-10 rounded-full border-2 border-background shadow-sm",
        size,
        running ? "bg-secondary ring-2 ring-secondary/35" : lordDot(lord, system),
      )}
      aria-hidden
    />
  );
}

function SpanProgress({ start, end, now, running }: { start: Date; end: Date; now: number; running: boolean }) {
  if (!running) return null;
  const total = end.getTime() - start.getTime();
  const pct = total > 0 ? Math.min(100, Math.max(0, ((now - start.getTime()) / total) * 100)) : 0;
  return (
    <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted/60">
      <div
        className="h-full rounded-full bg-secondary transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const DURATION_COLS = [
  { ne: "अवधि (BS)", en: "Duration (BS)" },
  { ne: "वर्ष", en: "Years" },
  { ne: "मास", en: "Months" },
  { ne: "दिन", en: "Days" },
  { ne: "योग", en: "Yoga" },
] as const;

function DashaDurationGrid({
  start,
  end,
  lang,
  pick,
  digits,
}: {
  start: Date;
  end: Date;
  lang: string;
  pick: (ne: string, en: string) => string;
  digits: (v: string | number) => string;
}) {
  const ms = end.getTime() - start.getTime();
  const parts = breakdownDashaDuration(ms);
  const locale = lang === "en" ? "en" : "ne";
  const avadhi = formatDashaDurationParts(parts, locale);
  const values = [
    avadhi,
    parts.years,
    parts.months,
    parts.days,
    parts.yogas,
  ] as const;

  return (
    <div className="mt-2 overflow-x-auto pl-[22px]">
      <table className="w-full min-w-[280px] border-collapse text-[10.5px]">
        <thead>
          <tr>
            {DURATION_COLS.map((col) => (
              <th
                key={col.ne}
                className="border border-border/50 bg-muted/30 px-1.5 py-1 text-left font-semibold text-[9px] uppercase tracking-wide text-muted-foreground"
              >
                {pick(col.ne, col.en)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {values.map((value, i) => (
              <td
                key={DURATION_COLS[i]!.ne}
                className="border border-border/50 px-1.5 py-1 font-medium tabular-nums text-foreground/90"
              >
                {digits(value)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** Span with the pre-computed children the API embedded (down to pratyantar). */
type SpanWithChildren = DashaSpan & { childNodes?: DashaTreeNode[]; lordNe: string };

function toSpan(node: DashaTreeNode): SpanWithChildren {
  return {
    lord: (node.lord as DashaLord) ?? "ketu",
    lordNe: node.lord_ne,
    start: new Date(node.start),
    end: new Date(node.end),
    childNodes: node.children,
  };
}

function displayLordName(span: SpanWithChildren, lang: string, system: DashaSystem): string {
  if (system === "yogini") return span.lordNe;
  const lord = span.lord as DashaLord;
  return lang === "en" ? DASHA_LORD_EN[lord] ?? span.lordNe : DASHA_LORD_NE[lord] ?? span.lordNe;
}

function DashaNode({
  span,
  level,
  now,
  timeZone,
  isLast,
  system,
  maxLevel,
}: {
  span: SpanWithChildren;
  level: number;
  now: number;
  timeZone?: string;
  isLast?: boolean;
  system: DashaSystem;
  maxLevel: number;
}) {
  const { lang, pick, digits } = useLocale();
  const [open, setOpen] = useState(false);

  const running = span.start.getTime() <= now && now < span.end.getTime();
  const expandable = level < maxLevel;

  const needsFetch = open && expandable && !span.childNodes;
  const startIso = span.start.toISOString();
  const endIso = span.end.toISOString();
  const childQ = useQuery({
    queryKey: dashaExpandKeys.span(span.lord, startIso, endIso, system),
    queryFn: () => fetchDashaChildren(span.lord, startIso, endIso, system),
    enabled: needsFetch,
    staleTime: Infinity,
  });

  const children = useMemo<SpanWithChildren[] | null>(() => {
    if (!open || !expandable) return null;
    const nodes = span.childNodes ?? childQ.data?.children;
    return nodes ? nodes.map(toSpan) : null;
  }, [open, expandable, span.childNodes, childQ.data]);

  const duration = formatDashaDuration(span.end.getTime() - span.start.getTime(), lang);
  const levelLabel = pick(LEVEL_LABELS[level]!.ne, LEVEL_LABELS[level]!.en);
  const accent = lordAccent(span.lord, system);
  const glyph = system === "yogini" ? "◆" : LORD_GLYPH[span.lord as DashaLord] ?? "●";

  return (
    <li
      className={cn(
        "relative",
        level === 0 ? "pb-4" : "pb-2",
        level > 0 && "ml-1",
      )}
    >
      {/* spine segment */}
      <span
        className={cn(
          "absolute top-0 bottom-0 border-l-2",
          level === 0 ? "-left-px border-border/80" : "left-0 border-border/50",
          isLast && !open && "bottom-auto h-[1.125rem]",
        )}
        aria-hidden
      />
      <TimelineDot running={running} level={level} lord={span.lord} system={system} />

      <article
        className={cn(
          "ml-5 overflow-hidden rounded-xl border transition-colors",
          level === 0 ? "shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_4%,transparent)]" : "",
          accent,
          running && "border-secondary/40 ring-1 ring-secondary/20",
        )}
      >
        <button
          type="button"
          onClick={() => expandable && setOpen((v) => !v)}
          disabled={!expandable}
          aria-expanded={expandable ? open : undefined}
          className={cn(
            "w-full px-3 py-2.5 text-left transition-colors",
            expandable && "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]",
          )}
        >
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {expandable ? (
              <ChevronRight
                className={cn(
                  "size-3.5 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-90",
                )}
                aria-hidden
              />
            ) : (
              <span className="w-3.5 shrink-0" aria-hidden />
            )}
            <span className="text-base leading-none opacity-80" aria-hidden>
              {glyph}
            </span>
            <span className="text-[13px] font-bold text-foreground">
              {displayLordName(span, lang, system)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {levelLabel}
              <span className="mx-1 text-muted-foreground/50">·</span>
              {digits(duration)}
            </span>
            {running && (
              <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[9.5px] font-bold text-secondary">
                {pick("चालु दशा", "Running")}
              </span>
            )}
          </span>

          <span className="mt-2 block space-y-0.5 pl-[22px]">
            <MomentLine
              label={pick("सुरु", "Begin")}
              value={formatMoment(span.start, lang, timeZone, digits)}
            />
            <MomentLine
              label={pick("अन्त्य", "End")}
              value={formatMoment(span.end, lang, timeZone, digits)}
            />
          </span>

          <DashaDurationGrid
            start={span.start}
            end={span.end}
            lang={lang}
            pick={pick}
            digits={digits}
          />

          <SpanProgress start={span.start} end={span.end} now={now} running={running} />
        </button>

        {/* Accordion panel — nested sub-periods */}
        {children && (
          <div className="border-t border-border/50 bg-card/40 px-2 pb-2 pt-1">
            <ul className="relative ml-3 flex flex-col gap-0">
              {children.map((child, i) => (
                <DashaNode
                  key={`${child.lord}-${child.start.getTime()}-${i}`}
                  span={child}
                  level={level + 1}
                  now={now}
                  timeZone={timeZone}
                  isLast={i === children.length - 1}
                  system={system}
                  maxLevel={maxLevel}
                />
              ))}
            </ul>
          </div>
        )}
      </article>
    </li>
  );
}

export type DashaTreeProps = {
  /** Server-computed mahadasha tree (full spans, antar/pratyantar embedded). */
  tree: DashaTreeNode[];
  /** IANA timezone of the chart's place, for begin/end display. */
  timeZone?: string;
  system?: DashaSystem;
  /** Deepest expandable level index (0 = maha only). Default: full Vimshottari depth. */
  maxLevel?: number;
  /** Yogini full-cycle length in years (for cycle badge). */
  cycleYears?: number;
};

/**
 * Dasha timeline. Each row is an accordion card on the spine; expand to reveal
 * antar and deeper sub-periods.
 */
export function DashaTree({
  tree,
  timeZone,
  system = "vimshottari",
  maxLevel = MAX_LEVEL,
  cycleYears,
}: DashaTreeProps) {
  const { lang, pick, digits } = useLocale();
  const [now] = useState(() => Date.now());
  const mahadashas = useMemo(() => tree.map(toSpan), [tree]);

  const running = mahadashas.find(
    (m) => m.start.getTime() <= now && now < m.end.getTime(),
  );

  const timelineStart = mahadashas[0]?.start;
  const timelineEnd = mahadashas[mahadashas.length - 1]?.end;
  const yoginiCycle =
    running && cycleYears
      ? Math.floor((running.start.getTime() - (timelineStart?.getTime() ?? running.start.getTime())) / (cycleYears * 365.2425 * 86400000)) + 1
      : null;

  return (
    <div className="space-y-5">
      {timelineStart && timelineEnd && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
          <span>
            <span className="font-semibold uppercase tracking-wide text-[9.5px]">
              {pick("सुरु", "From")}
            </span>{" "}
            <span className="font-medium text-foreground/80">
              {formatMoment(timelineStart, lang, timeZone, digits)}
            </span>
          </span>
          <span className="hidden sm:inline text-muted-foreground/40">→</span>
          <span>
            <span className="font-semibold uppercase tracking-wide text-[9.5px]">
              {pick("अन्त्य", "To")}
            </span>{" "}
            <span className="font-medium text-foreground/80">
              {formatMoment(timelineEnd, lang, timeZone, digits)}
            </span>
          </span>
        </div>
      )}

      {running && (
        <div className="relative overflow-hidden rounded-xl border border-secondary/30 bg-secondary/[0.06] px-4 py-3 dark:bg-secondary/10">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-secondary"
            aria-hidden
          />
          <div className="flex flex-wrap items-center justify-between gap-2 pl-2">
            <p className="text-sm font-bold text-foreground">
              <span className="mr-1.5 opacity-80" aria-hidden>
                {system === "yogini" ? "◆" : LORD_GLYPH[running.lord as DashaLord] ?? "●"}
              </span>
              {displayLordName(running, lang, system)}
              <span className="mx-1.5 font-normal text-muted-foreground">·</span>
              {pick("महादशा", "Maha Dasha")}
            </p>
            <div className="flex items-center gap-2">
              {yoginiCycle ? (
                <span className="rounded-full border border-border/60 bg-card px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {pick(`चक्र: ${digits(yoginiCycle)}`, `Cycle: ${digits(yoginiCycle)}`)}
                </span>
              ) : null}
              <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-bold text-secondary">
                {pick("चालु दशा", "Running Dasha")}
              </span>
            </div>
          </div>
          <div className="mt-1.5 space-y-0.5 pl-2">
            <MomentLine
              label={pick("सुरु", "Begin")}
              value={formatMoment(running.start, lang, timeZone, digits)}
            />
            <MomentLine
              label={pick("अन्त्य", "End")}
              value={formatMoment(running.end, lang, timeZone, digits)}
            />
          </div>
          <div className="mt-2 pl-2">
            <DashaDurationGrid
              start={running.start}
              end={running.end}
              lang={lang}
              pick={pick}
              digits={digits}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 pl-2 text-[12px]">
            <p>
              <span className="text-muted-foreground">{pick("कुल", "Total")} — </span>
              <span className="font-semibold text-foreground">
                {digits(formatDashaDuration(running.end.getTime() - running.start.getTime(), lang))}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">{pick("बाँकी", "Left")} — </span>
              <span className="font-semibold text-foreground">
                {digits(formatDashaDuration(running.end.getTime() - now, lang))}
              </span>
            </p>
          </div>
          <SpanProgress start={running.start} end={running.end} now={now} running />
        </div>
      )}

      <ol className="relative m-0 list-none pl-3">
        {mahadashas.map((span, i) => (
          <DashaNode
            key={`${span.lord}-${span.start.getTime()}-${i}`}
            span={span}
            level={0}
            now={now}
            timeZone={timeZone}
            isLast={i === mahadashas.length - 1}
            system={system}
            maxLevel={maxLevel}
          />
        ))}
      </ol>
    </div>
  );
}
