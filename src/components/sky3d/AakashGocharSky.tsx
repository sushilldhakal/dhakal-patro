/**
 * 3D Aakash Gochar — the canvas, its gestures, the label overlay and the controls.
 *
 * The scene itself lives in {@link AakashGocharScene}; this component owns the
 * simulation clock, the camera, and everything the user can press. Both the
 * clock and the camera are held in refs so dragging or running the animation
 * never re-renders the tree — React only hears a sampled snapshot, five times a
 * second, which is also what positions the text labels over the canvas.
 *
 * This is the web counterpart of the mobile screen of the same name. The scene
 * below it is shared verbatim; what differs is everything the hand touches —
 * pointer events instead of a PanResponder, a fixed overlay instead of a modal,
 * and a wheel gesture the phone has no use for.
 */

import {
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Canvas } from "@react-three/fiber";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Crosshair,
  FastForward,
  MapPin,
  Pause,
  Play,
  Rewind,
  RotateCcw,
} from "lucide-react";
import type { GocharGraha } from "@/lib/api";
import { GRAHA_NAME, type GrahaKey } from "@/lib/graha-details";
import { adToBS, bsMonthLabel, bsToAD, WEEKDAYS_SHORT_NE } from "@/lib/bs-calendar";
import { SkyDateTimePicker } from "@/components/sky3d/SkyDateTimePicker";
import { bikramFromSun } from "@/lib/sky3d/bikram-solar";
import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { NAKSHATRA_SHORT } from "@/lib/sky3d/nakshatra-stars";
import { useLocale, bilingualText } from "@/i18n/locale";
import { formatRashiByNumber } from "@/lib/rashi-i18n";
import { cn } from "@/lib/utils";
import { GRAHA_COLOR } from "@/lib/sky3d/geocentric-model";
import { KATHMANDU, type Observer } from "@/lib/sky3d/horizon";
import {
  ayanamsa,
  calibrate,
  daysSinceJ2000,
  GEO_BODY_ORDER,
  type SkyCalibration,
} from "@/lib/sky3d/orbital-model";
import { RashiSkyGlyph } from "@/lib/sky3d/rashi-icons";
import { getZonedTimeParts } from "@/lib/zoned-time";
import { SOLAR_STATIONS } from "@/lib/sky3d/sky-geometry";
import { POLE_STARS } from "@/lib/sky3d/pole-stars";
import {
  AakashGocharScene,
  type SceneToggles,
  type ScreenLabel,
  type SimState,
  type SkyMode,
  type SkySample,
  type ViewState,
} from "@/components/sky3d/AakashGocharScene";

const Scene = memo(AakashGocharScene);

const CANVAS_BG = "#04090c";

/**
 * Overlay label colours, applied inline.
 *
 * These sit on the black canvas in both themes, so they must never inherit the
 * theme foreground — light mode would otherwise turn them near-black on it.
 */
const LABEL_COLOR = {
  rashi: "#f4c542",
  nakshatra: "#6fe08a",
  cardinal: "#ff8a8a",
  azimuth: "#7ea9d8",
  station: "#ffd166",
  tilt: "#ffd166",
  axis: "#9fc4f0",
  poleStar: "#cfe0ff",
  asterism: "#e6efff",
  tropic: "#e2d264",
  observer: "#ff6b6b",
  hud: "#ffffff",
  hudDim: "rgba(255,255,255,0.72)",
  overlayText: "rgba(236,242,244,0.88)",
  overlayDim: "rgba(236,242,244,0.62)",
} as const;

/**
 * The speed ladder, in simulated seconds per real second. Pressing a fast
 * button repeatedly climbs it; pause drops back to the first rung.
 */
const SPEED_LADDER = [
  /* The bottom rung is the clock on the wall: play runs the sky at the rate the
     sky actually runs. Everything above it is a fast button away. */
  { seconds: 1, ne: "१ सेकेन्ड/से", en: "1 sec/s" },
  { seconds: 60, ne: "१ मिनेट/से", en: "1 min/s" },
  { seconds: 7200, ne: "२ घण्टा/से", en: "2 hr/s" },
  { seconds: 172800, ne: "२ दिन/से", en: "2 days/s" },
  { seconds: 604800, ne: "१ हप्ता/से", en: "1 week/s" },
  { seconds: 5184000, ne: "२ महिना/से", en: "2 months/s" },
  /* The top two rungs are for one thing: precession. The ayanamsa moves a
     degree in seventy-two years, so at any calendar speed the belt looks
     nailed down. At 20 years a second मेष visibly walks away from वसन्त
     सम्पात, and the whole 26,000-year turn takes about twenty minutes. */
  { seconds: 63113904, ne: "२ वर्ष/से", en: "2 years/s" },
  { seconds: 631139040, ne: "२० वर्ष/से", en: "20 years/s" },
  /* The top rung is precession at one degree a second: the ayanamsa moves a
     degree in 72 years, so मेष crosses a whole rashi boundary every half
     minute and the pole hands over its star while you watch. */
  { seconds: 2272100544, ne: "७२ वर्ष/से", en: "72 years/s" },
];
/** Camera distance that frames the whole system in the space view. */
const SYSTEM_DISTANCE = 26;
/** Zoom value that opens the horizon view out to a ~120° fisheye. */
const HORIZON_WIDE = 45;
/** Default zoom in the Earth-globe view — frames the globe and its ring. */
const GLOBE_VIEW = 78;
/**
 * Where the globe camera starts.
 *
 * Past a right angle, so the face turned towards you is the one the observer is
 * standing on — the page is Kathmandu's sky, and opening on the Pacific would
 * put the marker round the back.
 */
const GLOBE_YAW = Math.PI - 0.6;
const GLOBE_PITCH = 0.42;

/** The camera never comes closer than this, nor pulls back further. */
const ZOOM_MIN = 0.35;
const ZOOM_MAX = 120;

const clampZoom = (v: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v));

/** How far a press may wander, in px, and still count as a tap rather than a drag. */
const DRAG_SLOP = 5;

/**
 * The most the belt text is allowed to grow as the camera pulls back.
 *
 * Deliberately small. The idea behind growing it at all is sound — the belt
 * shrinks to a ring in the middle of the screen and fixed-size text goes with
 * it — but at 2.4 the rashi names came out near thirty points, big enough to
 * smother the ring they name and each other. The far zoom is where there is
 * *least* room between labels, not most.
 */
