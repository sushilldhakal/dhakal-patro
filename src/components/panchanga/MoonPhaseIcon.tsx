const DEG = Math.PI / 180;

function normDeg(d: number): number {
  return ((d % 360) + 360) % 360;
}

function moonPhasePath(E: number, r: number): string {
  const e = normDeg(E);
  const rx = Math.abs(Math.cos(e * DEG)) * r;
  const litRight = e <= 180;
  const gibbous = e > 90 && e < 270;
  const outerSweep = litRight ? 1 : 0;
  const termSweep = litRight ? (gibbous ? 1 : 0) : gibbous ? 0 : 1;
  return `M0,${-r} A${r},${r} 0 0 ${outerSweep} 0,${r} A${rx.toFixed(2)},${r} 0 0 ${termSweep} 0,${-r} Z`;
}

interface MoonPhaseIconProps {
  /** Moon–sun elongation in degrees (0° new, 180° full). */
  elongation: number;
  r: number;
}

export function MoonPhaseIcon({ elongation, r }: MoonPhaseIconProps) {
  const e = normDeg(elongation);
  return (
    <g>
      <circle cx="0" cy="0" r={r} fill="#11181c" stroke="#4a5a60" strokeWidth="0.8" />
      {e > 2 && e < 358 && <path d={moonPhasePath(elongation, r)} fill="#eef3f1" />}
    </g>
  );
}
