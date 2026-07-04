import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import type { BalamBlock, PanchangaDay } from "@/lib/api";
import {
  buildDayTimelineData,
  choghadiyaQuality,
  choghadiyaTone,
  ghatiToCivilClockLabel,
} from "@/components/panchanga/day-timeline-data";
import { getApiHora } from "@/components/panchanga/day-timeline-data";
import {
  formatClockNepali,
  formatRashiDisplayNe,
  formatShortClock,
  formatTimeRangeShort,
  getChandrabalam,
  getPanchangaDetail,
  getSunrise,
  getTarabalam,
  getUdayaLagna,
  rashiSymFromNumber,
  toNepaliDigits,
} from "@/lib/panchanga-format";
import {
  patroEmpty,
  patroMiniSubTab,
  patroSlotBadge,
  patroSlotRow,
} from "@/lib/patro-classes";

type MuhurtaSubTab = "tarabal" | "chandrabal" | "choghadiya" | "hora" | "pushkara";

const SUB_TABS: { id: MuhurtaSubTab; labelKey: string }[] = [
  { id: "tarabal", labelKey: "muhurta_aside.tarabal" },
  { id: "chandrabal", labelKey: "muhurta_aside.chandrabal" },
  { id: "choghadiya", labelKey: "muhurta_aside.choghadiya" },
  { id: "hora", labelKey: "muhurta_aside.hora" },
  { id: "pushkara", labelKey: "muhurta_aside.pushkara" },
];

const SUB_TAB_HINT_KEY: Record<MuhurtaSubTab, string> = {
  tarabal: "muhurta_aside.hint_tarabal",
  chandrabal: "muhurta_aside.hint_chandrabal",
  choghadiya: "muhurta_aside.hint_choghadiya",
  hora: "muhurta_aside.hint_hora",
  pushkara: "muhurta_aside.hint_pushkara",
};

