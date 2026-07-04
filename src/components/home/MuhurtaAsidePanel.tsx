import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import type { PanchangaDay } from "@/lib/api";
import {
  buildDayTimelineData,
  choghadiyaQuality,
  choghadiyaTone,
  ghatiToCivilClockLabel,
} from "@/components/panchanga/day-timeline-data";
import { getApiHora } from "@/components/panchanga/day-timeline-data";
import {
  formatClockNepali,
  formatTimeRangeShort,
  getPanchangaDetail,
  getSunrise,
  getUdayaLagna,
  toNepaliDigits,
} from "@/lib/panchanga-format";
import {
  patroEmpty,
  patroMiniSubTab,
  patroNavataraRow,
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

const MOON_REF_KEY: Partial<Record<MuhurtaSubTab, string>> = {
  tarabal: "muhurta_aside.moon_ref_tarabal",
  chandrabal: "muhurta_aside.moon_ref_chandrabal",
};

/** Server navatara row from the daily payload's detail.navatara block. */
type NavataraEntry = {
  name: string;
  nameEn?: string;
  tara: string;
  taraEn?: string;
  quality: string;
  tone: "best" | "good" | "neutral" | "bad" | "worst";
  taraNum: number;
};

type NavataraBlock = {
  tarabala?: { moonLabel: string | null; rows: NavataraEntry[] };
  chandrabala?: { moonLabel: string | null; rows: NavataraEntry[] };
};

function getNavatara(p: PanchangaDay): NavataraBlock {
  const detail = getPanchangaDetail(p);
  return (detail?.navatara as NavataraBlock | undefined) ?? {};
}

function parseTimeToMinutes(time?: string | null): number | null {
  if (!time) return null;
  const m = time.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function NavataraList({
  moonLabel,
  rows,
  moonRefKind,
  highlightName,
}: {
  moonLabel: string | null;
  rows: NavataraEntry[];
  moonRefKind: "tarabal" | "chandrabal";
  highlightName?: string | null;
}) {
  const { t } = useTranslation();
  if (!rows.length) {
    return <p className={patroEmpty}>{t("muhurta_aside.unavailable")}</p>;
  }

  const moonRefKey = MOON_REF_KEY[moonRefKind];

  return (
    <div>
      {moonLabel && moonRefKey ? (
        <p className="mb-2 text-[12.5px] font-semibold text-foreground">
          {t(moonRefKey)}: <strong className="text-accent">{moonLabel}</strong>
        </p>
      ) : null}
      <ul className="m-0 grid list-none grid-cols-2 gap-1 p-0">
        {rows.map((row) => {
          const isMoon =
            highlightName != null
              ? row.name === highlightName
              : row.taraNum === 1 && row.name === moonLabel;
          return (
            <li key={row.name} className={patroNavataraRow(row.tone, isMoon)}>
              <span className="text-xs font-bold leading-tight text-foreground">{row.name}</span>
              <span className="text-[10.5px] leading-snug font-semibold text-muted-foreground">
                {row.tara}
                <span className="mx-1 opacity-55">/</span>
                {row.quality}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
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
  const navatara = getNavatara(p);
  const tara = navatara.tarabala ?? { moonLabel: null, rows: [] };
  const chandra = navatara.chandrabala ?? { moonLabel: null, rows: [] };

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
          <NavataraList
            moonLabel={tara.moonLabel}
            rows={tara.rows}
            moonRefKind="tarabal"
            highlightName={tara.moonLabel}
          />
        ) : null}
        {subTab === "chandrabal" ? (
          <NavataraList
            moonLabel={chandra.moonLabel}
            rows={chandra.rows}
            moonRefKind="chandrabal"
            highlightName={chandra.moonLabel}
          />
        ) : null}
        {subTab === "choghadiya" ? <ChoghadiyaList p={p} dateAd={dateAd} /> : null}
        {subTab === "hora" ? <HoraList p={p} /> : null}
        {subTab === "pushkara" ? <PushkaraList p={p} /> : null}
      </div>
    </div>
  );
}
