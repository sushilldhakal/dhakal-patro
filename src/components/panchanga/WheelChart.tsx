import { useRef } from "react";
import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { getBSMonthLength } from "@/lib/bs-calendar";
import {
  bsMonthsForWheel,
  GRAHA_META,
  GREG_NE,
  normDeg,
  PADA_AKSHAR,
  type WheelDetail,
  type WheelMarkers,
  type WheelTweaks,
  WHEEL_RASHIS,
} from "@/lib/wheel-data";
import { KARANA_SEQ, karanaColor, WHEEL_TITHIS, tithiNum } from "@/lib/tithi-wheel-data";

const DEG = Math.PI / 180;
const CX = 500;
const CY = 500;

/** Scale factor applied to all planet orbit radii so inner tithi/karana rings fit. */
const ORBIT_SCALE = 0.68;

/** Inner tithi and karana ring radii (inside the rashi inner boundary). */
const R_KAR_I = 152;
const R_KAR_O = 178;
const R_TIT_I = 181;
const R_TIT_O = 220;

const R = {
  rimOuter: 497,
  tickIn: 481,
  gregOut: 481,
  gregMid: 467,
  gregIn: 453,
  bsOut: 453,
  bsMid: 438,
  bsIn: 424,
  nakOut: 423,
  nakIcon: 397,
  nakName: 350,
  nakIn: 330,
  padaOut: 330,
  padaNum: 318,
  padaIn: 306,
  rashiOut: 305,
  rashiGlyph: 283,
  rashiName: 250,
  rashiIn: 226,
  core: 226,
} as const;

export type WheelHover = { type: "nak"; i: number } | { type: "rashi"; i: number };
export type WheelPick = WheelHover;

interface RingLabelProps {
  L: number;
  r: number;
  cls: string;
  spin: number;
  size?: number;
  children: React.ReactNode;
}

function RingLabel({ L, r, cls, spin, size, children }: RingLabelProps) {
  const a = normDeg(L + spin);
  const flip = a > 90 && a < 270;
  return (
    <g transform={`rotate(${-(L + spin)} ${CX} ${CY})`}>
      <text
        x={CX}
        y={CY - r}
        textAnchor="middle"
        dominantBaseline="central"
        className={cls}
        style={size ? { fontSize: size } : undefined}
        transform={flip ? `rotate(180 ${CX} ${CY - r})` : undefined}
      >
        {children}
      </text>
    </g>
  );
}

interface WheelChartProps {
  det: WheelDetail;
  markers: WheelMarkers;
  spin: number;
  tw: WheelTweaks;
  num: (n: number | string) => string | number;
  bsYear: number;
  sel: WheelPick | null;
  hover: WheelHover | null;
  onHover: (h: WheelHover) => void;
  onLeave: () => void;
  onPick: (p: WheelPick) => void;
  onSpin: (deg: number) => void;
  zoom: number;
  onZoom: (z: number) => void;
}

