import type { TFunction } from "i18next";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { CalendarDay, PanchangaDay } from "@/lib/api";
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
  getRituDisplayNe,
  getRituSeason,
  getSolarCorrections,
  getSunriseDisplay,
  getSunsetDisplay,
} from "@/lib/panchanga-format";
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
  bsYear?: number;
  bsMonth?: number;
  loading?: boolean;
};

function AbhijitVivaranBlock({
  p,
  bsYear,
  bsMonth,
}: {
  p: PanchangaDay;
  bsYear: number;
  bsMonth: number;
}) {
  const { t } = useTranslation();
  const abhijit = getAbhijitMuhurta(p);

  return (
    <div className="mt-2.5 border-t border-foreground/10 pt-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[13px] font-bold text-secondary dark:text-secondary">{t("abhijit.title")}</div>
        <Link to="/abhijit-muhurta" search={{ year: bsYear, month: bsMonth }} className={patroAsideLink}>
          {t("common.view_all")} →
        </Link>
      </div>
      {abhijit ? (
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-xs font-medium text-muted-foreground">{t("abhijit.today_window")}</span>
          <span className="flex flex-wrap items-baseline justify-end gap-1.5">
            <span className="mono text-sm font-semibold text-foreground">{abhijit.rangeDisplay}</span>
            {abhijit.noonDisplay ? (
              <span className="mono text-[11px] text-muted-foreground">
                ({t("abhijit.noon_short")} {abhijit.noonDisplay})
              </span>
            ) : null}
          </span>
        </div>
      ) : (
        <p className="m-0 py-5 text-center text-[13px] font-medium text-muted-foreground">{t("abhijit.unavailable")}</p>
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

function angaName(anga?: AngaBlock | null): string | undefined {
  return anga?.name_ne ?? anga?.name;
}

function VivaranCell({ label, value, hint, wide, mono }: DetailCell) {
  return (
    <div className={cn("min-w-0 rounded-lg bg-surface-inset p-2.5 shadow-ring-soft", wide && "col-span-2")}>
      <div className="text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">{label}</div>
      <div className={cn("mt-1 text-[15px] leading-snug font-semibold text-foreground", mono && "mono text-[13.5px]")}>
        {value ?? "—"}
      </div>
      {hint ? <div className="mt-0.5 text-[11px] leading-snug font-medium break-words text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

function buildPanchangaDetailCells(
  p: PanchangaDay,
  t: TFunction,
  selectedDay?: CalendarDay | null,
): DetailCell[] {
  const detail = getPanchangaDetail(p);
  const nakshatra = (detail?.nakshatra ?? p.nakshatra) as AngaBlock | undefined;
  const yoga = (detail?.yoga ?? p.yoga) as AngaBlock | undefined;
  const karana = (detail?.karana ?? p.karana) as AngaBlock | undefined;
  const karanaHint = formatAngaPatroTransitionHint(karana);

  const sunrise =
    getSunriseDisplay(p) ?? (selectedDay?.sunrise ? formatClockNepali(selectedDay.sunrise) : undefined);
  const sunset =
    getSunsetDisplay(p) ?? (selectedDay?.sunset ? formatClockNepali(selectedDay.sunset) : undefined);
  const moonrise =
    getMoonriseDisplay(p) ?? (selectedDay ? formatMonthMoonEventDisplay(selectedDay, "moonrise") : undefined);

  return [
    {
      label: t("aside.sunrise_sunset"),
      value: sunrise && sunset ? `${sunrise} / ${sunset}` : undefined,
      mono: true,
    },
    { label: t("aside.moonrise"), value: moonrise ?? t("sections.dash"), mono: true },
    { label: t("aside.ritu"), value: getRituDisplayNe(p), hint: getRituSeason(p) },
    {
      label: t("aside.nakshatra"),
      value: angaName(nakshatra),
      hint: formatAngaPatroTransitionHint(nakshatra),
    },
    {
      label: t("aside.yoga"),
      value: angaName(yoga),
      hint: formatAngaPatroTransitionHint(yoga),
    },
    {
      label: t("aside.karana"),
      value: angaName(karana),
      hint: karanaHint,
    },
  ];
}

export function PanchangaVivaranPanel({ p, selectedDay, bsYear, bsMonth, loading }: Props) {
  const { t } = useTranslation();

  if (loading || !p) {
    return (
      <section className="rounded-lg bg-card shadow-ring-soft">
        <div className="mb-2.5 grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="min-w-0 rounded-lg bg-surface-inset p-2.5 shadow-ring-soft">
              <div className="text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">…</div>
              <div className="mt-1.5 h-[18px] animate-pulse rounded-full bg-muted-foreground/20" />
            </div>
          ))}
        </div>
        <div className="mt-2.5 h-[120px] animate-pulse rounded-md bg-muted" />
      </section>
    );
  }

  const cells = buildPanchangaDetailCells(p, t, selectedDay);
  const planets = getPlanetGocharLines(p);
  const solar = getSolarCorrections(p);
  const deshaantar = formatPatroDeshaantar(solar?.deshaantar);
  const belaantar = formatPatroBelaantar(solar?.belaantar);

  return (
    <section className="min-h-full rounded-lg bg-card shadow-ring-soft min-[1081px]:rounded-none min-[1081px]:shadow-none">
      <div className="mb-2.5 grid grid-cols-2 gap-2">
        {cells.map((cell) => (
          <VivaranCell key={cell.label} {...cell} />
        ))}
      </div>

      {planets.length > 0 || deshaantar || belaantar ? (
        <div className="mt-2.5 border-t border-foreground/10 pt-2.5">
          <div className="mb-1.5 text-[13px] font-bold text-foreground">{t("aside.gochar")}</div>
          {planets.length > 0 ? (
            <div className="grid grid-cols-3 gap-1.5">
              {planets.map(({ label, value }) => (
                <div
                  key={label}
                  className="flex min-w-0 items-center justify-between gap-1 rounded-[5px] bg-gochar-chip px-1.5 py-1 dark:bg-gochar-chip-dark"
                >
                  <span className="shrink-0 text-[11px] leading-tight font-semibold text-foreground">{label}</span>
                  <span className="mono min-w-0 truncate text-right text-[10.5px] font-semibold text-foreground">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          {deshaantar || belaantar ? (
            <div className="mt-1.5 grid grid-cols-2 gap-1.5 border-t border-foreground/10 pt-2">
              {deshaantar ? (
                <div className="flex min-w-0 items-center justify-between gap-1 rounded-[5px] bg-gochar-chip px-1.5 py-1 dark:bg-gochar-chip-dark">
                  <span className="shrink-0 text-[11px] leading-tight font-semibold text-foreground">
                    {t("aside.suryakranti")}
                  </span>
                  <span className="mono min-w-0 truncate text-right text-[10.5px] font-semibold text-foreground">
                    {deshaantar}
                  </span>
                </div>
              ) : null}
              {belaantar ? (
                <div className="flex min-w-0 items-center justify-between gap-1 rounded-[5px] bg-gochar-chip px-1.5 py-1 dark:bg-gochar-chip-dark">
                  <span className="shrink-0 text-[11px] leading-tight font-semibold text-foreground">
                    {t("aside.belaantar")}
                  </span>
                  <span className="mono min-w-0 truncate text-right text-[10.5px] font-semibold text-foreground">
                    {belaantar}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {bsYear != null && bsMonth != null ? (
        <AbhijitVivaranBlock p={p} bsYear={bsYear} bsMonth={bsMonth} />
      ) : null}
    </section>
  );
}
