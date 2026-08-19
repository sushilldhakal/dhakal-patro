/**
 * Static sky furniture, expressed once in ecliptic / horizon coordinates.
 *
 * None of this moves with time: the zodiac band is always 12 × 30° of ecliptic
 * longitude and the alt-az grid is always fixed to the observer. Only the
 * *mapping* onto the dome changes each frame, so the vertices are built once
 * here and transformed in the render loop.
 */

import { NAKSHATRA_ARC, RASHI_ARC } from "@/lib/sky3d/geocentric-model";

/** A point on the celestial sphere in ecliptic coordinates, degrees. */
export type eclipticPoint = { lon: number; lat: number };
/** A point in the observer's horizon frame, degrees. */
export type HorizonPoint = { alt: number; az: number };

/**
 * Half-width of the zodiac, ±9° about the ecliptic — the Sun's own path, with
 * room either side for every graha's shara. Rashi and nakshatra divide exactly
 * the same band: 12 ways and 27 ways.
 */
export const RASHI_BAND_LAT = 9;
export const NAK_BAND_LAT = 9;

/** Where the rashi name sits, in ecliptic latitude — just inside the north edge. */
export const RASHI_LABEL_LAT = 6.4;
/** Where the nakshatra name sits — inside the south edge, so the two never collide. */
export const NAK_LABEL_LAT = -6.4;

/** Points per full circle for the smooth band edges. */
const EDGE_STEPS = 180;

function edge(lat: number): eclipticPoint[] {
  return Array.from({ length: EDGE_STEPS + 1 }, (_, i) => ({
    lon: (i / EDGE_STEPS) * 360,
    lat,
  }));
}

/** The four long edges of the two bands, plus the ecliptic itself. */
export const BAND_EDGES = {
  rashiOuter: edge(RASHI_BAND_LAT),
  rashiInner: edge(-RASHI_BAND_LAT),
  nakOuter: edge(NAK_BAND_LAT),
  nakInner: edge(-NAK_BAND_LAT),
  ecliptic: edge(0),
};

/** Line-segment pairs, flattened: [a0, b0, a1, b1, …]. */
export type SegmentPairs = eclipticPoint[];

function dividers(count: number, halfLat: number): SegmentPairs {
  const out: SegmentPairs = [];
  for (let i = 0; i < count; i += 1) {
    const lon = (360 / count) * i;
    out.push({ lon, lat: -halfLat }, { lon, lat: halfLat });
  }
  return out;
}

/** The 12 rashi boundaries, drawn across the full width of the zodiac band. */
export const RASHI_DIVIDERS: SegmentPairs = dividers(12, RASHI_BAND_LAT);

/** The 27 nakshatra boundaries, across the inner strip. */
export const NAKSHATRA_DIVIDERS: SegmentPairs = dividers(27, NAK_BAND_LAT);

/** The 108 pada boundaries, as short ticks off the ecliptic. */
export const PADA_TICKS: SegmentPairs = (() => {
  const out: SegmentPairs = [];
  const arc = NAKSHATRA_ARC / 4;
  for (let i = 0; i < 108; i += 1) {
    if (i % 4 === 0) continue; // the nakshatra boundary itself is already drawn
    const lon = arc * i;
    out.push({ lon, lat: -3 }, { lon, lat: 3 });
  }
  return out;
})();

/**
 * A degree scale along the ecliptic: a tick every degree, longer every five,
 * longer still at each rashi boundary — the ruler that runs down the middle of
 * the band in a star atlas.
 */
export const DEGREE_TICKS: SegmentPairs = (() => {
  const out: SegmentPairs = [];
  for (let lon = 0; lon < 360; lon += 1) {
    const inRashi = lon % RASHI_ARC;
    const length = inRashi === 0 ? 2.6 : lon % 5 === 0 ? 1.6 : 0.9;
    out.push({ lon, lat: 0 }, { lon, lat: length });
  }
  return out;
})();

