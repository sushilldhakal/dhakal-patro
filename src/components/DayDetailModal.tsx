import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { X, ChevronLeft, Sunrise, Sunset, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchPanchanga, panchangaKeys, type CalendarDay, type PanchangaDay } from "@/lib/api";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import {
  formatAdShort,
  formatAdTitle,
  formatAngaTransition,
  formatBsTitle,
  formatClockNepali,
  formatDinamaanShort,
  formatNepalSambatDisplay,
  formatNepalSambatSubtitle,
  formatPakshaNepaliDisplay,
  formatPakshaTithiLine,
  formatShakaYear,
  getDinVisheshLabels,
  getMoonriseDisplay,
  getMoonsetDisplay,
  getPanchangaDetail,
  getRituDisplayNe,
  getMuhurtaRows,
  getPlanetRows,
  getSunriseDisplay,
  getSunsetDisplay,
  getVaaraNe,
  relativeDayLabel,
} from "@/lib/panchanga-format";
import { useLocale } from "@/i18n/locale";
import { TL_GRAHA_EN, TL_RASHI_EN } from "@/components/panchanga/day-timeline-data";

interface Props {
  day: CalendarDay | null;
  bsYear: number;
  bsMonth: number;
  publicHolidayDates: Set<string>;
  /** Active location — drives sunrise/muhurta/tithi so the modal matches the side panel & grid. */
  location?: PanchangaLocation;
  onClose: () => void;
}

