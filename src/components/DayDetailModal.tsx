import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { X, ChevronLeft, Sunrise, Sunset, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchPanchanga, panchangaKeys, type CalendarDay, type PanchangaDay } from "@/lib/api";
import {
  formatAdShort,
  formatAdTitle,
  formatAngaTransition,
  formatBsTitle,
  formatDinamaanShort,
  formatNepalSambatDisplay,
  formatNepalSambatSubtitle,
  formatPakshaNepaliDisplay,
  formatPakshaTithiLine,
  formatShakaYear,
  getDinVisheshLabels,
  getMoonrise,
  getMoonset,
  getPanchangaDetail,
  getMuhurtaRows,
  getPlanetRows,
  getSunrise,
  getSunset,
  getVaaraNe,
  relativeDayLabel,
} from "@/lib/panchanga-format";

interface Props {
  day: CalendarDay | null;
  bsYear: number;
  bsMonth: number;
  publicHolidayDates: Set<string>;
  onClose: () => void;
}

function DinVisheshSection({ p, day }: { p: PanchangaDay; day: CalendarDay }) {
  const labels = getDinVisheshLabels(p, day.festivals);
  if (!labels.length) return null;

  return (
    <>
      <h4 className="pn-daymodal-section-title">दिन विशेष</h4>
      <ul className="pn-daymodal-events">
        {labels.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </>
  );
}

function MuhurtaSection({ p }: { p: PanchangaDay }) {
  const rows = getMuhurtaRows(p);
  if (!rows.length) return null;

  return (
    <>
      <h4 className="pn-daymodal-section-title">मुहूर्त</h4>
      <div className="pn-daymodal-table" style={{ marginBottom: 16 }}>
        {rows.map((row) => (
          <div key={row.label} className="pn-daymodal-muhurta-row">
            <span className={`pn-daymodal-muhurta-label${row.auspicious ? " auspicious" : ""}`}>
              {row.label}
              {row.auspicious ? " ✓" : ""}
            </span>
            <span className="pn-daymodal-muhurta-val">{row.value}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function PlanetsSection({ p }: { p: PanchangaDay }) {
  const planets = getPlanetRows(p);
  if (!planets.length) return null;

  return (
    <>
      <h4 className="pn-daymodal-section-title">सूर्योदयकालीन स्पष्टग्रह</h4>
      <div className="pn-daymodal-planets">
        {planets.map(({ label, rashiNe, coords }) => (
          <div key={label} className="pn-daymodal-planet">
            <div className="pn-daymodal-planet-name">
              <span>{label}</span>
              {rashiNe && <span className="pn-daymodal-planet-rashi">{rashiNe}</span>}
            </div>
            <span className="pn-daymodal-planet-val">{coords}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function PanchangaTable({
  rows,
}: {
  rows: { label: string; value?: string | null }[];
}) {
  const visible = rows.filter((r) => r.value);
  if (!visible.length) return null;
  return (
    <div className="pn-daymodal-table">
      {visible.map((row) => (
        <div key={row.label} className="pn-daymodal-row">
          <span className="pn-daymodal-row-label">{row.label}</span>
          <span>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function CelestialTimesRow({ p, day }: { p: PanchangaDay; day: CalendarDay }) {
  const sunrise = getSunrise(p) ?? day.sunrise;
  const sunset = getSunset(p) ?? day.sunset;
  const moonrise = getMoonrise(p);
  const moonset = getMoonset(p);

  if (!sunrise && !sunset && !moonrise && !moonset) return null;

  return (
    <div className="pn-daymodal-sunrow">
      {sunrise && (
        <span className="pn-daymodal-sunitem">
          <Sunrise size={16} strokeWidth={1.8} />
          <span>Sunrise {sunrise}</span>
        </span>
      )}
      {sunset && (
        <span className="pn-daymodal-sunitem">
          <Sunset size={16} strokeWidth={1.8} />
          <span>Sunset {sunset}</span>
        </span>
      )}
      {moonrise && (
        <span className="pn-daymodal-sunitem">
          <Moon size={16} strokeWidth={1.8} />
          <span>Moonrise {moonrise}</span>
        </span>
      )}
      {moonset && (
        <span className="pn-daymodal-sunitem">
          <Moon size={16} strokeWidth={1.8} />
          <span>Moonset {moonset}</span>
        </span>
      )}
    </div>
  );
}

function DaySummary({
  p,
  day,
  onFullPanchanga,
}: {
  p: PanchangaDay;
  day: CalendarDay;
  onFullPanchanga: () => void;
}) {
  const detail = getPanchangaDetail(p);
  const tithi = (detail?.tithi ?? p.tithi) as Parameters<typeof formatAngaTransition>[0];
  const nakshatra = (detail?.nakshatra ?? p.nakshatra) as Parameters<typeof formatAngaTransition>[0];
  const yoga = (detail?.yoga ?? p.yoga) as Parameters<typeof formatAngaTransition>[0];
  const karana = (detail?.karana ?? p.karana) as Parameters<typeof formatAngaTransition>[0];
  const vaara = getVaaraNe(p, day.weekday_ne ?? day.weekday);
  const tithiValue =
    formatAngaTransition(tithi) ?? tithi?.name_ne ?? day.tithi_ne ?? day.tithi;
  const pakshaDisplay = formatPakshaNepaliDisplay(p);
  const nsSubtitle = formatNepalSambatSubtitle(p);

  return (
    <>
      <p className="pn-daymodal-paksha">{formatPakshaTithiLine(p)}</p>
      {nsSubtitle && <p className="pn-daymodal-ns">{nsSubtitle}</p>}

      <CelestialTimesRow p={p} day={day} />

      <h4 className="pn-daymodal-section-title">Panchanga</h4>
      <PanchangaTable
        rows={[
          { label: "पक्ष", value: pakshaDisplay },
          { label: "Day", value: vaara },
          { label: "Tithi", value: tithiValue },
          { label: "Nakshatra", value: formatAngaTransition(nakshatra) ?? nakshatra?.name_ne ?? day.nakshatra },
          { label: "Yog", value: formatAngaTransition(yoga) ?? yoga?.name_ne ?? p.yoga?.name_ne },
          { label: "Karan", value: formatAngaTransition(karana) ?? karana?.name_ne ?? p.karana?.name_ne },
        ]}
      />

      <MuhurtaSection p={p} />

      <DinVisheshSection p={p} day={day} />

      <button type="button" className="pn-daymodal-link" onClick={onFullPanchanga}>
        See full panchanga →
      </button>
    </>
  );
}

function PanchangaFull({
  p,
  day,
  bsYear,
  bsMonth,
}: {
  p: PanchangaDay;
  day: CalendarDay;
  bsYear: number;
  bsMonth: number;
}) {
  const detail = getPanchangaDetail(p);
  const tithi = (detail?.tithi ?? p.tithi) as Parameters<typeof formatAngaTransition>[0];
  const nakshatra = (detail?.nakshatra ?? p.nakshatra) as Parameters<typeof formatAngaTransition>[0];
  const yoga = (detail?.yoga ?? p.yoga) as Parameters<typeof formatAngaTransition>[0];
  const karana = (detail?.karana ?? p.karana) as Parameters<typeof formatAngaTransition>[0];
  const vaara = getVaaraNe(p, day.weekday_ne ?? day.weekday);
  const paksha = formatPakshaNepaliDisplay(p) ??
    (detail?.paksha as { label_ne?: string } | undefined)?.label_ne ??
    p.paksha?.label_ne ??
    p.paksha_ne;
  const chandraNe =
    (detail?.chandra_rashi as { name_ne?: string } | undefined)?.name_ne ??
    p.chandra_rashi?.name_ne ??
    (typeof p.chandra_rashi === "string" ? p.chandra_rashi : undefined);
  const ritu = (detail?.ritu as { name_ne?: string } | undefined)?.name_ne ?? p.ritu?.name_ne;
  const aayan = (detail?.aayan as { name_ne?: string } | undefined)?.name_ne ?? p.aayan?.name_ne ?? p.aayan?.name;

  const bs = (detail?.bs_date ?? p.bs_date) as
    | { month_name?: string; day?: number; year?: number }
    | undefined;
  const bsLine = bs?.month_name && bs.day && bs.year
    ? `${bs.month_name} ${bs.day}, ${bs.year}`
    : formatBsTitle(p, day.day, bsMonth, bsYear);

  const dinVishesh = getDinVisheshLabels(p, day.festivals);

  return (
    <div>
      <div className="pn-daymodal-grid2">
        <div className="pn-daymodal-meta">
          <div className="pn-daymodal-meta-label">वि.सं.</div>
          <div className="pn-daymodal-meta-value">{bsLine}</div>
        </div>
        <div className="pn-daymodal-meta">
          <div className="pn-daymodal-meta-label">इ.सन्</div>
          <div className="pn-daymodal-meta-value">{formatAdShort(p, day.date_ad)}</div>
        </div>
        {formatShakaYear(p) && (
          <div className="pn-daymodal-meta">
            <div className="pn-daymodal-meta-label">शक संवत्</div>
            <div className="pn-daymodal-meta-value">{formatShakaYear(p)}</div>
          </div>
        )}
        {formatNepalSambatDisplay(p) && (
          <div className="pn-daymodal-meta">
            <div className="pn-daymodal-meta-label">नेपाल संवत्</div>
            <div className="pn-daymodal-meta-value">{formatNepalSambatDisplay(p)}</div>
          </div>
        )}
      </div>

      <PanchangaTable
        rows={[
          { label: "उत्तरायण", value: aayan },
          { label: "ऋतु", value: ritu },
          { label: "वार", value: vaara },
          { label: "पक्ष", value: paksha },
          { label: "तिथि", value: formatAngaTransition(tithi) ?? tithi?.name_ne },
          { label: "नक्षत्र", value: formatAngaTransition(nakshatra) ?? nakshatra?.name_ne },
          { label: "योग", value: formatAngaTransition(yoga) ?? yoga?.name_ne },
          { label: "करण", value: formatAngaTransition(karana) ?? karana?.name_ne },
          { label: "चन्द्रराशि", value: chandraNe },
          { label: "दिनमान", value: formatDinamaanShort(p) },
          { label: "सूर्योदय", value: getSunrise(p) ?? day.sunrise },
          { label: "सूर्यास्त", value: getSunset(p) ?? day.sunset },
          { label: "चन्द्रोदय", value: getMoonrise(p) },
          { label: "चन्द्रास्त", value: getMoonset(p) },
        ]}
      />

      {dinVishesh.length > 0 && (
        <p className="pn-daymodal-special">
          दिन विशेष : {dinVishesh.join(" · ")}
        </p>
      )}

      <PlanetsSection p={p} />
    </div>
  );
}

export function DayDetailModal({ day, bsYear, bsMonth, onClose }: Props) {
  const [showPanchanga, setShowPanchanga] = useState(false);
  const dateAd = day?.date_ad ?? "";

  const q = useQuery({
    queryKey: panchangaKeys.day(dateAd, "ad"),
    queryFn: () => fetchPanchanga(dateAd, "ad"),
    enabled: !!day,
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    if (!day) setShowPanchanga(false);
  }, [day]);

  const adDate = day ? new Date(day.date_ad) : null;
  const daysDiff = adDate
    ? Math.ceil((adDate.getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <Dialog.Root
      open={!!day}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setShowPanchanga(false);
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="pn-daymodal-overlay" />
        <Dialog.Content className="pn-daymodal">
          <div className="pn-daymodal-head">
            {showPanchanga ? (
              <div className="pn-daymodal-head-row">
                <div>
                  <button
                    type="button"
                    className="pn-daymodal-back"
                    onClick={() => setShowPanchanga(false)}
                  >
                    <ChevronLeft size={16} strokeWidth={1.8} />
                    Back
                  </button>
                  <Dialog.Title className="pn-daymodal-title">पञ्चाङ्ग</Dialog.Title>
                </div>
                <Dialog.Close className="pn-daymodal-close" aria-label="Close">
                  <X size={16} strokeWidth={1.8} />
                </Dialog.Close>
              </div>
            ) : (
              <div className="pn-daymodal-head-row">
                <div>
                  {daysDiff !== null && (
                    <div className={`pn-daymodal-rel${daysDiff === 0 ? " today" : ""}`}>
                      {relativeDayLabel(daysDiff)}
                    </div>
                  )}
                  <Dialog.Title className="pn-daymodal-title">
                    {q.data
                      ? formatBsTitle(q.data, day?.day, bsMonth, bsYear)
                      : `${day?.day ?? ""}`}
                  </Dialog.Title>
                  <Dialog.Description className="pn-daymodal-ad">
                    {day ? (q.data ? formatAdTitle(q.data, day.date_ad) : formatAdTitle({} as PanchangaDay, day.date_ad)) : null}
                  </Dialog.Description>
                </div>
                <Dialog.Close className="pn-daymodal-close" aria-label="Close">
                  <X size={16} strokeWidth={1.8} />
                </Dialog.Close>
              </div>
            )}
          </div>

          <div className="pn-daymodal-body">
            {q.isLoading && (
              <>
                <div className="pn-daymodal-skel" style={{ width: "70%" }} />
                <div className="pn-daymodal-skel" style={{ width: "50%" }} />
                <div className="pn-daymodal-skel" style={{ width: "90%" }} />
              </>
            )}

            {q.isError && (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--fs-sm)" }}>
                Failed to load day details.
              </p>
            )}

            {q.data && day && !showPanchanga && (
              <DaySummary
                p={q.data}
                day={day}
                onFullPanchanga={() => setShowPanchanga(true)}
              />
            )}

            {q.data && day && showPanchanga && (
              <PanchangaFull p={q.data} day={day} bsYear={bsYear} bsMonth={bsMonth} />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
