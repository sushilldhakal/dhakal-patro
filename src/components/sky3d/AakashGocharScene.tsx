/**
 * The 3D scene for Aakash Gochar — everything inside the <Canvas>.
 *
 * Two views of the same sky, both geocentric:
 *
 * • `space` — the solar system seen from outside, Earth at the centre. Grahas
 *   ride shells in the classical Moon-to-Saturn order at their true sidereal
 *   longitude and shara, so vakri loops and the belt geometry read directly.
 * • `horizon` — the sky standing over one place at one instant. Longitudes are
 *   carried through the equatorial frame into alt/az, so the rashi belt tips by
 *   the observer's latitude and swings with the hour, exactly as it does
 *   overhead. This is the view where the ecliptic is emphatically *not* flat.
 *
 * Per-frame work is deliberately imperative: positions are written straight
 * onto object refs and React only hears from the scene a few times a second,
 * via `onSample`.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EclipticWheel, BELT_INNER, BELT_OUTER, MONTH_R, NAK_INNER, NAK_OUTER } from "@/components/learn/EclipticWheel";
import type { GrahaKey } from "@/lib/graha-details";
import {
  DEG,
  eclipticToVec3,
  GRAHA_COLOR,
  NAKSHATRA_ARC,
  normalizeDeg,
  RASHI_ARC,
} from "@/lib/sky3d/geocentric-model";
import {
  altAzToVec3,
  eclipticToAltAz,
  equatorialToAltAz,
  lstDeg,
  obliquity,
  type Observer,
} from "@/lib/sky3d/horizon";
import {
  ayanamsa,
  bodyRadius,
  BODY_RADIUS,
  daysSinceJ2000,
  GEO_BODY_ORDER,
  geocentricPointAt,
  geocentricSky,
  shellRadius,
  deltaLongitude,
  type GeoBody,
  type SkyCalibration,
} from "@/lib/sky3d/orbital-model";
import {
  BAND_EDGES,
  COMPASS_POINTS,
  GLOBE_EQUATOR,
  GLOBE_MERIDIANS,
  GLOBE_PARALLELS,
  GLOBE_TROPICS,
  SOLAR_STATIONS,
  type GeoPoint,
  DEGREE_TICKS,
  buildAzimuthGridPairs,
  buildLocalGridPairs,
  CARDINAL_VERTICALS,
  gridStepForFov,
  POLE_MARKS,
  GRID_TIERS,
  LOCAL_GRID_CAPACITY,
  type HorizonPoint,
  NAK_LABEL_LAT,
  NAKSHATRA_DIVIDERS,
  PADA_TICKS,
  RASHI_DIVIDERS,
  RASHI_LABEL_LAT,
  type eclipticPoint,
} from "@/lib/sky3d/sky-geometry";
import { flattenAsterisms, precessionSinceJ2000 } from "@/lib/sky3d/nakshatra-stars";
import {
  placedPoleStars,
  poleStarEpoch,
  poleTrackPoints,
  reigningPoleStar,
} from "@/lib/sky3d/pole-stars";
import {
  SKY_TEXTURE_KEYS,
  SKY_TEXTURE_SOURCES,
  type SkyTextureKey,
} from "@/lib/sky3d/sky-textures";
import {
  fovForZoom,
  GLOBE_BAND_R,
  GLOBE_CAM_R,
  GLOBE_R,
  SPACE_FOV,
  type SkyMode,
} from "@/lib/sky3d/sky-zoom";
import {
  createHorizonFisheyeUniforms,
  horizonViewWindow,
  projectHorizonRaw,
  injectHorizonFisheyeIn,
  projectHorizon,
} from "@/lib/sky3d/horizon-projection";
import { buildGridLabels } from "@/lib/sky3d/grid-labels";
import { makeMoonMaterial, type MoonMaterial } from "@/lib/sky3d/moon-material";
import { makeEarthMaterial } from "@/lib/sky3d/earth-material";
import { applyNadirStereographicUVs, prepareKathmanduGround } from "@/lib/sky3d/terrain";
import earthToonUrl from "@/assets/graha/earth-orig.png";
import kathmanduUrl from "@/assets/kathmandu.jpeg?url";

/** Same wheel as Learn — radii come from {@link EclipticWheel}. */
export const RASHI_INNER = BELT_INNER;
export const RASHI_OUTER = BELT_OUTER;
/**
 * Month names sit in the inner half of each राशि cell, rashi names in the outer.
 *
 * Pushed to opposite edges of the band rather than either side of its middle.
 * The pair separates radially, so on the left and right of the wheel — where
 * "outward" is sideways — they were reading as one run of text, `वैशाख मेष`.
 * Four units of band between them keeps them apart at every angle.
 */
const MONTH_LABEL_R = RASHI_INNER + 0.9;
const RASHI_LABEL_R = RASHI_OUTER - 0.7;
/**
 * Stretch the classical Moon→Saturn shells so Saturn sits just inside the
 * month ring — the same inner disk the Learn polar grid occupies. Without
 * this the grahas cluster inside r≈8 while the wheel runs out to 32, and
 * they never read as being *on* the grid.
 */
const SPACE_SHELL_SCALE = MONTH_R / 9;
/**
 * How much bigger than schematic the grahas are drawn in अन्तरिक्ष.
 *
 * The shells were stretched out to the month ring but the bodies were not, so
 * zoomed out to the whole wheel every graha was a two-pixel speck on a disc six
 * hundred across — you could see *that* something was in कन्या without being
 * able to see *what*. The shells have far more room between them than the
 * bodies need, and doubling only closes the gap at a conjunction, where two
 * grahas touching is the thing being shown.
 */
const SPACE_BODY_SCALE = 2.1;
/** How far a नक्षत्र's figure is held clear of its segment's own boundaries. */
const PANEL_INSET = 0.14;
/**
 * Camera distance at or below which the belt is close enough to carry its
 * detail: the पाद numbers, and the नक्षत्र's own figure beside its name.
 *
 * Above it they are a hundred and eight numbers stacked on a ring a few hundred
 * pixels across, which is worse than not having them.
 */
export const PADA_ZOOM = 14;
const RASHI_MID = (RASHI_INNER + RASHI_OUTER) / 2;
const NAK_MID = (NAK_INNER + NAK_OUTER) / 2;

/** Radius of the horizon dome. Everything on the sky sits on it. */
const DOME = 100;

/**
 * How the landscape texture is tinted from night to day. White at noon so the
 * painted grass reads; a dim warm grey after dark so the hills are still there
 * without glowing.
 */
const GROUND_NIGHT = new THREE.Color("#3a3834");
const GROUND_DAY = new THREE.Color("#ffffff");
/**
 * Sun altitudes the ground crosses from night colour to day colour, degrees.
 *
 * Spanning the civil twilight rather than switching at the horizon: the ground
 * is still lit well after sunset and the Sun's own disc is only half up at 0°,
 * so a hard cut at zero reads as the hills changing colour in one frame.
 */
const GROUND_DUSK = -6;
const GROUND_DAWN = 4;
/** How far back the camera sits in the Earth-globe view. */

/** Radius of the Earth globe in the zoomed-out view. */
/**
 * Radius the "you are here" marker sits at — the globe's own surface, near
 * enough. Both the dot and its label are placed here, so they stay the same
 * point on the map as it turns rather than drifting apart with the parallax
 * between two different spheres.
 */
const OBSERVER_R = GLOBE_R * 1.006;
/** Radius the zodiac ring hugs the globe at. */
/** Where the globe camera sits — far enough back to read as orthographic. */
/** Bodies are tuned for the 100-unit dome; bring them down to the ring's scale. */
const GLOBE_BODY_SCALE = 0.55;

const INK_DIM = "#a7c4c3";
const RETRO = "#ef4444";
const ZODIAC = "#d8c84a";
const NAKSHATRA = "#35d05a";
const GRID = "#6fdf4a";
/**
 * The globe's own graticule. Lighter than {@link GRID}, which was picked to sit
 * on a black sky: the same blue over ocean and forest is a line you have to go
 * looking for.
 */
const GLOBE_GRID = "#a8ccf0";
const EARTH_RADIUS = 1;

/** Bodies that get a photographic texture; the nodes are not bodies at all. */
const BODY_TEXTURE: Partial<Record<GrahaKey, SkyTextureKey>> = {
  sun: "sun",
  moon: "moon",
  mercury: "mercury",
  venus: "venus",
  mars: "mars",
  jupiter: "jupiter",
  saturn: "saturn",
};

/** Apparent radii on the horizon dome — exaggerated, or they would be sub-pixel. */
const DOME_RADIUS: Record<GrahaKey, number> = {
  sun: 1.7,
  moon: 1.7,
  mercury: 0.8,
  venus: 1.0,
  mars: 0.85,
  jupiter: 1.15,
  saturn: 1.0,
  rahu: 0.7,
  ketu: 0.7,
};

export type { SkyMode };


/** What the camera is looking at. `earth` means the Earth itself / the observer. */
export type FocusKey = GrahaKey | "earth";

/** Mutable, ref-held simulation clock — advanced in `useFrame`, never in state. */
export type SimState = {
  /** Simulated instant, ms since epoch. */
  timeMs: number;
  /** Simulated seconds per real second. 1 = wall clock, 86400 = a day per second. */
  secondsPerRealSecond: number;
  playing: boolean;
};

/**
 * Ref-held camera state, so dragging never re-renders the tree.
 * In `space` view `distance` is how far the camera sits from its target; in
 * `horizon` view the observer cannot move, so it drives the field of view.
 */
export type ViewState = { yaw: number; pitch: number; distance: number };

/** A 3D anchor projected to canvas pixels, for the text overlay. */
export type ScreenLabel = {
  id: string;
  kind:
    | "rashi"
    | "nakshatra"
    | "month"
    | "graha"
    | "cardinal"
    | "azimuth"
    | "station"
    | "tropic"
    | "polestar"
    | "obliquity"
    | "axis"
    | "asterism"
    | "pada";
  /**
   * 1–12 for rashi, 1–27 for nakshatra, 1–4 for a पाद; for a pole star, 1 marks
   * the one the pole is nearest at the moment on screen.
   */
  index?: number;
  key?: GrahaKey;
  text?: string;
  /**
   * Grid degrees only: which border of the frame the number is pinned to, so
   * the overlay can hang it inside that edge instead of centring it on the
   * line and letting half of it fall off the canvas. `horizon` rides the
   * skyline itself.
   */
  side?: "left" | "right" | "top" | "bottom" | "horizon" | "meridian";
  /** Pole stars only: the Gregorian year the pole passes closest to this one. */
  year?: number;
  /** The obliquity marker: the angle it is calling out, degrees. */
  deg?: number;
  /** True when this label is not the live rashi / month / नक्षत्र. */
  dim?: boolean;
  /**
   * Horizon view: this label is under the observer's feet — the half of the
   * sphere the ground is standing in the way of. Drawn faded rather than
   * dropped, so a graha can be followed all the way round.
   */
  below?: boolean;
  x: number;
  y: number;
};

export type EclipseState = {
  kind: "solar" | "lunar";
  /** 0–1, 1 is exact node + exact syzygy. */
  mag: number;
  node: "rahu" | "ketu";
} | null;

export type SkySample = {
  timeMs: number;
  sky: Record<GrahaKey, GeoBody>;
  labels: ScreenLabel[];
  /** Sun altitude, deg — negative is night. Drives the daylight wash. */
  sunAltitude: number;
  /** The camera's current `view.distance` — lets the overlay grow rashi and
      nakshatra text as the belt shrinks on screen while zooming out. */
  zoomDistance: number;
  /** Set when Sun, Moon, Earth and a node share a line. */
  eclipse: EclipseState;
};

export type SceneToggles = {
  /** The twelve राशि — gold belt plus their names. */
  rashiBelt: boolean;
  /**
   * The twenty-seven नक्षत्र — green strip, names, and the तारापुञ्ज each
   * नक्षत्र is named for (रोहिणी as the Hyades, ज्येष्ठा as Antares, …).
   */
  nakshatraBelt: boolean;
  /**
   * बिक्रम month names, in the inner half of each राशि cell. No extra ring —
   * the 12-fold is already the राशि.
   */
  monthRing: boolean;
  /** The azimuth grid: almucantars and verticals, 10° down to 1° as you zoom. */
  grid: boolean;
  /**
   * Freeze the Earth's spin. The diurnal rotation drags the whole sky round
   * once a day, which drowns out planetary motion when the clock is running
   * fast; locked, the zodiac holds still and only the grahas move along it.
   */
  lockStars: boolean;
  /**
   * Keep the lock target in the middle of the view while time runs — the
   * camera target follows its motion (works in space, globe, and horizon
   * views). The target is the selected graha, or your own place on the globe
   * when {@link AakashGocharScene}'s `lockObserver` is set.
   */
  lockCenter: boolean;
  /**
   * The ध्रुव तारा and the circle the pole walks between them — the other half
   * of precession, the one the ayanamsa does not show.
   */
  poleStars: boolean;
  /**
   * The obliquity, drawn as the angle it is: the Earth's axis against the
   * perpendicular to its orbit. In the globe view the Earth is held upright and
   * the ecliptic is what tilts, so without this the 23.44° is in the picture
   * but nothing in it looks tilted.
   */
  tilt: boolean;
  /**
   * काठमाडौँ's meridian, pole to pole on the Earth — the line noon is
   * reckoned against. Same object as the Learn playground's काठमाडौँ रेखा.
   */
  primeMeridian: boolean;
  /**
   * The star figures themselves — the points and the lines joining them into
   * the तारापुञ्ज each नक्षत्र is named for, plus those names.
   *
   * Its own switch rather than a rider on {@link nakshatraBelt}: the belt is
   * the 27-fold division of the ecliptic, the figures are the stars the
   * divisions were named after, and wanting one without the other is the
   * ordinary case — a clean zodiac with no star clutter, or the sky's own
   * figures with no measuring band across them.
   */
  constellations: boolean;
  /**
   * Horizon view: the ground underfoot and the horizon ring drawn on it.
   *
   * Off, the sphere is drawn whole and unobstructed — the observer's frame
   * without the observer's floor, which is the view an orrery gives.
   */
  landscape: boolean;
  /**
   * Every name the sky writes over itself — राशि, नक्षत्र, grahas, the compass,
   * the star groups. The lines and the bodies stay; only the type goes.
   */
  labels: boolean;
};

/* ── shared primitives ─────────────────────────────────────────────────── */

