import type { PanchangaDay } from "@/lib/api";
import { useTranslation } from "react-i18next";
import {
  formatAngaTransition,
  formatDinamaanShort,
  formatNepalSambatDisplay,
  formatPakshaNepaliDisplay,
  formatShakaYear,
  formatTimeShort,
  formatGhatiEnd,
  getDinVisheshLabels,
  getMuhurtaRows,
  getMoonriseDisplay,
  getMoonsetDisplay,
  getRituDisplayNe,
  getRituSeason,
  getPanchangaDetail,
  getLagnaDisplay,
  getPlanetRows,
  getPlanetsAnchorLabel,
  formatSolarCorrectionDisplay,
  getSolarCorrections,
  getSunriseDisplay,
  getSunsetDisplay,
  getVaaraNe,
  formatRashiDisplayNe,
  formatSpanEndTime,
  getChandrabalam,
  getChandraRashiSpans,
  getNakshatraPadaSpans,
  getPanchakaRahita,
  getSuryaNakshatra,
  getSuryaRashi,
  getTarabalam,
  getUdayaLagna,
  formatShortClock,
  formatTimeRangeShort,
  rashiSymFromNumber,
  toNepaliDigits,
} from "@/lib/panchanga-format";
import type { BalamChip } from "@/lib/api";
import { NakshatraIcon } from "@/components/nakshatra/NakshatraIcon";
import {
  PanchangaRow,
  PanchangaRows,
  PanchangaSection,
  TimingRange,
  UptoValue,
} from "./PanchangaLayout";

type Anga = {
  name_ne?: string;
  name?: string;
  end_local_time?: string;
  end_ghati_clock?: string;
  end_hours_clock?: string;
  next?: { name_ne?: string; name?: string };
};

function angaEndTime(anga?: Anga | null): string | undefined {
  if (!anga) return undefined;
  const t =
    formatTimeShort(anga.end_local_time) ??
    formatTimeShort(anga.end_hours_clock) ??
    formatGhatiEnd(anga.end_ghati_clock);
  return t ? toNepaliDigits(t) : undefined;
}

function AngaCell({ anga }: { anga?: Anga | null }) {
  if (!anga) return <span className="text-muted-foreground">—</span>;
  return (
    <>
      <UptoValue name={anga.name_ne ?? anga.name} endTime={angaEndTime(anga)} />
      {anga.next?.name_ne && <UptoValue name={anga.next.name_ne} />}
    </>
  );
}

export function SunMoonSection({ p }: { p: PanchangaDay }) {
  const solar = getSolarCorrections(p);
  const belaantar = formatSolarCorrectionDisplay(solar?.belaantar);
  const deshaantar = formatSolarCorrectionDisplay(solar?.deshaantar);

  return (
    <PanchangaSection titleKey="sections.sun_moon">
      <PanchangaRows>
        <PanchangaRow labelKey="sections.sunrise" oddBorder>
          <span>🌅</span>
          <span className="font-mono font-semibold text-foreground">
            {getSunriseDisplay(p) ?? "—"}
          </span>
        </PanchangaRow>
        <PanchangaRow labelKey="sections.sunset">
          <span>🌇</span>
          <span className="font-mono font-semibold text-foreground">
            {getSunsetDisplay(p) ?? "—"}
          </span>
        </PanchangaRow>
        <PanchangaRow labelKey="sections.moonrise" oddBorder>
          <span>🌒</span>
          <span className="font-mono font-semibold text-foreground">
            {getMoonriseDisplay(p) ?? "—"}
          </span>
        </PanchangaRow>
        <PanchangaRow labelKey="sections.moonset">
          <span>🌘</span>
          <span className="font-mono font-semibold text-foreground">
            {getMoonsetDisplay(p) ?? "—"}
          </span>
        </PanchangaRow>
        {belaantar ? (
          <PanchangaRow labelKey="sections.equation_of_time" oddBorder>
            <span className="font-mono font-semibold text-foreground">{belaantar}</span>
          </PanchangaRow>
        ) : null}
        {deshaantar ? (
          <PanchangaRow labelKey="sections.longitude_correction">
            <span className="font-mono font-semibold text-foreground">{deshaantar}</span>
          </PanchangaRow>
        ) : null}
      </PanchangaRows>
      {solar?.ishtakaal_note_ne ? (
        <p className="text-[11px] text-muted-foreground mt-2 mb-0 leading-snug px-0.5">
          {solar.ishtakaal_note_ne}
        </p>
      ) : null}
    </PanchangaSection>
  );
}

