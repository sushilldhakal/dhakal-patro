/**
 * The Earth / day tour: six timed chapters, then a free playground.
 *
 * Timed to the original Minute Labs "What is a Day" lab, so a voiceover
 * dropped in at `/learn/audio/<id>.mp3` will lock to the same beats. The
 * extra layers this scene already has — राशि, नक्षत्र, महिना, Moon — stay on
 * the state so later chapters can turn them on without a schema change.
 * The timed chapters leave them off; the playground can turn them on.
 */

import type { CameraState, CameraTarget, PlaygroundGlobe, SimToggles } from "@/components/learn/DaySimScene";
import { equationOfTime, PERIHELION, VERNAL } from "@/lib/sky3d/day-mechanics";
import type { Keyframe } from "./chapter-player";

const PI2 = Math.PI * 2;
const SOLAR_DAYS = 8;

export type ChapterId =
  | "welcome"
  | "stellar"
  | "solar"
  | "elliptic-orbit"
  | "axial-tilt"
  | "reality"
  | "playground";

export type ChapterSimState = {
  handsOff: boolean;
  orbitalPosition: number;
  solarDaysPerYear: number;
  tiltDeg: number;
  eccentricity: number;
  cameraTarget: CameraTarget;
  cameraFollow: boolean;
  graphOpen: boolean;
  planet: PlaygroundGlobe;
  cameraYaw: number;
  cameraPitch: number;
  cameraDistance: number;
  /** Outline a named mesh — same beats as the original lab (`stellar-day-arc`, `earth`). */
  highlight: string;
  /** Rotation angle on the globe, in degrees. */
  degrees: boolean;
} & SimToggles;

export type DayChapter = {
  id: ChapterId;
  /** i18n key under `learn.chapters.<id>` */
  titleKey: string;
  /** Optional voiceover. Missing file → the chapter runs on its own clock. */
  audio?: string;
  /** Free explore — no keyframe takeover, no snap-back. The original lab's last stop. */
  free?: boolean;
  defaults: ChapterSimState;
  frames: Keyframe<ChapterSimState>[];
};

function cam(x: number, y: number, z: number, zoom: number) {
  const horiz = Math.hypot(x, z) || 1e-6;
  return {
    cameraYaw: Math.atan2(x, z),
    cameraPitch: Math.atan2(y, horiz),
    cameraDistance: zoom,
  };
}

/** Orbital fraction that puts a given solar-day count on the meridian. */
function pos(days: number, e = 0, yRad = 0) {
  const dpy = SOLAR_DAYS + 1;
  let eot = 0;
  if (e || yRad) {
    eot = equationOfTime((days / SOLAR_DAYS) * PI2 - PERIHELION, e, yRad, PERIHELION - VERNAL);
  }
  return (days - PERIHELION / PI2 - eot / PI2) / (dpy - 1);
}

function kf(state: Partial<ChapterSimState>, meta: Keyframe<ChapterSimState>["meta"]): Keyframe<ChapterSimState> {
  return { state, meta };
}

const OFF_BELTS = {
  rashiBelt: false,
  nakshatraBelt: false,
  monthRing: false,
  sightline: false,
  moon: false,
  moonTrail: false,
  moonLap: false,
  moonSightline: false,
  axis: false,
} satisfies Partial<SimToggles>;

function base(partial: Partial<ChapterSimState>): ChapterSimState {
  return {
    handsOff: false,
    orbitalPosition: 0,
    solarDaysPerYear: SOLAR_DAYS,
    tiltDeg: 0,
    eccentricity: 0,
    cameraTarget: "planet",
    cameraFollow: false,
    graphOpen: false,
    planet: "earth",
    highlight: "",
    degrees: false,
    ...cam(-5, 20, 30, 40),
    grid: false,
    planetOrbit: true,
    sunOrbit: false,
    trueSun: true,
    meanSun: false,
    eotWedge: false,
    siderealArc: false,
    solarArc: false,
    meanArc: false,
    primeMeridian: true,
    ...OFF_BELTS,
    ...partial,
  };
}