/**
 * Earth-fixed latitude/longitude → scene vector, axis along +Y.
 *
 * Same handedness as {@link eclipticToVec3}, and the same one three's own
 * sphere UVs use — so the Earth map can be laid on the globe straight and every
 * coastline lands where this function says it should.
 */
function geoToVec3(lat: number, lon: number, radius: number): [number, number, number] {
  const a = lat * DEG;
  const b = lon * DEG;
  const cosLat = Math.cos(a);
  return [radius * cosLat * Math.cos(b), radius * Math.sin(a), -radius * cosLat * Math.sin(b)];
}

function circlePoints(radius: number, segments = 128): THREE.Vector3[] {
  return Array.from({ length: segments + 1 }, (_, i) => {
    const a = (i / segments) * Math.PI * 2;
    return new THREE.Vector3(radius * Math.cos(a), 0, -radius * Math.sin(a));
  });
}

function makeLine(points: THREE.Vector3[], color: string, opacity: number) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
}

/** Pole-to-pole meridian in the XY plane; rotate about +Y by longitude. */
function makePrimeMeridian(radius: number) {
  const points = Array.from({ length: 49 }, (_, i) => {
    const a = -Math.PI / 2 + (i / 48) * Math.PI;
    return new THREE.Vector3(radius * 1.003 * Math.cos(a), radius * 1.003 * Math.sin(a), 0);
  });
  return makeLine(points, "#dd2222", 0.95);
}

/**
 * A line whose points are rewritten every frame.
 *
 * Frustum culling is off: it would need a bounding sphere recomputed on every
 * rewrite — a second pass over every vertex — to save nothing, since these
 * lines are the dome and the zodiac and are on screen anyway.
 */
function makeDynamicLine(count: number, color: string, opacity: number, width = 1) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
  const line = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity, linewidth: width }),
  );
  line.frustumCulled = false;
  return line;
}

/** The same, as disconnected pairs — dividers, ticks, grid cage. */
function makeDynamicSegments(count: number, color: string, opacity: number) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
  const segments = new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
  segments.frustumCulled = false;
  return segments;
}

/**
 * Where the cage hangs: *outside* the shell the grahas sit on.
 *
 * The grahas are opaque meshes, and three.js draws every opaque object before
 * any transparent one — so `renderOrder` cannot put a transparent line behind
 * them, and with the depth test off the cage repainted itself over every disc
 * on the belt no matter what order it was given. The fix is depth, not order:
 * the grahas write the depth buffer, and a cage further out than they are gets
 * rejected where they cover it. Which only works if it really is further out.
 */
const GRID_R = DOME * 1.04;

/**
 * How near a press has to land, in pixels, to count as being on a graha.
 *
 * Generous on purpose: pulled out to the whole dome a graha is a couple of
 * pixels across, and a target you have to hit exactly is one you cannot hit at
 * all on a phone. Nearest-wins, so an over-large radius costs nothing where
 * they are far apart and still picks sensibly where they crowd.
 */
const PICK_RADIUS = 26;

/** Movement past this during a press makes it a drag, not a click. Pixels. */
const DRAG_SLOP = 6;

/** Two presses on one graha inside this are a double press. Milliseconds. */
const DOUBLE_MS = 400;

/** Grahas are picked by hand in every view, so the raycaster must not also try. */
const NO_RAYCAST = () => {};

/**
 * The cage's shared look.
 *
 * Order and depth do two different jobs here and both are needed. The cage
 * paints *after* the ground (renderOrder 1), or the hillside's half-opaque
 * photo washes a 0.17-alpha line away to nothing and the cage under the
 * horizon disappears. It is kept off the grahas by the depth buffer instead:
 * they are opaque, so they are drawn and their depth written before any
 * transparent line, and a cage hung further out than they are simply fails the
 * test where a disc covers it.
 */
function dressGrid(object: THREE.LineSegments) {
  object.renderOrder = 2;
  const mat = object.material as THREE.LineBasicMaterial;
  mat.depthTest = true;
  /* Reads the depth buffer but never writes it, so the tiers do not cut holes
     in each other and whatever is behind still comes through the mesh. */
  mat.depthWrite = false;
  return object;
}

function bakeHorizonGrid(step: number, skipMultiplesOf: readonly number[], opacity: number) {
  const pairs = buildAzimuthGridPairs(step, skipMultiplesOf);
  const object = dressGrid(makeDynamicSegments(pairs.length, GRID, opacity));
  for (let i = 0; i < pairs.length; i += 1) {
    setPoint(object, i, altAzToVec3(pairs[i].alt, pairs[i].az, GRID_R));
  }
  flushLine(object);
  return object;
}

function setPoint(line: THREE.Line, i: number, v: [number, number, number]) {
  const attr = line.geometry.getAttribute("position") as THREE.BufferAttribute;
  attr.setXYZ(i, v[0], v[1], v[2]);
}

function flushLine(line: THREE.Line) {
  const attr = line.geometry.getAttribute("position") as THREE.BufferAttribute;
  attr.needsUpdate = true;
}

/**
 * A cloud of stars whose positions are rewritten with the sky. Point size is in
 * pixels rather than world units — a star has no apparent size, so it must not
 * grow as you zoom in on it.
 */
