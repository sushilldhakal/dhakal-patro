import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Shloka } from "@/lib/documents-api";
import type { ShlokaPlayerState } from "@/hooks/use-shloka-player";

interface Props {
  player: ShlokaPlayerState;
  activeShloka: Shloka | null;
  documentTitle: string;
}

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Sticky transport bar — appears once a verse has been selected. */
export function ShlokaPlayerBar({ player, activeShloka, documentTitle }: Props) {
  const { t } = useTranslation();
  if (!activeShloka) return null;

  const hasAudio = Boolean(activeShloka.audio_url);
  const fillPct = player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0;

  return (
    <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 mx-auto w-full max-w-2xl px-3 lg:bottom-4">
      <div className="rounded-2xl border border-border bg-background/95 px-3 py-2.5 shadow-lg backdrop-blur">
        {hasAudio ? (
          <div className="mb-1.5 flex items-center gap-2">
            <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
              {formatTime(player.currentTime)}
            </span>
            <input
              type="range"
              className="shloka-scrub w-full min-w-0 flex-1 cursor-pointer outline-none"
              style={{ "--fill": `${fillPct}%` } as React.CSSProperties}
              min={0}
              max={player.duration || 1}
              step={0.1}
              value={player.currentTime}
              onChange={(e) => player.seek(Number(e.target.value))}
              aria-label={t("documents.seek")}
            />
            <span className="w-8 shrink-0 text-[10px] tabular-nums text-muted-foreground">
              {formatTime(player.duration)}
            </span>
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={player.prev}
            disabled={!player.hasPrev}
            aria-label={t("documents.prev_verse")}
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <SkipBack className="size-4" fill="currentColor" />
          </button>
          <button
            type="button"
            onClick={() => player.toggle(activeShloka.id)}
            disabled={!hasAudio}
            aria-label={t(player.playing ? "documents.pause_verse" : "documents.play_verse")}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground disabled:opacity-40"
          >
            {player.playing ? (
              <Pause className="size-5" fill="currentColor" strokeWidth={0} />
            ) : (
              <Play className="ml-0.5 size-5" fill="currentColor" strokeWidth={0} />
            )}
          </button>
          <button
            type="button"
            onClick={player.next}
            disabled={!player.hasNext}
            aria-label={t("documents.next_verse")}
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <SkipForward className="size-4" fill="currentColor" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-muted-foreground">{documentTitle}</p>
            <p className="truncate text-sm font-semibold">
              {t("documents.now_playing", { label: activeShloka.verse_label })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
