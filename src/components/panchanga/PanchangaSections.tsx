import type { PanchangaDay } from "@/lib/api";
import { useTranslation } from "react-i18next";
import {
  formatAayanLabel,
  formatDurationFull,
  formatMadhyahnaDisplay,
  formatNepalSambatDisplay,
  formatPakshaNepaliDisplay,
  formatShakaYear,
  formatTimeShort,
  formatGhatiEnd,
  getDinVisheshLabels,
  getMuhurtaRows,
  getMoonriseDisplay,
  getMoonsetDisplay,
  getAayanPauranik,
  getAayanVedic,
  getRituPauranik,
  getRituVedic,
  formatRituLabel,
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
  getNivasShool,
  toNepaliDigits,
} from "@/lib/panchanga-format";
import type { NivasShoolSegment } from "@/lib/api";
import { resolveSamvatsaraForBsYear } from "@/lib/samvatsara";
import type { BalamChip } from "@/lib/api";
import {
  DenseListRow,
  DenseListTable,
  PanchangaFullRow,
  PanchangaQuadRow,
  PanchangaRow,
  PanchangaRows,
  PanchangaSection,
  PanchangaSubBlock,
  PanchangaTableBody,
  PairedTimingTable,
  TimingRange,
  UptoValue,
} from "./PanchangaLayout";
import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n/locale";

type AngaEnd = {
  name_ne?: string;
  name?: string;
  end_local_time?: string;
  end_ghati_clock?: string;
  end_hours_clock?: string;
};

type Anga = AngaEnd & {
  next?: AngaEnd;
};

function angaEndTime(anga?: AngaEnd | null): string | undefined {
  if (!anga) return undefined;
  const t =
    formatTimeShort(anga.end_local_time) ??
    formatTimeShort(anga.end_hours_clock) ??
    formatGhatiEnd(anga.end_ghati_clock);
  return t ? toNepaliDigits(t) : undefined;
}

function AngaCell({ anga }: { anga?: Anga | null }) {
  const { pick } = useLocale();
  if (!anga) return <span className="text-muted-foreground">—</span>;
  const name = pick(anga.name_ne ?? anga.name ?? "—", anga.name ?? anga.name_ne ?? "—");
  const next = anga.next;
  const nextName = next?.name_ne ?? next?.name;
  return (
    <>
      <UptoValue name={name} endTime={angaEndTime(anga)} />
      {nextName ? (
        // The next anga now carries its own end time — on a kshaya-tithi day
        // this is where the skipped tithi's ending shows (e.g. प्रतिपदा … सम्म).
        <UptoValue
          name={pick(nextName, next?.name ?? next?.name_ne ?? nextName)}
          endTime={angaEndTime(next)}
        />
      ) : null}
    </>
  );
}

