/**
 * The phone/laptop's own orientation and tilt — what AR mode points the sky
 * at on the web, the browser-API counterpart to the mobile app's
 * `useDeviceOrientation` (which reads `expo-location`/`expo-sensors`
 * instead). Same job, same output shape — `{ yaw, pitch, roll }` in radians,
 * ready to hand straight to the horizon camera's
 * `cam.rotation.set(-pitch, yaw, roll)` — different sensors, because the
 * browser only offers one API for all three axes at once.
 *
 * ## One rotation, composed — never three angles taken from three places
 *
 * `DeviceOrientationEvent` reports `alpha`/`beta`/`gamma`: an intrinsic
 * Z-X'-Y'' Euler triple, `Rz(alpha)·Rx(beta)·Ry(gamma)`, carrying the phone's
 * own axes into (east, north, up). Read one at a time those three numbers
 * lie. The triple is only unique because the spec pins `gamma` into
 * [-90°, 90°), so every posture on the far side of that fence is reported on
 * the *other* branch — `alpha` jumps 180°, `beta` reflects about 90°, `gamma`
 * changes sign, all inside one event — while the rotation they compose to
 * does not move at all. The jumps cancel. Which is precisely why they have to
 * be composed, and never consumed individually.
 *
 * Yaw straight off the compass, pitch out of an `asin`, roll from `-gamma` —
 * what this used to do — breaks that cancellation three ways. The branch flip
 * reaches the view as a 180° spin of the whole grid. `asin` cannot report an
 * altitude past the zenith, so raising the phone over the top and bringing it
 * down the far side folded the sky back onto the near side and left it facing
 * the wrong way with the horizon upside down. And `gamma` is the least
 * trustworthy of the three near vertical, which is where AR mode spends its
 * whole life.
 *
 * So: compose the whole quaternion, then decompose it once, in the camera's
 * own `'YXZ'` convention. That round trip is exact — `cam.rotation.set` puts
 * back the rotation this took apart — so whatever the sensor triple does at a
 * branch boundary, the camera sees one continuous rotation. Nothing
 * degenerates at the zenith either: YXZ's own lock sits exactly there, but a
 * locked decomposition still reconstructs the rotation it came from, and the
 * dome's pitch limit already reaches the pole.
 *
 * ## Heading: a slow offset, not a per-sample yaw
 *
 * `alpha` is compass-referenced (0 = north) only when the event arrives as
 * `deviceorientationabsolute`, or with `.absolute` set — mostly an
 * Android/Chrome thing. Safari never sets either; it stamps every
 * `deviceorientation` event with `webkitCompassHeading` instead.
 *
 * That heading is a magnetometer's reading of where the phone's *top edge*
 * points, and it falls apart exactly where AR mode asks the reader to hold
 * the phone: aimed at the zenith the top edge is vertical, its bearing is
 * whatever the noise says, and consecutive samples can differ by 180°.
 * Driving yaw from it directly is what spun the sky while the phone was held
 * still, pointing up.
 *
 * So the compass never drives yaw. It calibrates `alpha` — smooth,
 * gyro-fused, but referenced to wherever the phone happened to be pointing
 * when tracking started — through a single offset in degrees: snapped on the
 * first reading, then damped hard, because it corrects a drifting reference
 * rather than the reader's own movement, and frozen outright whenever the
 * view is too steep for a bearing to mean anything. Turning on the spot is
 * answered by `alpha` at sensor rate; the compass only says, slowly, which
 * way north was. Where no absolute source exists at all the offset stays 0
 * and `driftingHeading` tells the UI to say so.
 *
 * ## iOS's permission gate
 *
 * iOS 13+ hides `alpha`/`beta`/`gamma` entirely behind
 * `DeviceOrientationEvent.requestPermission()`, which only resolves if
 * called synchronously inside a user gesture handler (a click, a tap) —
 * calling it from a `useEffect` throws or silently never resolves on some
 * versions. `requestPermission` below is therefore exposed to be called
 * directly from the same tap that turns AR mode on, not from this hook's
 * own effect.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type OrientationPermissionState =
  | "unnecessary"
  | "prompt-required"
  | "granted"
  | "denied";

export type DeviceOrientationSample = {
  /**
   * Whether events are actually arriving — false before permission is granted.
   *
   * The angles themselves are not here on purpose: they arrive at sensor
   * rate, and holding them in React state re-rendered the whole sky sixty
   * times a second for a value nothing rendered. They go to `onSample`, which
   * writes the ref the frame loop already reads.
   */
  available: boolean;
  /** No `deviceorientationabsolute`/`.absolute`/`webkitCompassHeading` seen yet — yaw will drift. */
  driftingHeading: boolean;
  permissionState: OrientationPermissionState;
  /**
   * Must be invoked directly inside a user-gesture event handler (a tap on
   * the AR toggle), never from an effect — see the module doc comment.
   * Resolves to whether orientation events can now be listened for.
   */
  requestPermission: () => Promise<boolean>;
};

