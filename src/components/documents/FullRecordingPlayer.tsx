import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface Props {
  audioUrl: string | null | undefined;
  /** Called whenever this player starts — used to pause the per-verse player. */
  onPlay?: () => void;
  className?: string;
}

export interface FullRecordingPlayerHandle {
  pause: () => void;
}

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * A single continuous recording of the whole document — a plain `<audio>`
 * element is all this needs (unlike the per-verse player, there's only ever
 * one clip here, so none of the gapless-scheduling machinery applies).
 */
export const FullRecordingPlayer = forwardRef<FullRecordingPlayerHandle, Props>(
  function FullRecordingPlayer({ audioUrl, onPlay, className }, ref) {
    const { t } = useTranslation();
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useImperativeHandle(
      ref,
      () => ({
        pause: () => audioRef.current?.pause(),
      }),
      [],
    );

    const toggle = useCallback(() => {
      const audio = audioRef.current;
      if (!audio) return;
      if (playing) {
        audio.pause();
      } else {
        if (audio.ended) audio.currentTime = 0;
        void audio.play().catch(() => setPlaying(false));
      }
    }, [playing]);

    const seek = useCallback((time: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = time;
      setCurrentTime(time);
    }, []);

    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
      const onPlayEvent = () => {
        setPlaying(true);
        onPlay?.();
      };
      const onPause = () => setPlaying(false);
      const onTime = () => setCurrentTime(audio.currentTime);
      const onLoadedMetadata = () => setDuration(audio.duration || 0);
      const onEnded = () => {
        setPlaying(false);
        setCurrentTime(0);
      };
      audio.addEventListener("play", onPlayEvent);
      audio.addEventListener("pause", onPause);
      audio.addEventListener("timeupdate", onTime);
      audio.addEventListener("loadedmetadata", onLoadedMetadata);
      audio.addEventListener("ended", onEnded);
      return () => {
        audio.removeEventListener("play", onPlayEvent);
        audio.removeEventListener("pause", onPause);
        audio.removeEventListener("timeupdate", onTime);
        audio.removeEventListener("loadedmetadata", onLoadedMetadata);
        audio.removeEventListener("ended", onEnded);
      };
    }, [onPlay]);

    if (!audioUrl) return null;

    const fillPct = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3",
          className,
        )}
      >
        <audio ref={audioRef} src={audioUrl} preload="none" />
        <button
          type="button"
          onClick={toggle}
          aria-label={t(playing ? "documents.pause_verse" : "documents.play_full_recording")}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground"
        >
          {playing ? (
            <Pause className="size-5" fill="currentColor" strokeWidth={0} />
          ) : (
            <Play className="ml-0.5 size-5" fill="currentColor" strokeWidth={0} />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t("documents.play_full_recording")}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="w-8 shrink-0 text-[10px] tabular-nums text-muted-foreground">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              className="shloka-scrub w-full min-w-0 flex-1 cursor-pointer outline-none"
              style={{ "--fill": `${fillPct}%` } as React.CSSProperties}
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label={t("documents.seek")}
            />
            <span className="w-8 shrink-0 text-[10px] tabular-nums text-muted-foreground">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    );
  },
);
