import { useEffect, useRef, useState } from "react";
import { toNepaliDigits } from "@/lib/panchanga-format";

const TWO_PI = Math.PI * 2;
const CX = 100, CY = 100, R_ORB = 64, R_EARTH = 15;
const CYCLE_MS = 12000;

function sunPos(t: number) {
  // t 0→1: sunrise(left) → noon(top) → sunset(right) → midnight(bottom) → sunrise
  const a = t * TWO_PI + Math.PI; // start left
  return { x: CX + R_ORB * Math.cos(a), y: CY + R_ORB * Math.sin(a), isDay: Math.sin(a) < 0 };
}

export function VedicDayCard() {
  const rafRef = useRef<number>(0);
  const t0Ref = useRef<number | null>(null);
  const [prog, setProg] = useState(0);

  useEffect(() => {
    const tick = (ts: number) => {
      if (!t0Ref.current) t0Ref.current = ts;
      setProg(((ts - t0Ref.current) % CYCLE_MS) / CYCLE_MS);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const { x: sx, y: sy, isDay } = sunPos(prog);
  const ghati = Math.floor(prog * 60);
  const pala = Math.floor((prog * 60 - ghati) * 60);

  // Stars (fixed positions)
  const stars = Array.from({ length: 16 }, (_, k) => {
    const a = (k / 16) * TWO_PI;
    const r = R_ORB + 8 + (k % 3) * 4;
    return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
  });

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card">
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1">
          वैदिक दिन · Vedic Day Definition
        </div>
        <h3 className="font-bold text-base leading-tight">दिनको परिभाषा</h3>
        <p className="text-xs text-muted-foreground mt-0.5">सूर्योदय → अर्को सूर्योदय = ६० घडी</p>
      </div>

      <div className="flex items-center gap-2 p-4">
        {/* Animation */}
        <div className="flex-shrink-0">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {/* Outer dark space */}
            <circle cx={CX} cy={CY} r={R_ORB + 28} fill="#050c1a" />

            {/* Stars */}
            {stars.map((s, k) => (
              <circle key={k} cx={s.x} cy={s.y} r="0.9"
                fill="white" opacity={isDay ? 0.25 : 0.75 - (k % 3) * 0.1} />
            ))}

            {/* Day sky sector (top half semicircle) */}
            <path
              d={`M${CX - R_ORB} ${CY} A${R_ORB} ${R_ORB} 0 0 1 ${CX + R_ORB} ${CY} Z`}
              fill={isDay ? "#0c3070" : "#060e28"}
            />

            {/* Earth ground (bottom half) */}
            <path
              d={`M${CX - R_ORB} ${CY} A${R_ORB} ${R_ORB} 0 0 0 ${CX + R_ORB} ${CY} Z`}
              fill="#0d1f0a"
            />

            {/* Horizon line */}
            <line x1={CX - R_ORB - 2} y1={CY} x2={CX + R_ORB + 2} y2={CY}
              stroke="#3a6a28" strokeWidth="1.5" />

            {/* Ghati tick marks around orbit */}
            {Array.from({ length: 60 }, (_, k) => {
              const a = (k / 60) * TWO_PI + Math.PI;
              const r1 = R_ORB + 1, r2 = r1 + (k % 5 === 0 ? 6 : 3.5);
              return (
                <line key={k}
                  x1={CX + r1 * Math.cos(a)} y1={CY + r1 * Math.sin(a)}
                  x2={CX + r2 * Math.cos(a)} y2={CY + r2 * Math.sin(a)}
                  stroke={k <= ghati ? "#ffd70a" : "rgba(255,255,255,0.2)"}
                  strokeWidth={k % 5 === 0 ? 1.5 : 0.8}
                />
              );
            })}

            {/* Orbit path (dashed) */}
            <circle cx={CX} cy={CY} r={R_ORB} fill="none"
              stroke="rgba(255,255,255,0.1)" strokeWidth="0.7" strokeDasharray="2 4" />

            {/* Sunrise / Sunset markers */}
            <circle cx={CX - R_ORB} cy={CY} r="3.5" fill="#f9a840" opacity="0.9" />
            <circle cx={CX + R_ORB} cy={CY} r="3.5" fill="#e06030" opacity="0.9" />

            {/* Sun glow */}
            <circle cx={sx} cy={sy} r={isDay ? 14 : 9}
              fill={isDay ? "#ff9800" : "#8a3000"} opacity="0.28"
              style={{ filter: "blur(5px)" }} />

            {/* Sun body */}
            <circle cx={sx} cy={sy} r={isDay ? 9 : 6}
              fill={isDay ? "#f9c800" : "#8a3000"}
              opacity={isDay ? 1 : 0.55} />

            {/* Sun inner highlight */}
            {isDay && <circle cx={sx - 2} cy={sy - 2} r="4" fill="#fff880" opacity="0.5" />}

            {/* Sun rays (day only) */}
            {isDay && Array.from({ length: 8 }, (_, r) => {
              const a = (r / 8) * TWO_PI;
              return <line key={r}
                x1={sx + 10 * Math.cos(a)} y1={sy + 10 * Math.sin(a)}
                x2={sx + 15 * Math.cos(a)} y2={sy + 15 * Math.sin(a)}
                stroke="#f9c800" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />;
            })}

            {/* Earth */}
            <circle cx={CX} cy={CY} r={R_EARTH} fill="#1a4a30" />
            <ellipse cx={CX + 4} cy={CY - 4} rx="7" ry="4.5" fill="#2a6a48" opacity="0.8" />
            <ellipse cx={CX - 5} cy={CY + 4} rx="5" ry="3" fill="#2a6a48" opacity="0.7" />
            <circle cx={CX} cy={CY} r={R_EARTH} fill="none" stroke="#4af0b0" strokeWidth="0.8" opacity="0.4" />

            {/* Labels */}
            <text x={CX - R_ORB - 2} y={CY + 15} textAnchor="middle"
              fontSize="7" fill="#f9a840" fontWeight="700">सूर्योदय</text>
            <text x={CX + R_ORB + 2} y={CY + 15} textAnchor="middle"
              fontSize="7" fill="#e06030" fontWeight="700">सूर्यास्त</text>
            <text x={CX} y={CY - R_ORB - 14} textAnchor="middle"
              fontSize="7" fill="#88ccff" fontWeight="700">मध्याह्न</text>
            <text x={CX} y={CY + R_ORB + 22} textAnchor="middle"
              fontSize="7" fill="#5878b0" fontWeight="700">अर्धरात्रि</text>
          </svg>
        </div>

        {/* Info panel */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          <div>
            <div className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">
              वर्तमान घडी
            </div>
            <div className="font-mono font-bold text-3xl leading-none tabular-nums">
              {toNepaliDigits(String(ghati).padStart(2, "0"))}
              <span className="text-muted-foreground/60">:</span>
              {toNepaliDigits(String(pala).padStart(2, "0"))}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">घडी : पला</div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
              <span className="text-muted-foreground">१ दिन = <b className="text-foreground">६० घडी</b></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 w-2 h-2 rounded-full bg-sky-400 flex-shrink-0" />
              <span className="text-muted-foreground">१ घडी = <b className="text-foreground">२४ मिनेट</b></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
              <span className="text-muted-foreground">१ पला = <b className="text-foreground">२४ सेकेन्ड</b></span>
            </div>
            <div className="flex items-start gap-2 mt-1 pt-1 border-t border-border">
              <span className="mt-0.5 w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-muted-foreground">दिन: <b className="text-foreground">सूर्योदय → सूर्योदय</b></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
