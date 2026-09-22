import { useMemo } from "react";
import { Pause, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { bilingualText, useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Shloka } from "@/lib/documents-api";
import type { ShlokaPlayerState } from "@/hooks/use-shloka-player";

interface Props {
  shloka: Shloka;
  player: ShlokaPlayerState;
  /**
   * Present when the document has a full recording. A verse with no clip of
   * its own but a timestamp within that recording gets a play button that
   * starts the full recording from that verse.
   */
  fullRecording?: { playing: boolean; toggleAt: (id: number) => void };
}

/**
 * One verse: Sanskrit + optional transliteration, a play toggle, and a
 * meaning accordion. Registers itself with the player so it can be
 * scrolled into view and highlighted while its audio plays.
 */
export function ShlokaCard({ shloka, player, fullRecording }: Props) {
  const { t } = useTranslation();
  const { lang } = useLocale();
  const isActive = player.activeId === shloka.id;
  const playsFromFull =
    !shloka.audio_url && fullRecording != null && shloka.full_audio_start != null;
  const canPlay = Boolean(shloka.audio_url) || playsFromFull;
  const isPlaying = isActive && (playsFromFull ? fullRecording!.playing : player.playing);
  const meaningOpen = player.openMeaningIds.has(shloka.id);
  const meaning = bilingualText(lang, shloka.meaning_ne, shloka.meaning_en, "");
  const accordionValue = meaningOpen ? "meaning" : "";
  const isClosing =
    shloka.verse_label.startsWith("इति") || shloka.verse_label === "ध्यानम्";
  const shlokaDomId = `shloka-${shloka.verse_label.replace(/\s+/g, "-")}`;

  // Split keeping whitespace as its own tokens (so it renders back exactly as
  // written) while indexing only the real words for the timing estimate below.
  const tokens = useMemo(() => shloka.sanskrit.split(/(\s+)/), [shloka.sanskrit]);
  const wordTokenIndices = useMemo(
    () => tokens.map((tok, i) => (tok.trim() ? i : -1)).filter((i) => i >= 0),
    [tokens],
  );
  // No word-level timing from the audio (that needs a real forced-alignment
  // pass over each recording) — this is an estimate. Weighted by character
  // count rather than a flat per-word split, since Sanskrit compounds vary
  // hugely in length ("न" vs. a 20-character compound) and take proportionally
  // longer to chant; still an estimate, not a true speech-aligned sync.
  const wordStartFractions = useMemo(() => {
    const lengths = wordTokenIndices.map((idx) => tokens[idx]!.length);
    const total = lengths.reduce((a, b) => a + b, 0) || 1;
    const starts: number[] = [];
    lengths.reduce((cumulative, len) => {
      starts.push(cumulative / total);
      return cumulative + len;
    }, 0);
    return starts;
  }, [tokens, wordTokenIndices]);
  // From the full recording there is no per-clip time/duration, only the
  // verse's progress between its start and end timestamps.
  const verseFraction = playsFromFull
    ? player.progress
    : player.duration > 0
      ? player.currentTime / player.duration
      : -1;
  const activeWordPos =
    isPlaying && verseFraction >= 0
      ? wordStartFractions.reduce((best, start, i) => (start <= verseFraction ? i : best), -1)
      : -1;
  const activeTokenIndex = activeWordPos >= 0 ? wordTokenIndices[activeWordPos]! : -1;

  return (
    <section
      ref={(el) => player.registerItemRef(shloka.id, el)}
      id={shlokaDomId}
      className={cn(
        "scroll-mt-24 rounded-xl border p-4 transition-colors sm:p-5",
        isActive ? "border-secondary/60 bg-secondary/5" : "border-border bg-card",
        isClosing && !isActive && "border-secondary/35 bg-secondary/5",
      )}
    >
      <div className="flex items-start gap-3">
        {canPlay ? (
          <button
            type="button"
            onClick={() =>
              playsFromFull ? fullRecording!.toggleAt(shloka.id) : player.toggle(shloka.id)
            }
            aria-label={t(isPlaying ? "documents.pause_verse" : "documents.play_verse")}
            className={cn(
              "mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border transition-colors",
              isActive
                ? "border-secondary bg-secondary text-secondary-foreground"
                : "border-border text-secondary hover:border-secondary/60 hover:bg-secondary/10",
            )}
          >
            {isPlaying ? (
              <Pause className="size-4" fill="currentColor" strokeWidth={0} />
            ) : (
              <Play className="ml-0.5 size-4" fill="currentColor" strokeWidth={0} />
            )}
          </button>
        ) : (
          <span
            aria-hidden="true"
            className="mt-0.5 grid size-9 shrink-0 place-items-center text-xs font-semibold tabular-nums text-muted-foreground/50"
          >
            {shloka.verse_label}
          </span>
        )}

        <div className="min-w-0 flex-1">
          {canPlay ? (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
              {shloka.verse_label}
            </span>
          ) : null}
          <p className="mt-1 text-lg leading-relaxed sm:text-xl">
            {tokens.map((tok, i) =>
              i === activeTokenIndex ? (
                <span
                  key={i}
                  className="rounded bg-yellow-300/70 px-0.5 transition-colors duration-150 dark:bg-yellow-400/30"
                >
                  {tok}
                </span>
              ) : (
                tok
              ),
            )}
          </p>
          {lang !== "ne" && shloka.transliteration ? (
            <p className="mt-1.5 text-sm italic text-muted-foreground">{shloka.transliteration}</p>
          ) : null}

          {isActive ? (
            <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-secondary transition-[width]"
                style={{ width: `${Math.round(player.progress * 100)}%` }}
              />
            </div>
          ) : null}

          {meaning ? (
            <Accordion
              type="single"
              collapsible
              value={accordionValue}
              onValueChange={() => player.toggleMeaning(shloka.id)}
              className="mt-1"
            >
              <AccordionItem value="meaning" className="border-none">
                <AccordionTrigger className="w-fit gap-1.5 py-1.5 text-xs font-semibold text-secondary hover:no-underline">
                  {t("documents.meaning")}
                </AccordionTrigger>
                <AccordionContent className="pb-1 text-base leading-relaxed sm:text-lg">
                  {meaning}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : null}
        </div>
      </div>
    </section>
  );
}
