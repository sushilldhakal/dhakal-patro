import { useEffect, useRef, useState } from "react";

const D = Math.PI / 180;

// Chaldean hora order: Sun(0) Venus(1) Mercury(2) Moon(3) Saturn(4) Jupiter(5) Mars(6)
const HORA = [
  { ne: "रवि",    tr: "Ravi",    en: "Sun",     color: "#f9c800", lt: "#fff8c0", dk: "#b87800" },
  { ne: "शुक्र",  tr: "Shukra",  en: "Venus",   color: "#52c87a", lt: "#a0f0c0", dk: "#207840" },
  { ne: "बुध",    tr: "Budha",   en: "Mercury", color: "#c8a060", lt: "#f0d8a8", dk: "#805018" },
  { ne: "सोम",    tr: "Soma",    en: "Moon",    color: "#88b8d8", lt: "#c0e0f0", dk: "#385890" },
  { ne: "शनि",    tr: "Shani",   en: "Saturn",  color: "#6878a0", lt: "#a0a8c8", dk: "#283860" },
  { ne: "गुरु",   tr: "Guru",    en: "Jupiter", color: "#4890d0", lt: "#88c8f0", dk: "#1850a0" },
  { ne: "मङ्गल",  tr: "Mangala", en: "Mars",    color: "#e05030", lt: "#f09878", dk: "#801010" },
];

// weekday (0=Sun..6=Sat) → first hora planet index (Chaldean)
const WD_START = [0, 3, 6, 2, 5, 1, 4] as const;
const WD_NE    = ["आइत", "सोम", "मङ्गल", "बुध", "बिहि", "शुक्र", "शनि"] as const;
const WD_FULL  = ["आइतबार", "सोमबार", "मङ्गलबार", "बुधबार", "बिहिबार", "शुक्रबार", "शनिबार"] as const;

// Right-half arc: sunrise at the top, sunset at the bottom, bulging right.
// 12 daytime horas spread over 180° (15° each).
const CX = 96, CY = 196;
const R_IN = 104, R_OUT = 142, R_MID = 123;
const SEGS = 12;

function segAngles(h: number) {
  const a1 = -90 + h * 15;
  const a2 = a1 + 15;
  return [a1, a2] as const;
}
function midDeg(h: number) { return -90 + h * 15 + 7.5; }

// Donut arc path for one daytime hora segment
function segPath(h: number): string {
  const [d1, d2] = segAngles(h);
  const a1 = (d1 + 0.6) * D;
  const a2 = (d2 - 0.6) * D;
  const [c1, s1, c2, s2] = [Math.cos(a1), Math.sin(a1), Math.cos(a2), Math.sin(a2)];
  return (
    `M${CX + R_IN * c1},${CY + R_IN * s1}` +
    `L${CX + R_OUT * c1},${CY + R_OUT * s1}` +
    `A${R_OUT},${R_OUT},0,0,1,${CX + R_OUT * c2},${CY + R_OUT * s2}` +
    `L${CX + R_IN * c2},${CY + R_IN * s2}` +
    `A${R_IN},${R_IN},0,0,0,${CX + R_IN * c1},${CY + R_IN * s1}Z`
  );
}

// Small 3-D sphere icon
function Sphere({ x, y, r, p }: { x: number; y: number; r: number; p: { ne: string; color: string; lt: string; dk: string } }) {
  const id = `sp-${p.ne}-${r}`;
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="34%" cy="28%" r="66%">
          <stop offset="0%"   stopColor={p.lt} />
          <stop offset="55%"  stopColor={p.color} />
          <stop offset="100%" stopColor={p.dk} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
      <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.28} fill={p.lt} opacity="0.42" />
    </g>
  );
}

