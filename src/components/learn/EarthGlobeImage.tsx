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
  const clipId = `earth-clip-${useId().replace(/:/g, "")}`;
  const d = r * 2;

  return (
    <>
      {glow && <circle cx={cx} cy={cy} r={r + glowPad} className={glowClassName} />}
      <clipPath id={clipId}>
        <circle cx={cx} cy={cy} r={r} />
      </clipPath>
      <image
        href={earthRotatingUrl}
        x={cx - r}
        y={cy - r}
        width={d}
        height={d}
        clipPath={`url(#${clipId})`}
        transform={`rotate(${tilt} ${cx} ${cy})`}
        className="earth-globe-object"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      />
    </>
  );
});
