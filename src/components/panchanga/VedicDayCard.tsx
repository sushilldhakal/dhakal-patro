import { useEffect, useRef, useState } from "react";

const TWO_PI = Math.PI * 2;
const D = Math.PI / 180;

// Hora sequence (Chaldean order): Sun Venus Mercury Moon Saturn Jupiter Mars
const HP = [
  { ne: "रवि",    color: "#f9c800", lt: "#fff5c0", dk: "#c87800", mk: "#ffee80" },
  { ne: "शुक्र",  color: "#52c87a", lt: "#a0f0c0", dk: "#207840", mk: "#80f0a0" },
  { ne: "बुध",    color: "#d4a060", lt: "#f0d8a0", dk: "#885820", mk: "#e8c898" },
  { ne: "सोम",    color: "#a8c8e8", lt: "#d8eef8", dk: "#5878a0", mk: "#c8e8f8" },
  { ne: "शनि",    color: "#7888a8", lt: "#b0b8d0", dk: "#3a4860", mk: "#9aa8c8" },
  { ne: "गुरु",   color: "#4898d0", lt: "#90c8f0", dk: "#1850a0", mk: "#70b8f0" },
  { ne: "मङ्गल",  color: "#e05530", lt: "#f0a080", dk: "#901010", mk: "#f07850" },
] as const;

// Weekday (0=Sun..6=Sat) → starting index into HP
const WD_START = [0, 3, 6, 2, 5, 1, 4] as const;
const WD_NE    = ["आइत", "सोम", "मङ्गल", "बुध", "बिहि", "शुक्र", "शनि"] as const;

// Layout
const CX = 190, CY = 215;
const RW = 17, RG = 3, R0 = 50; // ring width, gap, first-ring inner radius

function rI(k: number) { return R0 + k * (RW + RG); }
function rO(k: number) { return rI(k) + RW; }

// Civil hour 0-23 → SVG angle; 6am=top(-π/2), noon=right(0), 6pm=bottom(+π/2), midnight=left(π)
function hAng(h: number) { return ((h * 15) - 180) * D; }

function arc(r1: number, r2: number, a1: number, a2: number): string {
  const cos1 = Math.cos(a1), sin1 = Math.sin(a1);
  const cos2 = Math.cos(a2), sin2 = Math.sin(a2);
  const lg = a2 - a1 > Math.PI ? 1 : 0;
  return [
    `M${CX + r1 * cos1},${CY + r1 * sin1}`,
    `L${CX + r2 * cos1},${CY + r2 * sin1}`,
    `A${r2},${r2},0,${lg},1,${CX + r2 * cos2},${CY + r2 * sin2}`,
    `L${CX + r1 * cos2},${CY + r1 * sin2}`,
    `A${r1},${r1},0,${lg},0,${CX + r1 * cos1},${CY + r1 * sin1}Z`,
  ].join(" ");
}

