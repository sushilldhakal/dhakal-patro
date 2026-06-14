import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PanchangaDay } from "@/lib/api";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { minutesSinceMidnightInTimezone, resolveTimeZone } from "@/lib/zoned-time";
import {
  KAR_FIX_COLOR,
  KAR_FIX_NAMES,
  KAR_MOV,
  KAR_MOV_COLOR,
} from "@/lib/tithi-wheel-data";
import {
  buildWheelDetail,
  buildWheelMarkers,
  DEFAULT_WHEEL_TWEAKS,
  gClock,
  WHEEL_RASHIS,
  type WheelDetail,
} from "@/lib/wheel-data";
import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { TithiWheel } from "./TithiWheel";
import { WheelChart, type WheelHover, type WheelPick } from "./WheelChart";
import { WheelPanel } from "./WheelPanel";

type WheelMode = "rashi" | "tithi";

const WHEEL_MODE_KEY = "dhakalWheelMode";

interface Props {
  p: PanchangaDay;
  bsYear: number;
  bsMonthNe: string;
  bsDay: number;
  isToday?: boolean;
  timezone?: string;
  locationLabel?: string;
}

export function PanchangaWheel({
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

  const [mode, setMode] = useState<WheelMode>(() => {
    const saved = localStorage.getItem(WHEEL_MODE_KEY);
    return saved === "tithi" ? "tithi" : "rashi";
  });
  const [spin, setSpin] = useState(0);
  const [picked, setPicked] = useState<WheelPick | null>(null);
  const [hover, setHover] = useState<WheelHover | null>(null);
  const [tip, setTip] = useState({ x: 0, y: 0 });
  const [scrubPinned, setScrubPinned] = useState(false);

  const setModePersist = useCallback((next: WheelMode) => {
    setMode(next);
    localStorage.setItem(WHEEL_MODE_KEY, next);
    setPicked(null);
    setHover(null);
  }, []);

  const nowG = useMemo(() => {
    const mins = minutesSinceMidnightInTimezone(now, tz, true);
    let g = (mins - det.sunriseMin) / 24;
    if (g < 0) g += 60;
    return Math.max(0, Math.min(60, g));
  }, [now, det.sunriseMin, tz]);

  const [scrubG, setScrubG] = useState(() => (isToday ? nowG : 0));

  const markers = useMemo(
    () => buildWheelMarkers(p, det, scrubG),
    [p, det, scrubG]
  );

  const handleScrubChange = useCallback((g: number) => {
    setScrubG(g);
    setScrubPinned(true);
  }, []);

  const snapToNow = useCallback(() => {
    setScrubPinned(false);
    setSpin(0);
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

  const stageRef = useRef<HTMLDivElement>(null);
  const num = (n: number | string) => toNepaliDigits(n);
  const scrubClock = gClock(scrubG, det.sunriseMin);
  const tithiNe = det.tithi2[0]?.ne ?? "—";
  const locLabel = locationLabel ?? p.location?.name ?? "काठमाडौं";

  const onStageMove = (e: React.MouseEvent) => {
    if (mode !== "rashi") return;
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    setTip({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  let tipNode: React.ReactNode = null;
  if (mode === "rashi" && hover) {
    if (hover.type === "nak") {
      const ic = NAKSHATRA_ICONS[hover.i]!;
      tipNode = (
        <div className="w-tip show" style={{ left: tip.x, top: tip.y }}>
          <div className="w-tip-kind">नक्षत्र · {num(hover.i + 1)}</div>
          <div className="w-tip-title">{ic.ne}</div>
          <div className="w-tip-row">
            <span>स्वामी</span>
            <b>{ic.lord_ne}</b>
          </div>
          <div className="w-tip-sym">{ic.sym_ne}</div>
        </div>
      );
    } else {
      const rs = WHEEL_RASHIS[hover.i]!;
      tipNode = (
        <div className="w-tip show" style={{ left: tip.x, top: tip.y }}>
          <div className="w-tip-kind">राशि · {num(hover.i + 1)}</div>
          <div className="w-tip-title">
            <span style={{ fontFamily: '"Noto Sans Symbols 2", "Segoe UI Symbol", serif' }}>
              {rs.sym + "\uFE0E"}
            </span>{" "}
            {rs.ne}
          </div>
          <div className="w-tip-row">
            <span>महिना</span>
            <b>{bsMonthNe}</b>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="pn-wheel rounded-2xl border border-border overflow-hidden">
      <div className="w-stage" ref={stageRef} onMouseMove={onStageMove}>
        <div className="w-head">
          <div className="w-head-eyebrow">नेपाली पात्रो · पञ्चाङ्ग चक्र</div>
          <div className="w-head-title">
            {isToday && !scrubPinned && mode === "rashi" ? "आजको" : ""}{" "}
            {mode === "rashi" ? "ग्रह–नक्षत्र चक्र" : "तिथि–करण चक्र"}{" "}
            <span className="yr">{num(bsYear)}</span>
          </div>
          <div className="w-head-sub">
            {det.weekday.ne}, {bsMonthNe} {num(bsDay)} · {tithiNe} · {locLabel}
          </div>
        </div>

        {mode === "rashi" ? (
          <WheelChart
            det={det}
            markers={markers}
            spin={spin}
            tw={DEFAULT_WHEEL_TWEAKS}
            num={num}
            bsYear={bsYear}
            sel={picked}
            hover={hover}
            onHover={setHover}
            onLeave={() => setHover(null)}
            onPick={(pick) =>
              setPicked((prev) =>
                prev && prev.type === pick.type && prev.i === pick.i ? null : pick
              )
            }
            onSpin={setSpin}
          />
        ) : (
          <TithiWheel p={p} num={num} spin={spin} onSpin={setSpin} />
        )}

        {tipNode}

        {mode === "rashi" && (
          <WheelPanel
            sel={picked}
            open={!!picked}
            num={num}
            onClose={() => setPicked(null)}
          />
        )}

        {mode === "rashi" ? (
          <div className="w-legend">
            <div className="w-legend-row">
              <span className="w-legend-dot" style={{ background: "var(--w-accent)" }} />
              लग्न · वर्तमान नक्षत्र
            </div>
            <div className="w-legend-row">
              <span className="w-legend-dot" style={{ background: "#f2a81d" }} />
              सूर्य राशि
            </div>
            <div className="w-legend-row">
              <span className="w-legend-dot" style={{ background: "#d3dce4" }} />
              चन्द्र राशि
            </div>
            <div className="w-legend-row" style={{ opacity: 0.7, marginTop: 2 }}>
              घुमाउन तान्नुहोस् · drag to rotate
            </div>
          </div>
        ) : (
          <div
            className="w-legend"
            style={{ flexDirection: "row", gap: 22, alignItems: "flex-start" }}
          >
            <div>
              <div className="w-kleg-title">चर करण</div>
              {KAR_MOV.map((n) => (
                <div className="w-legend-row" key={n}>
                  <span
                    className="w-legend-dot"
                    style={{ background: KAR_MOV_COLOR[n], borderRadius: 2 }}
                  />
                  {n}
                </div>
              ))}
            </div>
            <div>
              <div className="w-kleg-title">स्थिर करण</div>
              {KAR_FIX_NAMES.map((n) => (
                <div className="w-legend-row" key={n}>
                  <span
                    className="w-legend-dot"
                    style={{ background: KAR_FIX_COLOR[n], borderRadius: 2 }}
                  />
                  {n}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="w-dock">
          <div className="w-dock-grp">
            <button
              type="button"
              className={`w-modebtn${mode === "rashi" ? " on" : ""}`}
              onClick={() => setModePersist("rashi")}
            >
              राशि
            </button>
            <button
              type="button"
              className={`w-modebtn${mode === "tithi" ? " on" : ""}`}
              onClick={() => setModePersist("tithi")}
            >
              तिथि
            </button>
          </div>
          <div className="w-dock-sep" />
          {mode === "rashi" && (
            <>
              <div className="w-dock-grp">
                <span className="w-dock-label">समय</span>
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
            </>
          )}
          <div className="w-dock-grp">
            {isToday && mode === "rashi" && (
              <button
                type="button"
                className="w-dock-todaybtn"
                title="अहिलेको समय"
                onClick={snapToNow}
              >
                आज
              </button>
            )}
            <button
              type="button"
              className="w-iconbtn"
              title="उत्तर सिधा"
              onClick={() => setSpin(0)}
            >
              ⟳
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
