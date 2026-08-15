/**
 * What the playground shows, per Learn topic.
 *
 * One scene serves every topic — building a bespoke 3D scene per article would
 * mean seventy of them. What changes is the *configuration*: which layers open
 * on, what the play button actually moves, and where the camera starts. So a
 * topic about the day opens spinning the planet with the day-arcs showing,
 * while one about sankranti opens creeping round the rashi belt with the arcs
 * off and the Sun's sightline lit.
 *
 * Every control stays reachable in all of them. The config only decides where
 * a reader *starts*, so the article's own subject is what is on screen first
 * and everything else is one chip away.
 *
 * Adding a topic is one entry here. A topic with no entry gets no playground,
 * which is the right default for the ones the sim cannot honestly illustrate.
 */

import type { CameraState, SimParams, SimToggles } from "@/components/learn/DaySimScene";

/**
 * What the play button animates.
 *
 * The distinction is what the reader is meant to watch, and each one runs the
 * clock at a rate that makes that motion legible — a year that takes a minute
 * makes the planet's spin a useless blur, and a spin slow enough to follow
 * makes the orbit look frozen.
 */
export type PlaygroundMode =
  /** Spin: a few rotations per orbit, so the extra turn is enormous. */
  | "day"
  /** Orbit: one lap in about half a minute, spin too fast to follow. */
  | "year"
  /** The Sun's track along the belt — sankranti to sankranti. */
  | "sun"
  /** The Sun leaving the equator and coming back — the tilt's own signature. */
  | "tilt";

export interface PlaygroundConfig {
  mode: PlaygroundMode;
  /** Layers open on load. Anything unset falls back to the mode's own default. */
  layers?: Partial<SimToggles>;
  params?: Partial<SimParams>;
  camera?: Partial<CameraState>;
}

const DEG = Math.PI / 180;

/** Layer sets each mode starts from, before a topic's own overrides. */
export const MODE_LAYERS: Record<PlaygroundMode, SimToggles> = {
  day: {
    grid: false,
    planetOrbit: true,
    sunOrbit: false,
    trueSun: true,
    meanSun: true,
    eotWedge: true,
    siderealArc: true,
    solarArc: true,
    meanArc: true,
    primeMeridian: true,
    rashiBelt: false,
    nakshatraBelt: false,
    monthRing: false,
    sightline: false,
    moon: false,
    moonTrail: false,
    moonLap: false,
    moonSightline: false,
  },
  year: {
    grid: false,
    planetOrbit: true,
    sunOrbit: false,
    trueSun: true,
    meanSun: false,
    eotWedge: false,
    siderealArc: false,
    solarArc: false,
    meanArc: false,
    primeMeridian: false,
    rashiBelt: true,
    nakshatraBelt: false,
    monthRing: true,
    sightline: true,
    moon: true,
    moonTrail: true,
    moonLap: true,
    moonSightline: true,
  },
  sun: {
    grid: false,
    planetOrbit: true,
    sunOrbit: false,
    trueSun: true,
    meanSun: false,
    eotWedge: false,
    siderealArc: false,
    solarArc: false,
    meanArc: false,
    primeMeridian: false,
    rashiBelt: true,
    nakshatraBelt: true,
    monthRing: true,
    sightline: true,
    moon: false,
    moonTrail: false,
    moonLap: false,
    moonSightline: false,
  },
  tilt: {
    grid: true,
    planetOrbit: true,
    sunOrbit: true,
    trueSun: true,
    meanSun: true,
    eotWedge: true,
    siderealArc: false,
    solarArc: false,
    meanArc: false,
    primeMeridian: false,
    rashiBelt: true,
    nakshatraBelt: false,
    monthRing: true,
    sightline: false,
    moon: false,
    moonTrail: false,
    moonLap: false,
    moonSightline: false,
  },
};

/**
 * Base pace per mode, in sidereal rotations of simulated time per real second.
 *
 * These are absolute rotation rates, and the modes disagree wildly about how
 * many rotations a year holds — nine in the day mode, 366 in the belt ones. So
 * the speed rungs in the UI multiply *this*, rather than setting a rate
 * directly: rung 2 is always "the pace this topic wants", and the others are
 * relative to it. A single absolute ladder would be a crawl in one mode and a
 * strobe in another.
 */
export const MODE_SPEED: Record<PlaygroundMode, number> = {
  day: 0.2,
  /* ~30s for a full year at rung 2. */
  year: 12,
  sun: 9,
  tilt: 11,
};

