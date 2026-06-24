/**
 * Tropical (sāyana) season geometry.
 *
 * The six ऋतु are defined here by the Sun's APPARENT TROPICAL longitude λ — the
 * angle measured from the moving vernal equinox — NOT by the sidereal rāśi /
 * साङ्क्रान्ति used elsewhere in the patro. That makes the season cycle track the
 * actual equinoxes and solstices:
 *
 *   λ =   0°  वसन्त   ← vernal equinox     (≈ 20 Mar)
 *   λ =  60°  ग्रीष्म   (summer solstice, 90°, falls mid-season)
 *   λ = 120°  वर्षा
 *   λ = 180°  शरद्    ← autumnal equinox   (≈ 22 Sep)
 *   λ = 240°  हेमन्त   (winter solstice, 270°, falls mid-season)
 *   λ = 300°  शिशिर
 *
 * Each ऋतु spans an equal 60° of tropical longitude. Six equal seasons cannot put
 * all four cardinal points on a boundary (60° can't hit both 0° and 90°), so the
 * two equinoxes anchor boundaries (वसन्त, शरद्) and the two solstices land in the
 * middle of ग्रीष्म and हेमन्त.
 */

const DAY = 86_400_000;
const RAD = Math.PI / 180;
/** mean rate of the Sun in tropical longitude: 360° / tropical year. */
const SUN_DEG_PER_DAY = 360 / 365.2422;

/** signed difference a−b folded into (−180°, 180°]. */
function signedAngularDiff(deg: number): number {
  return (((deg % 360) + 540) % 360) - 180;
}

/** Julian Day (UT) for a JS Date instant. */
function julianDay(date: Date): number {
  return date.getTime() / DAY + 2440587.5;
}

/**
 * Apparent geocentric longitude of the Sun (tropical), in [0, 360).
 * Meeus, "Astronomical Algorithms" ch. 25, low-accuracy series (≈ 0.01°).
 */
export function solarApparentLongitude(date: Date): number {
  const T = (julianDay(date) - 2451545.0) / 36525;
  // geometric mean longitude and mean anomaly
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * RAD;
  // equation of the centre
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M) +
    0.000289 * Math.sin(3 * M);
  const trueLong = L0 + C;
  // nutation / aberration → apparent longitude
  const omega = (125.04 - 1934.136 * T) * RAD;
  const apparent = trueLong - 0.00569 - 0.00478 * Math.sin(omega);
  return ((apparent % 360) + 360) % 360;
}

/**
 * Instant when the Sun's apparent tropical longitude equals `targetDeg`, refined
 * from an initial guess. λ rises monotonically (~0.99°/day) over the year, so a
 * fixed-rate Newton step converges in a handful of iterations.
 */
function refineCrossing(targetDeg: number, guess: Date): Date {
  let t = guess.getTime();
  for (let k = 0; k < 12; k += 1) {
    const err = signedAngularDiff(solarApparentLongitude(new Date(t)) - targetDeg);
    t -= (err / SUN_DEG_PER_DAY) * DAY;
  }
  return new Date(t);
}

export interface SeasonBoundary {
  /** 0..5 in tropical order वसन्त, ग्रीष्म, वर्षा, शरद्, हेमन्त, शिशिर. */
  slot: number;
  /** boundary tropical longitude, slot × 60°. */
  angle: number;
  /** UTC instant the Sun reaches `angle`. */
  startInstant: Date;
  isCurrent: boolean;
}

/**
 * The whole six-season cycle as seen from `now`: the current ऋतु first (its start
 * is the most recent crossing in the past), followed by the next five upcoming
 * season starts.
 */
export function tropicalSeasonCycle(now: Date): SeasonBoundary[] {
  const lambdaNow = solarApparentLongitude(now);
  const currentSlot = Math.floor(lambdaNow / 60) % 6;
  const out: SeasonBoundary[] = [];
  for (let i = 0; i < 6; i += 1) {
    const slot = (currentSlot + i) % 6;
    const angle = slot * 60;
    let offsetDeg: number;
    if (i === 0) {
      // most recent past crossing of this boundary: (−60°, 0°]
      offsetDeg = signedAngularDiff(angle - lambdaNow);
    } else {
      // i-th boundary ahead: forward distance, monotonic in i
      offsetDeg = ((angle - lambdaNow) % 360 + 360) % 360;
    }
    const guess = new Date(now.getTime() + (offsetDeg / SUN_DEG_PER_DAY) * DAY);
    out.push({ slot, angle, startInstant: refineCrossing(angle, guess), isCurrent: i === 0 });
  }
  return out;
}
