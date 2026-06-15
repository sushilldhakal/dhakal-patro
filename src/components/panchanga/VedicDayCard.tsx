import { useEffect, useRef, useState } from "react";

const D = Math.PI / 180;

// Hora sequence (Chaldean): Sun Venus Mercury Moon Saturn Jupiter Mars
const HORA = [
  { ne: "रवि",   sh: "र॰", color: "#f9c800", lt: "#fff8c0", dk: "#b87800" },
  { ne: "शुक्र", sh: "शु",  color: "#52c87a", lt: "#a0f0c0", dk: "#207840" },
  { ne: "बुध",   sh: "बु",  color: "#d4a060", lt: "#f0d8a0", dk: "#885820" },
  { ne: "सोम",   sh: "सो",  color: "#90b8d8", lt: "#c8e8f8", dk: "#3858a0" },
  { ne: "शनि",   sh: "श॰",  color: "#6878a0", lt: "#a0a8c8", dk: "#2a3860" },
  { ne: "गुरु",  sh: "गु",  color: "#4890d0", lt: "#88c8f0", dk: "#1850a0" },
  { ne: "मङ्गल", sh: "म॰",  color: "#e05530", lt: "#f09070", dk: "#801010" },
] as const;

const WD_START = [0, 3, 6, 2, 5, 1, 4] as const;
const WD_NE    = ["आइत", "सोम", "मङ्ग", "बुध", "बिहि", "शुक्र", "शनि"] as const;
const WD_FULL  = ["आइतबार", "सोमबार", "मङ्गलबार", "बुधबार", "बिहिबार", "शुक्रबार", "शनिबार"] as const;

// Layout: rings centred at (CX, CY) inside a 360×345 canvas
const CX = 148, CY = 172;
const R0 = 32, RW = 13, RG = 2; // innermost ring inner-r, ring width, gap

function rI(k: number) { return R0 + k * (RW + RG); }
function rO(k: number) { return rI(k) + RW; }

// Civil hour 0-23 → SVG angle; hour 6 (sunrise) maps to top (−π/2)
function hAng(h: number) { return (h * 15 - 180) * D; }

function arcPath(r1: number, r2: number, a1: number, a2: number): string {
  const [c1, s1, c2, s2] = [Math.cos(a1), Math.sin(a1), Math.cos(a2), Math.sin(a2)];
  const lg = +(a2 - a1 > Math.PI);
  return (
    `M${CX+r1*c1},${CY+r1*s1}` +
    `L${CX+r2*c1},${CY+r2*s1}` +
    `A${r2},${r2},0,${lg},1,${CX+r2*c2},${CY+r2*s2}` +
    `L${CX+r1*c2},${CY+r1*s2}` +
    `A${r1},${r1},0,${lg},0,${CX+r1*c1},${CY+r1*s1}Z`
  );
}

