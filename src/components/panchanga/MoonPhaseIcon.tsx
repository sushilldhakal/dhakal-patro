import { moonPhaseLitPath, normElongation } from "@/lib/moon-phase-svg";

interface MoonPhaseIconProps {
  /** Moon–sun elongation in degrees (0° new, 180° full). */
  elongation: number;
  r: number;
}

export function MoonPhaseIcon({ elongation, r }: MoonPhaseIconProps) {
  const e = normElongation(elongation);
  return (
    <g>
      <circle cx="0" cy="0" r={r} fill="#11181c" stroke="#4a5a60" strokeWidth="0.8" />
      {e > 2 && e < 358 && <path d={moonPhaseLitPath(elongation, r)} fill="#eef3f1" />}
    </g>
  );
}
