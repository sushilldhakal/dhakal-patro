import { Clock3 } from "lucide-react";
import { useLocale } from "@/i18n/locale";
import { BS_MONTH_NAMES } from "@/lib/bs-calendar";
import { formatRashiDisplay } from "@/lib/panchanga-format";
import { cn } from "@/lib/utils";
import type {
  SaitDetailDay,
  SaitPersonalizeDay,
  SaitShuddhiPlanet,
  SaitShuddhiTone,
  SaitSuitability,
} from "@/lib/api";
import { SUITABILITY_STYLE } from "@/lib/sait-suitability";
import { SuitabilityBadge } from "@/components/sait/sait-suitability";

/**
 * One qualifying muhūrta day: the representative clean window plus the
 * panchāṅga that made the day survive the rules.
 */
const SHUDDHI_PLANET_LABEL: Record<
  SaitShuddhiPlanet["planet"],
  { ne: string; en: string }
> = {
  sun: { ne: "सूर्य", en: "Sun" },
  moon: { ne: "चन्द्र", en: "Moon" },
  guru: { ne: "गुरु", en: "Jupiter" },
  shukra: { ne: "शुक्र", en: "Venus" },
};

const SHUDDHI_TONE_TEXT: Record<SaitShuddhiTone, string> = {
  good: "text-success dark:text-success",
  shanti: "text-warning",
  avoid: "text-danger",
};

const SHUDDHI_TONE_CHIP: Record<SaitShuddhiTone, string> = {
  good: "bg-success/12 text-success-foreground dark:text-success",
  shanti: "bg-warning/15 text-warning",
  avoid: "bg-danger/12 text-danger",
};

const SHUDDHI_SUMMARY: Record<SaitShuddhiTone, { ne: string; en: string }> = {
  good: { ne: "ग्रह शुद्ध — शुभ", en: "Grahas strong — auspicious" },
  shanti: { ne: "शान्ति आवश्यक", en: "needs śānti" },
  avoid: { ne: "त्याज्य ग्रहस्थिति", en: "weak graha — avoid" },
};

export function SaitDayCard({
  d,
  index = 0,
  suitability,
  personalize,
}: {
  d: SaitDetailDay;
  index?: number;
  suitability?: SaitSuitability;
  personalize?: SaitPersonalizeDay;
}) {
  const { pick, digits, lang } = useLocale();
  const shuddhi = personalize?.shuddhi ?? null;
  const overnight = d.window_end < d.window_start;
  const monthLabel = pick(
    d.bs_month_name_ne,
    BS_MONTH_NAMES[d.bs_month - 1] ?? d.bs_month_name_ne,
  );
  const paksha = pick(
    d.paksha_ne,
    d.paksha === "shukla" ? "Shukla" : d.paksha === "krishna" ? "Krishna" : d.paksha_ne,
  );
  const rows: { label: string; value: string }[] = [
    { label: pick("तिथि", "Tithi"), value: `${paksha} ${pick(d.tithi_ne, d.tithi_en)}` },
    { label: pick("नक्षत्र", "Nakṣatra"), value: pick(d.nakshatra_ne, d.nakshatra_en) },
    { label: pick("योग", "Yoga"), value: pick(d.yoga_ne, d.yoga_en) },
    { label: pick("करण", "Karaṇa"), value: pick(d.karana_ne, d.karana_en) },
    {
      label: pick("लग्न", "Lagna"),
      value: formatRashiDisplay(d.lagna_ne, d.lagna_en, lang) ?? pick(d.lagna_ne, d.lagna_en) ?? "—",
    },
    {
      label: pick("चन्द्रमास", "Lunar month"),
      value: pick(d.lunar_month_ne ?? "—", d.lunar_month_en ?? "—"),
    },
  ];

  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card p-4",
        "animate-in fade-in fill-mode-both",
        suitability ? SUITABILITY_STYLE[suitability].ring : null,
      )}
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
    >
      {suitability ? (
        <div className="flex justify-end pb-1.5">
          <SuitabilityBadge suitability={suitability} />
        </div>
      ) : null}
      <div className="flex items-stretch gap-3 pb-3">
        <div className="flex min-w-[4.25rem] flex-col items-center justify-center rounded-lg bg-surface-inset px-2 py-2.5">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-secondary">
            {monthLabel}
          </span>
          <span className="font-num text-3xl font-bold leading-none tracking-tight text-foreground">
            {digits(d.bs_day)}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h3 className="m-0 text-base font-bold leading-tight text-foreground">
              {pick(d.weekday_ne, d.weekday_en)}
            </h3>
            <span className="font-num text-sm text-muted-foreground">{d.gregorian}</span>
          </div>

          <div className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-md bg-secondary/12 px-2 py-1 text-sm font-semibold text-secondary">
            <Clock3 className="size-3.5 shrink-0 opacity-80" aria-hidden />
            <span className="font-num tabular-nums">
              {digits(d.window_start)} – {digits(d.window_end)}
              {overnight ? ` (${pick("भोलिपल्ट", "+1")})` : ""}
            </span>
            <span className="hidden text-xs font-medium text-secondary/80 sm:inline">
              {pick("शुभ लग्न", "lagna window")}
            </span>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3 sm:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{r.label}</dt>
            <dd className="m-0 truncate text-sm font-semibold text-foreground">{r.value}</dd>
          </div>
        ))}
      </dl>

      {shuddhi && shuddhi.planets.length > 0 ? (
        <div className="mt-3 border-t border-border pt-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">
              {pick("ग्रह शुद्धि", "Graha Śuddhi")}
            </span>
            {shuddhi.planets.map((p) => (
              <span
                key={p.planet}
                title={pick(p.rashi_ne, p.rashi_en)}
                className={cn(
                  "font-num inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
                  SHUDDHI_TONE_CHIP[p.tone],
                )}
              >
                {pick(SHUDDHI_PLANET_LABEL[p.planet].ne, SHUDDHI_PLANET_LABEL[p.planet].en)}
                <span>{digits(p.house)}</span>
              </span>
            ))}
          </div>
          <p className={cn("m-0 mt-1.5 text-xs font-semibold", SHUDDHI_TONE_TEXT[shuddhi.tone])}>
            {pick(SHUDDHI_SUMMARY[shuddhi.tone].ne, SHUDDHI_SUMMARY[shuddhi.tone].en)}
            <span className="ml-1 font-normal text-muted-foreground">
              {pick("(जन्मराशिबाट भाव)", "(house from janma rāśi)")}
            </span>
          </p>
        </div>
      ) : null}
    </article>
  );
}

export default SaitDayCard;
