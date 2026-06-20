import { useRef } from "react";
import { toNepaliDigits } from "@/lib/panchanga-format";
import {
  BS_MONTHS,
  RAD,
  SEM,
  dayFromYearAngle,
  elongationFromDay,
  monthIndexFromAngle,
  pol,
  yearAngleFromDay,
} from "./sun-earth-moon-math";

function litHemispherePath(ex: number, ey: number, r: number, towardDeg: number) {
  const a0 = (towardDeg - 90) * RAD;
  const a1 = (towardDeg + 90) * RAD;
  const x0 = ex + r * Math.cos(a0);
  const y0 = ey - r * Math.sin(a0);
  const x1 = ex + r * Math.cos(a1);
  const y1 = ey - r * Math.sin(a1);
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 0 0 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`;
}

interface Props {
  day: number;
  onDay?: (v: number) => void;
}

export function SunEarthMoonOrbit({ day, onDay }: Props) {
  const fmt = (n: number) => toNepaliDigits(n);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef(false);

  const yearAngle = yearAngleFromDay(day);
  const E = elongationFromDay(day);
  const sunDirFromEarth = yearAngle + 180;
  const moonAngleAbs = sunDirFromEarth + E;

  const [ex, ey] = pol(SEM.cx, SEM.cy, SEM.earthOrbitR, yearAngle);
  const [mx, my] = pol(ex, ey, SEM.moonOrbitR, moonAngleAbs);

  /** Stylised — not to scale — just to show Earth visibly spinning. */
  const spinDeg = (day * 760) % 360;
  const [spinMX, spinMY] = pol(ex, ey, SEM.earthR * 0.72, spinDeg);
  /** Tidal lock: this point always sits on the Earth-facing side of the Moon. */
  const [tlX, tlY] = pol(mx, my, SEM.moonR * 0.62, moonAngleAbs + 180);

  const dayFromEvt = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return day;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * SEM.W;
    const py = ((e.clientY - r.top) / r.height) * SEM.H;
    const a = Math.atan2(-(py - SEM.cy), px - SEM.cx) / RAD;
    return dayFromYearAngle(a);
  };

  const curMonth = monthIndexFromAngle(yearAngle);
  const monthTicks = Array.from({ length: 12 }, (_, k) => {
    const deg = k * 30;
    const [tx, ty] = pol(SEM.cx, SEM.cy, SEM.earthOrbitR + 36, deg);
    const [i0x, i0y] = pol(SEM.cx, SEM.cy, SEM.earthOrbitR - 9, deg);
    const [i1x, i1y] = pol(SEM.cx, SEM.cy, SEM.earthOrbitR + 9, deg);
    return (
      <g key={`mo-${k}`}>
        <line x1={i0x} y1={i0y} x2={i1x} y2={i1y} className="sem-month-tick" />
        <text
          x={tx}
          y={ty}
          className={`sem-month-label${curMonth === k ? " cur" : ""}`}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {BS_MONTHS[k]}
        </text>
      </g>
    );
  });

  const moonTicks = Array.from({ length: 12 }, (_, k) => {
    const deg = sunDirFromEarth + k * 30;
    const [tx, ty] = pol(ex, ey, SEM.moonOrbitR + 18, deg);
    const isNew = k === 0;
    const isFull = k === 6;
    return (
      <text
        key={`mn-${k}`}
        x={tx}
        y={ty}
        className={`sem-moon-label${isNew || isFull ? " key" : ""}`}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {isNew ? "नयाँ" : isFull ? "पूर्ण" : fmt(k + 1)}
      </text>
    );
  });

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SEM.W} ${SEM.H}`}
      className={`ed-svg sem-svg${onDay ? " grab" : ""}`}
      onPointerDown={(e) => {
        if (!onDay) return;
        drag.current = true;
        onDay(dayFromEvt(e));
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (drag.current && onDay) onDay(dayFromEvt(e));
      }}
      onPointerUp={() => {
        drag.current = false;
      }}
      onPointerCancel={() => {
        drag.current = false;
      }}
    >
      <defs>
        <radialGradient id="sem-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6d8" />
          <stop offset="38%" stopColor="#ffd24a" />
          <stop offset="78%" stopColor="#f08a1d" />
          <stop offset="100%" stopColor="#d65b12" />
        </radialGradient>
        <radialGradient id="sem-sunglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffcf57" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#ffcf57" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="sem-earth" cx="38%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#6fc6e8" />
          <stop offset="48%" stopColor="#2b7fa8" />
          <stop offset="100%" stopColor="#123a52" />
        </radialGradient>
        <radialGradient id="sem-moon" cx="36%" cy="32%" r="74%">
          <stop offset="0%" stopColor="#eef1f4" />
          <stop offset="55%" stopColor="#aab2bb" />
          <stop offset="100%" stopColor="#666e79" />
        </radialGradient>
      </defs>

      <circle cx={SEM.cx} cy={SEM.cy} r={SEM.earthOrbitR} className="sem-orbit" />
      {monthTicks}

      <circle cx={ex} cy={ey} r={SEM.moonOrbitR} className="sem-moon-orbit" />
      {moonTicks}

      <line x1={SEM.cx} y1={SEM.cy} x2={ex} y2={ey} className="sem-radius-line" />

      <circle cx={SEM.cx} cy={SEM.cy} r={SEM.sunR + 30} fill="url(#sem-sunglow)" />
      <circle cx={SEM.cx} cy={SEM.cy} r={SEM.sunR} fill="url(#sem-sun)" />
      <text x={SEM.cx} y={SEM.cy + SEM.sunR + 26} className="ed-body-label" textAnchor="middle">
        सूर्य
      </text>

      <circle cx={ex} cy={ey} r={SEM.earthR + 8} className="sem-earth-glow" />
      <circle cx={ex} cy={ey} r={SEM.earthR} fill="url(#sem-earth)" />
      <path
        d={litHemispherePath(ex, ey, SEM.earthR, sunDirFromEarth + 180)}
        className="sem-earth-night"
      />
      <line x1={ex} y1={ey} x2={spinMX} y2={spinMY} className="sem-spin-arm" />
      <circle cx={spinMX} cy={spinMY} r={3.6} className="sem-spin-dot" />
      <text x={ex} y={ey + SEM.earthR + 22} className="ed-body-label" textAnchor="middle">
        पृथ्वी
      </text>

      <circle cx={mx} cy={my} r={SEM.moonR} fill="url(#sem-moon)" />
      <circle cx={tlX} cy={tlY} r={2.4} className="sem-tidal-marker" />

      <text x={SEM.cx} y={SEM.H - 18} className="ho-orbit-dir" textAnchor="middle">
        ↺ वामावर्त — पृथ्वी १ वर्षमा १ फेरो, चन्द्र सोही समयमा ~{fmt(12)}.{fmt(4)} फेरो
      </text>
    </svg>
  );
}