function DinVisheshSection({ p, day }: { p: PanchangaDay; day: CalendarDay }) {
  const { pick } = useLocale();
  const labels = getDinVisheshLabels(p, day.festivals);
  if (!labels.length) return null;

  return (
    <>
      <h4 className="pn-daymodal-section-title">{pick("दिन विशेष", "Day highlights")}</h4>
      <ul className="pn-daymodal-events">
        {labels.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </>
  );
}

function MuhurtaSection({ p }: { p: PanchangaDay }) {
  const { pick } = useLocale();
  const rows = getMuhurtaRows(p);
  if (!rows.length) return null;

  return (
    <>
      <h4 className="pn-daymodal-section-title">{pick("मुहूर्त", "Muhurta")}</h4>
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
  const { pick } = useLocale();
  const planets = getPlanetRows(p);
  if (!planets.length) return null;

  return (
    <>
      <h4 className="pn-daymodal-section-title">{pick("उदयकालिक स्पष्टग्रह", "Planets at sunrise")}</h4>
      <div className="pn-daymodal-planets">
        {planets.map(({ label, rashiNe, coords }) => (
          <div key={label} className="pn-daymodal-planet">
            <div className="pn-daymodal-planet-name">
              <span>{pick(label, TL_GRAHA_EN[label] ?? label)}</span>
              {rashiNe && (
                <span className="pn-daymodal-planet-rashi">
                  {pick(rashiNe, TL_RASHI_EN[rashiNe] ?? rashiNe)}
                </span>
              )}
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
  const sunrise =
    getSunriseDisplay(p) ?? (day.sunrise ? formatClockNepali(day.sunrise) : undefined);
  const sunset =
    getSunsetDisplay(p) ?? (day.sunset ? formatClockNepali(day.sunset) : undefined);
  const moonrise = getMoonriseDisplay(p);
  const moonset = getMoonsetDisplay(p);

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
  const { pick } = useLocale();
  const detail = getPanchangaDetail(p);
  const tithi = (detail?.tithi ?? p.tithi) as Parameters<typeof formatAngaTransition>[0];
  const nakshatra = (detail?.nakshatra ?? p.nakshatra) as Parameters<typeof formatAngaTransition>[0];
  const yoga = (detail?.yoga ?? p.yoga) as Parameters<typeof formatAngaTransition>[0];
  const karana = (detail?.karana ?? p.karana) as Parameters<typeof formatAngaTransition>[0];
  const angaVal = (
    anga: { name_ne?: string; name?: string } | null | undefined,
    neFallback?: string,
    enFallback?: string,
  ) =>
    pick(
      formatAngaTransition(anga as Parameters<typeof formatAngaTransition>[0]) ?? anga?.name_ne ?? neFallback,
      anga?.name ?? anga?.name_ne ?? enFallback ?? neFallback,
    );
  const vaara = pick(getVaaraNe(p, day.weekday_ne ?? day.weekday), day.weekday_en ?? day.weekday);
  const pakshaDisplay = pick(formatPakshaNepaliDisplay(p), p.paksha?.label_en ?? formatPakshaNepaliDisplay(p));
  const nsSubtitle = formatNepalSambatSubtitle(p);

  return (
    <>
      <p className="pn-daymodal-paksha">{formatPakshaTithiLine(p)}</p>
      {nsSubtitle && <p className="pn-daymodal-ns">{nsSubtitle}</p>}

      <CelestialTimesRow p={p} day={day} />

      <h4 className="pn-daymodal-section-title">Panchanga</h4>
      <PanchangaTable
        rows={[
          { label: pick("पक्ष", "Paksha"), value: pakshaDisplay },
          { label: pick("वार", "Day"), value: vaara },
          { label: pick("तिथि", "Tithi"), value: angaVal(tithi, day.tithi_ne ?? day.tithi, day.tithi ?? day.tithi_ne) },
          { label: pick("नक्षत्र", "Nakshatra"), value: angaVal(nakshatra, day.nakshatra_ne ?? day.nakshatra, day.nakshatra ?? day.nakshatra_ne) },
          { label: pick("योग", "Yog"), value: angaVal(yoga, day.yoga_ne ?? day.yoga, day.yoga ?? day.yoga_ne) },
          { label: pick("करण", "Karan"), value: angaVal(karana, day.karana_ne ?? day.karana, day.karana ?? day.karana_ne) },
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
  const { pick } = useLocale();
  const detail = getPanchangaDetail(p);
  const tithi = (detail?.tithi ?? p.tithi) as Parameters<typeof formatAngaTransition>[0];
  const nakshatra = (detail?.nakshatra ?? p.nakshatra) as Parameters<typeof formatAngaTransition>[0];
  const yoga = (detail?.yoga ?? p.yoga) as Parameters<typeof formatAngaTransition>[0];
  const karana = (detail?.karana ?? p.karana) as Parameters<typeof formatAngaTransition>[0];
  const angaVal = (
    anga: { name_ne?: string; name?: string } | null | undefined,
  ) =>
    pick(
      formatAngaTransition(anga as Parameters<typeof formatAngaTransition>[0]) ?? anga?.name_ne,
      anga?.name ?? anga?.name_ne,
    );
  const vaara = pick(getVaaraNe(p, day.weekday_ne ?? day.weekday), day.weekday_en ?? day.weekday);
  const paksha = pick(
    formatPakshaNepaliDisplay(p) ??
      (detail?.paksha as { label_ne?: string } | undefined)?.label_ne ??
      p.paksha?.label_ne ??
      p.paksha_ne,
    p.paksha?.label_en ?? p.paksha?.label_ne ?? p.paksha_ne,
  );
  const chandraNe = pick(
    (detail?.chandra_rashi as { name_ne?: string } | undefined)?.name_ne ??
      p.chandra_rashi?.name_ne ??
      (typeof p.chandra_rashi === "string" ? p.chandra_rashi : undefined),
    (detail?.chandra_rashi as { name?: string } | undefined)?.name ??
      p.chandra_rashi?.name ??
      p.chandra_rashi?.name_ne,
  );
  const ritu = pick(getRituDisplayNe(p), (p.ritu as { season?: string } | undefined)?.season ?? getRituDisplayNe(p));
  const aayan = pick(
    (detail?.aayan as { name_ne?: string } | undefined)?.name_ne ?? p.aayan?.name_ne ?? p.aayan?.name,
    p.aayan?.name ?? p.aayan?.name_ne,
  );

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
          <div className="pn-daymodal-meta-label">{pick("वि.सं.", "BS")}</div>
          <div className="pn-daymodal-meta-value">{bsLine}</div>
        </div>
        <div className="pn-daymodal-meta">
          <div className="pn-daymodal-meta-label">{pick("इ.सन्", "AD")}</div>
          <div className="pn-daymodal-meta-value">{formatAdShort(p, day.date_ad)}</div>
        </div>
        {formatShakaYear(p) && (
          <div className="pn-daymodal-meta">
            <div className="pn-daymodal-meta-label">{pick("शक संवत्", "Shaka Samvat")}</div>
            <div className="pn-daymodal-meta-value">{formatShakaYear(p)}</div>
          </div>
        )}
        {formatNepalSambatDisplay(p) && (
          <div className="pn-daymodal-meta">
            <div className="pn-daymodal-meta-label">{pick("नेपाल संवत्", "Nepal Samvat")}</div>
            <div className="pn-daymodal-meta-value">{formatNepalSambatDisplay(p)}</div>
          </div>
        )}
      </div>

      <PanchangaTable
        rows={[
          { label: pick("उत्तरायण", "Ayana"), value: aayan },
          { label: pick("ऋतु", "Ritu"), value: ritu },
          { label: pick("वार", "Day"), value: vaara },
          { label: pick("पक्ष", "Paksha"), value: paksha },
          { label: pick("तिथि", "Tithi"), value: angaVal(tithi) },
          { label: pick("नक्षत्र", "Nakshatra"), value: angaVal(nakshatra) },
          { label: pick("योग", "Yoga"), value: angaVal(yoga) },
          { label: pick("करण", "Karana"), value: angaVal(karana) },
          { label: pick("चन्द्रराशि", "Moon sign"), value: chandraNe },
          { label: pick("दिनमान", "Day length"), value: formatDinamaanShort(p) },
          {
            label: pick("सूर्योदय", "Sunrise"),
            value: getSunriseDisplay(p) ?? formatClockNepali(day.sunrise),
          },
          {
            label: pick("सूर्यास्त", "Sunset"),
            value: getSunsetDisplay(p) ?? formatClockNepali(day.sunset),
          },
          { label: pick("चन्द्रोदय", "Moonrise"), value: getMoonriseDisplay(p) },
          { label: pick("चन्द्रास्त", "Moonset"), value: getMoonsetDisplay(p) },
        ]}
      />

      {dinVishesh.length > 0 && (
        <p className="pn-daymodal-special">
          {pick("दिन विशेष", "Day highlights")} : {dinVishesh.join(" · ")}
        </p>
      )}

      <PlanetsSection p={p} />
    </div>
  );
}

export function DayDetailModal({ day, bsYear, bsMonth, location, onClose }: Props) {
  const { pick } = useLocale();
  const [showPanchanga, setShowPanchanga] = useState(false);
  const dateAd = day?.date_ad ?? "";

  const q = useQuery({
    queryKey: panchangaKeys.day(dateAd, "ad", location?.params),
    queryFn: () => fetchPanchanga(dateAd, "ad", location?.params),
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
                  <Dialog.Title className="pn-daymodal-title">{pick("पञ्चाङ्ग", "Panchanga")}</Dialog.Title>
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