function makeStarPoints(count: number, color: string, size: number, opacity: number) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
  /* A raw GL point is a square. Rather than ship a sprite texture — which the
     native GL bridge would have to decode — the fragment shader throws away
     everything outside the disc and feathers the last of it, which is both
     rounder and softer than a bitmap of this size would be. */
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uSize: { value: size },
      uOpacity: { value: opacity },
      uPixelRatio: { value: 1 },
    },
    vertexShader: `
      uniform float uSize;
      uniform float uPixelRatio;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * uPixelRatio;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      void main() {
        vec2 d = gl_PointCoord - vec2(0.5);
        float r2 = dot(d, d);
        if (r2 > 0.25) discard;
        /* Solid to the edge, with only the last of it feathered. Ramping the
           alpha all the way from the centre made every star a soft blob —
           read as out of focus rather than as a point of light. */
        float alpha = 1.0 - smoothstep(0.185, 0.25, r2);
        gl_FragColor = vec4(uColor, uOpacity * alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

/** Write one vertex of any position-buffered object. */
function setVertex(
  object: THREE.Object3D & { geometry: THREE.BufferGeometry },
  i: number,
  v: [number, number, number],
) {
  const attr = object.geometry.getAttribute("position") as THREE.BufferAttribute;
  attr.setXYZ(i, v[0], v[1], v[2]);
}

/* ── grahas ────────────────────────────────────────────────────────────── */

/**
 * Saturn's ring, sized from the globe it belongs to. The real ring system runs
 * from about 1.2 to 2.3 planet radii; the numbers here are those, so it stays
 * in proportion however the body is scaled.
 */
function SaturnRing({ texture, radius }: { texture: THREE.Texture; radius: number }) {
  const geometry = useMemo(() => {
    const inner = radius * 1.3;
    const outer = radius * 2.2;
    const geo = new THREE.RingGeometry(inner, outer, 96);
    // Remap UVs radially so the ring strip texture reads outward, not around.
    const uv = geo.attributes.uv;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const r = Math.hypot(pos.getX(i), pos.getY(i));
      uv.setXY(i, (r - inner) / (outer - inner), 1);
    }
    return geo;
  }, [radius]);

  return (
    <mesh geometry={geometry} rotation={[Math.PI / 2 - 0.45, 0, 0]} renderOrder={1}>
      <meshBasicMaterial
        map={texture}
        side={THREE.DoubleSide}
        transparent
        opacity={0.92}
        depthWrite={false}
        alphaTest={0.05}
      />
    </mesh>
  );
}

/** How close a new/full moon must be to a node before it is an eclipse. */
const ECLIPSE_NODE_DEG = 16;
/** How close to conjunction/opposition. */
const ECLIPSE_SYZ_DEG = 12;

function circSep(a: number, b: number) {
  return Math.abs(deltaLongitude(a, b));
}

function eclipseOf(sky: Record<GrahaKey, GeoBody>): NonNullable<EclipseState> | { kind: null; mag: number; node: "rahu" | "ketu" } {
  const elong = normalizeDeg(sky.moon.longitude - sky.sun.longitude);
  const toRahu = circSep(sky.moon.longitude, sky.rahu.longitude);
  const toKetu = circSep(sky.moon.longitude, sky.ketu.longitude);
  const nodeSep = Math.min(toRahu, toKetu);
  const node: "rahu" | "ketu" = toRahu <= toKetu ? "rahu" : "ketu";
  const nearNode = nodeSep < ECLIPSE_NODE_DEG;
  const nodeMag = nearNode ? 1 - nodeSep / ECLIPSE_NODE_DEG : 0;
  const conj = Math.min(elong, 360 - elong);
  const opp = Math.abs(elong - 180);
  if (nearNode && conj <= ECLIPSE_SYZ_DEG) {
    return { kind: "solar", mag: nodeMag * (1 - conj / ECLIPSE_SYZ_DEG), node };
  }
  if (nearNode && opp <= ECLIPSE_SYZ_DEG) {
    return { kind: "lunar", mag: nodeMag * (1 - opp / ECLIPSE_SYZ_DEG), node };
  }
  return { kind: null, mag: 0, node };
}

function makeUmbra(color: number, opacity: number, earthEnd = 0.12, moonEnd = 1) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(earthEnd, moonEnd, 1, 20, 1, true),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  mesh.visible = false;
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;
  return mesh;
}

const Y_UP = new THREE.Vector3(0, 1, 0);

function placeUmbra(
  mesh: THREE.Mesh,
  from: THREE.Vector3,
  to: THREE.Vector3,
  base: number,
  axis: THREE.Vector3,
) {
  axis.copy(to).sub(from);
  const len = axis.length();
  if (len < 0.2) {
    mesh.visible = false;
    return;
  }
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(Y_UP, axis.multiplyScalar(1 / len));
  mesh.scale.set(base, len, base);
  mesh.visible = true;
}

/** Blood-moon veil + solar corona, sitting on the Moon itself. */
function MoonEclipseFx({
  eclipse,
  radius,
}: {
  eclipse: React.RefObject<{ kind: "solar" | "lunar" | null; mag: number }>;
  radius: number;
}) {
  const veilRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const e = eclipse.current;
    const veil = veilRef.current;
    if (veil) {
      const on = e.kind === "lunar";
      veil.visible = on;
      if (on) (veil.material as THREE.MeshBasicMaterial).opacity = 0.28 + 0.62 * e.mag;
    }
    const corona = coronaRef.current;
    if (corona) {
      const on = e.kind === "solar";
      corona.visible = on;
      if (on) {
        (corona.material as THREE.MeshBasicMaterial).opacity = 0.45 + 0.5 * e.mag;
        corona.lookAt(0, 0, 0);
      }
    }
  });
  return (
    <>
      <mesh ref={veilRef} visible={false} renderOrder={7}>
        <sphereGeometry args={[radius * 1.04, 32, 24]} />
        <meshBasicMaterial color="#7a1c12" transparent depthWrite={false} />
      </mesh>
      <mesh ref={coronaRef} visible={false} renderOrder={8}>
        <ringGeometry args={[radius * 1.08, radius * 1.7, 48]} />
        <meshBasicMaterial
          color="#ffe08a"
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

function GrahaBody({
  graha,
  textures,
  selected,
  groupRef,
  spinRef,
  retroRef,
  sunLit,
  phaseMaterial,
  eclipse,
}: {
  graha: GrahaKey;
  textures: Record<SkyTextureKey, THREE.Texture>;
  selected: boolean;
  groupRef: (o: THREE.Group | null) => void;
  spinRef: (o: THREE.Mesh | null) => void;
  retroRef: (o: THREE.Group | null) => void;
  /** Space view: the Sun's point light models the terminator (औंसी / पूर्णिमा). */
  sunLit?: boolean;
  /**
   * The Moon, in the two views whose fixed-radius projection makes the Sun's
   * light useless — it carries the phase as a direction instead.
   */
  phaseMaterial?: MoonMaterial;
  eclipse?: React.RefObject<{ kind: "solar" | "lunar" | null; mag: number }>;
}) {
  const texKey = BODY_TEXTURE[graha];
  const radius = BODY_RADIUS[graha];

  return (
    <group ref={groupRef}>
      {texKey ? (
        <mesh ref={spinRef} raycast={NO_RAYCAST}>
          <sphereGeometry args={[radius, 40, 40]} />
          {graha === "sun" ? (
            <meshBasicMaterial map={textures.sun} />
          ) : graha === "moon" && sunLit ? (
            <meshStandardMaterial map={textures.moon} roughness={1} metalness={0} />
          ) : graha === "moon" && phaseMaterial ? (
            <primitive object={phaseMaterial} attach="material" />
          ) : (
            <meshStandardMaterial
              map={textures[texKey]}
              emissive="#ffffff"
              emissiveMap={textures[texKey]}
              /* A little self-lighting keeps outer grahas legible where the
                 Sun's falloff would otherwise leave them nearly black. */
              emissiveIntensity={0.22}
              roughness={0.85}
              metalness={0.03}
            />
          )}
        </mesh>
      ) : (
        /* राहु / केतु have no photographic texture. A sphere on the same
           material path as the other grahas stays on the belt under the
           stereographic sky; the old SVG sprites did not. */
        <mesh ref={spinRef} raycast={NO_RAYCAST}>
          <sphereGeometry args={[radius, 40, 40]} />
          <meshStandardMaterial
            color={GRAHA_COLOR[graha]}
            emissive={GRAHA_COLOR[graha]}
            emissiveIntensity={0.45}
            roughness={0.85}
            metalness={0.03}
          />
        </mesh>
      )}
      {graha === "moon" && eclipse ? <MoonEclipseFx eclipse={eclipse} radius={radius} /> : null}

      {graha === "saturn" ? <SaturnRing texture={textures.saturnring} radius={radius} /> : null}

      {/* Vakri collar — shown only while the graha is actually retrograde. */}
      <group ref={retroRef} visible={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.7, radius * 2.05, 32]} />
          <meshBasicMaterial color={RETRO} transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {selected ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 2.4, radius * 2.65, 40]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>
      ) : null}
    </group>
  );
}

/* ── scene ─────────────────────────────────────────────────────────────── */

const TRAIL_DAYS = 45;
const TRAIL_STEPS = 90;
/** Points along the ecliptic great circle in the horizon view. */
const ecliptic_STEPS = 180;

/**
 * Angles are compared at this resolution before the zodiac band is re-projected
 * — 18 arcseconds, which on the dome is a small fraction of a pixel at any zoom
 * the view allows, so nothing visibly steps.
 */
const BELT_ANGLE_STEP = 0.005;

/** Segments in the little arc that calls out the obliquity. */
const TILT_ARC_STEPS = 24;

const quantizeDeg = (deg: number) => Math.round(deg / BELT_ANGLE_STEP);

/**
 * Whether a freshly projected label list differs from the one on screen by
 * enough to be worth re-rendering — a pixel, in either axis.
 */
function labelsMoved(prev: ScreenLabel[], next: ScreenLabel[]): boolean {
  if (prev.length !== next.length) return true;
  for (let i = 0; i < next.length; i += 1) {
    const a = prev[i];
    const b = next[i];
    /* `dim` counts as movement: which राशि and नक्षत्र are lit changes on
       selection, and on a paused sky nothing else about the label does — so
       leaving it out froze the bright pair on whoever was picked first. */
    if (
      a.id !== b.id ||
      a.dim !== b.dim ||
      /* Same reason as `dim`: crossing the skyline changes nothing about where
         a label sits, only how brightly it is drawn, so on a paused sky the
         fade would never be handed over. */
      a.below !== b.below ||
      Math.abs(a.x - b.x) >= 1 ||
      Math.abs(a.y - b.y) >= 1
    )
      return true;
  }
  return false;
}

export function AakashGocharScene({
  sim,
  view,
  mode,
  observer,
  calibration,
  ayanamsaShift = 0,
  selectedKey,
  lockObserver = false,
  focusNonce = 0,
  skyAim = null,
  toggles,
  onSelect,
  onFollow,
  onSelectObserver,
  onSample,
}: {
  sim: React.RefObject<SimState>;
  view: React.RefObject<ViewState>;
  mode: SkyMode;
  observer: Observer;
  calibration: SkyCalibration;
  /**
   * Degrees to add to the scene's own Lahiri fit so it agrees with the server
   * for the date on screen. Zero until the gochar response has arrived.
   */
  ayanamsaShift?: number;
  selectedKey: GrahaKey | null;
  /**
   * Lock onto the observer's own place on the globe rather than onto a graha.
   * Takes precedence over {@link selectedKey} — the two are alternative
   * answers to the same question, "what is the camera following?".
   */
  lockObserver?: boolean;
  /**
   * Bumped every time the reader *asks* to focus something — pressing
   * केन्द्रविन्दु, picking a graha behind it, turning ग्रह पछ्याउनुहोस् on.
   *
   * The lock itself only holds the camera while the clock is running; on a
   * paused sky the drag is the reader's again. So asking to focus has to be
   * its own event rather than a state the camera can read, or pressing it on a
   * paused sky would centre nothing.
   */
  focusNonce?: number;
  /**
   * A fixed point in the sky to centre, from the search box — ecliptic
   * longitude and latitude at J2000, plus a nonce that changes each time it is
   * asked for.
   *
   * Grahas are centred by being selected, because they are objects in the scene
   * with a live position. A star is not: it is a direction. So it arrives as a
   * direction and is aimed at through the same one-frame recentre.
   */
  skyAim?: { lon: number; lat: number; nonce: number } | null;
  toggles: SceneToggles;
  onSelect: (key: GrahaKey) => void;
  /** Pressed twice — select it *and* turn following on. */
  onFollow: (key: GrahaKey) => void;
  /** The marker on the globe was pressed — your place, chosen as the target. */
  onSelectObserver?: () => void;
  onSample: (sample: SkySample) => void;
}) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const loaded = useLoader(THREE.TextureLoader, SKY_TEXTURE_SOURCES as string[]);
  const textures = useMemo(() => {
    /* Anisotropic filtering, at whatever the card will give. A sphere shows its
       map at every angle at once, and towards the limb the texture is being
       squeezed into a few pixels — that is where a trilinear mipmap gives up
       and smears, and it is most of what "the Earth looks blurry" was. */
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy?.() ?? 1;
    const map = {} as Record<SkyTextureKey, THREE.Texture>;
    SKY_TEXTURE_KEYS.forEach((key, i) => {
      const tex = loaded[i];
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAnisotropy;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.needsUpdate = true;
      map[key] = tex;
    });
    return map;
  }, [loaded, gl]);

  /**
   * अन्तरिक्ष's Earth wears the Learn playground's cartoon map, not the
   * photograph the globe view uses.
   *
   * At the space view's scale the planet is a couple of hundred pixels across
   * and half of it is in shadow: a photograph at that size is mud, while flat
   * colour still reads as continents when dimmed to a third. Raw texels — the
   * shader writes final pixels itself. See `makeEarthMaterial`.
   */
  const earthToon = useLoader(THREE.TextureLoader, earthToonUrl);
  const spaceEarthMat = useMemo(() => {
    earthToon.colorSpace = THREE.NoColorSpace;
    earthToon.anisotropy = gl.capabilities.getMaxAnisotropy?.() ?? 1;
    return makeEarthMaterial(earthToon);
  }, [earthToon, gl]);
  useEffect(() => () => spaceEarthMat.dispose(), [spaceEarthMat]);

  /**
   * The Moon's own face for the dome and the globe — see `makeMoonMaterial`
   * for why those two cannot simply be lit.
   *
   * Its own copy of the map, because the shader writes final pixels and so
   * wants raw texels, while the space view's `meshStandardMaterial` wants the
   * same image tagged sRGB. One `Texture` cannot answer both, and the clone
   * shares the decoded image either way.
   */
  const moonPhaseMat = useMemo(() => {
    const map = textures.moon.clone();
    map.colorSpace = THREE.NoColorSpace;
    map.needsUpdate = true;
    return makeMoonMaterial(map);
  }, [textures]);
  useEffect(
    () => () => {
      moonPhaseMat.uniforms.map.value.dispose();
      moonPhaseMat.dispose();
    },
    [moonPhaseMat],
  );

  const bodyRefs = useRef<Partial<Record<GrahaKey, THREE.Group>>>({});
  const spinRefs = useRef<Partial<Record<GrahaKey, THREE.Mesh>>>({});
  const retroRefs = useRef<Partial<Record<GrahaKey, THREE.Group>>>({});
  const shellRefs = useRef<Partial<Record<GrahaKey, THREE.Line>>>({});
  const earthRef = useRef<THREE.Mesh | null>(null);
  const earthGroupRef = useRef<THREE.Group | null>(null);
  const sunLightRef = useRef<THREE.PointLight | null>(null);
  const ambientRef = useRef<THREE.AmbientLight | null>(null);
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
  const starsRef = useRef<THREE.Mesh | null>(null);
  const groundRef = useRef<THREE.Group | null>(null);
  const groundMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const horizonGroupRef = useRef<THREE.Group | null>(null);
  const shellRef = useRef<THREE.Mesh | null>(null);
  const globeRootRef = useRef<THREE.Group | null>(null);
  const globeSpinRef = useRef<THREE.Group | null>(null);
  const subsolarRef = useRef<THREE.Mesh | null>(null);
  const spaceOnlyRef = useRef<THREE.Group | null>(null);
  const sharaFootRef = useRef<THREE.Mesh | null>(null);
  const rashiHiRef = useRef<THREE.Mesh | null>(null);
  const nakHiRef = useRef<THREE.Mesh | null>(null);
  /** Which graha the lit belt segments are currently tinted for. */
  const lastBeltKey = useRef<GrahaKey | null>(null);
  const moonEclipse = useRef<{ kind: "solar" | "lunar" | null; mag: number }>({ kind: null, mag: 0 });
  const umbraAxis = useRef(new THREE.Vector3());
  const umbraFrom = useRef(new THREE.Vector3());
  const umbraTo = useRef(new THREE.Vector3());
  /** Body → the ecliptic plane below or above it: the शर, drawn. */
  const sharaLine = useMemo(() => makeDynamicLine(2, "#ffffff", 0.55), []);
  const lunarUmbra = useMemo(() => makeUmbra(0x5a140e, 0.32), []);
  const solarUmbra = useMemo(() => makeUmbra(0x000000, 0.78, 0.72, 1.05), []);
  useEffect(
    () => () => {
      lunarUmbra.geometry.dispose();
      (lunarUmbra.material as THREE.Material).dispose();
      solarUmbra.geometry.dispose();
      (solarUmbra.material as THREE.Material).dispose();
    },
    [lunarUmbra, solarUmbra],
  );
  const spaceMeridian = useMemo(() => makePrimeMeridian(EARTH_RADIUS), []);
  const globeMeridian = useMemo(() => makePrimeMeridian(GLOBE_R), []);

  /* Sight rays: one two-point line per graha, rewritten every frame. */
  const rays = useMemo(() => {
    const out = {} as Record<GrahaKey, THREE.Line>;
    for (const key of GEO_BODY_ORDER) {
      out[key] = makeDynamicLine(2, GRAHA_COLOR[key], 0.5);
    }
    return out;
  }, []);

  /* Every graha's path over ±45 days — where the vakri loops show. Each keeps
     its own colour so a crowded belt still reads. */
  const trails = useMemo(() => {
    const out = {} as Record<GrahaKey, THREE.Line>;
    for (const key of GEO_BODY_ORDER) out[key] = makeDynamicLine(TRAIL_STEPS + 1, GRAHA_COLOR[key], 0.4);
    return out;
  }, []);

  /**
   * Horizon view furniture: the banded zodiac, the nakshatra strip inside it,
   * the degree scale, and the alt-az cage. Each entry keeps its source vertices
   * in sky coordinates and is re-projected onto the dome every frame.
   */
  const skyLines = useMemo(() => {
    const band = (
      layer: "rashi" | "nakshatra" | "shared",
      src: eclipticPoint[],
      color: string,
      opacity: number,
      segments = false,
    ) => ({
      layer,
      src,
      object: segments
        ? makeDynamicSegments(src.length, color, opacity)
        : makeDynamicLine(src.length, color, opacity),
    });
    return [
      band("rashi", BAND_EDGES.rashiOuter, ZODIAC, 1),
      band("rashi", BAND_EDGES.rashiInner, ZODIAC, 1),
      band("nakshatra", BAND_EDGES.nakOuter, NAKSHATRA, 0.9),
      band("nakshatra", BAND_EDGES.nakInner, NAKSHATRA, 0.9),
      band("shared", BAND_EDGES.ecliptic, ZODIAC, 0.75),
      band("rashi", RASHI_DIVIDERS, ZODIAC, 0.9, true),
      band("nakshatra", NAKSHATRA_DIVIDERS, NAKSHATRA, 0.8, true),
      band("nakshatra", PADA_TICKS, NAKSHATRA, 0.55, true),
      band("rashi", DEGREE_TICKS, ZODIAC, 0.6, true),
    ];
  }, []);

  /**
   * The Earth globe's graticule, built once in Earth-fixed coordinates and
   * spun by the group it hangs in. Latitude/longitude only — the globe itself
   * is a dark ball, so the grid and the zodiac ring are all there is to read.
   */
  const globeLines = useMemo(() => {
    const asLine = (src: GeoPoint[], color: string, opacity: number) => ({
      src,
      object: makeLine(
        /* Held clear of the sphere rather than on it. At the surface radius the
           grid fought the map for the same depth and came and went in bands as
           the globe turned; a percent of clearance is invisible at this scale
           and settles it. */
        src.map((p) => new THREE.Vector3(...geoToVec3(p.lat, p.lon, GLOBE_R * 1.01))),
        color,
        opacity,
      ),
    });
    /* Brighter than the dark ball this used to be drawn on: over a satellite
       map at a fifth opacity the graticule simply was not there. */
    return {
      parallels: GLOBE_PARALLELS.map((p) => asLine(p, GLOBE_GRID, 0.5)),
      meridians: GLOBE_MERIDIANS.map((m) => asLine(m, GLOBE_GRID, 0.5)),
      equator: asLine(GLOBE_EQUATOR, "#7fd4ff", 0.95),
      tropics: GLOBE_TROPICS.map((t) => ({ ...asLine(t.points, ZODIAC, 0.85), id: t.id, lat: t.lat })),
    };
  }, []);

  /**
   * The नक्षत्र star groups: three point clouds by brightness so the योगतारा
   * and the first-magnitude stars carry the shape, plus the figure lines.
   *
   * Every star is held at its ecliptic longitude for J2000 and precessed in the
   * frame loop, which is what keeps it fixed against the belt while the pair of
   * them drift away from the equinox together.
   */
  const starField = useMemo(() => {
    const { stars, links } = flattenAsterisms();
    const junction: number[] = [];
    const bright: number[] = [];
    const faint: number[] = [];
    stars.forEach((s, i) => {
      if (s.junction) junction.push(i);
      else if (s.mag <= 3.2) bright.push(i);
      else faint.push(i);
    });
    /* Which stars belong to which नक्षत्र, so the group can be named as a group
       — the label goes on the figure, not on the belt segment below it. */
    const byNakshatra = new Map<number, number[]>();
    stars.forEach((s, i) => {
      const list = byNakshatra.get(s.nakshatra);
      if (list) list.push(i);
      else byNakshatra.set(s.nakshatra, [i]);
    });
    return {
      stars,
      links,
      byNakshatra: [...byNakshatra.entries()],
      groups: [
        { indices: junction, object: makeStarPoints(junction.length, "#ffd98a", 6.5, 0.45) },
        { indices: bright, object: makeStarPoints(bright.length, "#eaf2ff", 4.6, 0.38) },
        { indices: faint, object: makeStarPoints(faint.length, "#c8d8ee", 3.2, 0.28) },
      ],
      lines: makeDynamicSegments(links.length * 2, "#9db9dd", 0.28),
    };
  }, []);

  /**
   * Where each star sits inside its own नक्षत्र, flat on the wheel.
   *
   * The figure is drawn in the belt, not on a drum wall: longitude maps into
   * the segment, latitude maps across the band's width, y stays on the ecliptic.
   * That is the Learn playground's own reading — a नक्षत्र is a patch of the
   * wheel, not a vertical panel standing on it.
   */
  const spaceStarPos = useMemo(() => {
    const out: [number, number, number][] = new Array(starField.stars.length);
    const r0 = NAK_INNER + 0.4;
    const r1 = NAK_OUTER - 0.4;
    for (const [nak, indices] of starField.byNakshatra) {
      /* Longitudes inside a group can straddle 0°/360°, so they are measured
         against the first member rather than in absolute terms. */
      const base = starField.stars[indices[0]].lon;
      const rel = indices.map((i) => {
        let d = starField.stars[i].lon - base;
        if (d > 180) d -= 360;
        if (d < -180) d += 360;
        return d;
      });
      const lats = indices.map((i) => starField.stars[i].lat);
      const minLon = Math.min(...rel);
      const spanLon = Math.max(...rel) - minLon;
      const minLat = Math.min(...lats);
      const spanLat = Math.max(...lats) - minLat;
      const segStart = (nak - 1) * NAKSHATRA_ARC;
      indices.forEach((starIndex, k) => {
        const u = spanLon > 1e-6 ? (rel[k] - minLon) / spanLon : 0.5;
        const v = spanLat > 1e-6 ? (lats[k] - minLat) / spanLat : 0.5;
        const lon = segStart + (PANEL_INSET + u * (1 - 2 * PANEL_INSET)) * NAKSHATRA_ARC;
        const r = r0 + v * (r1 - r0);
        const a = lon * DEG;
        out[starIndex] = [r * Math.cos(a), 0.04, -r * Math.sin(a)];
      });
    }
    return out;
  }, [starField]);

  /**
   * The ध्रुव तारा, and the circle the celestial pole walks between them.
   *
   * The circle is fixed in the sky — ecliptic latitude 90° − ε all the way
   * round — and the stars sitting on or near it are exactly the ones that get a
   * turn as pole star. Running the clock walks the pole along it.
   */
  const poleField = useMemo(() => {
    const stars = placedPoleStars(23.4392911);
    return {
      stars,
      track: poleTrackPoints(23.4392911),
      trackLine: makeDynamicLine(181, "#8ab4f8", 0.62),
      points: makeStarPoints(stars.length, "#dceaff", 5, 1),
      /* The reigning one is drawn on top of its own dot, larger and gold. */
      crown: makeStarPoints(1, "#ffd166", 8, 1),
    };
  }, []);

  /**
   * The obliquity, drawn as an angle rather than left implicit.
   *
   * The globe's axis is +Y and the ecliptic pole sits `eps` off it, so the gap
   * between those two lines *is* the tilt — and it is also the centre of the
   * circle the pole stars stand on, which is why the two read together.
   */
  const tiltMarks = useMemo(
    () => ({
      /** The perpendicular to the orbit: where the axis would point untilted. */
      eclipticAxis: makeDynamicLine(2, "#8ab4f8", 0.55),
      arc: makeDynamicLine(TILT_ARC_STEPS + 1, "#ffd166", 0.9),
    }),
    [],
  );

  /** Earth centre → Sun, and where that ray lands on the globe. */
  const sunRay = useMemo(() => makeDynamicLine(2, "#ffd166", 0.75), []);

  /** The celestial equator — the reference the ecliptic is visibly tilted against. */
  const equatorLine = useMemo(() => makeDynamicLine(ecliptic_STEPS + 1, "#5aa9e6", 0.45), []);

  /**
   * Almucantars and verticals, one tier per zoom band — and each tier is built
   * the first time the lens is tight enough to want it, not at mount.
   *
   * The 1° cage alone is some eighty thousand vertices. Baking all four up
   * front spent that on a sky that opens with no cage at all, and the hitch
   * landed on the first frame of the view rather than on a zoom the reader
   * asked for. The group is created empty and fills in as they push in.
   */
  const grid = useMemo(() => {
    const group = new THREE.Group();
    group.name = "horizon-grid";
    /* The group and the slots it fills are made together and never apart: a
       tier remembered without the group it was added to, or a fresh group
       beside tiers that think they are already in one, is a cage that never
       gets drawn.

       `local` is one buffer, allocated once at its worst case and refilled
       from the view each frame — the arcminute tiers exist for a window a
       degree across, and baking those as whole spheres is millions of
       vertices to draw a few dozen lines. */
    const local = dressGrid(makeDynamicSegments(LOCAL_GRID_CAPACITY, GRID, 0.14));
    local.visible = false;
    group.add(local);
    /* उ / पू / द / प, plus the mark on the zenith and the nadir. Baked once
       and never rebuilt: the four ribs of the dome do not depend on the lens,
       and every tier leaves them out so this is the only thing drawing them. */
    const frame = dressGrid(
      makeDynamicSegments(CARDINAL_VERTICALS.length + POLE_MARKS.length, GRID, 0.62),
    );
    [...CARDINAL_VERTICALS, ...POLE_MARKS].forEach((p, i) => {
      setPoint(frame, i, altAzToVec3(p.alt, p.az, GRID_R));
    });
    flushLine(frame);
    group.add(frame);
    return {
      group,
      tiers: GRID_TIERS.map(() => null as THREE.LineSegments | null),
      local,
      localPairs: [] as HorizonPoint[],
      frame,
    };
  }, []);

  const horizonRing = useMemo(() => {
    const line = makeLine(circlePoints(DOME * 0.999, 180), "#c8ff7a", 0.9);
    line.renderOrder = 5;
    const mat = line.material as THREE.LineBasicMaterial;
    mat.depthTest = false;
    mat.depthWrite = false;
    return line;
  }, []);

  /**
   * काठमाडौँ as a 360° ground: the JPEG is a little-planet (nadir in the
   * middle), remapped onto the inner sky sphere so the city is underfoot and
   * the hills sit on the horizon. Its sky is punched out so the राशि belt
   * still shows through.
   */
  const kathmanduRaw = useLoader(THREE.TextureLoader, kathmanduUrl);
  const landscapeMap = useMemo(() => prepareKathmanduGround(kathmanduRaw), [kathmanduRaw]);
  useEffect(() => () => landscapeMap.dispose(), [landscapeMap]);
  const groundGeo = useMemo(() => {
    const g = new THREE.SphereGeometry(DOME * 0.96, 128, 64);
    applyNadirStereographicUVs(g);
    return g;
  }, []);
  useEffect(() => () => groundGeo.dispose(), [groundGeo]);

  const shells = useMemo(
    () =>
      GEO_BODY_ORDER.filter((k) => k !== "rahu" && k !== "ketu").map((key) => ({
        key,
        points: circlePoints(1, 96),
        attach: (o: THREE.Line | null) => {
          shellRefs.current[key] = o ?? undefined;
        },
      })),
    [],
  );

  /** Stable ref callbacks per graha — fresh closures would churn every render. */
  const handles = useMemo(
    () =>
      Object.fromEntries(
        GEO_BODY_ORDER.map((key) => [
          key,
          {
            group: (o: THREE.Group | null) => {
              bodyRefs.current[key] = o ?? undefined;
            },
            spin: (o: THREE.Mesh | null) => {
              spinRefs.current[key] = o ?? undefined;
            },
            retro: (o: THREE.Group | null) => {
              retroRefs.current[key] = o ?? undefined;
            },
          },
        ]),
      ) as Record<
        GrahaKey,
        {
          group: (o: THREE.Group | null) => void;
          spin: (o: THREE.Mesh | null) => void;
          retro: (o: THREE.Group | null) => void;
        }
      >,
    [],
  );

  const frame = useRef(0);
  const lockedLst = useRef<number | null>(null);
  const lastSample = useRef(0);
  const lastTrailKey = useRef("");
  /**
   * Which graha the trail sweep is up to — one per frame, never all at once.
   * Starts finished, so nothing is drawn before there is an epoch to draw it at.
   */
  const trailCursor = useRef(GEO_BODY_ORDER.length);
  /** The instant the sweep in progress is drawing, so all nine lines agree. */
  const trailBaseDt = useRef(0);
  /**
   * The sky mapping the zodiac band was last projected with. The band is a
   * couple of thousand vertices; re-projecting it when nothing has moved is the
   * single most expensive thing this loop can do, and outside the horizon view
   * nothing does move — the ring only creeps by the ayanamsa, a degree in 72
   * years. `null` forces the next frame to rebuild.
   */
  const lastBelt = useRef<{ mode: SkyMode; lst: number; ayan: number; eps: number } | null>(null);
  /** The obliquity the two tropic circles are currently drawn at. */
  const tropicEps = useRef(Number.NaN);
  const labels = useRef<ScreenLabel[]>([]);
  const scratch = useRef(new THREE.Vector3());

  /**
   * Picking a graha, by hand, in all three views.
   *
   * Two things rule out the ordinary way. The raycaster is wrong in क्षितिज:
   * every material there has the fisheye injected into its vertex shader, so
   * what is *drawn* is nowhere the camera matrix knows about — the camera stays
   * a quiet 60° perspective used only for depth — and three was testing a
   * picture nobody is looking at. And the `click` event is unreliable
   * everywhere, because the drag handler calls `preventDefault` on every
   * pointermove, which is enough to stop the browser ever synthesising one. A
   * press that worked before a drag would silently stop working after.
   *
   * So: `pointerup`, with the movement since `pointerdown` deciding whether it
   * was a press or a drag, and the graha found by projecting each body to the
   * screen the same way its label is placed — the fisheye in क्षितिज, the plain
   * camera in the other two — and taking the nearest within {@link PICK_RADIUS}.
   * One path, one behaviour, three views.
   *
   * A second press on the same graha inside {@link DOUBLE_MS} means follow it
   * rather than merely look at it.
   */
  useEffect(() => {
    const el = gl.domElement;
    const at = new THREE.Vector3();
    const scratchPick = new THREE.Vector3();
    let downX = 0;
    let downY = 0;
    let downId: number | null = null;
    let lastKey: GrahaKey | null = null;
    let lastAt = 0;

    const onDown = (e: PointerEvent) => {
      if (downId !== null) return;
      downId = e.pointerId;
      downX = e.clientX;
      downY = e.clientY;
    };

    const pick = (e: PointerEvent): GrahaKey | null => {
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const field = fovForZoom("horizon", view.current.distance);
      let best: GrahaKey | null = null;
      let bestDistance = PICK_RADIUS;
      for (const key of GEO_BODY_ORDER) {
        const group = bodyRefs.current[key];
        if (!group || !group.visible) continue;
        group.getWorldPosition(at);
        let x: number;
        let y: number;
        if (mode === "horizon") {
          const hit = projectHorizonRaw(at, camera, field, rect.width, rect.height, scratchPick);
          if (!hit) continue;
          x = hit.x;
          y = hit.y;
        } else {
          scratchPick.copy(at).project(camera);
          if (scratchPick.z > 1) continue;
          x = (scratchPick.x * 0.5 + 0.5) * rect.width;
          y = (-scratchPick.y * 0.5 + 0.5) * rect.height;
        }
        const d = Math.hypot(x - px, y - py);
        if (d < bestDistance) {
          bestDistance = d;
          best = key;
        }
      }
      return best;
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== downId) return;
      downId = null;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > DRAG_SLOP) return;
      const key = pick(e);
      if (!key) return;
      const now = performance.now();
      const again = key === lastKey && now - lastAt < DOUBLE_MS;
      lastKey = key;
      lastAt = now;
      if (again) onFollow(key);
      else onSelect(key);
    };
    const onCancel = () => {
      downId = null;
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onCancel);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onCancel);
    };
  }, [camera, gl, mode, onFollow, onSelect, view]);
  /** The last focus request answered, and whether one is still outstanding. */
  const lastFocusNonce = useRef(focusNonce);
  const recentre = useRef(false);
  const lastAim = useRef(0);
  const aimAt = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());
  /** Screen-up in world space, so a name can be hung off the edge of a disc. */
  const screenUp = useRef(new THREE.Vector3());
  /** Your place on the globe, in world space — the camera's other lock target. */
  const observerTrack = useRef(new THREE.Vector3());
  const fisheye = useMemo(() => createHorizonFisheyeUniforms(), []);

  // Re-derive the trail as soon as the graha or the calibration changes, and
  // re-anchor a locked sky to whatever date the nav has just jumped to.
  useEffect(() => {
    lastTrailKey.current = "";
    lockedLst.current = null;
    lastBelt.current = null;
  }, [selectedKey, calibration, mode, observer, ayanamsaShift]);

  // Turning the band or its labels back on has to redraw it: while it was off
  // the projection was skipped, so the vertices are wherever they were left.
  useEffect(() => {
    lastBelt.current = null;
    // The wheel rebuilds its highlight meshes with it, so the tint is gone too.
    lastBeltKey.current = null;
  }, [toggles.rashiBelt, toggles.nakshatraBelt, toggles.monthRing, toggles.constellations]);

  useFrame((state, delta) => {
    try {
      runFrame(state, delta);
    } catch (err) {
      console.error("SKY FRAME ERROR", err);
    }
  });

  function runFrame(state: Parameters<Parameters<typeof useFrame>[0]>[0], delta: number) {
    const s = sim.current;
    if (s.playing) s.timeMs += delta * s.secondsPerRealSecond * 1000;

    const date = new Date(s.timeMs);
    const sky = geocentricSky(date, calibration);
    const dtDays = daysSinceJ2000(date);
    const horizon = mode === "horizon";
    const globe = mode === "globe";
    const space = mode === "space";
    /* Both the dome and the globe draw the banded zodiac and place grahas on
       it; only the space view uses the schematic shells. */
    const zodiac = horizon || globe;
    /* ── whose राशि and नक्षत्र the belts light up ─────────────────────
       One graha at a time, and the Sun until you pick another: the same graha
       the sightline is drawn for, so the lit segments and the line agree about
       where on the belt to look. The month ring is the one thing that stays
       the Sun's — the महिना *are* its twelve signs, so dimming them off
       another graha says nothing. */
    const sunRashi = Math.floor(normalizeDeg(sky.sun.longitude) / RASHI_ARC) % 12;
    const beltKey: GrahaKey = selectedKey ?? "sun";
    const beltLon = normalizeDeg(sky[beltKey].longitude);
    const beltRashi = Math.floor(beltLon / RASHI_ARC) % 12;
    const beltNak = Math.floor(beltLon / NAKSHATRA_ARC) % 27;
    if (space) {
      const tint = lastBeltKey.current !== beltKey ? GRAHA_COLOR[beltKey] : null;
      if (rashiHiRef.current) {
        rashiHiRef.current.rotation.z = beltRashi * (Math.PI / 6);
        if (tint) (rashiHiRef.current.material as THREE.MeshBasicMaterial).color.set(tint);
      }
      if (nakHiRef.current) {
        nakHiRef.current.rotation.z = beltNak * ((Math.PI * 2) / 27);
        if (tint) (nakHiRef.current.material as THREE.MeshBasicMaterial).color.set(tint);
      }
      lastBeltKey.current = beltKey;
    }

    /* The server's Lahiri value for the date on screen, carried as an offset on
       the local fit: exact where the API spoke, and evolving at the right rate
       either side of it. This is the number that decides where the sidereal
       zero — the start of मेष — sits against the equinox, so the whole belt
       hangs off it. */
    const ayan = ayanamsa(dtDays) + ayanamsaShift;
    const eps = obliquity(dtDays);
    /* Locked, the sky keeps the sidereal time it had when the lock went on, so
       the belt stays put and only the grahas walk along it. */
    const liveLst = lstDeg(date, observer.lon);
    if (!toggles.lockStars) lockedLst.current = null;
    else if (lockedLst.current == null) lockedLst.current = liveLst;
    const lst = lockedLst.current ?? liveLst;

    /**
     * How far the Earth has turned, as an angle — Greenwich's hour angle from
     * the equinox, in radians.
     *
     * Greenwich sidereal time, not a count of rotations since J2000: both run
     * at one turn per sidereal day, but the count starts from zero and the
     * real thing started from 280.46° — so the count leaves the map a fixed
     * three-quarter turn away from where the sky says it should be, and the
     * Sun stands over the wrong ocean at local noon. Both frames put the
     * vernal equinox on +X and measure longitude the same way round, so the
     * sidereal angle drops straight in.
     */
    const earthSpin = lstDeg(date, 0) * DEG;

    /**
     * ecliptic → the globe frame: Earth upright with its axis along +Y and its
     * equator in the XZ plane, and the ecliptic tilted off it by the obliquity
     * about the line of equinoxes.
     *
     * That single tilt is the whole story of the ayana. At tropical longitude 0
     * and 180 the ring crosses the equator — the two sampat. At 90 it stands
     * `eps` north (Karka Sankranti) and at 270 `eps` south (Makara Sankranti),
     * and the Sun riding the ring drags the subsolar point between the tropics
     * over the year: uttarayana climbing north, dakshinayana falling south.
     */
    const globePlace = (lonSid: number, latEc: number, radius: number): [number, number, number] => {
      /* The same handedness as the space view and as the globe underneath it.
         The ring used to be mirrored here, to turn the rashi the other way
         round; that put the Earth's own map on backwards, so the frame is now
         the honest one throughout and the rashi run as the geometry has them. */
      const [x, y, z] = eclipticToVec3(lonSid + ayan, latEc, radius);
      const c = Math.cos(eps * DEG);
      const s = Math.sin(eps * DEG);
      /* Tilted about the line of equinoxes, so tropical 90° comes out `eps`
         north — Karka Sankranti at the Tropic of Cancer — and 270° `eps` south.
         Flip the sense of this without the longitude and uttarayana runs
         backwards. */
      return [x, y * c - z * s, y * s + z * c];
    };

    const tiltEcliptic = (p: [number, number, number]): [number, number, number] => {
      const c = Math.cos(eps * DEG);
      const s = Math.sin(eps * DEG);
      return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
    };

    /**
     * Sidereal ecliptic longitude → scene position, in whichever frame is live.
     *
     * Space matches the Learn playground: Earth stands upright (equator in XZ)
     * and the wheel / grid / grahas live in the ecliptic, tilted off that
     * equator by the obliquity — which is why the grid reads as an ellipse
     * around the Earth rather than a flat circle you are looking down on.
     */
    const place = (lonSid: number, latEc: number, spaceRadius: number): [number, number, number] => {
      if (space) return tiltEcliptic(eclipticToVec3(lonSid, latEc, spaceRadius));
      if (globe) return globePlace(lonSid, latEc, GLOBE_BAND_R);
      const { alt, az } = eclipticToAltAz(lonSid + ayan, latEc, eps, lst, observer.lat);
      return altAzToVec3(alt, az, DOME);
    };

    /**
     * Under the observer's feet, with a little slack so the compass points and
     * the skyline furniture — which sit at altitude zero — are not swept up as
     * "below" and faded.
     */
    const belowSky = (at: [number, number, number]) => horizon && at[1] < -0.5;

    /**
     * Whether a label anchor should be drawn. Overlay text has no depth test,
     * so from outside the sphere anything on the far hemisphere has to be
     * culled by hand — and inside the dome, anything under the ground too
     * unless क्षितिजमुनि is off and that half of the sky is in the picture.
     */
    const labelVisible = (at: [number, number, number]) => {
      if (space) return true;
      /* Ground is see-through, so राशि names underfoot stay on the belt. */
      if (horizon) return true;
      // Facing hemisphere only — the globe is opaque, so far-side names would
      // otherwise float over it.
      const c = state.camera.position;
      return at[0] * c.x + at[1] * c.y + at[2] * c.z > 0;
    };

    const width = state.size.width;
    const height = state.size.height;
    const collect = frame.current % 6 === 0;
    const collected: ScreenLabel[] = [];
    // Second column of the camera's world matrix: which way is up on screen.
    screenUp.current.setFromMatrixColumn(state.camera.matrixWorld, 1).normalize();
    /**
     * Is the Earth between the camera and this point?
     *
     * In अन्तरिक्ष the globe is opaque and sits at the origin, but the names are
     * DOM nodes and a DOM node has no depth test — so `सूर्य` went on floating
     * over the Pacific while the Sun itself was correctly hidden behind it. Ray
     * against sphere, from the eye to the label: `oc` is the camera's own
     * position because the sphere is centred on the origin.
     */
    const behindEarth = (at: [number, number, number]) => {
      if (!space) return false;
      const cam = state.camera.position;
      const dx = at[0] - cam.x;
      const dy = at[1] - cam.y;
      const dz = at[2] - cam.z;
      const reach = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (reach < 1e-4) return false;
      const ix = dx / reach;
      const iy = dy / reach;
      const iz = dz / reach;
      const b = cam.x * ix + cam.y * iy + cam.z * iz;
      const c = cam.lengthSq() - EARTH_RADIUS * EARTH_RADIUS;
      const disc = b * b - c;
      if (disc <= 0) return false;
      const hit = -b - Math.sqrt(disc);
      return hit > 0 && hit < reach;
    };

    /**
     * `at` is where the text goes, which is not always where the thing is: a
     * graha's name is hung a body-radius below its disc. `anchor` is the thing
     * itself, so a graha sitting right on the skyline is not called "below"
     * merely because its label hangs under it.
     */
    const project = (
      label: Omit<ScreenLabel, "x" | "y">,
      at: [number, number, number],
      anchor: [number, number, number] = at,
    ) => {
      if (behindEarth(at)) return;
      let x: number;
      let y: number;
      if (horizon) {
        scratch.current.set(at[0], at[1], at[2]);
        const hit = projectHorizon(
          scratch.current,
          state.camera,
          fisheye.uHorizonFov.value,
          width,
          height,
          scratch.current,
        );
        if (!hit) return;
        x = hit.x;
        y = hit.y;
      } else {
        scratch.current.set(at[0], at[1], at[2]).project(state.camera);
        if (scratch.current.z > 1) return;
        x = (scratch.current.x * 0.5 + 0.5) * width;
        y = (-scratch.current.y * 0.5 + 0.5) * height;
        if (x < -60 || y < -30 || x > width + 60 || y > height + 30) return;
      }
      collected.push({ ...label, x, y, ...(belowSky(anchor) ? { below: true } : {}) });
    };

    /* ── bodies ─────────────────────────────────────────────────────── */
    let sunAltitude = -90;
    for (const key of GEO_BODY_ORDER) {
      const body = sky[key];
      const spaceR = shellRadius(key, body.distanceAu) * SPACE_SHELL_SCALE;
      const at = place(body.longitude, body.latitude, spaceR);

      if (key === "sun") {
        const { alt } = eclipticToAltAz(body.longitude + ayan, body.latitude, eps, lst, observer.lat);
        sunAltitude = alt;
      }

      /** The body's radius as actually drawn, in world units. */
      const drawnR = globe
        ? DOME_RADIUS[key] * GLOBE_BODY_SCALE
        : horizon
          ? DOME_RADIUS[key]
          : bodyRadius(key, body.distanceAu) * SPACE_SHELL_SCALE * SPACE_BODY_SCALE;

      const group = bodyRefs.current[key];
      if (group) {
        group.position.set(at[0], at[1], at[2]);
        group.scale.setScalar(drawnR / BODY_RADIUS[key]);
        /* Translucent ground no longer hides the underfoot half — the belt
           and the grahas on it stay in the picture through the hills. */
        group.visible = true;
      }

      const spin = spinRefs.current[key];
      // Slow signature spin so each body reads as a globe, not a disc.
      if (spin) spin.rotation.y = (dtDays * (key === "sun" ? 0.25 : 1.6) * Math.PI * 2) % (Math.PI * 2);

      const retro = retroRefs.current[key];
      if (retro) retro.visible = body.retrograde;

      const shell = shellRefs.current[key];
      if (shell) {
        shell.scale.setScalar(spaceR);
        /* Orbits sit *on* the ecliptic plane. Hiding them when the grid is on
           left the plane empty — the grid is the plane, the shells are the
           grahas' paths across it. */
        shell.visible = space;
      }

      const ray = rays[key];
      if (space) {
        setPoint(ray, 0, at);
        setPoint(ray, 1, place(body.longitude, 0, NAK_OUTER));
      } else {
        setPoint(ray, 0, [0, 0, 0]);
        setPoint(ray, 1, at);
      }
      flushLine(ray);
      /* Space: one sightline only, running out through both belts — for the
         graha you picked, or the Sun until you pick one, so it always matches
         the lit राशि and नक्षत्र segments. Globe keeps the Sun's ray off (it
         would run through the Earth) and shows any other when selected.
         Horizon: whatever is above the ground. */
      ray.visible = space
        ? key === beltKey
        : globe
          ? key !== "sun" && key === selectedKey
          : at[1] > 0;

      // A DOM label has no depth test, so the ground cannot hide it the way it
      // hides the body — {@link labelVisible} has to do it by hand.
      if (collect && labelVisible(at)) {
        /* Hung below the disc rather than pinned to the centre. A fixed pixel
           nudge cannot do this once a body can be anything from a speck to
           half the screen: the offset has to be the body's own radius. */
        const up = screenUp.current;
        project(
          { id: `g-${key}`, kind: "graha", key },
          [at[0] - up.x * drawnR, at[1] - up.y * drawnR, at[2] - up.z * drawnR],
          at,
        );
      }

      /* ── the selected graha, marked against the belt ─────────────────
         Two readings the belt cannot give on its own: where along it the
         graha stands, and how far off its plane. The first is a mark on the
         wall at the graha's own longitude; the second is the drop from the
         body to the plane, which is the शर at the same scale as everything
         around it. Space view only — inside the dome and on the globe the
         belt is a ring on a sphere and has no wall to mark. */
      if (space && key === selectedKey) {
        const local = eclipticToVec3(body.longitude, body.latitude, spaceR);
        const localFoot = eclipticToVec3(body.longitude, 0, spaceR);
        const foot = sharaFootRef.current;
        if (foot) {
          foot.position.set(localFoot[0], localFoot[1], localFoot[2]);
          foot.rotation.set(-Math.PI / 2, 0, 0);
          foot.visible = true;
        }
        setPoint(sharaLine, 0, local);
        setPoint(sharaLine, 1, localFoot);
        flushLine(sharaLine);
        sharaLine.visible = true;
        sharaLine.material.color.set(GRAHA_COLOR[key]);
      }
    }

    const ecl = eclipseOf(sky);
    moonEclipse.current.kind = ecl.kind;
    moonEclipse.current.mag = ecl.mag;
    const moonG = bodyRefs.current.moon;
    if (space && moonG && ecl.kind === "lunar") {
      umbraFrom.current.set(0, 0, 0);
      umbraTo.current.copy(moonG.position);
      placeUmbra(
        lunarUmbra,
        umbraFrom.current,
        umbraTo.current,
        EARTH_RADIUS * 0.55,
        umbraAxis.current,
      );
      (lunarUmbra.material as THREE.MeshBasicMaterial).opacity = 0.16 + 0.28 * ecl.mag;
    } else {
      lunarUmbra.visible = false;
    }
    if (space && moonG && ecl.kind === "solar") {
      umbraFrom.current.copy(moonG.position);
      umbraTo.current.set(0, 0, 0);
      placeUmbra(
        solarUmbra,
        umbraFrom.current,
        umbraTo.current,
        BODY_RADIUS.moon * moonG.scale.x * 1.85,
        umbraAxis.current,
      );
      (solarUmbra.material as THREE.MeshBasicMaterial).opacity = 0.72 + 0.22 * ecl.mag;
    } else {
      solarUmbra.visible = false;
    }

    if (!space || !selectedKey) {
      if (sharaFootRef.current) sharaFootRef.current.visible = false;
      sharaLine.visible = false;
    }

    /* ── the banded zodiac, the equator and the alt-az cage ──────────── */
    /* Re-projected only when the mapping has actually changed. Inside the dome
       that is every frame — the sky wheels past — but the globe's ring is drawn
       in the Earth's own frame and nailed to the stars, so there it is built
       once and then left alone, which is what keeps the spin smooth when the
       sky is unlocked. Sidereal time therefore only counts in the dome. */
    const beltLst = horizon ? quantizeDeg(lst) : 0;
    const beltAyan = quantizeDeg(ayan);
    const beltEps = quantizeDeg(eps);
    const beltMoved =
      !lastBelt.current ||
      lastBelt.current.mode !== mode ||
      lastBelt.current.lst !== beltLst ||
      lastBelt.current.ayan !== beltAyan ||
      lastBelt.current.eps !== beltEps;

    /**
     * The sphere the fixed stars are drawn on, for whichever view is live.
     *
     * Inside the dome and around the globe that is the sky itself. In the space
     * view there is no sky sphere — the belt *is* the far edge of the picture —
     * so each figure is laid flat in its own नक्षत्र band, as a patch of the
     * wheel rather than a wall standing on it.
     */
    const starRadius = space ? NAK_OUTER + 0.25 : DOME * 0.995;

    /**
     * A fixed star's place, in whichever frame is live.
     *
     * Inside the dome and around the globe the sky is a sphere and the star
     * goes on it, at its true position and precessing. In the space view it
     * goes where the diagram wants it — see {@link spaceStarPos}.
     */
    const starPlace = (index: number, lonSid: number, latEc: number): [number, number, number] =>
      space ? tiltEcliptic(spaceStarPos[index] ?? [0, 0, 0]) : place(lonSid, latEc, starRadius);

    if ((zodiac || space) && beltMoved) {
      lastBelt.current = { mode, lst: beltLst, ayan: beltAyan, eps: beltEps };

      /* Dome and globe only: in the space view `place` takes its radius from
         the caller, and the banded zodiac asks for zero — which would fold the
         whole band onto the origin. That band is drawn as flat geometry there
         instead, and needs nothing from this. */
      if ((toggles.rashiBelt || toggles.nakshatraBelt) && zodiac) {
        for (const { src, object } of skyLines) {
          for (let i = 0; i < src.length; i += 1) {
            setPoint(object, i, place(src[i].lon, src[i].lat, 0));
          }
          flushLine(object);
        }
      }

      /* ── the नक्षत्र star groups ──────────────────────────────────────
         A star is fixed against the equinox, not against the belt: its
         longitude of date is its J2000 longitude plus the precession since,
         and `place` then takes the ayanamsa back off to reach the sidereal
         frame everything is drawn in. Do it in that order and the belt stays
         glued to its stars while both walk away from वसन्त सम्पात — which is
         the whole thing the ayanamsa measures. */
      if (toggles.constellations) {
        const precession = precessionSinceJ2000(dtDays);
        const dpr = state.gl.getPixelRatio();
        for (const { indices, object } of starField.groups) {
          (object.material as THREE.ShaderMaterial).uniforms.uPixelRatio.value = dpr;
          for (let i = 0; i < indices.length; i += 1) {
            const star = starField.stars[indices[i]];
            setVertex(object, i, starPlace(indices[i], star.lon + precession - ayan, star.lat));
          }
          (object.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
        }
        for (let i = 0; i < starField.links.length; i += 1) {
          const [a, b] = starField.links[i];
          const sa = starField.stars[a];
          const sb = starField.stars[b];
          setVertex(starField.lines, i * 2, starPlace(a, sa.lon + precession - ayan, sa.lat));
          setVertex(starField.lines, i * 2 + 1, starPlace(b, sb.lon + precession - ayan, sb.lat));
        }
        flushLine(starField.lines);
      }

      /* ── the tilt, as an angle you can read ────────────────────────────
         The axis is +Y and the ecliptic pole is `eps` off it, in the plane of
         the solstices. Draw that second line and put an arc between them and
         the obliquity stops being an implicit property of the ring. */
      if (globe && toggles.tilt) {
        const c = Math.cos(eps * DEG);
        const s2 = Math.sin(eps * DEG);
        const reach = GLOBE_R * 1.3;
        setPoint(tiltMarks.eclipticAxis, 0, [0, -reach * c, reach * s2]);
        setPoint(tiltMarks.eclipticAxis, 1, [0, reach * c, -reach * s2]);
        flushLine(tiltMarks.eclipticAxis);

        const arcR = GLOBE_R * 1.12;
        for (let i = 0; i <= TILT_ARC_STEPS; i += 1) {
          const t = (eps * (i / TILT_ARC_STEPS)) * DEG;
          setPoint(tiltMarks.arc, i, [0, arcR * Math.cos(t), -arcR * Math.sin(t)]);
        }
        flushLine(tiltMarks.arc);
      }

      /* ── the tropics, at the tilt of the day ───────────────────────────
         The two parallels *are* the obliquity, laid on the ground: the Sun
         stands overhead there at the ayana ends and nowhere further. Drawn
         once at 23.44° they only match a sky near our own — this clock runs
         to both ends of the बिक्रम axis, where the tilt is most of a degree
         away and the subsolar point crossed a line that was not the tropic.
         Rebuilt only when it has actually moved: within a lifetime it has
         not, and this is a frame loop. */
      if (globe && Math.abs(tropicEps.current - eps) > 0.002) {
        tropicEps.current = eps;
        for (const tropic of globeLines.tropics) {
          const lat = tropic.id === "cancer" ? eps : -eps;
          tropic.lat = lat;
          for (let i = 0; i < tropic.src.length; i += 1) {
            setVertex(tropic.object, i, geoToVec3(lat, tropic.src[i].lon, GLOBE_R * 1.01));
          }
          flushLine(tropic.object);
        }
      }

      /* ── the ध्रुव तारा ────────────────────────────────────────────────
         Same transform as any other fixed star. In this frame the Earth's axis
         is what stands still, so it is the pole *circle* that wheels past it —
         the equivalent picture to the axis sweeping its cone, and the one that
         shows you which star is on duty. */
      if (toggles.poleStars && zodiac) {
        const precession = precessionSinceJ2000(dtDays);
        const dpr = state.gl.getPixelRatio();
        for (const object of [poleField.points, poleField.crown]) {
          (object.material as THREE.ShaderMaterial).uniforms.uPixelRatio.value = dpr;
        }
        for (let i = 0; i < poleField.stars.length; i += 1) {
          const s = poleField.stars[i];
          setVertex(poleField.points, i, place(s.lon + precession - ayan, s.lat, DOME * 0.995));
        }
        (poleField.points.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate =
          true;

        for (let i = 0; i < poleField.track.length; i += 1) {
          const p = poleField.track[i];
          setPoint(poleField.trackLine, i, place(p.lon + precession - ayan, p.lat, DOME * 0.995));
        }
        flushLine(poleField.trackLine);

        const reigning = reigningPoleStar(poleField.stars, dtDays, eps);
        if (reigning) {
          setVertex(
            poleField.crown,
            0,
            place(reigning.star.lon + precession - ayan, reigning.star.lat, DOME * 0.995),
          );
          (poleField.crown.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate =
            true;
        }
      }

      if (horizon && (toggles.rashiBelt || toggles.nakshatraBelt)) {
        for (let i = 0; i <= ecliptic_STEPS; i += 1) {
          // Declination 0 all the way round — the celestial equator, which the
          // ecliptic crosses at the two equinoxes and nowhere else. On the
          // globe this is drawn on the sphere itself instead.
          const eq = equatorialToAltAz({ ra: (i / ecliptic_STEPS) * 360, dec: 0 }, lst, observer.lat);
          setPoint(equatorLine, i, altAzToVec3(eq.alt, eq.az, DOME * 0.997));
        }
        flushLine(equatorLine);
      }
    }

    if (collect && (toggles.rashiBelt || toggles.nakshatraBelt || (space && toggles.monthRing))) {
      /**
       * Space view: names sit on the wheel, in the ecliptic plane, the way the
       * Learn playground labels its belts. Globe and horizon still write them
       * on the banded zodiac on the sphere.
       */
      const onWheel = (lon: number, radius: number): [number, number, number] => {
        const a = lon * DEG;
        return tiltEcliptic([radius * Math.cos(a), 0.04, -radius * Math.sin(a)]);
      };

      if (toggles.rashiBelt) {
        for (let i = 0; i < 12; i += 1) {
          const lon = (i + 0.5) * RASHI_ARC;
          const at = space ? onWheel(lon, RASHI_LABEL_R) : place(lon, RASHI_LABEL_LAT, RASHI_MID);
          if (labelVisible(at)) {
            project({ id: `r-${i}`, kind: "rashi", index: i + 1, dim: i !== beltRashi }, at);
          }
        }
      }
      if (space && toggles.monthRing) {
        for (let i = 0; i < 12; i += 1) {
          const lon = (i + 0.5) * RASHI_ARC;
          const at = onWheel(lon, MONTH_LABEL_R);
          if (labelVisible(at)) {
            project({ id: `m-${i}`, kind: "month", index: i + 1, dim: i !== sunRashi }, at);
          }
        }
      }
      if (toggles.nakshatraBelt) {
        for (let i = 0; i < 27; i += 1) {
          const lon = (i + 0.5) * NAKSHATRA_ARC;
          const at = space ? onWheel(lon, NAK_MID) : place(lon, NAK_LABEL_LAT, NAK_MID);
          if (labelVisible(at)) {
            project({ id: `n-${i}`, kind: "nakshatra", index: i + 1, dim: i !== beltNak }, at);
          }
        }

        /* पाद names belong to the globe/horizon band, where the camera can
           push in on a strip of sky. On the space wheel they are 108 numbers
           stacked on a ring — the Learn playground does not draw them. */
        if (!space && view.current.distance <= PADA_ZOOM) {
          const padaArc = NAKSHATRA_ARC / 4;
          for (let i = 0; i < 108; i += 1) {
            const lon = (i + 0.5) * padaArc;
            const at = place(lon, NAK_LABEL_LAT, NAK_OUTER - 0.32);
            if (labelVisible(at)) {
              project(
                { id: `p-${i}`, kind: "pada", index: (i % 4) + 1 },
                at,
              );
            }
          }
        }
      }
    }

    if (collect && horizon && !globe) {
      for (const c of COMPASS_POINTS) {
        project(
          { id: `c-${c.en}`, kind: "cardinal", text: c.en },
          altAzToVec3(0, c.az, DOME * 0.94),
        );
      }
      if (toggles.grid) {
        /* The numbers on the cage. Placing them is its own problem — a line
           has to be *walked* to find where it leaves the frame, or an
           almucantar lying along the bottom edge stamps its number across the
           whole width — so it lives in `grid-labels`. */
        const field = fovForZoom("horizon", view.current.distance);
        for (const g of buildGridLabels({
          camera: state.camera,
          fovDeg: field,
          width,
          height,
          radius: DOME * 0.995,
          gridStep: gridStepForFov(field),
          scratch: scratch.current,
        })) {
          collected.push({
            id: g.id,
            kind: "azimuth",
            text: g.text,
            side: g.side,
            x: g.x,
            y: g.y,
          });
        }
      }
    }

    /* Each star group's own name, anchored on the group.
       The mean of the members lands inside the sphere, so it is pushed back out
       to where the stars are — otherwise the text would sit at a different
       depth from the figure it names and drift against it as the view turns. */
    /* Dome and globe only. In the space view each figure is drawn inside the
       segment named after it, so its own name would be that name twice. */
    if (collect && zodiac && toggles.constellations) {
      const precession = precessionSinceJ2000(dtDays);
      for (const [nak, indices] of starField.byNakshatra) {
        let x = 0;
        let y = 0;
        let z = 0;
        let radius = 0;
        for (const i of indices) {
          const s = starField.stars[i];
          const p = starPlace(i, s.lon + precession - ayan, s.lat);
          x += p[0];
          y += p[1];
          z += p[2];
          radius = Math.hypot(p[0], p[1], p[2]);
        }
        /* On a sphere the mean of the members falls inside it, so it is pushed
           back out to where the stars are — otherwise the text sits at a
           different depth from the figure it names and drifts against it as
           the view turns. On the drum's wall the mean is already on the wall in
           height; only its distance from the axis needs restoring. */
        let at: [number, number, number];
        if (space) {
          const flat = Math.hypot(x, z) || 1;
          at = [(x / flat) * starRadius, y / indices.length, (z / flat) * starRadius];
        } else {
          const len = Math.hypot(x, y, z) || 1;
          at = [(x / len) * radius, (y / len) * radius, (z / len) * radius];
        }
        if (labelVisible(at)) {
          project({ id: `ast-${nak}`, kind: "asterism", index: nak }, at);
        }
      }
    }

    /* The two axes and the angle between them, named. */
    if (collect && globe && toggles.tilt) {
      const c = Math.cos(eps * DEG);
      const s2 = Math.sin(eps * DEG);
      project({ id: "axis-earth", kind: "axis", text: "earth" }, [0, GLOBE_R * 1.38, 0]);
      project({ id: "axis-ecliptic", kind: "axis", text: "ecliptic" }, [
        0,
        GLOBE_R * 1.38 * c,
        -GLOBE_R * 1.38 * s2,
      ]);
      // On the arc's midpoint, pushed out a little so it clears the curve.
      const mid = (eps / 2) * DEG;
      project({ id: "obliquity", kind: "obliquity", deg: eps }, [
        0,
        GLOBE_R * 1.24 * Math.cos(mid),
        -GLOBE_R * 1.24 * Math.sin(mid),
      ]);
    }

    /* Pole-star names, with the year each takes its turn. The reigning one is
       flagged so the overlay can crown it. */
    if (collect && zodiac && toggles.poleStars) {
      const precession = precessionSinceJ2000(dtDays);
      const simYear = 2000 + dtDays / 365.25;
      const reigning = reigningPoleStar(poleField.stars, dtDays, eps);
      for (const s of poleField.stars) {
        const at = place(s.lon + precession - ayan, s.lat, DOME * 0.995);
        if (!labelVisible(at)) continue;
        project(
          {
            id: `pole-${s.en}`,
            kind: "polestar",
            text: s.en,
            year: Math.round(poleStarEpoch(s.lon, simYear)),
            index: reigning && reigning.star.en === s.en ? 1 : 0,
          },
          at,
        );
      }
    }

    if (collect && globe) {
      /* The four turning points of the solar year, marked on the ring where
         they actually fall: the sampat on the equator, the ayana ends level
         with the two tropics. */
      for (const st of SOLAR_STATIONS) {
        const at = globePlace(st.tropicalLon - ayan, 0, GLOBE_BAND_R * 1.06);
        if (labelVisible(at)) {
          project({ id: `st-${st.id}`, kind: "station", text: st.id }, at);
        }
      }
      for (const t of globeLines.tropics) {
        // Put the tropic's name on the limb facing the camera.
        const at = geoToVec3(t.lat, 0, GLOBE_R * 1.02);
        scratch.current.set(at[0], at[1], at[2]);
        if (globeSpinRef.current) scratch.current.applyQuaternion(globeSpinRef.current.quaternion);
        const world: [number, number, number] = [
          scratch.current.x,
          scratch.current.y,
          scratch.current.z,
        ];
        if (labelVisible(world)) {
          project({ id: `tr-${t.id}`, kind: "tropic", text: t.id }, world);
        }
      }
      /* The observer's place carries no overlay label. A DOM node cannot be
         nailed to a spinning sphere the way the marker mesh is — it is
         re-projected every sixth frame and always trails the dot it belongs
         to — so the dot is left to say it on its own, which it does. */
    }

    /* ── frame-level scenery ────────────────────────────────────────── */
    if (earthGroupRef.current) earthGroupRef.current.visible = space;
    // The globe replaces the ground: from out here you are looking at the whole
    // Earth, not standing on a patch of it.
    /* One switch, not two: भूभाग *is* the ground. `belowHorizon` used to be a
       second chip that had to agree with it before any hillside appeared,
       which meant a reader could turn the landscape on and get nothing. */
    const showGround = horizon && !globe && toggles.landscape;
    /* Half-opaque, so the राशि belt reads through the valley.
     *
     * The fade only starts once the lens is tighter than a 20° crop, and is
     * gone by 6°. It used to begin the moment you left the 90° opening view
     * and be finished by 28° — which was most of the zoom range even before
     * the lens gained its arcminute end, so pressing भूभाग anywhere but the
     * widest view turned on a landscape you could not see. A switch that
     * appears to do nothing is worse than no switch. */
    const horizonFov = fovForZoom("horizon", view.current.distance);
    const zoomFade = horizonFov >= 20 ? 1 : Math.max(0, (horizonFov - 6) / (20 - 6));
    const groundOpacity = 0.5 * zoomFade;
    if (groundRef.current) groundRef.current.visible = showGround && groundOpacity > 0.02;
    /* Light on the hills, following the Sun through the twilight. The map is
       a daytime valley; this tints it down to night without rebuilding it. */
    const x = (sunAltitude - GROUND_DUSK) / (GROUND_DAWN - GROUND_DUSK);
    const dusk = Math.min(1, Math.max(0, x));
    const landT = dusk * dusk * (3 - 2 * dusk);
    if (groundMatRef.current) {
      groundMatRef.current.color.copy(GROUND_NIGHT).lerp(GROUND_DAY, landT);
      groundMatRef.current.opacity = groundOpacity;
    }
    if (spaceOnlyRef.current) {
      spaceOnlyRef.current.visible = space;
      spaceOnlyRef.current.rotation.x = space ? eps * DEG : 0;
    }
    if (globeRootRef.current) globeRootRef.current.visible = globe;
    for (const { layer, object } of skyLines) {
      const on =
        layer === "shared"
          ? toggles.rashiBelt || toggles.nakshatraBelt
          : layer === "rashi"
            ? toggles.rashiBelt
            : toggles.nakshatraBelt;
      object.visible = zodiac && on;
    }
    // The star groups belong to the sky, so they live wherever the belt does.
    for (const { object } of starField.groups) {
      object.visible = (zodiac || space) && toggles.constellations;
    }
    starField.lines.visible = (zodiac || space) && toggles.constellations;
    poleField.points.visible = zodiac && toggles.poleStars;
    poleField.crown.visible = zodiac && toggles.poleStars;
    poleField.trackLine.visible = zodiac && toggles.poleStars;
    // The tilt is only drawn where the Earth is: the globe view.
    tiltMarks.eclipticAxis.visible = globe && toggles.tilt;
    tiltMarks.arc.visible = globe && toggles.tilt;
    equatorLine.visible = horizon && !globe && (toggles.rashiBelt || toggles.nakshatraBelt);
    const gridOn = horizon && !globe && toggles.grid;
    grid.group.visible = gridOn;
    /* Version-guarded inside, so this is a no-op after the first frame. */
    if (gridOn) injectHorizonFisheyeIn(grid.frame, fisheye);
    /* The finest local tier that is on — only one is ever drawn, because they
       nest by a factor of two or three and stacking them over a one-degree
       window is a wash rather than a grid. */
    let localTier: (typeof GRID_TIERS)[number] | null = null;
    for (let i = 0; i < GRID_TIERS.length; i += 1) {
      const tier = GRID_TIERS[i];
      const wanted = gridOn && horizonFov < tier.maxFov;
      if (tier.local) {
        if (wanted) localTier = tier;
        continue;
      }
      let object = grid.tiers[i];
      if (wanted && !object) {
        object = bakeHorizonGrid(tier.step, tier.skipMultiplesOf, tier.opacity);
        injectHorizonFisheyeIn(object, fisheye);
        grid.tiers[i] = object;
      }
      if (object) {
        if (object.parent !== grid.group) grid.group.add(object);
        object.visible = wanted;
      }
    }
    if (localTier) {
      const view = horizonViewWindow(state.camera, horizonFov, width, height);
      const count = buildLocalGridPairs(
        localTier.step,
        localTier.skipMultiplesOf,
        {
          altLo: view.altLo,
          altHi: view.altHi,
          azLo: view.centreAz - view.azHalf,
          azHi: view.centreAz + view.azHalf,
        },
        grid.localPairs,
      );
      for (let i = 0; i < count; i += 1) {
        const p = grid.localPairs[i];
        setPoint(grid.local, i, altAzToVec3(p.alt, p.az, GRID_R));
      }
      grid.local.geometry.setDrawRange(0, count);
      (grid.local.material as THREE.LineBasicMaterial).opacity = localTier.opacity;
      flushLine(grid.local);
      injectHorizonFisheyeIn(grid.local, fisheye);
      grid.local.visible = true;
    } else {
      grid.local.visible = false;
    }
    horizonRing.visible = gridOn;
    if (horizonGroupRef.current) horizonGroupRef.current.quaternion.identity();

    /* ── the Earth globe ────────────────────────────────────────────── */
    if (globe) {
      // The graticule turns with the Earth; the zodiac ring around it does not.
      if (globeSpinRef.current) {
        const spin = toggles.lockStars ? 0 : earthSpin;
        // +Y is the axis; positive Y rotation is eastward (prograde), viewed from the north pole.
        globeSpinRef.current.rotation.y = spin % (Math.PI * 2);
      }
      for (const { object } of globeLines.parallels) object.visible = toggles.grid;
      for (const { object } of globeLines.meridians) object.visible = toggles.grid;
      globeLines.equator.object.visible = true;
      for (const { object } of globeLines.tropics) object.visible = true;

      /* The Sun's ray, and the subsolar point it plants on the globe — the
         thing that climbs to the Tropic of Cancer and back. */
      const sunAt = place(sky.sun.longitude, sky.sun.latitude, GLOBE_BAND_R);
      const len = Math.hypot(sunAt[0], sunAt[1], sunAt[2]) || 1;
      setPoint(sunRay, 0, [0, 0, 0]);
      setPoint(sunRay, 1, sunAt);
      flushLine(sunRay);
      sunRay.visible = true;
      if (subsolarRef.current) {
        subsolarRef.current.position.set(
          (sunAt[0] / len) * GLOBE_R * 1.01,
          (sunAt[1] / len) * GLOBE_R * 1.01,
          (sunAt[2] / len) * GLOBE_R * 1.01,
        );
      }
    } else {
      sunRay.visible = false;
    }

    // The little Earth in the space view turns on the same angle the globe
    // does — one Earth, one orientation, whichever view is looking at it.
    if (earthRef.current) earthRef.current.rotation.y = earthSpin;
    spaceMeridian.rotation.y = earthSpin + observer.lon * DEG;
    spaceMeridian.visible = space && toggles.primeMeridian;
    globeMeridian.rotation.y = observer.lon * DEG;
    globeMeridian.visible = globe && toggles.primeMeridian;

    // The Sun is the only real light source; put it exactly where the Sun is drawn.
    if (sunLightRef.current) {
      const sunGroup = bodyRefs.current.sun;
      if (sunGroup) sunLightRef.current.position.copy(sunGroup.position);
      /* The globe shades itself, so it needs the Sun's place rather than its
         light. Read it off the light, which is already there. */
      sunLightRef.current.getWorldPosition(spaceEarthMat.uniforms.sunPosition.value);
      /* Space: no inverse-square falloff. The shells are schematic (Moon at
         ~5, Sun at ~10), so decay would make पूर्णिमा dimmer than औंसी just
         because the Moon is drawn farther from the Sun. A constant light lets
         the terminator say the geometry: dark face toward Earth at औंसी, lit
         face toward Earth at पूर्णिमा. */
      sunLightRef.current.decay = space ? 0 : 2;
      sunLightRef.current.intensity = horizon ? 1400 : globe ? 700 : 4.5;
      /* The Moon's phase runs off the Sun's *direction* from the centre — the
         observer on the dome, the Earth on the globe — which is the one thing
         a fixed-radius projection keeps true. */
      if (sunGroup) {
        moonPhaseMat.uniforms.sunDirection.value.copy(sunGroup.position).normalize();
      }
    }
    if (ambientRef.current) ambientRef.current.intensity = space ? 0.1 : 0.28;
    if (fillLightRef.current) fillLightRef.current.intensity = space ? 0 : 0.1;

    /* ── camera ─────────────────────────────────────────────────────── */
    const v = view.current;
    const cam = state.camera as THREE.PerspectiveCamera;
    /**
     * What the camera is following, if anything.
     *
     * Your own place wins over the selected graha — the lock is one target, and
     * choosing the marker is how you say it should be the ground rather than a
     * body. It only means something on the globe: inside the dome you are
     * already standing there, and from space the Earth is the centre anyway.
     *
     * The point rides the spinning globe, so the camera rides round with it —
     * the Earth turns as it always did and your place simply stays in the
     * middle of the screen, which is what the lock is for.
     */
    /* A press of केन्द्रविन्दु centres its target once, whatever the clock is
       doing; after that the hold is only for as long as the sky is moving. */
    if (focusNonce !== lastFocusNonce.current) {
      lastFocusNonce.current = focusNonce;
      recentre.current = true;
    }
    /* `recentre` alone is enough to pick a target: a single press on a graha
       asks to be *shown* it once, which is a different thing from asking the
       camera to ride it, and only the second of those turns केन्द्रविन्दु on. */
    const trackKey =
      (toggles.lockCenter || recentre.current) && !lockObserver && selectedKey
        ? selectedKey
        : null;
    const trackGroup = trackKey ? bodyRefs.current[trackKey] : null;
    let trackAt: THREE.Vector3 | null = trackGroup ? trackGroup.position : null;
    /* A star from the search box. Placed through the same `place` every other
       fixed thing goes through, so it lands wherever the view would have drawn
       it — and taken as the target for the one frame the aim is fresh. */
    if (skyAim && skyAim.nonce !== lastAim.current) {
      lastAim.current = skyAim.nonce;
      recentre.current = true;
      const at = place(skyAim.lon, skyAim.lat, DOME);
      aimAt.current.set(at[0], at[1], at[2]);
      trackAt = aimAt.current;
    }
    if (toggles.lockCenter && lockObserver && globe) {
      const at = geoToVec3(observer.lat, observer.lon, GLOBE_R);
      observerTrack.current.set(at[0], at[1], at[2]);
      // The marker rides the spinning globe, so its world position needs the
      // same quaternion — a no-op while the globe is the thing held still.
      if (globeSpinRef.current) {
        observerTrack.current.applyQuaternion(globeSpinRef.current.quaternion);
      }
      trackAt = observerTrack.current;
    }
    /**
     * Whether the camera is being *held* on the target this frame.
     *
     * Following is for watching something move: run the clock and the graha
     * stays nailed to the middle while the sky slides past it. Paused, there
     * is nothing to follow — the reader wants to look around the thing they
     * just centred, and a camera that snaps back every frame reads as a broken
     * drag. So the hold lasts as long as the clock runs, plus the one frame
     * that answers a press of केन्द्रविन्दु.
     */
    const holdCentre = trackAt != null && (s.playing || recentre.current);
    if (holdCentre) recentre.current = false;
    if (horizon) {
      /* Equidistant fisheye: screen radius is angle from the look direction.
         A perspective 170° lens is what pinched the nadir into a spike; this
         is the projection Stellarium uses, so zooming out to 180° really does
         put zenith at the top and nadir at the bottom. The camera matrix stays
         a quiet 60° perspective — only used for depth — and lookAt is not
         used, because near the zenith it rolls the cage. */
      cam.position.set(0, 0, 0);
      cam.up.set(0, 1, 0);
      if (holdCentre && trackAt) {
        /* Both negated, because the camera's angles run opposite the sky's.
         *
         * `cam.rotation.set(-pitch, yaw, 0)` in YXZ sends the view direction to
         * (−cos p·sin y, −sin p, −cos p·cos y), which against a point at
         * (cos a·sin A, sin a, −cos a·cos A) gives pitch = −altitude and
         * yaw = −azimuth. Taken straight — as this did — केन्द्रविन्दु aimed at
         * the mirror image of its target: a graha high in the south-east put
         * the camera low in the south-west, and the thing you asked to look at
         * was the one place on the dome you were not looking. */
        const len = Math.hypot(trackAt.x, trackAt.y, trackAt.z) || 1;
        v.pitch = -Math.asin(Math.max(-1, Math.min(1, trackAt.y / len)));
        v.yaw = -Math.atan2(trackAt.x, -trackAt.z);
        target.current.copy(trackAt);
      }
      cam.rotation.order = "YXZ";
      cam.rotation.set(-v.pitch, v.yaw, 0);
      const field = fovForZoom("horizon", v.distance);
      fisheye.uHorizonStereo.value = 1;
      fisheye.uHorizonFov.value = field;
      fisheye.uHorizonAspect.value = state.size.width / Math.max(state.size.height, 1);
      if (Math.abs(cam.fov - 60) > 0.01) {
        cam.fov = 60;
        cam.updateProjectionMatrix();
      }
      injectHorizonFisheyeIn(state.scene, fisheye);
    } else if (globe) {
      fisheye.uHorizonStereo.value = 0;
      /* A long lens from far back — as close to an orthographic globe as a
         perspective camera gets. The +Y matters: the camera has to stay on the
         side of the ecliptic the pitch asks for, because from underneath the
         whole zodiac runs backwards and every graha appears to go clockwise. */
      const cosP = Math.cos(v.pitch);
      /* Zoom is optical, not positional: the camera stays parked well outside
         the globe and the lens narrows, so you can push in to a couple of
         degrees of ring without ever ending up inside the Earth. */
      const radius = GLOBE_CAM_R;
      const fov = fovForZoom("globe", v.distance);
      if (trackAt) {
        target.current.copy(trackAt);
        scratch.current.copy(target.current);
        const bodyR = scratch.current.length();
        if (!holdCentre) {
          /* Released: the camera goes back to answering the drag, but keeps
             looking at what it was following, so letting go of the clock does
             not throw the target 8° off the middle of the screen. */
          cam.position.set(
            radius * cosP * Math.sin(v.yaw),
            radius * Math.sin(v.pitch),
            radius * cosP * Math.cos(v.yaw),
          );
        } else if (bodyR < 1e-5) {
          cam.position.set(radius * cosP * Math.sin(v.yaw), radius * Math.sin(v.pitch), radius * cosP * Math.cos(v.yaw));
          target.current.set(0, 0, 0);
        } else {
          /* Same hemisphere as the graha: camera rides the outward ray from
             Earth so the body stays in front of the globe, not behind it. */
          scratch.current.multiplyScalar(radius / bodyR);
          cam.position.copy(scratch.current);
          v.yaw = Math.atan2(cam.position.x, cam.position.z);
          v.pitch = Math.asin(Math.max(-1, Math.min(1, cam.position.y / radius)));
        }
        cam.lookAt(target.current);
      } else {
        target.current.set(0, 0, 0);
        cam.position.set(
          radius * cosP * Math.sin(v.yaw),
          radius * Math.sin(v.pitch),
          radius * cosP * Math.cos(v.yaw),
        );
        cam.lookAt(target.current);
      }
      if (Math.abs(cam.fov - fov) > 0.01) {
        cam.fov = fov;
        cam.updateProjectionMatrix();
      }
    } else {
      fisheye.uHorizonStereo.value = 0;
      /* Same orbit as the Learn playground: the reader's yaw/pitch, no floor
         that keeps you north of the ecliptic. Drag under the wheel and you
         go under the wheel. */
      const cosP = Math.cos(v.pitch);
      if (trackAt) target.current.copy(trackAt);
      else target.current.set(0, 0, 0);
      cam.position.set(
        target.current.x + v.distance * cosP * Math.sin(v.yaw),
        target.current.y + v.distance * Math.sin(v.pitch),
        target.current.z + v.distance * cosP * Math.cos(v.yaw),
      );
      cam.lookAt(target.current);
      if (Math.abs(cam.fov - SPACE_FOV) > 0.01) {
        cam.fov = SPACE_FOV;
        cam.updateProjectionMatrix();
      }
    }

    frame.current += 1;

    /* ── trails ─────────────────────────────────────────────────────── */
    /* Nine paths of ninety points is far too much orbital arithmetic for one
       frame — done together it drops a frame every time the epoch turns over,
       which at the fast speeds is several times a second. So the sweep is
       spread: one graha per frame, all of them off the same instant. */
    const epoch = `${mode}:${Math.floor(dtDays / 2)}`;
    const sweeping = trailCursor.current < GEO_BODY_ORDER.length;
    /* At the fast speeds the epoch turns over faster than a sweep can finish;
       letting it restart would mean only the Moon ever got redrawn, so a sweep
       always runs to the end before the next one begins. */
    if (epoch !== lastTrailKey.current && !sweeping) {
      lastTrailKey.current = epoch;
      trailCursor.current = 0;
      trailBaseDt.current = dtDays;
    }
    if (trailCursor.current < GEO_BODY_ORDER.length) {
      const key = GEO_BODY_ORDER[trailCursor.current];
      trailCursor.current += 1;
      const line = trails[key];
      const shift = calibration[key] ?? 0;
      for (let i = 0; i <= TRAIL_STEPS; i += 1) {
        const offsetDays = -TRAIL_DAYS + (i / TRAIL_STEPS) * TRAIL_DAYS * 2;
        const b = geocentricPointAt(key, trailBaseDt.current + offsetDays, shift);
        if (space) {
          setPoint(
            line,
            i,
            tiltEcliptic(
              eclipticToVec3(b.longitude, b.latitude, shellRadius(key, b.distanceAu) * SPACE_SHELL_SCALE),
            ),
          );
        } else {
          // Held at the current sidereal time, so the trail shows the
          // graha's own motion against the stars, not the Earth's spin.
          setPoint(line, i, place(b.longitude, b.latitude, DOME * 0.99));
        }
      }
      flushLine(line);
    }

    /* Keep the previous array whenever nothing has moved a pixel. The overlay
       is fifty-odd Devanagari text nodes; handing React a new array re-renders
       every one of them, on the same thread that is drawing the sky. */
    if (collect && labelsMoved(labels.current, collected)) labels.current = collected;

    if (state.clock.elapsedTime - lastSample.current > 0.2) {
      lastSample.current = state.clock.elapsedTime;
      onSample({
        timeMs: s.timeMs,
        sky,
        labels: labels.current,
        sunAltitude,
        zoomDistance: view.current.distance,
        eclipse: ecl.kind ? { kind: ecl.kind, mag: ecl.mag, node: ecl.node } : null,
      });
    }
  }

  return (
    <group>
      <ambientLight ref={ambientRef} intensity={0.28} />
      <pointLight ref={sunLightRef} intensity={520} distance={0} decay={2} color="#fff6e0" />
      {/* A hint of fill so the night side is shape rather than a hole.
          Space turns this off so Earth shows a real terminator, like Learn. */}
      <directionalLight ref={fillLightRef} position={[0, 12, 0]} intensity={0.1} />

      <mesh ref={starsRef}>
        <sphereGeometry args={[400, 64, 48]} />
        {/* Opaque, depthWrite off — same as Learn's sky. The ecliptic disc is
            transparent, so it has to paint *after* this sphere or the stars
            cover the plane and it never reads as a surface. */}
        <meshBasicMaterial map={textures.background} side={THREE.BackSide} depthWrite={false} />
      </mesh>

      {/* Space view: the Earth itself, tilted by the obliquity of the ecliptic. */}
      <group ref={earthGroupRef}>
        {/* The same globe the Learn playground draws: opaque, and shading
            itself against the Sun so the terminator is a curve that follows the
            Sun north and south. Its night side stays a readable map at
            `EARTH_NIGHT`, which is what lets you orbit round the back of the
            planet and still see where you are looking. */}
        <mesh ref={earthRef} material={spaceEarthMat}>
          <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        </mesh>
        {/* Polar axis — the diurnal spin that walks the lagna round the zodiac. */}
        <mesh>
          <cylinderGeometry args={[0.01, 0.01, EARTH_RADIUS * 3, 8]} />
          <meshBasicMaterial color={INK_DIM} transparent opacity={0.5} />
        </mesh>
        <primitive object={spaceMeridian} />
      </group>

      {/* The observer's own frame: the ground underfoot, the horizon circle and
          the alt-az cage. Standing inside, this is the identity; seen from
          outside the sphere it turns once a sidereal day while the zodiac
          stays nailed to the stars. */}
      <group ref={horizonGroupRef}>
        <group ref={groundRef} visible={false}>
          {/* Inner sky sphere with काठमाडौँ underfoot: little-planet photo
              mapped from the nadir so the hills are the skyline. Its own sky
              is alpha 0 (`alphaTest`) so the stars and the राशि belt pass.
              Turn क्षितिजमुनि off and the group hides. */}
          <mesh
            geometry={groundGeo}
            frustumCulled={false}
            renderOrder={1}
            raycast={() => {}}
          >
            <meshBasicMaterial
              ref={groundMatRef}
              map={landscapeMap}
              side={THREE.BackSide}
              transparent
              opacity={0.5}
              alphaTest={0.12}
              depthWrite={false}
              color="#ffffff"
            />
          </mesh>
        </group>
        <primitive object={horizonRing} />
        <primitive object={grid.group} />
      </group>

      {/* The Earth globe: a dark ball carrying nothing but its graticule, with
          the zodiac ring hugging it. Zooming out of the horizon view lands
          here. */}
      <group ref={globeRootRef} visible={false}>
        {/* Turns once a sidereal day; the ring globe it does not. */}
        <group ref={globeSpinRef}>
          {/* The Earth itself — opaque, so the far side of the grid and of the
              ring is hidden and the Sun picks out the lit half. It sits inside
              the spinning group, not outside it: a map has to turn with the
              graticule drawn on top of it, or Nepal walks away from its dot.

              A little emissive of its own map keeps the night side as geography
              rather than a black hole, the same trick the space view uses. */}
          <mesh ref={shellRef}>
            {/* Enough segments that the limb reads as a curve. This is the one
                sphere in the scene that fills the screen. */}
            <sphereGeometry args={[GLOBE_R * 0.995, 128, 96]} />
            {/* More emissive than before, because the map underneath it changed:
                the old one was pale and low-contrast, so a sixth of its own
                light was enough to keep the night side legible. A real Blue
                Marble has real oceans, and at that setting half the globe went
                to black. */}
            <meshStandardMaterial
              map={textures.earth}
              emissive="#ffffff"
              emissiveMap={textures.earth}
              emissiveIntensity={0.4}
              roughness={0.9}
              metalness={0.02}
            />
          </mesh>
          {/* Weather, faint enough that the graticule and the coastlines under
              it both still read. */}
          <mesh>
            <sphereGeometry args={[GLOBE_R * 1.004, 48, 48]} />
            <meshStandardMaterial
              map={textures.earthclouds}
              transparent
              opacity={0.32}
              depthWrite={false}
            />
          </mesh>

          {globeLines.parallels.map(({ object }, i) => (
            <primitive key={`par-${i}`} object={object} />
          ))}
          {globeLines.meridians.map(({ object }, i) => (
            <primitive key={`mer-${i}`} object={object} />
          ))}
          <primitive object={globeLines.equator.object} />
          {globeLines.tropics.map(({ object, id }) => (
            <primitive key={`trop-${id}`} object={object} />
          ))}
          <primitive object={globeMeridian} />
          {/* Where you are watching from — a bright marker plus a soft glow around
              it, so it reads at a glance instead of disappearing as a single dot
              against the grid. Pressing it picks your own place as what the
              camera follows, the same way pressing a graha picks that. */}
          <group position={geoToVec3(observer.lat, observer.lon, OBSERVER_R)}>
            {/* A place, not a region: at the old size the dot covered most of
                Nepal and the glow the subcontinent, which is both wrong and
                what made it read as sitting above the map rather than on it.
                The invisible disc under them keeps the press target the size a
                finger needs, which the dot no longer is. */}
            <mesh onClick={onSelectObserver}>
              <sphereGeometry args={[GLOBE_R * 0.018, 16, 16]} />
              <meshBasicMaterial color={lockObserver ? "#ffd166" : "#ff6b6b"} />
            </mesh>
            <mesh onClick={onSelectObserver}>
              <sphereGeometry args={[GLOBE_R * 0.036, 16, 16]} />
              <meshBasicMaterial
                color={lockObserver ? "#ffd166" : "#ff6b6b"}
                transparent
                opacity={lockObserver ? 0.45 : 0.3}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            {/* Transparent rather than `visible={false}`: the raycaster skips
                anything invisible, so a hidden hit target is no target. */}
            <mesh onClick={onSelectObserver}>
              <sphereGeometry args={[GLOBE_R * 0.075, 8, 8]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        </group>

        {/* The Sun's ray and the subsolar point it plants between the tropics. */}
        <primitive object={sunRay} />
        {/* The point the Sun stands over. Small on purpose — it marks one spot
            on the map, and at any size worth noticing it stops being one. */}
        <mesh ref={subsolarRef}>
          <sphereGeometry args={[GLOBE_R * 0.014, 12, 12]} />
          <meshBasicMaterial color="#ffd166" />
        </mesh>

        {/* Earth's axis, drawn out past the poles. */}
        <mesh>
          <cylinderGeometry args={[GLOBE_R * 0.006, GLOBE_R * 0.006, GLOBE_R * 2.5, 8]} />
          <meshBasicMaterial color={INK_DIM} transparent opacity={0.45} />
        </mesh>
      </group>

      {/* Start already in the ecliptic — useFrame keeps the live obliquity.
          Without this, a remount (fullscreen) paints one frame with the wheel
          in Earth's equator, which from the default camera is edge-on and
          reads as the plane having failed to come up. */}
      <group ref={spaceOnlyRef} rotation={[obliquity(0) * DEG, 0, 0]}>
        <EclipticWheel
          grid={toggles.grid}
          rashiBelt={toggles.rashiBelt}
          nakshatraBelt={toggles.nakshatraBelt}
          monthRing={false}
          planeOpacity={0.7}
          gridInnerR={EARTH_RADIUS}
          planeInnerR={EARTH_RADIUS}
          planeY={0}
          rashiHighlightRef={rashiHiRef}
          nakHighlightRef={nakHiRef}
        />
        {shells.map(({ key, points, attach }) => (
          <ShellLine key={key} points={points} attach={attach} />
        ))}

        {/* How far a graha stands off the ecliptic is drawn for the *selected*
            one only — its शर, in its own colour. Every body used to plant a
            dark blob on the plane below it as well, which read as a shadow
            cast by nothing and only ever appeared on whichever one or two
            happened to be south of the plane that day. */}
        <primitive object={sharaLine} />
        <mesh ref={sharaFootRef} visible={false}>
          <circleGeometry args={[0.13, 20]} />
          <meshBasicMaterial
            color={selectedKey ? GRAHA_COLOR[selectedKey] : "#ffffff"}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {skyLines.map(({ object }, i) => (
        <primitive key={`band-${i}`} object={object} />
      ))}
      <primitive object={equatorLine} />

      {/* The नक्षत्र star groups, and the figures joining them. */}
      <primitive object={starField.lines} />
      {starField.groups.map(({ object }, i) => (
        <primitive key={`stars-${i}`} object={object} />
      ))}

      {/* The obliquity: the orbit's perpendicular, and the angle off it. */}
      <primitive object={tiltMarks.eclipticAxis} />
      <primitive object={tiltMarks.arc} />

      {/* The ध्रुव तारा, and the circle the pole walks between them. */}
      <primitive object={poleField.trackLine} />
      <primitive object={poleField.points} />
      <primitive object={poleField.crown} />

      {GEO_BODY_ORDER.map((key) => (
        <GrahaBody
          key={key}
          graha={key}
          textures={textures}
          selected={selectedKey === key}
          groupRef={handles[key].group}
          spinRef={handles[key].spin}
          retroRef={handles[key].retro}
          sunLit={mode === "space"}
          phaseMaterial={key === "moon" ? moonPhaseMat : undefined}
          eclipse={key === "moon" ? moonEclipse : undefined}
        />
      ))}

      {GEO_BODY_ORDER.map((key) => (
        <primitive key={`ray-${key}`} object={rays[key]} />
      ))}

      {GEO_BODY_ORDER.map((key) => (
        <primitive key={`trail-${key}`} object={trails[key]} />
      ))}
      <primitive object={lunarUmbra} />
      <primitive object={solarUmbra} />
    </group>
  );
}

/** A unit-radius ring the frame loop scales to the graha's live distance. */
function ShellLine({
  points,
  attach,
}: {
  points: THREE.Vector3[];
  attach: (o: THREE.Line | null) => void;
}) {
  const object = useMemo(() => {
    const line = makeLine(points, INK_DIM, 0.7);
    line.renderOrder = 4;
    line.frustumCulled = false;
    (line.material as THREE.LineBasicMaterial).depthWrite = false;
    return line;
  }, [points]);
  useEffect(() => {
    attach(object);
    return () => attach(null);
  }, [object, attach]);
  return <primitive object={object} />;
}

export default AakashGocharScene;
