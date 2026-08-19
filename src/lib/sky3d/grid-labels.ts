/**
 * The numbers on the alt-az cage — the ruler down the edges of the क्षितिज frame.
 *
 * A label belongs where a grid line *leaves* the picture, not wherever a
 * sample of that line happens to fall near an edge. The difference matters:
 * an almucantar runs almost parallel to the bottom of the frame, so sampling
 * it and keeping every sample inside the bottom band stamps “−40°” sixteen
 * times across the width. What we want is one “−40°” where that circle crosses
 * the left border and one where it crosses the right.
 *
 * So each line is walked as a polyline and intersected with the four borders
 * of an inset rectangle, at most once per border. Three further rules keep the
 * result readable at any zoom:
 *
 * - **Only the lines that can reach the frame are walked.** The visible sky is
 *   a cone of {@link horizonConeRadiusDeg} about the view centre; almucantars
 *   outside that band in altitude, and verticals outside it in azimuth, are
 *   skipped before a single point is projected. At a 12° crop that is a dozen
 *   lines instead of five hundred.
 * - **Labels are spaced by pixels, not by degrees.** The interval is the
 *   coarsest of 1/2/5/10/15/30/45/90 that still leaves room on screen, so
 *   pushing in adds numbers as the cage adds lines and never before.
 * - **When two would collide the rounder one wins.** Candidates are sorted by
 *   how round the degree is (90 before 30 before 10 before 5 before 2 before
 *   the rest) and then laid down only if nothing sits within a text's width of
 *   them, so a crowded edge thins out to 30°, 60°, 90° rather than to
 *   whichever line was walked first.
 */

import * as THREE from "three";

import { altAzToVec3 } from "@/lib/sky3d/horizon";
import { horizonConeRadiusDeg, projectHorizonRaw } from "@/lib/sky3d/horizon-projection";

const RAD = Math.PI / 180;

/**
 * Where a number is pinned. The four borders, plus the two lines of the sky
 * that carry a scale of their own: the skyline, which bearings are read off,
 * and the meridian the view is centred on, which altitudes climb.
 */
export type GridLabelSide = "left" | "right" | "top" | "bottom" | "horizon" | "meridian";

export type GridLabel = {
  id: string;
  /** An altitude above the horizon, or an azimuth from north. */
  kind: "alt" | "az";
  /** The degree the line stands for. */
  value: number;
  x: number;
  y: number;
  side: GridLabelSide;
};

/** How much of a border a single number claims, px. */
const SEP_VERTICAL = 30;
const SEP_HORIZONTAL = 40;
/** And how far apart the numbers riding the skyline and the meridian must sit. */
const SEP_HORIZON = 52;
const SEP_MERIDIAN = 26;

/** How far in from the canvas edge the ruler sits, px. */
const INSET = 17;

/** Points along one line, per line. More than this is wasted on a 40px gap. */
const SAMPLES = 72;

/** Intervals a ruler is allowed to use, coarsest last. */
const LADDER = [1, 2, 5, 10, 15, 30, 45, 90] as const;

/**
 * Smallest gap between two numbers on the same border before we thin out, px.
 *
 * Set so a 12° field over a canvas around 560px tall still ticks every 1°.
 * Tighter than that the ruler simply stays on whole degrees — the cage goes on
 * to half a degree, but half-degree numbers would want arcminutes to read
 * properly and the borders have no room for them. Nothing collides at this
 * pitch: the numbers are 12px of type, and the rectangle test is the real
 * guard.
 */
const MIN_LABEL_PITCH = 40;

/**
 * The interval the ruler ticks at: the finest rung of {@link LADDER} that is
 * both a multiple of the cage's own spacing (so every number sits on a drawn
 * line) and still {@link MIN_LABEL_PITCH} apart on screen.
 */
function labelStepFor(fovDeg: number, heightPx: number, gridStep: number): number {
  const perDeg = heightPx / Math.max(fovDeg, 1e-3);
  for (const rung of LADDER) {
    if (rung < gridStep || rung % gridStep !== 0) continue;
    if (rung * perDeg >= MIN_LABEL_PITCH) return rung;
  }
  return 90;
}

