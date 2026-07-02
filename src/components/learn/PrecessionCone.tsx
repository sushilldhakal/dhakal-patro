import { useEffect, useMemo, useRef, useState } from "react";
import { motSliderLabel, motSliderRow, tmCardCap, tmCardPadLg, edControls, edPlayBtn, edPresets, edPreset, edReadout, edRo, edRoK, edRoV, edScrubWrap, edSvg } from "@/lib/learn-classes";
import { Pause, Play } from "lucide-react";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { EarthGlobeImage } from "./EarthGlobeImage";
import { RashiGlyph } from "./rashi-icons";

/**
 * Precession of the equinoxes (अयन चलन) — the 26,000-year wobble.
 *
 * Earth's spin axis stays tilted ~23.5° from the ecliptic pole but slowly sweeps
 * a CONE around it, like a spinning top. This diagram shows the cone in 3D: the
 * north pole traces a circle high among the stars (passing different "pole
 * stars" — थुबन, ध्रुव (now), … अभिजित (Vega) ~13,784 BS), while the equinox line
 * rotates through the zodiac on the ecliptic plane. That rotating equinox is
 * exactly what makes the सायन ↔ निरयन gap (ayanāṁśa) grow.
 */

const N = toNepaliDigits;
const TAU = Math.PI * 2;
const CYCLE = 25772; // years for one full precession
const D2R = Math.PI / 180;

/* ---- 3D → 2D oblique projection (ecliptic plane = horizontal) ---------- */
const VB = { W: 700, H: 580 };
const CX = 350;
const CY = 312;
const K = 0.34; // vertical foreshorten of the horizontal plane
const EARTH_R = 56;
const DISK_RX = 258; // ecliptic disk radius
const ZR = 292; // zodiac constellations radius
const LA = 235; // axis half-length
const EPS = 23.5 * D2R;
const SE = Math.sin(EPS);
const CE = Math.cos(EPS);
const RING_R = EARTH_R + 12; // celestial-equator ring radius

type V3 = [number, number, number];
/** project (x east, y up, z depth) → screen point.
 * Depth is mirrored (−z·K) so the zodiac runs anti-clockwise, as राशि always do. */