export function PanchangCoreSection({ p }: { p: PanchangaDay }) {
  const detail = getPanchangaDetail(p);
  const instant = p.mode === "ephemeris";
  const tithi = (instant ? p.tithi : detail?.tithi ?? p.tithi) as Anga | undefined;
  const nakshatra = (instant ? p.nakshatra : detail?.nakshatra ?? p.nakshatra) as Anga | undefined;
  const yoga = (instant ? p.yoga : detail?.yoga ?? p.yoga) as Anga | undefined;
  const karana = (instant ? p.karana : detail?.karana ?? p.karana) as Anga | undefined;
  const paksha = formatPakshaNepaliDisplay(p);
  const pakshaName = (detail?.paksha as { name?: string } | undefined)?.name;
  const pakshaSym = pakshaName === "shukla" ? "🌕" : "🌑";

  return (
    <PanchangaSection titleKey="sections.panchang_core">
      <PanchangaRows>
        <PanchangaRow labelKey="tithi" oddBorder>
          <AngaCell anga={tithi} />
        </PanchangaRow>
        <PanchangaRow labelKey="nakshatra">
          <span className="inline-flex items-center gap-2.5 flex-wrap">
            <NakshatraIcon
              name={nakshatra?.name_ne ?? nakshatra?.name}
              size={32}
              className="text-secondary dark:text-[var(--brand-yellow)]"
            />
            <AngaCell anga={nakshatra} />
          </span>
        </PanchangaRow>
        <PanchangaRow labelKey="sections.yoga" oddBorder>
          <AngaCell anga={yoga} />
        </PanchangaRow>
        <PanchangaRow labelKey="sections.karana">
          <AngaCell anga={karana} />
        </PanchangaRow>
        <PanchangaRow labelKey="sections.weekday" oddBorder>
          <span className="font-semibold">{getVaaraNe(p, p.weekday) ?? "—"}</span>
        </PanchangaRow>
        <PanchangaRow labelKey="sections.paksha">
          <span>{pakshaSym}</span>
          <span className="font-semibold">{paksha ?? "—"}</span>
        </PanchangaRow>
      </PanchangaRows>
    </PanchangaSection>
  );
}

export function SamvatSection({ p }: { p: PanchangaDay }) {
  const detail = getPanchangaDetail(p);
  const bs = (detail?.bs_date ?? p.bs_date) as
    | { year?: number; month_name_ne?: string; day?: number }
    | undefined;
  const ns = formatNepalSambatDisplay(p);
  const shaka = formatShakaYear(p);

  return (
    <PanchangaSection titleKey="sections.samvat">
      <PanchangaRows>
        <PanchangaRow labelKey="sections.vikram" oddBorder>
          <span className="font-semibold">
            {bs?.year && bs.month_name_ne && bs.day
              ? `${toNepaliDigits(bs.year)} ${bs.month_name_ne} ${toNepaliDigits(bs.day)}`
              : (p.display?.bs_ne ?? "—")}
          </span>
        </PanchangaRow>
        <PanchangaRow labelKey="sections.shaka">
          <span className="font-semibold">{shaka ? toNepaliDigits(shaka) : "—"}</span>
        </PanchangaRow>
        <PanchangaRow labelKey="sections.nepal_sambat" oddBorder>
          <span className="font-semibold">{ns ?? "—"}</span>
        </PanchangaRow>
        <PanchangaRow labelKey="sections.paksha">
          <span className="font-semibold">
            {(detail?.paksha as { label_ne?: string } | undefined)?.label_ne ??
              p.paksha?.label_ne ??
              "—"}
          </span>
        </PanchangaRow>
      </PanchangaRows>
    </PanchangaSection>
  );
}

