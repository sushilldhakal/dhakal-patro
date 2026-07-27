import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { patroMono } from "@/lib/patro-classes";
import { edScrub } from "@/lib/diagram-classes";
import { motSliderLabel, motSliderRow, tmCardCap, tmCardPadLg, edControls, edPlayBtn, edPresets, edPreset, edReadout, edRo, edRoK, edRoV, edScrubWrap, edSvg } from "@/lib/learn-classes";
import { Pause, Play } from "lucide-react";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { getRashiList } from "@/lib/rashi-i18n";
import { RashiGlyph } from "./rashi-icons";

/**
 * अयन चलन — how the *tropical* spring-equinox point (सायन ०°, "Point 0") slowly
 * regresses through the FIXED *sidereal* zodiac (निरयन राशि), and why that is the
 * real reason the ऋतु drift against the बि.सं. months.
 *
 * The scene is a pseudo-3D view of the ecliptic plane seen from slightly above:
 *   • a tilted ring of the 12 sidereal राशि (FIXED — anchored to the stars)
 *   • the yellow ecliptic circle (the राशि plane, z = 0)
 *   • the blue celestial equator — the same circle tilted by the obliquity ε
 *     (≈ 23°26′) about the equinox line, so the two cross exactly at the equinoxes
 *   • Earth at the centre with its tilted N–S axis
 *   • the red विषुव/अयनान्त cross (Spring/Fall equinox + Summer/Winter solstice)
 *
 * The cross + equator rotate with the year slider (बि.सं. ० → +26,000) at the
 * precession rate (≈ 50.29″/yr ≈ 1° / 72 yr); the राशि ring stays put. Watch the
 * spring equinox slide from राशि to राशि — one full lap ≈ 25,772 years.
 */

const N = toNepaliDigits;
const TAU = Math.PI * 2;
const D2R = Math.PI / 180;

/* precession rate, degrees / year (≈ 50.2879″) */
const RATE = 50.2879 / 3600;
/* obliquity of the ecliptic (axial tilt) */
const EPS = 23.4367;
/* one full precession lap (years) */
const CYCLE = Math.round(360 / RATE); // ≈ 25,772
/* बि.सं. year where Lahiri ayanāṁśa = 0 (≈ 285 CE) → equinox at मेष ०° */
const BS_AYAN_ZERO = 342;
/* slider runs from the very start of बि.सं. to one full lap later */
const Y_MIN = 0;
const Y_MAX = CYCLE;

const RASHI_NE = getRashiList("ne");
const RASHI_EN = getRashiList("en");

const rashiIndex = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / 30);
const norm360 = (a: number) => ((a % 360) + 360) % 360;
const fmtDeg = (a: number) => `${N(Math.floor(a))}°${N(String(Math.round((a - Math.floor(a)) * 60)).padStart(2, "0"))}′`;

/* ---- geometry ---------------------------------------------------------- */
const VB = { W: 900, H: 560 };
const CX = 450;
const CY = 268;
const RX = 300; // ecliptic horizontal radius
const RY = 134; // ecliptic vertical radius (perspective squash)
const ZY = 104; // screen rise per unit of ecliptic-north (out-of-plane)

/** in-plane angle (deg): sidereal longitude λ → screen direction (मेष ०° at top). */
const alphaOf = (lonSid: number) => lonSid + 90;

/** project an ecliptic-plane direction (z = 0) at in-plane angle α, scaled by f. */
function projPlane(alphaDeg: number, f: number): [number, number] {
  const a = alphaDeg * D2R;
  return [CX + RX * f * Math.cos(a), CY - RY * f * Math.sin(a)];
}

