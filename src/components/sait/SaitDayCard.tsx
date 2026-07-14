import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import { patroCard } from "@/lib/patro-classes";
import type { SaitDetailDay } from "@/lib/api";

/**
 * One qualifying muhūrta day: the representative clean window plus the
 * panchāṅga (tithi, nakṣatra, yoga, karaṇa, lagna, lunar month) that made the
 * day survive the rules. Shared by the per-ceremony sāit pages so every
 * ceremony explains its dates the same way the vivāha page does.
 */
export function SaitDayCard({ d }: { d: SaitDetailDay }) {
  const { pick, digits } = useLocale();
  const overnight = d.window_end < d.window_start;
  const reason = pick(
    `${pick(d.weekday_ne, d.weekday_en)}, ${d.paksha_ne} ${d.tithi_ne}, ${d.nakshatra_ne} नक्षत्र र ${d.yoga_ne} योग — कुनै दोषविनाको शुद्ध मुहूर्त।`,
    `${d.weekday_en}, ${d.paksha === "shukla" ? "Shukla" : "Krishna"} ${d.tithi_en}, ${d.nakshatra_en} nakṣatra & ${d.yoga_en} yoga — a clean window with no doṣa.`,
  );
  const rows: { label: string; value: string }[] = [
    { label: pick("तिथि", "Tithi"), value: `${d.paksha_ne} ${pick(d.tithi_ne, d.tithi_en)}` },
    { label: pick("नक्षत्र", "Nakṣatra"), value: pick(d.nakshatra_ne, d.nakshatra_en) },
    { label: pick("योग", "Yoga"), value: pick(d.yoga_ne, d.yoga_en) },
    { label: pick("करण", "Karaṇa"), value: pick(d.karana_ne, d.karana_en) },
    { label: pick("लग्न", "Lagna"), value: d.lagna_en },
    { label: pick("चन्द्रमास", "Lunar month"), value: pick(d.lunar_month_ne ?? "", d.lunar_month_en ?? "") },
  ];

  return (
    <div className={cn(patroCard, "flex flex-col gap-2.5 p-4")}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-base font-bold text-foreground">
          {pick(d.bs_month_name_ne, d.bs_month_name_ne)} {digits(d.bs_day)}
        </span>
        <span className="text-sm text-muted-foreground">
          {pick(d.weekday_ne, d.weekday_en)} · {d.gregorian}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="inline-flex items-center rounded-md bg-secondary/12 px-2 py-1 font-semibold text-secondary tabular-nums">
          {digits(d.window_start)} – {digits(d.window_end)}
          {overnight ? ` (${pick("भोलिपल्ट", "+1")})` : ""}
        </span>
        <span className="text-muted-foreground">{pick("शुभ लग्न विण्डो", "auspicious window")}</span>
      </div>

      <p className="text-sm leading-relaxed text-foreground">{reason}</p>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col">
            <dt className="text-xs text-muted-foreground">{r.label}</dt>
            <dd className="font-semibold text-foreground">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default SaitDayCard;