export function VedicDayCard() {
  const todayWd = new Date().getDay();
  const [day, setDay] = useState(todayWd);
  const timer = useRef<number>(0);

  useEffect(() => {
    timer.current = window.setInterval(() => setDay(d => (d + 1) % 7), 2600);
    return () => clearInterval(timer.current);
  }, []);

  const base        = WD_START[day]!;
  const firstPlanet = HORA[base]!;

  // First-hora outer point (top of arc) for the weekday connector
  const topA = midDeg(0) * D;
  const tipX = CX + (R_OUT + 4) * Math.cos(topA);
  const tipY = CY + (R_OUT + 4) * Math.sin(topA);

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
          होरा चक्र
        </div>
        <h3 className="font-bold text-sm leading-snug">
          Weekdays with the first <em>hora</em>
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          पहिलो होराले वारको नाम दिन्छ
        </p>
      </div>

      {/* Planet icon strip — active (first-hora) one highlighted */}
      <div className="grid grid-cols-7 border-b border-border">
        {HORA.map((p, i) => {
          const isActive = i === base;
          return (
            <div
              key={i}
              className="flex flex-col items-center py-2 gap-[3px]"
              style={{
                background: isActive ? p.color + "28" : undefined,
                transition: "background 0.6s ease",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28">
                <defs>
                  <radialGradient id={`vs${i}`} cx="34%" cy="28%" r="66%">
                    <stop offset="0%"   stopColor={p.lt} />
                    <stop offset="55%"  stopColor={p.color} />
                    <stop offset="100%" stopColor={p.dk} />
                  </radialGradient>
                </defs>
                <circle cx="14" cy="14" r="12" fill={`url(#vs${i})`} />
                <circle cx="10" cy="10" r="3.5" fill={p.lt} opacity="0.42" />
                {/* Saturn ring */}
                {i === 4 && (
                  <ellipse cx="14" cy="14" rx="17" ry="5" fill="none"
                    stroke={p.color} strokeWidth="2.5" opacity="0.5"
                    transform="rotate(-20 14 14)" />
                )}
                {/* Jupiter bands */}
                {i === 5 && [9, 13, 17].map(y => (
                  <rect key={y} x="2" y={y} width="24" height="2" fill="#1a4070" opacity="0.25" />
                ))}
                {isActive && (
                  <circle cx="14" cy="14" r="12" fill="none"
                    stroke="white" strokeWidth="1.5" opacity="0.6" />
                )}
              </svg>
              <span className="text-[8px] font-semibold leading-none"
                style={{ color: isActive ? p.dk : undefined, transition: "color 0.6s" }}>
                {p.ne}
              </span>
              <span className="text-[7px] italic leading-none text-muted-foreground">
                {p.en}
              </span>
            </div>
          );
        })}
      </div>

      {/* Sunrise → sunset hora arc with planet names inside the ring */}
      <svg viewBox="0 0 360 400" style={{ width: "100%", maxWidth: 380, margin: "0 auto", display: "block" }}>
        <defs>
          <marker id="varr" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 L1.5,3.5Z" fill="var(--muted-foreground)" />
          </marker>
        </defs>

        {/* Ring track */}
        <path
          d={`M${CX},${CY - R_OUT} A${R_OUT},${R_OUT},0,0,1,${CX},${CY + R_OUT}`}
          fill="none" stroke="var(--border)" strokeWidth="1.2" />
        <path
          d={`M${CX},${CY - R_IN} A${R_IN},${R_IN},0,0,1,${CX},${CY + R_IN}`}
          fill="none" stroke="var(--border)" strokeWidth="1.2" />

        {/* 12 daytime hora segments — name written upright inside the ring */}
        {Array.from({ length: SEGS }, (_, h) => {
          const pi      = (base + h) % 7;
          const p       = HORA[pi]!;
          const isFirst = h === 0;
          const mA      = midDeg(h) * D;
          const lx      = CX + R_MID * Math.cos(mA);
          const ly      = CY + R_MID * Math.sin(mA);
          return (
            <g key={h}>
              <path
                d={segPath(h)}
                fill={p.color}
                opacity={isFirst ? 1 : 0.82}
              />
              {/* hora number on the inner edge */}
              <text
                x={CX + (R_IN - 8) * Math.cos(mA)}
                y={CY + (R_IN - 8) * Math.sin(mA)}
                textAnchor="middle" dominantBaseline="central"
                fontSize="6.5" fill="var(--muted-foreground)">
                {h + 1}
              </text>
              {/* planet name upright inside the band */}
              <text
                x={lx} y={ly}
                textAnchor="middle" dominantBaseline="central"
                fontSize={isFirst ? 8.5 : 7.5}
                fontWeight={isFirst ? "700" : "600"}
                fill="white" style={{ paintOrder: "stroke" }}
                stroke={p.dk} strokeWidth={isFirst ? 0.6 : 0.4}>
                {p.ne}
              </text>
            </g>
          );
        })}

        {/* Sunrise (top) */}
        <Sphere x={CX} y={CY - R_OUT - 22} r={11} p={HORA[0]!} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * 2 * Math.PI;
          return (
            <line key={i}
              x1={CX + 13 * Math.cos(a)} y1={CY - R_OUT - 22 + 13 * Math.sin(a)}
              x2={CX + 18 * Math.cos(a)} y2={CY - R_OUT - 22 + 18 * Math.sin(a)}
              stroke="#f9c800" strokeWidth="1.6" strokeLinecap="round" />
          );
        })}
        <text x={CX} y={CY - R_OUT - 40} textAnchor="middle"
          fontSize="8.5" fontWeight="600" fill="var(--foreground)">
          सूर्योदय · Sunrise
        </text>

        {/* Sunset (bottom) */}
        <Sphere x={CX} y={CY + R_OUT + 22} r={11} p={{ ne: "सूर्यास्त", color: "#e08030", lt: "#f0c080", dk: "#804010" }} />
        <text x={CX} y={CY + R_OUT + 42} textAnchor="middle"
          fontSize="8.5" fontWeight="600" fill="var(--foreground)">
          सूर्यास्त · Sunset
        </text>

        {/* Weekday connector from the first hora */}
        <line x1={tipX} y1={tipY} x2={250} y2={CY - R_OUT + 6}
          stroke="var(--muted-foreground)" strokeWidth="1.1"
          strokeDasharray="4 3" markerEnd="url(#varr)" />
        <text x={256} y={CY - R_OUT + 2} textAnchor="start"
          fontSize="12" fontWeight="700" fill="var(--foreground)"
          style={{ transition: "fill 0.4s" }}>
          {WD_FULL[day]}
        </text>
        <text x={256} y={CY - R_OUT + 17} textAnchor="start"
          fontSize="8.5" fontWeight="600"
          style={{ fill: firstPlanet.color, transition: "fill 0.6s ease" }}>
          {firstPlanet.ne} होरा — पहिलो
        </text>

        {/* Center sphere: ruling planet of the day */}
        <Sphere x={CX} y={CY} r={20} p={firstPlanet} />
        <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="central"
          fontSize="9.5" fontWeight="700" fill="white"
          stroke={firstPlanet.dk} strokeWidth="0.5" style={{ paintOrder: "stroke" }}>
          {firstPlanet.ne}
        </text>
      </svg>

      {/* Planet legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-4 py-3 border-t border-border">
        {HORA.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2.5 w-6 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-[10px] font-semibold">{p.ne}</span>
            <span className="text-[9px] italic text-muted-foreground">{p.tr}</span>
          </div>
        ))}
      </div>

      {/* 7 weekday chips — animated cycle */}
      <div className="grid grid-cols-7 gap-1 px-3 pb-3">
        {Array.from({ length: 7 }, (_, k) => {
          const isAnim  = k === day;
          const isToday = k === todayWd;
          const cp = HORA[WD_START[k]!]!;
          return (
            <div
              key={k}
              className="flex items-center justify-center h-5 rounded-full text-[8px]"
              style={{
                background: isAnim ? cp.color : "transparent",
                color: isAnim ? "white" : "var(--foreground)",
                border: isAnim
                  ? "none"
                  : `${isToday ? 1.5 : 0.8}px solid ${isToday ? cp.color : "var(--border)"}`,
                fontWeight: isAnim ? 700 : 400,
                opacity: isAnim ? 0.95 : 0.7,
                transition: "background 0.6s ease, color 0.6s ease",
              }}
            >
              {WD_NE[k]}
            </div>
          );
        })}
      </div>
    </div>
  );
}
