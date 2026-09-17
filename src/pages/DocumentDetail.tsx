import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PlaybackBar } from "@/components/documents/PlaybackBar";
import { ShlokaCard } from "@/components/documents/ShlokaCard";
import { useFullRecordingAudio } from "@/hooks/use-full-recording-audio";
import { useShlokaPlayer } from "@/hooks/use-shloka-player";
import { bilingualText, useLocale } from "@/i18n/locale";
import { ApiError } from "@/lib/api";
import { documentsKeys, fetchDocumentDetail, flattenShlokas } from "@/lib/documents-api";
import { useRouteLoading } from "@/lib/route-loading";

export function DocumentDetail() {
  const { t } = useTranslation();
  const { lang } = useLocale();
  const { slug } = useParams({ strict: false }) as { slug?: string };

  const docQ = useQuery({
    queryKey: documentsKeys.detail(slug ?? ""),
    queryFn: () => fetchDocumentDetail(slug!),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 30,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });

  useRouteLoading(docQ.isLoading);

  const doc = docQ.data;
  const shlokas = useMemo(() => (doc ? flattenShlokas(doc) : []), [doc]);
  const player = useShlokaPlayer(shlokas);
  const fullAudio = useFullRecordingAudio(doc?.full_audio_url);

  // Which player currently owns the floating bar / actual sound — null until
  // the listener has engaged either one this visit.
  const [mode, setMode] = useState<"full" | "verse" | null>(null);

  const startFull = useCallback(() => {
    setMode("full");
    fullAudio.play();
  }, [fullAudio]);

  // A click on any individual verse always hands control to the per-verse
  // engine and stops the full recording outright — `player.playing` alone
  // isn't a reliable signal here (see the comment on `versePlayer` below),
  // so both sides pause/switch explicitly on every call rather than reacting
  // to a state transition that might not actually change value.
  const versePlayer = useMemo(
    () => ({
      ...player,
      play: (id: number) => {
        setMode("verse");
        fullAudio.pause();
        player.play(id);
      },
      toggle: (id: number) => {
        setMode("verse");
        fullAudio.pause();
        player.toggle(id);
      },
    }),
    [player, fullAudio],
  );

  const activeShloka = shlokas.find((s) => s.id === player.activeId) ?? null;

  const switchToFull = useCallback(() => {
    if (activeShloka?.full_audio_start == null) return;
    player.pause();
    setMode("full");
    fullAudio.playFrom(activeShloka.full_audio_start);
  }, [activeShloka, player, fullAudio]);

  // While the full recording plays, estimate which verse is currently
  // sounding from each verse's *real* measured start/end within it (from
  // cross-correlating its own clip against the full recording — see
  // data/documents_source/README.md) and drive the same highlight/auto-scroll
  // the per-verse player uses.
  useEffect(() => {
    if (mode !== "full" || !fullAudio.playing) return;
    let active: { id: number; progress: number } | null = null;
    for (const s of shlokas) {
      if (s.full_audio_start == null || s.full_audio_end == null) continue;
      if (s.full_audio_start > fullAudio.currentTime) break;
      const dur = s.full_audio_end - s.full_audio_start;
      active = {
        id: s.id,
        progress: dur > 0 ? Math.min(1, Math.max(0, (fullAudio.currentTime - s.full_audio_start) / dur)) : 0,
      };
    }
    if (active) player.setDisplayOverride(active);
  }, [mode, fullAudio.playing, fullAudio.currentTime, shlokas, player]);

  const backLink = (
    <Link
      to="/documents"
      className="inline-flex items-center gap-1.5 text-sm transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> {t("documents.back_to_list")}
    </Link>
  );

  if (!slug || (docQ.isError && !docQ.isLoading)) {
    return (
      <PageShell showRelatedLinks={false}>
        {backLink}
        <p className="mt-4 text-sm text-muted-foreground">{t("documents.not_found")}</p>
      </PageShell>
    );
  }

  if (!doc) {
    return (
      <PageShell showRelatedLinks={false}>
        {backLink}
      </PageShell>
    );
  }

  const title = bilingualText(lang, doc.title_ne, doc.title_en);
  const subtitle = bilingualText(lang, doc.subtitle_ne, doc.subtitle_en);
  const description = bilingualText(lang, doc.description_ne, doc.description_en);
  const source = bilingualText(lang, doc.source_ne, doc.source_en);

  return (
    <PageShell showRelatedLinks={false} className="pb-28">
      {backLink}

      <header className="space-y-1.5">
        <p className="text-sm font-medium text-secondary">{doc.title_sa}</p>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        {description ? <p className="max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
        {source ? (
          <p className="text-xs text-muted-foreground">
            {t("documents.source")}: {source}
          </p>
        ) : null}
      </header>

      <div className="space-y-6">
        {doc.chapters.map((chapter) => {
          const chapterTitle = bilingualText(lang, chapter.title_ne, chapter.title_en);
          return (
            <div key={chapter.number ?? "single"} className="space-y-3">
              {chapter.number != null ? (
                <h2 className="text-lg font-semibold">
                  {chapter.number}
                  {chapterTitle ? ` · ${chapterTitle}` : ""}
                </h2>
              ) : null}
              <div className="space-y-3">
                {chapter.shlokas.map((shloka) => (
                  <ShlokaCard key={shloka.id} shloka={shloka} player={versePlayer} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {fullAudio.audioElement}
      <PlaybackBar
        mode={mode}
        hasFullRecording={Boolean(doc.full_audio_url)}
        documentTitle={title}
        onStartFull={startFull}
        fullPlaying={fullAudio.playing}
        fullCurrentTime={fullAudio.currentTime}
        fullDuration={fullAudio.duration}
        onToggleFull={fullAudio.toggle}
        onSeekFull={fullAudio.seek}
        activeShloka={activeShloka}
        versePlaying={mode === "verse" && player.playing}
        verseCurrentTime={player.currentTime}
        verseDuration={player.duration}
        hasNext={player.hasNext}
        hasPrev={player.hasPrev}
        onToggleVerse={() => activeShloka && versePlayer.toggle(activeShloka.id)}
        onNext={versePlayer.next}
        onPrev={versePlayer.prev}
        onSwitchToFull={switchToFull}
      />
    </PageShell>
  );
}

export default DocumentDetail;
