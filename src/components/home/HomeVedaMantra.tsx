import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Pause, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DOCUMENTS_STALE_TIME,
  fetchVedaDaily,
  vedaDailyKeys,
  type VedaDaily,
} from "@/lib/documents-api";
import { pickLocale, useLocale } from "@/i18n/locale";
import { patroCard, patroSecBand } from "@/lib/patro-classes";

function sourceLine(data: VedaDaily, lang: string, digits: (v: string | number) => string): string {
  const parts = data.source_parts.map((part) => {
    const label = (lang === "en" ? part.label_en : part.label_ne) ?? "";
    // A chapter title carries its own number ("मण्डल 3"); the others pair a label with a value.
    return part.value == null ? label.replace(/\d+/g, (m) => digits(m)) : `${label} ${digits(part.value)}`;
  });
  return [lang === "en" ? data.veda.name_en : data.veda.name_ne, ...parts].join(" » ");
}

/** One recording, played and paused from a single button. */
function MantraAudio({ url, label }: { url: string; label: { play: string; pause: string } }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = new Audio(url);
    el.preload = "none";
    el.onplay = () => setPlaying(true);
    el.onpause = () => setPlaying(false);
    el.onended = () => setPlaying(false);
    audio.current = el;
    return () => {
      el.pause();
      el.src = "";
      audio.current = null;
    };
  }, [url]);

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => setPlaying(false));
    else el.pause();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? label.pause : label.play}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-white transition-opacity hover:opacity-90 active:scale-95"
    >
      {playing ? <Pause size={20} /> : <Play size={20} className="translate-x-px" />}
    </button>
  );
}

/** Today's Veda mantra — Sanskrit, meaning where there is one, audio, and a link to the passage. */
export function HomeVedaMantra({ dateAd }: { dateAd: string | undefined }) {
  const { t } = useTranslation();
  const { lang, digits } = useLocale();
  const { data } = useQuery({
    queryKey: vedaDailyKeys.day(dateAd ?? ""),
    queryFn: () => fetchVedaDaily(dateAd!),
    enabled: Boolean(dateAd),
    staleTime: DOCUMENTS_STALE_TIME,
  });
  if (!data) return null;

  const { shloka } = data;
  const meaning = (lang === "en" ? shloka.meaning_en : shloka.meaning_ne) ?? shloka.meaning_en ?? shloka.meaning_ne;
  const anchor = `shloka-${data.read_verse.trim().replace(/\s+/g, "-")}`;

  return (
    <section className={`${patroCard} mb-8`} aria-label={t("home_veda.title")}>
      <div className={patroSecBand}>
        <h2 className="min-w-0 flex-1 text-base font-bold text-secondary">{t("home_veda.title")}</h2>
        {shloka.audio_url ? (
          <MantraAudio url={shloka.audio_url} label={{ play: t("home_veda.play"), pause: t("home_veda.pause") }} />
        ) : null}
      </div>
      <div className="flex flex-col gap-3 px-4 py-4">
        <p lang="sa" className="text-xl leading-relaxed text-foreground">
          {shloka.sanskrit}
        </p>
        {meaning ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-muted-foreground">{t("home_veda.meaning")}</span>
            <p className="text-sm leading-relaxed text-foreground">{meaning}</p>
          </div>
        ) : null}
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <Link
            to="/documents/$slug/$chapter"
            params={{ slug: data.read_slug, chapter: String(data.read_chapter) }}
            hash={anchor}
            className="text-sm font-semibold text-secondary no-underline hover:underline"
          >
            {pickLocale(lang, "थप पढ्नुहोस् →", "Read more →")}
          </Link>
          <span className="ml-auto text-right text-xs text-muted-foreground">{sourceLine(data, lang, digits)}</span>
        </div>
      </div>
    </section>
  );
}