/** Speed rungs, as multiples of the mode's own base pace. Rung 2 is 1×. */
export const SPEED_MULTIPLIERS = [0.25, 1, 3, 8];

/** Days per year each mode wants — small for spin, real-ish for the belt. */
export const MODE_PARAMS: Record<PlaygroundMode, SimParams> = {
  /* `daysPerYear` counts *sidereal* rotations, so it is always one more than
     the solar days the reader sets. A real year is 365 solar days and 366
     turns — which is the whole point, and what the belt modes now use. Only
     the day mode keeps a toy year, because at 365 the extra turn is a third of
     a degree and the three arcs sit on top of each other. */
  day: { daysPerYear: 9, eccentricity: 0.0167, tilt: 23.439 * DEG },
  year: { daysPerYear: 366, eccentricity: 0.0167, tilt: 23.439 * DEG },
  sun: { daysPerYear: 366, eccentricity: 0.0167, tilt: 23.439 * DEG },
  tilt: { daysPerYear: 366, eccentricity: 0.0167, tilt: 23.439 * DEG },
};

export const MODE_CAMERA: Record<PlaygroundMode, CameraState> = {
  day: { yaw: 0.2, pitch: 0.95, distance: 26 },
  year: { yaw: 0.2, pitch: 1.15, distance: 70 },
  sun: { yaw: 0.2, pitch: 1.15, distance: 76 },
  /* Low to the plane, because the whole point is the Sun rising out of it. */
  tilt: { yaw: 0.35, pitch: 0.22, distance: 62 },
};

/**
 * Topics that carry a playground, and how each one opens.
 *
 * Grouped by what the topic is actually about rather than by the Learn
 * library's own sections, because that is what decides the mode.
 */
export const PLAYGROUND_BY_SLUG: Record<string, PlaygroundConfig> = {
  /* ── the day itself ──────────────────────────────────────────────── */
  "what-is-a-day": { mode: "day" },
  "earth-rotation-day": { mode: "day" },
  "sidereal-time": { mode: "day", layers: { siderealArc: true, solarArc: false } },
  vara: { mode: "day", layers: { eotWedge: false } },
  "calc-sunrise": { mode: "day" },
  "calc-sunset": { mode: "day" },
  "time-scales": { mode: "day" },
  "mean-vs-true-motion": { mode: "day" },

  /* ── the year and the orbit ──────────────────────────────────────── */
  "solar-year": { mode: "year" },
  "nepali-calendar-basics": { mode: "year" },
  "bs-calendar": { mode: "year" },
  sauramana: { mode: "year" },
  "year-begins-baisakh": { mode: "sun" },
  "sidereal-vs-tropical": { mode: "year", layers: { nakshatraBelt: true } },
  "solar-longitude": { mode: "sun" },

  /* ── the Sun along the belt ──────────────────────────────────────── */
  sankranti: { mode: "sun" },
  "calc-sankranti": { mode: "sun" },
  "mesha-sankranti": { mode: "sun" },
  "makara-sankranti": { mode: "sun" },
  "karka-sankranti": { mode: "sun" },
  rashi: { mode: "sun" },
  "zodiac-belt": { mode: "sun" },
  nakshatra: {
    mode: "sun",
    /* The नक्षत्र a पञ्चाङ्ग names is the Moon's, so this topic opens with the
       Moon and its sightline rather than the Sun's. */
    layers: { nakshatraBelt: true, moon: true, moonSightline: true },
  },
  "calc-nakshatra": {
    mode: "sun",
    layers: { nakshatraBelt: true, moon: true, moonSightline: true },
  },
  ecliptic: { mode: "sun" },

  /* ── the tilt and what it causes ─────────────────────────────────── */
  "axial-tilt": { mode: "tilt" },
  "why-seasons": { mode: "tilt" },
  "equinox-solstice": { mode: "tilt" },
  "uttarayana-dakshinayana": { mode: "tilt" },
  declination: { mode: "tilt" },
  "celestial-equator": { mode: "tilt" },
  "ritu-drift": { mode: "tilt" },
};

export function playgroundFor(slug: string): PlaygroundConfig | undefined {
  return PLAYGROUND_BY_SLUG[slug];
}

/** The config resolved into the full state the playground opens with. */
export function resolvePlayground(config: PlaygroundConfig) {
  return {
    mode: config.mode,
    toggles: { ...MODE_LAYERS[config.mode], ...config.layers },
    params: { ...MODE_PARAMS[config.mode], ...config.params },
    camera: { ...MODE_CAMERA[config.mode], ...config.camera },
    speed: MODE_SPEED[config.mode],
  };
}
