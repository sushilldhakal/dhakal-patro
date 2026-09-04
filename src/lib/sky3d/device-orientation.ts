/**
 * The phone/laptop's own orientation and tilt — what AR mode points the sky
 * at on the web, the browser-API counterpart to the mobile app's
 * `useDeviceOrientation` (which reads `expo-location`/`expo-sensors`
 * instead). Same job, same output shape — `{ yaw, pitch, roll }` in radians,
 * ready to hand straight to the horizon camera's
 * `cam.rotation.set(-pitch, yaw, roll)` — different sensors, because the
 * browser only offers one API for all three axes at once.
 *
 * ## Yaw from the compass, pitch from the back camera
 *
 * `DeviceOrientationEvent` reports `alpha`/`beta`/`gamma` — an intrinsic
 * Z-X'-Y'' Euler rotation of the device's own frame. Feeding those three
 * into a quaternion and then splitting it back into YXZ (the three.js
 * DeviceOrientationControls trick) is correct for a free camera, but the
 * horizon view's look direction sits on the zenith the moment the reader
 * does what the prompt asks — raise the phone. YXZ gimbal-locks there, the
 * decomposed yaw stops changing, and the sky looks frozen.
 *
 * So yaw is taken from the compass heading instead (0 = north, clockwise,
 * the same frame as the dial). Pitch is still the altitude of the back
 * camera, read off that quaternion's look vector, so a rolled phone aims at
 * the right height. Roll is `gamma`.
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
const lookDir = new THREE.Vector3();

/**
 * Compass heading + device tilt → `{ yaw, pitch, roll }` in the horizon
 * camera's `'YXZ'` convention, ready for `cam.rotation.set(-pitch, yaw, roll)`.
 *
 * Yaw is taken from the compass (`headingDeg`: 0 = north, clockwise — the
 * same frame as the dial), not from a quaternion Euler split. Pointing the
 * phone at the sky puts the look direction on the zenith, where YXZ gimbal-
 * locks and a decomposed yaw stops updating — the sky appeared frozen the
 * moment the "raise your phone" prompt asked for that posture. Heading is
 * well-defined even then, and turning on the spot still spins the dome.
 *
 * Pitch is the altitude of the back camera, from the same three.js
 * quaternion the old path built (so a rolled phone still aims at the right
 * height). `headingDeg` must already be compass-referenced; callers fold in
 * `webkitCompassHeading` / absolute `alpha` before calling.
 */
export function deviceOrientationToCameraEuler(
  headingDeg: number,
  betaDeg: number,
  gammaDeg: number,
  screenAngleDeg: number,
): { yaw: number; pitch: number; roll: number } {
  const DEG = Math.PI / 180;
  const yaw = -headingDeg * DEG;

  deviceEuler.set(betaDeg * DEG, 0, -gammaDeg * DEG, "YXZ");
  deviceQuat.setFromEuler(deviceEuler);
  worldQuat.copy(deviceQuat).multiply(cameraCorrection);
  worldQuat.multiply(screenTransform.setFromAxisAngle(zAxis, -screenAngleDeg * DEG));
  lookDir.set(0, 0, -1).applyQuaternion(worldQuat);
  const altitude = Math.asin(Math.max(-1, Math.min(1, lookDir.y)));
  return { yaw, pitch: -altitude, roll: -gammaDeg * DEG };
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
  }, []);

  const attach = useCallback(() => {
    if (listenerRef.current) return;
    const handler = (event: Event) => {
      const e = event as IOSOrientationEvent;
      // Some browsers fire the event with nulls until permission lands, or
      // omit gamma on cheap hardware — skip a frame, don't drop the listener.
      if (e.beta == null && e.alpha == null) return;
      const beta = e.beta ?? 90;
      const gamma = e.gamma ?? 0;
      const screen = screenAngleDeg();

      const absolute = "absolute" in e ? Boolean((e as DeviceOrientationEvent).absolute) : false;
      const compassHeading =
        typeof e.webkitCompassHeading === "number" && Number.isFinite(e.webkitCompassHeading);
      const isAbsolute =
        event.type === "deviceorientationabsolute" || absolute || compassHeading;

      // 0 = north, clockwise — same frame as the compass dial. iOS already
      // reports that as `webkitCompassHeading`; everyone else inverts W3C
      // alpha (0 = north, CCW) and folds in the screen angle.
      let headingDeg: number;
      if (compassHeading) {
        headingDeg = ((e.webkitCompassHeading! % 360) + 360) % 360;
        setDriftingHeading(false);
      } else if (e.alpha != null) {
        headingDeg = ((360 - e.alpha + screen) % 360 + 360) % 360;
        setDriftingHeading(!isAbsolute);
      } else {
        return;
      }

      const result = deviceOrientationToCameraEuler(headingDeg, beta, gamma, screen);
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

  return { yaw, pitch, roll, available, driftingHeading, permissionState, requestPermission };
}
