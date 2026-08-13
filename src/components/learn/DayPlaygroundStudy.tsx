/**
 * The Learn playground — one scene, configured per topic.
 *
 * The scene carries the geometry; this file is the instrument panel around it.
 * Which layers open, what the play button moves and where the camera starts
 * all come from {@link @/lib/learn/playground-config}, so a topic about the
 * day opens spinning the planet with its three day-arcs showing, and one about
 * sankranti opens creeping along the राशि belt with the Sun's sightline lit.
 *
 * Nothing is taken away by that. The four group chips — बर्ष · सूर्य · दिन ·
 * अक्ष झुकाव — plus the belt chips reach every layer in the scene from any
 * topic, so a reader who wants the whole picture is one press from it. The
 * config decides the opening frame, not the ceiling.
 *
 * Following {@link ./TwoSystemsStudy}: the clock and camera live in refs and
 * are mutated by the render loop, so neither playing nor dragging re-renders
 * React. What React sees is a sample the scene hands back five times a second,
 * and the HUD and labels are drawn from that and nothing else.
 */

import { memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Canvas } from "@react-three/fiber";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

import { bilingualText, useLocale } from "@/i18n/locale";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { cn } from "@/lib/utils";
import { BS_MONTHS_NE, BS_MONTH_NAMES } from "@/lib/bs-calendar";
import { getRashiList } from "@/lib/rashi-i18n";
import { edPreset, edPresets, edRo, edRoK, edRoV } from "@/lib/learn-classes";
import { edScrub } from "@/lib/diagram-classes";
import { useFullscreen } from "@/lib/use-fullscreen";
import { RashiSkyGlyph } from "@/lib/sky3d/rashi-icons";
import { NAKSHATRA_ASTERISMS, NAKSHATRA_SHORT } from "@/lib/sky3d/nakshatra-stars";
import { NakshatraIcon } from "@/components/nakshatra/NakshatraIcon";
import {
  clocks,
  dayCounts,
  equationOfTime,
  meanAnomalyAt,
  PERIHELION,
  PLANET_PRESETS,
  VERNAL,
} from "@/lib/sky3d/day-mechanics";
import { adjacentTopicMetas } from "@/lib/learn/learn-topics-meta";
import {
  resolvePlayground,
  SPEED_MULTIPLIERS,
  type PlaygroundConfig,
} from "@/lib/learn/playground-config";
import EotGraph from "./EotGraph";
import Scene, {
  type CameraState,
  type CameraTarget,
  type SceneLabel,
  type SceneSample,
  type SimClock,
  type SimToggles,
} from "./DaySimScene";

const CANVAS_BG = "#04070d";
const PI2 = Math.PI * 2;
const DEG = Math.PI / 180;

const TONE = {
  sidereal: "#6cb6f5",
  solar: "#e6e34a",
  mean: "#f0736a",
} as const;

const GOLD = "#d8c84a";

function clampPitch(p: number) {
  return Math.max(-1.45, Math.min(1.45, p));
}

/**
 * The four group chips, and which layers each one owns.
 *
 * A group is on when every layer it owns is on, and pressing it turns the
 * whole set on or off together. This is the level a reader actually thinks at
 * — "show me the year" — while the drawer underneath still exposes each layer
 * on its own for when they want to take one thing away.
 */
const GROUPS = {
  year: ["planetOrbit", "monthRing", "rashiBelt"],
  sun: ["trueSun", "sightline", "sunOrbit"],
  day: ["siderealArc", "solarArc", "meanArc", "primeMeridian"],
  tilt: ["sunOrbit", "grid", "eotWedge", "meanSun"],
  moon: ["moon", "moonTrail", "moonLap", "moonSightline"],
} satisfies Record<string, (keyof SimToggles)[]>;

type GroupKey = keyof typeof GROUPS;

export interface DayPlaygroundStudyProps {
  /** The topic this playground belongs to — decides its opening state. */
  slug: string;
  config: PlaygroundConfig;
}

