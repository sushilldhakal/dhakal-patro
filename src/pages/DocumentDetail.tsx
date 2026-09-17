import { useMemo } from "react";
import { Link, useParams, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ChapterCard } from "@/components/documents/ChapterCard";
import { PlaybackBar } from "@/components/documents/PlaybackBar";
import { ShlokaCard } from "@/components/documents/ShlokaCard";
import { useDocumentPlayback } from "@/hooks/use-document-playback";
import { bilingualText, useLocale } from "@/i18n/locale";
import { ApiError } from "@/lib/api";
import {
  documentsKeys,
  fetchDocumentDetail,
  flattenShlokas,
  type DocumentCategoryTab,
} from "@/lib/documents-api";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { useRouteLoading } from "@/lib/route-loading";

export function DocumentDetail() {
  const { t } = useTranslation();
  const { lang } = useLocale();
  const { slug } = useParams({ strict: false }) as { slug?: string };
  // Which list-page tab this document was opened from (see DocumentCard) — so
  // "back to list" returns there instead of always resetting to "all".
  const { category } = useSearch({ strict: false }) as { category?: DocumentCategoryTab };
  const num = (n: number) => (lang === "ne" ? toNepaliDigits(String(n)) : String(n));

  const docQ = useQuery({
    queryKey: documentsKeys.detail(slug ?? ""),
    queryFn: () => fetchDocumentDetail(slug!),
    enabled: Boolean(slug),
    staleTime: 0,
    refetchOnMount: "always",
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });

  useRouteLoading(docQ.isLoading);

  const doc = docQ.data;
  // Only populated for a non-chaptered document — a chaptered one's chapters
  // carry no inline verses (see documents-api.ts), so this is [] for those.
  const shlokas = useMemo(() => (doc ? flattenShlokas(doc) : []), [doc]);
  const { player, versePlayer, fullAudio, mode, startFull, switchToFull, activeShloka } =
    useDocumentPlayback(shlokas, doc?.full_audio_url);

  const backLink = (
    <Link
      to="/documents"
      search={{ category: category ?? "all" }}
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

  const header = (
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
  );

  // A chaptered document never renders its verses on this page — pick a
  // chapter card first, then /documents/$slug/$chapter reads (and only
  // fetches) that chapter's shlokas. This is the one branch point every
  // future, possibly much bigger, multi-chapter book goes through: split by
  // chapter, never by an arbitrary verse count.
  if (doc.has_chapters) {
    const hasFullRecording = Boolean(doc.full_audio_url);
    return (
      <PageShell showRelatedLinks={false} className={hasFullRecording ? "pb-28" : undefined}>
        {backLink}
        {header}
        <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
          <span>{t("documents.chapters_count", { count: num(doc.chapter_count) })}</span>
          <span aria-hidden="true">·</span>
          <span>{t("documents.shlokas_count", { count: num(doc.shloka_count) })}</span>
        </div>
        <div className="space-y-2">
          {doc.chapters.map((chapter) => (
            <ChapterCard key={chapter.number ?? "single"} slug={doc.slug} chapter={chapter} />
          ))}
        </div>

        {fullAudio.audioElement}
        <PlaybackBar
          mode={mode === "verse" ? null : mode}
          hasFullRecording={hasFullRecording}
          documentTitle={title}
          onStartFull={startFull}
          fullPlaying={fullAudio.playing}
          fullCurrentTime={fullAudio.currentTime}
          fullDuration={fullAudio.duration}
          onToggleFull={fullAudio.toggle}
          onSeekFull={fullAudio.seek}
          activeShloka={null}
          versePlaying={false}
          verseCurrentTime={0}
          verseDuration={0}
          hasNext={false}
          hasPrev={false}
          onToggleVerse={() => {}}
          onNext={() => {}}
          onPrev={() => {}}
          onSwitchToFull={() => {}}
        />
      </PageShell>
    );
  }

  return (
    <PageShell showRelatedLinks={false} className="pb-28">
      {backLink}
      {header}

      <div className="space-y-3">
        {shlokas.map((shloka) => (
          <ShlokaCard key={shloka.id} shloka={shloka} player={versePlayer} />
        ))}
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
