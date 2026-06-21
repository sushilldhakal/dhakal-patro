import { memo } from "react";
import earthRotatingUrl from "@/assets/earth_rotating.svg?url";

/** Mean obliquity of the ecliptic (Earth's axial tilt). */
export const EARTH_AXIAL_TILT = 23.5;

const XHTML = "http://www.w3.org/1999/xhtml";

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
 * Memoized so parent orbit animation can move a translate() group without
 * reloading the embedded <object> every frame.
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
  const d = r * 2;

  return (
    <>
      {glow && <circle cx={cx} cy={cy} r={r + glowPad} className={glowClassName} />}
      <foreignObject
        x={cx - r}
        y={cy - r}
        width={d}
        height={d}
        className="earth-globe-fo"
      >
        <div
          {...({ xmlns: XHTML } as Record<string, string>)}
          className="earth-globe-tilt"
          style={{ transform: `rotateZ(${tilt}deg)` }}
        >
          <object
            data={earthRotatingUrl}
            type="image/svg+xml"
            className="earth-globe-object"
            aria-hidden="true"
          />
        </div>
      </foreignObject>
    </>
  );
});
