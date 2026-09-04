/**
 * The phone/laptop's own orientation and tilt — what AR mode points the sky
 * at on the web, the browser-API counterpart to the mobile app's
 * `useDeviceOrientation` (which reads `expo-location`/`expo-sensors`
 * instead). Same job, same output shape — `{ yaw, pitch, roll }` in radians,
 * ready to hand straight to the horizon camera's
 * `cam.rotation.set(-pitch, yaw, roll)` — different sensors, because the
 * browser only offers one API for all three axes at once.
 *
 * ## Why a quaternion, not three independent angles
 *
 * `DeviceOrientationEvent` reports `alpha`/`beta`/`gamma` — an intrinsic
 * Z-X'-Y'' Euler rotation of the device's own frame, per the W3C spec. Once
 * the phone is both tilted *and* rolled at the same time (exactly the AR
 * posture — held up to the sky, then turned a little to line up a
 * constellation), those three angles stop being separable: reading `beta`
 * alone as "pitch" and `gamma` alone as "roll" is only correct when the
 * other is zero. The standard fix — the technique three.js's own
 * `DeviceOrientationControls` example uses — is to build the *quaternion*
 * the three angles actually describe, rotate it so "forward" means out the
 * back of the phone (where the camera lens is) rather than out of the
 * screen, correct for the screen having been rotated into landscape, and
 * only then read off yaw/pitch/roll — as an Euler decomposition in the same
 * `'YXZ'` order the horizon camera already rotates in, so the three numbers
 * this module returns are exactly the three the camera wants, with no
 * further reinterpretation needed at the call site.
 *
 * ## Heading: two different sources depending on browser
 *
 * `alpha` is only compass-referenced (0 = true/magnetic north) when the
 * event fires as `deviceorientationabsolute`, or when `.absolute` is `true`
 * on a plain `deviceorientation` event — mostly an Android/Chrome thing.
 * Safari on iOS never sets that; instead it stamps every `deviceorientation`
 * event with `webkitCompassHeading`, a heading it derives internally the
 * same way. Where neither is available, `alpha` is relative to wherever the
 * phone happened to be facing when tracking started, and drifts — used
 * anyway, so AR mode still does *something*, but flagged `driftingHeading`
 * so the UI can say so. Both event names are listened for: Chrome exposes
 * `ondeviceorientationabsolute` even when only `deviceorientation` fires
 * (DevTools Sensors, some Android builds), and listening to the absolute
 * name alone is how the sky stopped following the phone.
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
  /** Radians, ready for `cam.rotation.set(-pitch, yaw, roll)`. Null until the first reading. */
  yaw: number | null;
  pitch: number | null;
  roll: number | null;
  /** Whether events are actually arriving — false before permission is granted. */
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
type IOSOrientationEvent = DeviceOrientationEvent & { webkitCompassHeading?: number };
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

/* Scratch objects the conversion below writes into every event — this runs
   at sensor rate, not React's, so it must not allocate per call. */
const deviceEuler = new THREE.Euler();
const deviceQuat = new THREE.Quaternion();
const worldQuat = new THREE.Quaternion();
const screenTransform = new THREE.Quaternion();
const cameraCorrection = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
const zAxis = new THREE.Vector3(0, 0, 1);
const outEuler = new THREE.Euler();

/**
 * `(alpha, beta, gamma, screenAngle)` in degrees → `{ yaw, pitch, roll }` in
 * radians, in the horizon camera's own `'YXZ'` convention. `alpha` must
 * already be compass-referenced (0 = north) — callers correct it from
 * `webkitCompassHeading` first where `.absolute` isn't available; see
 * {@link useDeviceOrientation}.
 *
 * Exported bare, with no browser-event or React dependency, so it can be
 * unit-tested (or reused by a future non-web platform) without a DOM.
 */
