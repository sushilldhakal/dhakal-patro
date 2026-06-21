import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { EarthGlobeImage } from "./EarthGlobeImage";

/**
 * 3-D perspective of the Moon's orbital plane (tilted ~5°, drawn larger) cutting
 * the flat ecliptic plane, the two nodes राहु/केतु where they cross, and the
 * 18.6-year retrograde drift (precession) of the line of nodes. Orthographic
 * projection viewed from a fixed elevation; the Moon rides the tilted ring while
 * the whole ring's node line slowly sweeps round and returns after 18.6 years.
 */

const RAD = Math.PI / 180;
const VB = { W: 1240, H: 820 };
const CX = 620;
const CY = 432;
// EL high enough that the tilted ring never collapses edge-on as it precesses
// (needs EL + INC < 90 with margin), yet low enough to read as a 3-D arch.
const EL = 26 * RAD; // viewing elevation above the ecliptic plane
const SE = Math.sin(EL);
const CE = Math.cos(EL);
const RD = 498; // ecliptic disc radius
const RM = 275; // Moon-orbit radius (sits inside the plane so the arch reads)
const REAL_TILT = 5.14;
const INC = 22 * RAD; // drawn tilt (exaggerated from ~5° so the arch is obvious)
const CI = Math.cos(INC);
const SI = Math.sin(INC);
const EARTH_R = 50;
const MOON_R = 17;
const NODAL_YEARS = 18.6;

const fmt = (n: string | number) => toNepaliDigits(n);

interface Pt {
  x: number;
  y: number;
  depth: number;
  Z: number;
}

function proj(X: number, Y: number, Z: number): Pt {
  return { x: CX + X, y: CY - (Y * SE + Z * CE), depth: Y, Z };
}

/** Moon-orbit point at argument-of-latitude u (deg from ascending node), node Ω (deg). */
function orbitPt(u: number, omega: number): Pt {
  const ur = u * RAD;
  const O = omega * RAD;
  const cu = Math.cos(ur);
  const su = Math.sin(ur);
  const X = RM * (Math.cos(O) * cu - Math.sin(O) * su * CI);
  const Y = RM * (Math.sin(O) * cu + Math.cos(O) * su * CI);
  const Z = RM * su * SI;
  return proj(X, Y, Z);
}

/** In-ecliptic-plane point (Z = 0) at planar angle a (deg), radius r. */
function planePt(a: number, r: number): Pt {
  const ar = a * RAD;
  return proj(r * Math.cos(ar), r * Math.sin(ar), 0);
}