/** project a full 3-vector (unit-ish) to screen. +z = ecliptic north (up). */
function proj3(x: number, y: number, z: number, f = 1): [number, number] {
  return [CX + RX * f * x, CY - RY * f * y - ZY * f * z];
}
const fmtPt = (p: [number, number]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

const CARDINALS = [
  { ne: "वसन्त विषुव", en: "Spring Equinox", point0: true },
  { ne: "ग्रीष्म अयनान्त", en: "Summer Solstice", point0: false },
  { ne: "शरद् विषुव", en: "Fall Equinox", point0: false },
  { ne: "हेमन्त अयनान्त", en: "Winter Solstice", point0: false },
] as const;

export function EquinoxPrecession() {
  const nowBs = new Date().getFullYear() + 57; // ≈ current बि.सं.
  const [year, setYear] = useState(nowBs);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setYear((y) => {
        const next = y + dt * 320; // ~320 बि.सं. years / second
        return next > Y_MAX ? Y_MIN : next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const model = useMemo(() => {
    // sidereal longitude of the spring equinox at this बि.सं. year
    const eqSid = norm360((BS_AYAN_ZERO - year) * RATE);
    const ayanamsha = (year - BS_AYAN_ZERO) * RATE; // shift from मेष ०°
    const sinceBs0 = year * RATE; // shift since बि.सं. ०
    const alphaEq = alphaOf(eqSid);

    // celestial equator polyline: ecliptic circle tilted by ε about the equinox axis
    const ce = Math.cos(EPS * D2R);
    const se = Math.sin(EPS * D2R);
    const aEqR = alphaEq * D2R;
    const cAeq = Math.cos(aEqR);
    const sAeq = Math.sin(aEqR);
    const eqPoint = (phiDeg: number): [number, number, number] => {
      const a = (alphaEq + phiDeg) * D2R;
      const cphi = Math.cos(phiDeg * D2R);
      const sphi = Math.sin(phiDeg * D2R);
      return [
        Math.cos(a) * ce + cAeq * cphi * (1 - ce),
        Math.sin(a) * ce + sAeq * cphi * (1 - ce),
        sphi * se,
      ];
    };
    const equatorPath = Array.from({ length: 73 }, (_, k) => {
      const [x, y, z] = eqPoint(k * 5);
      return `${k === 0 ? "M" : "L"}${fmtPt(proj3(x, y, z))}`;
    }).join(" ");

    // Earth's axis (celestial north pole) = ecliptic north tilted ε about equinox axis
    const poleVec: [number, number, number] = [sAeq * se, -cAeq * se, ce];

    return { eqSid, ayanamsha, sinceBs0, alphaEq, equatorPath, poleVec };
  }, [year]);

  const eqRashiNe = RASHI_NE[rashiIndex(model.eqSid)];
  const eqRashiEn = RASHI_EN[rashiIndex(model.eqSid)];

  const amber = "var(--tm-amber)";
  const gold = "var(--tm-gold)";
  const dim = "var(--tm-ink-dim)";
  const faint = "var(--tm-ink-faint)";
  const card = "var(--tm-card)";
  const red = "#e0483b";

  const bandOuter = 1.30;
  const bandInner = 0.92;
  const ICON = 40;
  const sun = projPlane(model.alphaEq, bandInner);
  const solsticeEcl = projPlane(model.alphaEq + 90, 1);
  const solsticeEqu = proj3(...((): [number, number, number] => {
    const a = (model.alphaEq + 90) * D2R;
    const ce = Math.cos(EPS * D2R), se = Math.sin(EPS * D2R);
    return [Math.cos(a) * ce, Math.sin(a) * ce, se];
  })());
  const [pnX, pnY] = proj3(...model.poleVec, 0.42);
  const [psX, psY] = proj3(-model.poleVec[0], -model.poleVec[1], -model.poleVec[2], 0.42);

  return (
    <div className={tmCardPadLg}>
      <svg viewBox={`0 0 ${VB.W} ${VB.H}`} className={edSvg()} role="img" aria-label="अयन चलन — विषुव सर्ने चित्र">
        <defs>
          <radialGradient id="ep-earth" cx="42%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#bfe3ff" />
            <stop offset="45%" stopColor="#3f86c4" />
            <stop offset="100%" stopColor="#123c5e" />
          </radialGradient>
          <radialGradient id="ep-sun" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#fff6d8" />
            <stop offset="55%" stopColor="#ffd24a" />
            <stop offset="100%" stopColor="#f08a1d" />
          </radialGradient>
        </defs>

        {/* ── zodiac band (FIXED sidereal राशि) ── */}
        <ellipse cx={CX} cy={CY} rx={RX * bandOuter} ry={RY * bandOuter} fill="color-mix(in srgb, var(--tm-teal) 14%, var(--tm-card))" stroke="var(--tm-border)" strokeWidth={1} />
        <ellipse cx={CX} cy={CY} rx={RX * bandInner} ry={RY * bandInner} fill={card} stroke="var(--tm-border)" strokeWidth={1} />
        {RASHI_NE.map((name, i) => {
          const a0 = i * 30;
          const [ix, iy] = projPlane(alphaOf(a0), bandInner);
          const [ox, oy] = projPlane(alphaOf(a0), bandOuter);
          const [lx, ly] = projPlane(alphaOf(a0 + 15), (bandInner + bandOuter) / 2);
          const here = i === rashiIndex(model.eqSid);
          const col = here ? amber : dim;
          return (
            <g key={name}>
              <line x1={ix} y1={iy} x2={ox} y2={oy} stroke="var(--tm-border)" strokeWidth={1} />
              <RashiGlyph index={i} size={ICON} cx={lx} cy={ly - 11} color={col} opacity={here ? 1 : 0.85} title={name} />
              <text x={lx} y={ly + 19} fill={col} textAnchor="middle" dominantBaseline="central"
                style={{ font: `${here ? 700 : 600} 12.5px var(--pn-font)` }}>
                {name}
              </text>
            </g>
          );
        })}

        {/* ── yellow ecliptic (राशि plane) ── */}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke={gold} strokeWidth={2.4} />
        {/* ── blue celestial equator (tilted by ε) ── */}
        <path d={model.equatorPath} fill="none" stroke="#3f86c4" strokeWidth={2.4} />

        {/* ── red विषुव / अयनान्त cross (rotates with precession) ── */}
        {[0, 1].map((d) => {
          const a = model.alphaEq + d * 90;
          const [x1, y1] = projPlane(a, bandOuter);
          const [x2, y2] = projPlane(a + 180, bandOuter);
          return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} stroke={red} strokeWidth={1.8} strokeDasharray="3 5" strokeLinecap="round" />;
        })}
        {CARDINALS.map((c, k) => {
          const [lx, ly] = projPlane(model.alphaEq + k * 90, bandOuter + 0.13);
          return (
            <g key={c.en}>
              <text x={lx} y={ly - 5} fill={red} textAnchor="middle" dominantBaseline="central" style={{ font: "700 11.5px var(--pn-font)" }}>
                {c.ne}
              </text>
              <text x={lx} y={ly + 8} fill={dim} textAnchor="middle" dominantBaseline="central" style={{ font: "500 9.5px var(--pn-font)" }}>
                {c.point0 ? "Point 0" : c.en}
              </text>
            </g>
          );
        })}

        {/* obliquity ε marker at the solstice colure */}
        <line x1={solsticeEcl[0]} y1={solsticeEcl[1]} x2={solsticeEqu[0]} y2={solsticeEqu[1]} stroke={faint} strokeWidth={1.2} />
        <text x={(solsticeEcl[0] + solsticeEqu[0]) / 2 + 8} y={(solsticeEcl[1] + solsticeEqu[1]) / 2} fill={dim} dominantBaseline="central" style={{ font: "600 11px var(--pn-num)" }}>
          ε {fmtDeg(EPS)}
        </text>

        {/* Earth + tilted axis */}
        <line x1={psX} y1={psY} x2={pnX} y2={pnY} stroke={dim} strokeWidth={1.6} />
        <text x={pnX} y={pnY - 8} fill={dim} textAnchor="middle" style={{ font: "700 11px var(--pn-font)" }}>N</text>
        <text x={psX} y={psY + 14} fill={dim} textAnchor="middle" style={{ font: "700 11px var(--pn-font)" }}>S</text>
        <circle cx={CX} cy={CY} r={17} fill="url(#ep-earth)" stroke="#0e2e49" strokeWidth={1} />

        {/* Sun glyph at the spring equinox */}
        <g transform={`translate(${sun[0].toFixed(1)} ${sun[1].toFixed(1)})`}>
          <circle r={9} fill="url(#ep-sun)" />
          {Array.from({ length: 8 }, (_, k) => {
            const a = (k / 8) * TAU;
            return <line key={k} x1={11 * Math.cos(a)} y1={11 * Math.sin(a)} x2={15 * Math.cos(a)} y2={15 * Math.sin(a)} stroke="#f0a81d" strokeWidth={1.5} strokeLinecap="round" />;
          })}
        </g>

        {/* legend */}
        <g transform="translate(14 14)">
          <line x1={0} y1={6} x2={22} y2={6} stroke={gold} strokeWidth={2.4} />
          <text x={28} y={6} fill={dim} dominantBaseline="central" style={{ font: "500 11px var(--pn-font)" }}>क्रान्तिवृत्त (Ecliptic)</text>
          <line x1={0} y1={24} x2={22} y2={24} stroke="#3f86c4" strokeWidth={2.4} />
          <text x={28} y={24} fill={dim} dominantBaseline="central" style={{ font: "500 11px var(--pn-font)" }}>खगोलीय विषुवत् (Celestial Equator)</text>
        </g>
      </svg>

      <div className={edControls}>
        <div className={edReadout}>
          <div className={edRo}>
            <span className={edRoK}>वर्ष</span>
            <span className={edRoV({ mono: true })}>{N(Math.round(year))} बि.सं.</span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>विषुव अहिले</span>
            <span className={edRoV({ amber: true })}>{eqRashiNe} <span className={cn(patroMono)} style={{ fontSize: "0.85em" }}>{eqRashiEn}</span></span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>विषुव सरेको (बि.सं. ० देखि)</span>
            <span className={edRoV({ mono: true, amber: true })}>{fmtDeg(model.sinceBs0)}</span>
          </div>
          <div className={edRo}>
            <span className={edRoK}>अयनांश (मेष ०° बाट)</span>
            <span className={edRoV({ mono: true })}>{model.ayanamsha < 0 ? `−${fmtDeg(-model.ayanamsha)}` : fmtDeg(model.ayanamsha)}</span>
          </div>
        </div>

        <div className={motSliderRow}>
          <span className={motSliderLabel}>
            वर्ष — अक्ष-चलनले विषुव सर्छ (बि.सं. {N(Y_MIN)} → {N(Y_MAX)}; एक पूरा फेरो ~{N(CYCLE)} वर्ष)
          </span>
          <div className={edScrubWrap}>
            <button type="button" className={edPlayBtn} onClick={() => setPlaying((p) => !p)}
              title={playing ? "रोक्नुहोस्" : "चलाउनुहोस्"} aria-label={playing ? "रोक्नुहोस्" : "चलाउनुहोस्"}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <input className={edScrub} type="range" min={Y_MIN} max={Y_MAX} step={1} value={Math.round(year)}
              style={{ "--fill": `${((year - Y_MIN) / (Y_MAX - Y_MIN)) * 100}%` } as React.CSSProperties}
              onChange={(e) => { setPlaying(false); setYear(+e.target.value); }} />
          </div>
        </div>

        <div className={edPresets}>
          <button type="button" className={edPreset()} onClick={() => { setPlaying(false); setYear(0); }}>बि.सं. आरम्भ</button>
          <button type="button" className={edPreset()} onClick={() => { setPlaying(false); setYear(nowBs); }}>↺ अहिले</button>
        </div>
      </div>

      <p className={tmCardCap}>
        बाहिरी <b>१२ राशि</b> ताराका सापेक्ष <span className={cn("hl")}>स्थिर</span> छन् (निरयन)। पृथ्वीको अक्ष लट्टू
        झैँ घुम्दा <span className={cn("hl-amber")}>वसन्त-विषुव (Point 0)</span> बिस्तारै राशिचक्रमा पछाडि सर्छ —
        प्रति ~{N(72)} वर्षमा १°। त्यसैले आज विषुव <b>{eqRashiNe}</b> मा छ, अनि सायन ऋतु निरयन महिनासँग
        बिस्तारै फरक पर्दै जान्छ।
      </p>
    </div>
  );
}