/**
 * What a number pays for being on a border that is not its own.
 *
 * Big enough to outrank roundness entirely, so the left and right borders read
 * as an altitude ruler and the top and bottom as an azimuth one, rather than
 * as the two interleaved wherever a vertical happened to cross the side of the
 * frame. A wrong-side number is still allowed — it just waits until nothing
 * else wants the spot.
 */
const WRONG_SIDE = 10;

/** How round a degree is — 0 is the roundest, and wins a contested spot. */
function roundness(deg: number): number {
  const v = Math.abs(deg);
  if (v % 90 === 0) return 0;
  if (v % 30 === 0) return 1;
  if (v % 10 === 0) return 2;
  if (v % 5 === 0) return 3;
  if (v % 2 === 0) return 4;
  return 5;
}

type Candidate = GridLabel & { rank: number; key: number };

type Frame = { xL: number; xR: number; yT: number; yB: number };

type Rect = { x: number; y: number; w: number; h: number };

/** Line height of the 9px overlay type, and the gap kept around each number. */
const TEXT_H = 12;
const TEXT_PAD = 3;

/**
 * The box a number will occupy once the overlay has hung it on its border.
 *
 * It has to agree with `gridDegreeBox` over in the sky shell — that is what
 * actually positions the text — because the corners are decided here: a
 * left-border number and a top-border number are in different lanes and only
 * a rectangle test knows they are about to sit on each other.
 */
function boxFor(c: Candidate): Rect {
  const chars = String(Math.abs(c.value)).length + (c.value < 0 ? 1 : 0) + 1;
  const w = chars * 6.2 + 2;
  if (c.side === "left") return { x: c.x + 3, y: c.y - 6, w, h: TEXT_H };
  if (c.side === "right") return { x: c.x - 3 - w, y: c.y - 6, w, h: TEXT_H };
  if (c.side === "top") return { x: c.x - w / 2, y: c.y, w, h: TEXT_H };
  if (c.side === "bottom") return { x: c.x - w / 2, y: c.y - 12, w, h: TEXT_H };
  if (c.side === "meridian") return { x: c.x + 4, y: c.y - 6, w, h: TEXT_H };
  return { x: c.x - w / 2, y: c.y - 13, w, h: TEXT_H };
}

function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x - TEXT_PAD < b.x + b.w &&
    b.x - TEXT_PAD < a.x + a.w &&
    a.y - TEXT_PAD < b.y + b.h &&
    b.y - TEXT_PAD < a.y + a.h
  );
}

/**
 * Where a polyline crosses each border, at most once per border.
 *
 * `maxJump` throws away the segment that straddles the antipode: stereographic
 * sends θ → 180° off to infinity, so two neighbouring samples either side of
 * it read as a line across the whole canvas and would plant a number on every
 * border at once.
 */
function crossings(
  points: ({ x: number; y: number } | null)[],
  frame: Frame,
  maxJump: number,
  emit: (side: Exclude<GridLabelSide, "horizon">, x: number, y: number) => void,
): void {
  const done = { left: false, right: false, top: false, bottom: false };
  for (let i = 0; i + 1 < points.length; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (Math.abs(dx) > maxJump || Math.abs(dy) > maxJump) continue;
    for (const [side, at] of [
      ["left", frame.xL],
      ["right", frame.xR],
    ] as const) {
      if (done[side] || (a.x - at) * (b.x - at) > 0) continue;
      const y = a.y + ((at - a.x) / (dx || 1e-6)) * dy;
      if (y < frame.yT || y > frame.yB) continue;
      done[side] = true;
      emit(side, at, y);
    }
    for (const [side, at] of [
      ["top", frame.yT],
      ["bottom", frame.yB],
    ] as const) {
      if (done[side] || (a.y - at) * (b.y - at) > 0) continue;
      const x = a.x + ((at - a.y) / (dy || 1e-6)) * dx;
      if (x < frame.xL || x > frame.xR) continue;
      done[side] = true;
      emit(side, x, at);
    }
  }
}

