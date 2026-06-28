import type { ReactNode } from "react";
import type { CalendarDay, Festival, PanchangaDay } from "@/lib/api";
import {
  buildDayTimelineData,
  choghadiyaTone,
  ghatiToCivilClockLabel,
} from "@/components/panchanga/day-timeline-data";
import {
  getEventNames,
  getMuhurtaRows,
  getSunrise,
} from "@/lib/panchanga-format";
import { PanchangaVivaranPanel } from "@/components/home/PanchangaVivaranPanel";

export type AsideTabId = "panchanga" | "festivals" | "sait" | "muhurta";

export const ASIDE_TABS: { id: AsideTabId; label: string }[] = [
  { id: "panchanga", label: "पञ्चाङ्ग" },
  { id: "festivals", label: "चाडपर्व" },
  { id: "sait", label: "साइत" },
  { id: "muhurta", label: "दैनिक मुहूर्त" },
];

function parseTimeToMinutes(time?: string | null): number | null {
  if (!time) return null;
  const m = time.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function AsideEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="pn-aside-tab-empty">{children}</p>
  );
}

function FestivalsTab({
  p,
  selectedDay,
}: {
  p: PanchangaDay;
  selectedDay: CalendarDay | null;
}) {
  const apiFestivals = p.festivals ?? [];
  const dayNames = selectedDay?.festivals ?? [];
  const named = getEventNames(p, dayNames);

  if (!apiFestivals.length && !named.length) {
    return <AsideEmpty>यस दिन कुनै चाडपर्व छैन।</AsideEmpty>;
  }

  return (
    <ul className="pn-aside-fest-list">
      {apiFestivals.map((f: Festival) => {
        const name = f.name_ne ?? f.name_en ?? f.name ?? "—";
        return (
          <li
            key={f.id}
            className={`pn-aside-fest-item${f.is_public_holiday ? " public" : ""}`}
          >
            <span className="pn-aside-fest-name">{name}</span>
            {f.is_public_holiday ? (
              <span className="pn-aside-fest-badge">बिदा</span>
            ) : (
              <span className="pn-aside-fest-badge festival">पर्व</span>
            )}
          </li>
        );
      })}
      {named
        .filter((name) => !apiFestivals.some((f) => (f.name_ne ?? f.name_en) === name))
        .map((name) => (
          <li key={name} className="pn-aside-fest-item">
            <span className="pn-aside-fest-name">{name}</span>
            <span className="pn-aside-fest-badge festival">पर्व</span>
          </li>
        ))}
    </ul>
  );
}

function SaitTab({ p, dateAd }: { p: PanchangaDay; dateAd: string }) {
  const timeline = buildDayTimelineData(p, dateAd);
  const sunriseMin = parseTimeToMinutes(getSunrise(p));

  if (!timeline?.choghadiya.length || sunriseMin == null) {
    return <AsideEmpty>साइत (चौघडिया) उपलब्ध छैन।</AsideEmpty>;
  }

  const dayG = timeline.dayG;

  return (
    <div className="pn-aside-sait">
      <p className="pn-aside-sait-note">चौघडिया · दिन र रात</p>
      <ul className="pn-aside-sait-list">
        {timeline.choghadiya.map((seg, i) => {
          const tone = choghadiyaTone(seg.name, seg.bad);
          const phase = seg.startG < dayG ? "दिन" : "रात";
          const range = `${ghatiToCivilClockLabel(seg.startG, sunriseMin)} – ${ghatiToCivilClockLabel(seg.endG, sunriseMin)}`;
          return (
            <li
              key={`${seg.name}-${i}`}
              className={`pn-aside-sait-row ${tone}${seg.startG >= dayG && i === 8 ? " night-start" : ""}`}
            >
              <span className="pn-aside-sait-phase">{phase}</span>
              <span className="pn-aside-sait-name">{seg.name}</span>
              <span className="pn-aside-sait-time mono">{range}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MuhurtaTab({ p }: { p: PanchangaDay }) {
  const rows = getMuhurtaRows(p);

  if (!rows.length) {
    return <AsideEmpty>मुहूर्त विवरण उपलब्ध छैन।</AsideEmpty>;
  }

  const good = rows.filter((r) => r.auspicious);
  const bad = rows.filter((r) => !r.auspicious);

  return (
    <div className="pn-aside-muhurta">
      {good.length > 0 ? (
        <section className="pn-aside-muhurta-block">
          <h4 className="pn-aside-muhurta-head good">शुभ</h4>
          {good.map((row) => (
            <div key={row.label} className="pn-aside-muhurta-row">
              <span className="pn-aside-muhurta-label">{row.label}</span>
              <span className="pn-aside-muhurta-val mono">{row.value}</span>
            </div>
          ))}
        </section>
      ) : null}
      {bad.length > 0 ? (
        <section className="pn-aside-muhurta-block">
          <h4 className="pn-aside-muhurta-head bad">अशुभ</h4>
          {bad.map((row) => (
            <div key={row.label} className="pn-aside-muhurta-row">
              <span className="pn-aside-muhurta-label">{row.label}</span>
              <span className="pn-aside-muhurta-val mono">{row.value}</span>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}

type Props = {
  tab: AsideTabId;
  p?: PanchangaDay;
  selectedDay: CalendarDay | null;
  selectedAdDate: string;
  loading?: boolean;
};

export function PanchangaAsideTabPanel({
  tab,
  p,
  selectedDay,
  selectedAdDate,
  loading,
}: Props) {
  if (loading) {
    return tab === "panchanga" ? (
      <PanchangaVivaranPanel loading />
    ) : (
      <div className="pn-aside-tab-skel" />
    );
  }

  if (!p) return null;

  switch (tab) {
    case "panchanga":
      return <PanchangaVivaranPanel p={p} selectedDay={selectedDay} />;
    case "festivals":
      return <FestivalsTab p={p} selectedDay={selectedDay} />;
    case "sait":
      return <SaitTab p={p} dateAd={selectedAdDate} />;
    case "muhurta":
      return <MuhurtaTab p={p} />;
    default:
      return null;
  }
}

