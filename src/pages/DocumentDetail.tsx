import { useCallback, useEffect, useMemo, useRef } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import {
  FullRecordingPlayer,
  type FullRecordingPlayerHandle,
} from "@/components/documents/FullRecordingPlayer";
import { ShlokaCard } from "@/components/documents/ShlokaCard";
import { ShlokaPlayerBar } from "@/components/documents/ShlokaPlayerBar";
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
  const activeShloka = shlokas.find((s) => s.id === player.activeId) ?? null;

  // The full-recording player and the per-verse player are two independent
  // <audio>/engine instances — starting one must pause the other so they
  // never sound at once. The per-verse side is covered here (whenever it
  // starts playing, stop the full recording, via the imperative handle);
  // FullRecordingPlayer's own `onPlay` covers the reverse direction.
  const fullRecordingRef = useRef<FullRecordingPlayerHandle>(null);
  useEffect(() => {
    if (player.playing) fullRecordingRef.current?.pause();
  }, [player.playing]);
  const pauseVersePlayer = useCallback(() => player.pause(), [player]);

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
        <FullRecordingPlayer
          ref={fullRecordingRef}
          audioUrl={doc.full_audio_url}
          onPlay={pauseVersePlayer}
          className="mt-3"
        />
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
                  <ShlokaCard key={shloka.id} shloka={shloka} player={player} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <ShlokaPlayerBar player={player} activeShloka={activeShloka} documentTitle={title} />
    </PageShell>
  );
}

export default DocumentDetail;
