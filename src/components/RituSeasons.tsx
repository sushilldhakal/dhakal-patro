import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sprout, HelpCircle } from "lucide-react";
import { adToBS } from "@/lib/bs-calendar";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { fetchPanchanga, panchangaKeys } from "@/lib/api";
import {
  resolveLocationTimezone,
  type PanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";
import { todayAdStringInTimezone } from "@/lib/zoned-time";
import { tropicalSeasonCycle } from "@/lib/tropical-seasons";

/**
 * ऋतु — the six traditional Nepali seasons, driven by the Sun's APPARENT TROPICAL
 * longitude (sāyana), i.e. the actual equinoxes and solstices — NOT by the
 * sidereal rāśi / साङ्क्रान्ति. वसन्त begins at the vernal equinox and शरद् at the
 * autumnal equinox; the two solstices fall mid-season (in ग्रीष्म and हेमन्त).
 * Each ऋतु spans an equal 60° of tropical longitude. See `lib/tropical-seasons`.
 *
 *   वसन्त   λ 0°    ग्रीष्म  λ 60°    वर्षा   λ 120°
 *   शरद्    λ 180°  हेमन्त  λ 240°    शिशिर  λ 300°
 *
 * The ऋतु labels are a NORTHERN-hemisphere (Nepal) climate scheme. A given solar
 * longitude is the OPPOSITE season in the southern hemisphere, so for a location
 * south of the equator we shift the displayed season by 3 slots (= 6 months =
 * 180° of solar longitude). The longitudes / dates themselves are unchanged — the
 * Sun's position is global; only which season that position *feels* like flips.
 */

const N = toNepaliDigits;
const DAY = 86_400_000;

const SEASONS = [
  { ne: "वसन्त", en: "Spring", emoji: "🌸" }, // slot 0 — λ 0° (vernal equinox)
  { ne: "ग्रीष्म", en: "Summer", emoji: "☀️" }, // slot 1 — λ 60°
  { ne: "वर्षा", en: "Monsoon", emoji: "🌧️" }, // slot 2 — λ 120°
  { ne: "शरद्", en: "Autumn", emoji: "🍂" }, // slot 3 — λ 180° (autumnal equinox)
  { ne: "हेमन्त", en: "Pre-winter", emoji: "🌫️" }, // slot 4 — λ 240°
  { ne: "शिशिर", en: "Winter", emoji: "❄️" }, // slot 5 — λ 300°
] as const;

/** The cardinal astronomical event that anchors a boundary, where one applies. */
const MARKERS: Record<number, { ne: string; en: string }> = {
  0: { ne: "वसन्त विषुव", en: "Vernal equinox" }, // λ 0°
  3: { ne: "शरद् विषुव", en: "Autumnal equinox" }, // λ 180°
};

const midnightUtcMs = (adStr: string) => Date.parse(`${adStr}T00:00:00Z`);
/** A Date whose UTC calendar day equals the given civil date string. */
const civilNoon = (adStr: string) => new Date(`${adStr}T12:00:00Z`);
const fmtAd = (adStr: string) =>
  civilNoon(adStr).toLocaleDateString("en", { day: "numeric", month: "short", timeZone: "UTC" });

interface SeasonItem {
  solarSlot: number;
  angle: number;
  startBs: { day: number; monthName: string };
  startAd: string;
  isCurrent: boolean;
  daysUntil: number;
  progress: { elapsed: number; total: number; pct: number } | null;
}

export function RituSeasons({ location }: { location: PanchangaLocation }) {
  const tz = resolveLocationTimezone(location);
  const todayAd = useMemo(() => todayAdStringInTimezone(new Date(), tz), [tz]);

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
    const now = new Date();
    const nowMs = now.getTime();
    const todayMid = midnightUtcMs(todayAdStringInTimezone(now, tz));
    const cycle = tropicalSeasonCycle(now);

    return cycle.map((b, i) => {
      const startAd = todayAdStringInTimezone(b.startInstant, tz);
      const bs = adToBS(civilNoon(startAd));
      const next = cycle[i + 1];
      let progress: SeasonItem["progress"] = null;
      if (b.isCurrent && next) {
        const startMs = b.startInstant.getTime();
        const total = Math.max(1, (next.startInstant.getTime() - startMs) / DAY);
        const elapsed = Math.max(0, (nowMs - startMs) / DAY);
        progress = {
          elapsed: Math.round(elapsed),
          total: Math.round(total),
          pct: Math.max(0, Math.min(100, (elapsed / total) * 100)),
        };
      }
      return {
        solarSlot: b.slot,
        angle: b.angle,
        startBs: { day: bs.day, monthName: bs.monthName },
        startAd,
        isCurrent: b.isCurrent,
        daysUntil: Math.round((midnightUtcMs(startAd) - todayMid) / DAY),
        progress,
      };
    });
  }, [tz]);

  // southern hemisphere → opposite season (shift 3 slots / 180° of longitude)
  const flip = (slot: number) => (south ? (slot + 3) % 6 : slot);
  const relLabel = (days: number) => (days <= 0 ? "" : days === 1 ? "भोलि" : `${N(days)} दिनपछि`);

  return (
    <div className="sea-block">
      <div className="sea-head">
        <Sprout size={18} strokeWidth={1.8} />
        <h2 className="sea-title">ऋतु</h2>
        <span className="sea-sub">
          सायन ऋतु · विषुव–अयनान्त{location.label ? ` · ${location.label}` : ""}
          {south && <span className="sea-flip"> · दक्षिणी गोलार्ध</span>}
        </span>
        <Link to="/learn/$slug" params={{ slug: "ritu-drift" }} className="sea-why">
          <HelpCircle size={13} strokeWidth={2} aria-hidden />
          ऋतु किन सर्छ?
        </Link>
      </div>

      <div className="sea-grid">
        {seasons.map((item, i) => {
          const s = SEASONS[flip(item.solarSlot)]!;
          const marker = MARKERS[item.solarSlot];
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
                  <span className="sea-tile-d">{N(item.startBs.day)}</span>
                  <span className="sea-tile-m">{item.startBs.monthName}</span>
                </span>
              </div>
              <div className="sea-when">
                <span className="sea-when-bs">
                  {marker ? marker.ne : `सूर्य ${N(item.angle)}°`}
                </span>
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
          वास्तविक ऋतु अनुसार मिलाइएका छन् (विषुव/अयनान्तका मिति उही नै हुन्)।
        </p>
      )}
    </div>
  );
}
