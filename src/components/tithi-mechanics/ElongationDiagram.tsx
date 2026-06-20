import { useRef } from "react";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { moonSunFacingRotation } from "@/lib/moon-phase-svg";
import {
  tithiIndexFromElongation,
  tithiNum,
} from "@/lib/tithi-wheel-data";
import { MoonPhaseDisc } from "./MoonPhaseDisc";

const RAD = Math.PI / 180;

const ED = {
  W: 1180,
  H: 760,
  sunX: 96,
  sunR: 66,
  earthX: 690,
  earthY: 380,
  earthR: 30,
  R: 276,
  ringIn: 250,
  ringOut: 302,
  degR: 332,
  moonR: 22,
};

/** CCW on screen (वामावर्त) as elongation E increases; अमावस्या left, पूर्णिमा right. */
const edAng = (E: number) => 180 + E;
const edPos = (E: number, r: number): [number, number] => {
  const a = edAng(E) * RAD;
  return [ED.earthX + r * Math.cos(a), ED.earthY - r * Math.sin(a)];
};

interface Props {
  E?: number;
  onE?: (v: number) => void;
  compact?: boolean;
  month?: string;
}

export function ElongationDiagram({ E = 87, onE, compact, month = "असार" }: Props) {
  const fmt = (n: number) => toNepaliDigits(n);
  const curPaksha = (((E % 360) + 360) % 360) < 180 ? "शुक्ल" : "कृष्ण";
  const idx = tithiIndexFromElongation(E);
  const [mx, my] = edPos(E, ED.R);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef(false);

  const eFromEvt = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return E;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * ED.W;
    const py = ((e.clientY - r.top) / r.height) * ED.H;
    const a = Math.atan2(-(py - ED.earthY), px - ED.earthX) / RAD;
    const val = a - 180;
    return ((val % 360) + 360) % 360;
  };

  const degTicks: React.ReactNode[] = [];
  if (!compact) {
    for (let d = 0; d <= 360; d += 12) {
      const isMajor = d % 24 === 0;
      const [tx, ty] = edPos(d, ED.degR);
      const [i0x, i0y] = edPos(d, ED.ringOut);
      const [i1x, i1y] = edPos(d, ED.ringOut + (isMajor ? 13 : 7));
      degTicks.push(
        <line
          key={`dt${d}`}
          x1={i0x}
          y1={i0y}
          x2={i1x}
          y2={i1y}
          className="ed-degtick"
          strokeWidth={isMajor ? 1.3 : 0.8}
          opacity={isMajor ? 0.9 : 0.5}
        />
      );
      if (isMajor && d < 360) {
        const shown = d <= 180 ? d : 360 - d;
        degTicks.push(
          <text
            key={`dl${d}`}
            x={tx}
            y={ty}
            className="ed-deglabel"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {fmt(shown)}°
          </text>
        );
      }
    }
  }

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < 30; i++) {
    const E0 = i * 12;
    const Emid = i * 12 + 6;
    const isCur = i === idx;
    const [lx, ly] = edPos(E0, ED.R);
    cells.push(
      <g key={`lens${i}`} transform={`translate(${lx},${ly}) rotate(${-edAng(E0) + 90})`}>
        <ellipse cx={0} cy={0} rx={4.6} ry={13} className="ed-lens" />
      </g>
    );
    const [nx, ny] = edPos(Emid, ED.ringIn - 22);
    cells.push(
      <text
        key={`tn${i}`}
        x={nx}
        y={ny}
        className={`ed-tnum${isCur ? " cur" : ""}`}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {fmt(tithiNum(i))}
      </text>
    );
    if (isCur) {
      const [hx, hy] = edPos(Emid, ED.R);
      cells.push(<circle key={`cur${i}`} cx={hx} cy={hy} r={21} className="ed-curband" />);
    }
  }

  const arcR = ED.ringOut + 36;
  const arcPts: string[] = [];
  for (let e = 0; e <= E; e += 2) {
    const [x, y] = edPos(e, arcR);
    arcPts.push((e === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1));
  }
  {
    const [x, y] = edPos(E, arcR);
    arcPts.push("L" + x.toFixed(1) + "," + y.toFixed(1));
  }
  const sweepArc = arcPts.join(" ");
  const [capx, capy] = edPos(E, arcR);

  const rays = Array.from({ length: 16 }, (_, k) => {
    const a = (k / 16) * Math.PI * 2;
    const r0 = ED.sunR + 3;
    const r1 = ED.sunR + (k % 2 ? 12 : 20);
    return (
      <line
        key={`ray${k}`}
        x1={ED.sunX + r0 * Math.cos(a)}
        y1={ED.earthY + r0 * Math.sin(a)}
        x2={ED.sunX + r1 * Math.cos(a)}
        y2={ED.earthY + r1 * Math.sin(a)}
        className="ed-ray"
      />
    );
  });

  const [shuklaX, shuklaY] = edPos(90, ED.degR + 20);
  const [krishnaX, krishnaY] = edPos(270, ED.degR + 20);
  const [amX, amY] = edPos(0, ED.R);
  const [puX, puY] = edPos(180, ED.R);
  const [arcLabelX, arcLabelY] = edPos(E / 2, arcR - 30);

  const orbitDirPath = (() => {
    const [x0, y0] = edPos(24, ED.R);
    const [x1, y1] = edPos(66, ED.R);
    const [xm, ym] = edPos(45, ED.R + 28);
    return `M ${x0.toFixed(1)} ${y0.toFixed(1)} Q ${xm.toFixed(1)} ${ym.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  })();

  const moonRot = moonSunFacingRotation(mx, my, ED.sunX, ED.earthY);

  // Earth's fixed 23.5° axial tilt, drawn on the Earth glyph for consistency
  // with the heliocentric (सूर्य केन्द्र) diagram.
  const TILT_RAD = (23.5 * Math.PI) / 180;
  const axUx = Math.sin(TILT_RAD);
  const axUy = -Math.cos(TILT_RAD);
  const eqUx = -axUy;
  const eqUy = axUx;
  const eqHalf = ED.earthR * 0.92;
  const poleNX = ED.earthX + axUx * ED.earthR * 1.5;
  const poleNY = ED.earthY + axUy * ED.earthR * 1.5;
  const poleSX = ED.earthX - axUx * ED.earthR * 1.05;
  const poleSY = ED.earthY - axUy * ED.earthR * 1.05;
  const capX = ED.earthX + axUx * ED.earthR;
  const capY = ED.earthY + axUy * ED.earthR;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${ED.W} ${ED.H}`}
      className={`ed-svg${onE ? " grab" : ""}`}
      onPointerDown={(e) => {
        if (!onE) return;
        drag.current = true;
        onE(eFromEvt(e));
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (drag.current && onE) onE(eFromEvt(e));
      }}
      onPointerUp={() => {
        drag.current = false;
      }}
      onPointerCancel={() => {
        drag.current = false;
      }}
    >
      <defs>
        <marker
          id="ed-orbit-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 Z" className="ed-orbit-dir-arrow" />
        </marker>
        <radialGradient id="ed-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6d8" />
          <stop offset="38%" stopColor="#ffd24a" />
          <stop offset="78%" stopColor="#f08a1d" />
          <stop offset="100%" stopColor="#d65b12" />
        </radialGradient>
        <radialGradient id="ed-sunglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffcf57" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#ffcf57" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="ed-earth" cx="38%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#6fc6e8" />
          <stop offset="48%" stopColor="#2b7fa8" />
          <stop offset="100%" stopColor="#123a52" />
        </radialGradient>
      </defs>

      <line x1={ED.sunX} y1={ED.earthY} x2={ED.earthX} y2={ED.earthY} className="ed-axis" />
      <circle cx={ED.earthX} cy={ED.earthY} r={ED.R} className="ed-orbit" />
      <circle cx={ED.earthX} cy={ED.earthY} r={ED.ringIn} className="ed-ring" />
      <circle cx={ED.earthX} cy={ED.earthY} r={ED.ringOut} className="ed-ring" />

      <path d={orbitDirPath} className="ed-orbit-dir" fill="none" markerEnd="url(#ed-orbit-arrow)" />
      <text x={ED.earthX} y={ED.earthY - ED.R - 18} className="ed-orbit-dir-label" textAnchor="middle">
        ↺ वामावर्त
      </text>

      {!compact && degTicks}
      {cells}

      {!compact && (
        <text
          x={shuklaX}
          y={shuklaY}
          className={`ed-paksha${curPaksha === "शुक्ल" ? " on" : ""}`}
          textAnchor="middle"
        >
          {month} शुक्ल पक्ष
        </text>
      )}
      {!compact && (
        <text
          x={krishnaX}
          y={krishnaY}
          className={`ed-paksha${curPaksha === "कृष्ण" ? " on" : ""}`}
          textAnchor="middle"
        >
          {month} कृष्ण पक्ष
        </text>
      )}

      <path d={sweepArc} className="ed-arc" fill="none" />
      <circle cx={capx} cy={capy} r={4} className="ed-arc-cap" />
      <text
        x={arcLabelX}
        y={arcLabelY}
        className="ed-arc-val"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {fmt(Math.round(E))}°
      </text>

      <line x1={ED.earthX} y1={ED.earthY} x2={mx} y2={my} className="ed-rmline" />

      <circle cx={ED.sunX} cy={ED.earthY} r={ED.sunR + 34} fill="url(#ed-sunglow)" />
      {rays}
      <circle cx={ED.sunX} cy={ED.earthY} r={ED.sunR} fill="url(#ed-sun)" />
      <text x={ED.sunX} y={ED.earthY + ED.sunR + 30} className="ed-body-label" textAnchor="middle">
        सूर्य
      </text>

      <circle cx={ED.earthX} cy={ED.earthY} r={ED.earthR} fill="url(#ed-earth)" />
      <circle
        cx={ED.earthX}
        cy={ED.earthY}
        r={ED.earthR}
        fill="none"
        stroke="#bfeaff"
        strokeWidth={1}
        opacity={0.45}
      />
      {/* Earth's axial tilt (23.5°) */}
      <line
        x1={ED.earthX - eqUx * eqHalf}
        y1={ED.earthY - eqUy * eqHalf}
        x2={ED.earthX + eqUx * eqHalf}
        y2={ED.earthY + eqUy * eqHalf}
        stroke="#bfeaff"
        strokeWidth={1}
        opacity={0.5}
        strokeDasharray="3 3"
      />
      <line
        x1={poleSX}
        y1={poleSY}
        x2={poleNX}
        y2={poleNY}
        stroke="#eaf6ff"
        strokeWidth={2.2}
        strokeLinecap="round"
        opacity={0.92}
      />
      <circle cx={capX} cy={capY} r={4} fill="#8ed4a0" />
      <text
        x={poleNX + 8}
        y={poleNY - 2}
        textAnchor="start"
        style={{ fill: "#cfeaff", fontSize: 14, fontWeight: 600 }}
      >
        अक्ष {fmt(23.5)}°
      </text>
      <text x={ED.earthX} y={ED.earthY + ED.earthR + 22} className="ed-body-label" textAnchor="middle">
        पृथ्वी
      </text>

      <g transform={`translate(${mx},${my}) rotate(${moonRot})`}>
        <MoonPhaseDisc elongation={E} r={ED.moonR} uid="ed-moon" />
      </g>

      <text x={amX - 14} y={amY - 30} className="ed-end ne" textAnchor="middle">
        अमावस्या
      </text>
      <text x={amX - 14} y={amY - 12} className="ed-end en" textAnchor="middle">
        ०°
      </text>
      <text x={puX + 16} y={puY - 30} className="ed-end ne" textAnchor="middle">
        पूर्णिमा
      </text>
      <text x={puX + 16} y={puY - 12} className="ed-end en" textAnchor="middle">
        १८०°
      </text>
    </svg>
  );
}