/**
 * The alt-az cage, one tier per zoom band.
 *
 * The whole web cannot be on screen at once: a 1° cage over a 90° sky is a
 * grey wash, and over a 240° sky it packs into a ball at the zenith and hides
 * the belt. So the cage is built once as four fixed layers and each is shown
 * only under its own field of view — 10° opens, then 5°, then 2°, then 1° as
 * the lens tightens, each layer skipping the degrees a coarser one already
 * draws so no line is drawn twice.
 *
 * `maxFov` is exclusive: the tier is on while the vertical field is *below*
 * it. Ordered coarse to fine.
 */
export type GridTier = {
  /** Spacing in degrees, both in altitude and in azimuth. */
  step: number;
  /** Shown while the vertical field of view is under this, degrees. */
  maxFov: number;
  /** Degrees a coarser tier already draws — left out of this one. */
  skipMultiplesOf: number[];
  /** Fainter as the tiers get finer, so the round lines still read. */
  opacity: number;
};

export const GRID_TIERS: readonly GridTier[] = [
  { step: 10, maxFov: 85, skipMultiplesOf: [], opacity: 0.58 },
  { step: 5, maxFov: 50, skipMultiplesOf: [10], opacity: 0.4 },
  { step: 2, maxFov: 30, skipMultiplesOf: [10], opacity: 0.28 },
  { step: 1, maxFov: 18, skipMultiplesOf: [2, 5], opacity: 0.2 },
];

/**
 * The finest spacing the cage is drawing at this field of view, degrees, or 0
 * at the opening sky where no tier is on yet.
 */
export function gridStepForFov(fovDeg: number): number {
  let step = 0;
  for (const tier of GRID_TIERS) {
    if (fovDeg < tier.maxFov) step = tier.step;
  }
  return step;
}

/**
 * Disconnected segment pairs for the azimuth cage. `skipMultiplesOf` leaves
 * those degrees to a coarser layer so 10° / 5° / 2° / 1° can sit on top of
 * each other without drawing the same line twice.
 */
export function buildAzimuthGridPairs(
  step: number,
  skipMultiplesOf: readonly number[] = [],
): HorizonPoint[] {
  const skip = (v: number) => skipMultiplesOf.some((m) => v % m === 0);
  const circleSteps = step <= 1 ? 240 : 180;
  const verticalSteps = step <= 1 ? 180 : 72;
  const pairs: HorizonPoint[] = [];
  for (let alt = -90 + step; alt <= 90 - step; alt += step) {
    if (skip(alt)) continue;
    for (let i = 0; i < circleSteps; i += 1) {
      pairs.push(
        { alt, az: (i / circleSteps) * 360 },
        { alt, az: ((i + 1) / circleSteps) * 360 },
      );
    }
  }
  for (let az = 0; az < 360; az += step) {
    if (skip(az)) continue;
    for (let i = 0; i < verticalSteps; i += 1) {
      pairs.push(
        { alt: -90 + (i / verticalSteps) * 180, az },
        { alt: -90 + ((i + 1) / verticalSteps) * 180, az },
      );
    }
  }
  return pairs;
}

/**
 * Azimuth grid: almucantars every 10° of altitude and verticals every 10° of
 * azimuth — the green cage Stellarium draws over the local sky.
 *
 * Verticals run zenith to nadir so they really do meet at one point when you
 * look up; almucantars skip the poles (a circle of radius zero) and include
 * the horizon. Both hemispheres, so क्षितिजमुनि off still has a cage underfoot.
 */
export const GRID_LINES: HorizonPoint[][] = (() => {
  const lines: HorizonPoint[][] = [];
  for (let alt = -80; alt <= 80; alt += 10) {
    const steps = alt === 0 ? 180 : 144;
    lines.push(Array.from({ length: steps + 1 }, (_, i) => ({ alt, az: (i / steps) * 360 })));
  }
  for (let az = 0; az < 360; az += 10) {
    lines.push(
      Array.from({ length: 73 }, (_, i) => ({ alt: -90 + (i / 72) * 180, az })),
    );
  }
  return lines;
})();

