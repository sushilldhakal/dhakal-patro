import { useId } from "react";
import type { HoraPlanetKey } from "@/lib/hora-data";

interface PlanetIconProps {
  planet: HoraPlanetKey;
  size?: number;
}

export function PlanetIcon({ planet, size = 30 }: PlanetIconProps) {
  const uid = useId().replace(/:/g, "");
  const s = size;
  const c = s / 2;

  const grad = (id: string, a: string, b: string) => (
    <radialGradient id={id} cx="38%" cy="34%" r="72%">
      <stop offset="0%" stopColor={a} />
      <stop offset="100%" stopColor={b} />
    </radialGradient>
  );

  switch (planet) {
    case "shani":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" aria-hidden>
          <defs>{grad(`${uid}-g_sh`, "#e6c265", "#b07f1f")}</defs>
          <g transform={`rotate(-20 ${c} ${c})`}>
            <ellipse cx={c} cy={c} rx={s * 0.5} ry={s * 0.15} fill="none" stroke="#caa64e" strokeWidth={s * 0.05} opacity="0.9" />
          </g>
          <circle cx={c} cy={c} r={s * 0.3} fill={`url(#${uid}-g_sh)`} />
          <g transform={`rotate(-20 ${c} ${c})`}>
            <path
              d={`M${c - s * 0.5} ${c} a ${s * 0.5} ${s * 0.15} 0 0 0 ${s} 0`}
              fill="none"
              stroke="#e6cf86"
              strokeWidth={s * 0.05}
            />
          </g>
        </svg>
      );
    case "guru":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" aria-hidden>
          <defs>
            {grad(`${uid}-g_gu`, "#c98a4e", "#7c441c")}
            <clipPath id={`${uid}-cl_gu`}>
              <circle cx={c} cy={c} r={s * 0.36} />
            </clipPath>
          </defs>
          <circle cx={c} cy={c} r={s * 0.36} fill={`url(#${uid}-g_gu)`} />
          <g clipPath={`url(#${uid}-cl_gu)`} opacity="0.55">
            <rect x={0} y={c - s * 0.22} width={s} height={s * 0.09} fill="#8a5226" />
            <rect x={0} y={c - s * 0.04} width={s} height={s * 0.12} fill="#9c6634" />
            <rect x={0} y={c + s * 0.14} width={s} height={s * 0.08} fill="#7a431f" />
            <ellipse cx={c + s * 0.1} cy={c + s * 0.02} rx={s * 0.07} ry={s * 0.05} fill="#cf7d4a" />
          </g>
        </svg>
      );
    case "mangala":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" aria-hidden>
          <defs>
            {grad(`${uid}-g_ma`, "#e07748", "#a83a1c")}
            <clipPath id={`${uid}-cl_ma`}>
              <circle cx={c} cy={c} r={s * 0.36} />
            </clipPath>
          </defs>
          <circle cx={c} cy={c} r={s * 0.36} fill={`url(#${uid}-g_ma)`} />
          <g clipPath={`url(#${uid}-cl_ma)`} opacity="0.5" fill="#8f2f15">
            <circle cx={c - s * 0.1} cy={c - s * 0.08} r={s * 0.06} />
            <circle cx={c + s * 0.12} cy={c + s * 0.06} r={s * 0.05} />
            <circle cx={c + s * 0.02} cy={c + s * 0.16} r={s * 0.035} />
          </g>
        </svg>
      );
    case "ravi":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" aria-hidden>
          <defs>{grad(`${uid}-g_ra`, "#ffd56b", "#f08a14")}</defs>
          <g stroke="#f6a623" strokeWidth={s * 0.05} strokeLinecap="round">
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i * 30 * Math.PI) / 180;
              const r1 = s * 0.34;
              const r2 = s * 0.46;
              return (
                <line
                  key={i}
                  x1={c + Math.cos(a) * r1}
                  y1={c + Math.sin(a) * r1}
                  x2={c + Math.cos(a) * r2}
                  y2={c + Math.sin(a) * r2}
                />
              );
            })}
          </g>
          <circle cx={c} cy={c} r={s * 0.3} fill={`url(#${uid}-g_ra)`} />
        </svg>
      );
    case "shukra":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" aria-hidden>
          <defs>
            {grad(`${uid}-g_sk`, "#9fd0e8", "#3f8db5")}
            <clipPath id={`${uid}-cl_sk`}>
              <circle cx={c} cy={c} r={s * 0.36} />
            </clipPath>
          </defs>
          <circle cx={c} cy={c} r={s * 0.36} fill={`url(#${uid}-g_sk)`} />
          <g clipPath={`url(#${uid}-cl_sk)`} opacity="0.5" fill="#cfeaf6">
            <ellipse cx={c - s * 0.06} cy={c - s * 0.1} rx={s * 0.16} ry={s * 0.05} />
            <ellipse cx={c + s * 0.08} cy={c + s * 0.08} rx={s * 0.13} ry={s * 0.045} />
          </g>
        </svg>
      );
    case "budha":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" aria-hidden>
          <defs>
            {grad(`${uid}-g_bu`, "#bcc1c8", "#71767e")}
            <clipPath id={`${uid}-cl_bu`}>
              <circle cx={c} cy={c} r={s * 0.36} />
            </clipPath>
          </defs>
          <circle cx={c} cy={c} r={s * 0.36} fill={`url(#${uid}-g_bu)`} />
          <g clipPath={`url(#${uid}-cl_bu)`} opacity="0.45" fill="#5f646b">
            <circle cx={c - s * 0.08} cy={c - s * 0.06} r={s * 0.07} />
            <circle cx={c + s * 0.1} cy={c + s * 0.1} r={s * 0.05} />
            <circle cx={c + s * 0.06} cy={c - s * 0.12} r={s * 0.03} />
          </g>
        </svg>
      );
    case "soma":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" aria-hidden>
          <defs>
            {grad(`${uid}-g_so`, "#eef1f5", "#b9bfc7")}
            <clipPath id={`${uid}-cl_so`}>
              <circle cx={c} cy={c} r={s * 0.36} />
            </clipPath>
          </defs>
          <circle cx={c} cy={c} r={s * 0.36} fill={`url(#${uid}-g_so)`} />
          <g clipPath={`url(#${uid}-cl_so)`} opacity="0.4" fill="#9aa1ab">
            <circle cx={c - s * 0.09} cy={c - s * 0.05} r={s * 0.06} />
            <circle cx={c + s * 0.11} cy={c + s * 0.04} r={s * 0.045} />
            <circle cx={c + s * 0.01} cy={c + s * 0.14} r={s * 0.05} />
            <circle cx={c - s * 0.13} cy={c + s * 0.1} r={s * 0.03} />
          </g>
        </svg>
      );
  }
}
