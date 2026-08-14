/**
 * "What is a day" — the R3F scene.
 *
 * The frame is the planet's **equatorial** one: the XZ plane is the equator,
 * and the planet's spin axis is +Y and never moves. Axial tilt therefore does
 * not tilt the planet here — it tilts the *Sun's path*, which is the same
 * geometry read from the other end and the only arrangement in which the three
 * day-arcs can be drawn in one flat plane and compared. That is the whole
 * point of the picture, so it is worth the inversion.
 *
 * Origin is the **mean sun** — the fiction a clock keeps time by, moving at a
 * constant rate along the equator. The planet circles it at a fixed radius.
 * The **true sun** is placed separately from the real orbit (elliptical, and
 * tilted out of the equatorial plane), so the gap between the two suns is
 * visible directly: that gap is the equation of time.
 *
 * Three arcs wrap the planet, each measuring the same rotation against a
 * different zero:
 *
 *   - **sidereal** (blue, outermost) — against the fixed stars. Uniform.
 *   - **true solar** (gold, middle) — against the true sun. Never uniform.
 *   - **mean solar** (red, inner) — against the mean sun. Uniform by construction.
 *
 * Following {@link ./TwoSystemsScene}: the parent owns the clock and camera in
 * refs and mutates them, so neither playing nor dragging re-renders React. The
 * scene reports a sampled snapshot back through `onSample` a few times a
 * second, and the HTML overlay draws its labels from that.
 */

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { KATHMANDU } from "@/lib/sky3d/horizon";
import {
  equationOfTime,
  euclideanModulo,
  orbitDistance,
  orbitRadii,
  meanAnomalyAt,
  shortestAngle,
  trueAnomaly,
  MESHA_FROM_PERIHELION,
  PERIHELION,
  VERNAL,
  VERNAL_FROM_PERIHELION,
} from "@/lib/sky3d/day-mechanics";

const PI2 = Math.PI * 2;

/** Radius of the mean orbit. Everything else is scaled against this. */
export const MEAN_DISTANCE = 10;
const PLANET_R = 1;
const SUN_R = 0.9;
const MEAN_SUN_R = 0.42;

/**
 * The belts sit far outside the orbit, and that is the honest placement.
 *
 * A rashi is a direction, not a place — the stars behind it are effectively at
 * infinity. Drawing the belt just past the orbit would suggest the planet
 * could reach it; drawing it at two and a half orbits keeps the sightline
 * doing the work of saying which rashi the Sun is *seen* in.
 */
const MOON_R = 0.27;
/** Shadow grahas — points, not discs, but they still have to read at this scale. */
const NODE_R = 0.16;
/**
 * The Moon's orbit, drawn wide enough for its tilt to mean something.
 *
 * At 2.6 it was 2.6 planet-radii out. The real one is sixty, and that ratio is
 * the whole reason eclipses are rare: 5.14° of inclination lifts the Moon about
 * five planet-radii clear of the shadow, so most months it passes above or
 * below and nothing happens. Compressed to 2.6, the same 5.14° lifts it 0.23 —
 * a quarter of the way to the planet's own edge — so *every* पूर्णिमा put the
 * Moon inside the shadow and every अमावस्या put it across the Sun's face. The
 * sim was claiming an eclipse a fortnight.
 */
const MOON_ORBIT = 3.6;

/**
 * Sidereal months in a sidereal year — 365.256 / 27.322.
 *
 * Tied to the *year*, not to the day, so the Moon keeps making its ~13.37 laps
 * however many rotations the reader gives the year. That is what keeps twelve
 * lunar months falling about eleven days short of the solar one at any setting,
 * which is the only reason to draw the Moon here at all.
 */
const MOON_LAPS_PER_YEAR = 365.256363 / 27.321661;

/**
 * One retrograde circuit of the lunar nodes — Rāhu and Ketu.
 *
 * 18 years, 221 days and 16 hours. They travel *clockwise* (against the Moon)
 * and stay exactly 180° apart: they are the two ends of one line, the
 * intersection of the Moon's orbit with the ecliptic, not two independent bodies.
 */
const NODAL_PERIOD_DAYS = 6793.48;
const NODAL_LAPS_PER_YEAR = 365.256363 / NODAL_PERIOD_DAYS;

/**
 * The Moon's orbital plane against the ecliptic.
 *
 * The real inclination is ~5.14°. At this scene's compressed orbit that lift
 * is only a fraction of the planet's radius, so the Moon no longer clears the
 * disc at every syzygy the way a 60-radii orbit would. The honest angle is
 * still the right one to draw: Rāhu and Ketu *are* those two crossings, and
 * exaggerating the tilt made the orbit a different object from the one they
 * live on.
 */
const MOON_INCLINATION = 5.14 * (Math.PI / 180);

/** Synodic laps per year — new moon to new moon, one fewer than sidereal. */
const MOON_SYNODIC_PER_YEAR = MOON_LAPS_PER_YEAR - 1;

/**
 * Where the Moon stands at मेष सङ्क्रान्ति, measured from मेष.
 *
 * The month *names* are lunar even though the month *lengths* are solar: a
 * चान्द्र मास is named for the नक्षत्र its **पूर्णिमा** falls in — वैशाख from
 * विशाखा, जेठ from ज्येष्ठा, कात्तिक from कृत्तिका, and so on round the year.
 * Starting the Moon at अमावस्या on मेष 0°, as this did, was an arbitrary phase
 * that put वैशाख's पूर्णिमा in चित्रा and made every month name wrong.
 *
 * This value is chosen so the naming rule actually holds: it is the middle of
 * the plateau of anchors that name the most months correctly, so it is not one
 * step away from losing one.
 *
 * It cannot hold for all twelve at once, and that is the honest part. Twelve
 * lunar months fall about eleven days short of the solar year, so the पूर्णिमा
 * slips a little earlier against the solar month each time; by असोज it has
 * slipped a whole नक्षत्र and the later months read one behind. That slippage
 * is exactly what an ~अधिक मास~ is inserted to absorb — which this sim does not
 * do, so the drift stays visible rather than being quietly corrected.
 */
const MOON_ANCHOR_FROM_MESHA = 189.25;

/** Points in the Moon's swept trail, over one synodic month. */
const TRAIL_STEPS = 160;
const LAP_SEGMENTS = 240;

const MONTH_R = 17.5;
const BELT_INNER = 20;
const BELT_MID = 23;
const BELT_OUTER = 26;
/* The नक्षत्र belt is built exactly like the राशि one — a band with an inner
   and outer edge, spokes across it and the name centred inside — rather than a
   thin line of ticks with the name floating outside it. Same width, so the two
   read as the same kind of object. */
/* Flush against the राशि belt — `NAK_INNER` *is* `BELT_OUTER`. They are two
   rings of one wheel, the way a पञ्चाङ्ग chart draws them, so a gap between
   them would read as a third thing that is not there. */
const NAK_INNER = BELT_OUTER;
const NAK_MID = 29;
const NAK_OUTER = 32;

/** Ring segment count — arcs quantise to this, so 2° steps. */
const ARC_SEGMENTS = 180;
const WEDGE_SEGMENTS = 48;

/** Shared empty array, so non-sampling frames allocate nothing. */
const EMPTY_LABELS: SceneLabel[] = [];

const COLOR = {
  sidereal: 0x2888e4,
  solar: 0xdddd00,
  mean: 0xe93f33,
  belt: 0x8a7c2e,
  nakshatra: 0x4a6b8a,
  rahu: 0x8b5cf6,
  ketu: 0xe11d48,
} as const;

const MOON_INCL_Q = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 0, 0),
  MOON_INCLINATION,
);
const AXIS_Y = new THREE.Vector3(0, 1, 0);

