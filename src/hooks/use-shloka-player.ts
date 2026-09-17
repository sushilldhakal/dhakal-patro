import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Shloka } from "@/lib/documents-api";
import { ShlokaAudioEngine } from "@/lib/shloka-audio-engine";

export interface ShlokaPlayerState {
  activeId: number | null;
  playing: boolean;
  /** 0..1 progress of the active verse's audio, for a slim progress bar. */
  progress: number;
  /** Active verse's elapsed time, seconds. */
  currentTime: number;
  /** Active verse's total duration, seconds (0 until decoding completes). */
  duration: number;
  /** Verses whose meaning accordion is currently expanded. Several may be open at once. */
  openMeaningIds: ReadonlySet<number>;
  registerItemRef: (id: number, el: HTMLElement | null) => void;
  play: (id: number) => void;
  pause: () => void;
  toggle: (id: number) => void;
  next: () => void;
  prev: () => void;
  /** Seek the active verse's audio to a given time, in seconds. */
  seek: (time: number) => void;
  toggleMeaning: (id: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Drives sample-accurate gapless playback across a whole document's verses
 * via {@link ShlokaAudioEngine} (Web Audio scheduling — see that file for why
 * `<audio>` elements can't do this).
 *
 * Clicking a verse's play button starts its audio, highlights it, and scrolls
 * it to the middle of the screen; when that clip ends playback moves to the
 * next verse automatically — unless the listener has that same verse's
 * meaning accordion open, in which case it just stops (they're reading, not
 * listening straight through). Opening a meaning panel never requires or
 * starts audio — {@link toggleMeaning} is independent of play state, and
 * several verses' meanings may be open at once.
 */
export function useShlokaPlayer(shlokas: Shloka[]): ShlokaPlayerState {
  const itemRefs = useRef(new Map<number, HTMLElement>());
  const [activeId, setActiveId] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [openMeaningIds, setOpenMeaningIds] = useState<ReadonlySet<number>>(() => new Set());

  const order = useMemo(() => shlokas.map((s) => s.id), [shlokas]);
  const indexOf = useCallback((id: number | null) => (id == null ? -1 : order.indexOf(id)), [order]);

  // Constructed exactly once (useState's lazy initializer form), not per
  // render — the engine owns imperative Web Audio state that has no business
  // being recreated on a re-render. Its callbacks are placeholders here and
  // get their real (always-current) closures wired up by the effect below —
  // `play()`/`pause()` etc. are only ever called from post-mount user
  // interactions, never synchronously during this initializer.
  const [engine] = useState(() => new ShlokaAudioEngine({
    onActiveChange: () => {},
    onPlayingChange: () => {},
    onTime: () => {},
    shouldHoldAtEnd: () => false,
  }));

  useEffect(() => {
    engine.setCallbacks({
      onActiveChange: setActiveId,
      onPlayingChange: setPlaying,
      onTime: (t, d) => {
        setCurrentTime(t);
        setDuration(d);
        setProgress(d > 0 ? t / d : 0);
      },
      shouldHoldAtEnd: (id) => openMeaningIds.has(id),
      onError: (id, err) => {
        console.error(`Shloka audio failed to load (verse ${id})`, err);
      },
    });
  }, [engine, openMeaningIds]);

  useEffect(() => {
    engine.setTracks(shlokas.map((s) => ({ id: s.id, audioUrl: s.audio_url ?? null })));
  }, [engine, shlokas]);

  useEffect(() => {
    return () => engine.dispose();
  }, [engine]);

  const registerItemRef = useCallback((id: number, el: HTMLElement | null) => {
    if (el) itemRefs.current.set(id, el);
    else itemRefs.current.delete(id);
  }, []);

  const play = useCallback(
    (id: number) => {
      engine.play(id);
    },
    [engine],
  );

  const pause = useCallback(() => {
    engine.pause();
  }, [engine]);

  const toggle = useCallback(
    (id: number) => {
      if (id === activeId && playing) pause();
      else play(id);
    },
    [activeId, playing, play, pause],
  );

  const advance = useCallback(
    (delta: 1 | -1) => {
      const i = indexOf(activeId);
      const nextIndex = i + delta;
      if (nextIndex < 0 || nextIndex >= order.length) return;
      play(order[nextIndex]!);
    },
    [activeId, indexOf, order, play],
  );

  const next = useCallback(() => advance(1), [advance]);
  const prev = useCallback(() => advance(-1), [advance]);

  const seek = useCallback(
    (time: number) => {
      engine.seek(time);
    },
    [engine],
  );

  const toggleMeaning = useCallback((id: number) => {
    setOpenMeaningIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    if (activeId == null) return;
    itemRefs.current.get(activeId)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeId]);

  const activeIndex = indexOf(activeId);

  return {
    activeId,
    playing,
    progress,
    currentTime,
    duration,
    openMeaningIds,
    registerItemRef,
    play,
    pause,
    toggle,
    next,
    prev,
    seek,
    toggleMeaning,
    hasNext: activeIndex >= 0 && activeIndex < order.length - 1,
    hasPrev: activeIndex > 0,
  };
}