/* ── the Earth globe ───────────────────────────────────────────────────── */

/** A point on the Earth's surface, degrees. */
export type GeoPoint = { lat: number; lon: number };

/**
 * The obliquity the tropics are *built* at — near enough for any sky within a
 * lifetime of now. The scene rewrites the two circles to the live value when
 * the clock travels far enough for the difference to show, which on this axis
 * is most of a degree.
 */
export const TROPIC_LAT = 23.44;

function parallel(lat: number, steps = 120): GeoPoint[] {
  return Array.from({ length: steps + 1 }, (_, i) => ({ lat, lon: (i / steps) * 360 }));
}

function meridian(lon: number, steps = 60): GeoPoint[] {
  return Array.from({ length: steps + 1 }, (_, i) => ({ lat: -90 + (i / steps) * 180, lon }));
}

/** Parallels every 15°, minus the ones drawn in their own colour. */
export const GLOBE_PARALLELS: GeoPoint[][] = (() => {
  const out: GeoPoint[][] = [];
  for (let lat = -75; lat <= 75; lat += 15) {
    if (lat === 0) continue;
    out.push(parallel(lat));
  }
  return out;
})();

/** Meridians every 15° of longitude. */
export const GLOBE_MERIDIANS: GeoPoint[][] = Array.from({ length: 24 }, (_, i) =>
  meridian(i * 15),
);

/** The equator — where the Sun stands at both sampat (equinox) points. */
export const GLOBE_EQUATOR: GeoPoint[] = parallel(0, 180);

/**
 * The two tropics: the northern limit the Sun reaches at Karka Sankranti and
 * the southern limit at Makara Sankranti. Uttarayana is the half-year the
 * subsolar point spends climbing from one to the other.
 */
export const GLOBE_TROPICS: { lat: number; id: "cancer" | "capricorn"; points: GeoPoint[] }[] = [
  { lat: TROPIC_LAT, id: "cancer", points: parallel(TROPIC_LAT) },
  { lat: -TROPIC_LAT, id: "capricorn", points: parallel(-TROPIC_LAT) },
];

/**
 * The four turning points of the Sun's year, by tropical longitude: the two
 * sampat where it crosses the equator and the two ayana ends where it turns.
 */
export const SOLAR_STATIONS: {
  id: string;
  tropicalLon: number;
  ne: string;
  en: string;
}[] = [
  { id: "vasanta", tropicalLon: 0, ne: "वसन्त सम्पात", en: "Vernal equinox" },
  { id: "karka", tropicalLon: 90, ne: "कर्क संक्रान्ति · उत्तरायणान्त", en: "Summer solstice" },
  { id: "sharad", tropicalLon: 180, ne: "शरद् सम्पात", en: "Autumn equinox" },
  { id: "makara", tropicalLon: 270, ne: "मकर संक्रान्ति · उत्तरायण आरम्भ", en: "Winter solstice" },
];

/** Azimuth readings that get a degree label on the horizon. */
export const GRID_AZIMUTH_LABELS = Array.from({ length: 36 }, (_, i) => i * 10);

/** The eight compass points, with the four cardinals called out. */
export const COMPASS_POINTS: { az: number; en: string; ne: string; major: boolean }[] = [
  { az: 0, en: "N", ne: "उ", major: true },
  { az: 45, en: "NE", ne: "ईशान", major: false },
  { az: 90, en: "E", ne: "पू", major: true },
  { az: 135, en: "SE", ne: "आग्नेय", major: false },
  { az: 180, en: "S", ne: "द", major: true },
  { az: 225, en: "SW", ne: "नैऋत्य", major: false },
  { az: 270, en: "W", ne: "प", major: true },
  { az: 315, en: "NW", ne: "वायव्य", major: false },
];
