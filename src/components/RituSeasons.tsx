import { useMemo } from "react";
import { Sprout } from "lucide-react";
import { adToBS, bsToAD, BS_MONTHS_NE } from "@/lib/bs-calendar";
import { toNepaliDigits } from "@/lib/panchanga-format";

/**
 * ऋतु — the six traditional Nepali seasons, each spanning two solar (BS) months.
 * A BS month always begins on a सङ्क्रान्ति (the Sun entering a new sidereal
 * rāśi), so a season boundary is गते १ of its first month — astronomically the
 * sankranti. We show the CURRENT season (with how far it has progressed) and the
 * NEXT season, each with its starting गते / month and the matching AD date.
 *
 *   वसन्त   चैत–वैशाख      ग्रीष्म  जेठ–असार
 *   वर्षा   साउन–भदौ       शरद्    असोज–कात्तिक
 *   हेमन्त  मंसिर–पुष       शिशिर   माघ–फागुन
 */

const N = toNepaliDigits;
const DAY = 86_400_000;

const SEASONS = [
  { ne: "वसन्त", en: "Spring", emoji: "🌸" }, // slot 0 — चैत(12), वैशाख(1)
  { ne: "ग्रीष्म", en: "Summer", emoji: "☀️" }, // slot 1 — जेठ(2), असार(3)
  { ne: "वर्षा", en: "Monsoon", emoji: "🌧️" }, // slot 2 — साउन(4), भदौ(5)
  { ne: "शरद्", en: "Autumn", emoji: "🍂" }, // slot 3 — असोज(6), कात्तिक(7)
  { ne: "हेमन्त", en: "Pre-winter", emoji: "🌫️" }, // slot 4 — मंसिर(8), पुष(9)
  { ne: "शिशिर", en: "Winter", emoji: "❄️" }, // slot 5 — माघ(10), फागुन(11)
] as const;

/** even start month → slot: 12→0, 2→1, 4→2, … 10→5 */
const startMonthToSlot = (m: number) => (m === 12 ? 0 : m / 2);

type YM = { year: number; month: number };

/** first month (गते १) of the season that contains the given BS month */
function seasonStart(year: number, month: number): YM {
  if (month % 2 === 0) return { year, month }; // even = a season's first month
  if (month === 1) return { year: year - 1, month: 12 }; // वैशाख → चैत (prev year)
  return { year, month: month - 1 };
}

function addTwoMonths({ year, month }: YM): YM {
  let m = month + 2;
  let y = year;
  if (m > 12) {
    m -= 12;
    y += 1;
  }
  return { year: y, month: m };
}

const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const fmtAd = (d: Date) => d.toLocaleDateString("en", { day: "numeric", month: "short" });

function SeasonCard({
  variant,
  slot,
  startMonth,
  startAd,
  meta,
}: {
  variant: "current" | "next";
  slot: number;
  startMonth: number;
  startAd: Date;
  meta: React.ReactNode;
}) {
  const s = SEASONS[slot]!;
  return (
    <div className={`sea-card ${variant}`}>
      <span className="sea-eyebrow">{variant === "current" ? "चालू ऋतु · Current" : "आगामी ऋतु · Next"}</span>
      <div className="sea-card-row">
        <span className="sea-emoji" aria-hidden>
          {s.emoji}
        </span>
        <span className="sea-name-wrap">
          <span className="sea-name">{s.ne}</span>
          <span className="sea-name-en">{s.en}</span>
        </span>
        <span className="sea-tile">
          <span className="sea-tile-d">{N(1)}</span>
          <span className="sea-tile-m">{BS_MONTHS_NE[startMonth - 1]}</span>
        </span>
      </div>
      <div className="sea-when">
        <span className="sea-when-bs">{BS_MONTHS_NE[startMonth - 1]} {N(1)} गतेदेखि</span>
        <span className="sea-when-ad mono">{fmtAd(startAd)}</span>
      </div>
      {meta}
    </div>
  );
}

export function RituSeasons({ locationLabel }: { locationLabel?: string }) {
  const model = useMemo(() => {
    const today = new Date();
    const bs = adToBS(today);
    const cur = seasonStart(bs.year, bs.month);
    const next = addTwoMonths(cur);
    const curAd = bsToAD(cur.year, cur.month, 1);
    const nextAd = bsToAD(next.year, next.month, 1);

    const t = midnight(today);
    const start = midnight(curAd);
    const end = midnight(nextAd);
    const total = Math.max(1, Math.round((end - start) / DAY));
    const elapsed = Math.round((t - start) / DAY);
    const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
    const daysToNext = Math.max(0, Math.ceil((end - t) / DAY));

    return {
      curSlot: startMonthToSlot(cur.month),
      nextSlot: startMonthToSlot(next.month),
      curMonth: cur.month,
      nextMonth: next.month,
      curAd,
      nextAd,
      endAd: new Date(end - DAY),
      pct,
      elapsed: Math.max(0, elapsed),
      total,
      daysToNext,
    };
  }, []);

  return (
    <div className="sea-block">
      <div className="sea-head">
        <Sprout size={18} strokeWidth={1.8} />
        <h2 className="sea-title">ऋतु</h2>
        <span className="sea-sub">
          छ ऋतुचक्र{locationLabel ? ` · ${locationLabel}` : ""}
        </span>
      </div>

      <div className="sea-grid">
        <SeasonCard
          variant="current"
          slot={model.curSlot}
          startMonth={model.curMonth}
          startAd={model.curAd}
          meta={
            <>
              <div className="sea-progress" role="presentation">
                <div className="sea-progress-fill" style={{ width: `${model.pct}%` }} />
              </div>
              <div className="sea-meta">
                <span>{N(model.elapsed)} / {N(model.total)} दिन</span>
                <span className="mono">{N(Math.round(model.pct))}%</span>
              </div>
            </>
          }
        />

        <SeasonCard
          variant="next"
          slot={model.nextSlot}
          startMonth={model.nextMonth}
          startAd={model.nextAd}
          meta={
            <div className="sea-meta">
              <span>{SEASONS[model.curSlot]!.ne} सकिएपछि</span>
              <span className="sea-next-rel">{N(model.daysToNext)} दिनपछि</span>
            </div>
          }
        />
      </div>
    </div>
  );
}