export function DayPlaygroundStudy({ slug, config }: DayPlaygroundStudyProps) {
  const { lang } = useLocale();
  const ne = lang !== "en";
  const pick = (a: string, b: string) => bilingualText(lang, a, b);
  const num = (v: number | string) => (ne ? toNepaliDigits(String(v)) : String(v));

  const initial = useMemo(() => resolvePlayground(config), [config]);

  const clock = useRef<SimClock>({
    day: 0,
    playing: false,
    daysPerSecond: initial.speed * SPEED_MULTIPLIERS[1]!,
  });
  const camera = useRef<CameraState>({ ...initial.camera });
  const clockText = useRef({ sidereal: "", solar: "", mean: "" });
  /* The label spans, by id. The scene moves these directly every frame; React
     only decides which exist and what they say. */
  const labelNodes = useRef<Map<string, HTMLElement>>(new Map());

  const [playing, setPlaying] = useState(false);
  /* Rung 2 is 1x the mode's own pace — the speed this topic was tuned for. */
  const [speed, setSpeed] = useState(1);
  const [sample, setSample] = useState<SceneSample | null>(null);
  const [flash, setFlash] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);

  const [solarDaysPerYear, setSolarDaysPerYear] = useState(initial.params.daysPerYear - 1);
  const [eccentricity, setEccentricity] = useState(initial.params.eccentricity);
  const [tiltDeg, setTiltDeg] = useState(initial.params.tilt / DEG);

  const [cameraTarget, setCameraTarget] = useState<CameraTarget>("meanSun");
  const [cameraFollow, setCameraFollow] = useState(false);
  const [toggles, setToggles] = useState<SimToggles>(initial.toggles);

  const { active: fullscreen, ref: overlayRef, toggle: toggleFullscreen } = useFullscreen();

  const onToggleFullscreen = useCallback(() => {
    if (!fullscreen) setDetailsOpen(window.innerHeight >= 820);
    toggleFullscreen();
  }, [fullscreen, toggleFullscreen]);

  useEffect(() => {
    clock.current.playing = playing;
  }, [playing]);
  useEffect(() => {
    clock.current.daysPerSecond = initial.speed * SPEED_MULTIPLIERS[speed]!;
  }, [speed, initial.speed]);

  const onSample = useCallback((s: SceneSample) => {
    setSample(s);
    if (s.sankranti !== null) setFlash(s.sankranti);
  }, []);

  useEffect(() => {
    if (flash === null) return;
    const id = setTimeout(() => setFlash(null), 2400);
    return () => clearTimeout(id);
  }, [flash]);

  const daysPerYear = solarDaysPerYear + 1;
  const tilt = tiltDeg * DEG;

  const params = useMemo(
    () => ({ daysPerYear, eccentricity, tilt }),
    [daysPerYear, eccentricity, tilt],
  );

  const day = sample?.day ?? 0;
  const rashi = sample?.rashi ?? 0;

  const meanAnomaly = meanAnomalyAt(day / daysPerYear);
  const eot = equationOfTime(meanAnomaly, eccentricity, tilt, PERIHELION - VERNAL);
  const eotMinutes = (eot * 24 * 60) / PI2;

  const readings = useMemo(() => clocks(day, daysPerYear, eot), [day, daysPerYear, eot]);
  const counts = useMemo(() => dayCounts(day, daysPerYear, eot), [day, daysPerYear, eot]);

  useEffect(() => {
    clockText.current = readings;
  }, [readings]);

  /* ── Nepali belts. The app already owns all three name lists. ─────── */
  const rashiNames = useMemo(() => getRashiList(lang), [lang]);
  const monthNames = useMemo(
    () => (ne ? BS_MONTHS_NE : ([...BS_MONTH_NAMES] as string[])),
    [ne],
  );
  const nakshatraNames = useMemo(
    () => NAKSHATRA_SHORT.map((n) => (ne ? n.ne : n.en)),
    [ne],
  );
  /* The belt is labelled with the short forms — उत्तरभाद्रपदा is wider than its
     own 13°20′ — but the icon lookup needs the full name, so it travels
     alongside on the label's index. */
  const nakshatraFullNames = useMemo(
    () => NAKSHATRA_ASTERISMS.map((a) => a.ne),
    [],
  );
  const bodyNames = useMemo(
    () => ({
      planet: pick("पृथ्वी", "Earth"),
      sun: pick("सूर्य", "Sun"),
      meanSun: pick("माध्य सूर्य", "Mean Sun"),
      moon: pick("चन्द्र", "Moon"),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang],
  );

  const setToggle = useCallback(
    (k: keyof SimToggles) => setToggles((t) => ({ ...t, [k]: !t[k] })),
    [],
  );

  const groupOn = useCallback(
    (g: GroupKey) => GROUPS[g].every((k) => toggles[k]),
    [toggles],
  );
  const pressGroup = useCallback((g: GroupKey) => {
    setToggles((t) => {
      const on = GROUPS[g].every((k) => t[k]);
      const next = { ...t };
      for (const k of GROUPS[g]) next[k] = !on;
      return next;
    });
  }, []);

  const applyPreset = useCallback((key: string) => {
    const p = PLANET_PRESETS.find((x) => x.key === key);
    if (!p) return;
    setSolarDaysPerYear(Math.max(1, Math.min(365, Math.round(p.daysPerYear - 1))));
    setEccentricity(p.eccentricity);
    setTiltDeg(p.tilt);
  }, []);

  const reset = useCallback(() => {
    clock.current.day = 0;
    setPlaying(false);
  }, []);

  const { prev, next } = useMemo(() => adjacentTopicMetas(slug), [slug]);

  /* ── gestures ─────────────────────────────────────────────────────── */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gestureStart = useRef({ yaw: 0, pitch: 0, distance: 0, pinch: 0 });
  const dragOrigin = useRef({ x: 0, y: 0 });

  const reanchor = useCallback(() => {
    gestureStart.current = { ...camera.current, pinch: 0 };
    const first = pointers.current.values().next();
    if (!first.done) dragOrigin.current = { ...first.value };
  }, []);

  const canvasWrap = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = canvasWrap.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.current.distance = Math.min(
        130,
        Math.max(4, camera.current.distance * Math.exp(e.deltaY * 0.0012)),
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [fullscreen]);

  const canvasHeight = fullscreen ? "100%" : "clamp(380px, 58vh, 620px)";

  /* ── pieces ───────────────────────────────────────────────────────── */

  const chip = (active: boolean, label: string, onPress: () => void, key?: string) => (
    <button
      key={key ?? label}
      type="button"
      onClick={onPress}
      className={cn(
        "h-[28px] cursor-pointer rounded-full border px-2.5 text-xs font-semibold transition-colors",
        active
          ? "border-transparent bg-white/85 text-black"
          : "border-white/20 bg-transparent text-white/60 hover:border-white/45 hover:text-white",
      )}
    >
      {label}
    </button>
  );

  /** The filter row: four groups, then the three belts. */
  const filterChips = (
    <div className="flex flex-wrap items-center gap-1.5">
      {chip(groupOn("year"), pick("बर्ष", "Year"), () => pressGroup("year"), "g-year")}
      {chip(groupOn("sun"), pick("सूर्य", "Sun"), () => pressGroup("sun"), "g-sun")}
      {chip(groupOn("day"), pick("दिन", "Day"), () => pressGroup("day"), "g-day")}
      {chip(groupOn("tilt"), pick("अक्ष झुकाव", "Tilt"), () => pressGroup("tilt"), "g-tilt")}
      <span className="mx-0.5 h-4 w-px bg-white/20" />
      {chip(toggles.rashiBelt, pick("राशि", "Rashi"), () => setToggle("rashiBelt"), "t-rashi")}
      {chip(
        toggles.nakshatraBelt,
        pick("नक्षत्र", "Nakshatra"),
        () => setToggle("nakshatraBelt"),
        "t-nak",
      )}
      {chip(toggles.monthRing, pick("महिना", "Months"), () => setToggle("monthRing"), "t-month")}
      {chip(groupOn("moon"), pick("चन्द्र", "Moon"), () => pressGroup("moon"), "t-moon")}
    </div>
  );

  const slider = (
    label: string,
    value: number,
    display: string,
    min: number,
    max: number,
    step: number,
    onChange: (v: number) => void,
    /* A plain block, not a flex column. `edScrub` carries `flex-1`, and a flex
       item in a column gets `min-height: auto` — the automatic minimum size,
       which pins a range input to its intrinsic 17px thumb and overrides the
       5px height outright. With no flex container there is no such minimum. */
  ) => (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/55">
        {label}
        <span className="font-num text-xs normal-case tracking-normal tabular-nums text-white/85">
          {display}
        </span>
      </span>
      <input
        type="range"
        className={cn(edScrub, "ed-scrub-dark")}
        /* Without `--fill` the track's gradient sits at its CSS default and
           never follows the thumb — the contract every scrub in the app has. */
        style={{ "--fill": `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );

  const navButton = (dir: "prev" | "next") => {
    const topic = dir === "prev" ? prev : next;
    if (!topic) return null;
    return (
      <Link
        to="/learn/$slug"
        params={{ slug: topic.slug }}
        className="flex max-w-[42vw] items-center gap-1 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur hover:border-white/50 hover:text-white"
        title={pick(topic.titleNe, topic.titleEn)}
      >
        {dir === "prev" && <ChevronLeft size={14} className="shrink-0" />}
        <span className="truncate">{pick(topic.titleNe, topic.titleEn)}</span>
        {dir === "next" && <ChevronRight size={14} className="shrink-0" />}
      </Link>
    );
  };

  const body = (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[var(--tm-border)]",
        fullscreen && "flex h-full flex-col rounded-none border-0",
      )}
      style={{ background: CANVAS_BG }}
    >
      <div
        ref={canvasWrap}
        className={cn("relative w-full touch-none", fullscreen && "min-h-0 flex-1")}
        style={fullscreen ? undefined : { height: canvasHeight }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement | null)?.closest?.("button, input, a")) return;
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          reanchor();
        }}
        onPointerMove={(e) => {
          if (!pointers.current.has(e.pointerId)) return;
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          const live = [...pointers.current.values()];
          if (live.length >= 2) {
            const [a, b] = live;
            const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
            if (!d) return;
            if (!gestureStart.current.pinch) gestureStart.current.pinch = d;
            camera.current.distance = Math.min(
              130,
              Math.max(4, gestureStart.current.distance * (gestureStart.current.pinch / d)),
            );
            return;
          }
          const dx = e.clientX - dragOrigin.current.x;
          const dy = e.clientY - dragOrigin.current.y;
          camera.current.yaw = gestureStart.current.yaw - dx * 0.006;
          camera.current.pitch = clampPitch(gestureStart.current.pitch + dy * 0.005);
        }}
        onPointerUp={(e) => {
          pointers.current.delete(e.pointerId);
          reanchor();
        }}
        onPointerCancel={(e) => {
          pointers.current.delete(e.pointerId);
          reanchor();
        }}
      >
        <Canvas
          camera={{ position: [0, 40, 26], fov: 46, near: 0.1, far: 600 }}
          gl={{ antialias: true }}
          onCreated={({ gl }) => gl.setClearColor(CANVAS_BG)}
        >
          <Suspense fallback={null}>
            <Scene
              clock={clock}
              camera={camera}
              params={params}
              toggles={toggles}
              cameraTarget={cameraTarget}
              cameraFollow={cameraFollow}
              rashiNames={rashiNames}
              monthNames={monthNames}
              nakshatraNames={nakshatraNames}
              nakshatraFullNames={nakshatraFullNames}
              bodyNames={bodyNames}
              clockText={clockText}
              labelNodes={labelNodes}
              onSample={onSample}
            />
          </Suspense>
        </Canvas>

        <div className="pointer-events-none absolute inset-0">
          {sample?.labels.map((l) => (
            <Label key={l.id} label={l} nodes={labelNodes} />
          ))}
        </div>

        <div className="pointer-events-none absolute left-2 top-2 rounded-lg border border-white/15 bg-black/45 px-2.5 py-1.5 backdrop-blur sm:left-3 sm:top-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50">
            {pick("सूर्य राशि · महिना", "Sun's rashi · month")}
          </div>
          <div className="text-sm font-bold text-white">
            {rashiNames[rashi]} · {monthNames[rashi]}
          </div>
          <div className="mt-1 font-num text-sm font-bold tabular-nums" style={{ color: TONE.solar }}>
            {eotMinutes >= 0 ? "+" : "−"}
            {num(Math.abs(eotMinutes).toFixed(1))}
            <span className="ml-1 text-[10px] font-semibold text-white/50">
              {pick("मिनेट", "min")}
            </span>
          </div>
        </div>

        {flash !== null && (
          <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-amber-400/60 bg-amber-500/20 px-4 py-1.5 text-sm font-bold text-amber-100 backdrop-blur">
            {pick("सङ्क्रान्ति", "Sankranti")} · {rashiNames[flash]} · {monthNames[flash]} {num(1)}
          </div>
        )}

        <div className="absolute right-3 top-3 flex gap-2">
          <IconButton
            onClick={() => setControlsOpen((v) => !v)}
            label={pick("नियन्त्रण", "Controls")}
            active={controlsOpen}
          >
            <SlidersHorizontal size={16} />
          </IconButton>
          <IconButton onClick={reset} label={pick("सुरुमा फर्कनुहोस्", "Back to start")}>
            <RotateCcw size={16} />
          </IconButton>
          <IconButton
            onClick={onToggleFullscreen}
            label={fullscreen ? pick("सामान्य दृश्य", "Exit fullscreen") : pick("पूर्ण स्क्रिन", "Fullscreen")}
          >
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </IconButton>
        </div>

        {/* Capped against the canvas, not the viewport: the drawer floats over
            the scene, so a 70vh panel on a short canvas would hang off the
            bottom of the thing it belongs to. */}
        {controlsOpen && (
          <div className="absolute right-3 top-14 z-10 flex max-h-[calc(100%-4.5rem)] w-[min(290px,calc(100%-1.5rem))] flex-col gap-4 overflow-y-auto overscroll-contain rounded-xl border border-white/15 bg-black/85 p-3.5 backdrop-blur">
            {slider(
              pick("वर्षमा सौर दिन", "Solar days per year"),
              solarDaysPerYear,
              num(solarDaysPerYear),
              1,
              365,
              1,
              setSolarDaysPerYear,
            )}
            {slider(
              pick("उत्केन्द्रता", "Eccentricity"),
              eccentricity,
              num(eccentricity.toFixed(3)),
              0,
              0.4,
              0.001,
              setEccentricity,
            )}
            {slider(
              pick("अक्ष झुकाव", "Axial tilt"),
              tiltDeg,
              `${num(tiltDeg.toFixed(1))}°`,
              0,
              90,
              0.1,
              setTiltDeg,
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/55">
                {pick("क्यामेरा", "Camera")}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {chip(cameraTarget === "meanSun", pick("केन्द्र", "Centre"), () => setCameraTarget("meanSun"))}
                {chip(cameraTarget === "planet", pick("पृथ्वी", "Earth"), () => setCameraTarget("planet"))}
                {chip(cameraTarget === "sun", pick("सूर्य", "Sun"), () => setCameraTarget("sun"))}
                {chip(cameraFollow, pick("कक्ष पछ्याउनुहोस्", "Follow orbit"), () =>
                  setCameraFollow((v) => !v),
                )}
              </div>
            </div>

            {/* Every layer on its own — the group chips are a shortcut, not a
                replacement, so nothing in the scene is unreachable. */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/55">
                {pick("सबै तह", "All layers")}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {chip(toggles.siderealArc, pick("नाक्षत्र चाप", "Sidereal arc"), () => setToggle("siderealArc"))}
                {chip(toggles.solarArc, pick("सौर चाप", "Solar arc"), () => setToggle("solarArc"))}
                {chip(toggles.meanArc, pick("माध्य चाप", "Mean arc"), () => setToggle("meanArc"))}
                {chip(toggles.eotWedge, pick("समय फरक", "EOT wedge"), () => setToggle("eotWedge"))}
                {chip(toggles.trueSun, pick("साँचो सूर्य", "True Sun"), () => setToggle("trueSun"))}
                {chip(toggles.meanSun, pick("माध्य सूर्य", "Mean Sun"), () => setToggle("meanSun"))}
                {chip(toggles.sightline, pick("दृष्टिरेखा", "Sightline"), () => setToggle("sightline"))}
                {chip(toggles.moon, pick("चन्द्र", "Moon"), () => setToggle("moon"))}
                {chip(toggles.moonTrail, pick("चन्द्रपथ", "Moon trail"), () => setToggle("moonTrail"))}
                {chip(toggles.moonLap, pick("मास फरक", "Month gap"), () => setToggle("moonLap"))}
                {chip(
                  toggles.moonSightline,
                  pick("चन्द्र दृष्टिरेखा", "Moon sightline"),
                  () => setToggle("moonSightline"),
                )}
                {chip(toggles.planetOrbit, pick("कक्ष", "Orbit"), () => setToggle("planetOrbit"))}
                {chip(toggles.sunOrbit, pick("सूर्यपथ", "Sun path"), () => setToggle("sunOrbit"))}
                {chip(toggles.grid, pick("ग्रिड", "Grid"), () => setToggle("grid"))}
                {chip(toggles.primeMeridian, pick("काठमाडौँ रेखा", "Kathmandu meridian"), () => setToggle("primeMeridian"))}
              </div>
            </div>
          </div>
        )}

        <p className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] text-white/45">
          {fullscreen
            ? ""
            : pick("तान्नुहोस् — घुमाउन · स्क्रोल — नजिक/टाढा", "Drag to orbit · scroll to zoom")}
        </p>
      </div>

      <div
        className={cn(
          "flex flex-col gap-3 border-t border-white/10 bg-black/30 px-3.5 py-3 text-white",
          fullscreen &&
            "shrink-0 overflow-y-auto overscroll-contain pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          fullscreen && (detailsOpen ? "max-h-[46vh]" : "max-h-none"),
        )}
      >
        {/* Prev / next topic. In the panel, not floating over the canvas: down
            there they landed on top of the filter chips on a phone. */}
        {fullscreen && (prev || next) && (
          <div className="flex items-center justify-between gap-2">
            {navButton("prev") ?? <span />}
            {navButton("next") ?? <span />}
          </div>
        )}

        {filterChips}

        <div className="flex w-full items-center gap-2.5 sm:gap-3">
          {/* Not `edPlayBtn`: that one colours its icon `--tm-ink`, which is
              near-black in the light theme and so disappears on this panel. */}
          <button
            type="button"
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:border-white/60 hover:bg-white/20"
            onClick={() => setPlaying((v) => !v)}
            aria-label={playing ? pick("रोक्नुहोस्", "Pause") : pick("चलाउनुहोस्", "Play")}
          >
            {playing ? (
              <Pause size={18} fill="currentColor" strokeWidth={0} />
            ) : (
              <Play size={18} fill="currentColor" strokeWidth={0} className="ml-[2px]" />
            )}
          </button>
          <input
            type="range"
            className={cn(edScrub, "ed-scrub-dark")}
            style={{ "--fill": `${(day / daysPerYear) * 100}%` } as React.CSSProperties}
            min={0}
            max={daysPerYear}
            step={0.001}
            value={day}
            onChange={(e) => {
              clock.current.day = Number(e.target.value);
              setPlaying(false);
            }}
            aria-label={pick("वर्षभरि सार्नुहोस्", "Scrub through the year")}
          />
          <div className="flex shrink-0 gap-1">
            {SPEED_MULTIPLIERS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSpeed(i)}
                className={cn(
                  "h-7 w-7 cursor-pointer rounded-full border text-[11px] font-bold",
                  speed === i
                    ? "border-transparent bg-white/85 text-black"
                    : "border-white/20 text-white/55 hover:border-white/45 hover:text-white",
                )}
                aria-label={`${pick("गति", "Speed")} ${num(i + 1)}`}
              >
                {num(i + 1)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full border border-white/20 text-white/70 hover:border-white/45 hover:text-white"
            aria-label={detailsOpen ? pick("लुकाउनुहोस्", "Hide readings") : pick("देखाउनुहोस्", "Show readings")}
          >
            {detailsOpen ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
        </div>

        {detailsOpen && (
          <>
            <div className="grid grid-cols-3 gap-x-4 gap-y-2.5">
              {(
                [
                  ["sidereal", pick("नाक्षत्र दिन", "Sidereal day"), readings.sidereal, counts.sidereal],
                  ["solar", pick("साँचो सौर दिन", "True solar day"), readings.solar, counts.solar],
                  ["mean", pick("माध्य सौर दिन", "Mean solar day"), readings.mean, counts.mean],
                ] as const
              ).map(([tone, label, time, count]) => (
                <div key={tone} className={edRo}>
                  <span className={edRoK} style={{ color: TONE[tone] }}>
                    {label}
                  </span>
                  <span className={cn(edRoV({ mono: true }), "!text-white")}>{num(time)}</span>
                  <span className="font-num text-xs tabular-nums text-white/45">
                    {pick("दिन", "day")} {num(count)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/55">
                {pick("अर्को ग्रहको कक्ष र झुकाव लगाउनुहोस्", "Borrow another world's orbit and tilt")}
              </span>
              <p className="text-[11px] leading-snug text-white/40">
                {pick(
                  "उत्केन्द्रता र अक्ष झुकाव मात्र सर्छ — वर्षका दिन उस्तै रहन्छ, किनभने कुनै पनि ग्रहको साँचो सङ्ख्या यो स्लाइडरमा अट्दैन।",
                  "Only the eccentricity and tilt transfer — days per year is left alone, because no planet's real figure fits on that slider.",
                )}
              </p>
            <div className={edPresets}>
              {PLANET_PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className={cn(edPreset(false), "!text-white/60 hover:!text-white")}
                  onClick={() => applyPreset(p.key)}
                  title={pick(
                    `${PLANET_NAMES[p.key]![0]} · उत्केन्द्रता ${num(p.eccentricity.toFixed(4))} · झुकाव ${num(p.tilt.toFixed(2))}° · वास्तविक वर्षमा ${num(Math.round(p.daysPerYear - 1))} सौर दिन`,
                    `${PLANET_NAMES[p.key]![1]} · eccentricity ${p.eccentricity.toFixed(4)} · tilt ${p.tilt.toFixed(2)}° · a real year there holds ${Math.round(p.daysPerYear - 1)} solar days`,
                  )}
                >
                  {PLANET_NAMES[p.key]![ne ? 0 : 1]}
                </button>
              ))}
              <button
                type="button"
                className={cn(edPreset(false), "!text-white/60 hover:!text-white")}
                onClick={() => {
                  setToggles(initial.toggles);
                  setSolarDaysPerYear(initial.params.daysPerYear - 1);
                  setEccentricity(initial.params.eccentricity);
                  setTiltDeg(initial.params.tilt / DEG);
                }}
              >
                {pick("यो विषयमा फर्कनुहोस्", "Back to this topic")}
              </button>
            </div>
            </div>

            <button
              type="button"
              onClick={() => setGraphOpen((v) => !v)}
              className="self-start text-xs font-semibold text-white/55 underline-offset-2 hover:text-white hover:underline"
            >
              {graphOpen
                ? pick("ग्राफ लुकाउनुहोस्", "Hide the graph")
                : pick("समयको समीकरण ग्राफ", "Equation-of-time graph")}
            </button>

            {graphOpen && (
              <div className="text-white">
                <EotGraph
                  eccentricity={eccentricity}
                  tilt={tilt}
                  dayOfYear={day}
                  daysPerYear={daysPerYear}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  if (!fullscreen) return <div className="mt-5">{body}</div>;

  /*
   * Portalled to <body>, not rendered where it sits.
   *
   * The article body is `relative z-[1]`, which opens a stacking context — and
   * a fixed layer inside one can never rise above a sibling of that context, so
   * the z-50 sticky header and the z-50 mobile bottom nav stayed on top of the
   * "fullscreen" view. Any transformed or filtered ancestor also becomes the
   * containing block for `position: fixed`, so `inset-0` covered that
   * ancestor's box rather than the viewport. A portal to <body> escapes both,
   * and z-[100] clears the app chrome. Same fix as {@link ./TwoSystemsStudy}.
   */
  return (
    <div className="mt-5">
      <div className="rounded-2xl border border-dashed border-[var(--tm-border)] px-4 py-8 text-center text-sm text-[var(--tm-ink-faint)]">
        {pick(
          "पूर्ण स्क्रिनमा खुलेको छ — बन्द गर्न Esc थिच्नुहोस्",
          "Open in fullscreen — press Esc to close",
        )}
      </div>
      {createPortal(
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[100] overscroll-contain"
          style={{ background: CANVAS_BG }}
        >
          {body}
        </div>,
        document.body,
      )}
    </div>
  );
}

/** Earth plus the five graha the eye can see. No Uranus, no Neptune. */
const PLANET_NAMES: Record<string, [string, string]> = {
  earth: ["पृथ्वी", "Earth"],
  mars: ["मङ्गल", "Mars"],
  mercury: ["बुध", "Mercury"],
  jupiter: ["बृहस्पति", "Jupiter"],
  venus: ["शुक्र", "Venus"],
  saturn: ["शनि", "Saturn"],
};

function IconButton({
  onClick,
  label,
  active,
  children,
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "grid h-9 w-9 cursor-pointer place-items-center rounded-full border backdrop-blur transition-colors",
        active
          ? "border-white/60 bg-white/85 text-black"
          : "border-white/20 bg-black/40 text-white/80 hover:border-white/50 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

const Label = memo(function Label({
  label,
  nodes,
}: {
  label: SceneLabel;
  nodes: React.MutableRefObject<Map<string, HTMLElement>>;
}) {
  const isRashi = label.kind === "rashi";
  const isNak = label.kind === "nakshatra";
  const color =
    label.tone
      ? TONE[label.tone]
      : isRashi
        ? GOLD
        : label.kind === "nakshatra"
          ? "#8fb6d8"
          : label.kind === "month"
            ? "#e3d9a8"
            : "#ffffff";
  return (
    <span
      ref={(el) => {
        if (el) nodes.current.set(label.id, el);
        else nodes.current.delete(label.id);
      }}
      className={cn(
        /* No `transition`: the scene rewrites the transform every frame, and
           easing between frames would smear the text behind the bodies. */
        "absolute left-0 top-0 whitespace-nowrap font-semibold will-change-transform",
        isRashi ? "flex flex-col items-center gap-0.5 text-[11px]" : "",
        label.kind === "clock" ? "font-num text-[11px] tabular-nums" : "",
        isNak ? "flex flex-col items-center gap-0.5 text-[14px] leading-none" : "",
        label.kind === "month" || label.kind === "body" ? "text-[11px]" : "",
      )}
      style={{
        /* Seeded from the sample so a new label lands in the right place on
           its first paint; the frame loop owns it from then on. */
        transform: `translate3d(${label.x}px, ${label.y}px, 0) translate(-50%, -50%)`,
        color,
        opacity: label.dim ? 0.4 : 1,
        textShadow: "0 1px 3px rgba(0,0,0,0.95)",
      }}
    >
      {isRashi && label.index ? <RashiSkyGlyph index={label.index} size={13} color={GOLD} /> : null}
      {isNak && label.full ? (
        /* `text-current` on purpose: the shared `nakshatraIcon` class sets
           `text-foreground`, which is near-black in the light theme and so
           vanishes against this canvas. tailwind-merge lets the className win,
           so the glyph inherits the label's own belt colour instead. */
        <NakshatraIcon name={label.full} size={18} strokeWidth={2.4} className="text-current" />
      ) : null}
      {label.text}
    </span>
  );
});

export default DayPlaygroundStudy;