function parseTimeToMinutes(time?: string | null): number | null {
  if (!time) return null;
  const m = time.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function BalamAsideList({
  block,
  moonLabel,
  moonRefKey,
  rashi = false,
}: {
  block: BalamBlock | undefined;
  moonLabel: string | null;
  moonRefKey: string;
  rashi?: boolean;
}) {
  const { t } = useTranslation();
  const set1 = block?.set1 ?? [];
  const set2 = block?.set2 ?? [];
  const till = formatShortClock(block?.till?.end_local_time_short ?? block?.till?.end_local_time);

  if (!set1.length && !set2.length) {
    return <p className={patroEmpty}>{t("muhurta_aside.unavailable")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {moonLabel ? (
        <p className="m-0 text-[12.5px] font-semibold text-foreground">
          {t(moonRefKey)}: <strong className="text-accent">{moonLabel}</strong>
        </p>
      ) : null}

      {set1.length ? (
        <div>
          <h3 className="my-0 mb-2 text-[11.5px] font-medium text-muted-foreground">
            {rashi ? t("sections.auspicious_chandra") : t("sections.auspicious_tara")}
            {till ? (
              <>
                {" "}
                — <span className="font-mono">{till}</span> {t("sections.until")}
              </>
            ) : null}
          </h3>
          <ul className="m-0 grid list-none grid-cols-2 gap-1 p-0">
            {set1.map((item, i) => (
              <li
                key={`${item.name_ne ?? item.name}-${i}`}
                className="flex items-center gap-1.5 rounded-md bg-surface-inset px-2 py-1.5"
              >
                {rashi && item.number != null ? (
                  <span className="text-[13px] leading-none">{rashiSymFromNumber(item.number)}</span>
                ) : null}
                <span className="text-xs font-bold leading-tight text-foreground">
                  {rashi ? formatRashiDisplayNe(item.name_ne) : item.name_ne}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {set2.length ? (
        <div>
          <h3 className="my-0 mb-2 text-[11.5px] font-medium text-muted-foreground">
            {t("sections.until_sunrise")}
          </h3>
          <ul className="m-0 grid list-none grid-cols-2 gap-1 p-0">
            {set2.map((item, i) => (
              <li
                key={`${item.name_ne ?? item.name}-next-${i}`}
                className="flex items-center gap-1.5 rounded-md bg-surface-inset px-2 py-1.5"
              >
                {rashi && item.number != null ? (
                  <span className="text-[13px] leading-none">{rashiSymFromNumber(item.number)}</span>
                ) : null}
                <span className="text-xs font-bold leading-tight text-foreground">
                  {rashi ? formatRashiDisplayNe(item.name_ne) : item.name_ne}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function moonNakshatraLabel(p: PanchangaDay): string | null {
  const detail = getPanchangaDetail(p);
  const nak = (detail?.nakshatra ?? p.nakshatra) as { name_ne?: string; name?: string } | undefined;
  return nak?.name_ne ?? nak?.name ?? null;
}

function moonRashiLabel(p: PanchangaDay): string | null {
  const detail = getPanchangaDetail(p);
  const rashi = (detail?.chandra_rashi ?? p.chandra_rashi) as
    | { name_ne?: string; name?: string }
    | undefined;
  const label = rashi?.name_ne ?? rashi?.name;
  return label ? formatRashiDisplayNe(label) : null;
}

function ChoghadiyaList({ p, dateAd }: { p: PanchangaDay; dateAd: string }) {
  const { t } = useTranslation();
  const timeline = buildDayTimelineData(p, dateAd);
  const sunriseMin = parseTimeToMinutes(getSunrise(p));

  if (!timeline?.choghadiya.length || sunriseMin == null) {
    return <p className={patroEmpty}>{t("muhurta_aside.choghadiya_unavailable")}</p>;
  }

  const dayG = timeline.dayG;

  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-1 p-0">
      {timeline.choghadiya.map((seg, i) => {
        const tone = choghadiyaTone(seg.name, seg.bad);
        const quality = choghadiyaQuality(seg.name, seg.bad);
        const phase = seg.startG < dayG ? t("muhurta_aside.phase_day") : t("muhurta_aside.phase_night");
        const range = `${ghatiToCivilClockLabel(seg.startG, sunriseMin)} – ${ghatiToCivilClockLabel(seg.endG, sunriseMin)}`;
        return (
          <li
            key={`${seg.name}-${i}`}
            className={patroSlotRow(tone, seg.startG >= dayG && i === 8)}
          >
            <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
              <span className="text-[9.5px] font-semibold tracking-wide text-muted-foreground uppercase">
                {phase}
              </span>
              <span className="text-xs font-bold leading-tight">{seg.name}</span>
              <span className="mono text-[10px] font-semibold whitespace-nowrap">{range}</span>
            </div>
            <span className={patroSlotBadge(tone)}>{quality}</span>
          </li>
        );
      })}
    </ul>
  );
}

function HoraList({ p }: { p: PanchangaDay }) {
  const { t } = useTranslation();
  const slots = getApiHora(p);

  if (!slots.length) {
    return <p className={patroEmpty}>{t("muhurta_aside.hora_unavailable")}</p>;
  }

  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-1 p-0">
      {slots.map((slot, i) => {
        const start = formatClockNepali(slot.start_local_time_short) ?? slot.start_local_time_short;
        const end = formatClockNepali(slot.end_local_time_short) ?? slot.end_local_time_short;
        return (
          <li key={`${slot.phase}-${slot.index}-${i}`} className={patroSlotRow(slot.tone)}>
            <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
              <span className="text-[9.5px] font-semibold tracking-wide text-muted-foreground uppercase">
                {slot.phase_ne}
              </span>
              <span className="text-xs font-bold leading-tight">{slot.planet_ne}</span>
              <span className="mono text-[10px] font-semibold whitespace-nowrap">
                {toNepaliDigits(slot.index)}
                <span className="mx-0.5 opacity-50">·</span>
                {start} – {end}
              </span>
            </div>
            <span className={patroSlotBadge(slot.tone)}>{slot.quality_ne}</span>
          </li>
        );
      })}
    </ul>
  );
}

function PushkaraList({ p }: { p: PanchangaDay }) {
  const { t } = useTranslation();
  const rows = getUdayaLagna(p);

  if (!rows?.length) {
    return <p className={patroEmpty}>{t("muhurta_aside.pushkara_unavailable")}</p>;
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {rows.map((row, i) => {
        const range =
          formatTimeRangeShort(
            row.start_local_time_short ?? row.start_local_time,
            row.end_local_time_short ?? row.end_local_time,
          ) ?? "—";
        const hits = row.pushkara_navamsha ?? [];
        return (
          <li key={`${row.name}-${i}`} className="flex flex-col gap-1 rounded-md bg-surface-inset p-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[13px] font-bold text-foreground">{row.name_ne ?? row.name}</span>
              <span className="mono text-xs font-semibold whitespace-nowrap text-muted-foreground">{range}</span>
            </div>
            {hits.length ? (
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs">
                <span className="text-[11.5px] font-semibold text-muted-foreground">
                  {t("muhurta_aside.pushkara_label")}
                </span>
                {hits.map((hit, j) => (
                  <span
                    key={j}
                    className="mono rounded-full bg-pushkara-hit px-1.5 py-0.5 text-xs font-bold text-accent"
                  >
                    {formatClockNepali(hit.local_time_short ?? hit.local_time) ?? hit.local_time_short}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs font-medium text-muted-foreground">—</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

type Props = {
  p: PanchangaDay;
  dateAd: string;
};

export function MuhurtaAsidePanel({ p, dateAd }: Props) {
  const { t } = useTranslation();
  const [subTab, setSubTab] = useState<MuhurtaSubTab>("tarabal");
  const tarabalam = getTarabalam(p);
  const chandrabalam = getChandrabalam(p);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-5 gap-1" role="tablist" aria-label={t("muhurta_aside.tabs_label")}>
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className={patroMiniSubTab(subTab === tab.id)}
            aria-selected={subTab === tab.id}
            onClick={() => setSubTab(tab.id)}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <p className="m-0 flex items-start gap-1.5 text-[11.5px] leading-snug font-medium text-muted-foreground">
        <Info size={13} strokeWidth={2} className="mt-px shrink-0 opacity-75" aria-hidden />
        <span>{t(SUB_TAB_HINT_KEY[subTab])}</span>
      </p>

      <div role="tabpanel">
        {subTab === "tarabal" ? (
          <BalamAsideList
            block={tarabalam}
            moonLabel={moonNakshatraLabel(p)}
            moonRefKey="muhurta_aside.moon_ref_tarabal"
          />
        ) : null}
        {subTab === "chandrabal" ? (
          <BalamAsideList
            block={chandrabalam}
            moonLabel={moonRashiLabel(p)}
            moonRefKey="muhurta_aside.moon_ref_chandrabal"
            rashi
          />
        ) : null}
        {subTab === "choghadiya" ? <ChoghadiyaList p={p} dateAd={dateAd} /> : null}
        {subTab === "hora" ? <HoraList p={p} /> : null}
        {subTab === "pushkara" ? <PushkaraList p={p} /> : null}
      </div>
    </div>
  );
}