export type GridLabelParams = {
  camera: THREE.Camera;
  /** Vertical field of the stereographic projection, degrees. */
  fovDeg: number;
  width: number;
  height: number;
  /** Dome radius the cage is drawn on. */
  radius: number;
  /** Finest spacing the cage is currently drawing, degrees. 0 draws nothing. */
  gridStep: number;
  scratch: THREE.Vector3;
};

/** The numbers for one frame of the क्षितिज view, already thinned to fit. */
export function buildGridLabels({
  camera,
  fovDeg,
  width,
  height,
  radius,
  gridStep,
  scratch,
}: GridLabelParams): GridLabel[] {
  if (gridStep <= 0 || width < 80 || height < 80) return [];

  const step = labelStepFor(fovDeg, height, gridStep);
  const frame: Frame = {
    xL: INSET,
    xR: width - INSET,
    yT: INSET,
    yB: height - INSET,
  };
  const maxJump = Math.max(width, height) * 0.4;

  /* Where the lens is pointing, and how wide a cone the corners of the frame
     reach — everything outside it is skipped unprojected. */
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const centreAlt = Math.asin(Math.min(1, Math.max(-1, forward.y))) / RAD;
  const centreAz = Math.atan2(forward.x, -forward.z) / RAD;
  const cone = Math.min(179, horizonConeRadiusDeg(fovDeg, width, height) * 1.06);

  const altLo = Math.max(-89.5, centreAlt - cone);
  const altHi = Math.min(89.5, centreAlt + cone);
  /* Meridians crowd together towards the poles, so a cone that reaches high
     altitudes spans far more azimuth than it does altitude. Over-estimating is
     safe (a few lines walked for nothing); under-estimating drops numbers. */
  const reachAlt = Math.min(89, Math.max(Math.abs(altLo), Math.abs(altHi)));
  const azHalf =
    cone >= 90 || Math.abs(centreAlt) + cone >= 89
      ? 180
      : Math.min(180, cone / Math.cos(reachAlt * RAD));

  const project = (alt: number, az: number) => {
    const v = altAzToVec3(alt, az, radius);
    scratch.set(v[0], v[1], v[2]);
    return projectHorizonRaw(scratch, camera, fovDeg, width, height, scratch);
  };

  const candidates: Candidate[] = [];
  const line: ({ x: number; y: number } | null)[] = new Array(SAMPLES + 1);

  /* Almucantars — one number per border, on the left and right by preference,
     which is where a circle of equal altitude naturally leaves the frame. */
  const azSpan = azHalf * 2;
  for (
    let alt = Math.ceil(altLo / step) * step;
    alt <= altHi;
    alt += step
  ) {
    if (Math.abs(alt) >= 90) continue;
    for (let i = 0; i <= SAMPLES; i += 1) {
      line[i] = project(alt, centreAz - azHalf + (i / SAMPLES) * azSpan);
    }
    crossings(line, frame, maxJump, (side, x, y) => {
      candidates.push({
        id: `alt-${alt}-${side}`,
        kind: "alt",
        value: alt,
        x,
        y,
        side,
        key: side === "left" || side === "right" ? y : x,
        rank: roundness(alt) + (side === "left" || side === "right" ? 0 : WRONG_SIDE),
      });
    });
  }

  /* Verticals — the same, preferring the top and bottom. */
  const altSpan = altHi - altLo;
  const azFrom = Math.ceil((centreAz - azHalf) / step) * step;
  for (let az = azFrom; az <= centreAz + azHalf; az += step) {
    for (let i = 0; i <= SAMPLES; i += 1) {
      line[i] = project(altLo + (i / SAMPLES) * altSpan, az);
    }
    const value = ((az % 360) + 360) % 360;
    crossings(line, frame, maxJump, (side, x, y) => {
      candidates.push({
        id: `az-${value}-${side}`,
        kind: "az",
        value,
        x,
        y,
        side,
        key: side === "left" || side === "right" ? y : x,
        rank: roundness(value) + (side === "top" || side === "bottom" ? 0 : WRONG_SIDE),
      });
    });
  }

  /* And the ground itself: azimuth read off the skyline, where the eye looks
     for a bearing. The four cardinals already carry N/E/S/W, so their own
     degrees are left out rather than stacked under the letter. Ranked below
     the borders, so where the two meet the border keeps its number. */
  for (let az = azFrom; az <= centreAz + azHalf; az += step) {
    const value = ((az % 360) + 360) % 360;
    if (value % 90 === 0) continue;
    const hit = project(0, az);
    if (!hit) continue;
    if (hit.x < frame.xL || hit.x > frame.xR || hit.y < frame.yT || hit.y > frame.yB) continue;
    candidates.push({
      id: `az-${value}-horizon`,
      kind: "az",
      value,
      x: hit.x,
      y: hit.y,
      side: "horizon",
      key: hit.x,
      rank: roundness(value) + WRONG_SIDE * 2,
    });
  }

  /* Roundest first, then along the border, so the survivors of a crowded edge
     are the ones a reader would have picked. */
  candidates.sort((a, b) => a.rank - b.rank || a.key - b.key);

  const lanes: Record<string, number[]> = {
    left: [],
    right: [],
    top: [],
    bottom: [],
    horizon: [],
    meridian: [],
  };
  const placed: Rect[] = [];
  const out: GridLabel[] = [];
  const seen = new Set<string>();
  for (const c of candidates) {
    if (seen.has(c.id)) continue;
    const lane = lanes[c.side];
    const sep =
      c.side === "left" || c.side === "right"
        ? SEP_VERTICAL
        : c.side === "horizon"
          ? SEP_HORIZON
          : c.side === "meridian"
            ? SEP_MERIDIAN
            : SEP_HORIZONTAL;
    if (lane.some((v) => Math.abs(v - c.key) < sep)) continue;
    /* The lanes are policed one at a time, so nothing in them knows about the
       corners, where the left border's numbers and the top border's meet. One
       rectangle test over all of them catches that. */
    const box = boxFor(c);
    if (placed.some((r) => overlaps(r, box))) continue;
    lane.push(c.key);
    placed.push(box);
    seen.add(c.id);
    out.push({ id: c.id, kind: c.kind, value: c.value, x: c.x, y: c.y, side: c.side });
  }

  /* Altitudes that never reached a border.
   *
   * Pulled right out to the fisheye, an almucantar is a closed ring sitting
   * whole inside the frame — it crosses no edge, so the wide sky came out with
   * bearings all round it and not one altitude on it. Number those where the
   * meridian the view is centred on cuts them, which is where an atlas runs
   * its scale and where the eye is already looking. */
  const numbered = new Set(out.filter((l) => l.kind === "alt").map((l) => l.value));
  const spare: Candidate[] = [];
  for (let alt = Math.ceil(altLo / step) * step; alt <= altHi; alt += step) {
    if (Math.abs(alt) >= 90 || numbered.has(alt)) continue;
    const hit = project(alt, centreAz);
    if (!hit) continue;
    if (hit.x < frame.xL || hit.x > frame.xR || hit.y < frame.yT || hit.y > frame.yB) continue;
    spare.push({
      id: `alt-${alt}-meridian`,
      kind: "alt",
      value: alt,
      x: hit.x,
      y: hit.y,
      side: "meridian",
      key: hit.y,
      rank: roundness(alt),
    });
  }
  spare.sort((a, b) => a.rank - b.rank || a.key - b.key);
  for (const c of spare) {
    if (lanes.meridian.some((v) => Math.abs(v - c.key) < SEP_MERIDIAN)) continue;
    const box = boxFor(c);
    if (placed.some((r) => overlaps(r, box))) continue;
    lanes.meridian.push(c.key);
    placed.push(box);
    out.push({ id: c.id, kind: c.kind, value: c.value, x: c.x, y: c.y, side: c.side });
  }

  return out;
}
