import { memo, useId } from "react";
import earthRotatingUrl from "@/assets/earth_rotating.svg?url";

/** Mean obliquity of the ecliptic (Earth's axial tilt). */
export const EARTH_AXIAL_TILT = 23.5;

interface Props {
  cx: number;
  cy: number;
  r: number;
  glow?: boolean;
  glowClassName?: string;
  glowPad?: number;
  /** Axial tilt in degrees — applied to the asset; rotation is built into earth_rotating.svg. */
  tilt?: number;
}

/**
 * earth_rotating.svg — built-in spin; we only apply axial tilt.
 * Rendered as a native SVG <image> (clipped + rotated with SVG attributes,
 * not CSS-on-foreignObject) so it tracks the parent orbit transform exactly
 * — foreignObject + CSS transform on embedded <object> content is unreliable
 * on mobile WebKit and was the cause of Earth drifting out of place.
 * Memoized so parent orbit animation can move a translate() group without
 * reloading the embedded image every frame.
 */
export const EarthGlobeImage = memo(function EarthGlobeImage({
  cx,
  cy,
  r,
  glow = false,
  glowClassName = "ho-earth-glow",
  glowPad = 14,
  tilt = EARTH_AXIAL_TILT,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const clipId = `earth-clip-${uid}`;
  const oceanId = `earth-ocean-${uid}`;
  const d = r * 2;

  return (
    <>
      {glow && <circle cx={cx} cy={cy} r={r + glowPad} className={glowClassName} />}
      <defs>
        <radialGradient id={oceanId} cx="38%" cy="32%" r="74%">
          <stop offset="0%" stopColor="#3a86c8" />
          <stop offset="55%" stopColor="#1d5b97" />
          <stop offset="100%" stopColor="#0b2c50" />
        </radialGradient>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>

      {/* Solid globe base + simple land so Earth is always clearly visible,
          even if the animated earth_rotating.svg texture fails to load (mobile). */}
      <g clipPath={`url(#${clipId})`}>
        <circle cx={cx} cy={cy} r={r} fill={`url(#${oceanId})`} />
        <g className="earth-globe-land" transform={`rotate(${tilt} ${cx} ${cy})`}>
          <ellipse cx={cx - r * 0.28} cy={cy - r * 0.12} rx={r * 0.34} ry={r * 0.24} />
          <ellipse cx={cx + r * 0.26} cy={cy + r * 0.22} rx={r * 0.3} ry={r * 0.2} />
          <ellipse cx={cx + r * 0.1} cy={cy - r * 0.38} rx={r * 0.16} ry={r * 0.12} />
          <ellipse cx={cx - r * 0.34} cy={cy + r * 0.36} rx={r * 0.14} ry={r * 0.1} />
        </g>
        <image
          href={earthRotatingUrl}
          x={cx - r}
          y={cy - r}
          width={d}
          height={d}
          transform={`rotate(${tilt} ${cx} ${cy})`}
          className="earth-globe-object"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        />
      </g>
      <circle cx={cx} cy={cy} r={r} fill="none" className="earth-globe-rim" />
    </>
  );
});
