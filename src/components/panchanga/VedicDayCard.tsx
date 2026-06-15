import { useEffect, useRef, useState } from "react";

const D = Math.PI / 180;

// Chaldean hora order: Sun(0) Venus(1) Mercury(2) Moon(3) Saturn(4) Jupiter(5) Mars(6)
const HORA = [
  { ne: "रवि",    color: "#f9c800", lt: "#fff8c0", dk: "#b87800" },
  { ne: "शुक्र",  color: "#52c87a", lt: "#a0f0c0", dk: "#207840" },
  { ne: "बुध",    color: "#c8a060", lt: "#f0d8a8", dk: "#805018" },
  { ne: "सोम",    color: "#88b8d8", lt: "#c0e0f0", dk: "#385890" },
  { ne: "शनि",    color: "#6878a0", lt: "#a0a8c8", dk: "#283860" },
  { ne: "गुरु",   color: "#4890d0", lt: "#88c8f0", dk: "#1850a0" },
  { ne: "मङ्गल",  color: "#e05030", lt: "#f09878", dk: "#801010" },
];

// weekday (0=Sun..6=Sat) → first hora planet index
const WD_START = [0, 3, 6, 2, 5, 1, 4] as const;
const WD_NE    = ["आइत", "सोम", "मङ्गल", "बुध", "बिहि", "शुक्र", "शनि"] as const;
const WD_FULL  = ["आइतबार", "सोमबार", "मङ्गलबार", "बुधबार", "बिहिबार", "शुक्रबार", "शनिबार"] as const;

// Full 360° ring — centre in the middle of the SVG
const CX = 170, CY = 200;
const R_IN = 112, R_OUT = 172, R_MID = 142;
// Sunrise anchored at top (−90°), each hora = 15°
function hMidDeg(h: number) { return -90 + h * 15 + 7.5; }

// Donut arc path for one hora segment
function segPath(h: number): string {
  const a1 = (-90 + h * 15 + 0.7) * D;
  const a2 = (-90 + h * 15 + 14.3) * D;
  const [c1, s1, c2, s2] = [Math.cos(a1), Math.sin(a1), Math.cos(a2), Math.sin(a2)];
  return (
    `M${CX + R_IN * c1},${CY + R_IN * s1}` +
    `L${CX + R_OUT * c1},${CY + R_OUT * s1}` +
    `A${R_OUT},${R_OUT},0,0,1,${CX + R_OUT * c2},${CY + R_OUT * s2}` +
    `L${CX + R_IN * c2},${CY + R_IN * s2}` +
    `A${R_IN},${R_IN},0,0,0,${CX + R_IN * c1},${CY + R_IN * s1}Z`
  );
}

// textPath arc: upper half clockwise, lower half counter-clockwise so text reads outward
function textArc(h: number): string {
  const a1 = (-90 + h * 15 + 1) * D;
  const a2 = (-90 + h * 15 + 14) * D;
  const [c1, s1] = [Math.cos(a1), Math.sin(a1)];
  const [c2, s2] = [Math.cos(a2), Math.sin(a2)];
  // lower half (hora 6–17 roughly, mid angle > 0): reverse so text reads naturally
  const lower = hMidDeg(h) > 0 && hMidDeg(h) < 180;
  if (lower) {
    return `M${CX + R_MID * c2},${CY + R_MID * s2}A${R_MID},${R_MID},0,0,0,${CX + R_MID * c1},${CY + R_MID * s1}`;
  }
  return `M${CX + R_MID * c1},${CY + R_MID * s1}A${R_MID},${R_MID},0,0,1,${CX + R_MID * c2},${CY + R_MID * s2}`;
}

