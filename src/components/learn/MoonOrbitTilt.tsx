import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { EarthGlobeImage } from "./EarthGlobeImage";

/**
 * 3-D perspective of the Moon's tilted orbit (~5°, drawn larger) over the flat
 * ecliptic plane. A Sun–Earth–shadow line runs through Earth's centre; the Sun
 * sweeps round once a year so the line rotates. An eclipse happens only when the
 * Moon sits ON that line AND at a node (राहु/केतु) — i.e. when the line of nodes
 * points at the Sun. A second control drifts the node line through its 18.6-year
 * precession, showing how the eclipse seasons shift around the year.
 */

const RAD = Math.PI / 180;
const VB = { W: 1240, H: 860 };
const CX = 620;
const CY = 446;
const EL = 26 * RAD; // viewing elevation (keeps the tilted ring off edge-on)
const SE = Math.sin(EL);
const CE = Math.cos(EL);
const RD = 498; // ecliptic disc radius
const RM = 270; // Moon-orbit radius
const RSUN = 430; // Sun distance (well outside the Moon's orbit)
const REAL_TILT = 5.14;
const INC = 22 * RAD; // drawn tilt (exaggerated from ~5°)
const CI = Math.cos(INC);
const SI = Math.sin(INC);
const EARTH_R = 48;
const MOON_R = 17;

const SIDEREAL_MONTH = 27.32166;
const YEAR_DAYS = 365.2422;
const NODAL_YEARS = 18.6;
const YEAR_RANGE = 400; // scrub span for the annual Sun motion (days)
const NODE0 = 120;

const fmt = (n: string | number) => toNepaliDigits(n);
const norm360 = (a: number) => ((a % 360) + 360) % 360;
const angDiff = (a: number, b: number) => Math.abs(((a - b + 180) % 360) - 180);

type Status = "lunar" | "solar" | "none";

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

interface DiagramProps {
  omega: number;
  moonU: number;
  sunLon: number;
  status: Status;
  season: boolean;
}