export function VedicDayCard() {
  const [nowH, setNowH] = useState(() => {
    const n = new Date();
    return n.getHours() + n.getMinutes() / 60 + n.getSeconds() / 3600;
  });
  const raf = useRef<number>(0);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setNowH(n.getHours() + n.getMinutes() / 60 + n.getSeconds() / 3600);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const today   = new Date();
  const todayWd = today.getDay();
  const curH    = Math.floor(nowH);
  const needleA = hAng(nowH);
  const outerR  = rO(6); // = 32 + 6*15 + 13 = 135

  // 7 rings: k=0 oldest (innermost), k=6 today (outermost)
  const rings = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - k));
    return { wd: d.getDay(), isToday: k === 6 };
  });

  const curPlanet   = HORA[(WD_START[todayWd]! + curH) % 7]!;
  const labelX      = CX + outerR + 12;       // right of outermost ring
  const needleEndR  = outerR + 18;

  // Sun icon position helpers (top = sunrise, bottom = sunset)
  const sunY_top = CY - outerR - 18;
  const sunY_bot = CY + outerR + 18;

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
          होरा चक्र
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className="font-bold text-base leading-tight">ग्रह–होरा चक्र</h3>
          <span className="text-xs text-muted-foreground">{WD_FULL[todayWd]}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          अहिले:{" "}
          <b style={{ color: curPlanet.color }}>{curPlanet.ne} होरा</b>
          {" "}(घण्टा {curH}–{curH + 1})
        </p>
      </div>

      {/* Wheel — responsive, full-width */}
      <div className="w-full">
        <svg
          viewBox="0 0 360 345"
          style={{ width: "100%", display: "block" }}
          aria-label="ग्रह होरा चक्र"
        >
          {/* Full dark background */}
          <rect width="360" height="345" fill="#080f1e" />

          <defs>
            {HORA.map((p, i) => (
              <radialGradient key={i} id={`vhg${i}`} cx="34%" cy="28%" r="66%">
                <stop offset="0%"   stopColor={p.lt} />
                <stop offset="55%"  stopColor={p.color} />
                <stop offset="100%" stopColor={p.dk} />
              </radialGradient>
            ))}
            <filter id="vglow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="vglow-sm" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="1.5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Faint stars */}
          {Array.from({ length: 22 }, (_, i) => {
            const a = (i / 22) * 2 * Math.PI + i * 0.5;
            const r = outerR + 10 + (i % 4) * 4;
            return (
              <circle
                key={i}
                cx={CX + r * Math.cos(a)} cy={CY + r * Math.sin(a)}
                r={i % 5 === 0 ? 1.3 : 0.7}
                fill="#fff" opacity={0.1 + (i % 3) * 0.1}
              />
            );
          })}

          {/* === RINGS === */}
          {rings.map((ring, k) => {
            const ri = rI(k), ro = rO(k);
            const base = WD_START[ring.wd]!;
            const isToday = ring.isToday;

            return (
              <g key={k}>
                {Array.from({ length: 24 }, (_, h) => {
                  const pi = (base + h) % 7;
                  const p = HORA[pi]!;
                  const a1 = hAng(h) + 0.6 * D;
                  const a2 = hAng(h + 1) - 0.6 * D;
                  const isCurHora = isToday && h === curH;
                  const isPast    = isToday && h < curH;
                  const opacity   = isCurHora ? 1 : isPast ? 0.28 : isToday ? 0.82 : 0.22 + k * 0.08;

                  // midpoint of this segment for labelling
                  const midA = hAng(h) + 7.5 * D;
                  const midRk = (ri + ro) / 2;
                  const tx = CX + midRk * Math.cos(midA);
                  const ty = CY + midRk * Math.sin(midA);
                  // text rotation: tangent to arc, flipped in bottom half
                  const tDeg = midA / D + 90;
                  const flip = midA > 0 && midA < Math.PI;

                  return (
                    <g key={h}>
                      <path
                        d={arcPath(ri, ro, a1, a2)}
                        fill={isCurHora ? p.lt : p.color}
                        opacity={opacity}
                      />
                      {/* Planet abbreviation inside TODAY's ring */}
                      {isToday && (
                        <text
                          x={tx} y={ty}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="5.5"
                          fontWeight={isCurHora ? "700" : "400"}
                          fill={isCurHora ? "#080f1e" : "rgba(255,255,255,0.7)"}
                          transform={`rotate(${flip ? tDeg + 180 : tDeg} ${tx} ${ty})`}
                        >
                          {p.sh}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Ring divider */}
                <circle cx={CX} cy={CY} r={ri} fill="none" stroke="#080f1e" strokeWidth="1.5" />

                {/* Today's ring: bright highlight border */}
                {isToday && (
                  <circle cx={CX} cy={CY} r={ro} fill="none"
                    stroke="#ffffff60" strokeWidth="1" />
                )}
              </g>
            );
          })}

          {/* Outer ring border */}
          <circle cx={CX} cy={CY} r={outerR} fill="none" stroke="#080f1e" strokeWidth="1.5" />

          {/* === CENTER: current hora info === */}
          <circle cx={CX} cy={CY} r={R0 - 2} fill="#0d1a30" />
          <circle cx={CX} cy={CY} r={R0 - 2} fill="none" stroke="#ffffff18" strokeWidth="0.8" />
          {/* Planet sphere icon */}
          <circle cx={CX} cy={CY - 10} r={8} fill={`url(#vhg${(WD_START[todayWd]! + curH) % 7})`} filter="url(#vglow-sm)" />
          <circle cx={CX - 2} cy={CY - 12} r={2.5} fill={curPlanet.lt} opacity="0.45" />
          {/* Planet name */}
          <text x={CX} y={CY + 6} textAnchor="middle" fontSize="7" fontWeight="700" fill="#ffffffee">
            {curPlanet.ne}
          </text>

          {/* === SUN markers === */}
          {/* Sunrise (top) */}
          <circle cx={CX} cy={sunY_top} r={10} fill="url(#vhg0)" filter="url(#vglow-sm)" />
          <circle cx={CX - 3} cy={sunY_top - 3} r={3} fill="#fff8c0" opacity="0.5" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * 2 * Math.PI;
            return (
              <line key={i}
                x1={CX + 12 * Math.cos(a)} y1={sunY_top + 12 * Math.sin(a)}
                x2={CX + 17 * Math.cos(a)} y2={sunY_top + 17 * Math.sin(a)}
                stroke="#f9c800" strokeWidth="1.4" strokeLinecap="round" opacity="0.75"
              />
            );
          })}
          <text x={CX} y={sunY_top - 22} textAnchor="middle" fontSize="8" fontWeight="700" fill="#f9c800">
            सूर्योदय
          </text>

          {/* Sunset (bottom) */}
          <circle cx={CX} cy={sunY_bot} r={10} fill="url(#vhg0)" opacity="0.55" filter="url(#vglow-sm)" />
          <text x={CX} y={sunY_bot + 22} textAnchor="middle" fontSize="8" fontWeight="700" fill="#e08040">
            सूर्यास्त
          </text>

          {/* Noon / midnight hints */}
          <text x={CX + outerR + 6} y={CY + 4} fontSize="7" fill="#ffffff35">मध्याह्न</text>
          <text x={CX - outerR - 5} y={CY + 4} textAnchor="end" fontSize="7" fill="#ffffff20">अर्धरात्रि</text>

          {/* === DAY LABELS on right === */}
          {rings.map((ring, k) => {
            // Connect from right-side midpoint of ring to staggered label
            const mr = (rI(k) + rO(k)) / 2;
            const lx = labelX;
            const ly = CY - 48 + k * 16;
            const isToday = ring.isToday;
            return (
              <g key={`dl${k}`}>
                <line
                  x1={CX + mr} y1={CY}
                  x2={lx - 4} y2={ly + 4}
                  stroke={isToday ? "#ffffff90" : "#ffffff22"}
                  strokeWidth={isToday ? 0.9 : 0.5}
                />
                <text
                  x={lx} y={ly + 8}
                  fontSize={isToday ? 10.5 : 8}
                  fontWeight={isToday ? "700" : "400"}
                  fill={isToday ? "#ffffffee" : "#ffffff45"}
                >
                  {WD_NE[ring.wd]}
                </text>
              </g>
            );
          })}

          {/* === Planet legend (right side, below day labels) === */}
          {HORA.map((p, i) => {
            const lx = labelX;
            const ly = CY + 60 + i * 20;
            return (
              <g key={`hl${i}`}>
                <circle cx={lx + 6} cy={ly} r={6} fill={`url(#vhg${i})`} />
                <circle cx={lx + 4} cy={ly - 2} r={2} fill={p.lt} opacity="0.45" />
                <text x={lx + 16} y={ly + 4} fontSize="8.5" fill="#ffffffcc">
                  {p.ne}
                </text>
              </g>
            );
          })}

          {/* === Time needle === */}
          <line
            x1={CX} y1={CY}
            x2={CX + needleEndR * Math.cos(needleA)}
            y2={CY + needleEndR * Math.sin(needleA)}
            stroke="#ffffff"
            strokeWidth="1.3"
            strokeDasharray="4 3"
            filter="url(#vglow)"
            opacity="0.85"
          />
          {/* Needle tip dot */}
          <circle
            cx={CX + needleEndR * Math.cos(needleA)}
            cy={CY + needleEndR * Math.sin(needleA)}
            r="3" fill={curPlanet.color} opacity="0.95"
          />
          {/* Center hub */}
          <circle cx={CX} cy={CY} r={R0 - 2} fill="none" />
          <circle cx={CX} cy={CY} r="3.5" fill="#fff" opacity="0.9" />
          <circle cx={CX} cy={CY} r="1.5" fill="#080f1e" />
        </svg>
      </div>

      {/* Footer: explanation */}
      <div className="px-4 pb-4 pt-1 text-[11px] text-muted-foreground border-t border-border flex flex-wrap gap-x-4 gap-y-1">
        <span>● सफेद रेखा = अहिलेको समय</span>
        <span>● बाहिरी रिङ = आज ({WD_FULL[todayWd]})</span>
        <span>● माथि = सूर्योदय · तल = सूर्यास्त</span>
      </div>
    </div>
  );
}
