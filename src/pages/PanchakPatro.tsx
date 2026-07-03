import { Link, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ArrowLeft, CalendarClock } from "lucide-react";
import { PageShell, PageHeader } from "@/components/PageShell";
import {
  defaultPanchakPatroYear,
  getPanchakPatroForYear,
  PANCHAK_PATRO_YEARS,
  type PanchakPeriod,
} from "@/lib/panchak/panchak-patro-data";
import {
  PANCHAK_VARIETIES,
  panchakVarietyFromStartAd,
} from "@/lib/panchak/panchak-types";
import { formatBsMonthDayPatro } from "@/lib/panchanga-format";
import { BS_SUPPORTED_END_YEAR, BS_SUPPORTED_START_YEAR } from "@/lib/bs-calendar";
import { useLocale } from "@/i18n/locale";
import { isEnglishLocale } from "@/lib/avakahada-locale";
import { patroNoteBox, patroSelect } from "@/lib/patro-classes";
import { cn } from "@/lib/utils";

function fmtAdShort(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
}

function PanchakPeriodCard({
  index,
  period,
  lang,
}: {
  index: number;
  period: PanchakPeriod;
  lang?: string;
}) {
  const { t } = useTranslation();
  const { digits } = useLocale();
  const en = isEnglishLocale(lang);
  const variety = panchakVarietyFromStartAd(period.start.ad);

  const bsStart = formatBsMonthDayPatro(
    period.start.bsYear,
    period.start.bsMonth,
    period.start.bsDay,
  );
  const bsEnd = formatBsMonthDayPatro(period.end.bsYear, period.end.bsMonth, period.end.bsDay);

  return (
    <article className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs shadow-ring-soft">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
        <h3 className="text-sm font-bold text-foreground m-0">
          {t("panchak.period_label", { n: digits(index + 1) })}
        </h3>
        {variety ? (
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            {en ? variety.labelEn : variety.labelNe}
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-muted/20 px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            {t("panchak.start_date")}
          </p>
          <p className="text-sm font-semibold text-foreground leading-snug">
            {digits(bsStart)}, {en ? period.start.timeEn : period.start.timeNe}
          </p>
          <p className="mono mt-1 text-xs text-muted-foreground">{fmtAdShort(period.start.ad)}</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-muted/20 px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            {t("panchak.end_date")}
          </p>
          <p className="text-sm font-semibold text-foreground leading-snug">
            {digits(bsEnd)}, {en ? period.end.timeEn : period.end.timeNe}
          </p>
          <p className="mono mt-1 text-xs text-muted-foreground">{fmtAdShort(period.end.ad)}</p>
        </div>
      </div>

      <p className="mt-3 text-xs font-medium text-muted-foreground">
        {t("panchak.duration")}:{" "}
        <span className="text-foreground">{en ? period.durationEn : period.durationNe}</span>
      </p>
    </article>
  );
}

export function PanchakPatro() {
  const search = useSearch({ strict: false }) as { year?: number };
  const { t, i18n } = useTranslation();
  const { digits } = useLocale();
  const lang = i18n.language;
  const en = isEnglishLocale(lang);

  const year =
    search.year != null && PANCHAK_PATRO_YEARS.includes(search.year)
      ? search.year
      : defaultPanchakPatroYear();

  const periods = getPanchakPatroForYear(year);

  const prohibited = [
    { titleKey: "panchak.prohibited.south_travel", descKey: "panchak.prohibited.south_travel_desc" },
    { titleKey: "panchak.prohibited.roof", descKey: "panchak.prohibited.roof_desc" },
    { titleKey: "panchak.prohibited.bed", descKey: "panchak.prohibited.bed_desc" },
    { titleKey: "panchak.prohibited.fuel", descKey: "panchak.prohibited.fuel_desc" },
    { titleKey: "panchak.prohibited.last_rites", descKey: "panchak.prohibited.last_rites_desc" },
  ] as const;

  return (
    <PageShell className="pb-16">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground mb-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {t("panchak.back_home")}
      </Link>

      <PageHeader
        icon={<CalendarClock className="h-7 w-7 text-secondary shrink-0" />}
        title={t("panchak.title", { year: digits(year) })}
        subtitle={t("panchak.subtitle")}
      />

      <p className={cn(patroNoteBox, "text-sm leading-relaxed")}>{t("panchak.intro")}</p>

      {PANCHAK_PATRO_YEARS.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="panchak-year" className="text-sm font-medium text-muted-foreground">
            {t("panchak.year_label")}
          </label>
          <select
            id="panchak-year"
            className={patroSelect}
            value={year}
            onChange={(e) => {
              const next = Number(e.target.value);
              window.location.href = `/panchak-patro?year=${next}`;
            }}
          >
            {Array.from(
              { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
              (_, i) => BS_SUPPORTED_START_YEAR + i,
            )
              .filter((y) => PANCHAK_PATRO_YEARS.includes(y))
              .map((y) => (
                <option key={y} value={y}>
                  {digits(y)}
                </option>
              ))}
          </select>
        </div>
      ) : null}

      {!periods?.length ? (
        <p className="text-sm text-muted-foreground">{t("panchak.no_data", { year: digits(year) })}</p>
      ) : (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600" />
            {t("panchak.periods_title", { year: digits(year) })}
          </h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {periods.map((period, i) => (
              <PanchakPeriodCard key={`${period.start.ad}-${period.end.ad}`} index={i} period={period} lang={lang} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-bold text-foreground mb-3">{t("panchak.prohibited_title")}</h2>
        <ul className="space-y-3">
          {prohibited.map(({ titleKey, descKey }) => (
            <li key={titleKey} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-foreground">{t(titleKey)}</p>
              <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{t(descKey)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 space-y-5">
        <h2 className="text-base font-bold text-foreground">{t("panchak.learn_title")}</h2>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">{t("panchak.what_title")}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("panchak.what_body")}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">{t("panchak.rahita_title")}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("panchak.rahita_body")}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">{t("panchak.types_title")}</h3>
          <ul className="space-y-2.5">
            {PANCHAK_VARIETIES.map((v) => (
              <li key={v.id} className="text-sm leading-relaxed">
                <span className="font-semibold text-foreground">{en ? v.labelEn : v.labelNe}</span>
                <span className="text-muted-foreground"> — {en ? v.noteEn : v.noteNe}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PageShell>
  );
}
