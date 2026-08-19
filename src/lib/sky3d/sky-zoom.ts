/**
 * What zoom means in each of the sky's three views, and what a drag is worth
 * once it has been applied.
 *
 * Its own module because both halves of the sky need it and they are different
 * components: the scene places the lens with it, and the pointer handlers up in
 * the shell size their drags by it.
 */

/** Which of the three views the sky is showing. */
export type SkyMode = "space" | "horizon" | "globe";

/** अन्तरिक्ष's lens, which zoom never touches — it moves the camera instead. */
export const SPACE_FOV = 46;

/** The Earth globe's own radius, and the ring of zodiac that hugs it. */
export const GLOBE_R = 30;
export const GLOBE_BAND_R = GLOBE_R * 1.42;
/** How far back the globe camera is parked. It never moves; the lens narrows. */
export const GLOBE_CAM_R = 300;
/** The zoom value at which the globe view is framed at its widest. */
export const OUTSIDE_ZOOM_MAX = 120;

const DEG = Math.PI / 180;

/**
 * The vertical field of view a zoom value lands on, in degrees.
 *
 * The camera branches are the only things that need this to *place* the lens —
 * but the drag handlers need it too, to know how much sky a pixel is worth. So
 * the one mapping lives here and both callers read it.
 */
export function fovForZoom(mode: SkyMode, distance: number): number {
  /* Horizon zoom is the *vertical* field of a stereographic projection.
     Stellarium's wide view is ~235°; we open at 90° and pull out to 240° so
     the sky fills the rectangle (corners included), not a circle in a black
     frame. */
  if (mode === "horizon") {
    const home = 26;
    const minD = 0.35;
    const maxD = 120;
    if (distance <= home) {
      const t = Math.min(1, Math.max(0, (distance - minD) / (home - minD)));
      /* The tight end is 4°, about eight times a full Moon across the frame —
         close enough to separate a graha from the star it is passing, which
         12° was not. The cage follows it down to a half-degree so the crop
         still has a grid in it rather than two lonely lines. */
      return 4 + t * (90 - 4);
    }
    const t = Math.min(1, Math.max(0, (distance - home) / (maxD - home)));
    return 90 + t * (240 - 90);
  }
  if (mode === "globe") {
    const t = Math.min(1, Math.max(0, distance / OUTSIDE_ZOOM_MAX));
    const framed = 1.4 + Math.pow(t, 1.25) * (GLOBE_BAND_R * 2 - 1.4);
    return (2 * Math.atan(framed / GLOBE_CAM_R)) / DEG;
  }
  /* Space zooms by pulling the camera back, not by narrowing the lens, so its
     field never changes. */
  return SPACE_FOV;
}

/**
 * How far to wind back a drag at the zoom we are at, against the zoom the view
 * opened at. 1 is the opening feel; smaller is a gentler turn.
 *
 * Scaled by whatever the zoom control is actually doing in that view, which is
 * not the same thing in all three. The dome and the globe narrow the lens, so
 * the field of view is the measure, and the scaling keeps a drag worth a fixed
 * fraction of the *screen*: flick the same distance and the same amount of what
 * you can see goes past, whether that is a 240° sky or a 12° crop. Without
 * it, pushing in to the crop turns a nudge into twenty times as much sky, and
 * looking slightly left throws whatever you were inspecting out of frame.
 *
 * अन्तरिक्ष holds its lens still and moves the camera instead, so there the
 * measure is the distance: pushed in among the inner grahas, an orbit that was
 * a comfortable swing around the whole system throws you round the Sun.
 *
 * Floored well above zero so the tightest zoom still answers to a drag at all,
 * and capped at 1 so nothing ever turns faster than it did before.
 */
export function dragScaleForZoom(
  mode: SkyMode,
  distance: number,
  homeDistance: number,
): number {
  const ratio =
    mode === "space"
      ? distance / homeDistance
      : fovForZoom(mode, distance) / fovForZoom(mode, homeDistance);
  return Math.min(1, Math.max(0.12, ratio));
}
