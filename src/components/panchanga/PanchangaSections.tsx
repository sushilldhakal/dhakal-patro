import type { PanchangaDay } from "@/lib/api";
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
  getPanchangaDetail,
  getPlanetRows,
  getSunrise,
  getSunset,
  getVaaraNe,
  toNepaliDigits,
} from "@/lib/panchanga-format";
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
  return (
    <PanchangaSection titleNe="सूर्योदय र चन्द्रोदय" titleEn="Sunrise & Moonrise">
      <PanchangaRows>
        <PanchangaRow label="सूर्योदय" labelEn="Sunrise" oddBorder>
          <span>🌅</span>
          <span className="font-mono">{getSunrise(p) ?? "—"}</span>
        </PanchangaRow>
        <PanchangaRow label="सूर्यास्त" labelEn="Sunset">
          <span>🌇</span>
          <span className="font-mono">{getSunset(p) ?? "—"}</span>
        </PanchangaRow>
        <PanchangaRow label="चन्द्रोदय" labelEn="Moonrise" oddBorder>
          <span>🌒</span>
          <span className="font-mono">{getMoonriseDisplay(p) ?? "—"}</span>
        </PanchangaRow>
        <PanchangaRow label="चन्द्रास्त" labelEn="Moonset">
          <span>🌘</span>
          <span className="font-mono">{getMoonsetDisplay(p) ?? "—"}</span>
        </PanchangaRow>
      </PanchangaRows>
    </PanchangaSection>
  );
}

export function PanchangCoreSection({ p }: { p: PanchangaDay }) {
  const detail = getPanchangaDetail(p);
  const tithi = (detail?.tithi ?? p.tithi) as Anga | undefined;
  const nakshatra = (detail?.nakshatra ?? p.nakshatra) as Anga | undefined;
  const yoga = (detail?.yoga ?? p.yoga) as Anga | undefined;
  const karana = (detail?.karana ?? p.karana) as Anga | undefined;
  const paksha = formatPakshaNepaliDisplay(p);
  const pakshaName = (detail?.paksha as { name?: string } | undefined)?.name;
  const pakshaSym = pakshaName === "shukla" ? "🌕" : "🌑";

  return (
    <PanchangaSection titleNe="पञ्चाङ्ग" titleEn="Panchang">
      <PanchangaRows>
        <PanchangaRow label="तिथि" labelEn="Tithi" oddBorder>
          <AngaCell anga={tithi} />
        </PanchangaRow>
        <PanchangaRow label="नक्षत्र" labelEn="Nakshatra">
          <span className="inline-flex items-center gap-2.5 flex-wrap">
            <NakshatraIcon
              name={nakshatra?.name_ne ?? nakshatra?.name}
              size={32}
              className="text-secondary dark:text-[var(--brand-yellow)]"
            />
            <AngaCell anga={nakshatra} />
          </span>
        </PanchangaRow>
        <PanchangaRow label="योग" labelEn="Yoga" oddBorder>
          <AngaCell anga={yoga} />
        </PanchangaRow>
        <PanchangaRow label="करण" labelEn="Karana">
          <AngaCell anga={karana} />
        </PanchangaRow>
        <PanchangaRow label="वार" labelEn="Weekday" oddBorder>
          <span className="font-semibold">{getVaaraNe(p, p.weekday) ?? "—"}</span>
        </PanchangaRow>
        <PanchangaRow label="पक्ष" labelEn="Paksha">
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
    <PanchangaSection titleNe="चन्द्रमास र संवत्" titleEn="Lunar month & Samvat">
      <PanchangaRows>
        <PanchangaRow label="विक्रम संवत्" labelEn="Vikram" oddBorder>
          <span className="font-semibold">
            {bs?.year && bs.month_name_ne && bs.day
              ? `${toNepaliDigits(bs.year)} ${bs.month_name_ne} ${toNepaliDigits(bs.day)}`
              : (p.display?.bs_ne ?? "—")}
          </span>
        </PanchangaRow>
        <PanchangaRow label="शक संवत्" labelEn="Shaka">
          <span className="font-semibold">{shaka ? toNepaliDigits(shaka) : "—"}</span>
        </PanchangaRow>
        <PanchangaRow label="नेपाल संवत्" labelEn="Nepal Sambat" oddBorder>
          <span className="font-semibold">{ns ?? "—"}</span>
        </PanchangaRow>
        <PanchangaRow label="पक्ष" labelEn="Paksha">
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
  const detail = getPanchangaDetail(p);
  const chandra = (detail?.chandra_rashi as { name_ne?: string } | undefined)?.name_ne ??
    p.chandra_rashi?.name_ne;

  return (
    <PanchangaSection titleNe="राशि" titleEn="Rashi">
      <PanchangaRows>
        <PanchangaRow label="चन्द्र राशि" labelEn="Moonsign" oddBorder>
          <span className="font-semibold">{chandra ?? "—"}</span>
        </PanchangaRow>
        <PanchangaRow label="नक्षत्र" labelEn="Nakshatra">
          <span className="inline-flex items-center gap-2.5">
            <NakshatraIcon
              name={
                (detail?.nakshatra as Anga | undefined)?.name_ne ??
                p.nakshatra?.name_ne ??
                p.nakshatra?.name
              }
              size={30}
              className="text-secondary dark:text-[var(--brand-yellow)]"
            />
            <span className="font-semibold">
              {(detail?.nakshatra as Anga | undefined)?.name_ne ?? p.nakshatra?.name_ne ?? "—"}
            </span>
          </span>
        </PanchangaRow>
      </PanchangaRows>
    </PanchangaSection>
  );
}

export function RituSection({ p }: { p: PanchangaDay }) {
  const detail = getPanchangaDetail(p);
  const ritu = (detail?.ritu as { name_ne?: string; season?: string } | undefined);
  const aayan = (detail?.aayan as { name_ne?: string } | undefined)?.name_ne ??
    p.aayan?.name_ne ??
    p.aayan?.name;

  return (
    <PanchangaSection titleNe="ऋतु र अयन" titleEn="Ritu & Ayana">
      <PanchangaRows>
        <PanchangaRow label="ऋतु" labelEn="Ritu" oddBorder>
          <span>☀</span>
          <span className="font-semibold">{ritu?.name_ne ?? p.ritu?.name_ne ?? "—"}</span>
          {ritu?.season && (
            <span className="text-xs text-muted-foreground">({ritu.season})</span>
          )}
        </PanchangaRow>
        <PanchangaRow label="दिनमान" labelEn="Dinamana">
          <span className="font-mono font-semibold">{formatDinamaanShort(p) ?? "—"}</span>
        </PanchangaRow>
        <PanchangaRow label="अयन" labelEn="Ayana" oddBorder>
          <span className="font-semibold">{aayan ?? "—"}</span>
        </PanchangaRow>
        <PanchangaRow label="तिथि" labelEn="Tithi">
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
        <PanchangaSection titleNe="शुभ समय" titleEn="Auspicious timings">
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
        <PanchangaSection titleNe="अशुभ समय" titleEn="Inauspicious timings">
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
    <PanchangaSection titleNe="दिन विशेष" titleEn="Special observances">
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
  const planets = getPlanetRows(p);
  if (!planets.length) return null;

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
        <h2 className="text-base font-bold m-0">ग्रह स्थिति</h2>
        <span className="text-[11.5px] text-muted-foreground">Planets at sunrise</span>
      </div>
      <div className="flex flex-col">
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
            <span className="font-mono text-[11.5px] font-semibold text-muted-foreground whitespace-nowrap">
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
    <PanchangaSection titleNe="कार्यक्रमहरू" titleEn="Festivals">
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