export function SunMoonSamvatSection({ p }: { p: PanchangaDay }) {
  const { pick } = useLocale();
  const solar = getSolarCorrections(p);
  const belaantar = formatSolarCorrectionDisplay(solar?.belaantar);
  const deshaantar = formatSolarCorrectionDisplay(solar?.deshaantar);
  const detail = getPanchangaDetail(p);
  const bs = (detail?.bs_date ?? p.bs_date) as
    | { year?: number; month_name_ne?: string; day?: number }
    | undefined;
  const ns = formatNepalSambatDisplay(p);
  const shaka = formatShakaYear(p);
  const samvatsara = bs?.year
    ? resolveSamvatsaraForBsYear(bs.year, p.samvatsara)
    : undefined;
  const pakshaLabel =
    (detail?.paksha as { label_ne?: string } | undefined)?.label_ne ??
    p.paksha?.label_ne ??
    "—";

  return (
    <PanchangaSection titleKey="sections.sun_moon_samvat">
      <PanchangaTableBody>
        <PanchangaQuadRow
          left={{
            labelKey: "sections.sunrise",
            children: (
              <>
                <span>🌅</span>
                <span className="font-mono font-semibold">{getSunriseDisplay(p) ?? "—"}</span>
              </>
            ),
          }}
          right={{
            labelKey: "sections.vikram",
            children: (
              <span className="font-semibold">
                {bs?.year && bs.month_name_ne && bs.day
                  ? `${toNepaliDigits(bs.year)} ${bs.month_name_ne} ${toNepaliDigits(bs.day)}`
                  : (p.display?.bs_ne ?? "—")}
              </span>
            ),
          }}
        />
        <PanchangaQuadRow
          left={{
            labelKey: "sections.sunset",
            children: (
              <>
                <span>🌇</span>
                <span className="font-mono font-semibold">{getSunsetDisplay(p) ?? "—"}</span>
              </>
            ),
          }}
          right={{
            labelKey: "sections.samvatsara",
            children: (
              <span className="font-semibold">
                {samvatsara ? pick(samvatsara.name_ne, samvatsara.name_en) : "—"}
              </span>
            ),
          }}
        />
        <PanchangaQuadRow
          left={{
            labelKey: "sections.moonrise",
            children: (
              <>
                <span>🌒</span>
                <span className="font-mono font-semibold">{getMoonriseDisplay(p) ?? "—"}</span>
              </>
            ),
          }}
          right={{
            labelKey: "sections.shaka",
            children: (
              <span className="font-semibold">{shaka ? toNepaliDigits(shaka) : "—"}</span>
            ),
          }}
        />
        <PanchangaQuadRow
          left={{
            labelKey: "sections.moonset",
            children: (
              <>
                <span>🌘</span>
                <span className="font-mono font-semibold">{getMoonsetDisplay(p) ?? "—"}</span>
              </>
            ),
          }}
          right={{
            labelKey: "sections.nepal_sambat",
            children: <span className="font-semibold">{ns ?? "—"}</span>,
          }}
        />
        {belaantar ? (
          <PanchangaQuadRow
            left={{
              labelKey: "sections.equation_of_time",
              children: <span className="font-mono font-semibold">{belaantar}</span>,
            }}
            right={{
              labelKey: "sections.paksha",
              children: <span className="font-semibold">{pakshaLabel}</span>,
            }}
          />
        ) : (
          <PanchangaQuadRow
            left={{
              labelKey: "sections.paksha",
              children: <span className="font-semibold">{pakshaLabel}</span>,
            }}
          />
        )}
        {deshaantar ? (
          <PanchangaFullRow labelKey="sections.longitude_correction">
            <span className="font-mono font-semibold">{deshaantar}</span>
          </PanchangaFullRow>
        ) : null}
      </PanchangaTableBody>
      {solar?.ishtakaal_note_ne ? (
        <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground m-0 leading-snug">
          {solar.ishtakaal_note_ne}
        </p>
      ) : null}
    </PanchangaSection>
  );
}

/** @deprecated use SunMoonSamvatSection */
export function SunMoonSection({ p }: { p: PanchangaDay }) {
  return <SunMoonSamvatSection p={p} />;
}

