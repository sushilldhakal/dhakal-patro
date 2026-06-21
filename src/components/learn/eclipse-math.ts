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
  /** Visually exaggerated orbital inclination (real ≈ 5.14°). */
  iDeg: 20,
  /** Depth shear that fakes the 3-D tilt of the ring (front/back → left/right). */
  perspX: 0.5,
  /** Umbra (dark cone) converges to a point this far right of Earth. */
  umbraLen: 312,
  /** Penumbra (lighter cone) converges a little farther out. */
  penumbraLen: 437,
} as const;

/** Real mean inclination — used only to print believable latitude numbers. */
export const REAL_INCL = 5.14;
export function realBeta(modelBetaDeg: number): number {
  return (modelBetaDeg * REAL_INCL) / ECL.iDeg;
}

/**
 * Eclipse thresholds are distances (px) from the shadow axis, tuned so eclipses
 * only cluster into ~2 seasons a year — independent of the (exaggerated) drawn
 * cone widths, which are sized to match these at the Moon's distance.
 */
const TH_TOTAL = 7;
const TH_PARTIAL = 18;
const TH_PENUMBRAL = 26;
const TH_SOLAR = 20;

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

/** Drawn cone half-widths (both converge), sized to match the thresholds at the Moon. */
export function umbraHalfWidth(axial: number): number {
  if (axial <= 0 || axial >= ECL.umbraLen) return 0;
  return ECL.earthR * (1 - axial / ECL.umbraLen);
}
export function penumbraHalfWidth(axial: number): number {
  if (axial <= 0 || axial >= ECL.penumbraLen) return 0;
  return ECL.earthR * (1 - axial / ECL.penumbraLen);
}

export function lunarEclipseStatus(g: MoonGeo): EclipseStatus {
  if (g.xEc <= 0.5) return "none"; // must be near the full-moon (anti-solar) point
  if (g.radial < TH_TOTAL) return "total";
  if (g.radial < TH_PARTIAL) return "partial";
  if (g.radial < TH_PENUMBRAL) return "penumbral";
  return "none";
}

/** New-moon at a node → the Moon's shadow touches Earth (solar eclipse). */
export function isSolarAlignment(g: MoonGeo): boolean {
  return g.xEc < -0.5 && g.radial < TH_SOLAR;
}

/* ------------------------------------------------------------------ */
/* Time-driven model — why eclipses cluster into ~2 seasons a year     */
/* ------------------------------------------------------------------ */

export const SYNODIC_MONTH = 29.530589;
/** Sun returns to the same node every 346.6 days (an "eclipse year"). */
export const ECLIPSE_YEAR = 346.62;
/** Node longitude (from the anti-solar/shadow axis) at day 0. */
export const NODE_START = 30;
/** One full node-line revolution in the Sun-fixed frame → two eclipse seasons. */
export const ECL_RANGE_DAYS = ECLIPSE_YEAR;

/**
 * Sun-fixed frame: the Sun stays left, the shadow stays right (anti-solar at
 * longitude 0). The Moon sweeps round synodically; the Rahu–Ketu line drifts
 * retrograde once per eclipse year. A full/new moon only meets a node when the
 * node line is pointed near the Sun–shadow axis — i.e. twice a year.
 */
export function moonLonFromDay(t: number): number {
  return (((360 * t) / SYNODIC_MONTH) % 360 + 360) % 360;
}
export function nodeOmegaFromDay(t: number): number {
  return (((NODE_START - (360 * t) / ECLIPSE_YEAR) % 360) + 360) % 360;
}

export function geoFromDay(t: number): { u: number; omega: number; g: MoonGeo } {
  const omega = nodeOmegaFromDay(t);
  const lam = moonLonFromDay(t);
  const u = (((lam - omega) % 360) + 360) % 360;
  return { u, omega, g: moonGeo(u, omega) };
}

export interface EclipseEvent {
  t: number;
  kind: "lunar" | "solar";
  status: EclipseStatus;
  betaDeg: number;
}

/** Scan a span of days and return each eclipse (deepest moment of each window). */
export function findEclipses(range = ECL_RANGE_DAYS): EclipseEvent[] {
  const out: EclipseEvent[] = [];
  let cur: { kind: "lunar" | "solar"; best: EclipseEvent } | null = null;
  const flush = () => {
    if (cur) out.push(cur.best);
    cur = null;
  };
  for (let t = 0; t <= range; t += 0.2) {
    const { g } = geoFromDay(t);
    const lunar = lunarEclipseStatus(g);
    const kind: "lunar" | "solar" | null =
      lunar !== "none" ? "lunar" : isSolarAlignment(g) ? "solar" : null;
    if (!kind) {
      flush();
      continue;
    }
    const ev: EclipseEvent = { t, kind, status: kind === "lunar" ? lunar : "total", betaDeg: g.betaDeg };
    if (!cur || cur.kind !== kind) {
      flush();
      cur = { kind, best: ev };
    } else if (Math.abs(g.betaDeg) < Math.abs(cur.best.betaDeg)) {
      cur.best = ev;
    }
  }
  flush();
  return out;
}