const welcome: DayChapter = {
  id: "welcome",
  titleKey: "learn.chapters.welcome",
  audio: "/learn/audio/welcome.mp3",
  defaults: base({
    handsOff: true,
    cameraTarget: "meanSun",
    planetOrbit: false,
    primeMeridian: false,
    ...cam(0, 20, 30, 30),
  }),
  frames: [
    kf(
      {
        handsOff: false,
        meanSun: true,
        planetOrbit: true,
        eotWedge: true,
        eccentricity: 0.02,
        tiltDeg: 23.4,
        meanArc: true,
        solarArc: true,
        siderealArc: true,
        axis: true,
      },
      { at: "55s", duration: "1s" },
    ),
    kf({ orbitalPosition: 4 }, { at: "01:58", from: "54s", ease: "linear" }),
    kf({ handsOff: true }, { at: "01:58", duration: "1s" }),
  ],
};

const stellar: DayChapter = {
  id: "stellar",
  titleKey: "learn.chapters.stellar",
  audio: "/learn/audio/stellar-days.mp3",
  defaults: base({
    cameraTarget: "planet",
    siderealArc: true,
    primeMeridian: true,
    ...cam(-5, 20, 30, 40),
  }),
  frames: [
    kf(
      {
        orbitalPosition: 0,
        primeMeridian: false,
        siderealArc: false,
        trueSun: false,
        planetOrbit: false,
        degrees: false,
        highlight: "",
        eccentricity: 0,
        tiltDeg: 0,
        ...cam(-5, 20, 30, 80),
      },
      { at: 1, duration: 1 },
    ),
    kf({ orbitalPosition: 0.135 }, { at: "8s", from: 0, ease: "linear" }),
    kf({ ...cam(-5, 50, 30, 80) }, { at: "8s", duration: "1s", ease: "quadInOut" }),
    kf({ primeMeridian: true }, { at: "8s", duration: "1s" }),
    kf({ ...cam(-5, -50, 30, 80) }, { at: "13s", duration: "5s", ease: "sineInOut" }),
    kf(
      { orbitalPosition: 2 / (SOLAR_DAYS + 1), ...cam(0, 20, 0.1, 80) },
      { at: "14s", duration: "1s", ease: "quadInOut" },
    ),
    kf({ siderealArc: true, degrees: true }, { at: "15s", duration: "1s" }),
    kf({ orbitalPosition: 3 / (SOLAR_DAYS + 1) }, { at: "19s", from: "15s", ease: "quadInOut" }),
    kf({ highlight: "stellar-day-arc" }, { at: "29s", duration: 1 }),
    kf({ highlight: "" }, { at: "35s", duration: 1 }),
    kf({ orbitalPosition: 8 / (SOLAR_DAYS + 1) }, { at: "35s", from: "19s", ease: "linear" }),
    kf(
      { cameraDistance: 20, trueSun: true, planetOrbit: true },
      { at: "56s", duration: "1s", ease: "quadInOut" },
    ),
    kf({ orbitalPosition: 1 }, { at: "01:00", from: "41s", ease: "linear" }),
    kf({ orbitalPosition: 1.5 }, { at: "01:16", from: "01:11", ease: "linear" }),
    kf({ cameraDistance: 40 }, { at: "01:16", duration: "1s", ease: "quadInOut" }),
    kf({ ...cam(-5, 20, 30, 40) }, { at: "01:29", duration: "1s", ease: "sineInOut" }),
    kf({ highlight: "earth" }, { at: "01:52", duration: 1 }),
    kf({ highlight: "" }, { at: "01:58", duration: 1 }),
    kf({ handsOff: true }, { at: "03:08", from: "01:29" }),
  ],
};

const solar: DayChapter = {
  id: "solar",
  titleKey: "learn.chapters.solar",
  audio: "/learn/audio/solar-days.mp3",
  defaults: base({
    siderealArc: true,
    solarArc: true,
    primeMeridian: true,
    ...cam(-5, 20, 30, 40),
  }),
  frames: [
    kf({ orbitalPosition: pos(5) }, { at: 1, duration: 1 }),
    kf({ orbitalPosition: pos(8) }, { at: "00:20", from: 1, ease: "linear" }),
    kf({ ...cam(0, 20, 0.1, 80) }, { at: "00:22", duration: "3s", ease: "quadInOut" }),
    kf({ orbitalPosition: 1 + 1 / (SOLAR_DAYS + 1) }, { at: "00:30", from: "00:25", ease: "linear" }),
    kf(
      { orbitalPosition: 1 + 2 / (SOLAR_DAYS + 1), cameraDistance: 60 },
      { at: "00:40", from: "00:36", ease: "linear" },
    ),
    kf({ orbitalPosition: 1 + pos(2) }, { at: "00:46", from: "00:44", ease: "linear" }),
    kf({ ...cam(0, 20, 10, 40) }, { at: "00:52", from: "00:50", ease: "quadInOut" }),
    kf({ handsOff: true }, { at: "01:10", from: "00:50" }),
  ],
};

