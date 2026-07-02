import { EarthGlobeImage } from "./EarthGlobeImage";
import { useLocale } from "@/i18n/locale";

const W = 640;
const H = 220;
const cx = W / 2;
const cy = H / 2 + 8;
const r = 124;

export function EarthRotationDiagram() {
  const { pick, digits } = useLocale();
  const fmt = (n: number) => digits(n);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ss-rot-svg" aria-hidden>
      <defs>
        <marker id="ss-rot-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" className="ss-rot-arrow-head" />
        </marker>
      </defs>

      <text x={72} y={cy - 4} className="ss-rot-dir" textAnchor="middle">
        {pick("पश्चिम", "West")}
      </text>
      <text x={W - 72} y={cy - 4} className="ss-rot-dir" textAnchor="middle">
        {pick("पूर्व", "East")}
      </text>

      <line x1={100} y1={cy} x2={W - 100} y2={cy} className="ss-rot-axis" />

      <EarthGlobeImage cx={cx} cy={cy} r={r} glow glowClassName="ss-rot-glow" glowPad={10} />
      <line x1={cx} y1={cy - r - 6} x2={cx} y2={cy + r + 6} className="ss-rot-pole" />
      <path
        d={`M ${cx - 38} ${cy + 44} A 46 46 0 1 1 ${cx + 38} ${cy + 44}`}
        className="ss-rot-curve"
        fill="none"
        markerEnd="url(#ss-rot-arrow)"
      />
      <text x={cx} y={cy + 72} className="ss-rot-label" textAnchor="middle">
        {pick("↻ पश्चिम → पूर्व", "↻ West → East")} · ~{fmt(24)} {pick("घण्टा", "hours")}
      </text>
    </svg>
  );
}