/** iOS's non-standard extensions, absent from lib.dom's event/constructor types. */
type IOSOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
  /** Degrees of slop, or negative when CoreLocation says the reading is junk. */
  webkitCompassAccuracy?: number;
};
type IOSOrientationEventConstructor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

function needsIOSPermission(): boolean {
  // Called from `useState`'s initializer, which also runs during SSR —
  // `window` does not exist there, so this has to check before touching it.
  if (typeof window === "undefined") return false;
  const ctor = window.DeviceOrientationEvent as IOSOrientationEventConstructor | undefined;
  return typeof ctor?.requestPermission === "function";
}

const DEG = Math.PI / 180;

/* Scratch objects the conversion below writes into every event — this runs
   at sensor rate, not React's, so it must not allocate per call. */
const deviceEuler = new THREE.Euler();
const cameraEuler = new THREE.Euler(0, 0, 0, "YXZ");
const scratchQuat = new THREE.Quaternion();
const screenTransform = new THREE.Quaternion();
/**
 * −90° about x, post-multiplied: the spec's world is (east, north, up) and
 * its device frame has +z out of the *screen*; three.js wants y up with north
 * at −z, and the camera has to look out of the *back*. One quarter turn
 * reconciles both at once — `Rx(-90)·Rz(a)Rx(b)Ry(g)` is the same rotation as
 * `Ry(a)·Rx(b-90)·Ry(g)`, which is what this composes.
 */
const cameraCorrection = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
const zAxis = new THREE.Vector3(0, 0, 1);

const normalizeDeg = (d: number) => ((d % 360) + 360) % 360;

/** Shortest-path blend, so 359° → 1° does not swing the long way round. */
function dampDeg(prev: number, next: number, k: number): number {
  const delta = ((next - prev + 540) % 360) - 180;
  return normalizeDeg(prev + delta * k);
}

/**
 * `alpha`/`beta`/`gamma` (+ the screen's own rotation) → the world rotation
 * of a camera looking out of the phone's back lens, in the scene's frame
 * (−z north, +y zenith).
 *
 * `alphaDeg` is expected to be north-referenced; the hook folds its compass
 * offset in before calling. Everything else is the raw event.
 */
export function deviceOrientationToCameraQuaternion(
  alphaDeg: number,
  betaDeg: number,
  gammaDeg: number,
  screenAngleDeg: number,
  out: THREE.Quaternion,
): THREE.Quaternion {
  deviceEuler.set(betaDeg * DEG, alphaDeg * DEG, -gammaDeg * DEG, "YXZ");
  out.setFromEuler(deviceEuler);
  out.multiply(cameraCorrection);
  // The reader turns the phone sideways and the *screen's* up is no longer
  // the phone's up; the camera has to roll with it or landscape renders on
  // its side.
  out.multiply(screenTransform.setFromAxisAngle(zAxis, -screenAngleDeg * DEG));
  return out;
}

/**
 * The same rotation, split into what `cam.rotation.set(-pitch, yaw, roll)`
 * takes — the exact inverse of what the camera does with it, so the split
 * costs nothing even where the angles themselves are degenerate.
 */
