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
import type { GrahaKey } from "@/lib/graha-details";
import {
  beltDivisions,
  DEG,
  eclipticToVec3,
  GRAHA_COLOR,
  NAKSHATRA_ARC,
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
  GRID_AZIMUTH_LABELS,
  GRID_LINES,
  NAK_LABEL_LAT,
  NAKSHATRA_DIVIDERS,
  PADA_TICKS,
  RASHI_DIVIDERS,
  RASHI_LABEL_LAT,
  type EclipticPoint,
  type HorizonPoint,
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

/** Belt radii in space view — the nakshatra ring sits just outside the rashi ring. */
export const RASHI_INNER = 9.0;
export const RASHI_OUTER = 10.3;
const NAK_INNER = 10.4;
const NAK_OUTER = 11.1;
/**
 * Half the height of the zodiac slab in the space view.
 *
 * The belt is a band of sky twice this either side of the ecliptic, not a line
 * on the floor — drawn flat it read as a table the grahas hovered over, with no
 * way to see which of them sat north of the plane and which south.
 */
const BELT_HALF_H = 3.6;
/**
 * The ecliptic latitude the drum's wall spans, top to bottom.
 *
 * A नक्षत्र is a patch of sky, not a mark on a ring, and this is how wide that
 * patch is allowed to be here: latitude maps straight onto the wall's height,
 * so a star two thirds of the way up sits at two thirds of this. The handful
 * that reach past it — अभिजित् highest among them — pin to the rim rather than
 * fly off it.
 */
const BELT_LAT_SPAN = 24;
/**
 * How far above the ecliptic the camera is held while it follows a graha in the
 * space view — about 34°, enough that the belt stays a ring rather than an edge.
 */
const SPACE_LOCK_MIN_PITCH = 0.6;
/** Half-width of the selected graha's ✕ on the belt, in radians — about 1½°. */
const BELT_MARK_HALF_W = 0.026;
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
/** How far back the camera sits in the Earth-globe view. */
const OUTSIDE_ZOOM_MAX = 120;

/** Radius of the Earth globe in the zoomed-out view. */
const GLOBE_R = 30;
/**
 * Radius the "you are here" marker sits at — the globe's own surface, near
 * enough. Both the dot and its label are placed here, so they stay the same
 * point on the map as it turns rather than drifting apart with the parallax
 * between two different spheres.
 */
const OBSERVER_R = GLOBE_R * 1.006;
/** Radius the zodiac ring hugs the globe at. */
const GLOBE_BAND_R = GLOBE_R * 1.42;
/** Where the globe camera sits — far enough back to read as orthographic. */
const GLOBE_CAM_R = 300;
/** Bodies are tuned for the 100-unit dome; bring them down to the ring's scale. */
const GLOBE_BODY_SCALE = 0.55;

const INK_DIM = "#a7c4c3";
const SEP = "#8fbfc1";
const RETRO = "#ef4444";
/** Star-atlas palette: the zodiac band in gold, the nakshatra strip in green. */
const ZODIAC = "#d8c84a";
const NAKSHATRA = "#35d05a";
const GRID = "#4d7fb5";
/**
 * The globe's own graticule. Lighter than {@link GRID}, which was picked to sit
 * on a black sky: the same blue over ocean and forest is a line you have to go
 * looking for.
 */
const GLOBE_GRID = "#a8ccf0";
const EARTH_RADIUS = 0.75;

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

export type SkyMode = "space" | "horizon" | "globe";

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
  /** Pole stars only: the Gregorian year the pole passes closest to this one. */
  year?: number;
  /**
   * The obliquity marker: the angle it is calling out, degrees. On a पाद, the
   * 1–27 नक्षत्र it belongs to, so the overlay can name its own quarter.
   */
  deg?: number;
  x: number;
  y: number;
};

export type SkySample = {
  timeMs: number;
  sky: Record<GrahaKey, GeoBody>;
  labels: ScreenLabel[];
  /** Sun altitude, deg — negative is night. Drives the daylight wash. */
  sunAltitude: number;
  /** The camera's current `view.distance` — lets the overlay grow rashi and
      nakshatra text as the belt shrinks on screen while zooming out. */
  zoomDistance: number;
};