function MoonOrbitDiagram({ omega, moonU }: { omega: number; moonU: number }) {
  // Orbit ring split into small segments — coloured by above/below the ecliptic,
  // and layered in front of / behind Earth for a true 3-D crossing.
  const segs = useMemo(() => {
    const back: React.ReactNode[] = [];
    const front: React.ReactNode[] = [];
    const STEP = 4;
    for (let u = 0; u < 360; u += STEP) {
      const a = orbitPt(u, omega);
      const b = orbitPt(u + STEP, omega);
      const above = a.Z + b.Z >= 0;
      const node = Math.abs(((u + STEP / 2) % 180)) < STEP; // near a crossing
      const seg = (
        <line
          key={`o${u}`}
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          className={`mot-orbit ${above ? "above" : "below"}${node ? " cross" : ""}`}
        />
      );
      ((a.depth + b.depth) / 2 < 0 ? back : front).push(seg);
    }
    return { back, front };
  }, [omega]);

  const asc = orbitPt(0, omega); // राहु — ascending node
  const desc = orbitPt(180, omega); // केतु — descending node
  // Node line extended to the disc edge for clarity.
  const ascEdge = planePt(omega, RD * 0.96);
  const descEdge = planePt(omega + 180, RD * 0.96);

  // Dihedral tilt wedge at the ascending node: a reference ray in the ecliptic
  // plane and the orbit's rising ray, with an arc between them = the tilt.
  const tiltWedge = useMemo(() => {
    const O = omega * RAD;
    const na: [number, number, number] = [RM * Math.cos(O), RM * Math.sin(O), 0];
    const dPlane: [number, number, number] = [-Math.sin(O), Math.cos(O), 0]; // ⟂ node line, in ecliptic
    const up: [number, number, number] = [0, 0, 1]; // ecliptic normal
    const ray = (d: [number, number, number], L: number) =>
      proj(na[0] + d[0] * L, na[1] + d[1] * L, na[2] + d[2] * L);
    const dOrbit: [number, number, number] = [
      dPlane[0] * CI + up[0] * SI,
      dPlane[1] * CI + up[1] * SI,
      dPlane[2] * CI + up[2] * SI,
    ];
    const arc: string[] = [];
    const R = 64;
    const STEPS = 16;
    for (let k = 0; k <= STEPS; k++) {
      const t = (k / STEPS) * INC;
      const dx = dPlane[0] * Math.cos(t) + up[0] * Math.sin(t);
      const dy = dPlane[1] * Math.cos(t) + up[1] * Math.sin(t);
      const dz = dPlane[2] * Math.cos(t) + up[2] * Math.sin(t);
      const p = proj(na[0] + dx * R, na[1] + dy * R, na[2] + dz * R);
      arc.push(`${k === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    return { p0: proj(na[0], na[1], na[2]), pPlane: ray(dPlane, 104), pOrbit: ray(dOrbit, 104), arc: arc.join(" ") };
  }, [omega]);

  const moon = orbitPt(moonU, omega);
  // Vertical post from the Moon down to its shadow point on the ecliptic plane.
  const O = omega * RAD;
  const ur = moonU * RAD;
  const baseX = RM * (Math.cos(O) * Math.cos(ur) - Math.sin(O) * Math.sin(ur) * CI);
  const baseY = RM * (Math.sin(O) * Math.cos(ur) + Math.cos(O) * Math.sin(ur) * CI);
  const moonBase = proj(baseX, baseY, 0);
  const moonAbove = moon.Z >= 0;

  const sunDir = planePt(0, RD);

  return (
    <svg viewBox={`0 0 ${VB.W} ${VB.H}`} className="ed-svg mot-svg" role="img">
      <defs>
        <radialGradient id="mot-disc" cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="color-mix(in srgb, var(--tm-teal) 26%, transparent)" />
          <stop offset="100%" stopColor="color-mix(in srgb, var(--tm-teal) 7%, transparent)" />
        </radialGradient>
        <radialGradient id="mot-moon" cx="36%" cy="32%" r="74%">
          <stop offset="0%" stopColor="#eef1f4" />
          <stop offset="55%" stopColor="#aab2bb" />
          <stop offset="100%" stopColor="#5f6770" />
        </radialGradient>
        <marker id="mot-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 Z" className="mot-arrow-head" />
        </marker>
      </defs>

      {/* legend */}
      <g className="mot-legend">
        <line x1={34} y1={34} x2={70} y2={34} className="mot-orbit above" />
        <text x={78} y={39} className="mot-legend-label">चन्द्र-कक्ष — समतलभन्दा माथि</text>
        <line x1={34} y1={62} x2={70} y2={62} className="mot-orbit below" />
        <text x={78} y={67} className="mot-legend-label">समतलभन्दा तल</text>
      </g>

      {/* ecliptic plane (flat disc) */}
      <ellipse cx={CX} cy={CY} rx={RD} ry={RD * SE} fill="url(#mot-disc)" className="mot-plane" />
      <ellipse cx={CX} cy={CY} rx={RD} ry={RD * SE} className="mot-plane-rim" fill="none" />
      <text x={CX} y={CY + RD * SE + 30} className="mot-plane-label" textAnchor="middle">
        क्रान्तिवृत्त तल (सूर्यपथको समतल)
      </text>

      {/* node-drift track (where the nodes travel) + retrograde arrow */}
      <ellipse cx={CX} cy={CY} rx={RM} ry={RM * SE} className="mot-node-track" fill="none" />

      {/* orbit ring behind Earth */}
      {segs.back}

      {/* node line through Earth */}
      <line x1={ascEdge.x} y1={ascEdge.y} x2={descEdge.x} y2={descEdge.y} className="mot-node-line" />

      {/* Sun direction reference in the plane */}
      <line x1={CX} y1={CY} x2={sunDir.x} y2={sunDir.y} className="mot-sun-ray" markerEnd="url(#mot-arrow)" />
      <text x={sunDir.x + 6} y={sunDir.y + 4} className="mot-sun-label" textAnchor="start">
        सूर्यतिर
      </text>

      {/* Earth */}
      <g className="ho-earth-group" transform={`translate(${CX} ${CY})`}>
        <EarthGlobeImage cx={0} cy={0} r={EARTH_R} glow glowClassName="mot-earth-glow" glowPad={10} />
        <text y={EARTH_R + 26} className="ed-body-label" textAnchor="middle">
          पृथ्वी
        </text>
      </g>

      {/* orbit ring in front of Earth */}
      {segs.front}

      {/* tilt wedge at ascending node */}
      <path d={tiltWedge.arc} className="mot-tilt-arc" fill="none" />
      <line x1={tiltWedge.p0.x} y1={tiltWedge.p0.y} x2={tiltWedge.pPlane.x} y2={tiltWedge.pPlane.y} className="mot-tilt-ref" />
      <line x1={tiltWedge.p0.x} y1={tiltWedge.p0.y} x2={tiltWedge.pOrbit.x} y2={tiltWedge.pOrbit.y} className="mot-tilt-ref orbit" />
      <text x={tiltWedge.p0.x + 14} y={tiltWedge.p0.y - 44} className="mot-tilt-label" textAnchor="start">
        ~{fmt(5)}° झुकाव
      </text>

      {/* nodes */}
      {[
        { p: asc, ne: "राहु", sym: "☊", dy: -18 },
        { p: desc, ne: "केतु", sym: "☋", dy: 30 },
      ].map((n) => (
        <g key={n.ne}>
          <circle cx={n.p.x} cy={n.p.y} r={9} className="mot-node" />
          <circle cx={n.p.x} cy={n.p.y} r={3.4} className="mot-node-dot" />
          <text x={n.p.x} y={n.p.y + n.dy} className="mot-node-label" textAnchor="middle">
            {n.ne} {n.sym}
          </text>
        </g>
      ))}

      {/* Moon + height post */}
      <line x1={moon.x} y1={moon.y} x2={moonBase.x} y2={moonBase.y} className="mot-height-post" />
      <circle cx={moonBase.x} cy={moonBase.y} r={3} className="mot-base-dot" />
      <g transform={`translate(${moon.x} ${moon.y})`}>
        <circle cx={0} cy={0} r={MOON_R + 3} className={`mot-moon-halo ${moonAbove ? "up" : "down"}`} />
        <circle cx={0} cy={0} r={MOON_R} fill="url(#mot-moon)" className="mot-moon" />
        <text y={-MOON_R - 8} className="mot-moon-label" textAnchor="middle">
          चन्द्र
        </text>
      </g>
    </svg>
  );
}

const PRESETS = [
  { ne: "१/४ चक्र", years: NODAL_YEARS / 4 },
  { ne: "आधा चक्र", years: NODAL_YEARS / 2 },
  { ne: "पूरा चक्र", years: NODAL_YEARS },
];

export function MoonOrbitTiltStudy() {
  const [years, setYears] = useState(0);
  const [moonU, setMoonU] = useState(40);
  const [playing, setPlaying] = useState(true);
  const raf = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setYears((p) => (p + dt * 1.6) % NODAL_YEARS); // precession clock
      setMoonU((p) => (p + dt * 150) % 360); // Moon orbits much faster
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  // Retrograde node drift: Ω decreases, one full turn per 18.6 years.
  const omega = ((120 - (years / NODAL_YEARS) * 360) % 360 + 360) % 360;
  const remaining = NODAL_YEARS - years;

  return (
    <div className="tm-card pad-lg">
      <MoonOrbitDiagram omega={omega} moonU={moonU} />
      <div className="ed-controls">
        <div className="ed-readout">
          <div className="ed-ro">
            <span className="ed-ro-k">कक्ष झुकाव</span>
            <span className="ed-ro-v mono">~{fmt(REAL_TILT.toFixed(1))}°</span>
          </div>
          <div className="ed-ro">
            <span className="ed-ro-k">पात रेखा कोण</span>
            <span className="ed-ro-v mono">{fmt(Math.round(omega))}°</span>
          </div>
          <div className="ed-ro">
            <span className="ed-ro-k">बितेका वर्ष</span>
            <span className="ed-ro-v mono">{fmt(years.toFixed(1))} / {fmt(NODAL_YEARS)}</span>
          </div>
          <div className="ed-ro">
            <span className="ed-ro-k">पात फर्कन</span>
            <span className="ed-ro-v amber">{fmt(remaining.toFixed(1))} वर्ष बाँकी</span>
          </div>
        </div>
        <div className="ed-scrub-wrap">
          <button
            type="button"
            className="ed-playbtn"
            onClick={() => setPlaying((p) => !p)}
            title={playing ? "रोक्नुहोस्" : "चलाउनुहोस्"}
            aria-label={playing ? "रोक्नुहोस्" : "चलाउनुहोस्"}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <input
            className="ed-scrub"
            type="range"
            min={0}
            max={NODAL_YEARS}
            step={0.05}
            value={years}
            style={{ "--fill": `${(years / NODAL_YEARS) * 100}%` } as React.CSSProperties}
            onChange={(e) => {
              setPlaying(false);
              setYears(+e.target.value);
            }}
          />
        </div>
        <div className="ed-presets">
          {PRESETS.map((p) => (
            <button
              key={p.ne}
              type="button"
              className={"ed-preset" + (Math.abs(years - p.years) < 0.3 ? " on" : "")}
              onClick={() => {
                setPlaying(false);
                setYears(p.years % NODAL_YEARS);
              }}
            >
              {p.ne}
            </button>
          ))}
        </div>
      </div>
      <p className="tm-card-cap">
        चन्द्रको कक्ष क्रान्तिवृत्तभन्दा <span className="hl-amber">~{fmt(5)}° झुकेको</span> छ — त्यसैले
        आधा कक्ष समतलभन्दा माथि, आधा तल पर्छ। दुई समतल काट्ने बिन्दु नै{" "}
        <span className="hl">राहु (आरोही)</span> र <span className="hl">केतु (अवरोही)</span> पात हुन्।
        यो पात रेखा बिस्तारै पछाडितिर घुम्छ र <b>~{fmt(NODAL_YEARS)} वर्षमा</b> उही ठाउँमा फर्कन्छ
        (पात-चक्र) — यसैले ग्रहण ऋतु पनि हरेक वर्ष केही दिन सर्दै जान्छ।
      </p>
    </div>
  );
}