const elliptic: DayChapter = {
  id: "elliptic-orbit",
  titleKey: "learn.chapters.elliptic",
  audio: "/learn/audio/elliptic-orbit.mp3",
  defaults: base({
    cameraTarget: "sun",
    meanSun: true,
    monthRing: true,
    siderealArc: false,
    meanArc: true,
    solarArc: true,
    ...cam(0, 20, 0.1, 20),
  }),
  frames: [
    kf(
      {
        orbitalPosition: pos(5),
        meanSun: false,
        meanArc: false,
        monthRing: false,
      },
      { at: 1, duration: 1 },
    ),
    kf({ ...cam(0, 0, 20, 20) }, { at: "00:07", from: "00:05", ease: "quadInOut" }),
    kf({ ...cam(0, 20, 0.1, 20) }, { at: "00:10", from: "00:08", ease: "quadInOut" }),
    kf({ orbitalPosition: 1 + PERIHELION / PI2 }, { at: "00:20", from: 1, ease: "linear" }),
    kf({ eccentricity: 0.4 }, { at: "23s", duration: "1s", ease: "quadInOut" }),
    kf({ eccentricity: 0 }, { at: "24s", duration: "1s", ease: "quadInOut" }),
    kf({ tiltDeg: 30 }, { at: "25s", duration: "1s", ease: "quadInOut" }),
    kf({ tiltDeg: 0 }, { at: "26s", duration: "1s", ease: "quadInOut" }),
    kf({ eccentricity: 0.5 }, { at: "00:38", duration: "2s", ease: "quadInOut" }),
    kf({ orbitalPosition: 12.15 }, { at: "02:40", from: "00:43", ease: "linear" }),
    kf({ cameraTarget: "planet" }, { at: "01:21", duration: 1 }),
    kf({ trueSun: false, planetOrbit: false }, { at: "01:25", duration: 1 }),
    kf({ cameraDistance: 40 }, { at: "01:30", duration: "6s", ease: "quadInOut" }),
    kf(
      { meanSun: true, meanArc: true, solarArc: false },
      { at: "02:11", duration: 1 },
    ),
    kf({ cameraDistance: 30 }, { at: "02:29", duration: "6s", ease: "quadInOut" }),
    kf({ trueSun: true, planetOrbit: true }, { at: "02:26", duration: 1 }),
    kf({ meanSun: true, trueSun: false }, { at: "02:44", duration: 1 }),
    kf({ orbitalPosition: 13 + pos(0) }, { at: "03:02", from: "02:52", ease: "linear" }),
    kf({ trueSun: true, solarArc: true }, { at: "03:02", duration: 1 }),
    kf({ eccentricity: 0 }, { at: "03:10", duration: "1s", ease: "quadInOut" }),
    kf({ eccentricity: 0.5 }, { at: "03:13", duration: "1s", ease: "quadInOut" }),
    kf({ orbitalPosition: 13 + pos(7, 0.5) }, { at: "03:26", from: "03:13", ease: "linear" }),
    kf({ eotWedge: true }, { at: "03:27", duration: 1 }),
    kf({ orbitalPosition: 13 + pos(7) }, { at: "03:39", from: "03:37", ease: "linear" }),
    kf(
      { orbitalPosition: 14 + pos(2), cameraDistance: 20 },
      { at: "03:52", from: "03:49", ease: "quadInOut" },
    ),
    kf({ graphOpen: true }, { at: "04:03", duration: 1 }),
    kf({ handsOff: true }, { at: "04:38", from: "04:00" }),
  ],
};

