import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Flag } from "lucide-react";
import {
  fetchPanchanga,
  fetchHolidays,
  panchangaKeys,
  holidayKeys,
  type Holiday,
  type CalendarDay,
} from "../lib/api";
import { CalendarView } from "../components/CalendarView";
import { BS_MONTHS_NE, getCurrentBs } from "../lib/bs-calendar";
import {
  formatClockNepali,
  formatHolidayBsDisplay,
  formatMonthMoonEventDisplay,
  getMoonriseDisplay,
  getSunriseDisplay,
  getSunsetDisplay,
  toNepaliDigits,
} from "../lib/panchanga-format";

const TODAY_AD = new Date().toISOString().split("T")[0];

function fmtAdFull(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });
}

function daysUntil(iso: string): number {
  const target = new Date(iso);
  const today = new Date(TODAY_AD);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function relLabel(days: number): string {
  if (days === 0) return "आज";
  if (days === 1) return "भोलि";
  return `${days} दिनपछि`;
}

function PanchangaAside({
  selectedDay,
  selectedAdDate,
}: {
  selectedDay: CalendarDay | null;
  selectedAdDate: string;
}) {
  const panchangaQ = useQuery({
    queryKey: panchangaKeys.day(selectedAdDate, "ad"),
    queryFn: () => fetchPanchanga(selectedAdDate, "ad"),
    staleTime: 1000 * 60 * 30,
  });

  const isSelectedToday = selectedAdDate === TODAY_AD;
  const p = panchangaQ.data;

  const bsDisplay = p?.display?.bs_ne ?? p?.date_bs;
  const adDisplay = p?.display?.gregorian_en ?? fmtAdFull(selectedAdDate);
  const weekdayNe = p?.weekday ?? selectedDay?.weekday_ne ?? selectedDay?.weekday;
  const tithi = p?.tithi?.name_ne ?? p?.tithi?.name ?? selectedDay?.tithi_ne ?? selectedDay?.tithi;
  const nakshatra = p?.nakshatra?.name_ne ?? p?.nakshatra?.name ?? selectedDay?.nakshatra;
  const yoga = p?.yoga?.name_ne ?? p?.yoga?.name;
  const karana = p?.karana?.name_ne ?? p?.karana?.name;
  const paksha = p?.paksha?.label_ne ?? p?.paksha_ne;
  const sunrise = p
    ? getSunriseDisplay(p)
    : selectedDay?.sunrise
      ? formatClockNepali(selectedDay.sunrise)
      : undefined;
  const sunset = p
    ? getSunsetDisplay(p)
    : selectedDay?.sunset
      ? formatClockNepali(selectedDay.sunset)
      : undefined;
  const moonrise = p
    ? getMoonriseDisplay(p)
    : selectedDay
      ? formatMonthMoonEventDisplay(selectedDay, "moonrise")
      : undefined;
  const ritu = p?.ritu?.name_ne;
  const rahuKalam = p?.muhurta?.rahu_kalam;

  const displayHeroDate = (() => {
    if (p?.bs_date && typeof p.bs_date === "object") {
      return `${BS_MONTHS_NE[p.bs_date.month - 1]} ${toNepaliDigits(p.bs_date.day)}`;
    }
    if (p?.display?.bs_ne) return toNepaliDigits(p.display.bs_ne);
    if (p?.date_bs) return toNepaliDigits(p.date_bs);
    return bsDisplay ? toNepaliDigits(bsDisplay) : "—";
  })();

  const minis = [
    { label: "तिथि", value: tithi, hint: paksha },
    { label: "नक्षत्र", value: nakshatra },
    { label: "योग", value: yoga },
    { label: "करण", value: karana },
    {
      label: "सूर्योदय / सूर्यास्त",
      value: sunrise && sunset ? `${sunrise} / ${sunset}` : undefined,
      mono: true,
    },
    { label: "चन्द्रोदय", value: moonrise ?? "—", mono: true },
    { label: "ऋतु", value: ritu, hint: p?.ritu?.season },
    {
      label: "राहुकाल",
      value: rahuKalam
        ? `${formatClockNepali(rahuKalam.start_time) ?? rahuKalam.start_time} – ${formatClockNepali(rahuKalam.end_time) ?? rahuKalam.end_time}`
        : undefined,
      mono: true,
    },
  ];

  const topFestName =
    p?.festivals?.[0]?.name_ne ??
    p?.festivals?.[0]?.name_en ??
    selectedDay?.festivals[0];
  const topFestIsPublic =
    p?.festivals?.[0]?.is_public_holiday ??
    (selectedDay ? false : false);

  return (
    <aside className="pn-aside">
      <div className="pn-aside-head">
        <h2 className="pn-aside-title">
          {isSelectedToday ? "आजको पञ्चाङ्ग" : "पञ्चाङ्ग"}
        </h2>
        <Link to="/panchanga" className="pn-aside-link">
          Full detail →
        </Link>
      </div>

      {panchangaQ.isLoading ? (
        <>
          <div className="pn-hero">
            <div className="pn-hero-grid" />
            <div className="pn-hero-eyebrow">{isSelectedToday ? "TODAY · आज" : "…"}</div>
            <div className="pn-mini-skel" style={{ height: 36, marginTop: 10 }} />
            <div className="pn-mini-skel" style={{ height: 16, width: "70%", marginTop: 8 }} />
          </div>
          <div className="pn-minis">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="pn-mini">
                <div className="pn-mini-label">…</div>
                <div className="pn-mini-skel" />
              </div>
            ))}
          </div>
        </>
      ) : panchangaQ.isError ? (
        <div className="pn-error-box">Could not load panchanga. Try again shortly.</div>
      ) : (
        <>
          <div className="pn-hero">
            <div className="pn-hero-grid" />
            <div className="pn-hero-eyebrow">
              {isSelectedToday ? "TODAY · आज" : (weekdayNe ?? "").toUpperCase()}
            </div>
            <div className="pn-hero-date">{displayHeroDate}</div>
            <div className="pn-hero-sub">
              {weekdayNe}
              {p?.bs_date && typeof p.bs_date === "object"
                ? `, वि.सं. ${toNepaliDigits(p.bs_date.year)}`
                : ""}
            </div>
            <div className="pn-hero-ad">
              {adDisplay} · {selectedAdDate}
            </div>
            <div className="pn-hero-pills">
              {paksha && <span className="pn-pill">{paksha}</span>}
              {tithi && <span className="pn-pill">{tithi}</span>}
              {topFestName && (
                <span className={`pn-pill ev ${topFestIsPublic ? "public" : "festival"}`}>
                  {topFestName}
                </span>
              )}
            </div>
          </div>

          <div className="pn-minis">
            {minis.map((mi) => (
              <div key={mi.label} className="pn-mini">
                <div className="pn-mini-label">{mi.label}</div>
                <div className={`pn-mini-value${mi.mono ? " mono" : ""}`}>
                  {mi.value ?? "—"}
                </div>
                {mi.hint && <div className="pn-mini-hint">{mi.hint}</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}

function UpcomingHolidays({ bsYear }: { bsYear: number }) {
  const { data, isLoading } = useQuery({
    queryKey: holidayKeys.holidays(bsYear),
    queryFn: () => fetchHolidays(bsYear),
    staleTime: 1000 * 60 * 60,
  });

  const upcoming: Holiday[] = (data?.holidays ?? [])
    .filter((h) => h.start_date >= TODAY_AD)
    .slice(0, 6);

  return (
    <section className="pn-holidays">
      <div className="pn-hol-head">
        <Flag size={18} strokeWidth={1.8} />
        <h2 className="pn-hol-title">आगामी बिदा तथा पर्वहरू</h2>
        <span className="pn-hol-sub">Upcoming holidays & festivals</span>
        <Link to="/holidays" className="pn-aside-link">
          View all →
        </Link>
      </div>

      <div className="pn-hol-list">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="pn-hol-skel" />)
        ) : upcoming.length === 0 ? (
          <div style={{ padding: "16px", color: "var(--muted-foreground)", fontSize: "var(--fs-sm)" }}>
            No upcoming holidays found.
          </div>
        ) : (
          upcoming.map((h) => {
            const days = daysUntil(h.start_date);
            const bsParts = (h.bs_start_date ?? "").split("-");
            const bsDay = bsParts[2] ? Number(bsParts[2]) : new Date(h.start_date).getDate();
            const bsMonthIdx = bsParts[1] ? Number(bsParts[1]) - 1 : 0;
            const bsLabel = formatHolidayBsDisplay(h);
            const type = h.is_public_holiday ? "public" : "festival";

            return (
              <Link key={h.id} to="/holidays" className="pn-hol-row">
                <span className={`pn-datetile ${type}`}>
                  <span className="pn-datetile-d">{toNepaliDigits(bsDay)}</span>
                  <span className="pn-datetile-m">{BS_MONTHS_NE[bsMonthIdx] ?? ""}</span>
                </span>
                <span className="pn-hol-names">
                  <span className="pn-hol-ne">{h.name_ne ?? h.name_en}</span>
                  {h.name_en && h.name_ne && (
                    <span className="pn-hol-en">{h.name_en}</span>
                  )}
                </span>
                <span className={`pn-badge ${type}`}>
                  {h.is_public_holiday ? "बिदा" : "पर्व"}
                </span>
                <span className="pn-hol-ad">
                  <span className="pn-hol-bs">{bsLabel}</span>
                  <span className="pn-hol-ad-line mono">{fmtAdFull(h.start_date)}</span>
                  <span className="pn-hol-rel">{relLabel(days)}</span>
                </span>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}

export function Home() {
  const { year: bsYear } = getCurrentBs();
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const selectedAdDate = selectedDay?.date_ad ?? TODAY_AD;

  return (
    <main className="pn-page">
      <CalendarView
        onDaySelect={setSelectedDay}
        aside={
          <PanchangaAside selectedDay={selectedDay} selectedAdDate={selectedAdDate} />
        }
        holidays={<UpcomingHolidays bsYear={bsYear} />}
      />

      <p className="pn-note">
        Powered by Swiss Ephemeris · Lahiri Ayanamsa · Kathmandu observer (27.72°N, 85.32°E)
      </p>
    </main>
  );
}
