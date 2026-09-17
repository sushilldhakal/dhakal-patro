import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import type { Shloka } from "@/lib/documents-api";

export interface ShlokaPlayerState {
  /** The player's `<audio>` elements, pre-wired — render once, anywhere in the page. */
  audioElement: ReactElement;
  activeId: number | null;
  playing: boolean;
  /** 0..1 progress of the active verse's audio, for a slim progress bar. */
  progress: number;
  /** Active verse's elapsed time, seconds. */
  currentTime: number;
  /** Active verse's total duration, seconds (0 until the browser knows it). */
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

type Slot = "a" | "b";

/**
 * Drives playback across a whole document's verses using two `<audio>`
 * elements in a ping-pong pair, so moving from one verse to the next doesn't
 * wait on a fresh network fetch.
 *
 * Whichever element is "front" is the one actually playing; as soon as it
 * becomes front, the *next* verse's clip is loaded into the "back" element in
 * the background. When the front clip ends (or `next()`/auto-advance fires),
 * playback swaps straight onto the already-buffered back element instead of
 * setting a new `src` and waiting — that swap is what removes the gap between
 * consecutive verses. A non-sequential jump (clicking an arbitrary verse that
 * wasn't being preloaded) still pays a normal load, same as before.
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
  const audioRefA = useRef<HTMLAudioElement>(null);
  const audioRefB = useRef<HTMLAudioElement>(null);
  const [frontSlot, setFrontSlot] = useState<Slot>("a");
  const itemRefs = useRef(new Map<number, HTMLElement>());
  const [activeId, setActiveId] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [openMeaningIds, setOpenMeaningIds] = useState<ReadonlySet<number>>(() => new Set());

  const frontRef = frontSlot === "a" ? audioRefA : audioRefB;
  const backRef = frontSlot === "a" ? audioRefB : audioRefA;

  const order = useMemo(() => shlokas.map((s) => s.id), [shlokas]);
  const byId = useMemo(() => new Map(shlokas.map((s) => [s.id, s])), [shlokas]);
  const indexOf = useCallback((id: number | null) => (id == null ? -1 : order.indexOf(id)), [order]);

  const registerItemRef = useCallback((id: number, el: HTMLElement | null) => {
    if (el) itemRefs.current.set(id, el);
    else itemRefs.current.delete(id);
  }, []);

  const play = useCallback(
    (id: number) => {
      const shloka = byId.get(id);
      if (!shloka) return;

      if (!shloka.audio_url) {
        // Nothing to play for this verse — select/scroll it so the meaning
        // accordion below can still be opened, per useShlokaPlayer's contract.
        setActiveId(id);
        setPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        setDuration(0);
        return;
      }

      const front = frontRef.current;
      if (id === activeId && front) {
        if (front.ended) front.currentTime = 0;
        void front.play().then(
          () => setPlaying(true),
          () => setPlaying(false),
        );
        return;
      }

      // Already buffered as the "next" track in the back element? Swap onto
      // it instead of loading — this is the gapless path.
      const back = backRef.current;
      if (back && back.src === shloka.audio_url) {
        setFrontSlot((s) => (s === "a" ? "b" : "a"));
        setActiveId(id);
        setProgress(0);
        setCurrentTime(back.currentTime || 0);
        setDuration(back.duration || 0);
        void back.play().then(
          () => setPlaying(true),
          () => setPlaying(false),
        );
        return;
      }

      // Non-sequential jump — nothing preloaded for this one, load it fresh.
      if (front) {
        front.src = shloka.audio_url;
        front.load();
        setActiveId(id);
        setProgress(0);
        setCurrentTime(0);
        setDuration(0);
        void front.play().then(
          () => setPlaying(true),
          () => setPlaying(false),
        );
      }
    },
    [byId, activeId, frontRef, backRef],
  );

  const pause = useCallback(() => {
    frontRef.current?.pause();
  }, [frontRef]);

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
      const audio = frontRef.current;
      if (!audio) return;
      audio.currentTime = time;
      setCurrentTime(time);
      if (audio.duration) setProgress(time / audio.duration);
    },
    [frontRef],
  );

  const toggleMeaning = useCallback((id: number) => {
    setOpenMeaningIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Front playback + progress — rebinds whenever the front element itself
  // changes (a gapless swap or a fresh load both flip which element is front).
  useEffect(() => {
    const audio = frontRef.current;
    if (!audio) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      if (activeId != null && openMeaningIds.has(activeId)) return;
      const nextIndex = indexOf(activeId) + 1;
      if (nextIndex < order.length) play(order[nextIndex]!);
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [frontRef, activeId, openMeaningIds, indexOf, order, play]);

  // Preload the verse after the active one into whichever element is
  // currently "back", so it's ready the instant playback reaches it.
  useEffect(() => {
    const back = backRef.current;
    if (!back) return;
    const nextIndex = indexOf(activeId) + 1;
    const upcoming = nextIndex >= 0 && nextIndex < order.length ? byId.get(order[nextIndex]!) : undefined;
    if (upcoming?.audio_url) {
      if (back.src !== upcoming.audio_url) {
        back.src = upcoming.audio_url;
        back.load();
      }
    } else if (back.src) {
      back.removeAttribute("src");
      back.load();
    }
  }, [activeId, backRef, indexOf, order, byId]);

  useEffect(() => {
    if (activeId == null) return;
    itemRefs.current.get(activeId)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeId]);

  const activeIndex = indexOf(activeId);

  return {
    audioElement: (
      <>
        <audio ref={audioRefA} preload="auto" />
        <audio ref={audioRefB} preload="auto" />
      </>
    ),
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