const axial: DayChapter = {
  id: "axial-tilt",
  titleKey: "learn.chapters.axial",
  audio: "/learn/audio/axial-tilt.mp3",
  defaults: base({
    meanSun: true,
    monthRing: true,
    siderealArc: false,
    meanArc: true,
    solarArc: true,
    axis: true,
    ...cam(0, 20, 0.1, 20),
  }),
  frames: [
    kf({ orbitalPosition: 0, solarArc: true, meanArc: true }, { at: 1, duration: 1 }),
    kf({ ...cam(0, 0, 20, 20) }, { at: "00:05", duration: "4s", ease: "quadInOut" }),
    kf({ tiltDeg: 40, axis: true }, { at: "00:07", duration: "2s", ease: "quadInOut" }),
    kf({ cameraTarget: "meanSun" }, { at: "00:20", duration: 1 }),
    kf({ orbitalPosition: 1 }, { at: "00:34", from: "00:24", ease: "linear" }),
    kf({ ...cam(0, 10, 40, 20) }, { at: "00:38", duration: "2s", ease: "quadInOut" }),
    kf({ orbitalPosition: 1.45 }, { at: "52s", from: "00:50", ease: "quadInOut" }),
    kf({ orbitalPosition: 1.22, grid: true }, { at: "01:00", duration: "2s", ease: "quadInOut" }),
    kf({ orbitalPosition: 1.72 }, { at: "01:09", duration: "2s", ease: "quadInOut" }),
    kf(
      { eotWedge: true, ...cam(0, 20, 40, 40), grid: false },
      { at: "01:13", duration: "2s", ease: "quadInOut" },
    ),
    kf({ orbitalPosition: 2 + pos(6) }, { at: "01:30", from: "01:10", ease: "linear" }),
    kf({ ...cam(0, 40, 0.1, 40) }, { at: "01:36", duration: "2s", ease: "quadInOut" }),
    kf({ cameraTarget: "planet" }, { at: "01:38", duration: 1 }),
    kf({ orbitalPosition: 2 + pos(7) }, { at: "01:46", from: "01:42", ease: "linear" }),
    kf({ planetOrbit: false, sunOrbit: true }, { at: "01:52", duration: 1 }),
    kf({ orbitalPosition: 4 }, { at: "02:25", from: "01:57", ease: "linear" }),
    kf({ ...cam(0, 20, 40, 40) }, { at: "02:00", duration: "2s", ease: "quadInOut" }),
    kf({ ...cam(0, 40, 0.1, 40) }, { at: "02:31", duration: "2s", ease: "quadInOut" }),
    kf({ orbitalPosition: 4.1 }, { at: "02:35", from: "02:30", ease: "linear" }),
    kf({ ...cam(0, 0, 40, 40) }, { at: "02:38", duration: "1s", ease: "quadInOut" }),
    kf({ orbitalPosition: 4.3 }, { at: "02:44", from: "02:35", ease: "quadInOut" }),
    kf({ ...cam(0, 40, 0.1, 40) }, { at: "02:44", duration: "1s", ease: "quadInOut" }),
    kf({ ...cam(0.2, 40, 0.1, 40) }, { at: "02:49", duration: "3s", ease: "quadInOut" }),
    kf({ orbitalPosition: 4 + pos(3, 0, 40 * (Math.PI / 180)) }, { at: "02:54", from: "02:49", ease: "quadInOut" }),
    kf({ ...cam(40, 0.1, 0.1, 40) }, { at: "03:03", duration: "2s", ease: "quadInOut" }),
    kf({ orbitalPosition: 4 + pos(5, 0, 40 * (Math.PI / 180)) }, { at: "03:10", from: "03:04", ease: "quadInOut" }),
    kf({ ...cam(0.2, 40, 0.1, 40) }, { at: "03:10", duration: "2s", ease: "quadInOut" }),
    kf({ handsOff: true }, { at: "03:31", from: "03:20" }),
  ],
};