/** ecliptic longitude → a point in the equatorial plane, app convention. */
function atLon(lonDeg: number, radius: number) {
  const a = lonDeg * (Math.PI / 180);
  return new THREE.Vector3(radius * Math.cos(a), 0, -radius * Math.sin(a));
}

/**
 * The same, written into a vector you already own.
 *
 * The frame loop runs sixty times a second and touches upwards of fifty
 * anchors; allocating a `Vector3` for each one handed the garbage collector
 * about fifteen hundred short-lived objects a second, and those collections
 * showed up as stutter. Everything on the hot path writes into scratch now.
 */
function atLonInto(out: THREE.Vector3, lonDeg: number, radius: number) {
  const a = lonDeg * (Math.PI / 180);
  return out.set(radius * Math.cos(a), 0, -radius * Math.sin(a));
}

export type CameraTarget = "meanSun" | "planet" | "sun";

export type SimClock = {
  /** Position in the year, in sidereal rotations. */
  day: number;
  playing: boolean;
  /** Sidereal rotations of simulated time per real second. */
  daysPerSecond: number;
};

export type SimParams = {
  daysPerYear: number;
  eccentricity: number;
  /** Axial tilt in radians. */
  tilt: number;
};

export type SimToggles = {
  grid: boolean;
  planetOrbit: boolean;
  sunOrbit: boolean;
  trueSun: boolean;
  meanSun: boolean;
  eotWedge: boolean;
  siderealArc: boolean;
  solarArc: boolean;
  meanArc: boolean;
  /** काठमाडौँ's meridian, pole to pole — the line noon is reckoned against. */
  primeMeridian: boolean;
  /** The twelve राशि, out beyond the orbit. */
  rashiBelt: boolean;
  /** The twenty-seven नक्षत्र, outside the rashi belt. */
  nakshatraBelt: boolean;
  /** बिक्रम months, which *are* the solar rashi — बैशाख opens at मेष. */
  monthRing: boolean;
  /** Planet → Sun → belt: the line that says which rashi the Sun is seen in. */
  sightline: boolean;
  /** The Moon and the path it takes round the planet. */
  moon: boolean;
  /** The Moon's swept path through space — its compound motion made visible. */
  moonTrail: boolean;
  /** One sidereal lap against the extra arc a synodic month still needs. */
  moonLap: boolean;
  /** Earth → Moon → नक्षत्र belt: the Moon's own nakshatra, read off the sky. */
  moonSightline: boolean;
};

export type CameraState = { yaw: number; pitch: number; distance: number };

export type SceneLabel = {
  id: string;
  kind: "rashi" | "nakshatra" | "month" | "body" | "clock";
  /** Which clock a `clock` label belongs to, for colouring. */
  tone?: "sidereal" | "solar" | "mean";
  /** 1–12, rashi labels only — the glyph to draw beside the name. */
  index?: number;
  /** Unabbreviated name, nakshatra labels only, for the icon lookup. */
  full?: string;
  text: string;
  x: number;
  y: number;
  dim: boolean;
};

export type SceneSample = {
  day: number;
  /** Equation of time in minutes. */
  eotMinutes: number;
  meanAnomaly: number;
  /** 0–11: the rashi the Sun is seen in, which is also the बिक्रम month. */
  rashi: number;
  /** 0–26: the nakshatra the Sun is seen in. */
  nakshatra: number;
  /** 0–26: the nakshatra the **Moon** is in — the one a पञ्चाङ्ग names. */
  moonNakshatra: number;
  /** Set on the frame the Sun crosses into a new rashi, so the HUD can flash. */
  sankranti: number | null;
  labels: SceneLabel[];
};

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

/**
 * A ring drawn by `setDrawRange` rather than by rebuilding geometry.
 *
 * `RingGeometry` emits six indices per theta-segment in order, so truncating
 * the index buffer truncates the arc. That turns a per-frame geometry rebuild
 * — which is what an arc whose length changes every frame would otherwise
 * need — into a single integer write.
 */
function useArcGeometry(inner: number, outer: number) {
  return useMemo(
    () => new THREE.RingGeometry(inner, outer, ARC_SEGMENTS, 1, 0, PI2),
    [inner, outer],
  );
}

