import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useLocale, bilingualText } from "@/i18n/locale";
import { dashaExpandKeys, fetchDashaChildren, type DashaSystem, type DashaTreeNode } from "@/lib/api";
import { formatZonedAdMoment, formatZonedBsMoment } from "@/lib/bs-calendar";
import { GrahaPlanetIcon } from "@/components/graha/GrahaPlanetIcon";
import {
  DASHA_LORD_EN,
  DASHA_LORD_NE,
  breakdownDashaDuration,
  dashaMahadashaGrahaKey,
  formatDashaDuration,
  formatDashaDurationParts,
  type DashaLord,
  type DashaSpan,
} from "@/lib/dasha";
import { cn } from "@/lib/utils";

/** Catalogue keys, outermost dasha level first. */
const LEVEL_LABELS: string[] = [
  "kundali.maha_dasha",
  "kundali.x.dasha_level_antar",
  "kundali.x.dasha_level_pratyantar",
  "kundali.x.dasha_level_sukshma",
  "kundali.x.dasha_level_prana",
];

const MAX_LEVEL = LEVEL_LABELS.length - 1;

/** A BS year like "2076" means nothing in English — English mode shows the
 * Gregorian calendar instead of translating BS month names into English. */
function formatMoment(
  date: Date,
  lang: string,
  timeZone?: string,
  digits?: (v: string | number) => string,
): string {
  const isEn = lang.slice(0, 2) === "en";
  return isEn
    ? formatZonedAdMoment(date, { lang, timeZone, digits })
    : formatZonedBsMoment(date, { lang, timeZone, digits });
}

function MomentLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm leading-snug">
      <span className="inline-block w-14 shrink-0 font-semibold uppercase tracking-wide text-sm">
        {label}
      </span>
      <span className="text-base text-foreground/80">{value}</span>
    </p>
  );
}

function SpanProgress({ start, end, now }: { start: Date; end: Date; now: number }) {
  const total = end.getTime() - start.getTime();
  const pct = total > 0 ? Math.min(100, Math.max(0, ((now - start.getTime()) / total) * 100)) : 0;
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted/60">
      <div
        className="h-full rounded-full bg-secondary transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const DURATION_COLS = [
  "kundali.x.duration_bs",
  "kundali.x.duration_years",
  "kundali.x.duration_months",
  "holidays.col_days",
  "kundali.yoga",
] as const;