export type SceneToggles = {
  belts: boolean;
  /** The alt-az cage: almucantars and verticals every 15°. */
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
   * The 27 नक्षत्र drawn as the star groups they are named for, each at its own
   * place on the belt — रोहिणी as Aldebaran and the Hyades, ज्येष्ठा as
   * Antares, कृत्तिका as the Pleiades.
   */
  asterisms: boolean;
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
        // Solid core, soft rim — a star, not a disc.
        float alpha = smoothstep(0.25, 0.02, r2);
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

/** A flat annulus lying in the ecliptic plane (space view only). */
function Belt({ inner, outer, color, opacity }: { inner: number; outer: number; color: string; opacity: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[inner, outer, 128]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
}

/**
 * The wall of the zodiac slab: an open cylinder standing on the belt's outer
 * edge, with an upright at every segment boundary.
 *
 * This is what gives the belt height. Faint on purpose — it is the volume the
 * grahas move through, and it has to be read *through*, not looked at.
 */
function BeltWall({
  radius,
  count,
  color,
  opacity,
}: {
  radius: number;
  count: number;
  color: string;
  opacity: number;
}) {
  const uprights = useMemo(() => {
    const points: number[] = [];
    for (const deg of beltDivisions(count)) {
      const a = deg * DEG;
      points.push(
        radius * Math.cos(a), -BELT_HALF_H, -radius * Math.sin(a),
        radius * Math.cos(a), BELT_HALF_H, -radius * Math.sin(a),
      );
    }
    /* The two rims the uprights run between. Without them the wall is a row of
       posts with nothing joining their ends, and the drum has no edge. */
    const RIM_STEPS = 128;
    for (const y of [-BELT_HALF_H, BELT_HALF_H]) {
      for (let i = 0; i < RIM_STEPS; i += 1) {
        const a = (i / RIM_STEPS) * Math.PI * 2;
        const b = ((i + 1) / RIM_STEPS) * Math.PI * 2;
        points.push(
          radius * Math.cos(a), y, -radius * Math.sin(a),
          radius * Math.cos(b), y, -radius * Math.sin(b),
        );
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    /* The ribs carry the height — the wall itself is a wash, and a wash alone
       reads as haze rather than as a wall standing up off the plane. */
    return new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: Math.min(0.42, opacity * 6),
      }),
    );
  }, [radius, count, color, opacity]);

  return (
    <group>
      <mesh>
        <cylinderGeometry args={[radius, radius, BELT_HALF_H * 2, 128, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <primitive object={uprights} />
    </group>
  );
}

/** Radial spokes marking segment boundaries on a belt. */
function BeltDivisions({ count, inner, outer, color, opacity }: { count: number; inner: number; outer: number; color: string; opacity: number }) {
  const object = useMemo(() => {
    const points: number[] = [];
    for (const deg of beltDivisions(count)) {
      const a = deg * DEG;
      points.push(
        inner * Math.cos(a), 0, -inner * Math.sin(a),
        outer * Math.cos(a), 0, -outer * Math.sin(a),
      );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
    );
  }, [count, inner, outer, color, opacity]);

  return <primitive object={object} />;
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

function GrahaBody({
  graha,
  textures,
  selected,
  groupRef,
  spinRef,
  retroRef,
  onSelect,
}: {
  graha: GrahaKey;
  textures: Record<SkyTextureKey, THREE.Texture>;
  selected: boolean;
  groupRef: (o: THREE.Group | null) => void;
  spinRef: (o: THREE.Mesh | null) => void;
  retroRef: (o: THREE.Group | null) => void;
  onSelect: () => void;
}) {
  const texKey = BODY_TEXTURE[graha];
  const radius = BODY_RADIUS[graha];
  const color = GRAHA_COLOR[graha];

  return (
    <group ref={groupRef}>
      {texKey ? (
        <mesh ref={spinRef} onClick={onSelect}>
          <sphereGeometry args={[radius, 40, 40]} />
          {graha === "sun" ? (
            <meshBasicMaterial map={textures.sun} />
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
        /* Rahu and Ketu are the lunar nodes — points, not bodies. */
        <mesh onClick={onSelect} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * 1.5, radius * 0.35, 8, 24]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} />
        </mesh>
      )}

      {/* The Sun's torch: an emissive core wrapped in two additive haloes. */}
      {graha === "sun" ? (
        <group>
          <mesh>
            <sphereGeometry args={[radius * 1.5, 24, 24]} />
            <meshBasicMaterial
              color="#ffd166"
              transparent
              opacity={0.3}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[radius * 2.6, 24, 24]} />
            <meshBasicMaterial
              color="#ff9d3c"
              transparent
              opacity={0.12}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ) : null}

      {graha === "moon" ? (
        <mesh>
          <sphereGeometry args={[radius * 1.45, 20, 20]} />
          <meshBasicMaterial
            color="#dbe7ff"
            transparent
            opacity={0.08}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ) : null}

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
const ECLIPTIC_STEPS = 180;

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
    if (a.id !== b.id || Math.abs(a.x - b.x) >= 1 || Math.abs(a.y - b.y) >= 1) return true;
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
  toggles,
  onSelect,
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
  toggles: SceneToggles;
  onSelect: (key: GrahaKey) => void;
  /** The marker on the globe was pressed — your place, chosen as the target. */
  onSelectObserver?: () => void;
  onSample: (sample: SkySample) => void;
}) {
  const gl = useThree((s) => s.gl);
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


  const bodyRefs = useRef<Partial<Record<GrahaKey, THREE.Group>>>({});
  const spinRefs = useRef<Partial<Record<GrahaKey, THREE.Mesh>>>({});
  const retroRefs = useRef<Partial<Record<GrahaKey, THREE.Group>>>({});
  const shellRefs = useRef<Partial<Record<GrahaKey, THREE.Line>>>({});
  const earthRef = useRef<THREE.Mesh | null>(null);
  const earthGroupRef = useRef<THREE.Group | null>(null);
  const cloudRef = useRef<THREE.Mesh | null>(null);
  const sunLightRef = useRef<THREE.PointLight | null>(null);
  const ambientRef = useRef<THREE.AmbientLight | null>(null);
  const starsRef = useRef<THREE.Mesh | null>(null);
  const groundRef = useRef<THREE.Group | null>(null);
  const horizonGroupRef = useRef<THREE.Group | null>(null);
  const shellRef = useRef<THREE.Mesh | null>(null);
  const globeRootRef = useRef<THREE.Group | null>(null);
  const globeSpinRef = useRef<THREE.Group | null>(null);
  const subsolarRef = useRef<THREE.Mesh | null>(null);
  const spaceOnlyRef = useRef<THREE.Group | null>(null);
  const sharaFootRef = useRef<THREE.Mesh | null>(null);
  /** Body → the ecliptic plane below or above it: the शर, drawn. */
  const sharaLine = useMemo(() => makeDynamicLine(2, "#ffffff", 0.55), []);

  /**
   * The selected graha's ✕ on the belt, and its upright on the outer wall.
   *
   * Both are built at longitude zero and turned to the graha by the group they
   * hang in, so the arithmetic is done once. The tangential half-width scales
   * with radius, which is what keeps the ✕ square rather than fanned.
   */
  const beltMark = useMemo(() => {
    const w = BELT_MARK_HALF_W;
    const line = makeDynamicLine(4, "#ffffff", 0.95);
    setPoint(line, 0, [RASHI_INNER, 0, -RASHI_INNER * w]);
    setPoint(line, 1, [NAK_OUTER, 0, NAK_OUTER * w]);
    setPoint(line, 2, [RASHI_INNER, 0, RASHI_INNER * w]);
    setPoint(line, 3, [NAK_OUTER, 0, -NAK_OUTER * w]);
    flushLine(line);
    /* Two arms, not one polyline — otherwise the ✕ is drawn as a Z. */
    const segments = new THREE.LineSegments(line.geometry, line.material);
    segments.renderOrder = 4;
    (segments.material as THREE.LineBasicMaterial).depthTest = false;
    segments.visible = false;
    return segments;
  }, []);

  const beltMarkWall = useMemo(() => {
    const line = makeDynamicLine(2, "#ffffff", 0.8);
    setPoint(line, 0, [RASHI_OUTER, -BELT_HALF_H, 0]);
    setPoint(line, 1, [RASHI_OUTER, BELT_HALF_H, 0]);
    flushLine(line);
    line.renderOrder = 4;
    (line.material as THREE.LineBasicMaterial).depthTest = false;
    line.visible = false;
    return line;
  }, []);

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
    const band = (src: EclipticPoint[], color: string, opacity: number, segments = false) => ({
      src,
      object: segments
        ? makeDynamicSegments(src.length, color, opacity)
        : makeDynamicLine(src.length, color, opacity),
    });
    return [
      band(BAND_EDGES.rashiOuter, ZODIAC, 0.85),
      band(BAND_EDGES.rashiInner, ZODIAC, 0.85),
      band(BAND_EDGES.nakOuter, NAKSHATRA, 0.7),
      band(BAND_EDGES.nakInner, NAKSHATRA, 0.7),
      band(BAND_EDGES.ecliptic, ZODIAC, 0.5),
      band(RASHI_DIVIDERS, ZODIAC, 0.75, true),
      band(NAKSHATRA_DIVIDERS, NAKSHATRA, 0.6, true),
      band(PADA_TICKS, NAKSHATRA, 0.35, true),
      band(DEGREE_TICKS, ZODIAC, 0.45, true),
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
        { indices: junction, object: makeStarPoints(junction.length, "#ffd98a", 5.5, 0.95) },
        { indices: bright, object: makeStarPoints(bright.length, "#eaf2ff", 3.6, 0.85) },
        { indices: faint, object: makeStarPoints(faint.length, "#c8d8ee", 2.4, 0.6) },
      ],
      lines: makeDynamicSegments(links.length * 2, "#7f9dc4", 0.32),
    };
  }, []);

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
      trackLine: makeDynamicLine(181, "#8ab4f8", 0.3),
      points: makeStarPoints(stars.length, "#dceaff", 4, 0.9),
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
  const equatorLine = useMemo(() => makeDynamicLine(ECLIPTIC_STEPS + 1, "#5aa9e6", 0.45), []);

  /** Almucantars and verticals, flattened into one segment list. */
  const gridSegments = useMemo(() => {
    const pairs: HorizonPoint[] = [];
    for (const line of GRID_LINES) {
      for (let i = 0; i < line.length - 1; i += 1) pairs.push(line[i], line[i + 1]);
    }
    return { src: pairs, object: makeDynamicSegments(pairs.length, GRID, 0.32) };
  }, []);

  const horizonRing = useMemo(() => makeLine(circlePoints(DOME * 0.999, 128), "#8fbfc1", 0.5), []);

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
  const gridBuilt = useRef(false);
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
  const labels = useRef<ScreenLabel[]>([]);
  const scratch = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());
  /** Your place on the globe, in world space — the camera's other lock target. */
  const observerTrack = useRef(new THREE.Vector3());

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
  }, [toggles.belts, toggles.asterisms]);

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
     * Ecliptic → the globe frame: Earth upright with its axis along +Y and its
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

    /**
     * Sidereal ecliptic longitude → scene position, in whichever frame is live.
     *
     * Inside the dome the horizon frame is the honest one: you are standing on
     * a spinning Earth, so the whole sky wheels past. Zoomed out, the frame is
     * the Earth's own: the zodiac becomes a ring round the globe, fixed to the
     * stars — it only creeps by the ayanamsa, a degree per 72 years.
     */
    const place = (lonSid: number, latEc: number, spaceRadius: number): [number, number, number] => {
      if (space) return eclipticToVec3(lonSid, latEc, spaceRadius);
      if (globe) return globePlace(lonSid, latEc, GLOBE_BAND_R);
      const { alt, az } = eclipticToAltAz(lonSid + ayan, latEc, eps, lst, observer.lat);
      return altAzToVec3(alt, az, DOME);
    };

    /**
     * Whether a label anchor should be drawn. Overlay text has no depth test,
     * so inside the dome anything under the horizon has to be culled by hand,
     * and from outside the sphere anything on the far hemisphere does.
     */
    const labelVisible = (at: [number, number, number]) => {
      if (space) return true;
      if (horizon) return at[1] > 0.5;
      // Facing hemisphere only — the globe is opaque, so far-side names would
      // otherwise float over it.
      const c = state.camera.position;
      return at[0] * c.x + at[1] * c.y + at[2] * c.z > 0;
    };

    const width = state.size.width;
    const height = state.size.height;
    const collect = toggles.labels && frame.current % 6 === 0;
    const collected: ScreenLabel[] = [];
    const project = (label: Omit<ScreenLabel, "x" | "y">, at: [number, number, number]) => {
      scratch.current.set(at[0], at[1], at[2]).project(state.camera);
      if (scratch.current.z > 1) return;
      const x = (scratch.current.x * 0.5 + 0.5) * width;
      const y = (-scratch.current.y * 0.5 + 0.5) * height;
      if (x < -60 || y < -30 || x > width + 60 || y > height + 30) return;
      collected.push({ ...label, x, y });
    };

    /* ── bodies ─────────────────────────────────────────────────────── */
    let sunAltitude = -90;
    for (const key of GEO_BODY_ORDER) {
      const body = sky[key];
      const spaceR = shellRadius(key, body.distanceAu);
      const at = place(body.longitude, body.latitude, spaceR);

      if (key === "sun") {
        const { alt } = eclipticToAltAz(body.longitude + ayan, body.latitude, eps, lst, observer.lat);
        sunAltitude = alt;
      }

      const group = bodyRefs.current[key];
      if (group) {
        group.position.set(at[0], at[1], at[2]);
        const scale = globe
          ? (DOME_RADIUS[key] * GLOBE_BODY_SCALE) / BODY_RADIUS[key]
          : horizon
            ? DOME_RADIUS[key] / BODY_RADIUS[key]
            : bodyRadius(key, body.distanceAu) / BODY_RADIUS[key];
        group.scale.setScalar(scale);
        // Below the horizon a graha is simply not in the sky.
        group.visible = !horizon || at[1] > -DOME * 0.06;
      }

      const spin = spinRefs.current[key];
      // Slow signature spin so each body reads as a globe, not a disc.
      if (spin) spin.rotation.y = (dtDays * (key === "sun" ? 0.25 : 1.6) * Math.PI * 2) % (Math.PI * 2);

      const retro = retroRefs.current[key];
      if (retro) retro.visible = body.retrograde;

      const shell = shellRefs.current[key];
      if (shell) {
        shell.scale.setScalar(spaceR);
        shell.visible = space;
      }

      const ray = rays[key];
      setPoint(ray, 0, [0, 0, 0]);
      setPoint(ray, 1, space ? eclipticToVec3(body.longitude, body.latitude, RASHI_OUTER) : at);
      flushLine(ray);
      // Always drawn: the sight line is what ties a graha to its rashi.
      ray.visible = space ? true : globe ? false : at[1] > 0;

      // Below the horizon the ground hides the body, but a DOM label has no
      // depth test — so it has to be filtered out explicitly.
      if (collect && labelVisible(at)) {
        project({ id: `g-${key}`, kind: "graha", key }, at);
      }

      /* ── the selected graha, marked against the belt ─────────────────
         Two readings the belt cannot give on its own: where along it the
         graha stands, and how far off its plane. The first is a mark on the
         wall at the graha's own longitude; the second is the drop from the
         body to the plane, which is the शर at the same scale as everything
         around it. Space view only — inside the dome and on the globe the
         belt is a ring on a sphere and has no wall to mark. */
      if (space && key === selectedKey) {
        /* Both marks are built at longitude zero, so the turn about the axis
           *is* the longitude. */
        for (const m of [beltMark, beltMarkWall]) {
          m.rotation.y = body.longitude * DEG;
          m.visible = true;
          (m.material as THREE.LineBasicMaterial).color.set(GRAHA_COLOR[key]);
        }
        const foot = sharaFootRef.current;
        if (foot) {
          foot.position.set(at[0], 0, at[2]);
          foot.rotation.set(-Math.PI / 2, 0, 0);
          foot.visible = true;
        }
        setPoint(sharaLine, 0, at);
        setPoint(sharaLine, 1, [at[0], 0, at[2]]);
        flushLine(sharaLine);
        sharaLine.visible = true;
        sharaLine.material.color.set(GRAHA_COLOR[key]);
      }
    }

    if (!space || !selectedKey) {
      beltMark.visible = false;
      beltMarkWall.visible = false;
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
     * so the star groups sit just outside the नक्षत्र band, each figure over
     * the segment it gives its name to. Their latitudes carry them out of the
     * slab, which is the honest answer to why a नक्षत्र is a patch of sky and
     * not a line on the belt.
     */
    const starRadius = space ? NAK_OUTER + 0.25 : DOME * 0.995;

    /**
     * A fixed star's place, in whichever frame is live.
     *
     * Inside the dome and around the globe the sky is a sphere and the star
     * goes on it. In the space view the zodiac is a drum standing around the
     * Earth, so the star goes on its *wall*: the longitude turns it about the
     * axis and the latitude rides straight up the wall, one for one against
     * {@link BELT_LAT_SPAN}. A sphere would have pulled every figure in towards
     * the axis as it climbed, which is precisely the flattening that made a
     * नक्षत्र look like a mark on a ring.
     */
    const starPlace = (lonSid: number, latEc: number): [number, number, number] => {
      if (!space) return place(lonSid, latEc, starRadius);
      const a = lonSid * DEG;
      const t = Math.max(-1, Math.min(1, latEc / BELT_LAT_SPAN));
      return [starRadius * Math.cos(a), BELT_HALF_H * t, -starRadius * Math.sin(a)];
    };

    if ((zodiac || space) && beltMoved) {
      lastBelt.current = { mode, lst: beltLst, ayan: beltAyan, eps: beltEps };

      /* Dome and globe only: in the space view `place` takes its radius from
         the caller, and the banded zodiac asks for zero — which would fold the
         whole band onto the origin. That band is drawn as flat geometry there
         instead, and needs nothing from this. */
      if (toggles.belts && zodiac) {
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
      if (toggles.asterisms) {
        const precession = precessionSinceJ2000(dtDays);
        const dpr = state.gl.getPixelRatio();
        for (const { indices, object } of starField.groups) {
          (object.material as THREE.ShaderMaterial).uniforms.uPixelRatio.value = dpr;
          for (let i = 0; i < indices.length; i += 1) {
            const star = starField.stars[indices[i]];
            setVertex(object, i, starPlace(star.lon + precession - ayan, star.lat));
          }
          (object.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
        }
        for (let i = 0; i < starField.links.length; i += 1) {
          const [a, b] = starField.links[i];
          const sa = starField.stars[a];
          const sb = starField.stars[b];
          setVertex(starField.lines, i * 2, starPlace(sa.lon + precession - ayan, sa.lat));
          setVertex(starField.lines, i * 2 + 1, starPlace(sb.lon + precession - ayan, sb.lat));
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

      if (horizon && toggles.belts) {
        for (let i = 0; i <= ECLIPTIC_STEPS; i += 1) {
          // Declination 0 all the way round — the celestial equator, which the
          // ecliptic crosses at the two equinoxes and nowhere else. On the
          // globe this is drawn on the sphere itself instead.
          const eq = equatorialToAltAz({ ra: (i / ECLIPTIC_STEPS) * 360, dec: 0 }, lst, observer.lat);
          setPoint(equatorLine, i, altAzToVec3(eq.alt, eq.az, DOME * 0.997));
        }
        flushLine(equatorLine);
      }
    }

    if (horizon && toggles.grid && !gridBuilt.current) {
      // The cage is fixed to the observer, so it only needs building once.
      gridBuilt.current = true;
      for (let i = 0; i < gridSegments.src.length; i += 1) {
        const p = gridSegments.src[i];
        setPoint(gridSegments.object, i, altAzToVec3(p.alt, p.az, DOME * 0.995));
      }
      flushLine(gridSegments.object);
    }

    if (collect && toggles.belts) {
      /**
       * A point on the drum's rim, for the names that ride it.
       *
       * The space view's zodiac is a drum, so its names belong on the edge of
       * the drum rather than lying inside the ring — from the side, a name in
       * the mid-plane is a name buried in the wall. `up` is a fraction of the
       * wall's half-height: +1 the top rim, −1 the bottom.
       */
      const rim = (lon: number, radius: number, up: number): [number, number, number] => {
        const a = lon * DEG;
        return [radius * Math.cos(a), BELT_HALF_H * up, -radius * Math.sin(a)];
      };

      for (let i = 0; i < 12; i += 1) {
        const lon = (i + 0.5) * RASHI_ARC;
        // Above the rim in space, as on the reference drum; on the ring itself
        // in the two views where the zodiac really is a ring on a sphere.
        const at = space
          ? rim(lon, RASHI_OUTER, 1.16)
          : place(lon, RASHI_LABEL_LAT, RASHI_MID);
        if (labelVisible(at)) {
          project({ id: `r-${i}`, kind: "rashi", index: i + 1 }, at);
        }
      }
      for (let i = 0; i < 27; i += 1) {
        const lon = (i + 0.5) * NAKSHATRA_ARC;
        const at = space
          ? rim(lon, NAK_OUTER, -1.16)
          : place(lon, NAK_LABEL_LAT, NAK_MID);
        if (labelVisible(at)) {
          project({ id: `n-${i}`, kind: "nakshatra", index: i + 1 }, at);
        }
      }

      /* The four पाद of each नक्षत्र, named only once the camera is close
         enough for them to be four separate places rather than four numbers on
         top of each other. A hundred and eight anchors is a lot to offer the
         projector, but it discards everything off screen, and by the time this
         is on there is only a fraction of the belt on screen to begin with. */
      if (view.current.distance <= PADA_ZOOM) {
        const padaArc = NAKSHATRA_ARC / 4;
        for (let i = 0; i < 108; i += 1) {
          const lon = (i + 0.5) * padaArc;
          // Just inside its नक्षत्र's own name on the bottom rim.
          const at = space
            ? rim(lon, NAK_OUTER, -0.86)
            : place(lon, NAK_LABEL_LAT, NAK_OUTER - 0.32);
          if (labelVisible(at)) {
            project(
              { id: `p-${i}`, kind: "pada", index: (i % 4) + 1, deg: Math.floor(i / 4) + 1 },
              at,
            );
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
        for (const az of GRID_AZIMUTH_LABELS) {
          if (az % 45 === 0) continue; // the compass already names those
          project(
            { id: `az-${az}`, kind: "azimuth", text: `${az}°` },
            altAzToVec3(4, az, DOME * 0.93),
          );
        }
      }
    }

    /* Each star group's own name, anchored on the group.
       The mean of the members lands inside the sphere, so it is pushed back out
       to where the stars are — otherwise the text would sit at a different
       depth from the figure it names and drift against it as the view turns. */
    if (collect && (zodiac || space) && toggles.asterisms) {
      const precession = precessionSinceJ2000(dtDays);
      for (const [nak, indices] of starField.byNakshatra) {
        let x = 0;
        let y = 0;
        let z = 0;
        let radius = 0;
        for (const i of indices) {
          const s = starField.stars[i];
          const p = starPlace(s.lon + precession - ayan, s.lat);
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
    if (groundRef.current) groundRef.current.visible = horizon && !globe;
    if (spaceOnlyRef.current) spaceOnlyRef.current.visible = space;
    if (globeRootRef.current) globeRootRef.current.visible = globe;
    for (const { object } of skyLines) object.visible = zodiac && toggles.belts;
    // The star groups belong to the sky, so they live wherever the belt does.
    for (const { object } of starField.groups) {
      object.visible = (zodiac || space) && toggles.asterisms;
    }
    starField.lines.visible = (zodiac || space) && toggles.asterisms;
    poleField.points.visible = zodiac && toggles.poleStars;
    poleField.crown.visible = zodiac && toggles.poleStars;
    poleField.trackLine.visible = zodiac && toggles.poleStars;
    // The tilt is only drawn where the Earth is: the globe view.
    tiltMarks.eclipticAxis.visible = globe && toggles.tilt;
    tiltMarks.arc.visible = globe && toggles.tilt;
    equatorLine.visible = horizon && !globe && toggles.belts;
    gridSegments.object.visible = horizon && !globe && toggles.grid;
    horizonRing.visible = horizon && !globe;
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
    if (cloudRef.current) cloudRef.current.rotation.y += delta * 0.04;

    // The Sun is the only real light source; put it exactly where the Sun is drawn.
    if (sunLightRef.current) {
      const sunGroup = bodyRefs.current.sun;
      if (sunGroup) sunLightRef.current.position.copy(sunGroup.position);
      sunLightRef.current.intensity = horizon ? 1400 : globe ? 700 : 90;
    }

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
    const trackKey = toggles.lockCenter && !lockObserver && selectedKey ? selectedKey : null;
    const trackGroup = trackKey ? bodyRefs.current[trackKey] : null;
    let trackAt: THREE.Vector3 | null = trackGroup ? trackGroup.position : null;
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
    if (horizon) {
      /* Standing at the centre, the only thing zoom can do is change the lens:
         a 6° telescopic crop at one end, a 160° fisheye that swallows nearly
         the whole dome at the other. The sky itself never changes shape. */
      const cosP = Math.cos(v.pitch);
      cam.position.set(0, 0, 0);
      if (trackAt) {
        target.current.copy(trackAt);
      } else {
        target.current.set(
          DOME * cosP * Math.sin(v.yaw),
          DOME * Math.sin(v.pitch),
          -DOME * cosP * Math.cos(v.yaw),
        );
      }
      cam.lookAt(target.current);
      const fov = Math.min(160, Math.max(6, (v.distance / 26) * 70));
      if (Math.abs(cam.fov - fov) > 0.01) {
        cam.fov = fov;
        cam.updateProjectionMatrix();
      }
    } else if (globe) {
      /* A long lens from far back — as close to an orthographic globe as a
         perspective camera gets. The +Y matters: the camera has to stay on the
         side of the ecliptic the pitch asks for, because from underneath the
         whole zodiac runs backwards and every graha appears to go clockwise. */
      const cosP = Math.cos(v.pitch);
      /* Zoom is optical, not positional: the camera stays parked well outside
         the globe and the lens narrows, so you can push in to a couple of
         degrees of ring without ever ending up inside the Earth. */
      const t = Math.min(1, Math.max(0, v.distance / OUTSIDE_ZOOM_MAX));
      const framed = 1.4 + Math.pow(t, 1.25) * (GLOBE_BAND_R * 2 - 1.4);
      const radius = GLOBE_CAM_R;
      const fov = (2 * Math.atan(framed / radius)) / DEG;
      if (trackAt) {
        target.current.copy(trackAt);
        scratch.current.copy(target.current);
        const bodyR = scratch.current.length();
        if (bodyR < 1e-5) {
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
      const cosP = Math.cos(v.pitch);
      if (trackAt) {
        /**
         * Follow from above, not from alongside.
         *
         * The lock used to ride the outward ray through the graha, which in
         * this view is a ray lying in the ecliptic — every graha is within a
         * few degrees of the plane the belt is drawn on, so the camera ended up
         * *in* the belt and the whole zodiac collapsed to a line across the
         * screen. Nothing about that view is readable.
         *
         * So the camera orbits the graha on the reader's own yaw and pitch,
         * with the pitch held above {@link SPACE_LOCK_MIN_PITCH} — high enough
         * that the belt is always a ring seen from over it. Written back to the
         * view, so a drag afterwards carries on from where the lock put it
         * rather than snapping.
         */
        target.current.copy(trackAt);
        v.pitch = Math.max(SPACE_LOCK_MIN_PITCH, v.pitch);
        const lockCosP = Math.cos(v.pitch);
        cam.position.set(
          target.current.x + v.distance * lockCosP * Math.sin(v.yaw),
          target.current.y + v.distance * Math.sin(v.pitch),
          target.current.z + v.distance * lockCosP * Math.cos(v.yaw),
        );
        cam.lookAt(target.current);
      } else {
        target.current.set(0, 0, 0);

        cam.position.set(
          target.current.x + v.distance * cosP * Math.sin(v.yaw),
          target.current.y + v.distance * Math.sin(v.pitch),
          target.current.z + v.distance * cosP * Math.cos(v.yaw),
        );
        cam.lookAt(target.current);
      }
      if (Math.abs(cam.fov - 50) > 0.01) {
        cam.fov = 50;
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
          setPoint(line, i, eclipticToVec3(b.longitude, b.latitude, shellRadius(key, b.distanceAu)));
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
      onSample({ timeMs: s.timeMs, sky, labels: labels.current, sunAltitude, zoomDistance: view.current.distance });
    }
  }

  return (
    <group>
      <ambientLight ref={ambientRef} intensity={0.28} />
      <pointLight ref={sunLightRef} intensity={90} distance={0} decay={2} color="#fff6e0" />
      {/* A hint of fill so the night side is shape rather than a hole. */}
      <directionalLight position={[0, 12, 0]} intensity={0.1} />

      <mesh ref={starsRef}>
        <sphereGeometry args={[400, 48, 48]} />
        <meshBasicMaterial map={textures.background} side={THREE.BackSide} transparent />
      </mesh>

      {/* Space view: the Earth itself, tilted by the obliquity of the ecliptic. */}
      <group ref={earthGroupRef} rotation={[0, 0, 23.44 * DEG]}>
        <mesh ref={earthRef}>
          <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
          <meshStandardMaterial
            map={textures.earth}
            emissive="#ffffff"
            emissiveMap={textures.earth}
            emissiveIntensity={0.38}
            roughness={0.85}
            metalness={0.02}
          />
        </mesh>
        <mesh ref={cloudRef}>
          <sphereGeometry args={[EARTH_RADIUS * 1.02, 48, 48]} />
          <meshStandardMaterial map={textures.earthclouds} transparent opacity={0.45} depthWrite={false} />
        </mesh>
        {/* Polar axis — the diurnal spin that walks the lagna round the zodiac. */}
        <mesh>
          <cylinderGeometry args={[0.01, 0.01, EARTH_RADIUS * 3, 8]} />
          <meshBasicMaterial color={INK_DIM} transparent opacity={0.5} />
        </mesh>
      </group>

      {/* The observer's own frame: the ground underfoot, the horizon circle and
          the alt-az cage. Standing inside, this is the identity; seen from
          outside the sphere it turns once a sidereal day while the zodiac
          stays nailed to the stars. */}
      <group ref={horizonGroupRef}>
        <group ref={groundRef} visible={false}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
            <circleGeometry args={[DOME * 1.02, 96]} />
            {/* Not opaque: the sky below your feet still belongs to the sphere,
                so it stays faintly readable rather than becoming a black slab. */}
            <meshBasicMaterial
              color="#06110f"
              side={THREE.DoubleSide}
              transparent
              opacity={0.82}
            />
          </mesh>
        </group>
        <primitive object={horizonRing} />
        <primitive object={gridSegments.object} />
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

      <group ref={spaceOnlyRef}>
        {shells.map(({ key, points, attach }) => (
          <ShellLine key={key} points={points} attach={attach} />
        ))}

        {toggles.belts ? (
          <group>
            {/* Rashi belt: 12 × 30°, as a slab rather than a floor — the flat
                ring is its mid-plane and the wall carries its height. */}
            <Belt inner={RASHI_INNER} outer={RASHI_OUTER} color="#0f3234" opacity={0.8} />
            <BeltDivisions count={12} inner={RASHI_INNER} outer={RASHI_OUTER} color={SEP} opacity={0.85} />
            <BeltWall radius={RASHI_OUTER} count={12} color={SEP} opacity={0.045} />
            {/* Nakshatra belt: 27 × 13°20′, with pada ticks at 108. */}
            <Belt inner={NAK_INNER} outer={NAK_OUTER} color="#0a2426" opacity={0.8} />
            <BeltDivisions count={27} inner={NAK_INNER} outer={NAK_OUTER} color={SEP} opacity={0.6} />
            <BeltDivisions count={108} inner={NAK_OUTER - 0.2} outer={NAK_OUTER} color={INK_DIM} opacity={0.4} />
            <BeltWall radius={NAK_OUTER} count={27} color={SEP} opacity={0.03} />
          </group>
        ) : null}

        {/* Where the selected graha stands on the belt, and how far off the
            plane it is.

            Lines, not filled shapes: an ✕ across the belt, which is what you
            read from above, and an upright on the outer wall, which is what
            you read from the side. Both stay a pixel or two wide however far
            you zoom out — the filled version of this covered the very segment
            it was pointing at. Each is turned about the axis to the graha's
            own longitude every frame, and drawn with the depth test off so it
            never trades depth with the coplanar ring it marks. */}
        <primitive object={beltMark} />
        <primitive object={beltMarkWall} />
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
          onSelect={() => onSelect(key)}
        />
      ))}

      {GEO_BODY_ORDER.map((key) => (
        <primitive key={`ray-${key}`} object={rays[key]} />
      ))}

      {GEO_BODY_ORDER.map((key) => (
        <primitive key={`trail-${key}`} object={trails[key]} />
      ))}
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
  const object = useMemo(() => makeLine(points, INK_DIM, 0.16), [points]);
  useEffect(() => {
    attach(object);
    return () => attach(null);
  }, [object, attach]);
  return <primitive object={object} />;
}

export default AakashGocharScene;
