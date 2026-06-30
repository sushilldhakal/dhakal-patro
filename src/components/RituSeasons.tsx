import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sprout, HelpCircle } from "lucide-react";
import { adToBS } from "@/lib/bs-calendar";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { fetchTropicalSeasons, seasonsKeys } from "@/lib/api";
import {
  resolveLocationTimezone,
  type PanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";
import { todayAdStringInTimezone } from "@/lib/zoned-time";

/**
 * ऋतु — the six traditional Nepali seasons, driven by the Sun's APPARENT TROPICAL
 * longitude (sāyana), i.e. the actual equinoxes and solstices — NOT by the
 * sidereal rāśi / साङ्क्रान्ति. वसन्त begins at the vernal equinox and शरद् at the
 * autumnal equinox; the two solstices fall mid-season (in ग्रीष्म and हेमन्त).
 * Each ऋतु spans an equal 60° of tropical longitude (computed by API).
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

const SEASON_KEYS = [
  "spring",
  "summer",
  "monsoon",
  "autumn",
  "pre_winter",
  "winter",
] as const;

const MARKER_KEYS: Partial<Record<number, string>> = {
  0: "ritu.vernal_equinox",
  3: "ritu.autumnal_equinox",
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
  const { t } = useTranslation();
  const tz = resolveLocationTimezone(location);
  const todayAd = useMemo(() => todayAdStringInTimezone(new Date(), tz), [tz]);

  const seasonsQ = useQuery({
    queryKey: seasonsKeys.tropical(location.params),
    queryFn: () => fetchTropicalSeasons(location.params),
    staleTime: 1000 * 60 * 60,
  });

  const south = seasonsQ.data?.southern_hemisphere ?? false;

  const seasons = useMemo<SeasonItem[]>(() => {
    const boundaries = seasonsQ.data?.boundaries;
    if (!boundaries?.length) return [];

    const nowMs = Date.now();
    const todayMid = midnightUtcMs(todayAd);

    return boundaries.map((b, i) => {
      const startAd = todayAdStringInTimezone(new Date(b.start_instant_utc), tz);
      const bs = adToBS(civilNoon(startAd));
      const next = boundaries[i + 1];
      let progress: SeasonItem["progress"] = null;
      if (b.is_current && next) {
        const startMs = Date.parse(b.start_instant_utc);
        const endMs = Date.parse(next.start_instant_utc);
        const total = Math.max(1, (endMs - startMs) / DAY);
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
        isCurrent: b.is_current,
        daysUntil: Math.round((midnightUtcMs(startAd) - todayMid) / DAY),
        progress,
      };
    });
  }, [seasonsQ.data, todayAd, tz]);

  const flip = (slot: number) => (south ? (slot + 3) % 6 : slot);
  const relLabel = (days: number) => {
    if (days <= 0) return "";
    if (days === 1) return t("ritu.tomorrow");
    return t("ritu.days_after", { count: Number(N(days)) });
  };

  const seasonEmoji = ["🌸", "☀️", "🌧️", "🍂", "🌫️", "❄️"];

  return (
    <div className="sea-block">
      <div className="sea-head">
        <Sprout size={18} strokeWidth={1.8} />
        <h2 className="sea-title">{t("ritu.title")}</h2>
        <span className="sea-sub">
          {t("ritu.subtitle")}{location.label ? ` · ${location.label}` : ""}
          {south && <span className="sea-flip">{t("ritu.southern")}</span>}
        </span>
        <Link to="/learn/$slug" params={{ slug: "ritu-drift" }} className="sea-why">
          <HelpCircle size={13} strokeWidth={2} aria-hidden />
          {t("ritu.why_link")}
        </Link>
      </div>

      <div className="sea-grid">
        {seasons.map((item, i) => {
          const slot = flip(item.solarSlot);
          const seasonKey = SEASON_KEYS[slot]!;
          const markerKey = MARKER_KEYS[item.solarSlot];
          return (
            <div key={i} className={`sea-card ${item.isCurrent ? "current" : "upcoming"}`}>
              <span className="sea-eyebrow">
                {item.isCurrent ? t("ritu.current") : relLabel(item.daysUntil)}
              </span>
              <div className="sea-card-row">
                <span className="sea-emoji" aria-hidden>
                  {seasonEmoji[slot]}
                </span>
                <span className="sea-name-wrap">
                  <span className="sea-name">{t(`ritu.${seasonKey}`)}</span>
                </span>
                <span className="sea-tile">
                  <span className="sea-tile-d">{N(item.startBs.day)}</span>
                  <span className="sea-tile-m">{item.startBs.monthName}</span>
                </span>
              </div>
              <div className="sea-when">
                <span className="sea-when-bs">
                  {markerKey ? t(markerKey) : t("ritu.sun_deg", { deg: N(item.angle) })}
                </span>
                <span className="sea-when-ad mono">{fmtAd(item.startAd)} {t("common.from")}</span>
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
