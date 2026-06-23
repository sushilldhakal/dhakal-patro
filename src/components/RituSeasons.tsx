import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sprout } from "lucide-react";
import { adToBS, bsToAD, BS_MONTHS_NE } from "@/lib/bs-calendar";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { fetchPanchanga, panchangaKeys } from "@/lib/api";
import {
  resolveLocationTimezone,
  type PanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";
import { todayAdStringInTimezone } from "@/lib/zoned-time";

/**
 * ऋतु — the six traditional Nepali seasons, each spanning two solar (BS) months.
 * A BS month always begins on a सङ्क्रान्ति (the Sun entering a new sidereal
 * rāśi), so a season boundary is गते १ of its first month — astronomically the
 * sankranti. We list the whole year's cycle of six seasons starting from the
 * current one, each with its starting गते / month and AD date; the current one
 * is highlighted with a progress bar, the rest show how soon they begin.
 *
 *   वसन्त   चैत–वैशाख      ग्रीष्म  जेठ–असार
 *   वर्षा   साउन–भदौ       शरद्    असोज–कात्तिक
 *   हेमन्त  मंसिर–पुष       शिशिर   माघ–फागुन
 *
 * The ऋतु labels are a NORTHERN-hemisphere (Nepal) climate scheme. A given solar
 * longitude is the OPPOSITE season in the southern hemisphere, so for a location
 * south of the equator we shift the displayed season by 3 slots (= 6 months =
 * 180° of solar longitude). The गते-१ boundaries themselves are unchanged — the
 * Sun's position is global; only which season that position *feels* like flips.
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
/** the second (odd) BS month of a season whose first month is `m` */
const secondMonth = (m: number) => (m === 12 ? 1 : m + 1);

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

interface SeasonItem {
  solarSlot: number;
  startMonth: number;
  startAd: Date;
  isCurrent: boolean;
  daysUntil: number;
  progress: { elapsed: number; total: number; pct: number } | null;
}

export function RituSeasons({ location }: { location: PanchangaLocation }) {
  const todayAd = useMemo(
    () => todayAdStringInTimezone(new Date(), resolveLocationTimezone(location)),
    [location],
  );

  // latitude → hemisphere. Prefer coords on the params; otherwise the panchanga
  // response resolves a city_id to its lat/lon (query shared with the aside).
  const panchangaQ = useQuery({
    queryKey: panchangaKeys.day(todayAd, "ad", location.params),
    queryFn: () => fetchPanchanga(todayAd, "ad", location.params),
    staleTime: 1000 * 60 * 30,
  });
  const lat = location.params.lat ?? panchangaQ.data?.location?.lat;
  const south = lat != null && lat < 0;

  const seasons = useMemo<SeasonItem[]>(() => {
    const today = new Date();
    const t = midnight(today);
    let s = seasonStart(adToBS(today).year, adToBS(today).month);
    const out: SeasonItem[] = [];
    for (let i = 0; i < 6; i += 1) {
      const next = addTwoMonths(s);
      const startAd = bsToAD(s.year, s.month, 1);
      const startMs = midnight(startAd);
      const endMs = midnight(bsToAD(next.year, next.month, 1));
      const isCurrent = i === 0;
      const total = Math.max(1, Math.round((endMs - startMs) / DAY));
      out.push({
        solarSlot: startMonthToSlot(s.month),
        startMonth: s.month,
        startAd,
        isCurrent,
        daysUntil: Math.round((startMs - t) / DAY),
        progress: isCurrent
          ? {
              elapsed: Math.max(0, Math.round((t - startMs) / DAY)),
              total,
              pct: Math.max(0, Math.min(100, ((t - startMs) / DAY / total) * 100)),
            }
          : null,
      });
      s = next;
    }
    return out;
  }, []);

  // southern hemisphere → opposite season (shift 3 slots / 6 months)
  const flip = (slot: number) => (south ? (slot + 3) % 6 : slot);
  const relLabel = (days: number) => (days <= 0 ? "" : days === 1 ? "भोलि" : `${N(days)} दिनपछि`);

  return (
    <div className="sea-block">
      <div className="sea-head">
        <Sprout size={18} strokeWidth={1.8} />
        <h2 className="sea-title">ऋतु</h2>
        <span className="sea-sub">
          वर्षका छ ऋतु{location.label ? ` · ${location.label}` : ""}
          {south && <span className="sea-flip"> · दक्षिणी गोलार्ध</span>}
        </span>
      </div>

      <div className="sea-grid">
        {seasons.map((item, i) => {
          const s = SEASONS[flip(item.solarSlot)]!;
          const m1 = BS_MONTHS_NE[item.startMonth - 1];
          const m2 = BS_MONTHS_NE[secondMonth(item.startMonth) - 1];
          return (
            <div key={i} className={`sea-card ${item.isCurrent ? "current" : "upcoming"}`}>
              <span className="sea-eyebrow">
                {item.isCurrent ? "चालू ऋतु · Current" : relLabel(item.daysUntil)}
              </span>
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
                  <span className="sea-tile-m">{m1}</span>
                </span>
              </div>
              <div className="sea-when">
                <span className="sea-when-bs">{m1}–{m2}</span>
                <span className="sea-when-ad mono">{fmtAd(item.startAd)} देखि</span>
              </div>
              {item.isCurrent && item.progress ? (
                <>
                  <div className="sea-progress" role="presentation">
                    <div className="sea-progress-fill" style={{ width: `${item.progress.pct}%` }} />
                  </div>
                  <div className="sea-meta">
                    <span>{N(item.progress.elapsed)} / {N(item.progress.total)} दिन</span>
                    <span className="mono">{N(Math.round(item.progress.pct))}%</span>
                  </div>
                </>
              ) : null}
            </div>
          );
        })}
      </div>

      {south && (
        <p className="sea-note">
          दक्षिणी गोलार्धमा ऋतु ६ महिना उल्टो हुन्छ — माथिका नाम तपाईंको स्थानको
          वास्तविक ऋतु अनुसार मिलाइएका छन् (मिति/गते उही सङ्क्रान्ति नै हुन्)।
        </p>
      )}
    </div>
  );
}
