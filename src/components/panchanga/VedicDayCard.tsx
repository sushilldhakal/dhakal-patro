import { useEffect, useRef, useState } from "react";

const D = Math.PI / 180;

// Chaldean hora sequence: Sun(0) Venus(1) Mercury(2) Moon(3) Saturn(4) Jupiter(5) Mars(6)
const HORA = [
  { ne: "रवि",    color: "#f9c800", lt: "#fff8c0", dk: "#b87800" },
  { ne: "शुक्र",  color: "#52c87a", lt: "#a0f0c0", dk: "#207840" },
  { ne: "बुध",    color: "#c8a060", lt: "#f0d8a8", dk: "#805018" },
  { ne: "सोम",    color: "#88b8d8", lt: "#c0e0f0", dk: "#385890" },
  { ne: "शनि",    color: "#6878a0", lt: "#a0a8c8", dk: "#283860" },
  { ne: "गुरु",   color: "#4890d0", lt: "#88c8f0", dk: "#1850a0" },
  { ne: "मङ्गल",  color: "#e05030", lt: "#f09878", dk: "#801010" },
] as const;

// weekday 0=Sun…6=Sat → first hora planet index
const WD_START = [0, 3, 6, 2, 5, 1, 4] as const;
const WD_NE    = ["आइत", "सोम", "मङ्गल", "बुध", "बिहि", "शुक्र", "शनि"] as const;
const WD_FULL  = ["आइतबार", "सोमबार", "मङ्गलबार", "बुधबार", "बिहिबार", "शुक्रबार", "शनिबार"] as const;

// Arc: right half-circle from sunrise (top) → noon (right) → sunset (bottom)
// Center at left edge so the arc opens rightward
const ACX = 14, ACY = 205;
const R_IN = 112, R_OUT = 182, R_MID = 147;

function hMidDeg(h: number) { return -90 + h * 15 + 7.5; }

function hMidPt(h: number, r: number) {
  const a = hMidDeg(h) * D;
  return { x: ACX + r * Math.cos(a), y: ACY + r * Math.sin(a) };
}

function segPath(h: number): string {
  const a1 = (-90 + h * 15 + 0.7) * D;
  const a2 = (-90 + h * 15 + 14.3) * D;
  const [c1,s1,c2,s2] = [Math.cos(a1),Math.sin(a1),Math.cos(a2),Math.sin(a2)];
  return (
    `M${ACX+R_IN*c1},${ACY+R_IN*s1}` +
    `L${ACX+R_OUT*c1},${ACY+R_OUT*s1}` +
    `A${R_OUT},${R_OUT},0,0,1,${ACX+R_OUT*c2},${ACY+R_OUT*s2}` +
    `L${ACX+R_IN*c2},${ACY+R_IN*s2}` +
    `A${R_IN},${R_IN},0,0,0,${ACX+R_IN*c1},${ACY+R_IN*s1}Z`
  );
}

// Text arc path for textPath element
function textPath(h: number): string {
  // Always go clockwise; for lower half we reverse direction so text reads naturally
  const lower = hMidDeg(h) > 0;
  const a1 = (-90 + h * 15 + 1) * D;
  const a2 = (-90 + h * 15 + 14) * D;
  const [c1,s1,c2,s2] = [Math.cos(a1),Math.sin(a1),Math.cos(a2),Math.sin(a2)];
  if (lower) {
    // Reversed (counter-clockwise) so text reads left-to-right on bottom arc
    return `M${ACX+R_MID*c2},${ACY+R_MID*s2}A${R_MID},${R_MID},0,0,0,${ACX+R_MID*c1},${ACY+R_MID*s1}`;
  }
  return `M${ACX+R_MID*c1},${ACY+R_MID*s1}A${R_MID},${R_MID},0,0,1,${ACX+R_MID*c2},${ACY+R_MID*s2}`;
}

function SunIcon({ cx, cy, r, dim }: { cx: number; cy: number; r: number; dim?: boolean }) {
  return (
    <g opacity={dim ? 0.55 : 1}>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * 2 * Math.PI;
        return (
          <line key={i}
            x1={cx + (r+2)*Math.cos(a)} y1={cy + (r+2)*Math.sin(a)}
            x2={cx + (r+7)*Math.cos(a)} y2={cy + (r+7)*Math.sin(a)}
            stroke={dim ? "#e08030" : "#f9c800"} strokeWidth="1.5" strokeLinecap="round" />
        );
      })}
      <circle cx={cx} cy={cy} r={r}
        fill={dim ? "#e08030" : "#f9c800"} />
      <circle cx={cx-r*0.3} cy={cy-r*0.3} r={r*0.3}
        fill={dim ? "#f0a050" : "#fff8c0"} opacity="0.5" />
    </g>
  );
}

