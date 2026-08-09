import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n/locale";
import { RashiGlyphIcon } from "@/components/panchanga/element/ElementGlyphIcon";
import { getRashiName } from "@/lib/rashi-i18n";
import type { RashifalPersonal } from "@/lib/api";
import { civilIsoFromDate } from "@/lib/patro-day";
import { formatPatroCivilDayLabel } from "@/lib/patro-headline-subtitle";
import {
  RASHIFAL_DOMAIN_ICON,
  RASHIFAL_FLAG_ICON,
  RASHIFAL_LUCKY_ICON,
  rashifalToneBar,
  rashifalToneText,
  toNepaliDigits,
} from "@/lib/rashifal-ui";

type Props = {
  name: string;
  personal: RashifalPersonal;
};

function StarMeter({ stars, tone }: { stars: number; tone: RashifalPersonal["tone"] }) {
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={cn("size-1.5 rounded-full", n <= stars ? rashifalToneBar(tone) : "bg-border")}
        />
      ))}
    </span>
  );
}

function LuckyCell({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5" title={label}>
      <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">{label}: </span>
      <span className="truncate text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}

/**
 * Dasha end date, in the same locale-aware AD label the rest of the app uses
 * (static month-name tables + digit localisation) — not the browser's own
 * Intl data, which cannot be relied on to carry full Nepali month names.
 */
function formatDasha(iso: string, lang: string, digitFn: (n: number | string) => string): string {
  try {
    return formatPatroCivilDayLabel(civilIsoFromDate(new Date(iso)), lang, digitFn);
  } catch {
    return iso.slice(0, 10);
  }
}

/**
 * A single personal rashifal — cast on the profile's own birth chart (Lagna,
 * natal Ashtakavarga, running Vimshottari dasha) rather than the general
 * engine's twelve-sign Moon-sign sweep. Mirrors {@link RashifalSignCard}'s
 * layout so switching between "all signs" and "my reading" doesn't jar.
 */
export function RashifalPersonalCard({ name, personal }: Props) {
  const { t } = useTranslation();
  const { lang } = useLocale();
  const [open, setOpen] = useState(false);

  const ne = lang === "ne";
  const prediction = ne ? personal.prediction_ne : personal.prediction_en;
  const luckyColor = ne ? personal.lucky_color_ne : personal.lucky_color_en;
  const luckyNumber = ne ? personal.lucky_number_ne : personal.lucky_number_en;
  const luckyDirection = ne ? personal.lucky_direction_ne : personal.lucky_direction_en;
  const lord = personal.rashi_lord;
  const dasha = personal.dasha;
  const detailsId = "rashifal-personal-detail";

  const lagnaLabel = ne ? personal.lagna_sign_ne : personal.lagna_sign_en;
  const moonLabel = ne ? personal.moon_sign_ne : personal.moon_sign_en;
  const sunLabel = ne ? personal.sun_sign_ne : personal.sun_sign_en;

  return (
    <article
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-xl border border-secondary/40 bg-card",
        "shadow-[0_0_0_1px_color-mix(in_srgb,var(--secondary)_18%,transparent)]",
      )}
    >
      <header className="flex items-start gap-3 border-b border-border bg-secondary/[0.08] px-4 py-3 dark:bg-secondary/15">
        <RashiGlyphIcon
          name={getRashiName(personal.lagna_sign, lang)}
          number={personal.lagna_sign}
          size={36}
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-base font-bold leading-snug text-foreground">{name}</h3>
          <p className="m-0 mt-1 text-xs leading-relaxed text-muted-foreground">
            {t("rashifal.personal.lagna_line", { lagna: lagnaLabel, moon: moonLabel, sun: sunLabel })}
          </p>
        </div>
      </header>

      <div className="flex items-center gap-2.5 border-b border-border/60 px-4 py-2.5">
        <StarMeter stars={personal.stars} tone={personal.tone} />
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-[width]", rashifalToneBar(personal.tone))}
            style={{ width: `${personal.percent}%` }}
          />
        </div>
        <span
          className={cn(
            "shrink-0 font-num tabular-nums text-xs font-bold",
            rashifalToneText(personal.tone),
          )}
        >
          {toNepaliDigits(personal.percent, lang)}
          <span aria-hidden="true">%</span>
        </span>
      </div>

      {/* Running dasha — the layer only a birth chart can give. */}
      <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/20 px-4 py-2">
        <Clock className="size-3.5 shrink-0 text-secondary" aria-hidden="true" />
        <span className="truncate text-xs font-semibold text-foreground">
          {t("rashifal.personal.dasha_line", {
            maha: ne ? dasha.mahadasha.lord_ne : dasha.mahadasha.lord_en,
            antar: ne ? dasha.antardasha.lord_ne : dasha.antardasha.lord_en,
          })}
        </span>
      </div>

      {personal.domains?.length ? (
        <ul className="m-0 grid list-none grid-cols-3 gap-x-3 gap-y-2 border-b border-border/60 px-4 py-3">
          {personal.domains.map((domain) => {
            const Icon = RASHIFAL_DOMAIN_ICON[domain.key];
            const label = ne ? domain.label_ne : domain.label_en;
            return (
              <li key={domain.key} className="m-0 min-w-0" title={`${label} · ${domain.percent}%`}>
                <div className="flex items-center gap-1">
                  <Icon
                    className={cn("size-3.5 shrink-0", rashifalToneText(domain.tone))}
                    aria-hidden="true"
                  />
                  <span className="truncate text-[0.65rem] font-semibold text-muted-foreground">
                    {label}
                  </span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", rashifalToneBar(domain.tone))}
                    style={{ width: `${domain.percent}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <p className="m-0 flex-1 px-4 py-3.5 text-sm leading-relaxed text-foreground/90">
        {prediction}
      </p>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border bg-muted/25 px-4 py-2.5 sm:grid-cols-3">
        <LuckyCell icon={RASHIFAL_LUCKY_ICON.color} label={t("rashifal.lucky_color")} value={luckyColor} />
        <LuckyCell
          icon={RASHIFAL_LUCKY_ICON.number}
          label={t("rashifal.lucky_number")}
          value={luckyNumber}
        />
        <LuckyCell
          icon={RASHIFAL_LUCKY_ICON.direction}
          label={t("rashifal.lucky_direction")}
          value={luckyDirection}
        />
      </div>

      <button
        type="button"
        className="flex min-h-10 w-full items-center justify-between gap-2 border-t border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((v) => !v)}
      >
        {t("rashifal.why_this")}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open ? (
        <div id={detailsId} className="border-t border-border bg-surface-muted px-4 py-3">
          {personal.components?.length ? (
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {personal.components.map((component) => (
                <li key={component.key} className="m-0 flex items-baseline gap-2 text-xs">
                  <span className="w-24 shrink-0 font-semibold text-foreground">
                    {ne ? component.label_ne : component.label_en}
                  </span>
                  <span className="min-w-0 flex-1 text-muted-foreground">
                    {ne ? component.note_ne : component.note_en}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-num tabular-nums font-bold",
                      rashifalToneText(component.tone),
                    )}
                  >
                    {toNepaliDigits(component.percent, lang)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          {personal.gochar?.length ? (
            <ul className="m-0 mt-3 flex list-none flex-wrap gap-1.5 border-t border-border/60 p-0 pt-3">
              {personal.gochar.map((row) => {
                const Vedha = RASHIFAL_FLAG_ICON.vedha;
                const Retro = RASHIFAL_FLAG_ICON.retrograde;
                const Combust = RASHIFAL_FLAG_ICON.combust;
                return (
                  <li
                    key={row.graha}
                    className={cn(
                      "m-0 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.65rem] font-semibold",
                      row.vedha_by ? "bg-tone-neutral" : row.favourable ? "bg-tone-good" : "bg-tone-bad",
                    )}
                    title={t("rashifal.gochar_hint", {
                      graha: ne ? row.graha_ne : row.graha_en,
                      house: row.house,
                      sign: ne ? row.sign_ne : row.sign_en,
                    })}
                  >
                    <span>{ne ? row.graha_ne : row.graha_en}</span>
                    <span className="font-num tabular-nums opacity-80">
                      {toNepaliDigits(row.house, lang)}
                    </span>
                    {row.vedha_by ? <Vedha className="size-3" aria-hidden="true" /> : null}
                    {row.retrograde ? <Retro className="size-3" aria-hidden="true" /> : null}
                    {row.combust ? <Combust className="size-3" aria-hidden="true" /> : null}
                  </li>
                );
              })}
            </ul>
          ) : null}

          {lord ? (
            <p className="m-0 mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
              {t("rashifal.personal.lord_line", {
                lord: ne ? lord.lord_ne : lord.lord_en,
                house: lord.house,
                sign: ne ? lord.sign_ne : lord.sign_en,
                dignity: ne ? lord.dignity_ne : lord.dignity_en,
              })}
            </p>
          ) : null}

          <p className="m-0 mt-2 text-xs text-muted-foreground">
            {t("rashifal.personal.dasha_range", {
              maha: ne ? dasha.mahadasha.lord_ne : dasha.mahadasha.lord_en,
              mahaEnd: formatDasha(dasha.mahadasha.end, lang, (n) => toNepaliDigits(n, lang)),
              antar: ne ? dasha.antardasha.lord_ne : dasha.antardasha.lord_en,
              antarEnd: formatDasha(dasha.antardasha.end, lang, (n) => toNepaliDigits(n, lang)),
            })}
          </p>
        </div>
      ) : null}
    </article>
  );
}
