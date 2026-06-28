import { useState } from "react";
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
  getSunrise,
  getSunset,
  toNepaliDigits,
} from "@/lib/panchanga-format";

type MuhurtaSubTab = "tarabal" | "chandrabal" | "choghadiya" | "hora";

const SUB_TABS: { id: MuhurtaSubTab; label: string }[] = [
  { id: "tarabal", label: "ताराबल" },
  { id: "chandrabal", label: "चन्द्रबल" },
  { id: "choghadiya", label: "चौघडी" },
  { id: "hora", label: "होरा" },
];

const SUB_TAB_HINT: Record<MuhurtaSubTab, string> = {
  tarabal: "कामको प्रतिफल र सफलता हेर्न।",
  chandrabal: "यात्रा र कार्यको सफलता हेर्न।",
  choghadiya: "दिन र रातका चौघडिया खण्ड।",
  hora: "सूर्योदयदेखि सूर्यास्तसम्मका ग्रह होरा।",
};

const MOON_REF_LABEL: Record<MuhurtaSubTab, string> = {
  tarabal: "आजको चन्द्र नक्षत्र",
  chandrabal: "आजको चन्द्र राशि",
  choghadiya: "",
  hora: "",
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
  if (!rows.length) {
    return <p className="pn-aside-tab-empty">विवरण उपलब्ध छैन।</p>;
  }

  return (
    <div className="pn-aside-navatara">
      {moonLabel ? (
        <p className="pn-aside-navatara-moon">
          {MOON_REF_LABEL[moonRefKind]}: <strong>{moonLabel}</strong>
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
  const timeline = buildDayTimelineData(p, dateAd);
  const sunriseMin = parseTimeToMinutes(getSunrise(p));

  if (!timeline?.choghadiya.length || sunriseMin == null) {
    return <p className="pn-aside-tab-empty">चौघडिया उपलब्ध छैन।</p>;
  }

  const dayG = timeline.dayG;

  return (
    <ul className="pn-aside-choghadiya-list">
      {timeline.choghadiya.map((seg, i) => {
        const tone = choghadiyaTone(seg.name, seg.bad);
        const quality = choghadiyaQuality(seg.name, seg.bad);
        const phase = seg.startG < dayG ? "दिन" : "रात";
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
  const jsDay = new Date(`${dateAd}T12:00:00`).getDay();
  const slots = buildHoraSchedule(getSunrise(p), getSunset(p), jsDay);

  if (!slots.length) {
    return <p className="pn-aside-tab-empty">होरा उपलब्ध छैन।</p>;
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

type Props = {
  p: PanchangaDay;
  dateAd: string;
};

export function MuhurtaAsidePanel({ p, dateAd }: Props) {
  const [subTab, setSubTab] = useState<MuhurtaSubTab>("tarabal");
  const tara = buildTaraBalaTable(p);
  const chandra = buildChandraBalaTable(p);

  return (
    <div className="pn-aside-muhurta-panel">
      <div className="pn-aside-muhurta-subtabs" role="tablist" aria-label="दैनिक मुहूर्त">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className={`pn-aside-muhurta-subtab${subTab === tab.id ? " active" : ""}`}
            aria-selected={subTab === tab.id}
            onClick={() => setSubTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="pn-aside-muhurta-hint">
        <Info size={13} strokeWidth={2} aria-hidden />
        <span>{SUB_TAB_HINT[subTab]}</span>
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
      </div>
    </div>
  );
}
