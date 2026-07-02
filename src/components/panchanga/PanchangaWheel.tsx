import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PanchangaDay } from "@/lib/api";
import { fetchPanchangaAtTime, panchangaKeys } from "@/lib/api";
import { getPanchangaDetail } from "@/lib/panchanga-format";
import { minutesSinceMidnightInTimezone, resolveTimeZone } from "@/lib/zoned-time";
import {
  buildWheelDetail,
  buildWheelMarkersFromDetail,
  DEFAULT_WHEEL_TWEAKS,
  gClock,
  scrubGToDatetime,
  WHEEL_RASHIS,
  type WheelDetail,
} from "@/lib/wheel-data";
import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { WheelChart, type WheelHover, type WheelPick } from "./WheelChart";
import { WheelPanel } from "./WheelPanel";
import { useLocale } from "@/i18n/locale";
import { BS_MONTHS_NE, BS_MONTH_NAMES } from "@/lib/bs-calendar";
import { NAK_LORD_EN } from "@/lib/wheel-locale";

function bsMonthEnOf(ne: string): string {
  const i = BS_MONTHS_NE.indexOf(ne);
  return i >= 0 ? BS_MONTH_NAMES[i] : ne;
}

interface Props {
  p: PanchangaDay;
  bsYear: number;
  bsMonthNe: string;
  bsDay: number;
  isToday?: boolean;
  timezone?: string;
  locationLabel?: string;
}

