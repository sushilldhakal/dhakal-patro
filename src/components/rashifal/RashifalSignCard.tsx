import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n/locale";
import { RashiGlyphIcon } from "@/components/panchanga/element/ElementGlyphIcon";
import { getRashiName } from "@/lib/rashi-i18n";
import type { RashifalSignBlock, NavataraTone } from "@/lib/api";
import { patroNavataraToneBg } from "@/lib/patro-classes";

type Props = {
  sign: RashifalSignBlock;
  prediction: string;
  luckyColor: string;
  luckyNumber: string;
  taraLine?: string;
  tone?: NavataraTone;
};

export function RashifalSignCard({
  sign,
  prediction,
  luckyColor,
  luckyNumber,
  taraLine,
  tone,
}: Props) {
  const { t } = useTranslation();
  const { lang } = useLocale();
  const titleNe = sign.name;
  const displayName = lang === "ne" ? titleNe : `${sign.title_en} · ${titleNe}`;

  return (
    <article
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card",
        "shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_6%,transparent)]",
      )}
    >
      <header className="flex items-start gap-3 border-b border-border bg-secondary/[0.08] px-4 py-3 dark:bg-secondary/15">
        <RashiGlyphIcon
          name={getRashiName(sign.id, lang)}
          number={sign.id}
          size={36}
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-base font-bold leading-snug text-foreground">{displayName}</h3>
          <p className="m-0 mt-1 text-xs leading-relaxed text-muted-foreground">{sign.syllables_ne}</p>
        </div>
        {taraLine && tone ? (
          <span
            className={cn(
              "shrink-0 rounded-md px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide",
              patroNavataraToneBg(tone),
            )}
          >
            {taraLine}
          </span>
        ) : null}
      </header>

      <p className="m-0 flex-1 px-4 py-3.5 text-sm leading-relaxed text-foreground/90">{prediction}</p>

      <footer className="grid grid-cols-2 gap-2 border-t border-border bg-muted/25 px-4 py-3 text-sm">
        <div className="min-w-0">
          <span className="block text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("rashifal.lucky_color")}
          </span>
          <span className="font-semibold text-foreground">{luckyColor}</span>
        </div>
        <div className="min-w-0 text-end sm:text-start">
          <span className="block text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("rashifal.lucky_number")}
          </span>
          <span className={cn("font-bold text-secondary", "font-num tabular-nums")}>{luckyNumber}</span>
        </div>
      </footer>
    </article>
  );
}