export function WheelChart({
  det,
  markers,
  spin,
  tw,
  num,
  bsYear,
  sel,
  hover,
  onHover,
  onLeave,
  onPick,
  onSpin,
  zoom,
  onZoom,
}: WheelChartProps) {
  const dragRef = useRef<{ a: number; spin0: number; moved: boolean } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  /** Active pointer positions for pinch-to-zoom. */
  const ptrRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{ dist: number; zoom0: number } | null>(null);

  const pol = (L: number, r: number): [number, number] => {
    const a = (L + spin) * DEG;
    return [CX - r * Math.sin(a), CY - r * Math.cos(a)];
  };

  const arcSeg = (L0: number, L1: number, r0: number, r1: number): string => {
    const [x1, y1] = pol(L0, r1);
    const [x2, y2] = pol(L1, r1);
    const [x3, y3] = pol(L1, r0);
    const [x4, y4] = pol(L0, r0);
    const large = L1 - L0 > 180 ? 1 : 0;
    return `M${x1},${y1} A${r1},${r1} 0 ${large} 0 ${x2},${y2} L${x3},${y3} A${r0},${r0} 0 ${large} 1 ${x4},${y4} Z`;
  };

  const { lagnaLon, sunLon, moonLon, moonNak, planetLons } = markers;

  const nakSegs = [];
  const nakDecor = [];
  for (let i = 0; i < 27; i++) {
    const L0 = i * (360 / 27);
    const L1 = (i + 1) * (360 / 27);
    const Lm = (L0 + L1) / 2;
    const ico = NAKSHATRA_ICONS[i]!;
    const isHot = hover?.type === "nak" && hover.i === i;
    const isSel = sel?.type === "nak" && sel.i === i;
    nakSegs.push(
      <path
        key={`ns${i}`}
        d={arcSeg(L0, L1, R.nakIn, R.nakOut)}
        className={`w-seg-nak${i % 2 ? " alt" : ""}${isHot ? " hot" : ""}${isSel ? " sel" : ""}`}
      />
    );
    const [ix, iy] = pol(Lm, R.nakIcon);
    const s = 30;
    nakDecor.push(
      <g key={`ni${i}`}>
        <svg
          x={ix - s / 2}
          y={iy - s / 2}
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-nk-ico"
          dangerouslySetInnerHTML={{ __html: ico.svg }}
        />
        <RingLabel L={Lm} r={R.nakName} cls={`w-nak-name${isSel || isHot ? " sel" : ""}`} spin={spin}>
          {ico.ne}
        </RingLabel>
      </g>
    );
  }

  const rashiSegs = [];
  const rashiDecor = [];
  for (let i = 0; i < 12; i++) {
    const L0 = i * 30;
    const L1 = (i + 1) * 30;
    const Lm = L0 + 15;
    const rs = WHEEL_RASHIS[i]!;
    const isHot = hover?.type === "rashi" && hover.i === i;
    const isSel = sel?.type === "rashi" && sel.i === i;
    rashiSegs.push(
      <path
        key={`rs${i}`}
        d={arcSeg(L0, L1, R.rashiIn, R.rashiOut)}
        className={`w-seg-rashi${i % 2 ? " alt" : ""}${isHot ? " hot" : ""}${isSel ? " sel" : ""}`}
      />
    );
    const [gx, gy] = pol(Lm, R.rashiGlyph);
    rashiDecor.push(
      <g key={`rd${i}`}>
        <text
          x={gx}
          y={gy}
          textAnchor="middle"
          dominantBaseline="central"
          className="w-rashi-glyph"
          style={{ fontSize: 27, fontFamily: '"Noto Sans Symbols 2", "Segoe UI Symbol", serif' }}
        >
          {rs.sym + "\uFE0E"}
        </text>
        <RingLabel L={Lm} r={R.rashiName} cls={`w-rashi-name${isSel || isHot ? " sel" : ""}`} spin={spin}>
          {rs.ne}
        </RingLabel>
      </g>
    );
  }

  const padaCells = [];
  if (tw.show_pada) {
    for (let i = 0; i < 108; i++) {
      const L0 = i * (360 / 108);
      const L1 = (i + 1) * (360 / 108);
      const Lm = (L0 + L1) / 2;
      padaCells.push(
        <g key={`pc${i}`}>
          <path
            d={arcSeg(L0, L1, R.padaIn, R.padaOut)}
            className={`w-seg-pada${Math.floor(i / 4) % 2 ? " alt" : ""}`}
          />
          <RingLabel L={Lm} r={R.padaNum} cls="w-pada-akshar" spin={spin}>
            {PADA_AKSHAR[Math.floor(i / 4)]![i % 4]}
          </RingLabel>
        </g>
      );
    }
  }

  const ticks = [];
  for (let d = 0; d < 360; d += 1) {
    const major = d % 30 === 0;
    const mid = d % 10 === 0;
    if (!major && !mid && d % 2) continue;
    const [x1, y1] = pol(d, R.rimOuter);
    const len = major ? 15 : mid ? 9 : 5;
    const [x2, y2] = pol(d, R.rimOuter - len);
    ticks.push(
      <line
        key={`t${d}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        className={`w-tick${major ? " major" : ""}`}
        strokeWidth={major ? 1.1 : 0.7}
      />
    );
  }

  const dayTicks = [];
  if (tw.show_lunar) {
    for (let i = 0; i < 12; i++) {
      const days = getBSMonthLength(bsYear, i + 1);
      for (let d = 1; d < days; d++) {
        const L = i * 30 + (d / days) * 30;
        const major = d % 5 === 0;
        const [x1, y1] = pol(L, R.bsOut - 1);
        const [x2, y2] = pol(L, R.bsOut - (major ? 11 : 6));
        dayTicks.push(
          <line
            key={`dt${i}_${d}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className={`w-daytick${major ? " major" : ""}`}
          />
        );
      }
    }
  }

  const hits = [];
  for (let i = 0; i < 27; i++) {
    const L0 = i * (360 / 27);
    const L1 = (i + 1) * (360 / 27);
    hits.push(
      <path
        key={`hn${i}`}
        d={arcSeg(L0, L1, R.nakIn, R.nakOut)}
        className="w-hit"
        onMouseEnter={() => onHover({ type: "nak", i })}
        onMouseLeave={onLeave}
        onClick={() => onPick({ type: "nak", i })}
      />
    );
  }
  for (let i = 0; i < 12; i++) {
    const L0 = i * 30;
    const L1 = (i + 1) * 30;
    hits.push(
      <path
        key={`hr${i}`}
        d={arcSeg(L0, L1, R.rashiIn, R.rashiOut)}
        className="w-hit"
        onMouseEnter={() => onHover({ type: "rashi", i })}
        onMouseLeave={onLeave}
        onClick={() => onPick({ type: "rashi", i })}
      />
    );
  }

  const markerNodes = [];
  if (tw.show_today) {
    const L0 = moonNak * (360 / 27);
    const L1 = (moonNak + 1) * (360 / 27);
    markerNodes.push(
      <path
        key="nowwedge"
        d={arcSeg(L0, L1, R.nakIn, R.nakOut)}
        className="w-seg-now"
        style={{ pointerEvents: "none" }}
      />
    );
    const [lx, ly] = pol(moonLon, R.rimOuter - 2);
    markerNodes.push(<line key="moon-line" x1={CX} y1={CY} x2={lx} y2={ly} className="w-lagna-line" />);
    markerNodes.push(
      <g key="moon-cap" transform={`rotate(${-(moonLon + spin)} ${CX} ${CY})`}>
        <circle cx={CX} cy={CY - (R.rimOuter - 2)} r="3.4" className="w-lagna-cap" />
        <text
          x={CX}
          y={CY - (R.rimOuter + 9)}
          textAnchor="middle"
          dominantBaseline="central"
          className="w-label"
          style={{ fontSize: 14, fill: "var(--w-accent)", fontFamily: '"Noto Sans Symbols 2", "Segoe UI Symbol", serif' }}
          transform={
            normDeg(moonLon + spin) > 90 && normDeg(moonLon + spin) < 270
              ? `rotate(180 ${CX} ${CY - (R.rimOuter + 9)})`
              : undefined
          }
        >
          {"☾︎"}
        </text>
      </g>
    );
    const [sx, sy] = pol(sunLon, R.rashiOut + 12);
    markerNodes.push(
      <g key="sunpip" style={{ pointerEvents: "none" }}>
        <circle cx={sx} cy={sy} r="9" fill="#f2a81d" opacity="0.92" />
        <text
          x={sx}
          y={sy + 0.5}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontSize: 12, fontFamily: '"Noto Sans Symbols 2", "Segoe UI Symbol", serif', fill: "#1a1205" }}
        >
          {"\u2609\uFE0E"}
        </text>
      </g>
    );
    const [mx, my] = pol(moonLon, R.rashiOut + 12);
    markerNodes.push(
      <g key="moonpip" style={{ pointerEvents: "none" }}>
        <circle cx={mx} cy={my} r="9" fill="#d3dce4" opacity="0.94" />
        <text
          x={mx}
          y={my + 0.5}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontSize: 12, fontFamily: '"Noto Sans Symbols 2", "Segoe UI Symbol", serif', fill: "#1a2430" }}
        >
          {"\u263E\uFE0E"}
        </text>
      </g>
    );
  }

  // ── Inner tithi + karana rings ────────────────────────────────────────────
  const innerRings: React.ReactNode[] = [];
  if (tw.show_today) {
    const sunL = markers.sunLon;
    const elongation = normDeg(markers.moonLon - sunL);
    const curTithiIdx = Math.floor(elongation / 12);
    const curKarIdx = Math.floor(elongation / 6);

    // Separator circles for the new inner rings
    innerRings.push(
      <circle key="ir-kar-o" cx={CX} cy={CY} r={R_KAR_O} className="w-rim-circle" strokeWidth="0.8" opacity="0.5" />,
      <circle key="ir-kar-i" cx={CX} cy={CY} r={R_KAR_I} className="w-rim-circle" strokeWidth="0.8" opacity="0.5" />,
      <circle key="ir-tit-i" cx={CX} cy={CY} r={R_TIT_I} className="w-rim-circle" strokeWidth="0.8" opacity="0.5" />,
    );

    // Karana ring — 60 segments × 6° each
    for (let k = 0; k < 60; k++) {
      const L0 = sunL + k * 6;
      const L1 = sunL + (k + 1) * 6;
      const Lm = sunL + k * 6 + 3;
      const kd = KARANA_SEQ[k]!;
      const isCur = k === curKarIdx;
      const kName = kd.ne;
      innerRings.push(
        <path
          key={`kar${k}`}
          d={arcSeg(L0, L1, R_KAR_I, R_KAR_O)}
          fill={karanaColor(kd)}
          stroke={isCur ? "var(--w-accent)" : "rgba(0,0,0,.32)"}
          strokeWidth={isCur ? 1.7 : 0.4}
          opacity={isCur ? 1 : 0.78}
        />
      );
      innerRings.push(
        <RingLabel
          key={`kar-lbl-${k}`}
          L={Lm}
          r={(R_KAR_I + R_KAR_O) / 2}
          cls={`w-kar-lbl${isCur ? " sel" : ""}`}
          spin={spin}
          size={isCur ? 7 : 5.5}
        >
          {kName.length > 4 ? kName.slice(0, 4) : kName}
        </RingLabel>
      );
    }

    // Tithi ring — 30 segments × 12° each
    for (let i = 0; i < 30; i++) {
      const L0 = sunL + i * 12;
      const L1 = sunL + (i + 1) * 12;
      const Lm = sunL + i * 12 + 6;
      const isCur = i === curTithiIdx;
      const shukla = i < 15;
      const tName = WHEEL_TITHIS[i]!.ne;
      innerRings.push(
        <g key={`tit${i}`}>
          <path
            d={arcSeg(L0, L1, R_TIT_I, R_TIT_O)}
            fill={
              isCur
                ? "color-mix(in srgb, var(--w-accent) 28%, #0d2428)"
                : shukla
                ? "color-mix(in srgb, #2d8a86 26%, #0a1a1e)"
                : "color-mix(in srgb, #2d8a86 14%, #060e10)"
            }
            stroke={isCur ? "var(--w-accent)" : "rgba(143,191,193,.18)"}
            strokeWidth={isCur ? 1.7 : 0.5}
          />
          <RingLabel
            L={Lm}
            r={R_TIT_I + 10}
            cls={`w-tw-num${isCur ? " sel" : ""}`}
            spin={spin}
            size={isCur ? 9 : 7.5}
          >
            {num(tithiNum(i))}
          </RingLabel>
          <RingLabel
            L={Lm}
            r={R_TIT_I + 26}
            cls={`w-tw-name${isCur ? " sel" : ""}`}
            spin={spin}
            size={isCur ? 8 : 6.5}
          >
            {tName.length > 5 ? tName.slice(0, 5) : tName}
          </RingLabel>
        </g>
      );
    }
  }

  // ── Planet core ───────────────────────────────────────────────────────────
  const core = [];
  if (tw.show_planets) {
    [44, 70, 96, 120, 150, 178, 204, 216].forEach((r, k) =>
      core.push(<circle key={`orb${k}`} cx={CX} cy={CY} r={r * ORBIT_SCALE} className="w-orbit" />)
    );
    det.grahas.forEach((g, i) => {
      const meta = GRAHA_META[i]!;
      const lon = planetLons[i] ?? 0;
      const [px, py] = pol(lon, meta.orbit * ORBIT_SCALE);
      const rad = "big" in meta && meta.big ? 13 : i === 1 ? 9 : 7;
      core.push(
        <g key={`pl${i}`} style={{ pointerEvents: "none" }}>
          <circle cx={px} cy={py} r={rad + 5} fill={meta.color} className="w-planet-glow" />
          {"ring" in meta && meta.ring && (
            <ellipse
              cx={px}
              cy={py}
              rx={rad + 6}
              ry={rad * 0.5}
              fill="none"
              stroke={meta.color}
              strokeWidth="1.4"
              opacity="0.8"
              transform={`rotate(-18 ${px} ${py})`}
            />
          )}
          <circle cx={px} cy={py} r={rad} fill={meta.color} />
          <text
            x={px}
            y={py + 0.5}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontSize: rad * 1.2,
              fontFamily: '"Noto Sans Symbols 2", "Segoe UI Symbol", serif',
              fill: "rgba(0,0,0,.66)",
            }}
          >
            {g.sym + "\uFE0E"}
          </text>
          <text x={px} y={py + rad + 8} textAnchor="middle" className="w-planet-name">
            {g.ne}
          </text>
        </g>
      );
    });
    core.push(
      <g key="earth" style={{ pointerEvents: "none" }}>
        <circle cx={CX} cy={CY} r="11" fill="#1f6f63" />
        <circle cx={CX} cy={CY} r="11" fill="none" stroke="#9fe0c8" strokeWidth="1" opacity="0.5" />
        <text
          x={CX}
          y={CY + 0.5}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontSize: 12, fill: "#bdeede" }}
        >
          ♁
        </text>
      </g>
    );
  }

  const rashiRays = [];
  for (let i = 0; i < 12; i++) {
    const [x1, y1] = pol(i * 30, 12);
    const [x2, y2] = pol(i * 30, R.rimOuter - 2);
    rashiRays.push(
      <line key={`ray${i}`} x1={x1} y1={y1} x2={x2} y2={y2} className="w-rashi-ray" />
    );
  }

  const angleAt = (e: React.PointerEvent) => {
    const r = wrapRef.current!.getBoundingClientRect();
    return (
      Math.atan2(
        e.clientY - (r.top + r.height / 2),
        e.clientX - (r.left + r.width / 2)
      ) / DEG
    );
  };

  const pinchDist = () => {
    const pts = [...ptrRef.current.values()];
    if (pts.length < 2) return 0;
    return Math.hypot(pts[1]!.x - pts[0]!.x, pts[1]!.y - pts[0]!.y);
  };

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    ptrRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
    if (ptrRef.current.size === 1) {
      dragRef.current = { a: angleAt(e), spin0: spin, moved: false };
    } else {
      // Two fingers: cancel rotation, start pinch
      dragRef.current = null;
      pinchRef.current = { dist: pinchDist(), zoom0: zoom };
    }
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    ptrRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrRef.current.size >= 2) {
      if (pinchRef.current) {
        const d = pinchDist();
        if (d > 0) {
          const next = Math.max(0.55, Math.min(2.8, pinchRef.current.zoom0 * (d / pinchRef.current.dist)));
          onZoom(next);
        }
      }
      return;
    }
    if (!dragRef.current) return;
    const d = angleAt(e) - dragRef.current.a;
    if (Math.abs(d) > 1.2) dragRef.current.moved = true;
    onSpin(dragRef.current.spin0 + d);
  };
  const onUp = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    ptrRef.current.delete(e.pointerId);
    dragRef.current = null;
    if (ptrRef.current.size < 2) pinchRef.current = null;
  };

  const bsMonths = bsMonthsForWheel();

  return (
    <div
      className="w-svg-wrap"
      ref={wrapRef}
      style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 0.12s ease-out" }}
    >
      <svg
        viewBox="0 0 1000 1000"
        className={`w-svg${dragRef.current?.moved ? " dragging" : ""}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <circle cx={CX} cy={CY} r={R.rimOuter} className="w-rim-circle" strokeWidth="1.4" />
        <circle cx={CX} cy={CY} r={R.tickIn} className="w-rim-circle" strokeWidth="0.7" opacity="0.5" />
        {[R.gregIn, R.bsIn, R.nakOut, R.nakIn, R.padaIn, R.rashiIn].map((r, k) => (
          <circle key={`rc${k}`} cx={CX} cy={CY} r={r} className="w-rim-circle" strokeWidth="0.8" opacity="0.55" />
        ))}
        <circle cx={CX} cy={CY} r={R.core} className="w-rim-circle" strokeWidth="1.1" opacity="0.7" />

        {ticks}
        {rashiSegs}
        {nakSegs}
        {padaCells}
        {rashiRays}
        {nakDecor}
        {rashiDecor}

        {tw.show_greg &&
          GREG_NE.map((m, i) => (
            <RingLabel key={`g${i}`} L={(i - 3) * 30 + 5} r={R.gregMid} cls="w-month-greg" spin={spin}>
              {m}
            </RingLabel>
          ))}
        {tw.show_lunar &&
          bsMonths.map((m, i) => (
            <RingLabel key={`b${i}`} L={i * 30 + 15} r={R.bsMid} cls="w-month-ne" spin={spin}>
              {m.ne}
            </RingLabel>
          ))}
        {dayTicks}

        {innerRings}
        {core}
        {markerNodes}
        {hits}

        <RingLabel L={295} r={R.rimOuter + 18} cls="w-year" spin={spin}>
          {num(bsYear)}
        </RingLabel>
      </svg>
    </div>
  );
}