const LABEL_SCALE_MAX = 1.3;
/**
 * Points shaved off the belt text at the widest zoom, ramped in with the scale.
 *
 * With the cap above this very nearly cancels the growth, which is the point:
 * out at the far end the names hold their own size instead of swelling.
 */
const LABEL_WIDE_TRIM = 3;

/**
 * A zone-shifted instant → the UTC midnight of the day it lands on.
 *
 * `adToBS` reads a mid-day instant off the device's own calendar and a UTC one
 * off UTC, so anything shown against the observed place has to arrive already
 * flattened to its day — otherwise an evening in Kathmandu reads as tomorrow to
 * anyone further east. Built through the UTC setters because `new Date(y, …)`
 * folds years 0–99 into the 1900s, and this clock runs to both ends of history.
 */
const zoneMidnight = (shifted: Date) => {
  const midnight = new Date(0);
  midnight.setUTCFullYear(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
  midnight.setUTCHours(0, 0, 0, 0);
  return midnight;
};

/** Belt-label font size at `scale`, with the wide-zoom trim applied. */
const beltFontSize = (base: number, scale: number) =>
  base * scale - (LABEL_WIDE_TRIM * (scale - 1)) / (LABEL_SCALE_MAX - 1);

export type AakashGocharSkyProps = {
  /** Gochar rows for {@link date} — the API longitudes the model is pinned to. */
  gochar?: Record<string, GocharGraha>;
  /**
   * The server's Lahiri ayanamsa for {@link date}, degrees — where the sidereal
   * zero stands against the equinox. The scene pins its own fit to it.
   */
  ayanamsaDeg?: number;
  /** The date the gochar rows describe; the simulation starts here. */
  date: Date;
  /**
   * Lets the transport row's calendar button jump the page to a new date —
   * the only way to change dates once the sky is fullscreen, where the date
   * nav above the canvas is out of reach.
   */
  onDateChange?: (date: Date) => void;
  clock?: string;
  onClockChange?: (clock: string) => void;
  /** Where the sky is being watched from. Drives the whole horizon view. */
  observer?: Observer;
  /** The place's timezone — the clock in the HUD reads on its wall, not UTC. */
  timeZone?: string;
  /**
   * The graha the sky is focused on. Optional: pass it with
   * {@link onSelectedKeyChange} to drive selection from outside — the page pairs
   * the sky with its detail cards that way — or leave both off and the sky keeps
   * its own.
   */
  selectedKey?: GrahaKey | null;
  onSelectedKeyChange?: (key: GrahaKey | null) => void;
  /** Canvas height in px when not fullscreen. */
  height?: number;
};

export function AakashGocharSky({
  gochar,
  ayanamsaDeg,
  date,
  onDateChange,
  clock,
  onClockChange,
  observer = KATHMANDU,
  timeZone = "Asia/Kathmandu",
  height = 460,
  selectedKey: selectedKeyProp,
  onSelectedKeyChange,
}: AakashGocharSkyProps) {
  const { lang, digits } = useLocale();
  const pick = useCallback(
    (ne: string, en: string) => bilingualText(lang, ne, en),
    [lang],
  );

  /* The API is the source of truth: pin the model onto it for this date, so the
     scene is exact here and merely smooth as the clock runs away from it. */
  const calibration: SkyCalibration = useMemo(
    () => (gochar ? calibrate(date, gochar) : {}),
    [gochar, date],
  );

  /* Same idea for the frame the longitudes live in: the offset that carries the
     scene's own Lahiri fit onto the server's value for this date. The fit is
     already sub-arcminute near now, but it drifts by a third of a degree a
     thousand years out — enough to slide the whole belt off its stars. */
  const ayanamsaShift = useMemo(
    () => (ayanamsaDeg == null ? 0 : ayanamsaDeg - ayanamsa(daysSinceJ2000(date))),
    [ayanamsaDeg, date],
  );

  const sim = useRef<SimState>({
    timeMs: date.getTime(),
    secondsPerRealSecond: SPEED_LADDER[0].seconds,
    playing: true,
  });
  /* Opens on the globe, so these have to match the framing the पृथ्वी गोला chip
     sets — otherwise the first frame is the space camera on a globe scene. */
  const view = useRef<ViewState>({ yaw: GLOBE_YAW, pitch: GLOBE_PITCH, distance: GLOBE_VIEW });

  const [mode, setMode] = useState<SkyMode>("globe");
  const [playing, setPlaying] = useState(true);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  /* Controlled when the page passes a key, uncontrolled otherwise — the inner
     state is kept either way so an uncontrolled sky still works on its own. */
  const [ownSelectedKey, setOwnSelectedKey] = useState<GrahaKey | null>(null);
  const controlled = selectedKeyProp !== undefined;
  const selectedKey = controlled ? selectedKeyProp : ownSelectedKey;
  const [sample, setSample] = useState<SkySample | null>(null);
  const [toggles, setToggles] = useState<SceneToggles>({
    belts: true,
    grid: true,
    lockStars: true,
    lockCenter: false,
    asterisms: true,
    poleStars: true,
    tilt: true,
    labels: true,
  });
  const [fullscreen, setFullscreen] = useState(false);
  /* Fullscreen only: the whole control row folds away to a single chevron, so
     the sky can have the entire screen when you just want to watch it. */
  const [controlsOpen, setControlsOpen] = useState(true);
  /* The transport row's own date picker — the date nav above the canvas is
     unreachable once fullscreen, so this is the only way to jump dates there. */
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  /* The lock needs a target, and hitting one on the sky is small on a phone —
     so the lock button doubles as the way to choose it. */
  const [grahaPickerOpen, setGrahaPickerOpen] = useState(false);
  /* The other thing the camera can follow: your own place on the globe, which
     holds it under the camera while the sky turns overhead. Exclusive with a
     graha — the lock has one target. */
  const [lockObserver, setLockObserver] = useState(false);

  // Following the date nav above the canvas keeps the two in step.
  useEffect(() => {
    sim.current.timeMs = date.getTime();
  }, [date]);

  const speed = SPEED_LADDER[speedIndex];

  useEffect(() => {
    sim.current.playing = playing;
    sim.current.secondsPerRealSecond = speed.seconds * (reverse ? -1 : 1);
  }, [playing, speed, reverse]);

  /**
   * A press of either fast button. Coming from a standstill or from the other
   * direction it starts at a minute a second — the first rung that is actually
   * fast, real time being the one below it; otherwise it climbs a rung and
   * stops at the top, seventy-two years a second.
   */
  const stepSpeed = useCallback(
    (direction: "forward" | "back") => {
      const wantReverse = direction === "back";
      const fromRest = !playing || reverse !== wantReverse;
      setSpeedIndex((i) => (fromRest ? 1 : Math.min(SPEED_LADDER.length - 1, i + 1)));
      setReverse(wantReverse);
      setPlaying(true);
    },
    [playing, reverse],
  );

  /** Pause always returns the clock to real time, running forward. */
  const togglePlay = useCallback(() => {
    if (playing) {
      setSpeedIndex(0);
      setReverse(false);
    }
    setPlaying((p) => !p);
  }, [playing]);

  /* ── gestures ─────────────────────────────────────────────────────────── */

  /* The handlers are built once, so they read the live mode from a ref. */
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  /**
   * Live pointers on the canvas, by pointerId. One drags the sky; two pinch it.
   * A Map rather than state — the whole point is that dragging never renders.
   */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gestureStart = useRef({ yaw: 0, pitch: 0, distance: 0, pinch: 0 });
  /** Where the current one-finger drag started, in client px. */
  const dragOrigin = useRef({ x: 0, y: 0 });
  /** Pointers this wrapper has taken capture of — see {@link captureDrag}. */
  const captured = useRef(new Set<number>());

  /**
   * Re-anchor the gesture on where the camera is now and on whichever pointer
   * is still down. Called when a gesture starts, and again when a finger lifts
   * out of a pinch — otherwise the remaining finger resumes the drag maths
   * against a stale origin and the sky jumps.
   */
  const reanchor = useCallback(() => {
    gestureStart.current = { ...view.current, pinch: 0 };
    const first = pointers.current.values().next();
    if (!first.done) dragOrigin.current = { ...first.value };
  }, []);

  /**
   * Take capture of a pointer, once — so a drag that runs off the canvas keeps
   * steering it.
   *
   * Deliberately *not* done on pointerdown. Capture retargets every later event
   * for that pointer at this wrapper, and the browser then fires `click` on the
   * nearest common ancestor rather than on what was pressed. Grabbing it up
   * front therefore swallowed both the overlay buttons (zoom, fullscreen) and
   * the canvas's own hit-testing, which is how a graha gets selected. So the
   * press is left alone until it has actually moved — a tap reaches its target,
   * a drag still steers.
   */
  const captureDrag = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (captured.current.has(e.pointerId)) return;
    captured.current.add(e.pointerId);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      /* A press that lands on a control is that control's, not the sky's —
         otherwise a slightly shaky press on "+" starts a camera drag. */
      if ((e.target as HTMLElement | null)?.closest?.("button, input, select, [role='button']")) {
        return;
      }
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      reanchor();
    },
    [reanchor],
  );

  const endPointer = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      pointers.current.delete(e.pointerId);
      if (captured.current.delete(e.pointerId)) {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
      }
      reanchor();
    },
    [reanchor],
  );

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const live = [...pointers.current.values()];

    if (live.length >= 2) {
      captureDrag(e);
      const [a, b] = live;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (!dist) return;
      if (!gestureStart.current.pinch) gestureStart.current.pinch = dist;
      view.current.distance = clampZoom(
        gestureStart.current.distance * (gestureStart.current.pinch / dist),
      );
      return;
    }

    const dx = e.clientX - dragOrigin.current.x;
    const dy = e.clientY - dragOrigin.current.y;
    /* Under the slop radius this is still a tap, and a tap belongs to whatever
       is under it — a graha, or a button. Past it, it is a drag for good. */
    if (!captured.current.has(e.pointerId) && Math.hypot(dx, dy) < DRAG_SLOP) return;
    captureDrag(e);
    /* Drag the sphere, don't drive the camera: pulling right swings the face
       you are looking at to the right, which means the camera has to go the
       other way round. */
    view.current.yaw = gestureStart.current.yaw - dx * 0.006;
    /* The camera is kept north of the ecliptic only in the space view — from
       the south side there the zodiac reads backwards, rashi and every graha
       running clockwise, which is never what you want to be looking at. The
       globe view is just the Earth sphere, with no such concern, so it gets the
       same full range as the horizon view. Both still clamp short of true
       vertical so the view cannot flip over on itself. */
    const lowestPitch = modeRef.current === "space" ? 0.08 : -1.45;
    view.current.pitch = Math.min(
      1.45,
      Math.max(lowestPitch, gestureStart.current.pitch + dy * 0.005),
    );
  }, [captureDrag]);

  const zoomBy = useCallback((factor: number) => {
    view.current.distance = clampZoom(view.current.distance * factor);
  }, []);

  /* The wheel is the desktop's pinch. Bound imperatively and non-passively:
     React's onWheel is passive, so it cannot stop the page scrolling under a
     zoom. */
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      /* Trackpads report small, frequent deltas and mice one big one; the
         exponent keeps both feeling like the same gesture. */
      zoomBy(Math.exp(e.deltaY * 0.0012));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  const onSample = useCallback((next: SkySample) => setSample(next), []);
  /* Clicking the graha already selected clears it, in both modes. */
  const onSelect = useCallback(
    (key: GrahaKey) => {
      if (controlled) {
        onSelectedKeyChange?.(selectedKeyProp === key ? null : key);
        return;
      }
      setOwnSelectedKey((prev) => {
        const next = prev === key ? null : key;
        onSelectedKeyChange?.(next);
        return next;
      });
    },
    [controlled, onSelectedKeyChange, selectedKeyProp],
  );

  /** Select outright — the picker names a graha, so it never toggles it off. */
  const setSelected = useCallback(
    (key: GrahaKey | null) => {
      if (!controlled) setOwnSelectedKey(key);
      onSelectedKeyChange?.(key);
    },
    [controlled, onSelectedKeyChange],
  );

  /**
   * Choose your own place as the lock target, and follow it straight away.
   *
   * The Earth's spin comes back on with it. Following your own place only says
   * anything while the globe is actually turning — the camera riding round with
   * it is the whole picture — and against a frozen Earth the lock would look
   * like it had done nothing at all.
   */
  const followObserver = useCallback(() => {
    setLockObserver(true);
    setToggles((t) => ({ ...t, lockCenter: true, lockStars: false }));
  }, []);

  /* Pressing the marker again lets it go, the same way pressing the graha
     already selected clears that. */
  const toggleObserver = useCallback(() => {
    setLockObserver((on) => {
      if (on) setToggles((t) => ({ ...t, lockCenter: false }));
      else setToggles((t) => ({ ...t, lockCenter: true, lockStars: false }));
      return !on;
    });
  }, []);

  /** Follow a graha instead — which is the other half of the same choice. */
  const followGraha = useCallback(
    (key: GrahaKey) => {
      setLockObserver(false);
      setSelected(key);
      setToggles((t) => ({ ...t, lockCenter: true }));
    },
    [setSelected],
  );

  /* No target, nothing to centre on: the lock cannot stay on once its graha is
     deselected and your place is not standing in for it, or the camera
     silently stops following. */
  useEffect(() => {
    if (!selectedKey && !lockObserver) {
      setToggles((t) => (t.lockCenter ? { ...t, lockCenter: false } : t));
    }
  }, [selectedKey, lockObserver]);

  /** What the lock is aimed at, named — or null when it is aimed at nothing. */
  const lockTargetName = lockObserver
    ? { ne: "तपाईंको स्थान", en: "your location" }
    : selectedKey
      ? GRAHA_NAME[selectedKey]
      : null;

  /* Fullscreen takes the viewport, so the page behind it must not scroll — and
     Escape has to get out, which is the one affordance a fixed overlay owes a
     keyboard. */
  useEffect(() => {
    if (!fullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen]);

  /** The fixed layer the sky moves into — and what the browser is handed. */
  const overlayRef = useRef<HTMLDivElement | null>(null);

  /*
   * Ask the browser for the screen, not just the viewport.
   *
   * A fixed layer only ever covers the page: the address bar, the tab strip and
   * the OS status bar all stay, which is exactly the "not really fullscreen"
   * this is here to fix — and on a phone the URL bar keeps a slice of the sky
   * for itself. The Fullscreen API takes the lot.
   *
   * The fixed layer stays underneath as the fallback rather than being replaced
   * by it: iOS Safari has the API on <video> alone and refuses this outright,
   * and a request can also be denied by permissions policy. Either way the
   * overlay is already on screen and nothing is lost.
   */
  useEffect(() => {
    const el = overlayRef.current;
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => void;
    };
    const active = () => doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;

    if (!fullscreen) {
      if (active()) (doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(doc);
      return;
    }
    if (!el) return;

    const target = el as HTMLDivElement & { webkitRequestFullscreen?: () => void };
    /* navigationUI: "hide" is a hint; browsers that do not know it ignore the
       dictionary rather than the call. */
    void Promise.resolve(
      target.requestFullscreen
        ? target.requestFullscreen({ navigationUI: "hide" })
        : target.webkitRequestFullscreen?.(),
    ).catch(() => {
      /* Denied — the fixed layer under this is the whole fallback. */
    });

    /* Browsers offer their own way out (Escape, the F11 key, a swipe on the
       notch). Leaving that way has to bring the overlay down with it, or the
       page is left in a fullscreen layout that is no longer fullscreen. */
    const onChange = () => {
      if (!active()) setFullscreen(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [fullscreen]);

  /* Memoised so `simStamp` below does not see a fresh Date on every render —
     the HUD reformats five times a second as it is. */
  const simDate = useMemo(
    () => (sample ? new Date(sample.timeMs) : date),
    [sample, date],
  );
  /* The Sun the scene has already computed — the calendar past the table's end. */
  const sunLongitude = sample?.sky.sun.longitude;
  const sunSpeed = sample?.sky.sun.speedDegPerDay;

  /* Rashi/nakshatra text grows past its base size once the camera pulls back
     beyond the mode's own default framing — capped so it never swamps the
     screen at the very widest zoom.

     Through a square root, not straight off the ratio: the space view can pull
     back to nearly five times its own framing, and taken linearly that put the
     text at the cap long before the zoom got there, so most of the range was
     spent at the largest size. The root keeps it near its own size through the
     middle of the range and only leans on the cap at the very end. */
  const modeBaseline =
    mode === "space" ? SYSTEM_DISTANCE : mode === "globe" ? GLOBE_VIEW : HORIZON_WIDE;
  const labelScale = sample
    ? Math.min(LABEL_SCALE_MAX, Math.sqrt(Math.max(1, sample.zoomDistance / modeBaseline)))
    : 1;

  /**
   * The place's offset from UT, taken once at the date the page is on.
   *
   * The simulation runs tens of thousands of years either way, where asking a
   * timezone database what the offset "was" is meaningless — and Kathmandu has
   * never had DST anyway. One offset, applied throughout, is both the honest
   * answer and the only one that survives the trip.
   */
  const zoneOffsetMs = useMemo(() => {
    const zoned = getZonedTimeParts(date, timeZone);
    const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
    let delta = zoned.hour * 60 + zoned.minute - utcMinutes;
    if (delta > 840) delta -= 1440;
    if (delta <= -720) delta += 1440;
    return delta * 60000;
  }, [date, timeZone]);

  /**
   * The day the date picker opens on — the one the place is having, not the
   * device.
   *
   * `adToBS` reads a mid-day instant off the device's own calendar, so at 20:30
   * in Kathmandu a reader in Melbourne was shown tomorrow, and setting the hour
   * looked like it moved the day. Normalising through the observed zone, and
   * handing over a UTC midnight, makes the picker agree with the HUD above it
   * wherever it is read from.
   */
  const dateBs = useMemo(
    () => adToBS(zoneMidnight(new Date(date.getTime() + zoneOffsetMs))),
    [date, zoneOffsetMs],
  );

  /**
   * The clock reading, in the calendar the reader is using and on the wall of
   * the place they picked — not UTC, and not the device's own zone.
   *
   * Everything here is arithmetic on the instant. Formatting a far date and
   * parsing it back does not survive: `new Date("20143-08-06T12:00:00")` is an
   * Invalid Date, and Intl quietly drops the era, so 2829 BC came back as AD
   * 2830. Hence UTC getters on a shifted instant, and a weekday counted in
   * days from the epoch.
   */
  const simStamp = useMemo(() => {
    const local = new Date(simDate.getTime() + zoneOffsetMs);
    const y = local.getUTCFullYear();
    const mo = String(local.getUTCMonth() + 1).padStart(2, "0");
    const d = String(local.getUTCDate()).padStart(2, "0");
    const wall = `${String(local.getUTCHours()).padStart(2, "0")}:${String(
      local.getUTCMinutes(),
    ).padStart(2, "0")}`;
    // 1 Jan 1970 was a Thursday, and 0 is Sunday.
    const dayIndex = Math.floor((simDate.getTime() + zoneOffsetMs) / 86400000);
    const weekday = (((dayIndex + 4) % 7) + 7) % 7;
    const place = timeZone.split("/").pop()?.replace(/_/g, " ") ?? timeZone;
    // Proleptic Gregorian throughout, as everywhere else in the app; year 0 is
    // 1 BC, so anything at or below it reads with the era spelled out.
    const adYear = y > 0 ? `${y}` : `${1 - y} BC`;

    if (lang === "en") {
      return { date: `${adYear}-${mo}-${d}`, time: `${wall} · ${place}` };
    }

    const adYearNe = y > 0 ? `${digits(y)} ई.` : `${digits(1 - y)} ई.पू.`;

    /* Past बि.सं. २२०० the compiled table has nothing, so the Sun becomes the
       calendar it always was — see [[bikram-solar]]. Marked with ≈ so it never
       passes for the almanac. The civil day goes with it, so the table is asked
       about the place's day rather than the device's. */
    const bs = bikramFromSun(simDate, sunLongitude ?? 0, sunSpeed, zoneMidnight(local));
    const mark = bs.approximate ? "≈" : "";
    return {
      date: `${mark}${digits(bs.year)} ${bsMonthLabel(bs.month, "ne")} ${digits(bs.day)}, ${
        WEEKDAYS_SHORT_NE[weekday]
      }बार`,
      // Out past the table the AD year rides along, so the reading can be
      // checked against a calendar the reader already knows.
      time: `${digits(wall)} · ${place}${bs.approximate ? ` · ${adYearNe}` : ""}`,
    };
  }, [simDate, zoneOffsetMs, timeZone, lang, digits, sunLongitude, sunSpeed]);

  const isDay = mode === "horizon" && (sample?.sunAltitude ?? -90) > -0.5;

  /* Fullscreen runs edge to edge; the HUD and the zoom column start below any
     notch the browser reports. */
  const overlayTop = fullscreen ? "calc(env(safe-area-inset-top, 0px) + 16px)" : "12px";

  /* ── controls ─────────────────────────────────────────────────────────── */

  /* The controls are built once and placed twice — a pinned row over the sky in
     fullscreen, a panel under it otherwise — so the two layouts can never drift
     apart in what they offer. */
  const transport = (
    <>
      <IconButton
        icon={<Rewind className="size-full" />}
        label={pick("पछाडि छिटो", "Faster backward")}
        active={!playing ? false : reverse && speedIndex > 0}
        overlay={fullscreen}
        compact={fullscreen}
        onPress={() => stepSpeed("back")}
      />
      <IconButton
        icon={playing ? <Pause className="size-full" /> : <Play className="size-full" />}
        label={playing ? pick("रोक्नुहोस्", "Pause") : pick("चलाउनुहोस्", "Play")}
        active={playing}
        overlay={fullscreen}
        compact={fullscreen}
        onPress={togglePlay}
      />
      <IconButton
        icon={<FastForward className="size-full" />}
        label={pick("अगाडि छिटो", "Faster forward")}
        active={!playing ? false : !reverse && speedIndex > 0}
        overlay={fullscreen}
        compact={fullscreen}
        onPress={() => stepSpeed("forward")}
      />
      <IconButton
        icon={<RotateCcw className="size-full" />}
        label={pick("मितिमा फर्कनुहोस्", "Back to the chosen date")}
        active={false}
        overlay={fullscreen}
        compact={fullscreen}
        onPress={() => {
          /* The nav above starts on today, so with no date chosen this is
             simply "back to now". */
          sim.current.timeMs = date.getTime();
        }}
      />
      {onDateChange ? (
        <IconButton
          icon={<Calendar className="size-full" />}
          label={pick("मिति छान्नुहोस्", "Choose a date")}
          active={datePickerOpen}
          overlay={fullscreen}
          compact={fullscreen}
          onPress={() => setDatePickerOpen(true)}
        />
      ) : null}
    </>
  );

  const viewChips = (
    <>
      <Chip
        active={mode === "space"}
        label={pick("अन्तरिक्ष", "Space")}
        onPress={() => {
          setMode("space");
          view.current = { yaw: 0.5, pitch: 0.62, distance: SYSTEM_DISTANCE };
        }}
        overlay={fullscreen}
        compact={fullscreen}
      />
      <Chip
        active={mode === "globe"}
        label={pick("पृथ्वी गोला", "Earth globe")}
        onPress={() => {
          setMode("globe");
          view.current = { yaw: GLOBE_YAW, pitch: GLOBE_PITCH, distance: GLOBE_VIEW };
        }}
        overlay={fullscreen}
        compact={fullscreen}
      />
    </>
  );

  const toggleChips = (
    <>
      <Chip
        active={toggles.labels}
        label={pick("नाम", "Labels")}
        onPress={() => setToggles((t) => ({ ...t, labels: !t.labels }))}
        overlay={fullscreen}
        compact={fullscreen}
      />
      <Chip
        active={toggles.belts}
        label={pick("राशि/नक्षत्र", "Zodiac")}
        onPress={() => setToggles((t) => ({ ...t, belts: !t.belts }))}
        overlay={fullscreen}
        compact={fullscreen}
      />
      <Chip
        active={toggles.asterisms}
        label={pick("तारापुञ्ज", "Star groups")}
        onPress={() => setToggles((t) => ({ ...t, asterisms: !t.asterisms }))}
        overlay={fullscreen}
        compact={fullscreen}
      />
      <Chip
        active={toggles.lockStars}
        label={pick("तारा स्थिर", "Lock to stars")}
        onPress={() => setToggles((t) => ({ ...t, lockStars: !t.lockStars }))}
        overlay={fullscreen}
        compact={fullscreen}
      />
      <IconButton
        icon={<Crosshair className="size-full" />}
        label={
          lockTargetName
            ? toggles.lockCenter
              ? pick(
                  `${lockTargetName.ne} केन्द्रबाट छुटाउनुहोस्`,
                  `Unlock the view from ${lockTargetName.en}`,
                )
              : pick(
                  `${lockTargetName.ne} केन्द्रमा राख्नुहोस्`,
                  `Keep ${lockTargetName.en} centred`,
                )
            : pick("के पछ्याउने छान्नुहोस्", "Choose what to follow")
        }
        active={toggles.lockCenter}
        overlay={fullscreen}
        compact={fullscreen}
        /* With no target there is nothing to centre on, so the press opens the
           chooser instead of toggling a lock that would do nothing. */
        onPress={() =>
          lockTargetName
            ? setToggles((t) => ({ ...t, lockCenter: !t.lockCenter }))
            : setGrahaPickerOpen(true)
        }
      />
    </>
  );

  const body = (
    <div
      className={
        fullscreen
          ? "flex h-full flex-col bg-background"
          : "overflow-hidden rounded-2xl border border-border"
      }
    >
      <div
        ref={canvasWrapRef}
        className={cn("relative touch-none select-none", fullscreen ? "flex-1" : "")}
        style={{
          height: fullscreen ? undefined : height,
          backgroundColor: CANVAS_BG,
          cursor: "grab",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        <Canvas
          camera={{ position: [0, 14, 22], fov: 50, near: 0.05, far: 1200 }}
          gl={{ antialias: true }}
          onCreated={({ gl }) => gl.setClearColor(CANVAS_BG)}
        >
          <Suspense fallback={null}>
            <Scene
              sim={sim}
              view={view}
              mode={mode}
              observer={observer}
              calibration={calibration}
              ayanamsaShift={ayanamsaShift}
              selectedKey={selectedKey}
              lockObserver={lockObserver}
              toggles={toggles}
              onSelect={onSelect}
              onSelectObserver={toggleObserver}
              onSample={onSample}
            />
          </Suspense>
        </Canvas>

        {/* Labels ride over the canvas rather than in it — real Devanagari type,
            positioned from the scene's own projection of each anchor. */}
        {toggles.labels && sample ? <SkyLabels labels={sample.labels} scale={labelScale} /> : null}

        {/* HUD — the simulated instant, which drifts away from the nav once it runs. */}
        <div
          className="pointer-events-none absolute left-3 rounded-lg bg-black/45 px-2.5 py-1.5"
          style={{ top: overlayTop }}
        >
          <p className="m-0 text-[11px] font-bold" style={{ color: LABEL_COLOR.hud }}>
            {simStamp.date}
          </p>
          <p className="m-0 text-[10px]" style={{ color: LABEL_COLOR.hudDim }}>
            {simStamp.time}
          </p>
          <p className="m-0 text-[10px]" style={{ color: LABEL_COLOR.hudDim }}>
            {mode === "horizon"
              ? `${pick("क्षितिज", "Horizon")} · ${digits(observer.lat.toFixed(2))}°, ${digits(
                  observer.lon.toFixed(2),
                )}° · ${isDay ? pick("दिन", "day") : pick("रात", "night")}`
              : mode === "globe"
                ? pick("पृथ्वी गोला · क्रान्तिवृत्त वलय", "Earth globe · ecliptic ring")
                : pick("अन्तरिक्षबाट", "From space")}
          </p>
          {/* The rate, since the speed buttons no longer carry a caption. */}
          <p className="m-0 text-[10px]" style={{ color: LABEL_COLOR.hudDim }}>
            {playing
              ? `${reverse ? "◀◀" : "▶▶"} ${pick(speed.ne, speed.en)}`
              : pick("⏸ रोकिएको", "⏸ paused")}
          </p>
        </div>

        <div className="absolute right-3 flex flex-col gap-2.5" style={{ top: overlayTop }}>
          <RoundButton label="+" title={pick("नजिक", "Zoom in")} onPress={() => zoomBy(0.7)} />
          <RoundButton label="−" title={pick("टाढा", "Zoom out")} onPress={() => zoomBy(1.4)} />
          <RoundButton
            label={fullscreen ? "✕" : "⛶"}
            title={fullscreen ? pick("बाहिर निस्कनुहोस्", "Exit fullscreen") : pick("पूरा पर्दा", "Fullscreen")}
            onPress={() => setFullscreen((f) => !f)}
          />
        </div>
      </div>

      {/* Floating over the canvas, this panel is always dark glass — so it runs
          on the dark tokens whatever the app theme is, or light-mode text would
          come out near-black on it.

          Fullscreen gets one row, not three. Stacked, the controls ate a third
          of a landscape screen's height — the sky is the point, so the transport
          stays pinned and everything else scrolls past it, with a chevron to
          drop the lot down to a single button. */}
      <div
        className={
          fullscreen
            ? "dark absolute inset-x-0 bottom-0 px-2 pt-2"
            : "flex flex-col gap-2.5 border-t border-border bg-card px-3 py-3"
        }
        style={
          fullscreen
            ? {
                backgroundColor: controlsOpen ? "rgba(4, 9, 12, 0.62)" : "transparent",
                paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
              }
            : undefined
        }
      >
        {fullscreen ? (
          <div className="flex items-center gap-1.5">
            {controlsOpen ? (
              <>
                {transport}
                <div className="h-6 w-px bg-white/15" />
                <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {viewChips}
                  <div className="mx-0.5 h-5 w-px shrink-0 bg-white/15" />
                  {toggleChips}
                </div>
              </>
            ) : (
              /* Collapsed: enough to stop the clock, and the way back. */
              <>
                <IconButton
                  icon={playing ? <Pause className="size-full" /> : <Play className="size-full" />}
                  label={playing ? pick("रोक्नुहोस्", "Pause") : pick("चलाउनुहोस्", "Play")}
                  active={playing}
                  overlay
                  compact
                  onPress={togglePlay}
                />
                <div className="flex-1" />
              </>
            )}
            <IconButton
              icon={
                controlsOpen ? (
                  <ChevronDown className="size-full" />
                ) : (
                  <ChevronUp className="size-full" />
                )
              }
              label={
                controlsOpen
                  ? pick("नियन्त्रण लुकाउनुहोस्", "Hide controls")
                  : pick("नियन्त्रण देखाउनुहोस्", "Show controls")
              }
              active={false}
              overlay
              compact
              onPress={() => setControlsOpen((o) => !o)}
            />
          </div>
        ) : (
          <>
            {/* Transport — each press of a fast button steps further up the
                speed ladder; pause drops back to normal. */}
            <div className="flex items-center gap-1">{transport}</div>

            {/* View and layers share one scroller: two short rows of chips were
                a row too many. */}
            <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {viewChips}
              <div className="mx-1 h-5 w-px shrink-0 bg-border" />
              {toggleChips}
            </div>
          </>
        )}
      </div>

      {/* What the camera should ride — a graha, or the ground you are standing
          on. Picking one turns the lock on in the same press: choosing here is
          only ever asked for because you want to follow it. */}
      {grahaPickerOpen ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <button
            type="button"
            aria-label={pick("बन्द गर्नुहोस्", "Close")}
            className="absolute inset-0 cursor-default"
            onClick={() => setGrahaPickerOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-4">
            <p className="m-0 mb-3 text-sm font-bold text-foreground">
              {pick("के पछ्याउने?", "What should the camera follow?")}
            </p>
            {/* Your own place, first: it is the one target that is not up in
                the sky, and the one that holds the ground still while the
                zodiac turns overhead. */}
            <button
              type="button"
              onClick={() => {
                followObserver();
                setGrahaPickerOpen(false);
              }}
              className={cn(
                "mb-2 flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-semibold transition-colors",
                lockObserver
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              <MapPin className="size-3.5 shrink-0" style={{ color: LABEL_COLOR.observer }} />
              <span className="truncate">{pick("तपाईंको स्थान", "Your location")}</span>
            </button>
            <div className="grid grid-cols-3 gap-2">
              {GEO_BODY_ORDER.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    followGraha(key);
                    setGrahaPickerOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition-colors",
                    !lockObserver && selectedKey === key
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: GRAHA_COLOR[key] }}
                  />
                  <span className="truncate">
                    {pick(GRAHA_NAME[key].ne, GRAHA_NAME[key].en)}
                  </span>
                </button>
              ))}
            </div>
            {lockTargetName ? (
              <button
                type="button"
                className="mt-3 w-full rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                onClick={() => {
                  setLockObserver(false);
                  setSelected(null);
                  setGrahaPickerOpen(false);
                }}
              >
                {pick("पछ्याउन छोड्नुहोस्", "Stop following")}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* An in-tree overlay rather than a portal: it belongs to the fullscreen
          layer it opens over, so it inherits that layer's stacking and theme
          without either being re-applied. */}
      {datePickerOpen ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <button
            type="button"
            aria-label={pick("बन्द गर्नुहोस्", "Close")}
            className="absolute inset-0 cursor-default"
            onClick={() => setDatePickerOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-4">
            <SkyDateTimePicker
              year={dateBs.year}
              month={dateBs.month}
              day={dateBs.day}
              clock={clock}
              onSelectDate={(y, m, d) => onDateChange?.(bsToAD(y, m, d))}
              onClockChange={onClockChange}
              onDone={() => setDatePickerOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );

  if (!fullscreen) return body;

  /* A fixed layer, not a portal to <body>: staying in the tree keeps the theme
     class and every CSS variable the chips read, which a detached root would
     lose. The scene remounts, but its textures come back out of the loader
     cache, so the sky is already there when the layer paints.
     This element is also what goes to the Fullscreen API above, which is why
     it carries the background rather than leaving it to the body underneath —
     once promoted it is the only thing on the screen.
     `h-[100dvh]` over the `inset-0` bottom: on a phone the layout viewport
     runs *under* a retractable URL bar, so inset-0 alone hides the control row
     behind it until the bar happens to retract. Browsers without dvh drop the
     declaration and land back on inset-0. */
  return (
    <div ref={overlayRef} className="fixed inset-0 z-[100] h-[100dvh] w-full bg-background">
      {body}
    </div>
  );
}

/**
 * The year a star takes its turn as pole star, in the reader's era. Nepali gets
 * बिक्रम सम्वत्, which is where every other year in the app is quoted.
 */
function formatPoleYear(
  year: number | undefined,
  lang: string,
  digits: (v: string | number) => string,
): string {
  if (year == null) return "";
  if (lang === "en") {
    return year < 0
      ? `${Math.abs(year).toLocaleString("en-US")} BC`
      : `AD ${year.toLocaleString("en-US")}`;
  }
  const bs = year + 57;
  const abs = digits(Math.abs(bs).toLocaleString("en-US"));
  return bs < 0 ? `${abs} बि.सं. पूर्व` : `${abs} बि.सं.`;
}

/** Absolutely placed, centred on the anchor, and never wrapping. */
function labelBox(x: number, y: number, width: number, top: number): CSSProperties {
  return {
    position: "absolute",
    left: x - width / 2,
    top: y + top,
    width,
    textAlign: "center",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };
}

/**
 * The text over the canvas. Memoised, and fed an array the scene only replaces
 * when a label has actually moved a pixel: the HUD clock ticks five times a
 * second, and re-rendering fifty Devanagari labels alongside it would stutter
 * the very animation they are labelling.
 */
const SkyLabels = memo(function SkyLabels({
  labels,
  scale = 1,
}: {
  labels: ScreenLabel[];
  /** Grows the rashi/nakshatra belt text as the camera pulls back — a fixed
      pixel size reads fine close up but disappears against the wider view
      once the belt has shrunk to a small ring in the middle of the screen. */
  scale?: number;
}) {
  const { lang, digits } = useLocale();
  const pick = (ne: string, en: string) => bilingualText(lang, ne, en);

  return (
    <div className="pointer-events-none absolute inset-0">
      {labels.map((label) => {
        if (label.kind === "rashi" && label.index) {
          const iconSize = 22 * scale;
          const boxWidth = 76 * scale;
          return (
            <div
              key={label.id}
              className="flex flex-col items-center"
              style={{
                position: "absolute",
                left: label.x - boxWidth / 2,
                top: label.y - 12 * scale,
                width: boxWidth,
              }}
            >
              <RashiSkyGlyph index={label.index} size={iconSize} color={LABEL_COLOR.rashi} />
              <span
                className="max-w-full truncate font-bold"
                style={{ fontSize: beltFontSize(14, scale), color: LABEL_COLOR.rashi }}
              >
                {formatRashiByNumber(label.index, lang)}
              </span>
            </div>
          );
        }
        if (label.kind === "nakshatra" && label.index) {
          const nak = NAKSHATRA_ICONS[label.index - 1];
          const boxWidth = 90 * scale;
          return (
            <span
              key={label.id}
              style={{
                ...labelBox(label.x, label.y, boxWidth, -6 * scale),
                fontSize: beltFontSize(12, scale),
                color: LABEL_COLOR.nakshatra,
              }}
            >
              {nak ? (lang === "en" ? nak.en : nak.ne) : ""}
            </span>
          );
        }
        if (label.kind === "asterism" && label.index) {
          /* The name of the star group itself, sitting on the stars. Short, so
             it does not smother the figure it belongs to. */
          const nak = NAKSHATRA_SHORT[label.index - 1];
          return (
            <span
              key={label.id}
              className="text-[10px] font-bold"
              style={{ ...labelBox(label.x, label.y, 60, 6), color: LABEL_COLOR.asterism }}
            >
              {nak ? (lang === "en" ? nak.en : nak.ne) : ""}
            </span>
          );
        }
        if (label.kind === "cardinal") {
          return (
            <span
              key={label.id}
              className="text-sm font-bold"
              style={{ ...labelBox(label.x, label.y, 28, -10), color: LABEL_COLOR.cardinal }}
            >
              {label.text}
            </span>
          );
        }
        if (label.kind === "station") {
          const st = SOLAR_STATIONS.find((x) => x.id === label.text);
          return (
            <span
              key={label.id}
              className="text-[10px] font-bold"
              style={{ ...labelBox(label.x, label.y, 120, -7), color: LABEL_COLOR.station }}
            >
              {st ? (lang === "en" ? st.en : st.ne) : ""}
            </span>
          );
        }
        if (label.kind === "axis") {
          return (
            <span
              key={label.id}
              className="text-[9px] font-bold"
              style={{ ...labelBox(label.x, label.y, 120, -16), color: LABEL_COLOR.axis }}
            >
              {label.text === "earth"
                ? pick("पृथ्वीको अक्ष", "Earth's axis")
                : pick("कक्षाको लम्ब", "Orbit's perpendicular")}
            </span>
          );
        }
        if (label.kind === "obliquity") {
          return (
            <span
              key={label.id}
              className="text-[11px] font-bold"
              style={{ ...labelBox(label.x, label.y, 90, -7), color: LABEL_COLOR.tilt }}
            >
              {`${digits((label.deg ?? 23.44).toFixed(2))}°`}
            </span>
          );
        }
        if (label.kind === "polestar") {
          const star = POLE_STARS.find((p) => p.en === label.text);
          if (!star) return null;
          // index 1 marks the star the pole is nearest right now.
          const reigning = label.index === 1;
          return (
            <div
              key={label.id}
              className="flex flex-col items-center"
              style={{ position: "absolute", left: label.x - 55, top: label.y + 8, width: 110 }}
            >
              <span
                className={cn(
                  "max-w-full truncate",
                  reigning ? "text-[11px] font-bold" : "text-[9px]",
                )}
                style={{ color: reigning ? LABEL_COLOR.station : LABEL_COLOR.poleStar }}
              >
                {lang === "en" ? star.en.replace(/\s*\(.*\)$/, "") : star.ne}
              </span>
              <span
                className="max-w-full truncate text-[8px]"
                style={{ color: LABEL_COLOR.overlayDim }}
              >
                {formatPoleYear(label.year, lang, digits)}
              </span>
            </div>
          );
        }
        if (label.kind === "tropic") {
          return (
            <span
              key={label.id}
              className="text-[9px]"
              style={{ ...labelBox(label.x, label.y, 110, -7), color: LABEL_COLOR.tropic }}
            >
              {label.text === "cancer"
                ? pick("कर्कट रेखा · २३.४४°उ", "Tropic of Cancer · 23.44°N")
                : pick("मकर रेखा · २३.४४°द", "Tropic of Capricorn · 23.44°S")}
            </span>
          );
        }
        if (label.kind === "observer") {
          return (
            <div
              key={label.id}
              className="flex flex-col items-center"
              style={{ position: "absolute", left: label.x - 55, top: label.y - 8, width: 110 }}
            >
              <MapPin size={14 * scale} color={LABEL_COLOR.observer} fill={LABEL_COLOR.observer} />
              <span
                className="max-w-full truncate font-bold"
                style={{ fontSize: 10 * scale, color: LABEL_COLOR.observer }}
              >
                {pick("तपाईं यहाँ", "You are here")}
              </span>
            </div>
          );
        }
        if (label.kind === "azimuth") {
          return (
            <span
              key={label.id}
              className="text-[9px]"
              style={{ ...labelBox(label.x, label.y, 32, -6), color: LABEL_COLOR.azimuth }}
            >
              {label.text}
            </span>
          );
        }
        if (label.kind === "graha" && label.key) {
          return (
            <span
              key={label.id}
              className="text-[10px] font-bold"
              style={{ ...labelBox(label.x, label.y, 90, 10), color: GRAHA_COLOR[label.key] }}
            >
              {lang === "en" ? GRAHA_NAME[label.key].en : GRAHA_NAME[label.key].ne}
            </span>
          );
        }
        return null;
      })}
    </div>
  );
});

function Chip({
  active,
  label,
  onPress,
  overlay,
  compact,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  /** Floating over the canvas: force light text, whatever the app theme is. */
  overlay?: boolean;
  /** Tighter, for the single row that floats over a fullscreen sky. */
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full border font-medium transition-opacity hover:opacity-80",
        compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
        active ? "border-secondary bg-secondary/15" : "border-border bg-background",
        !overlay && (active ? "text-secondary" : "text-muted-foreground"),
      )}
      style={
        overlay
          ? {
              backgroundColor: "rgba(255,255,255,0.08)",
              color: active ? LABEL_COLOR.rashi : LABEL_COLOR.overlayText,
            }
          : undefined
      }
    >
      {label}
    </button>
  );
}

/** A transport control: icon only, with the label carried by the accessible name. */
function IconButton({
  icon,
  label,
  active,
  overlay,
  compact,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  overlay?: boolean;
  /** Tighter, for the single row that floats over a fullscreen sky. */
  compact?: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={label}
      title={label}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border transition-opacity hover:opacity-80",
        compact ? "size-8 p-1.5" : "size-10 p-2",
        active ? "border-secondary bg-secondary/15" : "border-border bg-background",
        !overlay && (active ? "text-secondary" : "text-muted-foreground"),
      )}
      style={
        overlay
          ? {
              backgroundColor: "rgba(255,255,255,0.08)",
              color: active ? LABEL_COLOR.rashi : LABEL_COLOR.overlayText,
            }
          : undefined
      }
    >
      {icon}
    </button>
  );
}

/**
 * Zoom and fullscreen, sitting on top of the sky. Large on purpose: against a
 * star field a small dark disc reads as scenery.
 */
function RoundButton({
  label,
  title,
  onPress,
}: {
  label: string;
  title: string;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={title}
      title={title}
      className="flex size-14 items-center justify-center rounded-full bg-black/45 text-[28px] font-bold leading-none transition-opacity hover:opacity-80"
      style={{ color: LABEL_COLOR.hud }}
    >
      {label}
    </button>
  );
}

export default AakashGocharSky;