function PanchangaWheelImpl({
  p,
  bsYear,
  bsMonthNe,
  bsDay,
  isToday,
  timezone,
  locationLabel,
}: Props) {
  const det: WheelDetail = useMemo(() => buildWheelDetail(p), [p]);
  const tz = resolveTimeZone(p?.location?.timezone, timezone);
  const [now, setNow] = useState(() => new Date());

  const [spin, setSpin] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [picked, setPicked] = useState<WheelPick | null>(null);
  const [hover, setHover] = useState<WheelHover | null>(null);
  const [tip, setTip] = useState({ x: 0, y: 0 });
  const [scrubPinned, setScrubPinned] = useState(false);

  const handleZoom = useCallback((z: number) => {
    const next = Math.max(0.55, Math.min(14, z));
    setZoom(next);
    if (next <= 1) setPan({ x: 0, y: 0 });
  }, []);

  const handlePan = useCallback((x: number, y: number) => setPan({ x, y }), []);

  const handleLeave = useCallback(() => setHover(null), []);
  const handlePick = useCallback(
    (pick: WheelPick) =>
      setPicked((prev) =>
        prev && prev.type === pick.type && prev.i === pick.i ? null : pick
      ),
    []
  );

  const nowG = useMemo(() => {
    const mins = minutesSinceMidnightInTimezone(now, tz, true);
    let g = (mins - det.sunriseMin) / 24;
    if (g < 0) g += 60;
    return Math.max(0, Math.min(60, g));
  }, [now, det.sunriseMin, tz]);

  const [scrubG, setScrubG] = useState(() => (isToday ? nowG : 0));
  const [debouncedScrubG, setDebouncedScrubG] = useState(scrubG);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedScrubG(scrubG), 280);
    return () => clearTimeout(id);
  }, [scrubG]);

  const anchorAd = p.panchanga_date_ad ?? p.date_ad ?? "";
  const locationParams = useMemo(
    () =>
      p.location?.city_id != null
        ? { city_id: p.location.city_id as number }
        : p.location?.lat != null && p.location?.lon != null
          ? {
              lat: p.location.lat as number,
              lon: p.location.lon as number,
              timezone: p.location.timezone,
            }
          : undefined,
    [p.location]
  );

  const scrubDatetime = useMemo(
    () => scrubGToDatetime(anchorAd, debouncedScrubG, det.sunriseMin),
    [anchorAd, debouncedScrubG, det.sunriseMin]
  );

  const scrubQ = useQuery({
    queryKey: panchangaKeys.atTime(scrubDatetime, locationParams),
    queryFn: () => fetchPanchangaAtTime(scrubDatetime, locationParams),
    staleTime: 1000 * 60,
    enabled: Boolean(anchorAd),
  });

  const scrubDet: WheelDetail = useMemo(
    () => (scrubQ.data ? buildWheelDetail(scrubQ.data) : det),
    [scrubQ.data, det]
  );

  const scrubLagnaLon = useMemo(() => {
    if (!scrubQ.data) return null;
    const detail = getPanchangaDetail(scrubQ.data);
    const instant = detail?.instant_lagna as { longitude?: number } | undefined;
    return instant?.longitude ?? null;
  }, [scrubQ.data]);

  const markers = useMemo(
    () => buildWheelMarkersFromDetail(scrubDet, scrubLagnaLon),
    [scrubDet, scrubLagnaLon]
  );

  const handleScrubChange = useCallback((g: number) => {
    setScrubG(g);
    setScrubPinned(true);
  }, []);

  const snapToNow = useCallback(() => {
    setScrubPinned(false);
    setSpin(0);
    setPan({ x: 0, y: 0 });
    setScrubG(nowG);
  }, [nowG]);

  useEffect(() => {
    if (!isToday) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [isToday]);

  useEffect(() => {
    if (scrubPinned || !isToday) return;
    setScrubG(nowG);
  }, [nowG, isToday, scrubPinned]);

  useEffect(() => {
    setScrubPinned(false);
    setSpin(0);
    if (isToday) {
      setScrubG(nowG);
    } else {
      setScrubG(0);
    }
    // Only when the civil/vedic day changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.date_ad, p.panchanga_date_ad]);

  const { pick, digits } = useLocale();
  const stageRef = useRef<HTMLDivElement>(null);
  const num = (n: number | string) => digits(n);
  const scrubClock = gClock(scrubG, det.sunriseMin);
  const scrubTithi = scrubQ.data
    ? (getPanchangaDetail(scrubQ.data)?.tithi as { name_ne?: string; name?: string } | undefined) ??
      (scrubQ.data.tithi as { name_ne?: string; name?: string } | undefined)
    : undefined;
  const tithiNe = scrubTithi?.name_ne ?? det.tithi2[0]?.ne ?? "—";
  const tithiEn = scrubTithi?.name ?? det.tithi2[0]?.en ?? tithiNe;
  const locLabel = locationLabel ?? p.location?.name ?? pick("काठमाडौं", "Kathmandu");

  const onStageMove = (e: React.MouseEvent) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    setTip({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  let tipNode: React.ReactNode = null;
  if (hover) {
    if (hover.type === "nak") {
      const ic = NAKSHATRA_ICONS[hover.i]!;
      tipNode = (
        <div className="w-tip show" style={{ left: tip.x, top: tip.y }}>
          <div className="w-tip-kind">{pick("नक्षत्र", "Nakshatra")} · {num(hover.i + 1)}</div>
          <div className="w-tip-title">{pick(ic.ne, ic.en)}</div>
          <div className="w-tip-row">
            <span>{pick("स्वामी", "Lord")}</span>
            <b>{pick(ic.lord_ne, NAK_LORD_EN[ic.lord_ne] ?? ic.lord_ne)}</b>
          </div>
          <div className="w-tip-sym">{ic.sym_ne}</div>
        </div>
      );
    } else {
      const rs = WHEEL_RASHIS[hover.i]!;
      tipNode = (
        <div className="w-tip show" style={{ left: tip.x, top: tip.y }}>
          <div className="w-tip-kind">{pick("राशि", "Rashi")} · {num(hover.i + 1)}</div>
          <div className="w-tip-title">
            <span style={{ fontFamily: '"Noto Sans Symbols 2", "Segoe UI Symbol", serif' }}>
              {rs.sym + "\uFE0E"}
            </span>{" "}
            {pick(rs.ne, rs.en)}
          </div>
          <div className="w-tip-row">
            <span>{pick("महिना", "Month")}</span>
            <b>{pick(bsMonthNe, bsMonthEnOf(bsMonthNe))}</b>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="pn-wheel rounded-2xl border border-border overflow-hidden">
      <div className="w-stage" ref={stageRef} onMouseMove={onStageMove}>
        <div className="w-head">
          <div className="w-head-eyebrow">{pick("नेपाली पात्रो · पञ्चाङ्ग चक्र", "Nepali Patro · Panchanga Wheel")}</div>
          <div className="w-head-title">
            {isToday && !scrubPinned ? pick("आजको", "Today's") : ""}{" "}
            {pick("ग्रह–नक्षत्र · तिथि–करण चक्र", "Graha–Nakshatra · Tithi–Karana wheel")}{" "}
            <span className="yr">{num(bsYear)}</span>
          </div>
          <div className="w-head-sub">
            {pick(det.weekday.ne, det.weekday.en)}, {pick(bsMonthNe, bsMonthEnOf(bsMonthNe))}{" "}
            {num(bsDay)} · {pick(tithiNe, tithiEn)} · {locLabel}
          </div>
        </div>

        <WheelChart
          det={scrubDet}
          markers={markers}
          spin={spin}
          tw={DEFAULT_WHEEL_TWEAKS}
          bsYear={bsYear}
          sel={picked}
          hover={hover}
          onHover={setHover}
          onLeave={handleLeave}
          onPick={handlePick}
          onSpin={setSpin}
          zoom={zoom}
          onZoom={handleZoom}
          pan={pan}
          onPan={handlePan}
        />

        {tipNode}

        <WheelPanel
          sel={picked}
          open={!!picked}
          num={num}
          onClose={() => setPicked(null)}
        />

        <div className="w-legend">
          <div className="w-legend-row">
            <span className="w-legend-dot" style={{ background: "var(--w-accent)" }} />
            {pick("लग्न · वर्तमान नक्षत्र · तिथि", "Lagna · current nakshatra · tithi")}
          </div>
          <div className="w-legend-row">
            <span className="w-legend-dot" style={{ background: "#f2a81d" }} />
            {pick("सूर्य राशि", "Sun sign")}
          </div>
          <div className="w-legend-row">
            <span className="w-legend-dot" style={{ background: "#d3dce4" }} />
            {pick("चन्द्र राशि", "Moon sign")}
          </div>
          <div className="w-legend-row" style={{ opacity: 0.7, marginTop: 2 }}>
            {pick("घुमाउन तान्नुहोस् · pinch to zoom", "drag to rotate · pinch to zoom")}
          </div>
        </div>

        <div className="w-dock">
          <div className="w-dock-grp">
            <span className="w-dock-label">{pick("समय", "Time")}</span>
            <input
              className="w-scrub"
              type="range"
              min="0"
              max="60"
              step="0.25"
              value={scrubG}
              style={{ "--fill": `${(scrubG / 60) * 100}%` } as React.CSSProperties}
              onChange={(e) => handleScrubChange(+e.target.value)}
            />
            <span className="w-dock-val">{num(scrubClock)}</span>
          </div>
          <div className="w-dock-sep" />
          <div className="w-dock-grp">
            {isToday && (
              <button
                type="button"
                className="w-dock-todaybtn"
                title={pick("अहिलेको समय", "Current time")}
                onClick={snapToNow}
              >
                {pick("आज", "Now")}
              </button>
            )}
            <button
              type="button"
              className="w-iconbtn"
              title={pick("उत्तर सिधा", "North up")}
              onClick={() => setSpin(0)}
            >
              ⟳
            </button>
            <button
              type="button"
              className="w-iconbtn"
              title="Zoom in"
              onClick={() => handleZoom(zoom * 1.4)}
            >
              +
            </button>
            <button
              type="button"
              className="w-iconbtn"
              title="Zoom out"
              onClick={() => handleZoom(zoom / 1.4)}
            >
              −
            </button>
            {zoom !== 1 && (
              <button
                type="button"
                className="w-iconbtn"
                title="Reset zoom"
                onClick={() => { handleZoom(1); setPan({ x: 0, y: 0 }); }}
                style={{ fontSize: 9, padding: "0 6px" }}
              >
                1:1
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const PanchangaWheel = memo(PanchangaWheelImpl);