// Small 3-D sphere icon
function Sphere({ x, y, r, p }: { x: number; y: number; r: number; p: typeof HORA[number] }) {
  const id = `sp-${p.ne}`;
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

  // Simple interval — no setTimeout, no opacity juggling → no flicker
  useEffect(() => {
    timer.current = window.setInterval(
      () => setDay(d => (d + 1) % 7),
      2600
    );
    return () => clearInterval(timer.current);
  }, []);

  const base        = WD_START[day]!;
  const firstPlanet = HORA[base]!;

  // Arrow tip at first hora outer midpoint (top-right of ring, just after sunrise)
  const firstMidA = hMidDeg(0) * D;
  const tipX = CX + (R_OUT + 5) * Math.cos(firstMidA);
  const tipY = CY + (R_OUT + 5) * Math.sin(firstMidA);

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

      {/* Planet icon strip — active one highlighted */}
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
              <span className="text-[8px] font-medium leading-none"
                style={{ color: isActive ? p.dk : undefined, transition: "color 0.6s" }}>
                {p.ne}
              </span>
            </div>
          );
        })}
      </div>

      {/* Full-circle hora wheel — responsive, no fixed px */}
      <svg viewBox="0 0 340 418" style={{ width: "100%", display: "block" }}>
        <defs>
          {/* textPath arcs for each hora */}
          {Array.from({ length: 24 }, (_, h) => (
            <path key={h} id={`vtp${h}`} d={textArc(h)} />
          ))}
          {/* Arrow marker */}
          <marker id="varr" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 L1.5,3.5Z"
              fill="var(--muted-foreground)" />
          </marker>
        </defs>

        {/* Subtle ring track */}
        <circle cx={CX} cy={CY} r={R_OUT + 2} fill="none"
          stroke="var(--border)" strokeWidth="1.5" />
        <circle cx={CX} cy={CY} r={R_IN - 2} fill="none"
          stroke="var(--border)" strokeWidth="1.5" />

        {/* 24 hora segments — CSS fill transition prevents flickering */}
        {Array.from({ length: 24 }, (_, h) => {
          const pi      = (base + h) % 7;
          const p       = HORA[pi]!;
          const isDay   = h < 12; // daytime horas (sunrise → sunset)
          const isFirst = h === 0;
          return (
            <g key={h}>
              <path
                d={segPath(h)}
                style={{ fill: p.color, transition: "fill 0.6s ease" }}
                opacity={isFirst ? 1 : isDay ? 0.72 : 0.22}
              />
              {/* Planet name curved inside the ring */}
              <text
                fontSize={isFirst ? 8.5 : 7}
                fontWeight={isFirst ? "700" : "400"}
                fill={isDay ? "white" : "var(--muted-foreground)"}
              >
                <textPath href={`#vtp${h}`} startOffset="50%" textAnchor="middle">
                  {p.ne}
                </textPath>
              </text>
            </g>
          );
        })}

        {/* Day / night separators */}
        {/* Sunrise: top (−90°) */}
        <line x1={CX} y1={CY - R_IN} x2={CX} y2={CY - R_OUT - 8}
          stroke="var(--foreground)" strokeWidth="1.5" />
        {/* Sunset: bottom (+90°) */}
        <line x1={CX} y1={CY + R_IN} x2={CX} y2={CY + R_OUT + 8}
          stroke="var(--foreground)" strokeWidth="1.5" />

        {/* Sun icons */}
        {/* Sunrise (top) */}
        <Sphere x={CX} y={CY - R_OUT - 20} r={10} p={HORA[0]!} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * 2 * Math.PI;
          return (
            <line key={i}
              x1={CX + 12 * Math.cos(a)} y1={CY - R_OUT - 20 + 12 * Math.sin(a)}
              x2={CX + 17 * Math.cos(a)} y2={CY - R_OUT - 20 + 17 * Math.sin(a)}
              stroke="#f9c800" strokeWidth="1.5" strokeLinecap="round" />
          );
        })}
        <text x={CX} y={CY - R_OUT - 34} textAnchor="middle"
          fontSize="8.5" fontWeight="600" fill="var(--foreground)">
          Sunrise
        </text>

        {/* Sunset (bottom) */}
        <Sphere x={CX} y={CY + R_OUT + 20} r={10} p={{ ne: "सूर्यास्त", color: "#e08030", lt: "#f0c080", dk: "#804010" }} />
        <text x={CX} y={CY + R_OUT + 36} textAnchor="middle"
          fontSize="8.5" fontWeight="600" fill="var(--foreground)">
          Sunset
        </text>

        {/* Center: day name + first-hora planet sphere */}
        <Sphere x={CX} y={CY - 14} r={18} p={firstPlanet} />
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * 2 * Math.PI;
          return (
            <line key={i}
              x1={CX + 20 * Math.cos(a)} y1={CY - 14 + 20 * Math.sin(a)}
              x2={CX + 26 * Math.cos(a)} y2={CY - 14 + 26 * Math.sin(a)}
              stroke={firstPlanet.color} strokeWidth="1.2" strokeLinecap="round"
              opacity="0.6"
              style={{ transition: "stroke 0.6s ease" }}
            />
          );
        })}
        <text x={CX} y={CY + 14} textAnchor="middle"
          fontSize="11" fontWeight="700" fill="var(--foreground)"
          style={{ transition: "fill 0.4s" }}>
          {WD_FULL[day]}
        </text>
        <text x={CX} y={CY + 30} textAnchor="middle"
          fontSize="8.5" fontWeight="600"
          style={{ fill: firstPlanet.color, transition: "fill 0.6s ease" }}>
          {firstPlanet.ne} होरा
        </text>

        {/* Arrow from right label → first hora */}
        <text x={310} y={85} textAnchor="end"
          fontSize="10" fill="var(--muted-foreground)">
          पहिलो होरा
        </text>
        <line x1={282} y1={80} x2={tipX + 4} y2={tipY + 4}
          stroke="var(--muted-foreground)" strokeWidth="1.2"
          strokeDasharray="4 3" markerEnd="url(#varr)" />

        {/* 7 weekday chips at bottom */}
        {Array.from({ length: 7 }, (_, k) => {
          const chipW = 42, gap = 3;
          const total = 7 * chipW + 6 * gap;
          const sx    = (340 - total) / 2 + k * (chipW + gap);
          const isAnim  = k === day;
          const isToday = k === todayWd;
          const cp = HORA[WD_START[k]!]!;
          return (
            <g key={k}>
              <rect
                x={sx} y={394} width={chipW} height={18} rx={9}
                style={{ fill: isAnim ? cp.color : "transparent", transition: "fill 0.6s ease" }}
                stroke={isAnim || isToday ? cp.color : "var(--border)"}
                strokeWidth={isAnim ? 0 : isToday ? 1.5 : 0.8}
                opacity={isAnim ? 0.9 : 0.65}
              />
              <text
                x={sx + chipW / 2} y={407}
                textAnchor="middle"
                fontSize="7.5"
                fontWeight={isAnim ? "700" : "400"}
                fill={isAnim ? "white" : "var(--foreground)"}
              >
                {WD_NE[k]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
