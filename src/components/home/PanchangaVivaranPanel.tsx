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
    <div className="pn-vivaran-block pn-vivaran-abhijit">
      <div className="pn-vivaran-abhijit-head">
        <div className="pn-vivaran-block-title">{t("abhijit.title")}</div>
        <Link
          to="/abhijit-muhurta"
          search={{ year: bsYear, month: bsMonth }}
          className="pn-aside-link shrink-0"
        >
          {t("common.view_all")} →
        </Link>
      </div>
      {abhijit ? (
        <div className="pn-vivaran-abhijit-row">
          <span className="pn-vivaran-abhijit-label">{t("abhijit.today_window")}</span>
          <span className="pn-vivaran-abhijit-val">
            <span className="pn-vivaran-abhijit-time mono">{abhijit.rangeDisplay}</span>
            {abhijit.noonDisplay ? (
              <span className="pn-vivaran-abhijit-noon mono">
                ({t("abhijit.noon_short")} {abhijit.noonDisplay})
              </span>
            ) : null}
          </span>
        </div>
      ) : (
        <p className="pn-aside-tab-empty">{t("abhijit.unavailable")}</p>
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
    <div className={`pn-vivaran-cell${wide ? " wide" : ""}`}>
      <div className="pn-vivaran-cell-label">{label}</div>
      <div className={`pn-vivaran-cell-value${mono ? " mono" : ""}`}>{value ?? "—"}</div>
      {hint ? <div className="pn-vivaran-cell-hint">{hint}</div> : null}
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

  const sunrise = getSunriseDisplay(p) ??
    (selectedDay?.sunrise ? formatClockNepali(selectedDay.sunrise) : undefined);
  const sunset = getSunsetDisplay(p) ??
    (selectedDay?.sunset ? formatClockNepali(selectedDay.sunset) : undefined);
  const moonrise =
    getMoonriseDisplay(p) ??
    (selectedDay ? formatMonthMoonEventDisplay(selectedDay, "moonrise") : undefined);

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
      <section className="pn-vivaran">
        <div className="pn-vivaran-angas">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="pn-vivaran-cell">
              <div className="pn-mini-label">…</div>
              <div className="pn-mini-skel" />
            </div>
          ))}
        </div>
        <div className="pn-vivaran-skel" style={{ height: 120, marginTop: 10 }} />
      </section>
    );
  }

  const cells = buildPanchangaDetailCells(p, t, selectedDay);
  const planets = getPlanetGocharLines(p);
  const solar = getSolarCorrections(p);
  const deshaantar = formatPatroDeshaantar(solar?.deshaantar);
  const belaantar = formatPatroBelaantar(solar?.belaantar);

  return (
    <section className="pn-vivaran">
      <div className="pn-vivaran-angas">
        {cells.map((cell) => (
          <VivaranCell key={cell.label} {...cell} />
        ))}
      </div>

      {planets.length > 0 || deshaantar || belaantar ? (
        <div className="pn-vivaran-block pn-vivaran-gochar">
          <div className="pn-vivaran-block-title">{t("aside.gochar")}</div>
          {planets.length > 0 ? (
            <div className="pn-gochar-grid">
              {planets.map(({ label, value }) => (
                <div key={label} className="pn-gochar-chip">
                  <span className="pn-gochar-chip-label">{label}</span>
                  <span className="pn-gochar-chip-value">{value}</span>
                </div>
              ))}
            </div>
          ) : null}
          {deshaantar || belaantar ? (
            <div className="pn-gochar-foot">
              {deshaantar ? (
                <div className="pn-gochar-chip">
                  <span className="pn-gochar-chip-label">{t("aside.suryakranti")}</span>
                  <span className="pn-gochar-chip-value">{deshaantar}</span>
                </div>
              ) : null}
              {belaantar ? (
                <div className="pn-gochar-chip">
                  <span className="pn-gochar-chip-label">{t("aside.belaantar")}</span>
                  <span className="pn-gochar-chip-value">{belaantar}</span>
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