/** @deprecated use SunMoonSamvatSection */
export function SamvatSection({ p }: { p: PanchangaDay }) {
  return null;
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
      <PanchangaTableBody>
        <PanchangaQuadRow
          left={{ labelKey: "tithi", children: <AngaCell anga={tithi} /> }}
          right={{ labelKey: "nakshatra", children: <AngaCell anga={nakshatra} /> }}
        />
        <PanchangaQuadRow
          left={{ labelKey: "sections.yoga", children: <AngaCell anga={yoga} /> }}
          right={{ labelKey: "sections.karana", children: <AngaCell anga={karana} /> }}
        />
        <PanchangaQuadRow
          left={{
            labelKey: "sections.weekday",
            children: <span className="font-semibold">{getVaaraNe(p, p.weekday) ?? "—"}</span>,
          }}
          right={{
            labelKey: "sections.paksha",
            children: (
              <>
                <span>{pakshaSym}</span>
                <span className="font-semibold">{paksha ?? "—"}</span>
              </>
            ),
          }}
        />
      </PanchangaTableBody>
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
      <PanchangaTableBody>
        <PanchangaQuadRow
          left={{
            labelKey: "sections.moon_sign",
            children:
              moonSpans.length > 0 ? (
                <div className="flex flex-col gap-0 w-full">
                  {moonSpans.map((span, i) => (
                    <span key={`moon-rashi-${i}`} className="inline-flex flex-wrap items-baseline gap-x-1.5">
                      <span className="font-semibold">{formatRashiDisplayNe(span.name_ne)}</span>
                      {formatSpanEndTime(span) ? (
                        <span className="text-[11px] font-mono font-semibold text-foreground whitespace-nowrap">
                          {formatSpanEndTime(span)} {t("sections.until")}
                        </span>
                      ) : null}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          }}
          right={{
            labelKey: "sections.sun_sign",
            children:
              suryaRashi?.name_ne || suryaRashi?.name ? (
                <span className="font-semibold">
                  {formatRashiDisplayNe(suryaRashi.name_ne ?? suryaRashi.name)}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          }}
        />
        <PanchangaQuadRow
          left={{
            labelKey: "sections.sun_nakshatra",
            children:
              suryaNak?.name_ne || suryaNak?.name ? (
                <span className="font-semibold">{suryaNak.name_ne ?? suryaNak.name}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          }}
          right={{
            labelKey: "sections.pada",
            children:
              padaSpans && padaSpans.length > 0 ? (
                <span className="text-[11px] text-muted-foreground">
                  {toNepaliDigits(padaSpans.length)} {t("sections.pada_transitions")}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          }}
        />
      </PanchangaTableBody>
      {padaSpans && padaSpans.length > 0 ? (
        <PanchangaSubBlock title={t("sections.pada_detail")}>
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1].map((col) => {
              const mid = Math.ceil(padaSpans.length / 2);
              const slice = col === 0 ? padaSpans.slice(0, mid) : padaSpans.slice(mid);
              if (!slice.length) return null;
              return (
                <DenseListTable key={`pada-col-${col}`}>
                  {slice.map((span, i) => (
                    <DenseListRow
                      key={`pada-${col}-${i}`}
                      label={
                        span.nakshatra_name_ne
                          ? `${span.nakshatra_name_ne} — ${span.pada_ne ?? toNepaliDigits(span.pada ?? "")} ${t("sections.pada_unit")}`
                          : "—"
                      }
                      time={
                        formatSpanEndTime(span)
                          ? `${formatSpanEndTime(span)} ${t("sections.until")}`
                          : undefined
                      }
                    />
                  ))}
                </DenseListTable>
              );
            })}
          </div>
        </PanchangaSubBlock>
      ) : null}
    </PanchangaSection>
  );
}

function BalamChips({ items }: { items: BalamChip[] }) {
  return (
    <div className="mb-2.5 flex flex-wrap gap-1.5">
      {items.map((it, i) => (
        <span
          key={`${it.name_ne ?? it.name}-${i}`}
          className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-1.5 text-[11.5px] font-semibold leading-none shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]"
        >
          <span>{formatRashiDisplayNe(it.name_ne)}</span>
        </span>
      ))}
    </div>
  );
}

const splitPanelGrid = "grid grid-cols-1 sm:grid-cols-2";
const splitPanelCol = "px-4 py-3 border-b border-border sm:border-b-0 sm:py-2.5";
const splitPanelColLeft = cn(splitPanelCol, "sm:border-r sm:border-border");
const splitPanelHeading =
  "mb-2 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground [&_b]:font-bold [&_b]:normal-case [&_b]:tracking-normal [&_b]:text-foreground";

export function BalamSection({ p }: { p: PanchangaDay }) {
  const { t } = useTranslation();
  const chandra = getChandrabalam(p);
  const tara = getTarabalam(p);
  const chandraTill = formatShortClock(chandra?.till?.end_local_time_short ?? chandra?.till?.end_local_time);
  const taraTill = formatShortClock(tara?.till?.end_local_time_short ?? tara?.till?.end_local_time);

  return (
    <PanchangaSection titleKey="sections.balam">
      <div className={splitPanelGrid}>
        <div className={splitPanelColLeft}>
          <h3 className={splitPanelHeading}>
            {t("sections.auspicious_chandra")}
            {chandraTill ? (
              <>
                {" "}
                — <span className="font-mono normal-case">{chandraTill}</span> {t("sections.until")}
              </>
            ) : null}
          </h3>
          <BalamChips items={chandra?.set1 ?? []} />
          <h3 className={cn(splitPanelHeading, "mt-3")}>{t("sections.until_sunrise")}</h3>
          <BalamChips items={chandra?.set2 ?? []} />
        </div>
        <div className={splitPanelCol}>
          <h3 className={splitPanelHeading}>
            {t("sections.auspicious_tara")}
            {taraTill ? (
              <>
                {" "}
                — <span className="font-mono normal-case">{taraTill}</span> {t("sections.until")}
              </>
            ) : null}
          </h3>
          <BalamChips items={tara?.set1 ?? []} />
          <h3 className={cn(splitPanelHeading, "mt-3")}>{t("sections.until_sunrise")}</h3>
          <BalamChips items={tara?.set2 ?? []} />
        </div>
      </div>
    </PanchangaSection>
  );
}

export function PanchakaLagnaSection({ p }: { p: PanchangaDay }) {
  const { t } = useTranslation();
  const { pick } = useLocale();
  const panchaka = getPanchakaRahita(p) ?? [];
  const lagna = getUdayaLagna(p) ?? [];
  const rowCount = Math.max(panchaka.length, lagna.length);

  if (!rowCount) return null;

  const rows = Array.from({ length: rowCount }, (_, i) => {
    const pr = panchaka[i];
    const lg = lagna[i];
    return {
      left: pr
        ? {
            label: pick(pr.name_ne ?? pr.name ?? "—", pr.name ?? pr.name_ne ?? "—"),
            time:
              formatTimeRangeShort(
                pr.start_local_time_short ?? pr.start_local_time,
                pr.end_local_time_short ?? pr.end_local_time,
              ) ?? undefined,
            highlight: pr.good,
          }
        : undefined,
      right: lg
        ? {
            label: formatRashiDisplayNe(lg.name_ne ?? lg.name),
            time:
              formatTimeRangeShort(
                lg.start_local_time_short ?? lg.start_local_time,
                lg.end_local_time_short ?? lg.end_local_time,
              ) ?? undefined,
            note: lg.pushkara_navamsha?.length
              ? `${t("sections.pushkara")}: ${lg.pushkara_navamsha
                  .map((h) => formatShortClock(h.local_time_short ?? h.local_time))
                  .filter(Boolean)
                  .join(", ")}`
              : undefined,
          }
        : undefined,
    };
  });

  return (
    <PanchangaSection titleKey="sections.panchaka_lagna">
      <PairedTimingTable
        leftTitle={t("sections.today_panchaka")}
        rightTitle={t("sections.today_udaya_lagna")}
        rows={rows}
      />
    </PanchangaSection>
  );
}

function DualValueDisplay({
  pauranikLabel,
  vedicLabel,
  differs,
}: {
  pauranikLabel?: string;
  vedicLabel?: string;
  differs?: boolean;
}) {
  const showStrike =
    differs ??
    (pauranikLabel != null && vedicLabel != null && pauranikLabel !== vedicLabel);

  if (!pauranikLabel && !vedicLabel) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {showStrike && pauranikLabel ? (
        <span className="line-through text-muted-foreground font-medium">{pauranikLabel}</span>
      ) : null}
      <span className="font-semibold">{vedicLabel ?? pauranikLabel}</span>
    </div>
  );
}

export function RituSection({ p }: { p: PanchangaDay }) {
  const { lang } = useLocale();
  const rituPauranik = getRituPauranik(p);
  const rituVedic = getRituVedic(p);
  const aayanPauranik = getAayanPauranik(p);
  const aayanVedic = getAayanVedic(p);

  return (
    <PanchangaSection titleKey="sections.ritu_ayana">
      <PanchangaTableBody>
        <PanchangaQuadRow
          left={{
            labelKey: "sections.ritu",
            children: (
              <DualValueDisplay
                pauranikLabel={formatRituLabel(rituPauranik, lang)}
                vedicLabel={formatRituLabel(rituVedic, lang)}
                differs={rituPauranik?.name !== rituVedic?.name}
              />
            ),
          }}
          right={{
            labelKey: "sections.ayana",
            children: (
              <DualValueDisplay
                pauranikLabel={formatAayanLabel(aayanPauranik, lang)}
                vedicLabel={formatAayanLabel(aayanVedic, lang)}
                differs={aayanPauranik?.name !== aayanVedic?.name}
              />
            ),
          }}
        />
        <PanchangaQuadRow
          left={{
            labelKey: "sections.dinamana",
            children: (
              <span className="font-mono font-semibold">
                {formatDurationFull(p, "dinamaan", lang) ?? "—"}
              </span>
            ),
          }}
          right={{
            labelKey: "sections.ratrimana",
            children: (
              <span className="font-mono font-semibold">
                {formatDurationFull(p, "ratrimana", lang) ?? "—"}
              </span>
            ),
          }}
        />
        <PanchangaQuadRow
          left={{
            labelKey: "sections.madhyahna",
            children: (
              <span className="font-mono font-semibold">
                {formatMadhyahnaDisplay(p, lang) ?? "—"}
              </span>
            ),
          }}
        />
      </PanchangaTableBody>
    </PanchangaSection>
  );
}

export function MuhurtaTimingsSection({ p }: { p: PanchangaDay }) {
  const { t } = useTranslation();
  const rows = getMuhurtaRows(p);
  const good = rows.filter((r) => r.auspicious);
  const bad = rows.filter((r) => !r.auspicious);

  if (!rows.length) return null;

  if (good.length > 0 && bad.length > 0) {
    return (
      <PanchangaSection titleKey="sections.muhurta_timings">
        <div className={splitPanelGrid}>
          <div className={splitPanelColLeft}>
            <h3 className={splitPanelHeading}>{t("sections.auspicious_timings")}</h3>
            <PanchangaTableBody>
              {good.map((row) => (
                <PanchangaFullRow key={row.label} label={row.label}>
                  <TimingRange
                    start={row.value.split(" – ")[0]}
                    end={row.value.split(" – ")[1]?.split(" (")[0]}
                    variant="good"
                  />
                </PanchangaFullRow>
              ))}
            </PanchangaTableBody>
          </div>
          <div className={splitPanelCol}>
            <h3 className={splitPanelHeading}>{t("sections.inauspicious_timings")}</h3>
            <PanchangaTableBody>
              {bad.map((row) => (
                <PanchangaFullRow key={row.label} label={row.label}>
                  <TimingRange
                    start={row.value.split(" – ")[0]}
                    end={row.value.split(" – ")[1]}
                    variant="bad"
                  />
                </PanchangaFullRow>
              ))}
            </PanchangaTableBody>
          </div>
        </div>
      </PanchangaSection>
    );
  }

  return (
    <>
      {good.length > 0 && (
        <PanchangaSection titleKey="sections.auspicious_timings">
          <PanchangaTableBody>
            {good.map((row) => (
              <PanchangaFullRow key={row.label} label={row.label}>
                <TimingRange
                  start={row.value.split(" – ")[0]}
                  end={row.value.split(" – ")[1]?.split(" (")[0]}
                  variant="good"
                />
              </PanchangaFullRow>
            ))}
          </PanchangaTableBody>
        </PanchangaSection>
      )}
      {bad.length > 0 && (
        <PanchangaSection titleKey="sections.inauspicious_timings">
          <PanchangaTableBody>
            {bad.map((row) => (
              <PanchangaFullRow key={row.label} label={row.label}>
                <TimingRange
                  start={row.value.split(" – ")[0]}
                  end={row.value.split(" – ")[1]}
                  variant="bad"
                />
              </PanchangaFullRow>
            ))}
          </PanchangaTableBody>
        </PanchangaSection>
      )}
    </>
  );
}

function NivasDirectionValue({
  segment,
  lang,
}: {
  segment?: NivasShoolSegment | null;
  lang: "ne" | "en" | "hi";
}) {
  const { pick } = useLocale();
  if (!segment) return <span className="text-muted-foreground">—</span>;
  const name = pick(segment.name_ne ?? segment.name_en ?? "—", segment.name_en ?? segment.name_ne ?? "—");
  return <span className="font-semibold">{name}</span>;
}

function NivasTimedSegments({
  segments,
  lang,
  showSubtitle = false,
  showSymbol = false,
  showGuna = false,
}: {
  segments?: NivasShoolSegment[];
  lang: "ne" | "en" | "hi";
  showSubtitle?: boolean;
  showSymbol?: boolean;
  showGuna?: boolean;
}) {
  const { t } = useTranslation();
  const { pick } = useLocale();
  if (!segments?.length) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="flex flex-col gap-1 min-w-0">
      {segments.map((seg, idx) => {
        const name = pick(seg.name_ne ?? seg.name_en ?? "—", seg.name_en ?? seg.name_ne ?? "—");
        const subtitle = showSubtitle
          ? pick(seg.subtitle_ne ?? seg.subtitle_en ?? "", seg.subtitle_en ?? seg.subtitle_ne ?? "")
          : "";
        const endTime = seg.end_local_time_short
          ? toNepaliDigits(formatTimeShort(seg.end_local_time_short) ?? seg.end_local_time_short)
          : undefined;
        const gunaLabel =
          showGuna && seg.is_auspicious !== undefined
            ? seg.is_auspicious
              ? t("sections.nivas_auspicious")
              : t("sections.nivas_inauspicious")
            : undefined;
        const fromTime = seg.start_local_time_short
          ? toNepaliDigits(formatTimeShort(seg.start_local_time_short) ?? seg.start_local_time_short)
          : undefined;

        return (
          <div key={`${name}-${idx}`} className="min-w-0">
            {fromTime && !endTime ? (
              <span className="font-semibold">
                {subtitle ? `${name} (${subtitle})` : name}
                {" "}
                <span className="text-[11px] font-mono font-semibold text-foreground">
                  {t("sections.nivas_from")} {fromTime} {t("sections.nivas_to_full_night")}
                </span>
              </span>
            ) : (
              <UptoValue
                sym={showSymbol ? seg.symbol : undefined}
                name={subtitle ? `${name} (${subtitle})` : name}
                endTime={endTime}
                badge={gunaLabel}
              />
            )}
            {seg.until_full_night && idx === segments.length - 1 && segments.length > 1 && !endTime ? (
              <span className="text-[11px] font-mono font-semibold text-foreground">
                {t("sections.nivas_to_full_night")}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function NivasShoolSection({ p }: { p: PanchangaDay }) {
  const { lang } = useLocale();
  const ns = getNivasShool(p);
  if (!ns) return null;

  const disha = ns.disha_shool;
  const rahu = ns.rahu_vasa;

  return (
    <PanchangaSection titleKey="sections.nivas_shool">
      <PanchangaTableBody>
        <PanchangaQuadRow
          left={{
            labelKey: "sections.homahuti",
            children: (
              <NivasTimedSegments
                segments={ns.homahuti?.segments}
                lang={lang}
                showSymbol
              />
            ),
          }}
          right={{
            labelKey: "sections.disha_shool",
            children: <NivasDirectionValue segment={disha} lang={lang} />,
          }}
        />
        <PanchangaQuadRow
          left={{
            labelKey: "sections.rahu_vasa",
            children: <NivasDirectionValue segment={rahu} lang={lang} />,
          }}
          right={{
            labelKey: "sections.agnivasa",
            children: (
              <NivasTimedSegments
                segments={ns.agnivasa?.segments}
                lang={lang}
                showSubtitle
              />
            ),
          }}
        />
        <PanchangaQuadRow
          left={{
            labelKey: "sections.chandra_vasa",
            children: (
              <NivasTimedSegments segments={ns.chandra_vasa?.segments} lang={lang} />
            ),
          }}
          right={{
            labelKey: "sections.shivavasa",
            children: (
              <NivasTimedSegments segments={ns.shivavasa?.segments} lang={lang} />
            ),
          }}
        />
        {ns.bhadravasa?.active ? (
          <PanchangaQuadRow
            left={{
              labelKey: "sections.bhadravasa",
              children: (
                <NivasTimedSegments
                  segments={ns.bhadravasa.segments}
                  lang={lang}
                  showSubtitle
                />
              ),
            }}
            right={{
              labelKey: "sections.kumbha_chakra",
              children: (
                <NivasTimedSegments
                  segments={ns.kumbha_chakra?.segments}
                  lang={lang}
                  showGuna
                />
              ),
            }}
          />
        ) : (
          <PanchangaQuadRow
            left={{
              labelKey: "sections.kumbha_chakra",
              children: (
                <NivasTimedSegments
                  segments={ns.kumbha_chakra?.segments}
                  lang={lang}
                  showGuna
                />
              ),
            }}
          />
        )}
      </PanchangaTableBody>
    </PanchangaSection>
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
            className="text-[11.5px] font-semibold px-2.5 py-1.5 rounded-full bg-secondary/12 text-secondary dark:text-accent border border-secondary/20"
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
  const { lang } = useLocale();
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
        <span className="text-[11.5px] text-muted-foreground">{getPlanetsAnchorLabel(p, lang)}</span>
      </div>
      <div className="flex flex-col">
        {lagna && (
          <div className="flex items-center gap-3 py-2 border-b border-border">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-[15px] bg-secondary/11 text-secondary dark:text-accent shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]">
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
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-[15px] bg-secondary/11 text-secondary dark:text-accent shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]">
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
  const { pick } = useLocale();
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
                : "text-[11.5px] font-semibold px-2.5 py-1.5 rounded-full bg-secondary/12 text-secondary dark:text-accent border border-secondary/20"
            }
          >
            {pick(f.name_ne ?? f.name ?? "", f.name_en ?? f.name ?? f.name_ne ?? "")}
          </span>
        ))}
      </div>
    </PanchangaSection>
  );
}
