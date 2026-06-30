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
import {
  buildChandraBalaTable,
  buildTaraBalaTable,
  type NavataraEntry,
} from "@/lib/navatara-bala";
import { buildHoraSchedule, formatMinutesClock, horaQuality, horaTone } from "@/lib/hora-schedule";
import {
  formatClockNepali,
  formatTimeRangeShort,
  getSunrise,
  getSunset,
  getUdayaLagna,
  toNepaliDigits,
} from "@/lib/panchanga-format";

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
    return <p className="pn-aside-tab-empty">{t("muhurta_aside.unavailable")}</p>;
  }

  const moonRefKey = MOON_REF_KEY[moonRefKind];

  return (
    <div className="pn-aside-navatara">
      {moonLabel && moonRefKey ? (
        <p className="pn-aside-navatara-moon">
          {t(moonRefKey)}: <strong>{moonLabel}</strong>
        </p>
      ) : null}
      <ul className="pn-aside-navatara-list">
        {rows.map((row) => {
          const isMoon =
            highlightName != null
              ? row.name === highlightName
              : row.taraNum === 1 && row.name === moonLabel;
          return (
            <li
              key={row.name}
              className={`pn-aside-navatara-row tone-${row.tone}${isMoon ? " current" : ""}`}
            >
              <span className="pn-aside-navatara-name">{row.name}</span>
              <span className="pn-aside-navatara-meta">
                {row.tara}
                <span className="pn-aside-navatara-sep">/</span>
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
    return <p className="pn-aside-tab-empty">{t("muhurta_aside.choghadiya_unavailable")}</p>;
  }

  const dayG = timeline.dayG;

  return (
    <ul className="pn-aside-choghadiya-list">
      {timeline.choghadiya.map((seg, i) => {
        const tone = choghadiyaTone(seg.name, seg.bad);
        const quality = choghadiyaQuality(seg.name, seg.bad);
        const phase = seg.startG < dayG ? t("muhurta_aside.phase_day") : t("muhurta_aside.phase_night");
        const range = `${ghatiToCivilClockLabel(seg.startG, sunriseMin)} – ${ghatiToCivilClockLabel(seg.endG, sunriseMin)}`;
        return (
          <li
            key={`${seg.name}-${i}`}
            className={`pn-aside-choghadiya-row ${tone}${seg.startG >= dayG && i === 8 ? " night-start" : ""}`}
          >
            <div className="pn-aside-slot-body">
              <span className="pn-aside-choghadiya-phase">{phase}</span>
              <span className="pn-aside-choghadiya-name">{seg.name}</span>
              <span className="pn-aside-choghadiya-time mono">{range}</span>
            </div>
            <span className={`pn-aside-slot-badge ${tone}`}>{quality}</span>
          </li>
        );
      })}
    </ul>
  );
}

function HoraList({ p, dateAd }: { p: PanchangaDay; dateAd: string }) {
  const { t } = useTranslation();
  const jsDay = new Date(`${dateAd}T12:00:00`).getDay();
  const slots = buildHoraSchedule(getSunrise(p), getSunset(p), jsDay);

  if (!slots.length) {
    return <p className="pn-aside-tab-empty">{t("muhurta_aside.hora_unavailable")}</p>;
  }

  return (
    <ul className="pn-aside-hora-list">
      {slots.map((slot, i) => {
        const start = formatClockNepali(formatMinutesClock(slot.startMin)) ?? formatMinutesClock(slot.startMin);
        const end = formatClockNepali(formatMinutesClock(slot.endMin)) ?? formatMinutesClock(slot.endMin);
        const quality = horaQuality(slot.planet);
        const tone = horaTone(slot.planet);
        return (
          <li key={`${slot.phase}-${slot.index}-${i}`} className={`pn-aside-hora-row ${tone}`}>
            <div className="pn-aside-slot-body">
              <span className="pn-aside-hora-phase">{slot.phase}</span>
              <span className="pn-aside-hora-name">{slot.planetNe}</span>
              <span className="pn-aside-hora-time mono">
                {toNepaliDigits(slot.index)}
                <span className="pn-aside-hora-sep">·</span>
                {start} – {end}
              </span>
            </div>
            <span className={`pn-aside-slot-badge ${tone}`}>{quality}</span>
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
    return <p className="pn-aside-tab-empty">{t("muhurta_aside.pushkara_unavailable")}</p>;
  }

  return (
    <ul className="pn-aside-pushkara-list">
      {rows.map((row, i) => {
        const range =
          formatTimeRangeShort(
            row.start_local_time_short ?? row.start_local_time,
            row.end_local_time_short ?? row.end_local_time,
          ) ?? "—";
        const hits = row.pushkara_navamsha ?? [];
        return (
          <li key={`${row.name}-${i}`} className="pn-aside-pushkara-row">
            <div className="pn-aside-pushkara-head">
              <span className="pn-aside-pushkara-rashi">{row.name_ne ?? row.name}</span>
              <span className="pn-aside-pushkara-range mono">{range}</span>
            </div>
            {hits.length ? (
              <div className="pn-aside-pushkara-hits">
                <span className="pn-aside-pushkara-label">{t("muhurta_aside.pushkara_label")}</span>
                {hits.map((hit, j) => (
                  <span key={j} className="pn-aside-pushkara-hit mono">
                    {formatClockNepali(hit.local_time_short ?? hit.local_time) ??
                      hit.local_time_short}
                  </span>
                ))}
              </div>
            ) : (
              <span className="pn-aside-pushkara-none">—</span>
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
  const tara = buildTaraBalaTable(p);
  const chandra = buildChandraBalaTable(p);

  return (
    <div className="pn-aside-muhurta-panel">
      <div className="pn-aside-muhurta-subtabs" role="tablist" aria-label={t("muhurta_aside.tabs_label")}>
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className={`pn-aside-muhurta-subtab${subTab === tab.id ? " active" : ""}`}
            aria-selected={subTab === tab.id}
            onClick={() => setSubTab(tab.id)}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <p className="pn-aside-muhurta-hint">
        <Info size={13} strokeWidth={2} aria-hidden />
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
        {subTab === "hora" ? <HoraList p={p} dateAd={dateAd} /> : null}
        {subTab === "pushkara" ? <PushkaraList p={p} /> : null}
      </div>
    </div>
  );
}