function proj(x: number, y: number, z: number): [number, number] {
  return [CX + x, CY - z * K - y];
}
const ps = (p: [number, number]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

/* axis unit direction at precession phase φ (top end) */
function axisDir(phi: number): V3 {
  return [SE * Math.cos(phi), CE, SE * Math.sin(phi)];
}

const RASHI = [
  "मेष", "वृष", "मिथुन", "कर्कट", "सिंह", "कन्या",
  "तुला", "वृश्चिक", "धनु", "मकर", "कुम्भ", "मीन",
] as const;

/* ---- pole stars the north pole sweeps past, by बिक्रम सम्वत् year -------
 * ध्रुव (Polaris) and अभिजित (Vega) keep their Nepali names; the rest carry
 * their standard names in देवनागरी (year = closest approach, बि.सं.).        */
const POLE_STARS = [
  { ne: "थुबन", bs: -2730 }, // Thuban (α Dra)
  { ne: "कोचाब", bs: -943 }, // Kochab (β UMi)
  { ne: "ध्रुव", bs: 2159 }, // Polaris (α UMi)
  { ne: "एर्राई", bs: 4057 }, // Errai / γ Cephei
  { ne: "अल्डेरामिन", bs: 7557 }, // Alderamin (α Cep)
  { ne: "डेनेब", bs: 9857 }, // Deneb (α Cyg)
  { ne: "अभिजित", bs: 13784 }, // Vega (α Lyr)
].map((s) => ({ ...s, phi: ((((s.bs / CYCLE) % 1) + 1) % 1) * TAU }));

/** बिक्रम सम्वत् year → label */
function fmtYear(bs: number): string {
  const r = Math.round(bs);
  const abs = N(Math.abs(r).toLocaleString("en-US"));
  return r < 0 ? `${abs} बि.सं. पूर्व` : `${abs} बि.सं.`;
}

export function PrecessionCone() {
  const [phi, setPhi] = useState(0); // precession phase (0 = year 2000)
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setPhi((p) => (p + dt * 0.5) % TAU); // ~0.5 rad/s → full cycle ≈ 12.5 s
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const year = (phi / TAU) * CYCLE; // बिक्रम सम्वत् — starts at ०००० बि.सं.

  /* axis endpoints */
  const a = axisDir(phi);
  const topEnd = proj(LA * a[0], LA * a[1], LA * a[2]);
  const botEnd = proj(-LA * a[0], -LA * a[1], -LA * a[2]);

  /* top / bottom precession-circle geometry (screen ellipses) */
  const topCY = CY - LA * CE;
  const botCY = CY + LA * CE;
  const circRX = LA * SE;
  const circRY = LA * SE * K;

  /* equinox line: lies in the ecliptic plane and sweeps the zodiac as the axis
   * precesses. Precession is RETROGRADE — as the year advances the equinox
   * regresses मेष → मीन → कुम्भ — so it runs on −phi, opposite the pole's advance. */
  const eqPhi = -phi;
  const eqEnd = proj(ZR * Math.cos(eqPhi), 0, ZR * Math.sin(eqPhi));
  const eqEnd2 = proj(-ZR * Math.cos(eqPhi), 0, -ZR * Math.sin(eqPhi));
  const eqIdx = ((-Math.round(phi / (30 * D2R)) % 12) + 12) % 12;
  const eqRashi = RASHI[eqIdx]!;

  /* celestial-equator ring (perpendicular to the spin axis) split front/back */
  const ring = useMemo(() => {
    const u: V3 = [-Math.sin(phi), 0, Math.cos(phi)]; // in ecliptic plane ⟂ axis
    const v: V3 = [
      a[1] * u[2] - a[2] * u[1],
      a[2] * u[0] - a[0] * u[2],
      a[0] * u[1] - a[1] * u[0],
    ]; // a × u
    const back: string[] = [];
    const front: string[] = [];
    for (let i = 0; i <= 64; i++) {
      const t = (i / 64) * TAU;
      const x = RING_R * (Math.cos(t) * u[0] + Math.sin(t) * v[0]);
      const y = RING_R * (Math.cos(t) * u[1] + Math.sin(t) * v[1]);
      const z = RING_R * (Math.cos(t) * u[2] + Math.sin(t) * v[2]);
      (z < 0 ? back : front).push(ps(proj(x, y, z)));
    }
    return { back, front };
  }, [phi, a]);

  const nearStar = POLE_STARS.reduce((best, s) => {
    const d = Math.min(Math.abs(s.phi - phi), TAU - Math.abs(s.phi - phi));
    return d < best.d ? { d, s } : best;
  }, { d: Infinity, s: POLE_STARS[0]! }).s;

  return (
    <div className={tmCardPadLg}>
      <svg viewBox={`0 0 ${VB.W} ${VB.H}`} className={edSvg()} role="img" aria-label="अयन चलन शंकु">
        <defs>
          <radialGradient id="pc-disk" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="color-mix(in srgb, var(--tm-gold) 30%, transparent)" />
            <stop offset="70%" stopColor="color-mix(in srgb, var(--tm-gold) 16%, transparent)" />
            <stop offset="100%" stopColor="color-mix(in srgb, var(--tm-gold) 4%, transparent)" />
          </radialGradient>
          <marker id="pc-arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 Z" fill="var(--tm-amber)" />
          </marker>
        </defs>

        {/* ecliptic plane (yellow disk) */}
        <ellipse cx={CX} cy={CY} rx={DISK_RX} ry={DISK_RX * K} fill="url(#pc-disk)" stroke="color-mix(in srgb, var(--tm-gold) 28%, transparent)" strokeWidth={1} />

        {/* zodiac constellations around the disk */}
        {RASHI.map((name, i) => {
          const th = i * 30 * D2R;
          const [bx, by] = proj(ZR * Math.cos(th), 0, ZR * Math.sin(th));
          const here = i === eqIdx;
          const col = here ? "var(--tm-amber)" : "var(--tm-ink-dim)";
          return (
            <g key={name}>
              <RashiGlyph index={i} size={32} cx={bx} cy={by - 2} color={col} opacity={here ? 1 : 0.9} title={name} />
              <text x={bx} y={by + 26} fill={here ? "var(--tm-amber)" : "var(--tm-ink-faint)"} textAnchor="middle" style={{ font: `${here ? 700 : 500} 10px var(--pn-font)` }}>
                {name}
              </text>
            </g>
          );
        })}

        {/* bottom precession circle (south pole path) */}
        <ellipse cx={CX} cy={botCY} rx={circRX} ry={circRY} fill="none" stroke="var(--tm-amber)" strokeWidth={1.4} strokeDasharray="4 5" opacity={0.8} />

        {/* ecliptic-pole reference axis (vertical) */}
        <line x1={CX} y1={topCY} x2={CX} y2={botCY} stroke="var(--tm-ink-faint)" strokeWidth={1.2} strokeDasharray="3 5" />

        {/* cone surface — faint generators from Earth to the top circle */}
        {Array.from({ length: 24 }, (_, k) => {
          const t = (k / 24) * TAU;
          const [ex, ey] = [CX + circRX * Math.cos(t), topCY + circRY * Math.sin(t)];
          return <line key={k} x1={CX} y1={CY} x2={ex} y2={ey} stroke="color-mix(in srgb, var(--tm-teal) 12%, transparent)" strokeWidth={1} />;
        })}

        {/* equinox line in the ecliptic plane (red) — behind Earth */}
        <line x1={eqEnd2[0]} y1={eqEnd2[1]} x2={eqEnd[0]} y2={eqEnd[1]} stroke="var(--tm-amber)" strokeWidth={2.4} markerEnd="url(#pc-arrow)" />

        {/* spin axis through Earth (bright) — behind Earth, poles poke out */}
        <line x1={botEnd[0]} y1={botEnd[1]} x2={topEnd[0]} y2={topEnd[1]} stroke="var(--tm-ink)" strokeWidth={2.6} />

        {/* equator ring back half */}
        <polyline points={ring.back.join(" ")} fill="none" stroke="color-mix(in srgb, var(--tm-teal) 60%, transparent)" strokeWidth={1.4} strokeDasharray="3 4" />

        {/* Earth */}
        <g transform={`translate(${CX} ${CY})`}>
          <EarthGlobeImage cx={0} cy={0} r={EARTH_R} glow glowClassName="ho-earth-glow" glowPad={8} />
        </g>

        {/* equator ring front half */}
        <polyline points={ring.front.join(" ")} fill="none" stroke="var(--tm-teal)" strokeWidth={1.8} />

        {/* top precession circle (north pole path) — drawn after, sits above */}
        <ellipse cx={CX} cy={topCY} rx={circRX} ry={circRY} fill="none" stroke="var(--tm-gold)" strokeWidth={1.8} />

        {/* pole-star markers on the top circle. The circle is vertically squashed,
            so labels are fanned out onto a taller "label ellipse" (and anchored
            left/right by side) with a thin leader line, to avoid overlap. */}
        {POLE_STARS.map((s) => {
          const [mx, my] = proj(LA * SE * Math.cos(s.phi), LA * CE, LA * SE * Math.sin(s.phi));
          const isNow = s === nearStar;
          const lx = CX + circRX * 1.6 * Math.cos(s.phi);
          const ly = topCY - 82 * Math.sin(s.phi);
          const onRight = Math.cos(s.phi) >= 0;
          return (
            <g key={s.ne}>
              <line x1={mx} y1={my} x2={lx} y2={ly} stroke="var(--tm-ink-faint)" strokeWidth={0.8} opacity={0.7} />
              <circle cx={mx} cy={my} r={isNow ? 4 : 2.6} fill={isNow ? "var(--tm-gold)" : "var(--tm-ink-dim)"} stroke="var(--tm-card)" strokeWidth={1} />
              <text x={lx + (onRight ? 5 : -5)} y={ly} fill={isNow ? "var(--tm-gold)" : "var(--tm-ink-dim)"} textAnchor={onRight ? "start" : "end"} dominantBaseline="central" style={{ font: `${isNow ? 700 : 500} ${isNow ? 10.5 : 9.5}px var(--pn-font)` }}>
                {s.ne}
              </text>
            </g>
          );
        })}

        {/* current north pole position */}
        <circle cx={topEnd[0]} cy={topEnd[1]} r={5.5} fill="var(--tm-amber)" stroke="var(--tm-card)" strokeWidth={1.5} />
        <text x={topEnd[0]} y={topEnd[1] + 116} fill="var(--tm-amber)" textAnchor="middle" style={{ font: "700 10px var(--pn-font)" }}>
          उत्तर ध्रुव
        </text>

        {/* equinox label */}
        <text x={eqEnd[0]} y={eqEnd[1] - 8} fill="var(--tm-amber)" textAnchor="middle" style={{ font: "700 11px var(--pn-font)" }}>
          विषुव → {eqRashi}
        </text>

        {/* cycle caption inside the scene */}
        <text x={26} y={VB.H - 40} fill="var(--tm-ink-dim)" style={{ font: "600 15px var(--pn-font)" }}>
          एक चक्र
        </text>
        <text x={26} y={VB.H - 18} fill="var(--tm-gold)" style={{ font: "700 20px var(--pn-num)" }}>
          {N("26,000")} वर्ष
        </text>

        {/* legend */}
        <g transform="translate(516 22)">
          <line x1={0} y1={6} x2={20} y2={6} stroke="var(--tm-ink)" strokeWidth={2.6} />
          <text x={26} y={6} fill="var(--tm-ink-dim)" dominantBaseline="central" style={{ font: "500 10.5px var(--pn-font)" }}>अक्ष (२३.५°)</text>
          <line x1={0} y1={24} x2={20} y2={24} stroke="var(--tm-ink-faint)" strokeWidth={1.4} strokeDasharray="3 4" />
          <text x={26} y={24} fill="var(--tm-ink-dim)" dominantBaseline="central" style={{ font: "500 10.5px var(--pn-font)" }}>क्रान्तिवृत्त ध्रुव</text>
          <line x1={0} y1={42} x2={20} y2={42} stroke="var(--tm-gold)" strokeWidth={2.2} />
          <text x={26} y={42} fill="var(--tm-ink-dim)" dominantBaseline="central" style={{ font: "500 10.5px var(--pn-font)" }}>ध्रुव-पथ</text>
          <line x1={0} y1={60} x2={20} y2={60} stroke="var(--tm-amber)" strokeWidth={2.4} markerEnd="url(#pc-arrow)" />
          <text x={26} y={60} fill="var(--tm-ink-dim)" dominantBaseline="central" style={{ font: "500 10.5px var(--pn-font)" }}>विषुव रेखा</text>
        </g>
      </svg>

      <div className={edControls}>
        <div className={edReadout}>
          <div className={edRo}>
            <span className={edRoK}>वर्ष</span>
            <span className={edRoV({ mono: true })}>{fmtYear(year)}</span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>ध्रुव तारा</span>
            <span className={edRoV({ amber: true })}>{nearStar.ne}</span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>विषुव → राशि</span>
            <span className={edRoV()}>{eqRashi}</span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>अक्ष झुकाव</span>
            <span className={edRoV({ mono: true })}>{N("23.5")}°</span>
          </div>
        </div>

        <div className={motSliderRow}>
          <span className={motSliderLabel}>↻ अयन चलन — एक पूरा चक्र = {N("26,000")} वर्ष</span>
          <div className={edScrubWrap}>
            <button
              type="button"
              className={edPlayBtn}
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
              max={TAU}
              step={0.005}
              value={phi}
              style={{ "--fill": `${(phi / TAU) * 100}%` } as React.CSSProperties}
              onChange={(e) => {
                setPlaying(false);
                setPhi(+e.target.value);
              }}
            />
          </div>
        </div>

        <div className={edPresets}>
          {POLE_STARS.map((s) => (
            <button
              key={s.ne}
              type="button"
              className={edPreset(s === nearStar)}
              onClick={() => { setPlaying(false); setPhi(s.phi); }}
            >
              {s.ne} · {fmtYear(s.bs)}
            </button>
          ))}
        </div>
      </div>

      <p className={tmCardCap}>
        पृथ्वीको अक्ष <b>{N("23.5")}°</b> झुकेरै रहन्छ तर लठ्ठाझैँ <span className="hl">क्रान्तिवृत्त ध्रुव</span>{" "}
        वरिपरि बिस्तारै घुम्छ — पूरा एक फेरो <b>~{N("26,000")} वर्ष</b>। त्यसैले उत्तर ध्रुवले
        फरक-फरक <span className="hl-amber">ध्रुव तारा</span> देखाउँछ — कुनै बेला थुबन, अहिले ध्रुव, र
        ~१३,७८४ बि.सं. मा अभिजित। ऋतु-आधारित <span className="hl-amber">विषुव रेखा</span> राशिचक्रमा
        घुम्दै जान्छ — यही{" "}
        <b>अयन चलन</b> ले माथिको अयनांश खाँडो बढाउँछ।
      </p>
    </div>
  );
}
