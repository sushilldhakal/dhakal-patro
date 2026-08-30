/**
 * Clock + sampler for the Earth / day chapter tour.
 *
 * When a voiceover is present at the chapter's `audio` path it owns the time.
 * Until then the same keyframes run off requestAnimationFrame, so the
 * animation is already the one the recording will lock to.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { compileChapter, parseTime } from "@/lib/learn/chapter-player";
import {
  DAY_CHAPTERS,
  type ChapterId,
  type ChapterSimState,
  type DayChapter,
} from "@/lib/learn/day-chapters";

export type DayChapterPlayer = {
  chapters: DayChapter[];
  chapter: DayChapter;
  index: number;
  time: number;
  duration: number;
  playing: boolean;
  ended: boolean;
  showWelcome: boolean;
  hasAudio: boolean;
  state: ChapterSimState;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (ms: number) => void;
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
  dismissWelcome: () => void;
  setOnFrame: (fn: (s: ChapterSimState) => void) => void;
};

export function useDayChapters(enabled: boolean): DayChapterPlayer | null {
  const [index, setIndex] = useState(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [hasAudio, setHasAudio] = useState(false);

  const timeRef = useRef(0);
  const playingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastUi = useRef(0);
  const onFrameRef = useRef<(s: ChapterSimState) => void>(() => {});

  useEffect(() => {
    const el = new Audio();
    el.preload = "auto";
    audioRef.current = el;
    return () => {
      el.pause();
      el.removeAttribute("src");
      audioRef.current = null;
    };
  }, []);

  const chapter = DAY_CHAPTERS[index] ?? DAY_CHAPTERS[0]!;
  const compiled = useMemo(
    () => compileChapter(chapter.defaults, chapter.frames),
    [chapter],
  );

  const [state, setState] = useState<ChapterSimState>(() => compiled.stateAt(0));
  const stateRef = useRef(state);
  stateRef.current = state;

  const apply = useCallback(
    (ms: number, forceUi = false) => {
      const clamped = Math.max(0, Math.min(compiled.duration, ms));
      timeRef.current = clamped;
      const next = compiled.stateAt(clamped);
      onFrameRef.current(next);
      const now = performance.now();
      const stepped =
        next.handsOff !== stateRef.current.handsOff ||
        next.trueSun !== stateRef.current.trueSun ||
        next.meanSun !== stateRef.current.meanSun ||
        next.planetOrbit !== stateRef.current.planetOrbit ||
        next.sunOrbit !== stateRef.current.sunOrbit ||
        next.siderealArc !== stateRef.current.siderealArc ||
        next.solarArc !== stateRef.current.solarArc ||
        next.meanArc !== stateRef.current.meanArc ||
        next.eotWedge !== stateRef.current.eotWedge ||
        next.primeMeridian !== stateRef.current.primeMeridian ||
        next.grid !== stateRef.current.grid ||
        next.axis !== stateRef.current.axis ||
        next.monthRing !== stateRef.current.monthRing ||
        next.rashiBelt !== stateRef.current.rashiBelt ||
        next.nakshatraBelt !== stateRef.current.nakshatraBelt ||
        next.moon !== stateRef.current.moon ||
        next.graphOpen !== stateRef.current.graphOpen ||
        next.cameraTarget !== stateRef.current.cameraTarget ||
        next.cameraFollow !== stateRef.current.cameraFollow ||
        next.planet !== stateRef.current.planet ||
        next.highlight !== stateRef.current.highlight ||
        next.degrees !== stateRef.current.degrees;
      if (forceUi || stepped || now - lastUi.current > 80) {
        lastUi.current = now;
        setTime(clamped);
        setState(next);
      }
    },
    [compiled],
  );

  useEffect(() => {
    timeRef.current = 0;
    setTime(0);
    setEnded(false);
    playingRef.current = false;
    setPlaying(false);
    apply(0, true);
  }, [index, apply]);

  useEffect(() => {
    if (!enabled) return;
    const src = chapter.audio;
    setHasAudio(false);
    if (!src || !audioRef.current) return;
    const el = audioRef.current;
    let cancelled = false;
    const onReady = () => setHasAudio(true);
    const onError = () => setHasAudio(false);
    const onTime = () => {
      if (!playingRef.current) return;
      apply(el.currentTime * 1000);
      if (el.ended) {
        playingRef.current = false;
        setPlaying(false);
        setEnded(true);
        apply(compiled.duration, true);
      }
    };
    el.addEventListener("canplaythrough", onReady);
    el.addEventListener("error", onError);
    el.addEventListener("timeupdate", onTime);
    /* Probe first so a missing voiceover is silence, not a red 404 in the console. */
    void fetch(src, { method: "HEAD" })
      .then((res) => {
        if (cancelled || !res.ok) return;
        el.src = src;
        el.load();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      el.removeEventListener("canplaythrough", onReady);
      el.removeEventListener("error", onError);
      el.removeEventListener("timeupdate", onTime);
      el.pause();
      el.removeAttribute("src");
    };
  }, [enabled, chapter.audio, apply, compiled.duration]);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      /* Always sample — even when paused — so a drag/zoom can ease back. */
      if (chapter.free || !playingRef.current || hasAudio) {
        last = now;
        apply(timeRef.current);
        return;
      }
      const dt = last ? now - last : 0;
      last = now;
      const next = timeRef.current + dt;
      if (next >= compiled.duration) {
        playingRef.current = false;
        setPlaying(false);
        setEnded(true);
        apply(compiled.duration, true);
        return;
      }
      apply(next);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, hasAudio, compiled.duration, apply, chapter.free]);

  const play = useCallback(() => {
    if (chapter.free) return;
    setShowWelcome(false);
    setEnded(false);
    playingRef.current = true;
    setPlaying(true);
    if (hasAudio && audioRef.current) {
      audioRef.current.currentTime = timeRef.current / 1000;
      void audioRef.current.play().catch(() => {
        setHasAudio(false);
      });
    }
  }, [hasAudio, chapter.free]);

  const pause = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    audioRef.current?.pause();
  }, []);

  const seek = useCallback(
    (ms: number) => {
      const clamped = Math.max(0, Math.min(compiled.duration, ms));
      if (audioRef.current && hasAudio) audioRef.current.currentTime = clamped / 1000;
      apply(clamped, true);
      if (clamped < compiled.duration) setEnded(false);
    },
    [apply, compiled.duration, hasAudio],
  );

  const goTo = useCallback((i: number) => {
    const next = Math.max(0, Math.min(DAY_CHAPTERS.length - 1, i));
    audioRef.current?.pause();
    playingRef.current = false;
    setPlaying(false);
    setShowWelcome(next === 0);
    setIndex(next);
  }, []);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);
  const setOnFrame = useCallback((fn: (s: ChapterSimState) => void) => {
    onFrameRef.current = fn;
  }, []);

  if (!enabled) return null;

  return {
    chapters: DAY_CHAPTERS,
    chapter,
    index,
    time,
    duration: compiled.duration,
    playing,
    ended,
    showWelcome,
    hasAudio,
    state,
    play,
    pause,
    toggle: () => (playingRef.current ? pause() : play()),
    seek,
    goTo,
    next,
    prev,
    dismissWelcome: () => setShowWelcome(false),
    setOnFrame,
  };
}

export function chapterDurationMs(chapter: DayChapter): number {
  let max = 0;
  for (const frame of chapter.frames) {
    const at = parseTime(frame.meta.at);
    if (at > max) max = at;
  }
  return max;
}

export type { ChapterId };