const reality: DayChapter = {
  id: "reality",
  titleKey: "learn.chapters.reality",
  audio: "/learn/audio/reality.mp3",
  defaults: base({
    cameraTarget: "meanSun",
    meanSun: true,
    monthRing: true,
    siderealArc: false,
    meanArc: true,
    solarArc: true,
    ...cam(0, 20, 20, 20),
  }),
  frames: [
    kf({ orbitalPosition: 0 }, { at: 1, duration: 1 }),
    kf({ eccentricity: 0.0167, eotWedge: true }, { at: "00:18", duration: "1s", ease: "quadInOut" }),
    kf({ tiltDeg: 23.439, axis: true }, { at: "00:21", duration: "1s", ease: "quadInOut" }),
    kf({ graphOpen: true }, { at: "00:26", duration: 1 }),
    kf({ orbitalPosition: 2 + 356 / 365 }, { at: "00:40", from: 1, ease: "linear" }),
    kf(
      { ...cam(20, 30, 0.1, 30), cameraFollow: true },
      { at: "00:43", duration: "2s", ease: "quadInOut" },
    ),
    kf({ orbitalPosition: 3 + 356 / 365 }, { at: "01:08", from: "00:42", ease: "linear" }),
    kf({ orbitalPosition: 3 + 259 / 365 }, { at: "01:15", duration: "4s", ease: "quadInOut" }),
    kf({ cameraFollow: false }, { at: "01:21", duration: 1 }),
    kf({ ...cam(0.1, 30, 20, 20) }, { at: "01:22", duration: "1s", ease: "quadInOut" }),
    kf({ orbitalPosition: 5 }, { at: "02:00", from: "01:20", ease: "linear" }),
    kf({ graphOpen: false }, { at: "02:00", duration: 1 }),
    kf({ cameraFollow: true }, { at: "02:03", duration: 1 }),
    kf(
      { ...cam(20, 0.1, 0.1, 40), planetOrbit: false, eotWedge: false },
      { at: "02:07", duration: "2s", ease: "quadInOut" },
    ),
    kf({ orbitalPosition: 8 }, { at: "02:39", from: "02:12", ease: "linear" }),
    kf({ eccentricity: 0.0934, tiltDeg: 25.19, planet: "mars" }, { at: "02:42", duration: "1s" }),
    kf({ orbitalPosition: 10 }, { at: "03:00", from: "02:42", ease: "linear" }),
    kf(
      {
        ...cam(0, 30, 20, 30),
        cameraFollow: false,
        planetOrbit: true,
        eotWedge: true,
        planet: "earth",
        eccentricity: 0.0167,
        tiltDeg: 23.439,
      },
      { at: "03:02", duration: "2s", ease: "quadInOut" },
    ),
    kf({ handsOff: true }, { at: "03:45", from: "03:02" }),
  ],
};

/** Same opening as the original lab's /playground — free camera, no snap-back. */
const playground: DayChapter = {
  id: "playground",
  titleKey: "learn.chapters.playground",
  free: true,
  defaults: base({
    handsOff: true,
    orbitalPosition: 1,
    solarDaysPerYear: 9,
    eccentricity: 0.0167,
    tiltDeg: 23.439,
    cameraTarget: "meanSun",
    planetOrbit: true,
    trueSun: true,
    meanSun: true,
    eotWedge: true,
    siderealArc: false,
    solarArc: true,
    meanArc: true,
    primeMeridian: true,
    ...cam(0, 20, 0.1, 20),
  }),
  frames: [],
};

/** The tour, in order. Push more chapters onto this list later. */
export const DAY_CHAPTERS: DayChapter[] = [
  welcome,
  stellar,
  solar,
  elliptic,
  axial,
  reality,
  playground,
];

export function chapterIndex(id: ChapterId): number {
  return Math.max(0, DAY_CHAPTERS.findIndex((c) => c.id === id));
}

export function cameraFromChapter(s: ChapterSimState): CameraState {
  return { yaw: s.cameraYaw, pitch: s.cameraPitch, distance: s.cameraDistance };
}

export function togglesFromChapter(s: ChapterSimState): SimToggles {
  return {
    grid: s.grid,
    planetOrbit: s.planetOrbit,
    sunOrbit: s.sunOrbit,
    trueSun: s.trueSun,
    meanSun: s.meanSun,
    eotWedge: s.eotWedge,
    siderealArc: s.siderealArc,
    solarArc: s.solarArc,
    meanArc: s.meanArc,
    primeMeridian: s.primeMeridian,
    axis: s.axis,
    rashiBelt: s.rashiBelt,
    nakshatraBelt: s.nakshatraBelt,
    monthRing: s.monthRing,
    sightline: s.sightline,
    moon: s.moon,
    moonTrail: s.moonTrail,
    moonLap: s.moonLap,
    moonSightline: s.moonSightline,
  };
}
