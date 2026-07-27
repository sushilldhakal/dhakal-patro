import type { TFunction } from "i18next";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { CalendarDay, PanchangaDay } from "@/lib/api";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { useCalendarEra } from "@/hooks/use-calendar-era";
import { currentPatroMonthLinkSearch } from "@/lib/url-state";
import { GrahaStatusBadges } from "@/components/graha/GrahaStatusBadges";
import {
  formatAngaPatroTransitionHint,
  formatClockNepali,
  formatMonthMoonEventDisplay,
  formatPatroBelaantar,
  formatPatroDeshaantar,
  getAbhijitMuhurta,
  getMoonriseDisplay,
  getPanchangaDetail,
  getPlanetGocharLines,
  getRituDisplay,
  getRituSeason,
  getSolarCorrections,
  getSunriseDisplay,
  getSunsetDisplay,
} from "@/lib/panchanga-format";
import { useLocale } from "@/i18n/locale";
import { patroAsideLink } from "@/lib/patro-classes";
import { cn } from "@/lib/utils";

type AngaBlock = {
  name_ne?: string;
  name?: string;
  end_local_time?: string;
  end_hours_clock?: string;
  end_ghati_clock?: string;
  next?: AngaBlock;
};

type Props = {
  p?: PanchangaDay;
  selectedDay?: CalendarDay | null;
  location?: PanchangaLocation;
  bsYear?: number;
  bsMonth?: number;
  loading?: boolean;
};

function AbhijitVivaranBlock({
  p,
  location,
}: {
  p: PanchangaDay;
  location: PanchangaLocation;
}) {
  const { t } = useTranslation();
  const era = useCalendarEra();
  const abhijit = getAbhijitMuhurta(p);

  return (
    <div className="mt-2.5 border-t border-foreground/10 pt-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-sm font-bold text-secondary dark:text-secondary">{t("abhijit.title")}</div>
        <Link
          to="/abhijit-muhurta"
          search={currentPatroMonthLinkSearch(location, era)}
          className={patroAsideLink}
        >
          {t("common.view_all")} →
        </Link>
      </div>
      {abhijit ? (
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-xs text-base">{t("abhijit.today_window")}</span>
          <span className="flex flex-wrap items-baseline justify-end gap-1.5">
            <span className="mono text-sm font-semibold text-foreground">{abhijit.rangeDisplay}</span>
            {abhijit.noonDisplay ? (
              <span className="mono text-sm">
                ({t("abhijit.noon_short")} {abhijit.noonDisplay})
              </span>
            ) : null}
          </span>
        </div>
      ) : (
        <p className="m-0 py-5 text-center text-sm text-base">{t("abhijit.unavailable")}</p>
      )}
    </div>
  );
}

type DetailCell = {
  label: string;
  value?: string;
  hint?: string;
  wide?: boolean;
  mono?: boolean;
};

function angaName(anga: AngaBlock | null | undefined, lang: string): string | undefined {
  if (!anga) return undefined;
  return lang === "en" ? anga.name ?? anga.name_ne : anga.name_ne ?? anga.name;
}

function VivaranCell({ label, value, hint, wide, mono }: DetailCell) {
  return (
    <div className={cn("min-w-0 rounded-lg bg-surface-inset p-2.5 shadow-ring-soft", wide && "col-span-2")}>
      <div className="text-sm text-base tracking-[0.12em] uppercase">{label}</div>
      <div className={cn("mt-1 text-base leading-snug font-semibold text-foreground", mono && "mono text-sm")}>
        {value ?? "—"}
      </div>
      {hint ? <div className="mt-0.5 text-sm leading-snug text-base break-words">{hint}</div> : null}
    </div>
  );
}

function buildPanchangaDetailCells(
  p: PanchangaDay,
  t: TFunction,
  lang: string,
  selectedDay?: CalendarDay | null,
): DetailCell[] {
  const detail = getPanchangaDetail(p);
  const nakshatra = (detail?.nakshatra ?? p.nakshatra) as AngaBlock | undefined;
  const yoga = (detail?.yoga ?? p.yoga) as AngaBlock | undefined;
  const karana = (detail?.karana ?? p.karana) as AngaBlock | undefined;
  const karanaHint = formatAngaPatroTransitionHint(karana, lang);

  const sunrise =
    getSunriseDisplay(p) ?? (selectedDay?.sunrise ? formatClockNepali(selectedDay.sunrise) : undefined);
  const sunset =
    getSunsetDisplay(p) ?? (selectedDay?.sunset ? formatClockNepali(selectedDay.sunset) : undefined);
  const moonrise =
    getMoonriseDisplay(p, lang) ??
    (selectedDay ? formatMonthMoonEventDisplay(selectedDay, "moonrise", lang) : undefined);

  return [
    {
      label: t("aside.sunrise_sunset"),
      value: sunrise && sunset ? `${sunrise} / ${sunset}` : undefined,
      mono: true,
    },
    { label: t("aside.moonrise"), value: moonrise ?? t("sections.dash"), mono: true },
    (() => {
      const value = getRituDisplay(p, lang);
      const hint = getRituSeason(p, lang);
      // Nepali names the season and the ritu with the same word — don't print
      // "ग्रीष्म" twice.
      return { label: t("aside.ritu"), value, hint: hint === value ? undefined : hint };
    })(),
    {
      label: t("aside.nakshatra"),
      value: angaName(nakshatra, lang),
      hint: formatAngaPatroTransitionHint(nakshatra, lang),
    },
    {
      label: t("aside.yoga"),
      value: angaName(yoga, lang),
      hint: formatAngaPatroTransitionHint(yoga, lang),
    },
    {
      label: t("aside.karana"),
      value: angaName(karana, lang),
      hint: karanaHint,
    },
  ];
}