export function VedicDayCard() {
  const [nowH, setNowH] = useState(() => {
    const n = new Date();
    return n.getHours() + n.getMinutes() / 60 + n.getSeconds() / 3600;
  });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setNowH(n.getHours() + n.getMinutes() / 60 + n.getSeconds() / 3600);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const today = new Date();
  const curHour = Math.floor(nowH);
  const needleAngle = hAng(nowH);
  const outerR = rO(6); // outermost ring outer radius

  // 7 rings: k=0 is 6 days ago, k=6 is today (outermost)
  const rings = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - k));
    return { wd: d.getDay(), today: k === 6 };
  });

  // Current hora planet for today
  const curPlanet = HP[(WD_START[today.getDay()]! + curHour) % 7]!;

  const labelX = CX + outerR + 38;

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card">
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
          होरा चक्र · Hora Wheel
        </div>
        <h3 className="font-bold text-base leading-tight">ग्रह–होरा चक्र</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          प्रत्येक घण्टा एक ग्रहद्वारा शासित · अहिले:{" "}
          <b style={{ color: curPlanet.color }}>{curPlanet.ne} होरा</b>
        </p>
      </div>

      <div className="overflow-x-auto">
        <svg
          width="470"
          height="430"
          viewBox="0 0 470 430"
          style={{ display: "block" }}
        >
          <defs>
            {/* Per-planet radial gradients for sphere look */}
            {HP.map((p, i) => (
              <radialGradient key={i} id={`hpg${i}`} cx="34%" cy="28%" r="66%">
                <stop offset="0%"   stopColor={p.lt} />
                <stop offset="52%"  stopColor={p.color} />
                <stop offset="100%" stopColor={p.dk} />
              </radialGradient>
            ))}
            {/* Needle glow filter */}
            <filter id="hglow">
              <feGaussianBlur stdDeviation="2" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Space background */}
          <circle cx={CX} cy={CY} r={outerR + 26} fill="#050b18" />

          {/* Faint star field */}
          {Array.from({ length: 26 }, (_, i) => {
            const a = (i / 26) * TWO_PI + i * 0.43;
            const r = outerR + 8 + (i % 5) * 3;
            return (
              <circle
                key={i}
                cx={CX + r * Math.cos(a)}
                cy={CY + r * Math.sin(a)}
                r={i % 4 === 0 ? 1.2 : 0.7}
                fill="#fff"
                opacity={0.15 + (i % 3) * 0.12}
              />
            );
          })}

          {/* Rings — k=0 innermost (oldest day), k=6 outermost (today) */}
          {rings.map((ring, k) => {
            const ri = rI(k), ro = rO(k);
            const base = WD_START[ring.wd]!;
            return (
              <g key={k}>
                {Array.from({ length: 24 }, (_, h) => {
                  const pi = (base + h) % 7;
                  const p = HP[pi]!;
                  const a1 = hAng(h) + 0.55 * D;
                  const a2 = hAng(h + 1) - 0.55 * D;
                  const isCur = ring.today && h === curHour;
                  const isPast = ring.today && h < curHour;
                  const opacity = isCur ? 1 : isPast ? 0.35 : ring.today ? 0.88 : 0.28 + k * 0.09;
                  return (
                    <path
                      key={h}
                      d={arc(ri, ro, a1, a2)}
                      fill={isCur ? p.lt : p.color}
                      opacity={opacity}
                    />
                  );
                })}
                {/* Ring boundary circle */}
                <circle cx={CX} cy={CY} r={ri} fill="none" stroke="#0a1628" strokeWidth="1.5" />
              </g>
            );
          })}
          {/* Outer ring boundary */}
          <circle cx={CX} cy={CY} r={outerR} fill="none" stroke="#0a1628" strokeWidth="1.5" />

          {/* Horizon lines (sunrise top / sunset bottom) */}
          <line
            x1={CX - outerR - 4} y1={CY - outerR * 0.001}
            x2={CX + outerR + 4} y2={CY - outerR * 0.001}
            stroke="#ffffff18" strokeWidth="0.7" strokeDasharray="3 5"
          />

          {/* Sunrise marker (top) */}
          <g>
            {/* Sun glow */}
            <circle cx={CX} cy={CY - outerR - 15} r={11} fill="#f9c800" opacity="0.18" />
            {/* Sun body with gradient */}
            <circle cx={CX} cy={CY - outerR - 15} r={8} fill="url(#hpg0)" />
            {/* Rays */}
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * TWO_PI;
              return (
                <line
                  key={i}
                  x1={CX + 10 * Math.cos(a)} y1={CY - outerR - 15 + 10 * Math.sin(a)}
                  x2={CX + 15 * Math.cos(a)} y2={CY - outerR - 15 + 15 * Math.sin(a)}
                  stroke="#f9c800" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"
                />
              );
            })}
            <text x={CX} y={CY - outerR - 28} textAnchor="middle" fontSize="8.5" fill="#f9c800" fontWeight="700">
              सूर्योदय
            </text>
          </g>

          {/* Sunset marker (bottom) */}
          <g>
            <circle cx={CX} cy={CY + outerR + 15} r={11} fill="#e06030" opacity="0.18" />
            <circle cx={CX} cy={CY + outerR + 15} r={8} fill="url(#hpg0)" opacity="0.55" />
            <text x={CX} y={CY + outerR + 30} textAnchor="middle" fontSize="8.5" fill="#e08040" fontWeight="700">
              सूर्यास्त
            </text>
          </g>

          {/* Noon / Midnight subtle labels */}
          <text x={CX + outerR + 6} y={CY + 4} fontSize="7.5" fill="#ffffff35">मध्याह्न</text>
          <text x={CX - outerR - 6} y={CY + 4} textAnchor="end" fontSize="7.5" fill="#ffffff20">अर्धरात्रि</text>

          {/* Day labels on right, connected by lines from each ring's 3-o'clock midpoint */}
          {rings.map((ring, k) => {
            const midR = (rI(k) + rO(k)) / 2;
            // Stagger labels vertically around CY
            const ly = CY - 54 + k * 18;
            return (
              <g key={`dl${k}`}>
                <line
                  x1={CX + midR} y1={CY}
                  x2={labelX - 5} y2={ly + 3}
                  stroke={ring.today ? "#ffffffa0" : "#ffffff25"}
                  strokeWidth={ring.today ? 1 : 0.5}
                />
                <text
                  x={labelX}
                  y={ly + 7}
                  fontSize={ring.today ? 11 : 8.5}
                  fontWeight={ring.today ? "700" : "400"}
                  fill={ring.today ? "#ffffffee" : "#ffffff50"}
                >
                  {WD_NE[ring.wd]}
                </text>
              </g>
            );
          })}

          {/* Planet legend (right side, below day labels) */}
          {HP.map((p, i) => {
            const lx = labelX;
            const ly = CY + 50 + i * 24;
            return (
              <g key={`leg${i}`}>
                {/* 3D sphere icon */}
                <circle cx={lx + 7} cy={ly} r={7} fill={`url(#hpg${i})`} />
                {/* Highlight */}
                <circle cx={lx + 5} cy={ly - 2} r={2.5} fill={p.lt} opacity="0.45" />
                <text x={lx + 18} y={ly + 4} fontSize="9.5" fill="#ffffffcc">
                  {p.ne}
                </text>
              </g>
            );
          })}

          {/* Animated time needle */}
          <line
            x1={CX}
            y1={CY}
            x2={CX + (outerR + 20) * Math.cos(needleAngle)}
            y2={CY + (outerR + 20) * Math.sin(needleAngle)}
            stroke="#ffffffd0"
            strokeWidth="1.4"
            strokeDasharray="5 3"
            filter="url(#hglow)"
          />
          <circle cx={CX} cy={CY} r={4} fill="#fff" opacity="0.9" />
          <circle cx={CX} cy={CY} r={1.5} fill="#060c18" />
        </svg>
      </div>
    </div>
  );
}
