import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useLocale, type Lang } from "@/i18n/locale";
import {
  DASHA_LORD_EN,
  DASHA_LORD_NE,
  formatDashaDuration,
  subdivideDasha,
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

const WEEKDAY_NE = [
  "आइतबार", "सोमबार", "मङ्गलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार",
];

const GREG_NE = [
  "जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन",
  "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर",
];

/** "November 4, 2019, Monday at 06:37" localized to the chart's timezone. */
function formatMoment(date: Date, lang: Lang, timeZone?: string, digits?: (v: string | number) => string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const month = Number(get("month"));
  const day = get("day");
  const year = get("year");
  const weekdayShort = get("weekday");
  const time = `${get("hour")}:${get("minute")}`;
  const weekdayIdx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekdayShort);

  if (lang === "en") {
    const monthEn = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ][month - 1];
    const weekdayEn = [
      "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
    ][weekdayIdx];
    return `${monthEn} ${day}, ${year}, ${weekdayEn} at ${time}`;
  }
  const d = digits ?? String;
  return `${GREG_NE[month - 1]} ${d(day)}, ${d(year)}, ${WEEKDAY_NE[weekdayIdx] ?? ""} ${d(time)}`;
}

function lordName(lord: DashaSpan["lord"], lang: Lang): string {
  return lang === "en" ? DASHA_LORD_EN[lord] : DASHA_LORD_NE[lord];
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

function DashaNode({
  span,
  level,
  now,
  timeZone,
}: {
  span: DashaSpan;
  level: number;
  now: number;
  timeZone?: string;
}) {
  const { lang, pick, digits } = useLocale();
  const [open, setOpen] = useState(false);

  const running = span.start.getTime() <= now && now < span.end.getTime();
  const expandable = level < MAX_LEVEL;
  const children = useMemo(
    () => (open && expandable ? subdivideDasha(span) : null),
    [open, expandable, span],
  );

  const duration = formatDashaDuration(span.end.getTime() - span.start.getTime(), lang);
  const levelLabel = pick(LEVEL_LABELS[level]!.ne, LEVEL_LABELS[level]!.en);

  return (
    <li className={cn(level > 0 && "border-l border-border/70 pl-3")}>
      <button
        type="button"
        onClick={() => expandable && setOpen((v) => !v)}
        disabled={!expandable}
        aria-expanded={expandable ? open : undefined}
        className={cn(
          "w-full rounded-lg px-2.5 py-2 text-left transition-colors",
          expandable && "hover:bg-muted/50",
          running && "bg-secondary/[0.07] dark:bg-secondary/10",
        )}
      >
        <span className="flex items-center gap-2">
          {expandable ? (
            <ChevronRight
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-90",
              )}
              aria-hidden
            />
          ) : (
            <span className="w-3.5 shrink-0" />
          )}
          <span className="text-[13px] font-bold text-foreground">
            {lordName(span.lord, lang)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {levelLabel}
            <span className="mx-1 text-muted-foreground/50">·</span>
            {digits(duration)}
          </span>
          {running && (
            <span className="ml-auto shrink-0 rounded-full bg-secondary/15 px-2 py-0.5 text-[9.5px] font-bold text-secondary">
              {pick("चालु दशा", "Running Dasha")}
            </span>
          )}
        </span>
        <span className="mt-1 block space-y-0.5 pl-[22px]">
          <MomentLine
            label={pick("सुरु", "Begin")}
            value={formatMoment(span.start, lang, timeZone, digits)}
          />
          <MomentLine
            label={pick("अन्त्य", "End")}
            value={formatMoment(span.end, lang, timeZone, digits)}
          />
        </span>
      </button>
      {children && (
        <ul className="mt-1 mb-2 ml-4 flex flex-col gap-1">
          {children.map((child, i) => (
            <DashaNode
              key={`${child.lord}-${i}`}
              span={child}
              level={level + 1}
              now={now}
              timeZone={timeZone}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export type DashaTreeProps = {
  /** Full-span mahadashas in chronological order. */
  mahadashas: DashaSpan[];
  /** IANA timezone of the chart's place, for begin/end display. */
  timeZone?: string;
};

/**
 * Expandable Vimshottari hierarchy: Maha → Antar → Pratyantar → Sukshma →
 * Prana dashas, subdivided on demand. The running period at each level is
 * highlighted.
 */
export function DashaTree({ mahadashas, timeZone }: DashaTreeProps) {
  const { lang, pick, digits } = useLocale();
  const [now] = useState(() => Date.now());

  const running = mahadashas.find(
    (m) => m.start.getTime() <= now && now < m.end.getTime(),
  );

  return (
    <div className="space-y-4">
      {running && (
        <div className="rounded-xl border border-secondary/25 bg-secondary/[0.06] dark:bg-secondary/10 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-foreground">
              {lordName(running.lord, lang)}
              <span className="mx-1.5 font-normal text-muted-foreground">·</span>
              {pick("महादशा", "Maha Dasha")}
            </p>
            <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-bold text-secondary">
              {pick("चालु दशा", "Running Dasha")}
            </span>
          </div>
          <div className="mt-1.5 space-y-0.5">
            <MomentLine
              label={pick("सुरु", "Begin")}
              value={formatMoment(running.start, lang, timeZone, digits)}
            />
            <MomentLine
              label={pick("अन्त्य", "End")}
              value={formatMoment(running.end, lang, timeZone, digits)}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px]">
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
        </div>
      )}

      <ul className="flex flex-col gap-1">
        {mahadashas.map((span, i) => (
          <DashaNode key={`${span.lord}-${i}`} span={span} level={0} now={now} timeZone={timeZone} />
        ))}
      </ul>
    </div>
  );
}
