import { toNepaliDigits } from "@/lib/panchanga-format";

const W = 640;
const H = 220;
const cx = W / 2;
const cy = H / 2 + 8;
const r = 62;

export function EarthRotationDiagram() {
  const fmt = (n: number) => toNepaliDigits(n);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ss-rot-svg" aria-hidden>
      <defs>
        <radialGradient id="ss-earth" cx="38%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#6fc6e8" />
          <stop offset="48%" stopColor="#2b7fa8" />
          <stop offset="100%" stopColor="#123a52" />
        </radialGradient>
        <marker id="ss-rot-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" className="ss-rot-arrow-head" />
        </marker>
      </defs>

      <text x={72} y={cy - 4} className="ss-rot-dir" textAnchor="middle">
        पश्चिम
      </text>
      <text x={W - 72} y={cy - 4} className="ss-rot-dir" textAnchor="middle">
        पूर्व
      </text>

      <line x1={100} y1={cy} x2={W - 100} y2={cy} className="ss-rot-axis" />

      <circle cx={cx} cy={cy} r={r + 10} className="ss-rot-glow" />
      <circle cx={cx} cy={cy} r={r} fill="url(#ss-earth)" />
      <line x1={cx} y1={cy - r - 6} x2={cx} y2={cy + r + 6} className="ss-rot-pole" />
      <path
        d={`M ${cx - 38} ${cy + 44} A 46 46 0 1 1 ${cx + 38} ${cy + 44}`}
        className="ss-rot-curve"
        fill="none"
        markerEnd="url(#ss-rot-arrow)"
      />
      <text x={cx} y={cy + 72} className="ss-rot-label" textAnchor="middle">
        ↻ पश्चिम → पूर्व · ~{fmt(24)} घण्टा
      </text>
    </svg>
  );
}