export function VedicDayCard() {
  const todayWd = new Date().getDay();
  const [animDay, setAnimDay] = useState(todayWd);
  const [visible, setVisible] = useState(true);
  const timer = useRef<number>(0);

  useEffect(() => {
    timer.current = window.setInterval(() => {
      // brief fade → switch day → fade in
      setVisible(false);
      setTimeout(() => {
        setAnimDay(d => (d + 1) % 7);
        setVisible(true);
      }, 350);
    }, 2800);
    return () => clearInterval(timer.current);
  }, []);

  const base        = WD_START[animDay]!;
  const firstPlanet = HORA[base]!;

  // Arrow: from label area → outer edge of first hora
  const arrowTip = hMidPt(0, R_OUT + 4);

  // Label position: right side, near top
  const labelX = 320;
  const labelY = 52;

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
          होरा चक्र
        </div>
        <h3 className="font-bold text-sm leading-tight">
          Weekdays with the first <i>hora</i>
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          पहिलो होरा ग्रहले वारको नाम दिन्छ
        </p>
      </div>

      {/* Planet icon strip — 7 planets, active one highlighted */}
      <div className="grid grid-cols-7 border-b border-border">
        {HORA.map((p, i) => {
          const isActive = i === base;
          return (
            <div
              key={i}
              className="flex flex-col items-center py-2 gap-[3px] transition-all duration-300"
              style={{ background: isActive ? p.color + "28" : undefined }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28">
                <defs>
                  <radialGradient id={`vps${i}`} cx="34%" cy="28%" r="66%">
                    <stop offset="0%"   stopColor={p.lt} />
                    <stop offset="55%"  stopColor={p.color} />
                    <stop offset="100%" stopColor={p.dk} />
                  </radialGradient>
                </defs>
                <circle cx="14" cy="14" r="12" fill={`url(#vps${i})`} />
                <circle cx="10" cy="10" r="3.5" fill={p.lt} opacity="0.45" />
                {/* Saturn ring */}
                {i === 4 && (
                  <ellipse cx="14" cy="14" rx="16" ry="5"
                    fill="none" stroke={p.color} strokeWidth="2.2" opacity="0.55"
                    transform="rotate(-20 14 14)" />
                )}
                {/* Jupiter bands */}
                {i === 5 && [10,14,18].map(y => (
                  <line key={y} x1="3" y1={y} x2="25" y2={y}
                    stroke="#1a3860" strokeWidth="1.5" opacity="0.22"
                    clipPath="inset(0 round 50%)" />
                ))}
              </svg>
              <span
                className="text-[8px] font-medium leading-none"
                style={{ color: isActive ? p.dk : undefined }}
              >
                {p.ne}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main arc SVG — fully responsive */}
      <svg
        viewBox="0 0 340 415"
        style={{ width: "100%", display: "block", transition: "opacity 0.3s" }}
        opacity={visible ? 1 : 0}
      >
        <defs>
          {/* Gradient for each planet (for legend spheres) */}
          {HORA.map((p, i) => (
            <radialGradient key={i} id={`vhg${i}`} cx="34%" cy="28%" r="66%">
              <stop offset="0%"   stopColor={p.lt} />
              <stop offset="55%"  stopColor={p.color} />
              <stop offset="100%" stopColor={p.dk} />
            </radialGradient>
          ))}
          {/* textPath definitions for each segment */}
          {Array.from({ length: 12 }, (_, h) => (
            <path key={h} id={`vtp${h}`} d={textPath(h)} />
          ))}
          {/* Arrow marker */}
          <marker id="varr" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 L1.5,3.5Z" fill="var(--muted-foreground)" />
          </marker>
        </defs>

        {/* Background track (faint arc band) */}
        <path
          d={`M${ACX},${ACY-R_OUT-3}A${R_OUT+3},${R_OUT+3},0,0,1,${ACX},${ACY+R_OUT+3}L${ACX},${ACY+R_IN-3}A${R_IN-3},${R_IN-3},0,0,0,${ACX},${ACY-R_IN+3}Z`}
          fill="var(--muted)" opacity="0.3"
        />

        {/* 12 hora arc segments */}
        {Array.from({ length: 12 }, (_, h) => {
          const pi    = (base + h) % 7;
          const p     = HORA[pi]!;
          const isFst = h === 0;
          return (
            <g key={h}>
              <path d={segPath(h)} fill={p.color} opacity={isFst ? 1 : 0.65} />
              <text
                fontSize={isFst ? 9 : 7.5}
                fontWeight={isFst ? "700" : "500"}
                fill="white"
              >
                <textPath href={`#vtp${h}`} startOffset="50%" textAnchor="middle">
                  {p.ne}
                </textPath>
              </text>
            </g>
          );
        })}

        {/* Sunrise: top of arc */}
        <SunIcon cx={ACX + 2} cy={ACY - R_OUT - 16} r={10} />
        <text x={ACX + 18} y={ACY - R_OUT - 12} fontSize="9" fontWeight="600" fill="var(--foreground)">
          Sunrise
        </text>

        {/* Sunset: bottom of arc */}
        <SunIcon cx={ACX + 2} cy={ACY + R_OUT + 16} r={10} dim />
        <text x={ACX + 18} y={ACY + R_OUT + 20} fontSize="9" fontWeight="600" fill="var(--foreground)">
          Sunset
        </text>

        {/* Noon tick at right */}
        <line
          x1={ACX + R_OUT + 2} y1={ACY}
          x2={ACX + R_OUT + 10} y2={ACY}
          stroke="var(--muted-foreground)" strokeWidth="1"
        />
        <text x={ACX + R_OUT + 14} y={ACY + 4} fontSize="8" fill="var(--muted-foreground)">Noon</text>

        {/* Day label + arrow → first hora */}
        <text
          x={labelX} y={labelY - 10}
          textAnchor="end"
          fontSize="15"
          fontWeight="700"
          fill="var(--foreground)"
        >
          {WD_FULL[animDay]}
        </text>
        <text
          x={labelX} y={labelY + 7}
          textAnchor="end"
          fontSize="9"
          fontWeight="600"
          fill={firstPlanet.color}
        >
          {firstPlanet.ne} — पहिलो होरा
        </text>
        {/* Dashed arrow line from label → first hora */}
        <line
          x1={labelX - 2} y1={labelY + 14}
          x2={arrowTip.x + 6} y2={arrowTip.y + 2}
          stroke="var(--muted-foreground)"
          strokeWidth="1.2"
          strokeDasharray="4 3"
          markerEnd="url(#varr)"
        />

        {/* Planet legend: colored spheres + names on right */}
        {HORA.map((p, i) => {
          const lx = 210, ly = 150 + i * 26;
          const isAct = i === base;
          return (
            <g key={i} opacity={isAct ? 1 : 0.55}>
              <circle cx={lx + 7} cy={ly} r={7} fill={`url(#vhg${i})`} />
              <circle cx={lx + 5} cy={ly - 2} r={2.2} fill={p.lt} opacity="0.45" />
              <text x={lx + 18} y={ly + 4} fontSize="9" fill="var(--foreground)" fontWeight={isAct ? "700" : "400"}>
                {p.ne}
              </text>
            </g>
          );
        })}

        {/* Day chips — 7 buttons at bottom showing week */}
        {Array.from({ length: 7 }, (_, k) => {
          const chipW = 42, gap = 4;
          const totalW = 7 * chipW + 6 * gap;
          const sx = (340 - totalW) / 2 + k * (chipW + gap);
          const isAnim  = k === animDay;
          const isToday = k === todayWd;
          const p = HORA[WD_START[k]!]!;
          return (
            <g key={k}>
              <rect
                x={sx} y={393}
                width={chipW} height={18} rx={9}
                fill={isAnim ? p.color : "transparent"}
                stroke={isAnim ? p.color : isToday ? p.color : "var(--border)"}
                strokeWidth={isToday || isAnim ? 1.5 : 0.8}
                opacity={isAnim ? 0.9 : isToday ? 0.7 : 0.5}
              />
              <text
                x={sx + chipW / 2} y={406}
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