/** Ellipse in the XZ plane, as a closed line. Equal radii give a circle. */
function ellipseGeometry(semiMajor: number, semiMinor: number, segments = 128) {
  const pts: number[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const a = (i / segments) * PI2;
    pts.push(semiMajor * Math.cos(a), 0, -semiMinor * Math.sin(a));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

/**
 * Lines go through `<primitive>`, not `<line>`.
 *
 * `line` is an SVG intrinsic in React's JSX types, so the R3F element of the
 * same name resolves to `SVGLineElement` and every three.js prop on it is a
 * type error. Building the object and handing it over sidesteps the clash —
 * the same thing {@link ./TwoSystemsScene} does.
 */
/**
 * Truncate a full ring to `angle`, by index count rather than by rebuilding.
 *
 * `RingGeometry` emits six indices per theta-segment in order, so the arc
 * length is a single integer write. Angles at or past a full turn draw the
 * whole ring rather than wrapping back to nothing.
 */
function setRingArc(mesh: THREE.Mesh, angle: number, segments: number) {
  const frac = angle >= PI2 ? 1 : euclideanModulo(angle, PI2) / PI2;
  mesh.geometry.setDrawRange(0, Math.max(1, Math.round(frac * segments)) * 6);
}

function makeLine(geometry: THREE.BufferGeometry, color: number, opacity: number) {
  return new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
}

/**
 * Tip the Moon's plane around a travelling node line.
 *
 * `rotY(Ω) · rotX(i) · rotY(-Ω)` leaves longitudes in the parent frame alone
 * and only tilts around the diameter at Ω — so the Moon keeps the longitude it
 * already had, while the two crossings (Rāhu at Ω, Ketu at Ω+180°) stay on the
 * ecliptic and drift with Ω.
 */
function composeMoonPlane(
  out: THREE.Quaternion,
  solar: THREE.Quaternion,
  omegaRad: number,
  qNode: THREE.Quaternion,
  qNodeInv: THREE.Quaternion,
) {
  qNode.setFromAxisAngle(AXIS_Y, omegaRad);
  qNodeInv.copy(qNode).invert();
  return out.copy(solar).multiply(qNode).multiply(MOON_INCL_Q).multiply(qNodeInv);
}

/** Rāhu / Ketu — a smoky core and a ring facing the planet, not a textured ball. */
function ShadowGraha({
  nodeRef,
  color,
}: {
  nodeRef: MutableRefObject<THREE.Group>;
  color: number;
}) {
  return (
    <group ref={nodeRef}>
      <mesh>
        <sphereGeometry args={[NODE_R, 16, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
      <mesh>
        <sphereGeometry args={[NODE_R * 1.9, 16, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.14}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Torus in YZ, so from ±X (where the nodes sit on the axis group) the
          ring faces the planet — a hollow, not a body. */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[NODE_R * 1.45, NODE_R * 0.2, 8, 28]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

export interface SceneProps {
  clock: MutableRefObject<SimClock>;
  camera: MutableRefObject<CameraState>;
  params: SimParams;
  toggles: SimToggles;
  cameraTarget: CameraTarget;
  cameraFollow: boolean;
  /** The twelve राशि, in the reader's language. */
  rashiNames: string[];
  /** The twelve बिक्रम months — बैशाख first, aligned to मेष. */
  monthNames: string[];
  /** The twenty-seven नक्षत्र, short forms — what the belt is labelled with. */
  nakshatraNames: string[];
  /** The same, in full — the icon lookup needs the unabbreviated name. */
  nakshatraFullNames: string[];
  bodyNames: {
    planet: string;
    sun: string;
    meanSun: string;
    moon: string;
    rahu: string;
    ketu: string;
  };
  clockText: MutableRefObject<{ sidereal: string; solar: string; mean: string }>;
  /**
   * The label spans, by id, so the frame loop can move them directly.
   *
   * Label *positions* have to keep up with the scene at sixty frames a second
   * or the text visibly drags behind the bodies it names — which is what
   * routing them through React state at five samples a second did. What each
   * label says changes rarely, so that still arrives through `onSample`; only
   * the transform is written here.
   */
  labelNodes: MutableRefObject<Map<string, HTMLElement>>;
  onSample: (s: SceneSample) => void;
}

function DaySimScene({
  clock,
  camera,
  params,
  toggles,
  cameraTarget,
  cameraFollow,
  rashiNames,
  monthNames,
  nakshatraNames,
  nakshatraFullNames,
  bodyNames,
  clockText,
  labelNodes,
  onSample,
}: SceneProps) {
  const { camera: cam, size } = useThree();

  const [earthMap, sunMap, skyMap, moonMap] = useLoader(THREE.TextureLoader, [
    `${import.meta.env.BASE_URL}sky3d/earth.jpg`,
    `${import.meta.env.BASE_URL}sky3d/sun.jpg`,
    `${import.meta.env.BASE_URL}sky3d/background.jpg`,
    `${import.meta.env.BASE_URL}sky3d/moon.jpg`,
  ]);

  /* ── refs into the scene graph ───────────────────────────────────── */
  const arcRoot = useRef<THREE.Group>(null!);
  const planetMesh = useRef<THREE.Mesh>(null!);
  const siderealGroup = useRef<THREE.Group>(null!);
  const solarGroup = useRef<THREE.Group>(null!);
  const siderealArc = useRef<THREE.Mesh>(null!);
  const solarArc = useRef<THREE.Mesh>(null!);
  const meanArc = useRef<THREE.Mesh>(null!);
  const sunGroup = useRef<THREE.Group>(null!);
  const sunLight = useRef<THREE.PointLight>(null!);
  const wedge = useRef<THREE.Mesh>(null!);
  const sunOrbitGroup = useRef<THREE.Group>(null!);
  const moonRoot = useRef<THREE.Group>(null!);
  const moonPlane = useRef<THREE.Group>(null!);
  const nodeAxis = useRef<THREE.Group>(null!);
  const rahuGroup = useRef<THREE.Group>(null!);
  const ketuGroup = useRef<THREE.Group>(null!);
  const beltRoot = useRef<THREE.Group>(null!);
  const moonMesh = useRef<THREE.Mesh>(null!);
  const moonPlaneQ = useRef(new THREE.Quaternion());
  const qMoonNode = useRef(new THREE.Quaternion());
  const qMoonNodeInv = useRef(new THREE.Quaternion());
  const omegaRad = useRef(0);
  const yearCount = useRef(0);

  const frame = useRef(0);
  const lastRashi = useRef(-1);
  /* Scratch, reused every frame — see `atLonInto`. */
  const vSun = useRef(new THREE.Vector3());
  const vTmp = useRef(new THREE.Vector3());
  const vAnchor = useRef(new THREE.Vector3());
  const vMoon = useRef(new THREE.Vector3());
  const vProj = useRef(new THREE.Vector3());
  const yAxis = useRef(new THREE.Vector3(0, 1, 0));
  const scratch = useRef(new THREE.Vector3());
  const lookAt = useRef(new THREE.Vector3());
  const followYaw = useRef(0);
  /* Where the camera is actually pointed this frame, and how far through a
     change of focus it is. See the camera block in the frame loop. */
  const camAnchor = useRef(new THREE.Vector3());
  const lastTarget = useRef<CameraTarget>("meanSun");
  const focusEase = useRef(1);

  const siderealGeom = useArcGeometry(1.4, 1.6);
  const solarGeom = useArcGeometry(1.2, 1.4);
  const meanGeom = useArcGeometry(0.98, 1.2);

  /* Orbit outlines only change when the orbit's shape does. */
  const { semiMajor, semiMinor } = useMemo(
    () => orbitRadii(params.eccentricity, MEAN_DISTANCE),
    [params.eccentricity],
  );
  const trueOrbitLine = useMemo(
    () => makeLine(ellipseGeometry(semiMajor, semiMinor), COLOR.solar, 0.5),
    [semiMajor, semiMinor],
  );
  const meanOrbitLine = useMemo(
    () => makeLine(ellipseGeometry(MEAN_DISTANCE, MEAN_DISTANCE), COLOR.mean, 0.55),
    [],
  );
  /**
   * Half a great circle, pole to pole, through **काठमाडौँ**.
   *
   * Drawn in the XY plane it would run through longitude 0° — Greenwich — which
   * is the wrong meridian for this app entirely: every time the app quotes is
   * reckoned from Nepal, so the line that marks "noon here" has to pass through
   * here. Rotating the arc about the spin axis by Kathmandu's longitude puts it
   * there, and the standard equirectangular earth texture puts 0° along +X, so
   * a rotation of exactly the longitude is all it takes.
   */
  const localMeridian = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= 48; i += 1) {
      const a = -Math.PI / 2 + (i / 48) * Math.PI;
      pts.push(1.003 * Math.cos(a), 1.003 * Math.sin(a), 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const line = makeLine(g, 0xdd2222, 0.95);
    /* A rotation of +y about the spin axis carries +X east, which is the
       direction longitude runs. */
    line.rotation.y = KATHMANDU.lon * (Math.PI / 180);
    return line;
  }, []);

  const dispose = (o: THREE.Line) => {
    o.geometry.dispose();
    (o.material as THREE.Material).dispose();
  };
  useEffect(() => () => dispose(trueOrbitLine), [trueOrbitLine]);
  useEffect(() => () => dispose(meanOrbitLine), [meanOrbitLine]);
  useEffect(() => () => dispose(localMeridian), [localMeridian]);

  /**
   * Rotation carrying the equatorial plane onto the ecliptic.
   *
   * Built from the tilt about the vernal-equinox direction — so the Sun's path
   * leaves the equator by exactly the axial tilt, crossing it at the equinoxes.
   */
  const solarPlaneQ = useMemo(() => {
    const q = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      VERNAL_FROM_PERIHELION,
    );
    return q.multiply(
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(-params.tilt, -VERNAL_FROM_PERIHELION, 0),
      ),
    );
  }, [params.tilt]);

  /** The inverse — equatorial frame back to ecliptic, for reading longitudes. */
  const eclipticQ = useMemo(() => solarPlaneQ.clone().invert(), [solarPlaneQ]);

  /**
   * Where मेष 0° sits, so that **day 0 is मेष सङ्क्रान्ति — बैशाख १**.
   *
   * The orbit's own zero is perihelion, which has no reason to coincide with
   * the start of the बिक्रम year. Rather than bend the dynamics to make it —
   * which would drag the equation of time's phase along with it — the *belt*
   * is rotated so its origin lands wherever the Sun actually is at day 0. The
   * physics is untouched; only the labelling moves.
   *
   * It depends on eccentricity because the true anomaly does, so the belt
   * re-seats itself when that slider moves. That is correct rather than
   * incidental: a rounder orbit really does put सङ्क्रान्ति somewhere else
   * relative to perihelion.
   */
  const beltZeroDeg = useMemo(
    () =>
      euclideanModulo(
        trueAnomaly(MESHA_FROM_PERIHELION, params.eccentricity) * (180 / Math.PI) + 180,
        360,
      ),
    [params.eccentricity],
  );

  /**
   * A longitude on the belt, placed in the ecliptic plane where it belongs.
   *
   * Writes into a vector you own: this runs for every belt label on every
   * frame, so an allocating version quietly put fifty short-lived vectors a
   * frame back on the heap after the earlier cleanup.
   */
  const atBeltInto = useCallback(
    (out: THREE.Vector3, lonDeg: number, radius: number) =>
      atLonInto(out, lonDeg, radius).applyQuaternion(solarPlaneQ),
    [solarPlaneQ],
  );

  /** The Moon's orbital plane: the ecliptic, tipped by its own inclination. */
  const seedMoonPlane = useCallback(
    (omega: number) => {
      composeMoonPlane(
        moonPlaneQ.current,
        solarPlaneQ,
        omega,
        qMoonNode.current,
        qMoonNodeInv.current,
      );
      if (moonPlane.current) moonPlane.current.quaternion.copy(moonPlaneQ.current);
    },
    [solarPlaneQ],
  );
  useLayoutEffect(() => seedMoonPlane(omegaRad.current), [seedMoonPlane]);

  const moonOrbitLine = useMemo(
    () => makeLine(ellipseGeometry(MOON_ORBIT, MOON_ORBIT, 96), 0x9aa8c0, 0.4),
    [],
  );
  useEffect(() => () => dispose(moonOrbitLine), [moonOrbitLine]);

  /** The line of nodes — Rāhu to Ketu through the planet, always a diameter. */
  const nodeLine = useMemo(
    () =>
      makeLine(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-MOON_ORBIT, 0, 0),
          new THREE.Vector3(MOON_ORBIT, 0, 0),
        ]),
        0xc4b5fd,
        0.55,
      ),
    [],
  );
  useEffect(() => () => dispose(nodeLine), [nodeLine]);

  /**
   * The Moon's path through space over one synodic month.
   *
   * Drawn in *world* coordinates, not around the planet — because the planet
   * is moving too. What it shows is the compound motion: the Moon never loops
   * back on itself, it scallops forward along the planet's own orbit. This is
   * the single line that makes the next two arcs inevitable.
   */
  const moonTrail = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(new Float32Array((TRAIL_STEPS + 1) * 3), 3),
    );
    return makeLine(g, 0xb9c6de, 0.65);
  }, []);
  useEffect(() => () => dispose(moonTrail), [moonTrail]);

  /**
   * One sidereal lap, and the arc a synodic month still needs beyond it.
   *
   * The Moon returns to the same *star* after 360°, but by then the planet has
   * carried on around the Sun, so the Moon is not yet back beside it — it must
   * travel about **29° further** to reach the next new moon. Two arcs at
   * different radii: the full lap underneath, the overshoot standing proud of
   * it. That gap is the difference between a 27.3-day month and a 29.5-day one.
   */
  const lapArc = useMemo(() => {
    const first = new THREE.Mesh(
      new THREE.RingGeometry(MOON_ORBIT * 1.06, MOON_ORBIT * 1.14, LAP_SEGMENTS, 1, 0, PI2),
      new THREE.MeshBasicMaterial({
        color: 0x8fa6c8,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    const over = new THREE.Mesh(
      new THREE.RingGeometry(MOON_ORBIT * 1.16, MOON_ORBIT * 1.3, LAP_SEGMENTS, 1, 0, PI2),
      new THREE.MeshBasicMaterial({
        color: COLOR.solar,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    first.rotation.x = -Math.PI / 2;
    over.rotation.x = -Math.PI / 2;
    return { first, over };
  }, []);
  useEffect(
    () => () => {
      for (const m of [lapArc.first, lapArc.over]) {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      }
    },
    [lapArc],
  );

  /** Where the current lunar month began — the reference the arcs sweep from. */
  const monthStartTick = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(6), 3));
    return makeLine(g, 0xffffff, 0.75);
  }, []);
  useEffect(() => () => dispose(monthStartTick), [monthStartTick]);

  /* Wedge geometry: a fixed-size fan whose vertices move each frame. */
  const wedgeGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(new Float32Array((WEDGE_SEGMENTS + 2) * 3), 3),
    );
    const idx: number[] = [];
    for (let i = 1; i <= WEDGE_SEGMENTS; i += 1) idx.push(0, i, i + 1);
    g.setIndex(idx);
    return g;
  }, []);
  useEffect(() => () => wedgeGeom.dispose(), [wedgeGeom]);

  const dropLine = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(6), 3));
    return makeLine(g, COLOR.solar, 0.5);
  }, []);
  useEffect(() => () => dispose(dropLine), [dropLine]);

  /* ── the belts ─────────────────────────────────────────────────────── */

  /** Rashi belt: two rings and the twelve 30° spokes between them. */
  const rashiBelt = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < 12; i += 1) {
      const a = atLon(i * 30, BELT_INNER);
      const b = atLon(i * 30, BELT_OUTER);
      pts.push(a.x, 0, a.z, b.x, 0, b.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const spokes = new THREE.LineSegments(
      g,
      new THREE.LineBasicMaterial({ color: COLOR.belt, transparent: true, opacity: 0.75 }),
    );
    const group = new THREE.Group();
    group.add(spokes);
    group.add(makeLine(ellipseGeometry(BELT_INNER, BELT_INNER), COLOR.belt, 0.45));
    group.add(makeLine(ellipseGeometry(BELT_OUTER, BELT_OUTER), COLOR.belt, 0.45));
    return group;
  }, []);

  /** बिक्रम months sit on this circle — same 12-fold as the राशि, just inside. */
  const monthRingLine = useMemo(
    () => makeLine(ellipseGeometry(MONTH_R, MONTH_R), 0xe3d9a8, 0.5),
    [],
  );
  useEffect(() => () => dispose(monthRingLine), [monthRingLine]);

  /**
   * Polar guide drawn in the belts' own frame, so the twelve radials *are*
   * the राशि / month edges and the circles sit on the month, राशि and नक्षत्र
   * rings. Built with `atLon`, not `PolarGridHelper` — that helper's first
   * spoke is +Z, a quarter-turn off this scene's +X zero.
   */
  const guideGrid = useMemo(() => {
    const group = new THREE.Group();
    const rpts: number[] = [];
    for (let i = 0; i < 12; i += 1) {
      const a = atLon(i * 30, 4);
      const b = atLon(i * 30, NAK_OUTER);
      rpts.push(a.x, 0, a.z, b.x, 0, b.z);
    }
    const rg = new THREE.BufferGeometry();
    rg.setAttribute("position", new THREE.Float32BufferAttribute(rpts, 3));
    const spokes = new THREE.LineSegments(
      rg,
      new THREE.LineBasicMaterial({
        color: 0x1e4a7a,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    group.add(spokes);
    for (const r of [8, 12, MONTH_R, BELT_INNER, BELT_OUTER, NAK_OUTER]) {
      const ring = makeLine(ellipseGeometry(r, r, 96), 0x1e4a7a, 0.4);
      (ring.material as THREE.LineBasicMaterial).depthWrite = false;
      group.add(ring);
    }
    return group;
  }, []);
  useEffect(
    () => () => {
      guideGrid.traverse((o) => {
        const any = o as THREE.Mesh;
        any.geometry?.dispose?.();
        (any.material as THREE.Material | undefined)?.dispose?.();
      });
    },
    [guideGrid],
  );

  /** The lit segment — which rashi the Sun is in. Rotated, never rebuilt. */
  const rashiHighlight = useMemo(() => {
    const g = new THREE.RingGeometry(BELT_INNER, BELT_OUTER, 24, 1, 0, Math.PI / 6);
    const m = new THREE.Mesh(
      g,
      new THREE.MeshBasicMaterial({
        color: COLOR.solar,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    m.rotation.x = -Math.PI / 2;
    return m;
  }, []);

  /** Nakshatra belt: 27 ticks at 13°20′. */
  const nakBelt = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < 27; i += 1) {
      const lon = (i * 360) / 27;
      const a = atLon(lon, NAK_INNER);
      const b = atLon(lon, NAK_OUTER);
      pts.push(a.x, 0, a.z, b.x, 0, b.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const ticks = new THREE.LineSegments(
      g,
      new THREE.LineBasicMaterial({ color: COLOR.nakshatra, transparent: true, opacity: 0.7 }),
    );
    /**
     * The twelve राशि boundaries, carried out across the नक्षत्र belt.
     *
     * A rashi is 30° and a nakshatra 13°20′, so a rashi holds exactly **2¼**
     * nakshatras and the two grids only agree every 120°. Without these marks
     * the outer belt is 27 anonymous ticks; with them you can read straight off
     * which nakshatras a rashi contains, and see the quarter-nakshatra
     * (a *पाद*) that the boundary cuts through.
     */
    const rpts: number[] = [];
    for (let i = 0; i < 12; i += 1) {
      /* Starting exactly on the shared edge continues the राशि spokes from the
         inner belt without a break, so a boundary reads as one line crossing
         both rings; the outward overshoot keeps it distinct from the 27
         नक्षत्र spokes it runs beside. */
      const a = atLon(i * 30, NAK_INNER);
      const b = atLon(i * 30, NAK_OUTER + 1.1);
      rpts.push(a.x, 0, a.z, b.x, 0, b.z);
    }
    const rg = new THREE.BufferGeometry();
    rg.setAttribute("position", new THREE.Float32BufferAttribute(rpts, 3));
    const rashiMarks = new THREE.LineSegments(
      rg,
      /* Belt gold, so they read as belonging to the rashi ring inside. */
      new THREE.LineBasicMaterial({ color: COLOR.belt, transparent: true, opacity: 0.85 }),
    );

    const group = new THREE.Group();
    group.add(ticks);
    group.add(rashiMarks);
    group.add(makeLine(ellipseGeometry(NAK_INNER, NAK_INNER), COLOR.nakshatra, 0.4));
    group.add(makeLine(ellipseGeometry(NAK_OUTER, NAK_OUTER), COLOR.nakshatra, 0.4));
    return group;
  }, []);

  /** The lit नक्षत्र — the same treatment the rashi belt gets, one segment wide. */
  const nakHighlight = useMemo(() => {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(NAK_INNER, NAK_OUTER, 10, 1, 0, PI2 / 27),
      new THREE.MeshBasicMaterial({
        color: COLOR.solar,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    m.rotation.x = -Math.PI / 2;
    return m;
  }, []);

  /**
   * Earth → Moon → नक्षत्र belt.
   *
   * The Sun's line stops at the राशि belt's outer edge; this one carries on
   * through to the far edge of the नक्षत्र ring, because the nakshatra a
   * पञ्चाङ्ग names is the **Moon's**, not the Sun's. Same three-point shape as
   * the solar sightline, so the two read as the same kind of instrument.
   */
  const moonSightline = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(9), 3));
    return makeLine(g, 0xb9c6de, 0.85);
  }, []);
  useEffect(() => () => dispose(moonSightline), [moonSightline]);

  /** The नक्षत्र the Moon stands in, lit in its own colour. */
  const moonNakHighlight = useMemo(() => {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(NAK_INNER, NAK_OUTER, 10, 1, 0, PI2 / 27),
      new THREE.MeshBasicMaterial({
        color: 0xb9c6de,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    m.rotation.x = -Math.PI / 2;
    return m;
  }, []);
  useEffect(
    () => () => {
      moonNakHighlight.geometry.dispose();
      (moonNakHighlight.material as THREE.Material).dispose();
    },
    [moonNakHighlight],
  );

  /** Planet → Sun → belt. Three points, so the elbow at the Sun is visible. */
  const sightline = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(9), 3));
    return makeLine(g, COLOR.solar, 0.75);
  }, []);
  useEffect(() => () => dispose(sightline), [sightline]);

  useEffect(
    () => () => {
      for (const group of [rashiBelt, nakBelt]) {
        group.traverse((o) => {
          const any = o as THREE.Mesh;
          any.geometry?.dispose?.();
          (any.material as THREE.Material | undefined)?.dispose?.();
        });
      }
      for (const m of [rashiHighlight, nakHighlight]) {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      }
    },
    [rashiBelt, nakBelt, rashiHighlight, nakHighlight],
  );

  useFrame((_, delta) => {
    const { daysPerYear, eccentricity: e, tilt } = params;
    const c = clock.current;

    /* ── advance the clock ───────────────────────────────────────────── */
    if (c.playing) {
      /* Clamped so a backgrounded tab does not resume with one giant step. */
      c.day += c.daysPerSecond * Math.min(delta, 0.1);
      const wrappedYears = Math.floor(c.day / daysPerYear);
      if (wrappedYears) {
        /* The year loops; the nodes must not. One lap is 18.6 years. */
        yearCount.current += wrappedYears;
        c.day -= wrappedYears * daysPerYear;
      }
    }

    /* ── where everything is ─────────────────────────────────────────── */
    const day = c.day;
    const M = meanAnomalyAt(day / daysPerYear);
    const theta = trueAnomaly(M, e);
    const r = orbitDistance(semiMajor, e, theta);
    const eot = equationOfTime(M, e, tilt, PERIHELION - VERNAL);
    const dayAngle = euclideanModulo(day, 1) * PI2;

    const planetPos = scratch.current.set(
      MEAN_DISTANCE * Math.cos(M),
      0,
      -MEAN_DISTANCE * Math.sin(M),
    );

    /* True sun: down the real orbit from the planet, out of the equatorial
       plane by the tilt. */
    const sunOffset = vTmp.current
      .set(1, 0, 0)
      .applyAxisAngle(yAxis.current, theta)
      .applyQuaternion(solarPlaneQ)
      .setLength(r);
    const sunPos = vSun.current.copy(planetPos).sub(sunOffset);

    /* ── planet, arcs ────────────────────────────────────────────────── */
    /* Arc root points at the mean sun (hence the π), so the mean arc's zero
       is mean noon and every other arc is measured off the same origin. */
    arcRoot.current.position.copy(planetPos);
    arcRoot.current.rotation.y = M + Math.PI;
    planetMesh.current.rotation.y = dayAngle - M;
    siderealGroup.current.rotation.y = -M;
    solarGroup.current.rotation.y = -eot;

    const setArc = (mesh: THREE.Mesh, angle: number) => setRingArc(mesh, angle, ARC_SEGMENTS);
    setArc(siderealArc.current, dayAngle);
    setArc(solarArc.current, dayAngle + eot - M);
    setArc(meanArc.current, dayAngle - M);

    /* ── suns ────────────────────────────────────────────────────────── */
    sunGroup.current.position.copy(sunPos);
    sunGroup.current.rotation.y = M * 15;
    sunLight.current.position.copy(sunPos);
    sunOrbitGroup.current.position.copy(sunPos);

    /* Vertical drop from the true sun to the equatorial plane — the part of
       the offset that the tilt alone is responsible for. */
    {
      const a = dropLine.geometry.getAttribute("position") as THREE.BufferAttribute;
      a.setXYZ(0, sunPos.x, sunPos.y, sunPos.z);
      a.setXYZ(1, sunPos.x, 0, sunPos.z);
      a.needsUpdate = true;
      dropLine.geometry.computeBoundingSphere();
    }

    /* ── equation-of-time wedge ──────────────────────────────────────── */
    if (toggles.eotWedge) {
      const a = wedgeGeom.getAttribute("position") as THREE.BufferAttribute;
      /* Apex at the planet; one edge to the mean sun, the other swept round
         by the equation of time to the true sun. Both are drawn flat in the
         equatorial plane — the wedge measures an angle, not a distance. */
      a.setXYZ(0, planetPos.x, 0, planetPos.z);
      const toMean = Math.atan2(-(0 - planetPos.z), 0 - planetPos.x);
      const len = MEAN_DISTANCE * 0.75;
      for (let i = 0; i <= WEDGE_SEGMENTS; i += 1) {
        const ang = toMean - eot * (i / WEDGE_SEGMENTS);
        a.setXYZ(
          i + 1,
          planetPos.x + len * Math.cos(ang),
          0,
          planetPos.z - len * Math.sin(ang),
        );
      }
      a.needsUpdate = true;
      wedgeGeom.computeBoundingSphere();
      (wedge.current.material as THREE.MeshBasicMaterial).color.setHex(
        eot > 0 ? COLOR.solar : COLOR.mean,
      );
    }

    /* ── the Moon ────────────────────────────────────────────────────── */
    /* Sidereal longitude, anchored so day 0 is an अमावस्या: the Moon starts in
       the Sun's own direction, which is what new moon means. It is lit by the
       same point light as everything else, so its phases are the real geometry
       rather than a painted-on crescent. */
    moonRoot.current.position.copy(planetPos);
    const moonLonAt = (d: number) =>
      beltZeroDeg + MOON_ANCHOR_FROM_MESHA + MOON_LAPS_PER_YEAR * 360 * (d / daysPerYear);
    /* Clockwise = decreasing longitude. One lap in NODAL_PERIOD_DAYS.
       `yearCount` survives the year wrapping so the nodes keep travelling. */
    const rahuLon = euclideanModulo(
      -NODAL_LAPS_PER_YEAR * 360 * (yearCount.current + day / daysPerYear),
      360,
    );
    omegaRad.current = rahuLon * (Math.PI / 180);
    composeMoonPlane(
      moonPlaneQ.current,
      solarPlaneQ,
      omegaRad.current,
      qMoonNode.current,
      qMoonNodeInv.current,
    );
    moonPlane.current.quaternion.copy(moonPlaneQ.current);
    nodeAxis.current.rotation.y = omegaRad.current;
    if (toggles.moon || toggles.moonTrail || toggles.moonLap) {
      const moonLon = moonLonAt(day);
      atLonInto(moonMesh.current.position, moonLon, MOON_ORBIT);
      /* Tidally locked — the same face stays turned toward the planet. */
      moonMesh.current.rotation.y = moonLon * (Math.PI / 180) + Math.PI;

      /* Day 0 is no longer an अमावस्या, so the month boundary has to be solved
         for: elongation grows by `MOON_SYNODIC_PER_YEAR` turns a year, and a
         lunar month opens each time it passes a whole turn. */
      const elongTurns =
        (MOON_ANCHOR_FROM_MESHA + MOON_SYNODIC_PER_YEAR * 360 * (day / daysPerYear)) / 360;
      const monthStartDay =
        ((Math.floor(elongTurns) * 360 - MOON_ANCHOR_FROM_MESHA) * daysPerYear) /
        (MOON_SYNODIC_PER_YEAR * 360);
      const travelled = MOON_LAPS_PER_YEAR * 360 * ((day - monthStartDay) / daysPerYear);

      if (toggles.moonLap) {
        /* Both arcs start at the Moon's place when the month opened. */
        const startLon = moonLonAt(monthStartDay);
        lapArc.first.rotation.z = startLon * (Math.PI / 180);
        lapArc.over.rotation.z = (startLon + 360) * (Math.PI / 180);
        setRingArc(lapArc.first, Math.min(travelled, 360) * (Math.PI / 180), LAP_SEGMENTS);
        setRingArc(lapArc.over, Math.max(0, travelled - 360) * (Math.PI / 180), LAP_SEGMENTS);
        lapArc.over.visible = travelled > 360;

        const a = monthStartTick.geometry.getAttribute("position") as THREE.BufferAttribute;
        const t = vAnchor.current;
        atLonInto(t, startLon, MOON_ORBIT * 0.72);
        a.setXYZ(0, t.x, t.y, t.z);
        atLonInto(t, startLon, MOON_ORBIT * 1.34);
        a.setXYZ(1, t.x, t.y, t.z);
        a.needsUpdate = true;
        monthStartTick.geometry.computeBoundingSphere();
      }
    }

    /* ── which body the sky ring is hung around ──────────────────────── */
    /*
     * The belts are a ring of *directions*, and the stars that fix those
     * directions are effectively at infinity — so the ring may be hung around
     * whichever body the camera is watching, and each division still points
     * the same way. Hanging it on the planet is the geocentric sky, the one a
     * पात्रो is written from; hanging it on the Sun gives the heliocentric
     * view, where the planet is the thing going round the middle.
     *
     * The Sun's own reading survives the move: from the planet, the Sun lies
     * along `sunLon`, and the point at `sunLon` on a Sun-centred ring is
     * straight out along that same line — so the sightline still crosses the
     * Sun and lands on the rashi it is really in.
     *
     * The Moon's does not, and that is not a rounding error: the Moon is a
     * couple of units from the planet against the Sun's ten, so from the Sun
     * it lies in a quite different direction. Its markers are geocentric
     * quantities, so they are simply not drawn in the heliocentric frame
     * rather than drawn wrong.
     */
    const geocentric = cameraTarget !== "sun";
    const beltCentre = geocentric ? planetPos : sunPos;

    /* ── which rashi is the Sun seen in ──────────────────────────────── */
    /* A rashi is a division of the **ecliptic**, not of the equator, so the
       longitude has to be read in the ecliptic frame — undo the tilt first.
       Measuring it in this scene's equatorial working frame would hand back
       right ascension instead, which drifts up to ~2.5° away from the true
       ecliptic longitude and would put a sankranti on the wrong day. */
    const toSun = vTmp.current.copy(sunPos).sub(planetPos).applyQuaternion(eclipticQ);
    const sunLon = euclideanModulo(
      Math.atan2(-toSun.z, toSun.x) * (180 / Math.PI),
      360,
    );
    /* Measured from मेष, not from the orbit's perihelion — so day 0 reads
       मेष 0° / बैशाख १ exactly, whatever the eccentricity. */
    const lonFromMesha = euclideanModulo(sunLon - beltZeroDeg, 360);
    const rashi = Math.floor(lonFromMesha / 30) % 12;
    const nak = Math.floor((lonFromMesha * 27) / 360) % 27;

    /* The highlight lives inside the ecliptic group, so its own rotation is
       just the rashi's start longitude within that plane. */
    rashiHighlight.rotation.z = rashi * (Math.PI / 6);
    nakHighlight.rotation.z = nak * (PI2 / 27);

    if (toggles.sightline) {
      /* Out to the belt's far edge, so the line crosses the whole band and
         ends on the rashi it is naming rather than stopping at the label.
         The endpoint keeps its `y`: the belt lies in the *ecliptic*, which is
         tilted out of this scene's equatorial working plane, so flattening it
         to zero left the line hanging up to nine units short of the belt. */
      const hit = atBeltInto(vAnchor.current, sunLon, BELT_OUTER).add(beltCentre);
      const a = sightline.geometry.getAttribute("position") as THREE.BufferAttribute;
      a.setXYZ(0, planetPos.x, planetPos.y, planetPos.z);
      a.setXYZ(1, sunPos.x, sunPos.y, sunPos.z);
      a.setXYZ(2, hit.x, hit.y, hit.z);
      a.needsUpdate = true;
      sightline.geometry.computeBoundingSphere();
    }

    /* The Moon's own longitude, read from the world vector rather than assumed
       from `moonLon`: the 5.14° orbital inclination tilts the direction, so the
       ecliptic longitude is not quite the in-plane angle. */
    const mDir = atLonInto(vMoon.current, moonLonAt(day), MOON_ORBIT)
      .applyQuaternion(moonPlaneQ.current)
      .applyQuaternion(eclipticQ);
    const moonEclLon = euclideanModulo(Math.atan2(-mDir.z, mDir.x) * (180 / Math.PI), 360);
    const moonNak =
      Math.floor((euclideanModulo(moonEclLon - beltZeroDeg, 360) * 27) / 360) % 27;
    moonNakHighlight.rotation.z = moonNak * (PI2 / 27);
    moonNakHighlight.visible = toggles.nakshatraBelt && toggles.moonSightline && geocentric;
    moonSightline.visible = toggles.moonSightline && geocentric;

    if (moonSightline.visible) {
      /* Rebuilt rather than read off the mesh: `getWorldPosition` would use a
         matrix this frame has not committed yet. */
      const mPos = atLonInto(vTmp.current, moonLonAt(day), MOON_ORBIT)
        .applyQuaternion(moonPlaneQ.current)
        .add(planetPos);
      const a = moonSightline.geometry.getAttribute("position") as THREE.BufferAttribute;
      a.setXYZ(0, planetPos.x, planetPos.y, planetPos.z);
      a.setXYZ(1, mPos.x, mPos.y, mPos.z);
      const hit = atBeltInto(vAnchor.current, moonEclLon, NAK_OUTER).add(beltCentre);
      a.setXYZ(2, hit.x, hit.y, hit.z);
      a.needsUpdate = true;
      moonSightline.geometry.computeBoundingSphere();
    }

    let sankranti: number | null = null;
    if (lastRashi.current !== -1 && rashi !== lastRashi.current) sankranti = rashi;
    lastRashi.current = rashi;

    beltRoot.current.position.copy(beltCentre);

    /* ── camera ──────────────────────────────────────────────────────── */
    const v = camera.current;
    const target =
      cameraTarget === "planet" ? planetPos : cameraTarget === "sun" ? sunPos : lookAt.current.set(0, 0, 0);

    /*
     * Switching focus glides; holding it tracks exactly.
     *
     * A hard cut between two bodies ten units apart reads as a teleport — the
     * reader loses which body they were looking at, which is the one thing the
     * control exists to make obvious. So the anchor eases across on a change of
     * target and then snaps to exact, because a permanent lerp would trail
     * behind a planet moving twelve rotations a second.
     */
    if (cameraTarget !== lastTarget.current) {
      lastTarget.current = cameraTarget;
      focusEase.current = 0;
    }
    if (focusEase.current < 1) {
      focusEase.current = Math.min(1, focusEase.current + delta * 2.5);
      camAnchor.current.lerp(target, Math.min(1, delta * 6));
    } else {
      camAnchor.current.copy(target);
    }
    const anchorPos = camAnchor.current;

    /* Follow eases the yaw round with the planet so it stays put on screen. */
    followYaw.current += shortestAngle((cameraFollow ? -M : 0) - followYaw.current) *
      Math.min(1, delta * 3);
    const yaw = v.yaw + followYaw.current;
    const cosPitch = Math.cos(v.pitch);
    cam.position.set(
      anchorPos.x + v.distance * cosPitch * Math.sin(yaw),
      anchorPos.y + v.distance * Math.sin(v.pitch),
      anchorPos.z + v.distance * cosPitch * Math.cos(yaw),
    );
    cam.lookAt(anchorPos);

    /* ── labels: positioned every frame, described five times a second ── */
    frame.current += 1;
    const sampling = frame.current % 12 === 0;
    const labels: SceneLabel[] = sampling ? [] : EMPTY_LABELS;

    /* The trail is world-space and 160 points, so it is rebuilt on the sample
       tick rather than every frame — five times a second is smooth enough for
       a curve that takes a whole month to be drawn. */
    if (sampling && toggles.moonTrail) {
      const synodicDays = daysPerYear / MOON_SYNODIC_PER_YEAR;
      const a = moonTrail.geometry.getAttribute("position") as THREE.BufferAttribute;
      const v = vAnchor.current;
      const w = vTmp.current;
      for (let i = 0; i <= TRAIL_STEPS; i += 1) {
        const d = day - synodicDays * (1 - i / TRAIL_STEPS);
        const Md = meanAnomalyAt(d / daysPerYear);
        v.set(MEAN_DISTANCE * Math.cos(Md), 0, -MEAN_DISTANCE * Math.sin(Md));
        atLonInto(w, moonLonAt(d), MOON_ORBIT).applyQuaternion(moonPlaneQ.current);
        a.setXYZ(i, v.x + w.x, v.y + w.y, v.z + w.z);
      }
      a.needsUpdate = true;
      moonTrail.geometry.computeBoundingSphere();
    }

    const proj = vProj.current;
    const push = (
      id: string,
      kind: SceneLabel["kind"],
      text: string,
      at: THREE.Vector3,
      dim: boolean,
      tone?: SceneLabel["tone"],
      index?: number,
      full?: string,
    ) => {
      proj.copy(at).project(cam);
      const node = labelNodes.current.get(id);
      const behind = proj.z > 1;
      const x = (proj.x * 0.5 + 0.5) * size.width;
      const y = (-proj.y * 0.5 + 0.5) * size.height;
      const off =
        behind || x < -80 || y < -30 || x > size.width + 80 || y > size.height + 30;

      if (node) {
        /* `transform` rather than left/top: it is composited, so moving fifty
           labels a frame never triggers layout. */
        node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
        node.style.visibility = off ? "hidden" : "visible";
      }
      if (!sampling || off) return;
      labels.push({ id, kind, text, x, y, dim, index, full });
      if (tone) labels[labels.length - 1]!.tone = tone;
    };

    /* All three belts are labelled at the middle of each division, not at its
       edge, so a name sits inside the span it names. */
    if (toggles.rashiBelt) {
      for (let i = 0; i < 12; i += 1) {
        push(
          `r-${i}`,
          "rashi",
          rashiNames[i]!,
          atBeltInto(vAnchor.current, beltZeroDeg + i * 30 + 15, BELT_MID).add(beltCentre),
          i !== rashi,
          undefined,
          i + 1,
        );
      }
    }
    if (toggles.monthRing) {
      for (let i = 0; i < 12; i += 1) {
        push(
          `bs-${i}`,
          "month",
          monthNames[i]!,
          atBeltInto(vAnchor.current, beltZeroDeg + i * 30 + 15, MONTH_R).add(beltCentre),
          i !== rashi,
        );
      }
    }
    if (toggles.nakshatraBelt) {
      for (let i = 0; i < 27; i += 1) {
        push(
          `n-${i}`,
          "nakshatra",
          nakshatraNames[i]!,
          atBeltInto(
            vAnchor.current,
            beltZeroDeg + (i * 360) / 27 + 360 / 54,
            NAK_MID,
          ).add(beltCentre),
          i !== nak,
          undefined,
          undefined,
          nakshatraFullNames[i],
        );
      }
    }

    /* All the body anchors share one scratch: `push` projects immediately and
       never keeps the vector, so it is safe to overwrite between calls. */
    const anchor = vAnchor.current;
    push("b-planet", "body", bodyNames.planet, anchor.copy(planetPos).setY(PLANET_R * 2.2), false);
    if (toggles.moon) {
      push(
        "b-moon",
        "body",
        bodyNames.moon,
        moonMesh.current.getWorldPosition(anchor).setY(MOON_R * 3.4),
        false,
      );
      rahuGroup.current.getWorldPosition(anchor);
      anchor.y += NODE_R * 2.6;
      push("b-rahu", "body", bodyNames.rahu, anchor, false);
      ketuGroup.current.getWorldPosition(anchor);
      anchor.y += NODE_R * 2.6;
      push("b-ketu", "body", bodyNames.ketu, anchor, false);
    }
    if (toggles.trueSun)
      push("b-sun", "body", bodyNames.sun, anchor.copy(sunPos).setY(sunPos.y + SUN_R * 2.2), false);
    if (toggles.meanSun)
      push("b-mean", "body", bodyNames.meanSun, anchor.set(0, MEAN_SUN_R * 2.6, 0), false);

    /* Clock labels ride the tick that marks each arc's zero direction. */
    const tick = (localAngle: number) => {
      const a = M + Math.PI + localAngle;
      return anchor.set(
        planetPos.x + 2.1 * Math.cos(a),
        0,
        planetPos.z - 2.1 * Math.sin(a),
      );
    };
    const ct = clockText.current;
    if (toggles.meanArc) push("c-mean", "clock", ct.mean, tick(0), false, "mean");
    if (toggles.solarArc) push("c-solar", "clock", ct.solar, tick(-eot), false, "solar");
    if (toggles.siderealArc) push("c-sidereal", "clock", ct.sidereal, tick(-M), false, "sidereal");

    if (!sampling) return;
    onSample({
      day,
      eotMinutes: (eot * 24 * 60) / PI2,
      meanAnomaly: M,
      rashi,
      nakshatra: nak,
      moonNakshatra: moonNak,
      sankranti,
      labels,
    });
  });

  return (
    <>
      {/* Ambient kept very low on purpose: at 0.45 the night side was lit
          almost as brightly as the day side, which flattened the terminator
          and left the Moon a uniform disc at every phase. The Sun's own light
          does the modelling, so अमावस्या goes properly dark and पूर्णिमा
          lights the full face. */}
      <ambientLight intensity={toggles.trueSun ? 0.1 : 0.8} />
      <pointLight ref={sunLight} intensity={520} distance={0} decay={2} />

      {/* Sky. `BackSide` alone turns the sphere outside-in — a negative scale
          as well would cancel it out and cull every face. */}
      <mesh>
        <sphereGeometry args={[300, 32, 16]} />
        <meshBasicMaterial map={skyMap} side={THREE.BackSide} depthWrite={false} />
      </mesh>

      {/* राशि · नक्षत्र · बिक्रम महिना.

          The whole belt group is carried into the **ecliptic** plane, because
          that is the plane the divisions are defined on. In this scene's
          equatorial working frame that means the belt visibly tilts as the
          axial-tilt slider moves — which is not a side effect but the thing
          the tilt topics are trying to show: the Sun's road is not the
          planet's equator. */}
      <group ref={beltRoot}>
      <group quaternion={solarPlaneQ}>
        {/* The belt's own zero rotated onto मेष, so the spokes line up with
            the labels and with the sightline's reading. */}
        <group rotation={[0, beltZeroDeg * (Math.PI / 180), 0]}>
          <group visible={toggles.grid} position={[0, -0.05, 0]}>
            <primitive object={guideGrid} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
              <circleGeometry args={[NAK_OUTER, 64]} />
              <meshBasicMaterial
                color={0x000022}
                transparent
                opacity={0.7}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          </group>
          <primitive object={monthRingLine} visible={toggles.monthRing} />
          <primitive object={rashiBelt} visible={toggles.rashiBelt} />
          <primitive object={rashiHighlight} visible={toggles.rashiBelt} position={[0, -0.01, 0]} />
          <primitive object={nakBelt} visible={toggles.nakshatraBelt} />
          <primitive
            object={nakHighlight}
            visible={toggles.nakshatraBelt}
            position={[0, -0.01, 0]}
          />
          {/* Visibility of the two Moon markers is owned by the frame loop:
              it also depends on which body the belt is hung around, which only
              it knows. A `visible` prop here would fight it on every render. */}
          <primitive object={moonNakHighlight} position={[0, -0.02, 0]} />
        </group>
      </group>
      </group>

      {/* World-space, not in the belt root: both are drawn from the planet out
          to a belt that is already positioned there. */}
      <primitive object={sightline} visible={toggles.sightline} />
      <primitive object={moonSightline} />

      {/* Mean sun at the origin, and the circle the clock believes in */}
      <group visible={toggles.meanSun}>
        <mesh>
          <sphereGeometry args={[MEAN_SUN_R, 24, 16]} />
          <meshBasicMaterial color={COLOR.mean} wireframe />
        </mesh>
      </group>
      <primitive object={meanOrbitLine} visible={toggles.meanSun && toggles.planetOrbit} />

      {/* True sun, its spin, and the orbit it really travels */}
      <group ref={sunGroup} visible={toggles.trueSun}>
        <mesh>
          <sphereGeometry args={[SUN_R, 32, 24]} />
          <meshBasicMaterial map={sunMap} />
        </mesh>
      </group>
      <primitive object={dropLine} visible={toggles.trueSun && toggles.eotWedge} />
      <group ref={sunOrbitGroup} visible={toggles.sunOrbit && toggles.trueSun}>
        <group rotation={[0, VERNAL_FROM_PERIHELION, 0]}>
          <group rotation={[-params.tilt, -VERNAL_FROM_PERIHELION, 0]}>
            <primitive object={trueOrbitLine} rotation={[0, Math.PI, 0]} />
          </group>
        </group>
      </group>

      {/* The equation-of-time wedge */}
      <mesh ref={wedge} visible={toggles.eotWedge} geometry={wedgeGeom} position={[0, 0.002, 0]}>
        <meshBasicMaterial
          color={COLOR.solar}
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* The Moon, on its own inclined plane, carried along with the planet */}
      <primitive object={moonTrail} visible={toggles.moonTrail} />
      <group ref={moonRoot}>
        <group ref={moonPlane}>
          <primitive object={moonOrbitLine} visible={toggles.moon} />
          <primitive object={lapArc.first} visible={toggles.moonLap} />
          <primitive object={lapArc.over} visible={toggles.moonLap} />
          <primitive object={monthStartTick} visible={toggles.moonLap} />
          <mesh ref={moonMesh} visible={toggles.moon}>
            <sphereGeometry args={[MOON_R, 32, 24]} />
            <meshStandardMaterial map={moonMap} roughness={1} metalness={0} />
          </mesh>
          {/* Rāhu at +X, Ketu at −X of this axis; the axis itself is Ω. */}
          <group ref={nodeAxis} visible={toggles.moon}>
            <primitive object={nodeLine} />
            <group position={[MOON_ORBIT, 0, 0]}>
              <ShadowGraha nodeRef={rahuGroup} color={COLOR.rahu} />
            </group>
            <group position={[-MOON_ORBIT, 0, 0]}>
              <ShadowGraha nodeRef={ketuGroup} color={COLOR.ketu} />
            </group>
          </group>
        </group>
      </group>

      {/* Planet and its three day-arcs */}
      <group ref={arcRoot}>
        <mesh ref={planetMesh}>
          <sphereGeometry args={[PLANET_R, 48, 32]} />
          <meshStandardMaterial map={earthMap} roughness={0.92} metalness={0} />
          <primitive object={localMeridian} visible={toggles.primeMeridian} />
        </mesh>

        <mesh
          ref={meanArc}
          visible={toggles.meanArc}
          geometry={meanGeom}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.001, 0]}
        >
          <meshBasicMaterial color={COLOR.mean} transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>

        <group ref={solarGroup} visible={toggles.solarArc}>
          <mesh geometry={solarGeom} ref={solarArc} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
            <meshBasicMaterial color={COLOR.solar} transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
        </group>

        <group ref={siderealGroup} visible={toggles.siderealArc}>
          <mesh geometry={siderealGeom} ref={siderealArc} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
            <meshBasicMaterial
              color={COLOR.sidereal}
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      </group>
    </>
  );
}

export default memo(DaySimScene);
