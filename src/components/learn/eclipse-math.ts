/**
 * Sun–Earth–Moon eclipse geometry for the lunar-eclipse article.
 * Top-down-ish oblique model: the Sun→Earth→shadow axis is horizontal, the
 * Moon rides a tilted orbit ring whose two crossings of the ecliptic plane are
 * the nodes राहु (ascending) and केतु (descending). Inclination is visually
 * exaggerated (real lunar orbit ≈ 5°) so the "miss" above/below the shadow reads.
 */

const RAD = Math.PI / 180;

export const ECL = {
  W: 1240,
  H: 720,
  sunX: 122,
  axisY: 360,
  sunR: 54,
  earthX: 560,
  earthR: 46,
  moonR: 15,
  /** Moon orbit radius on screen (Earth-centred). */
  R: 190,
  /** Exaggerated orbital inclination. */
  iDeg: 22,
  /** Depth shear that fakes the 3-D tilt of the ring (front/back → left/right). */
  perspX: 0.5,
  /** Umbra converges to a point this far right of Earth. */
  umbraLen: 620,
  /** How far right we actually paint the diverging penumbra. */
  penumbraLen: 600,
  penumbraSlope: 0.09,
} as const;

const SIN_I = Math.sin(ECL.iDeg * RAD);
const COS_I = Math.cos(ECL.iDeg * RAD);

export interface MoonGeo {
  xEc: number;
  yEc: number;
  zEc: number;
  sx: number;
  sy: number;
  /** Elongation 0°=new(अमावस्या) … 180°=full(पूर्णिमा). */
  E: number;
  /** Latitude above/below the ecliptic, degrees (exaggerated model). */
  betaDeg: number;
  /** Distance from the shadow axis (px). */
  radial: number;
  /** Distance down-shadow from Earth (px); negative = sunward. */
  axial: number;
}

/**
 * Moon position for argument-of-latitude `u` (deg from ascending node) and
 * ascending-node longitude `omega` (deg from the Sun→shadow axis).
 */
export function moonGeo(u: number, omega: number): MoonGeo {
  const ur = u * RAD;
  const Om = omega * RAD;
  const cu = Math.cos(ur);
  const su = Math.sin(ur);
  const xEc = Math.cos(Om) * cu - Math.sin(Om) * su * COS_I;
  const yEc = Math.sin(Om) * cu + Math.cos(Om) * su * COS_I;
  const zEc = su * SIN_I;
  const sx = ECL.earthX + ECL.R * xEc + ECL.R * yEc * ECL.perspX;
  const sy = ECL.axisY - ECL.R * zEc;
  const E = (((Math.atan2(yEc, xEc) / RAD - 180) % 360) + 360) % 360;
  return {
    xEc,
    yEc,
    zEc,
    sx,
    sy,
    E,
    betaDeg: Math.asin(Math.max(-1, Math.min(1, zEc))) / RAD,
    radial: ECL.R * Math.hypot(yEc, zEc),
    axial: ECL.R * xEc,
  };
}

export type EclipseStatus = "total" | "partial" | "penumbral" | "none";

export function umbraHalfWidth(axial: number): number {
  if (axial <= 0 || axial >= ECL.umbraLen) return 0;
  return ECL.earthR * (1 - axial / ECL.umbraLen);
}
export function penumbraHalfWidth(axial: number): number {
  if (axial <= 0) return 0;
  return ECL.earthR + ECL.penumbraSlope * axial;
}

export function lunarEclipseStatus(g: MoonGeo): EclipseStatus {
  if (g.xEc <= 0.2) return "none"; // sunward half — no lunar eclipse
  const uh = umbraHalfWidth(g.axial);
  const ph = penumbraHalfWidth(g.axial);
  if (g.radial + ECL.moonR * 0.5 < uh) return "total";
  if (g.radial - ECL.moonR < uh) return "partial";
  if (g.radial - ECL.moonR * 0.4 < ph) return "penumbral";
  return "none";
}

/** New-moon at a node → the Moon's shadow touches Earth (solar eclipse). */
export function isSolarAlignment(g: MoonGeo): boolean {
  return g.xEc < -0.2 && g.radial < ECL.earthR * 0.9;
}