export function deviceOrientationToCameraEuler(
  alphaDeg: number,
  betaDeg: number,
  gammaDeg: number,
  screenAngleDeg: number,
): { yaw: number; pitch: number; roll: number } {
  const DEG = Math.PI / 180;
  deviceEuler.set(betaDeg * DEG, alphaDeg * DEG, -gammaDeg * DEG, "YXZ");
  deviceQuat.setFromEuler(deviceEuler);
  worldQuat.copy(deviceQuat).multiply(cameraCorrection);
  worldQuat.multiply(screenTransform.setFromAxisAngle(zAxis, -screenAngleDeg * DEG));
  outEuler.setFromQuaternion(worldQuat, "YXZ");
  return { yaw: outEuler.y, pitch: -outEuler.x, roll: outEuler.z };
}

/**
 * Both event names, always. Chrome advertises `ondeviceorientationabsolute`
 * even when the Sensors panel (and some phones) only ever dispatch the
 * relative `deviceorientation` event — listening to the absolute name alone
 * is how the compass dial went deaf. Absolute samples still win when they
 * actually arrive; see the handler in {@link useDeviceOrientation}.
 */
const ORIENTATION_EVENTS = ["deviceorientationabsolute", "deviceorientation"] as const;

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
  const [yaw, setYaw] = useState<number | null>(null);
  const [pitch, setPitch] = useState<number | null>(null);
  const [roll, setRoll] = useState<number | null>(null);
  const [available, setAvailable] = useState(false);
  const [driftingHeading, setDriftingHeading] = useState(false);
  const [permissionState, setPermissionState] = useState<OrientationPermissionState>(() =>
    needsIOSPermission() ? "prompt-required" : "unnecessary",
  );

  const listenerRef = useRef<((e: Event) => void) | null>(null);
  const haveAbsoluteRef = useRef(false);
  const onSampleRef = useRef(onSample);
  useEffect(() => {
    onSampleRef.current = onSample;
  }, [onSample]);

  const detach = useCallback(() => {
    if (!listenerRef.current) return;
    for (const type of ORIENTATION_EVENTS) {
      window.removeEventListener(type, listenerRef.current);
    }
    listenerRef.current = null;
    haveAbsoluteRef.current = false;
  }, []);

  const attach = useCallback(() => {
    if (listenerRef.current) return;
    const handler = (event: Event) => {
      const e = event as IOSOrientationEvent;
      if (e.alpha == null || e.beta == null || e.gamma == null) return;

      const absolute = "absolute" in e ? Boolean((e as DeviceOrientationEvent).absolute) : false;
      const compassHeading =
        typeof e.webkitCompassHeading === "number" && Number.isFinite(e.webkitCompassHeading);
      const isAbsolute =
        event.type === "deviceorientationabsolute" || absolute || compassHeading;
      // Once a compass-referenced sample has arrived, ignore relative-only
      // duplicates so the two event names cannot fight each other.
      if (haveAbsoluteRef.current && !isAbsolute) return;
      if (isAbsolute) haveAbsoluteRef.current = true;

      let alpha = e.alpha;
      if (compassHeading) {
        // iOS never sets `.absolute`; `webkitCompassHeading` is its own true
        // heading, already 0 = north clockwise — invert back to the alpha
        // the quaternion conversion expects (0 = north, counter-clockwise).
        alpha = (360 - e.webkitCompassHeading!) % 360;
        setDriftingHeading(false);
      } else if (absolute || event.type === "deviceorientationabsolute") {
        setDriftingHeading(false);
      } else {
        setDriftingHeading(true);
      }

      const result = deviceOrientationToCameraEuler(alpha, e.beta, e.gamma, screenAngleDeg());
      setYaw(result.yaw);
      setPitch(result.pitch);
      setRoll(result.roll);
      setAvailable(true);
      onSampleRef.current?.(result);
    };
    listenerRef.current = handler;
    for (const type of ORIENTATION_EVENTS) {
      window.addEventListener(type, handler);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const ctor = window.DeviceOrientationEvent as IOSOrientationEventConstructor | undefined;
    if (typeof ctor?.requestPermission !== "function") {
      setPermissionState("unnecessary");
      attach();
      return true;
    }
    try {
      const result = await ctor.requestPermission();
      setPermissionState(result === "granted" ? "granted" : "denied");
      if (result === "granted") attach();
      return result === "granted";
    } catch {
      setPermissionState("denied");
      return false;
    }
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

  return { yaw, pitch, roll, available, driftingHeading, permissionState, requestPermission };
}
