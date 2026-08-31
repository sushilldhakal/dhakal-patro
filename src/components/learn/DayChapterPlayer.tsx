/**
 * Welcome overlay + chapter transport — the same chrome as the original lab.
 *
 * One scrubber. One play button. Chapter title in the middle, times on the
 * sides, skip either side of play. The playground's own year slider stays
 * off this page while the tour is running.
 */

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronUp, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";

import { formatChapterClock } from "@/lib/learn/chapter-player";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import { edScrub } from "@/lib/diagram-classes";
import type { DayChapterPlayer } from "@/hooks/use-day-chapters";

export function DayChapterWelcome({
  player,
}: {
  player: DayChapterPlayer;
}) {
  const { t } = useTranslation();
  if (!player.showWelcome) return null;
  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-black/55 px-4 backdrop-blur-[2px] transition-opacity">
      <div className="flex max-w-md flex-col items-center text-center text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          {t("learn.chapters.eyebrow")}
        </p>
        <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("learn.chapters.welcome_title")}
        </h2>
        <p className="mt-2 text-sm text-white/70 sm:text-base">
          {t("learn.chapters.welcome_subtitle")}
        </p>
        <button
          type="button"
          onClick={player.play}
          className="mt-6 grid size-16 cursor-pointer place-items-center rounded-full border border-white/30 bg-white text-black transition-transform hover:scale-105"
          aria-label={t("learn.chapters.begin")}
        >
          <Play size={28} fill="currentColor" strokeWidth={0} className="ml-1" />
        </button>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
          {t("learn.chapters.begin")}
        </p>
      </div>
    </div>
  );
}

export function DayChapterBar({
  player,
  orbitPlaying,
  onOrbitToggle,
}: {
  player: DayChapterPlayer;
  /** Playground: the year orbit, not a chapter clock. */
  orbitPlaying?: boolean;
  onOrbitToggle?: () => void;
}) {
  const { t } = useTranslation();
  const { lang } = useLocale();
  const ne = lang !== "en";
  const num = (v: string) => (ne ? toNepaliDigits(v) : v);
  const [tocOpen, setTocOpen] = useState(false);
  const tocRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!tocOpen) return;
    const onDoc = (e: PointerEvent) => {
      if (!tocRef.current?.contains(e.target as Node)) setTocOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [tocOpen]);

  const free = Boolean(player.chapter.free);
  const progress = player.duration > 0 ? (player.time / player.duration) * 100 : 0;
  const isLast = player.index >= player.chapters.length - 1;
  const isFirst = player.index <= 0;
  const playing = free ? Boolean(orbitPlaying) : player.playing;
  const ended = free ? false : player.ended;

  return (
    <div className="flex flex-col">
      {free ? null : (
        <div className="relative">
          <input
            type="range"
            className={cn(edScrub, "ed-scrub-dark")}
            style={{ "--fill": `${progress}%` } as React.CSSProperties}
            min={0}
            max={player.duration || 1}
            step={50}
            value={player.time}
            onChange={(e) => player.seek(Number(e.target.value))}
            aria-label={t("learn.chapters.scrub")}
          />
          <div className="mt-1 flex items-start justify-between font-num text-[11px] tabular-nums text-white/45">
            <span>{num(formatChapterClock(player.time))}</span>
            <span>{num(formatChapterClock(player.duration))}</span>
          </div>
        </div>
      )}

      <div className="relative mt-1 flex justify-center" ref={tocRef}>
        <button
          type="button"
          onClick={() => setTocOpen((v) => !v)}
          className="flex max-w-full items-center gap-1.5 px-2 py-1 text-sm font-semibold text-white/90 hover:text-white"
        >
          <span className="truncate">
            {t("learn.chapters.chapter")} {num(String(player.index + 1))}
            {": "}
            {t(player.chapter.titleKey)}
          </span>
          <ChevronUp size={14} className={cn("shrink-0 text-white/50 transition-transform", tocOpen ? "" : "rotate-180")} />
        </button>
        {tocOpen && (
          <div className="absolute bottom-[calc(100%+4px)] left-1/2 z-20 w-[min(280px,90vw)] -translate-x-1/2 overflow-hidden rounded-xl border border-white/15 bg-black/90 py-1 backdrop-blur">
            {player.chapters.map((ch, i) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  player.goTo(i);
                  setTocOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold",
                  i === player.index ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/8 hover:text-white",
                )}
              >
                <span className="w-4 tabular-nums text-white/40">{num(String(i + 1))}</span>
                {t(ch.titleKey)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-1 flex items-center justify-center gap-5">
        <button
          type="button"
          disabled={isFirst}
          onClick={player.prev}
          className="grid size-10 place-items-center text-white/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={t("learn.chapters.prev")}
        >
          <SkipBack size={22} fill="currentColor" />
        </button>
        <button
          type="button"
          onClick={
            free
              ? onOrbitToggle
              : ended
                ? () => {
                    player.seek(0);
                    player.play();
                  }
                : player.toggle
          }
          className="grid size-12 place-items-center text-white hover:text-white"
          aria-label={ended ? t("learn.chapters.replay") : playing ? t("learn.pause") : t("learn.play")}
        >
          {ended ? (
            <RotateCcw size={26} />
          ) : playing ? (
            <Pause size={28} fill="currentColor" strokeWidth={0} />
          ) : (
            <Play size={28} fill="currentColor" strokeWidth={0} className="ml-[3px]" />
          )}
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={player.next}
          className={cn(
            "grid size-10 place-items-center text-white/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-30",
            player.ended && !isLast && "text-amber-100",
          )}
          aria-label={t("learn.chapters.next")}
        >
          <SkipForward size={22} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