export function PanchangaVivaranPanel({ p, selectedDay, location, loading }: Props) {
  const { t } = useTranslation();
  const { lang } = useLocale();

  if (loading || !p) {
    return (
      <section className="rounded-lg bg-card shadow-ring-soft">
        <div className="mb-2.5 grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="min-w-0 rounded-lg bg-surface-inset p-2.5 shadow-ring-soft">
              <div className="text-sm text-base tracking-[0.12em] uppercase">…</div>
              <div className="mt-1.5 h-[18px] animate-pulse rounded-full bg-muted-foreground/20" />
            </div>
          ))}
        </div>
        <div className="mt-2.5 h-[120px] animate-pulse rounded-md bg-muted" />
      </section>
    );
  }

  const cells = buildPanchangaDetailCells(p, t, lang, selectedDay);
  const planets = getPlanetGocharLines(p, lang);
  const solar = getSolarCorrections(p);
  const deshaantar = formatPatroDeshaantar(solar?.deshaantar);
  const belaantar = formatPatroBelaantar(solar?.belaantar);

  return (
    <section className="min-h-full rounded-lg bg-card">
      <div className="mb-2.5 grid grid-cols-2 gap-2">
        {cells.map((cell) => (
          <VivaranCell key={cell.label} {...cell} />
        ))}
      </div>

      {planets.length > 0 || deshaantar || belaantar ? (
        <div className="mt-2.5 border-t border-foreground/10">
          <div className="mb-1.5 text-sm font-bold text-foreground">{t("aside.gochar")}</div>
          {planets.length > 0 ? (
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {planets.map(({ key, label, rashi, degree, isRetrograde, isCombust }) => (
                <div
                  key={label}
                  className="flex min-w-0 flex-col gap-0.5 rounded-[5px] bg-gochar-chip px-1.5 py-1 dark:bg-gochar-chip-dark"
                >
                  <span className="flex shrink-0 items-center gap-0.5 text-sm leading-tight font-semibold text-foreground">
                    {label}
                    <GrahaStatusBadges
                      planetKey={key}
                      isRetrograde={isRetrograde}
                      isCombust={isCombust}
                      size={12}
                    />
                  </span>
                  <span className="mono min-w-0 text-sm font-semibold leading-tight text-foreground break-words">
                    {rashi ? (
                      <>
                        <span className="block">{rashi}</span>
                        <span className="block tabular-nums">{degree}</span>
                      </>
                    ) : (
                      degree
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          {deshaantar || belaantar ? (
            <div className="mt-1.5 grid grid-cols-1 gap-1.5 border-t border-foreground/10 pt-2 sm:grid-cols-2">
              {deshaantar ? (
                <div className="flex min-w-0 flex-col gap-0.5 rounded-[5px] bg-gochar-chip px-1.5 py-1 dark:bg-gochar-chip-dark sm:flex-row sm:items-center sm:justify-between sm:gap-1">
                  <span className="shrink-0 text-sm leading-tight font-semibold text-foreground">
                    {t("aside.deshaantar")}
                  </span>
                  <span className="mono min-w-0 text-sm font-semibold leading-tight text-foreground break-words sm:text-right">
                    {deshaantar}
                  </span>
                </div>
              ) : null}
              {belaantar ? (
                <div className="flex min-w-0 flex-col gap-0.5 rounded-[5px] bg-gochar-chip px-1.5 py-1 dark:bg-gochar-chip-dark sm:flex-row sm:items-center sm:justify-between sm:gap-1">
                  <span className="shrink-0 text-sm leading-tight font-semibold text-foreground">
                    {t("aside.belaantar")}
                  </span>
                  <span className="mono min-w-0 text-sm font-semibold leading-tight text-foreground break-words sm:text-right">
                    {belaantar}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {location && p ? (
        <AbhijitVivaranBlock p={p} location={location} />
      ) : null}
    </section>
  );
}