function MoonOrbitDiagram({ omega, moonU, sunLon, status, season }: DiagramProps) {
  // Orbit ring as small segments — coloured above/below the ecliptic, layered
  // in front of / behind Earth for a true 3-D crossing.
  const segs = useMemo(() => {
    const back: React.ReactNode[] = [];
    const front: React.ReactNode[] = [];
    const STEP = 4;
    for (let u = 0; u < 360; u += STEP) {
      const a = orbitPt(u, omega);
      const b = orbitPt(u + STEP, omega);
      const above = a.Z + b.Z >= 0;
      const node = Math.abs((u + STEP / 2) % 180) < STEP;
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

  const asc = orbitPt(0, omega);
  const desc = orbitPt(180, omega);
  const ascEdge = planePt(omega, RM);
  const descEdge = planePt(omega + 180, RM);

  // Dihedral tilt wedge at the ascending node.
  const tiltWedge = useMemo(() => {
    const O = omega * RAD;
    const na: [number, number, number] = [RM * Math.cos(O), RM * Math.sin(O), 0];
    const dPlane: [number, number, number] = [-Math.sin(O), Math.cos(O), 0];
    const up: [number, number, number] = [0, 0, 1];
    const ray = (d: [number, number, number], L: number) =>
      proj(na[0] + d[0] * L, na[1] + d[1] * L, na[2] + d[2] * L);
    const dOrbit: [number, number, number] = [
      dPlane[0] * CI + up[0] * SI,
      dPlane[1] * CI + up[1] * SI,
      dPlane[2] * CI + up[2] * SI,
    ];
    const arc: string[] = [];
    const R = 60;
    const STEPS = 16;
    for (let k = 0; k <= STEPS; k++) {
      const t = (k / STEPS) * INC;
      const dx = dPlane[0] * Math.cos(t) + up[0] * Math.sin(t);
      const dy = dPlane[1] * Math.cos(t) + up[1] * Math.sin(t);
      const dz = dPlane[2] * Math.cos(t) + up[2] * Math.sin(t);
      const p = proj(na[0] + dx * R, na[1] + dy * R, na[2] + dz * R);
      arc.push(`${k === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    return { p0: proj(na[0], na[1], na[2]), pPlane: ray(dPlane, 100), pOrbit: ray(dOrbit, 100), arc: arc.join(" ") };
  }, [omega]);

  const moon = orbitPt(moonU, omega);
  const O = omega * RAD;
  const ur = moonU * RAD;
  const baseX = RM * (Math.cos(O) * Math.cos(ur) - Math.sin(O) * Math.sin(ur) * CI);
  const baseY = RM * (Math.sin(O) * Math.cos(ur) + Math.cos(O) * Math.sin(ur) * CI);
  const moonBase = proj(baseX, baseY, 0);
  const moonAbove = moon.Z >= 0;

  const sun = planePt(sunLon, RSUN);
  const shadow = planePt(sunLon + 180, RSUN);
  const eclipsing = status !== "none";

  return (
    <svg viewBox={`0 0 ${VB.W} ${VB.H}`} className="ed-svg mot-svg" role="img">
      <defs>
        <radialGradient id="mot-disc" cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="color-mix(in srgb, var(--tm-teal) 42%, transparent)" />
          <stop offset="100%" stopColor="color-mix(in srgb, var(--tm-teal) 16%, transparent)" />
        </radialGradient>
        <radialGradient id="mot-moon" cx="36%" cy="32%" r="74%">
          <stop offset="0%" stopColor="#eef1f4" />
          <stop offset="55%" stopColor="#aab2bb" />
          <stop offset="100%" stopColor="#5f6770" />
        </radialGradient>
        <radialGradient id="mot-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6d8" />
          <stop offset="44%" stopColor="#ffd24a" />
          <stop offset="100%" stopColor="#ef8a1d" />
        </radialGradient>
        <radialGradient id="mot-sunglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffcf57" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#ffcf57" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* legend */}
      <g className="mot-legend">
        <line x1={34} y1={32} x2={70} y2={32} className="mot-orbit above" />
        <text x={78} y={37} className="mot-legend-label">कक्ष — समतलभन्दा माथि</text>
        <line x1={34} y1={58} x2={70} y2={58} className="mot-orbit below" />
        <text x={78} y={63} className="mot-legend-label">समतलभन्दा तल</text>
        <line x1={34} y1={84} x2={70} y2={84} className="mot-sun-line" />
        <text x={78} y={89} className="mot-legend-label">सूर्य–पृथ्वी (ग्रहण) रेखा</text>
      </g>

      {/* ecliptic plane */}
      <ellipse cx={CX} cy={CY} rx={RD} ry={RD * SE} fill="url(#mot-disc)" className="mot-plane" />
      <ellipse cx={CX} cy={CY} rx={RD} ry={RD * SE} className="mot-plane-rim" fill="none" />
      <text x={CX} y={CY + RD * SE + 30} className="mot-plane-label" textAnchor="middle">
        क्रान्तिवृत्त तल (सूर्यपथको समतल)
      </text>

      {/* node-drift track */}
      <ellipse cx={CX} cy={CY} rx={RM} ry={RM * SE} className="mot-node-track" fill="none" />

      {/* Sun–Earth–shadow line through Earth's centre — translucent beam behind
          the crisp line so it always reads (and stays visible when thin on mobile) */}
      <line x1={sun.x} y1={sun.y} x2={shadow.x} y2={shadow.y} className={`mot-sun-beam${season ? " aligned" : ""}`} />
      <line
        x1={sun.x}
        y1={sun.y}
        x2={shadow.x}
        y2={shadow.y}
        className={`mot-sun-line${season ? " aligned" : ""}`}
      />
      <circle cx={shadow.x} cy={shadow.y} r={9} className="mot-shadow-dot" />
      <text x={shadow.x} y={shadow.y - 14} className="mot-shadow-label" textAnchor="middle">
        छायाँ
      </text>

      {/* orbit ring behind Earth */}
      {segs.back}

      {/* line of nodes */}
      <line x1={ascEdge.x} y1={ascEdge.y} x2={descEdge.x} y2={descEdge.y} className="mot-node-line" />

      {/* Earth */}
      <g className="ho-earth-group" transform={`translate(${CX} ${CY})`}>
        <EarthGlobeImage cx={0} cy={0} r={EARTH_R} glow glowClassName="mot-earth-glow" glowPad={10} />
        <text y={EARTH_R + 26} className="ed-body-label" textAnchor="middle">
          पृथ्वी
        </text>
      </g>

      {/* orbit ring in front of Earth */}
      {segs.front}

      {/* Sun */}
      <circle cx={sun.x} cy={sun.y} r={40} fill="url(#mot-sunglow)" />
      <circle cx={sun.x} cy={sun.y} r={24} fill="url(#mot-sun)" />
      <text x={sun.x} y={sun.y + 42} className="mot-sun-label" textAnchor="middle">
        सूर्य
      </text>

      {/* tilt wedge */}
      <path d={tiltWedge.arc} className="mot-tilt-arc" fill="none" />
      <line x1={tiltWedge.p0.x} y1={tiltWedge.p0.y} x2={tiltWedge.pPlane.x} y2={tiltWedge.pPlane.y} className="mot-tilt-ref" />
      <line x1={tiltWedge.p0.x} y1={tiltWedge.p0.y} x2={tiltWedge.pOrbit.x} y2={tiltWedge.pOrbit.y} className="mot-tilt-ref orbit" />
      <text x={tiltWedge.p0.x + 12} y={tiltWedge.p0.y - 42} className="mot-tilt-label" textAnchor="start">
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
      <g transform={`translate(${moon.x} ${moon.y})`} className={eclipsing ? "mot-moon-eclipsing" : ""}>
        {eclipsing && <circle cx={0} cy={0} r={MOON_R + 7} className={`mot-eclipse-glow ${status}`} />}
        <circle cx={0} cy={0} r={MOON_R + 3} className={`mot-moon-halo ${moonAbove ? "up" : "down"}`} />
        <circle
          cx={0}
          cy={0}
          r={MOON_R}
          fill={status === "lunar" ? "#c0392b" : status === "solar" ? "#33373d" : "url(#mot-moon)"}
          className="mot-moon"
        />
        <text y={-MOON_R - 9} className="mot-moon-label" textAnchor="middle">
          चन्द्र
        </text>
      </g>

      {/* eclipse banner */}
      {eclipsing && (
        <text x={CX} y={48} className={`mot-eclipse-banner ${status}`} textAnchor="middle">
          {status === "lunar" ? "● चन्द्रग्रहण — चन्द्र पृथ्वीको छायाँमा" : "● सूर्यग्रहण — चन्द्र सूर्य–पृथ्वी बीचमा"}
        </text>
      )}
      {!eclipsing && season && (
        <text x={CX} y={48} className="mot-season-banner" textAnchor="middle">
          ग्रहण ऋतु — पात रेखा सूर्यसँग मिल्यो (पूर्णिमा/अमावस्या कुर्नुहोस्)
        </text>
      )}
    </svg>
  );
}

export function MoonOrbitTiltStudy() {
  const [dayT, setDayT] = useState(0); // annual clock (Sun + Moon)
  const [precT, setPrecT] = useState(0); // nodal precession (years)
  const [playing, setPlaying] = useState(true);
  const raf = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setDayT((p) => (p + dt * 26) % YEAR_RANGE);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const model = useMemo(() => {
    const sunLon = norm360((360 * dayT) / YEAR_DAYS);
    const moonLon = norm360((360 * dayT) / SIDEREAL_MONTH);
    const omega = norm360(NODE0 - (360 * precT) / NODAL_YEARS);
    const u = norm360(moonLon - omega);
    const E = norm360(moonLon - sunLon); // elongation: 0 new, 180 full
    const nodeProx = Math.abs(Math.sin(u * RAD)); // 0 at a node
    const atNode = nodeProx < Math.sin(11 * RAD);
    let status: Status = "none";
    if (atNode && angDiff(E, 180) < 15) status = "lunar";
    else if (atNode && angDiff(E, 0) < 15) status = "solar";
    const season = angDiff(omega, sunLon) < 13 || angDiff(omega, sunLon + 180) < 13;
    const phase =
      angDiff(E, 180) < 12 ? "पूर्णिमा" : angDiff(E, 0) < 12 ? "अमावस्या" : E < 180 ? "शुक्ल पक्ष" : "कृष्ण पक्ष";
    return { sunLon, omega, u, status, season, phase };
  }, [dayT, precT]);

  const jumpNextEclipse = () => {
    const omega = norm360(NODE0 - (360 * precT) / NODAL_YEARS);
    for (let d = dayT + 1; d < dayT + YEAR_RANGE; d += 0.4) {
      const t = d % YEAR_RANGE;
      const sunLon = norm360((360 * t) / YEAR_DAYS);
      const moonLon = norm360((360 * t) / SIDEREAL_MONTH);
      const u = norm360(moonLon - omega);
      const E = norm360(moonLon - sunLon);
      const atNode = Math.abs(Math.sin(u * RAD)) < Math.sin(11 * RAD);
      if (atNode && (angDiff(E, 180) < 12 || angDiff(E, 0) < 12)) {
        setPlaying(false);
        setDayT(t);
        return;
      }
    }
  };

  const statusText =
    model.status === "lunar"
      ? "चन्द्रग्रहण"
      : model.status === "solar"
        ? "सूर्यग्रहण"
        : model.season
          ? "ग्रहण ऋतु"
          : "ग्रहण छैन";

  return (
    <div className="tm-card pad-lg">
      <MoonOrbitDiagram
        omega={model.omega}
        moonU={model.u}
        sunLon={model.sunLon}
        status={model.status}
        season={model.season}
      />
      <div className="ed-controls">
        <div className="ed-readout">
          <div className="ed-ro">
            <span className="ed-ro-k">कक्ष झुकाव</span>
            <span className="ed-ro-v mono">~{fmt(REAL_TILT.toFixed(1))}°</span>
          </div>
          <div className="ed-ro">
            <span className="ed-ro-k">चन्द्र चरण</span>
            <span className="ed-ro-v">{model.phase}</span>
          </div>
          <div className="ed-ro">
            <span className="ed-ro-k">पात-चक्र</span>
            <span className="ed-ro-v mono">{fmt(precT.toFixed(1))} / {fmt(NODAL_YEARS)} वर्ष</span>
          </div>
          <div className="ed-ro">
            <span className="ed-ro-k">अवस्था</span>
            <span className={"ed-ro-v" + (model.status !== "none" ? " amber" : "")}>{statusText}</span>
          </div>
        </div>

        <div className="mot-slider-row">
          <span className="mot-slider-label">☉ वर्ष — सूर्य रेखा घुम्छ</span>
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
              max={YEAR_RANGE}
              step={0.5}
              value={dayT}
              style={{ "--fill": `${(dayT / YEAR_RANGE) * 100}%` } as React.CSSProperties}
              onChange={(e) => {
                setPlaying(false);
                setDayT(+e.target.value);
              }}
            />
          </div>
        </div>

        <div className="mot-slider-row">
          <span className="mot-slider-label">☊ पात-चक्र — {fmt(NODAL_YEARS)} वर्षे precession</span>
          <input
            className="ed-scrub"
            type="range"
            min={0}
            max={NODAL_YEARS}
            step={0.05}
            value={precT}
            style={{ "--fill": `${(precT / NODAL_YEARS) * 100}%` } as React.CSSProperties}
            onChange={(e) => setPrecT(+e.target.value)}
          />
        </div>

        <div className="ed-presets">
          <button type="button" className="ed-preset" onClick={jumpNextEclipse}>
            अर्को ग्रहण →
          </button>
          <button
            type="button"
            className="ed-preset"
            onClick={() => setPrecT((p) => (p + NODAL_YEARS / 4) % NODAL_YEARS)}
          >
            पात रेखा घुमाउनुहोस्
          </button>
        </div>
      </div>
      <p className="tm-card-cap">
        पृथ्वीको बीचबाट गएको <span className="hl-amber">सूर्य–पृथ्वी (ग्रहण) रेखा</span> सूर्यसँगै वर्षमा
        एक फेरो घुम्छ। चन्द्रको कक्ष <b>~{fmt(5)}°</b> झुकेकाले धेरैजसो पूर्णिमामा चन्द्र यो रेखाभन्दा
        माथि/तल हुन्छ — ग्रहण <b>हुँदैन</b>। ग्रहण त्यतिबेला मात्र हुन्छ जब यो रेखा{" "}
        <span className="hl">राहु वा केतु</span> मा पुग्छ र त्यहीँ चन्द्र (पूर्णिमा/अमावस्या) पर्छ।
        तल्लो स्लाइडरले पात रेखालाई <b>{fmt(NODAL_YEARS)} वर्षे</b> चक्रमा घुमाउँछ — त्यसैले ग्रहण ऋतु
        हरेक वर्ष सर्दै जान्छ।
      </p>
    </div>
  );
}