function DashaDurationGrid({
  start,
  end,
  lang,
  digits,
}: {
  start: Date;
  end: Date;
  lang: string;
  digits: (v: string | number) => string;
}) {
  const { t } = useTranslation();
  const ms = end.getTime() - start.getTime();
  const parts = breakdownDashaDuration(ms);
  const locale = lang === "en" ? "en" : "ne";
  const avadhi = formatDashaDurationParts(parts, locale);
  const values = [avadhi, parts.years, parts.months, parts.days, parts.yogas] as const;

  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full min-w-[280px] border-collapse text-sm">
        <thead>
          <tr>
            {DURATION_COLS.map((col) => (
              <th
                key={col}
                className="border border-border/50 bg-muted/30 px-1.5 py-1 text-left font-semibold text-sm uppercase tracking-wide"
              >
                {t(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {values.map((value, i) => (
              <td
                key={DURATION_COLS[i]}
                className="border border-border/50 px-1.5 py-1 text-base tabular-nums text-foreground/90"
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

function isRunning(span: SpanWithChildren | undefined, now: number): boolean {
  return span != null && span.start.getTime() <= now && now < span.end.getTime();
}

function findRunning(spans: SpanWithChildren[] | undefined, now: number): SpanWithChildren | undefined {
  return spans?.find((s) => isRunning(s, now));
}

/** Every period at one level under `parent` — fetched only when the API
 * didn't already embed them (pratyantar and deeper come from a lazy
 * /kundali/dasha/expand call, cached by React Query once fetched). A fixed
 * 4-call chain (see `DashaTree`) keeps every render calling the same number
 * of hooks regardless of how deep this chart's `maxLevel` goes — React's
 * rules of hooks forbid a variable-length loop of `useQuery`. */
function useLevelChildren(
  parent: SpanWithChildren | undefined,
  system: DashaSystem,
  parentLevel: number,
  maxLevel: number,
): SpanWithChildren[] | undefined {
  const enabled = parent != null && parentLevel < maxLevel && parent.childNodes == null;
  const startIso = parent?.start.toISOString() ?? "";
  const endIso = parent?.end.toISOString() ?? "";
  const q = useQuery({
    queryKey: dashaExpandKeys.span(parent?.lord ?? "", startIso, endIso, system),
    queryFn: () => fetchDashaChildren(parent!.lord, startIso, endIso, system),
    enabled,
    staleTime: Infinity,
  });
  if (parent == null || parentLevel >= maxLevel) return undefined;
  return (parent.childNodes ?? q.data?.children)?.map(toSpan);
}

function PeriodCard({
  span,
  system,
  lang,
  digits,
  timeZone,
  now,
  selected,
  onSelect,
}: {
  span: SpanWithChildren;
  system: DashaSystem;
  lang: string;
  digits: (v: string | number) => string;
  timeZone?: string;
  now: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const grahaKey = dashaMahadashaGrahaKey(system, span.lord);
  const running = isRunning(span, now);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex shrink-0 flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-colors",
        "min-w-[128px]",
        selected
          ? "border-secondary bg-secondary/10 shadow-[0_0_0_1px_var(--secondary)]"
          : "border-border bg-card hover:bg-muted/40",
      )}
    >
      <span className="flex items-center gap-1.5">
        {grahaKey ? <GrahaPlanetIcon graha={grahaKey} size={18} /> : null}
        <span className="text-sm font-bold text-foreground">{displayLordName(span, lang, system)}</span>
        {selected && <Check className="size-3.5 shrink-0 text-secondary" aria-hidden />}
      </span>
      <span className="text-sm text-muted-foreground">
        {running
          ? t("kundali.running")
          : bilingualText(lang, "अन्त्य", "Ends")}
        {" "}
        {formatMoment(span.end, lang, timeZone, digits)}
      </span>
    </button>
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
 * Dasha explorer: one level visible at a time (tabs across the top), instead
 * of an ever-growing accordion tree that buries "what's active right now"
 * several clicks and a long scroll down. Lands already showing the live
 * chain's deepest level; picking a different card at any level drills into
 * its own children at the next tab, so browsing other periods never grows
 * the page taller than one screen.
 */
export function DashaTree({
  tree,
  timeZone,
  system = "vimshottari",
  maxLevel = MAX_LEVEL,
  cycleYears,
}: DashaTreeProps) {
  const { t } = useTranslation();
  const { lang, digits } = useLocale();
  const [now] = useState(() => Date.now());
  const mahadashas = useMemo(() => tree.map(toSpan), [tree]);

  // `manualPath[i]` overrides level i once the user picks a card there —
  // until then every level follows whichever period is genuinely running.
  const [manualPath, setManualPath] = useState<(SpanWithChildren | undefined)[]>([]);
  const [manualLevel, setManualLevel] = useState<number | null>(null);

  const p0 = manualPath[0] ?? findRunning(mahadashas, now);
  const list1 = useLevelChildren(p0, system, 0, maxLevel);
  const p1 = manualPath[1] ?? findRunning(list1, now);
  const list2 = useLevelChildren(p1, system, 1, maxLevel);
  const p2 = manualPath[2] ?? findRunning(list2, now);
  const list3 = useLevelChildren(p2, system, 2, maxLevel);
  const p3 = manualPath[3] ?? findRunning(list3, now);
  const list4 = useLevelChildren(p3, system, 3, maxLevel);
  const p4 = manualPath[4] ?? findRunning(list4, now);

  const path = [p0, p1, p2, p3, p4];
  const levelLists: (SpanWithChildren[] | undefined)[] = [mahadashas, list1, list2, list3, list4];

  const deepestKnown = path.reduce((acc, s, i) => (s ? i : acc), 0);
  const selectedLevel = Math.min(manualLevel ?? deepestKnown, maxLevel);
  const cards = levelLists[selectedLevel] ?? [];
  const headline = path[selectedLevel];
  const viewingLive = manualPath.length === 0;

  function pick(level: number, span: SpanWithChildren) {
    const next = [...path.slice(0, level), span];
    setManualPath(next);
    setManualLevel(Math.min(level + 1, maxLevel));
  }

  function backToNow() {
    setManualPath([]);
    setManualLevel(null);
  }

  const timelineStart = mahadashas[0]?.start;
  const timelineEnd = mahadashas[mahadashas.length - 1]?.end;
  const yoginiCycle =
    p0 && cycleYears
      ? Math.floor((p0.start.getTime() - (timelineStart?.getTime() ?? p0.start.getTime())) / (cycleYears * 365.2425 * 86400000)) + 1
      : null;

  return (
    <div className="space-y-4">
      {headline && (
        <div className="relative overflow-hidden rounded-xl border border-secondary/30 bg-secondary/[0.06] px-4 py-3 dark:bg-secondary/10">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-secondary" aria-hidden />
          <div className="pl-2">
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-secondary">
                {isRunning(headline, now)
                  ? t("kundali.running_dasha")
                  : bilingualText(lang, "हेर्दै हुनुहुन्छ", "Viewing")}
              </p>
              <div className="flex items-center gap-2">
                {yoginiCycle ? (
                  <span className="rounded-full border border-border/60 bg-card px-2 py-0.5 text-sm font-semibold">
                    {bilingualText(lang, `चक्र: ${digits(yoginiCycle)}`, `Cycle: ${digits(yoginiCycle)}`)}
                  </span>
                ) : null}
                {!viewingLive && (
                  <button
                    type="button"
                    onClick={backToNow}
                    className="rounded-full border border-border/60 bg-card px-2.5 py-0.5 text-sm font-semibold hover:bg-muted/40"
                  >
                    {bilingualText(lang, "अहिले फर्कनुहोस्", "Back to now")}
                  </button>
                )}
              </div>
            </div>
            <p className="flex items-center gap-1.5 text-base font-bold text-foreground">
              {(() => {
                const grahaKey = dashaMahadashaGrahaKey(system, headline.lord);
                return grahaKey ? <GrahaPlanetIcon graha={grahaKey} size={22} /> : null;
              })()}
              {displayLordName(headline, lang, system)}
              <span className="font-normal text-muted-foreground">· {t(LEVEL_LABELS[selectedLevel]!)}</span>
            </p>
            <div className="mt-1.5 space-y-0.5">
              <MomentLine label={t("kundali.begin")} value={formatMoment(headline.start, lang, timeZone, digits)} />
              <MomentLine label={t("kundali.end")} value={formatMoment(headline.end, lang, timeZone, digits)} />
            </div>
            <DashaDurationGrid start={headline.start} end={headline.end} lang={lang} digits={digits} />
            {isRunning(headline, now) && (
              <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <p>
                  <span>{t("kundali.total")} — </span>
                  <span className="font-semibold text-foreground">
                    {digits(formatDashaDuration(headline.end.getTime() - headline.start.getTime(), lang))}
                  </span>
                </p>
                <p>
                  <span>{t("kundali.left")} — </span>
                  <span className="font-semibold text-foreground">
                    {digits(formatDashaDuration(headline.end.getTime() - now, lang))}
                  </span>
                </p>
              </div>
            )}
            <SpanProgress start={headline.start} end={headline.end} now={now} />
          </div>
        </div>
      )}

      {timelineStart && timelineEnd && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
          <span>
            <span className="font-semibold uppercase tracking-wide text-sm">{t("kundali.from")}</span>{" "}
            <span className="text-base text-foreground/80">
              {formatMoment(timelineStart, lang, timeZone, digits)}
            </span>
          </span>
          <span className="hidden sm:inline">→</span>
          <span>
            <span className="font-semibold uppercase tracking-wide text-sm">{t("kundali.to")}</span>{" "}
            <span className="text-base text-foreground/80">
              {formatMoment(timelineEnd, lang, timeZone, digits)}
            </span>
          </span>
        </div>
      )}

      <div>
        <div className="flex gap-1 overflow-x-auto pb-1" role="tablist">
          {LEVEL_LABELS.slice(0, maxLevel + 1).map((key, i) => {
            const disabled = levelLists[i] == null && i !== 0;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={selectedLevel === i}
                disabled={disabled}
                onClick={() => setManualLevel(i)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                  selectedLevel === i
                    ? "border-secondary/40 bg-secondary/12 text-secondary"
                    : "border-border bg-transparent text-muted-foreground hover:text-foreground",
                  disabled && "cursor-not-allowed opacity-40",
                )}
              >
                {t(key)}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 pt-1">
          {cards.length > 0 ? (
            cards.map((span, i) => (
              <PeriodCard
                key={`${span.lord}-${span.start.getTime()}-${i}`}
                span={span}
                system={system}
                lang={lang}
                digits={digits}
                timeZone={timeZone}
                now={now}
                selected={path[selectedLevel]?.start.getTime() === span.start.getTime()}
                onSelect={() => pick(selectedLevel, span)}
              />
            ))
          ) : (
            <p className="py-2 text-sm text-muted-foreground">{t("common.loading")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
