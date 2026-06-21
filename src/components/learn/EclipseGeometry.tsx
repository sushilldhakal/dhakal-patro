import { useMemo, useRef } from "react";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { moonSunFacingRotation } from "@/lib/moon-phase-svg";
import { EarthGlobeImage } from "./EarthGlobeImage";
import { MoonPhaseDisc } from "@/components/tithi-mechanics/MoonPhaseDisc";
import {
  ECL,
  isSolarAlignment,
  lunarEclipseStatus,
  moonGeo,
  penumbraHalfWidth,
} from "./eclipse-math";

interface Props {
  u: number;
  omega: number;
  onU?: (v: number) => void;
}

export function EclipseGeometry({ u, omega, onU }: Props) {
  const fmt = (n: number) => toNepaliDigits(n);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef(false);

  const g = moonGeo(u, omega);
  const status = lunarEclipseStatus(g);
  const solar = isSolarAlignment(g);

  const ringPath = useMemo(() => {
    const front: string[] = [];
    const back: string[] = [];
    for (let k = 0; k <= 180; k++) {
      const uu = k * 2;
      const p = moonGeo(uu, omega);
      (p.zEc >= 0 ? front : back).push(
        `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`,
      );
    }
    return { front, back };
  }, [omega]);

  const asc = moonGeo(0, omega); // Rahu ☊ — ascending node
  const desc = moonGeo(180, omega); // Ketu ☋ — descending node

  const moonRot = moonSunFacingRotation(g.sx, g.sy, ECL.sunX, ECL.axisY);

  const uFromEvt = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return u;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * ECL.W;
    const py = ((e.clientY - r.top) / r.height) * ECL.H;
    let best = u;
    let bestD = Infinity;
    for (let k = 0; k < 360; k += 2) {
      const p = moonGeo(k, omega);
      const d = (p.sx - px) ** 2 + (p.sy - py) ** 2;
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    }
    return best;
  };

  const rays = Array.from({ length: 16 }, (_, k) => {
    const a = (k / 16) * Math.PI * 2;
    const r0 = ECL.sunR + 3;
    const r1 = ECL.sunR + (k % 2 ? 12 : 20);
    return (
      <line
        key={`ray${k}`}
        x1={ECL.sunX + r0 * Math.cos(a)}
        y1={ECL.axisY + r0 * Math.sin(a)}
        x2={ECL.sunX + r1 * Math.cos(a)}
        y2={ECL.axisY + r1 * Math.sin(a)}
        className="ecl-ray"
      />
    );
  });

  const px = ECL.earthX + ECL.penumbraLen;
  const phEnd = penumbraHalfWidth(ECL.penumbraLen);
  const moonOnTop = g.sy <= ECL.axisY; // draw order: keep Moon above shadow when behind

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
          <stop offset="0%" stopColor="#ffcf57" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#ffcf57" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="ecl-umbra" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#11151b" stopOpacity={0.92} />
          <stop offset="100%" stopColor="#11151b" stopOpacity={0.62} />
        </linearGradient>
        <marker id="ecl-orbit-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" className="ecl-orbit-arrow-head" />
        </marker>
      </defs>

      {/* ecliptic plane — the flat Sun–Earth–shadow reference */}
      <ellipse
        cx={ECL.earthX}
        cy={ECL.axisY}
        rx={ECL.R + 116}
        ry={(ECL.R + 116) * ECL.perspX * 0.5}
        className="ecl-plane"
      />
      <line
        x1={ECL.sunX}
        y1={ECL.axisY}
        x2={ECL.earthX + ECL.penumbraLen}
        y2={ECL.axisY}
        className="ecl-axis"
      />

      {/* penumbra (light) then umbra (dark) cones, anti-sunward */}
      <path
        d={`M ${ECL.earthX} ${ECL.axisY - ECL.earthR}
            L ${px} ${ECL.axisY - phEnd}
            L ${px} ${ECL.axisY + phEnd}
            L ${ECL.earthX} ${ECL.axisY + ECL.earthR} Z`}
        className="ecl-penumbra"
      />
      <path
        d={`M ${ECL.earthX} ${ECL.axisY - ECL.earthR}
            L ${ECL.earthX + ECL.umbraLen} ${ECL.axisY}
            L ${ECL.earthX} ${ECL.axisY + ECL.earthR} Z`}
        fill="url(#ecl-umbra)"
        className="ecl-umbra-shape"
      />
      <text x={ECL.earthX + 116} y={ECL.axisY + 26} className="ecl-shadow-label on-umbra" textAnchor="middle">
        प्रच्छाया · umbra
      </text>
      <text x={ECL.earthX + 320} y={ECL.axisY + phEnd * 0.66 + 18} className="ecl-shadow-label faint" textAnchor="middle">
        उपछाया · penumbra
      </text>

      {/* Moon's tilted orbit ring: solid above ecliptic, dashed below */}
      <polyline points={ringPath.back.join(" ")} className="ecl-orbit-back" fill="none" />
      <polyline points={ringPath.front.join(" ")} className="ecl-orbit-front" fill="none" markerEnd="url(#ecl-orbit-arrow)" />

      {/* line of nodes through Earth = Rahu–Ketu axis */}
      <line x1={asc.sx} y1={asc.sy} x2={desc.sx} y2={desc.sy} className="ecl-node-line" />

      {/* Sun */}
      <circle cx={ECL.sunX} cy={ECL.axisY} r={ECL.sunR + 30} fill="url(#ecl-sunglow)" />
      {rays}
      <circle cx={ECL.sunX} cy={ECL.axisY} r={ECL.sunR} fill="url(#ecl-sun)" />
      <text x={ECL.sunX} y={ECL.axisY + ECL.sunR + 30} className="ed-body-label" textAnchor="middle">
        सूर्य
      </text>

      {/* Earth */}
      <g className="ho-earth-group" transform={`translate(${ECL.earthX} ${ECL.axisY})`}>
        <EarthGlobeImage cx={0} cy={0} r={ECL.earthR} glow glowClassName="ecl-earth-glow" glowPad={10} />
        <text y={ECL.earthR + 24} className="ed-body-label" textAnchor="middle">
          पृथ्वी
        </text>
      </g>

      {/* nodes */}
      {[
        { p: asc, ne: "राहु", sym: "☊", en: "आरोही पात" },
        { p: desc, ne: "केतु", sym: "☋", en: "अवरोही पात" },
      ].map((n) => (
        <g key={n.ne}>
          <circle cx={n.p.sx} cy={n.p.sy} r={7} className="ecl-node" />
          <text x={n.p.sx} y={n.p.sy - 14} className="ecl-node-label" textAnchor="middle">
            {n.ne} {n.sym}
          </text>
        </g>
      ))}

      {/* Moon (rendered last when in front so it can sit inside the shadow) */}
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

      {/* vertical drop showing the Moon's latitude (miss distance) at full moon */}
      {g.xEc > 0.2 && Math.abs(g.sy - ECL.axisY) > 4 && (
        <line
          x1={g.sx}
          y1={ECL.axisY}
          x2={g.sx}
          y2={g.sy}
          className="ecl-beta-drop"
        />
      )}

      {/* status badge */}
      <g transform={`translate(${ECL.W - 30} 40)`}>
        <text
          textAnchor="end"
          className={`ecl-status ecl-status-${status === "none" ? (solar ? "solar" : "none") : status}`}
        >
          {statusLabel}
        </text>
        <text textAnchor="end" y={26} className="ecl-status-sub">
          {moonOnTop ? "" : ""}
          अक्षांश β = {fmt(Math.abs(Math.round(g.betaDeg)))}° · कोण {fmt(Math.round(g.E))}°
        </text>
      </g>

      <text x={ECL.earthX} y={ECL.H - 16} className="ecl-tilt-note" textAnchor="middle">
        ※ कक्ष झुकाव स्पष्टताका लागि बढाइएको — वास्तविक ~{fmt(5)}°
      </text>
    </svg>
  );
}