export function cameraEulerFromQuaternion(q: THREE.Quaternion): OrientationSample {
  cameraEuler.setFromQuaternion(q, "YXZ");
  return { yaw: cameraEuler.y, pitch: -cameraEuler.x, roll: cameraEuler.z };
}

/** Device angles straight through to the camera's `{ yaw, pitch, roll }`. */
export function deviceOrientationToCameraEuler(
  alphaDeg: number,
  betaDeg: number,
  gammaDeg: number,
  screenAngleDeg: number,
): OrientationSample {
  return cameraEulerFromQuaternion(
    deviceOrientationToCameraQuaternion(alphaDeg, betaDeg, gammaDeg, screenAngleDeg, scratchQuat),
  );
}

/**
 * Altitude of the back camera in radians — how far above the horizon the lens
 * is aimed, which is all the compass gate needs.
 *
 * Neither `alpha` nor the screen angle can move it (both are turns about an
 * axis the look direction already lies on), so this is the whole of it:
 * `Rx(beta-90)·Ry(gamma)` applied to −z.
 */
export function cameraAltitude(betaDeg: number, gammaDeg: number): number {
  const y = Math.cos(gammaDeg * DEG) * Math.sin((betaDeg - 90) * DEG);
  return Math.asin(Math.max(-1, Math.min(1, y)));
}

/**
 * Picks whichever of `angle` or `angle` rotated a half turn (±180°) is
 * closer to `previous`, undoing exactly the flip raw `gamma` can report for
 * the *same* physical orientation as `beta` crosses the edges of its own
 * W3C-defined range: to keep reporting `gamma` within its fixed [-90°, 90°]
 * bounds, some browsers switch to an equivalent (beta, gamma) pair — beta
 * shifted by ~180°, gamma reflected — for a device that is tilting
 * perfectly smoothly in the real world. `pitch` (altitude, computed above
 * from the look vector) stays continuous through that exact switch, but
 * `roll = -gamma` does not: it jumps by ~180° in one sensor tick, which is
 * what reads as the whole sky flipping right as the view tips toward
 * straight down (or up) instead of continuing smoothly. A real, fast
 * physical roll never lands this close to exactly half a turn between two
 * consecutive samples (sensors report far faster than a wrist can move), so
 * this only ever fires on the artifact, never on an intentional fast roll —
 * see the unit-style checks this shipped with for both cases.
 *
 * Returns `angle` unchanged whenever there is no `previous` sample yet to
 * compare against (the very first reading).
 */
export function closestHalfTurn(angle: number, previous: number | null): number {
  if (previous == null) return angle;
  const TWO_PI = Math.PI * 2;
  const norm = (a: number) => ((a % TWO_PI) + TWO_PI) % TWO_PI;
  const circularDistance = (a: number, b: number) => {
    let d = norm(a) - norm(b);
    if (d > Math.PI) d -= TWO_PI;
    if (d < -Math.PI) d += TWO_PI;
    return Math.abs(d);
  };
  const flipped = angle + Math.PI;
  return circularDistance(flipped, previous) < circularDistance(angle, previous) ? flipped : angle;
}

/**
 * Both event names, always. Chrome advertises `ondeviceorientationabsolute`
 * even when the Sensors panel (and some phones) only ever dispatch the
 * relative `deviceorientation` event — listening to the absolute name alone
 * is how the compass dial went deaf. Absolute samples still win when they
 * actually arrive; see the handler in {@link useDeviceOrientation}.
 */
const ORIENTATION_EVENTS = ["deviceorientationabsolute", "deviceorientation"] as const;

/**
 * Steeper than this and `webkitCompassHeading` is reading the bearing of an
 * edge that is pointing at the sky — noise, and noise that flips by 180°. The
 * offset it feeds is held at its last good value instead.
 */