export function RashiSection({ p }: { p: PanchangaDay }) {
  const { t } = useTranslation();
  const detail = getPanchangaDetail(p);
  const moonRashiSpans = getChandraRashiSpans(p);
  const padaSpans = getNakshatraPadaSpans(p);
  const suryaRashi = getSuryaRashi(p);
  const suryaNak = getSuryaNakshatra(p);

  const fallbackMoon = (detail?.chandra_rashi as { name_ne?: string; number?: number } | undefined) ??
    p.chandra_rashi;
  const moonSpans =
    moonRashiSpans ??
    (fallbackMoon?.name_ne
      ? [{ name_ne: fallbackMoon.name_ne, number: fallbackMoon.number }]
      : []);

  return (
    <PanchangaSection titleKey="sections.rashi_pada">
      <PanchangaRows>
        <PanchangaRow labelKey="sections.moon_sign" oddBorder>
          <div className="flex flex-col gap-1 w-full">
            {moonSpans.length > 0 ? (
              moonSpans.map((span, i) => (
                <UptoValue
                  key={`moon-rashi-${i}`}
                  sym={rashiSymFromNumber(span.number)}
                  name={formatRashiDisplayNe(span.name_ne)}
                  endTime={formatSpanEndTime(span)}
                />
              ))
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </PanchangaRow>
        <PanchangaRow labelKey="sections.pada">
          <div className="flex flex-col gap-1 w-full">
            {padaSpans && padaSpans.length > 0 ? (
              padaSpans.map((span, i) => (
                <UptoValue
                  key={`pada-${i}`}
                  name={
                    span.nakshatra_name_ne
                      ? `${span.nakshatra_name_ne} — ${span.pada_ne ?? toNepaliDigits(span.pada ?? "")} ${t("sections.pada_unit")}`
                      : undefined
                  }
                  endTime={formatSpanEndTime(span)}
                />
              ))
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </PanchangaRow>
        <PanchangaRow labelKey="sections.sun_sign" oddBorder>
          {suryaRashi?.name_ne || suryaRashi?.name ? (
            <UptoValue
              sym={rashiSymFromNumber(suryaRashi.number)}
              name={formatRashiDisplayNe(suryaRashi.name_ne ?? suryaRashi.name)}
            />
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </PanchangaRow>
        <PanchangaRow labelKey="sections.sun_nakshatra">
          {suryaNak?.name_ne || suryaNak?.name ? (
            <UptoValue name={suryaNak.name_ne ?? suryaNak.name} />
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </PanchangaRow>
      </PanchangaRows>
    </PanchangaSection>
  );
}

function BalamChips({ items, rashi = false }: { items: BalamChip[]; rashi?: boolean }) {
  return (
    <div className="pg-chips">
      {items.map((it, i) => (
        <span key={`${it.name_ne ?? it.name}-${i}`} className="pg-chip">
          {rashi && it.number != null && (
            <span className="pg-chip-sym">{rashiSymFromNumber(it.number)}</span>
          )}
          <span>{rashi ? formatRashiDisplayNe(it.name_ne) : it.name_ne}</span>
        </span>
      ))}
    </div>
  );
}

export function BalamSection({ p }: { p: PanchangaDay }) {
  const { t } = useTranslation();
  const chandra = getChandrabalam(p);
  const tara = getTarabalam(p);
  const chandraTill = formatShortClock(chandra?.till?.end_local_time_short ?? chandra?.till?.end_local_time);
  const taraTill = formatShortClock(tara?.till?.end_local_time_short ?? tara?.till?.end_local_time);

  return (
    <PanchangaSection titleKey="sections.balam">
      <div className="pg-balam">
        <div className="pg-balam-col">
          <h3 className="pg-balam-h">
            {t("sections.auspicious_chandra")}
            {chandraTill ? (
              <>
                {" "}
                — <span className="font-mono">{chandraTill}</span> {t("sections.until")}
              </>
            ) : null}
          </h3>
          <BalamChips items={chandra?.set1 ?? []} rashi />
          <h3 className="pg-balam-h">{t("sections.until_sunrise")}</h3>
          <BalamChips items={chandra?.set2 ?? []} rashi />
        </div>
        <div className="pg-balam-col">
          <h3 className="pg-balam-h">
            {t("sections.auspicious_tara")}
            {taraTill ? (
              <>
                {" "}
                — <span className="font-mono">{taraTill}</span> {t("sections.until")}
              </>
            ) : null}
          </h3>
          <BalamChips items={tara?.set1 ?? []} />
          <h3 className="pg-balam-h">{t("sections.until_sunrise")}</h3>
          <BalamChips items={tara?.set2 ?? []} />
        </div>
      </div>
    </PanchangaSection>
  );
}

export function PanchakaLagnaSection({ p }: { p: PanchangaDay }) {
  const { t } = useTranslation();
  const panchaka = getPanchakaRahita(p);
  const lagna = getUdayaLagna(p);

  return (
    <PanchangaSection titleKey="sections.panchaka_lagna">
      <div className="pg-balam">
        <div className="pg-balam-col">
          <h3 className="pg-balam-h">
            <b>{t("sections.today_panchaka")}</b>
          </h3>
          <div className="pg-mlist">
            {panchaka?.map((seg, i) => (
              <div key={`pr-${i}`} className={`pg-mrow${seg.good ? " good" : ""}`}>
                <span className="pg-mrow-name">{seg.name_ne ?? seg.name}</span>
                <span className="pg-mrow-time font-mono">
                  {formatTimeRangeShort(
                    seg.start_local_time_short ?? seg.start_local_time,
                    seg.end_local_time_short ?? seg.end_local_time
                  ) ?? "—"}
                </span>
              </div>
            )) ?? <span className="text-muted-foreground text-sm">—</span>}
          </div>
        </div>
        <div className="pg-balam-col">
          <h3 className="pg-balam-h">
            <b>{t("sections.today_udaya_lagna")}</b>
          </h3>
          <div className="pg-mlist">
            {lagna?.map((row, i) => (
              <div key={`lagna-${i}`} className="pg-mrow lagna">
                <span className="pg-mrow-name">
                  {row.number != null && (
                    <span className="pg-chip-sym">{rashiSymFromNumber(row.number)}</span>
                  )}
                  {formatRashiDisplayNe(row.name_ne ?? row.name)}
                </span>
                <span className="pg-mrow-time font-mono">
                  {formatTimeRangeShort(
                    row.start_local_time_short ?? row.start_local_time,
                    row.end_local_time_short ?? row.end_local_time
                  ) ?? "—"}
                </span>
                {row.pushkara_navamsha?.length ? (
                  <span className="pg-mrow-pushkara font-mono text-xs text-muted-foreground">
                    {t("sections.pushkara")}:{" "}
                    {row.pushkara_navamsha
                      .map((h) => formatShortClock(h.local_time_short ?? h.local_time))
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                ) : null}
              </div>
            )) ?? <span className="text-muted-foreground text-sm">—</span>}
          </div>
        </div>
      </div>
    </PanchangaSection>
  );
}

export function RituSection({ p }: { p: PanchangaDay }) {
  const detail = getPanchangaDetail(p);
  const aayan = (detail?.aayan as { name_ne?: string } | undefined)?.name_ne ??
    p.aayan?.name_ne ??
    p.aayan?.name;

  return (
    <PanchangaSection titleKey="sections.ritu_ayana">
      <PanchangaRows>
        <PanchangaRow labelKey="sections.ritu" oddBorder>
          <span>☀</span>
          <span className="font-semibold">{getRituDisplayNe(p) ?? "—"}</span>
          {getRituSeason(p) && (
            <span className="text-xs text-muted-foreground">({getRituSeason(p)})</span>
          )}
        </PanchangaRow>
        <PanchangaRow labelKey="sections.dinamana">
          <span className="font-mono font-semibold">{formatDinamaanShort(p) ?? "—"}</span>
        </PanchangaRow>
        <PanchangaRow labelKey="sections.ayana" oddBorder>
          <span className="font-semibold">{aayan ?? "—"}</span>
        </PanchangaRow>
        <PanchangaRow labelKey="tithi">
          <span className="font-semibold text-sm">{formatAngaTransition(detail?.tithi as Anga) ?? "—"}</span>
        </PanchangaRow>
      </PanchangaRows>
    </PanchangaSection>
  );
}

export function MuhurtaTimingsSection({ p }: { p: PanchangaDay }) {
  const rows = getMuhurtaRows(p);
  const good = rows.filter((r) => r.auspicious);
  const bad = rows.filter((r) => !r.auspicious);

  if (!rows.length) return null;

  return (
    <>
      {good.length > 0 && (
        <PanchangaSection titleKey="sections.auspicious_timings">
          <PanchangaRows>
            {good.map((row, i) => (
              <PanchangaRow key={row.label} label={row.label} oddBorder={i % 2 === 0}>
                <TimingRange
                  start={row.value.split(" – ")[0]}
                  end={row.value.split(" – ")[1]?.split(" (")[0]}
                  variant="good"
                />
              </PanchangaRow>
            ))}
          </PanchangaRows>
        </PanchangaSection>
      )}
      {bad.length > 0 && (
        <PanchangaSection titleKey="sections.inauspicious_timings">
          <PanchangaRows>
            {bad.map((row, i) => (
              <PanchangaRow key={row.label} label={row.label} oddBorder={i % 2 === 0}>
                <TimingRange
                  start={row.value.split(" – ")[0]}
                  end={row.value.split(" – ")[1]}
                  variant="bad"
                />
              </PanchangaRow>
            ))}
          </PanchangaRows>
        </PanchangaSection>
      )}
    </>
  );
}

export function DinVisheshSection({ p }: { p: PanchangaDay }) {
  const labels = getDinVisheshLabels(p, []);
  if (!labels.length) return null;

  return (
    <PanchangaSection titleKey="sections.special_observances">
      <div className="px-4 py-3 flex flex-wrap gap-2">
        {labels.map((label) => (
          <span
            key={label}
            className="text-[11.5px] font-semibold px-2.5 py-1.5 rounded-full bg-secondary/12 text-secondary dark:text-teal-300 border border-secondary/20"
          >
            {label}
          </span>
        ))}
      </div>
    </PanchangaSection>
  );
}

export function PlanetsPanel({ p }: { p: PanchangaDay }) {
  const { t } = useTranslation();
  const planets = getPlanetRows(p);
  const lagna = getLagnaDisplay(p);
  if (!planets.length && !lagna) return null;

  const symbols: Record<string, string> = {
    सूर्य: "☉",
    चन्द्र: "☽",
    मंगल: "♂",
    बुध: "☿",
    बृहस्पति: "♃",
    शुक्र: "♀",
    शनि: "♄",
    राहु: "☊",
    केतु: "☋",
  };

  return (
    <div className="rounded-xl bg-card p-4 shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]">
      <div className="flex items-baseline gap-2 mb-2">
        <h2 className="text-base font-bold m-0">{t("sections.planet_positions")}</h2>
        <span className="text-[11.5px] text-muted-foreground">{getPlanetsAnchorLabel(p)}</span>
      </div>
      <div className="flex flex-col">
        {lagna && (
          <div className="flex items-center gap-3 py-2 border-b border-border">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-[15px] bg-secondary/11 text-secondary dark:text-teal-300 shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]">
              ASC
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold">{t("sections.lagna")}</div>
              <div className="text-[11px] text-muted-foreground">{lagna.nameNe}</div>
            </div>
            {lagna.degree && (
              <span className="font-mono text-[11.5px] font-semibold text-foreground whitespace-nowrap">
                {lagna.degree}°
              </span>
            )}
          </div>
        )}
        {planets.map(({ label, rashiNe, coords }) => (
          <div
            key={label}
            className="flex items-center gap-3 py-2 border-b border-border last:border-0"
          >
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-[15px] bg-secondary/11 text-secondary dark:text-teal-300 shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]">
              {symbols[label] ?? "★"}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold">{label}</div>
              {rashiNe && (
                <div className="text-[11px] text-muted-foreground">{rashiNe}</div>
              )}
            </div>
            <span className="font-mono text-[11.5px] font-semibold text-foreground whitespace-nowrap">
              {coords}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FestivalsSection({ p }: { p: PanchangaDay }) {
  const festivals = p.festivals ?? [];
  if (!festivals.length) return null;

  return (
    <PanchangaSection titleKey="sections.festivals">
      <div className="px-4 py-3 flex flex-wrap gap-2">
        {festivals.map((f) => (
          <span
            key={f.id}
            className={
              f.is_public_holiday
                ? "text-[11.5px] font-semibold px-2.5 py-1.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20"
                : "text-[11.5px] font-semibold px-2.5 py-1.5 rounded-full bg-secondary/12 text-secondary dark:text-teal-300 border border-secondary/20"
            }
          >
            {f.name_ne ?? f.name_en ?? f.name}
          </span>
        ))}
      </div>
    </PanchangaSection>
  );
}
