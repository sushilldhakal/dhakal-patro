import { useRef } from "react";
import { MoonPhaseIcon } from "./MoonPhaseIcon";
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
import { KARANA_SEQ, karanaColor, WHEEL_TITHIS, WHEEL_YOGAS } from "@/lib/tithi-wheel-data";

const DEG = Math.PI / 180;
const CX = 500;
const CY = 500;

/** Scale factor applied to all planet orbit radii to leave room for the inner yoga/karana/tithi rings. */
const ORBIT_SCALE = 0.58;

/** Yoga → Karana → Tithi rings, each nested inside the next, sharing boundaries. */
const R_YOGA_I = 140;
const R_YOGA_O = 158;
const R_KAR_I  = 160;
const R_KAR_O  = 178;
const R_TIT_I  = 178; // shared boundary with karana outer
const R_TIT_O  = 218;

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
  bsYear: number;
  sel: WheelPick | null;
  hover: WheelHover | null;
  onHover: (h: WheelHover) => void;
  onLeave: () => void;
  onPick: (p: WheelPick) => void;
  onSpin: (deg: number) => void;
  zoom: number;
  onZoom: (z: number) => void;
  pan: { x: number; y: number };
  onPan: (x: number, y: number) => void;
}

export function WheelChart({
  det,
  markers,
  spin,
  tw,
  bsYear,
  sel,
  hover,
  onHover,
  onLeave,
  onPick,
  onSpin,
  zoom,
  onZoom,
  pan,
  onPan,
}: WheelChartProps) {
  const dragRef = useRef<
    | { mode: "r"; a: number; spin0: number; moved: boolean }
    | { mode: "p"; x0: number; y0: number; pan0x: number; pan0y: number; moved: boolean }
    | null
  >(null);
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

  const { moonLon, moonNak, planetLons, sunLon } = markers;
  const sunRashiIdx = Math.floor(normDeg(sunLon) / 30);

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
    nakDecor.push(
      <RingLabel
        key={`ni${i}`}
        L={Lm}
        r={(R.nakIn + R.nakOut) / 2}
        cls={`w-nak-name${isSel || isHot ? " sel" : ""}`}
        spin={spin}
      >
        {ico.ne}
      </RingLabel>
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
    const rL0 = sunRashiIdx * 30;
    const rL1 = rL0 + 30;
    markerNodes.push(
      <path
        key="nowwedge-rashi"
        d={arcSeg(rL0, rL1, R.rashiIn, R.rashiOut)}
        className="w-seg-now"
        style={{ pointerEvents: "none" }}
      />
    );
    markerNodes.push(
      <path
        key="nowwedge-month"
        d={arcSeg(rL0, rL1, R.bsIn, R.bsOut)}
        className="w-seg-now"
        style={{ pointerEvents: "none" }}
      />
    );
    const [lx, ly] = pol(moonLon, R.bsOut - 2);
    markerNodes.push(<line key="moon-line" x1={CX} y1={CY} x2={lx} y2={ly} className="w-lagna-line" />);
    markerNodes.push(
      <g key="moon-cap" transform={`rotate(${-(moonLon + spin)} ${CX} ${CY})`}>
        <circle cx={CX} cy={CY - (R.bsOut - 2)} r="3.4" className="w-lagna-cap" />
        <text
          x={CX}
          y={CY - (R.bsOut + 5)}
          textAnchor="middle"
          dominantBaseline="central"
          className="w-label"
          style={{ fontSize: 14, fill: "#f9c800", fontFamily: '"Noto Sans Symbols 2", "Segoe UI Symbol", serif' }}
          transform={
            normDeg(moonLon + spin) > 90 && normDeg(moonLon + spin) < 270
              ? `rotate(180 ${CX} ${CY - (R.bsOut + 5)})`
              : undefined
          }
        >
          {"☾︎"}
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

    // Separator circles
    innerRings.push(
      <circle key="ir-boundary" cx={CX} cy={CY} r={R_KAR_O} className="w-rim-circle" strokeWidth="1.1" opacity="0.75" />,
      <circle key="ir-kar-i"  cx={CX} cy={CY} r={R_KAR_I}  className="w-rim-circle" strokeWidth="0.8" opacity="0.5" />,
      <circle key="ir-yoga-i" cx={CX} cy={CY} r={R_YOGA_I} className="w-rim-circle" strokeWidth="0.8" opacity="0.5" />,
    );

    // Yoga ring — 27 segments × (360/27)° each, anchored at ecliptic 0°
    const yogaDeg = 360 / 27;
    const yogaSum = normDeg(markers.sunLon + markers.moonLon);
    const curYogaIdx = Math.floor(yogaSum / yogaDeg);
    for (let y = 0; y < 27; y++) {
      const L0 = y * yogaDeg;
      const L1 = (y + 1) * yogaDeg;
      const Lm = y * yogaDeg + yogaDeg / 2;
      const isCur = y === curYogaIdx;
      const yName = WHEEL_YOGAS[y]!;
      innerRings.push(
        <path
          key={`yog${y}`}
          d={arcSeg(L0, L1, R_YOGA_I, R_YOGA_O)}
          fill={
            isCur
              ? "color-mix(in srgb, #a07de8 38%, #10063a)"
              : y % 2
              ? "color-mix(in srgb, #7c5cbf 22%, #08041a)"
              : "color-mix(in srgb, #6448a8 16%, #06031a)"
          }
          stroke={isCur ? "#c4a8f0" : "rgba(100,72,168,.25)"}
          strokeWidth={isCur ? 1.6 : 0.4}
          opacity={isCur ? 1 : 0.82}
        />
      );
      innerRings.push(
        <RingLabel
          key={`yog-lbl-${y}`}
          L={Lm}
          r={(R_YOGA_I + R_YOGA_O) / 2}
          cls={`w-yoga-lbl${isCur ? " sel" : ""}`}
          spin={spin}
          size={isCur ? 7 : 5.5}
        >
          {yName.length > 4 ? yName.slice(0, 4) : yName}
        </RingLabel>
      );
    }

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
            r={(R_TIT_I + R_TIT_O) / 2}
            cls={`w-tw-name${isCur ? " sel" : ""}`}
            spin={spin}
            size={isCur ? 10 : 8}
          >
            {tName.length > 6 ? tName.slice(0, 6) : tName}
          </RingLabel>
        </g>
      );
    }
  }

  // ── Planet core ───────────────────────────────────────────────────────────
  const core: React.ReactNode[] = [];
  if (tw.show_planets) {
    // Radial gradients giving each planet a 3D sphere appearance
    core.push(
      <defs key="pdefs">
        {/* 0 Sun */}
        <radialGradient id="pg0" cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#fff9c0"/><stop offset="35%" stopColor="#f9c800"/>
          <stop offset="75%" stopColor="#e07000"/><stop offset="100%" stopColor="#8b3c00"/>
        </radialGradient>
        {/* 1 Moon */}
        <radialGradient id="pg1" cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#f6f8fa"/><stop offset="55%" stopColor="#b8c0cc"/>
          <stop offset="100%" stopColor="#6a7480"/>
        </radialGradient>
        {/* 2 Mars */}
        <radialGradient id="pg2" cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#ff9870"/><stop offset="55%" stopColor="#c84830"/>
          <stop offset="100%" stopColor="#6e1800"/>
        </radialGradient>
        {/* 3 Mercury */}
        <radialGradient id="pg3" cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#d8d4cc"/><stop offset="55%" stopColor="#989090"/>
          <stop offset="100%" stopColor="#504848"/>
        </radialGradient>
        {/* 4 Jupiter */}
        <radialGradient id="pg4" cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#f0d898"/><stop offset="50%" stopColor="#c89840"/>
          <stop offset="100%" stopColor="#7a5010"/>
        </radialGradient>
        {/* 5 Venus */}
        <radialGradient id="pg5" cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#fffae0"/><stop offset="50%" stopColor="#e8d870"/>
          <stop offset="100%" stopColor="#a09020"/>
        </radialGradient>
        {/* 6 Saturn */}
        <radialGradient id="pg6" cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#f0e0b0"/><stop offset="50%" stopColor="#c4a060"/>
          <stop offset="100%" stopColor="#7a5c28"/>
        </radialGradient>
        {/* 7 Rahu */}
        <radialGradient id="pg7" cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#7060c0"/><stop offset="55%" stopColor="#2a2060"/>
          <stop offset="100%" stopColor="#080420"/>
        </radialGradient>
        {/* 8 Ketu */}
        <radialGradient id="pg8" cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#b06080"/><stop offset="55%" stopColor="#601828"/>
          <stop offset="100%" stopColor="#1c0408"/>
        </radialGradient>
        {/* Earth */}
        <radialGradient id="pg-earth" cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#a8f0d0"/><stop offset="45%" stopColor="#1f8f6f"/>
          <stop offset="100%" stopColor="#0a3828"/>
        </radialGradient>
      </defs>
    );

    [44, 70, 96, 120, 150, 178, 204, 216].forEach((r, k) =>
      core.push(<circle key={`orb${k}`} cx={CX} cy={CY} r={r * ORBIT_SCALE} className="w-orbit" />)
    );

    det.grahas.forEach((g, i) => {
      const meta = GRAHA_META[i]!;
      const lon = planetLons[i] ?? 0;
      const [px, py] = pol(lon, meta.orbit * ORBIT_SCALE);
      const rad = "big" in meta && meta.big ? 15 : i === 1 ? 10 : 8;

      // Ambient glow
      core.push(
        <circle key={`pg${i}`} cx={px} cy={py} r={rad + 6} fill={meta.color}
          className="w-planet-glow" style={{ pointerEvents: "none" }} />
      );

      // Sun: radiating spikes
      if (i === 0) {
        const rays: React.ReactNode[] = [];
        for (let r = 0; r < 12; r++) {
          const ang = (r * 30) * DEG;
          const r1 = rad + 3, r2 = rad + (r % 2 === 0 ? 11 : 7);
          rays.push(<line key={r}
            x1={px + r1 * Math.sin(ang)} y1={py - r1 * Math.cos(ang)}
            x2={px + r2 * Math.sin(ang)} y2={py - r2 * Math.cos(ang)}
            stroke="#f9c800" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />);
        }
        core.push(<g key="sun-rays" style={{ pointerEvents: "none" }}>{rays}</g>);
      }

      // Saturn ring (behind planet body)
      if ("ring" in meta && meta.ring) {
        core.push(
          <ellipse key={`ring${i}`} cx={px} cy={py} rx={rad + 8} ry={rad * 0.45}
            fill="none" stroke={meta.color} strokeWidth="2.4" opacity="0.88"
            transform={`rotate(-20 ${px} ${py})`} style={{ pointerEvents: "none" }} />
        );
      }

      // Planet sphere with gradient (moon uses phase disc instead)
      if (i !== 1) {
        core.push(
          <circle key={`pl${i}`} cx={px} cy={py} r={rad} fill={`url(#pg${i})`}
            style={{ pointerEvents: "none" }} />
        );
      } else {
        const elongation = normDeg(markers.moonLon - markers.sunLon);
        core.push(
          <g key="moon-phase" transform={`translate(${px},${py})`} style={{ pointerEvents: "none" }}>
            <MoonPhaseIcon elongation={elongation} r={rad} />
          </g>
        );
      }

      // Jupiter: horizontal dark bands (clipped to sphere)
      if (i === 4) {
        const clipId = `jclip${i}`;
        core.push(
          <g key={`jbands${i}`} style={{ pointerEvents: "none" }}>
            <defs>
              <clipPath id={clipId}><circle cx={px} cy={py} r={rad - 0.5} /></clipPath>
            </defs>
            {[-rad * 0.3, rad * 0.05, rad * 0.36].map((oy, bi) => (
              <rect key={bi} x={px - rad} y={py + oy - 1.8} width={rad * 2} height={3.2}
                fill="rgba(80,42,8,0.42)" clipPath={`url(#${clipId})`} />
            ))}
          </g>
        );
      }

      // Name label
      core.push(
        <text key={`pn${i}`} x={px} y={py + rad + 9} textAnchor="middle"
          className="w-planet-name" style={{ pointerEvents: "none" }}>
          {g.ne}
        </text>
      );
    });

    // Earth at center
    core.push(
      <g key="earth" style={{ pointerEvents: "none" }}>
        <circle cx={CX} cy={CY} r="13" fill="url(#pg-earth)" />
        <circle cx={CX} cy={CY} r="13" fill="none" stroke="#9fe0c8" strokeWidth="0.8" opacity="0.5" />
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
      if (zoom > 1) {
        dragRef.current = { mode: "p", x0: e.clientX, y0: e.clientY, pan0x: pan.x, pan0y: pan.y, moved: false };
      } else {
        dragRef.current = { mode: "r", a: angleAt(e), spin0: spin, moved: false };
      }
    } else {
      // Two fingers: cancel single-finger gesture, start pinch
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
          const next = Math.max(0.55, Math.min(14, pinchRef.current.zoom0 * (d / pinchRef.current.dist)));
          onZoom(next);
        }
      }
      return;
    }
    if (!dragRef.current) return;
    if (dragRef.current.mode === "p") {
      const dx = e.clientX - dragRef.current.x0;
      const dy = e.clientY - dragRef.current.y0;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragRef.current.moved = true;
      onPan(dragRef.current.pan0x + dx, dragRef.current.pan0y + dy);
    } else {
      const d = angleAt(e) - dragRef.current.a;
      if (Math.abs(d) > 1.2) dragRef.current.moved = true;
      onSpin(dragRef.current.spin0 + d);
    }
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
      style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "center", transition: dragRef.current ? "none" : "transform 0.12s ease-out" }}
    >
      <svg
        viewBox="42 42 916 916"
        className={`w-svg${dragRef.current?.moved ? " dragging" : ""}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <circle cx={CX} cy={CY} r={R.bsOut} className="w-rim-circle" strokeWidth="1.4" />
        {[R.bsIn, R.nakOut, R.nakIn, R.padaIn, R.rashiIn].map((r, k) => (
          <circle key={`rc${k}`} cx={CX} cy={CY} r={r} className="w-rim-circle" strokeWidth="0.8" opacity="0.55" />
        ))}
        <circle cx={CX} cy={CY} r={R.core} className="w-rim-circle" strokeWidth="1.1" opacity="0.7" />

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
            <RingLabel
              key={`b${i}`}
              L={i * 30 + 15}
              r={R.bsMid}
              cls={`w-month-ne${tw.show_today && i === sunRashiIdx ? " now" : ""}`}
              spin={spin}
            >
              {m.ne}
            </RingLabel>
          ))}
        {dayTicks}

        {innerRings}
        {core}
        {markerNodes}
        {hits}

      </svg>
    </div>
  );
}