const HEADING_TRUST_ALTITUDE = 60 * DEG;
/**
 * How fast the compass offset is allowed to move per sample. It corrects a
 * reference that drifts over minutes, not the reader's own turning (that is
 * `alpha`, at full rate), so it is deliberately slow enough that a bad
 * magnetometer sample cannot jerk the sky.
 */
const HEADING_OFFSET_DAMP = 0.05;
/**
 * Slerp toward each new reading rather than snapping to it. Quaternions,
 * because damping the angles one by one is the same mistake as reading them
 * one by one — at the zenith yaw and roll trade places and a per-angle blend
 * would rotate the sky through the whole gap.
 */
const ORIENTATION_SMOOTHING = 0.45;

function screenAngleDeg(): number {
  if (typeof screen !== "undefined" && screen.orientation) return screen.orientation.angle;
  if (typeof window === "undefined") return 0;
  const legacy = (window as Window & { orientation?: number }).orientation;
  return typeof legacy === "number" ? legacy : 0;
}

export type OrientationSample = { yaw: number; pitch: number; roll: number };

export function useDeviceOrientation(
  active: boolean,
  onSample?: (sample: OrientationSample) => void,
): DeviceOrientationSample {
  const [available, setAvailable] = useState(false);
  const [driftingHeading, setDriftingHeading] = useState(false);
  const [permissionState, setPermissionState] = useState<OrientationPermissionState>(() =>
    needsIOSPermission() ? "prompt-required" : "unnecessary",
  );

  const listenerRef = useRef<((e: Event) => void) | null>(null);
  const onSampleRef = useRef(onSample);
  /** Last emitted roll, radians — for `closestHalfTurn` to unwrap the next
      sample against. Lives outside React state so it updates every sensor
      tick, not just every render. Reset with the listener: a fresh
      attach() (permission just granted, or AR mode re-entered) should not
      compare its first real reading against a stale roll from a previous
      session. */
  const lastRollRef = useRef<number | null>(null);
  useEffect(() => {
    onSampleRef.current = onSample;
  }, [onSample]);

  /** Degrees added to `alpha` to make it north-referenced. Null until the first compass reading. */
  const headingOffset = useRef<number | null>(null);
  /** An absolute source has spoken at least once — the relative twin is ignored from then on. */
  const sawAbsolute = useRef(false);
  const smoothed = useRef<THREE.Quaternion | null>(null);
  const target = useRef(new THREE.Quaternion());

  const detach = useCallback(() => {
    if (!listenerRef.current) return;
    for (const type of ORIENTATION_EVENTS) {
      window.removeEventListener(type, listenerRef.current);
    }
    listenerRef.current = null;
    // A fresh session recalibrates from scratch: the phone may well have been
    // put down and picked up facing somewhere else.
    headingOffset.current = null;
    sawAbsolute.current = false;
    smoothed.current = null;
  }, []);

  const attach = useCallback(() => {
    if (listenerRef.current) return;
    lastRollRef.current = null;
    const handler = (event: Event) => {
      const e = event as IOSOrientationEvent;
      // Some browsers fire the event with nulls until permission lands, or
      // omit gamma on cheap hardware — skip a frame, don't drop the listener.
      if (e.alpha == null && e.beta == null && e.gamma == null) return;

      // CoreLocation signals "no usable heading" — an uncalibrated
      // magnetometer, or one sitting next to a magnet — by handing back
      // negatives rather than nothing at all, and Safari passes them
      // straight through. Taken at face value they normalise to a bearing
      // near 359° and drag the offset with them.
      const compass =
        typeof e.webkitCompassHeading === "number" &&
        Number.isFinite(e.webkitCompassHeading) &&
        e.webkitCompassHeading >= 0 &&
        !(typeof e.webkitCompassAccuracy === "number" && e.webkitCompassAccuracy < 0)
          ? normalizeDeg(e.webkitCompassHeading)
          : null;
      const isAbsolute =
        compass != null ||
        event.type === "deviceorientationabsolute" ||
        ("absolute" in e ? Boolean((e as DeviceOrientationEvent).absolute) : false);

      // Chrome dispatches both names, with *different* alphas — one
      // north-referenced, one not. Letting them take turns walked the sky
      // back and forth between two headings every frame, so once an absolute
      // source has been heard the relative one is dropped.
      if (isAbsolute) sawAbsolute.current = true;
      else if (sawAbsolute.current) return;

      const alpha = e.alpha ?? 0;
      const beta = e.beta ?? 90;
      const gamma = e.gamma ?? 0;
      const screenAngle = screenAngleDeg();

      if (compass != null) {
        // W3C's absolute alpha counts anticlockwise from north and a compass
        // bearing clockwise, hence `360 −`. What is wanted is the constant
        // that turns this device's own `alpha` into that absolute one.
        const want = normalizeDeg(360 - compass - alpha);
        if (headingOffset.current == null) {
          headingOffset.current = want;
        } else if (Math.abs(cameraAltitude(beta, gamma)) <= HEADING_TRUST_ALTITUDE) {
          headingOffset.current = dampDeg(headingOffset.current, want, HEADING_OFFSET_DAMP);
        }
      }

      deviceOrientationToCameraQuaternion(
        alpha + (headingOffset.current ?? 0),
        beta,
        gamma,
        screenAngle,
        target.current,
      );
      if (smoothed.current == null) smoothed.current = target.current.clone();
      else smoothed.current.slerp(target.current, ORIENTATION_SMOOTHING);

      const result = cameraEulerFromQuaternion(smoothed.current);
      const roll = closestHalfTurn(result.roll, lastRollRef.current);
      lastRollRef.current = roll;

      setDriftingHeading(!isAbsolute);
      setAvailable(true);
      onSampleRef.current?.({ ...result, roll });
    };
    listenerRef.current = handler;
    for (const type of ORIENTATION_EVENTS) {
      window.addEventListener(type, handler);
    }
  }, []);

  type PermissionAsk = () => Promise<"granted" | "denied">;
  const requestPermission = useCallback((): Promise<boolean> => {
    const orientCtor = window.DeviceOrientationEvent as IOSOrientationEventConstructor | undefined;
    const motionCtor = window.DeviceMotionEvent as
      | (typeof DeviceMotionEvent & { requestPermission?: PermissionAsk })
      | undefined;

    // Listeners first — iOS starts delivering in the same turn as the grant
    // if they are already bound, and Android has no grant to wait for.
    attach();

    const orientAsk = orientCtor?.requestPermission;
    if (typeof orientAsk !== "function") {
      setPermissionState("unnecessary");
      return Promise.resolve(true);
    }

    // The native call has to stay in this tap's synchronous stack. An
    // `async` function is what made Safari treat it as *not* a user gesture,
    // resolve "denied" (or never), and leave the sky with no samples.
    let orientPromise: Promise<"granted" | "denied">;
    try {
      orientPromise = orientAsk.call(orientCtor);
    } catch {
      setPermissionState("denied");
      return Promise.resolve(false);
    }
    const motionAsk = motionCtor?.requestPermission;
    if (typeof motionAsk === "function") {
      try {
        void motionAsk.call(motionCtor);
      } catch {
        /* Orientation is the one the sky needs; motion is a courtesy. */
      }
    }

    return Promise.resolve(orientPromise).then(
      (result) => {
        const ok = result === "granted";
        setPermissionState(ok ? "granted" : "denied");
        return ok;
      },
      () => {
        setPermissionState("denied");
        return false;
      },
    );
  }, [attach]);

  useEffect(() => {
    if (!active) return;
    // iOS: stay idle until the tap's `requestPermission` actually granted —
    // attaching from an effect before that is what the gesture-gate exists
    // to prevent. After a grant, attach here too so React Strict Mode's
    // simulated unmount (which runs this cleanup) does not leave the sky
    // deaf: the remount re-binds the same listeners.
    if (needsIOSPermission() && permissionState !== "granted") return;
    attach();
    return () => {
      detach();
      setAvailable(false);
    };
  }, [active, attach, detach, permissionState]);

  return { available, driftingHeading, permissionState, requestPermission };
}
