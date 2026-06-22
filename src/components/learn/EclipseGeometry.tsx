import { useMemo, useRef } from "react";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { moonSunFacingRotation } from "@/lib/moon-phase-svg";
import { EarthGlobeImage } from "./EarthGlobeImage";
import { MoonPhaseDisc } from "@/components/tithi-mechanics/MoonPhaseDisc";
import {
  ECL,
  earthScreen,
  isSolarAlignment,
  localToScreen,
  lunarEclipseStatus,
  moonGeo,
  nodeLineEndpoints,
  planePtSun,
  realBeta,
  sunScreen,
} from "./eclipse-math";

interface Props {
  u: number;
  omega: number;
  earthLon: number;
  onU?: (v: number) => void;
}

const TH_PENUMBRAL_VIS = 34;

function sunOrbitPath(radius: number, step = 4): string {
  const pts: string[] = [];
  for (let a = 0; a <= 360; a += step) {
    const p = planePtSun(a, radius);
    pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
}

function NodeCallout({
  px,
  py,
  label,
  sym,
  side,
}: {
  px: number;
  py: number;
  label: string;
  sym: string;
  side: "left" | "right";
}) {
  const tx = side === "left" ? px - 118 : px + 118;
  const ty = side === "left" ? py - 62 : py + 62;
  return (
    <g className="ecl-node-callout">
      <line x1={tx} y1={ty + 10} x2={px} y2={py} className="ecl-node-arrow" markerEnd="url(#ecl-node-arrow)" />
      <text x={tx} y={ty} className="ecl-node-title" textAnchor="middle">
        {label}
      </text>
      <text x={tx} y={ty + 30} className="ecl-node-sym" textAnchor="middle">
        {sym}
      </text>
    </g>
  );
}

export function EclipseGeometry({ u, omega, earthLon, onU }: Props) {
  const fmt = (n: string | number) => toNepaliDigits(n);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef(false);

  const g = moonGeo(u, omega, earthLon);
  const status = lunarEclipseStatus(g);
  const solar = isSolarAlignment(g);
  const sun = sunScreen();
  const earth = earthScreen(earthLon);

  const earthOrbit = useMemo(() => sunOrbitPath(ECL.earthOrbitR), []);
  const nodeLine = useMemo(() => nodeLineEndpoints(omega, earthLon), [omega, earthLon]);

  const moonOrbit = useMemo(() => {
    const below: React.ReactNode[] = [];
    const above: React.ReactNode[] = [];
    const STEP = 4;
    for (let uu = 0; uu < 360; uu += STEP) {
      const a = moonGeo(uu, omega, earthLon);
      const b = moonGeo(uu + STEP, omega, earthLon);
      const isAbove = a.zEc + b.zEc >= 0;
      const seg = (
        <line
          key={`o${uu}`}
          x1={a.sx}
          y1={a.sy}
          x2={b.sx}
          y2={b.sy}
          className={`ecl-moon-orbit ${isAbove ? "above" : "below"}`}
        />
      );
      (isAbove ? above : below).push(seg);
    }
    return { below, above };
  }, [omega, earthLon]);

  const asc = moonGeo(0, omega, earthLon);
  const desc = moonGeo(180, omega, earthLon);
  const moonAbove = g.zEc >= 0;

  const moonRot = moonSunFacingRotation(g.sx, g.sy, sun.x, sun.y);

  const shadowCone = useMemo(() => {
    const tipU = localToScreen(ECL.umbraLen, 0, 0, earthLon);
    const tipP = localToScreen(ECL.penumbraLen, 0, 0, earthLon);
    const topU = localToScreen(0, -ECL.earthR, 0, earthLon);
    const botU = localToScreen(0, ECL.earthR, 0, earthLon);
    const topP = localToScreen(0, -ECL.earthR * 1.35, 0, earthLon);
    const botP = localToScreen(0, ECL.earthR * 1.35, 0, earthLon);
    return { tipU, tipP, topU, botU, topP, botP };
  }, [earthLon]);

  const uFromEvt = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return u;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * ECL.W;
    const py = ((e.clientY - r.top) / r.height) * ECL.H;
    let best = u;
    let bestD = Infinity;
    for (let k = 0; k < 360; k += 2) {
      const p = moonGeo(k, omega, earthLon);
      const d = (p.sx - px) ** 2 + (p.sy - py) ** 2;
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    }
    return best;
  };

  const rays = Array.from({ length: 12 }, (_, k) => {
    const a = (k / 12) * Math.PI * 2;
    const r0 = ECL.sunR + 4;
    const r1 = ECL.sunR + (k % 2 ? 14 : 22);
    return (
      <line
        key={`ray${k}`}
        x1={sun.x + r0 * Math.cos(a)}
        y1={sun.y + r0 * Math.sin(a)}
        x2={sun.x + r1 * Math.cos(a)}
        y2={sun.y + r1 * Math.sin(a)}
        className="ecl-ray"
      />
    );
  });

  const moonGroup = (
    <g
      transform={`translate(${g.sx} ${g.sy}) rotate(${moonRot})`}
      className={status === "total" ? "ecl-moon-eclipsed" : ""}
    >
      {(status === "total" || status === "partial") && (
        <circle cx={0} cy={0} r={ECL.moonR + 4} className="ecl-blood-glow" />
      )}
      <MoonPhaseDisc elongation={status === "total" ? 178 : g.E} r={ECL.moonR} uid="ecl-moon" />
      {status === "total" && <circle cx={0} cy={0} r={ECL.moonR} className="ecl-blood-tint" />}
    </g>
  );

  const statusLabel =
    status === "total"
      ? "पूर्ण ग्रहण"
      : status === "partial"
        ? "खण्डग्रास"
        : status === "penumbral"
          ? "उपछायाँ ग्रहण"
          : solar
            ? "सूर्यग्रहण रेखा"
            : "ग्रहण छैन";

  const showShadow =
    status !== "none" || solar || (g.xEc > 0.3 && Math.abs(g.radial) < TH_PENUMBRAL_VIS);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${ECL.W} ${ECL.H}`}
      className={`ed-svg ecl-svg${onU ? " grab" : ""}`}
      onPointerDown={(e) => {
        if (!onU) return;
        drag.current = true;
        onU(uFromEvt(e));
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (drag.current && onU) onU(uFromEvt(e));
      }}
      onPointerUp={() => {
        drag.current = false;
      }}
      onPointerCancel={() => {
        drag.current = false;
      }}
    >
      <defs>
        <radialGradient id="ecl-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6d8" />
          <stop offset="38%" stopColor="#ffd24a" />
          <stop offset="78%" stopColor="#f08a1d" />
          <stop offset="100%" stopColor="#d65b12" />
        </radialGradient>
        <radialGradient id="ecl-sunglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffcf57" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#ffcf57" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="ecl-umbra" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#11151b" stopOpacity={0.88} />
          <stop offset="100%" stopColor="#11151b" stopOpacity={0.55} />
        </linearGradient>
        <marker id="ecl-node-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 Z" className="ecl-node-arrow-head" />
        </marker>
        <clipPath id="ecl-panel-clip">
          <rect x={8} y={8} width={ECL.W - 16} height={ECL.H - 16} rx={18} />
        </clipPath>
      </defs>

      <g clipPath="url(#ecl-panel-clip)">
        <rect x={0} y={0} width={ECL.W} height={ECL.H} className="ecl-panel-bg" />

        {/* Sun at centre */}
        <circle cx={sun.x} cy={sun.y} r={ECL.sunR + 30} fill="url(#ecl-sunglow)" />
        {rays}
        <circle cx={sun.x} cy={sun.y} r={ECL.sunR} fill="url(#ecl-sun)" className="ecl-sun-disc" />
        <text x={sun.x} y={sun.y + ECL.sunR + 28} className="ecl-body-label" textAnchor="middle">
          सूर्य
        </text>

        {/* Earth's orbital path around the Sun (क्रान्तिवृत्त) */}
        <path d={earthOrbit} className="ecl-ecliptic-ring" fill="none" />

        {/* राहु–केतु रेखा — through Earth's centre */}
        <line
          x1={nodeLine.a.x}
          y1={nodeLine.a.y}
          x2={nodeLine.b.x}
          y2={nodeLine.b.y}
          className="ecl-node-line"
        />

        {/* Moon orbit — below the ecliptic plane */}
        {moonOrbit.below}

        {/* Sun–Earth line */}
        <line x1={sun.x} y1={sun.y} x2={earth.x} y2={earth.y} className="ecl-axis" />

        {showShadow && (
          <>
            <path
              d={`M ${shadowCone.topP.x} ${shadowCone.topP.y}
                  L ${shadowCone.tipP.x} ${shadowCone.tipP.y}
                  L ${shadowCone.botP.x} ${shadowCone.botP.y} Z`}
              className="ecl-penumbra"
            />
            <path
              d={`M ${shadowCone.topU.x} ${shadowCone.topU.y}
                  L ${shadowCone.tipU.x} ${shadowCone.tipU.y}
                  L ${shadowCone.botU.x} ${shadowCone.botU.y} Z`}
              fill="url(#ecl-umbra)"
              className="ecl-umbra-shape"
            />
          </>
        )}

        {!moonAbove && moonGroup}

        {/* Earth on its orbit — rotating globe */}
        <g transform={`translate(${earth.x} ${earth.y})`}>
          <EarthGlobeImage cx={0} cy={0} r={ECL.earthR} glow glowClassName="ecl-earth-glow" glowPad={8} />
        </g>

        {moonOrbit.above}

        <circle cx={asc.sx} cy={asc.sy} r={5} className="ecl-node-dot" />
        <circle cx={desc.sx} cy={desc.sy} r={5} className="ecl-node-dot" />

        <NodeCallout
          px={asc.sx}
          py={asc.sy}
          label="राहु · उत्तरी पात"
          sym="☊"
          side={asc.sx < earth.x ? "left" : "right"}
        />
        <NodeCallout
          px={desc.sx}
          py={desc.sy}
          label="केतु · दक्षिणी पात"
          sym="☋"
          side={desc.sx < earth.x ? "left" : "right"}
        />

        {moonAbove && moonGroup}

        <text x={earth.x} y={earth.y + ECL.earthR + 30} className="ecl-body-label" textAnchor="middle">
          पृथ्वी
        </text>

        <text x={ECL.W / 2} y={ECL.H - 52} className="ecl-plane-caption" textAnchor="middle">
          क्रान्तिवृत्त — पृथ्वीको सूर्याङ्को कक्ष (ठोस वृत्त)
        </text>
        <text x={ECL.W / 2} y={ECL.H - 28} className="ecl-tilt-note" textAnchor="middle">
          चन्द्र-कक्ष ~{fmt(5)}° झुकेको (टुट्टेदार) · पृथ्वी, चन्द्र र राहु–केतु सँगै घुम्छ
        </text>
      </g>

      <g transform={`translate(${ECL.W - 30} 40)`}>
        <text
          textAnchor="end"
          className={`ecl-status ecl-status-${status === "none" ? (solar ? "solar" : "none") : status}`}
        >
          {statusLabel}
        </text>
        <text textAnchor="end" y={26} className="ecl-status-sub">
          अक्षांश β = {fmt(Math.abs(realBeta(g.betaDeg)).toFixed(1))}° · कोण {fmt(Math.round(g.E))}°
        </text>
      </g>
    </svg>
  );
}
