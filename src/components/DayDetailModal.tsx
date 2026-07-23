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
  formatPakshaLabel,
  formatPakshaNepaliDisplay,
  formatPakshaTithiLine,
  formatShakaYear,
  getDinVisheshLabels,
  getMoonriseDisplay,
  getMoonsetDisplay,
  getPanchangaDetail,
  getRituDisplayNe,
  getRituDisplay,
  getMuhurtaRows,
  getPlanetRows,
  getSunriseDisplay,
  getSunsetDisplay,
  getVaaraNe,
  relativeDayLabel,
} from "@/lib/panchanga-format";
import { useLocale } from "@/i18n/locale";
import { patroAsideLink } from "@/lib/patro-classes";
import { cn } from "@/lib/utils";
import { TL_RASHI_EN } from "@/components/panchanga/day-timeline-data";

interface Props {
  day: CalendarDay | null;
  bsYear: number;
  bsMonth: number;
  publicHolidayDates: Set<string>;
  location?: PanchangaLocation;
  onClose: () => void;
}

const sectionTitle = "mb-2 text-sm font-bold";
const metaCard = "rounded-lg border border-border bg-surface-inset p-2.5";
const metaLabel = "mb-1 text-sm tracking-widest uppercase";

function DinVisheshSection({ p, day }: { p: PanchangaDay; day: CalendarDay }) {
  const { pick, lang } = useLocale();
  const labels = getDinVisheshLabels(p, day.festivals, lang);
  if (!labels.length) return null;

  return (
    <>
      <h4 className={sectionTitle}>{pick("दिन विशेष", "Day highlights")}</h4>
      <ul className="m-0 list-none p-0">
        {labels.map((name) => (
          <li key={name} className="border-b border-border py-2 text-sm text-base last:border-b-0">
            {name}
          </li>
        ))}
      </ul>
    </>
  );
}

function MuhurtaSection({ p }: { p: PanchangaDay }) {
  const { pick, lang } = useLocale();
  const rows = getMuhurtaRows(p, lang);
  if (!rows.length) return null;

  return (
    <>
      <h4 className={sectionTitle}>{pick("मुहूर्त", "Muhurta")}</h4>
      <div className="mb-4 overflow-hidden rounded-lg border border-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[1fr_auto] items-baseline gap-3 border-b border-border px-3 py-2.5 text-sm text-base last:border-b-0"
          >
            <span className={cn("", row.auspicious && "text-success")}>
              {row.label}
              {row.auspicious ? " ✓" : ""}
            </span>
            <span className="font-num text-right tabular-nums">{row.value}</span>
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
      <h4 className={sectionTitle}>{pick("उदयकालिक स्पष्टग्रह", "Planets at sunrise")}</h4>
      <div className="grid grid-cols-2 gap-2">
        {planets.map(({ key, label, labelEn, rashiNe, rashiEn, coords }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-2 rounded-lg border border-border px-2.5 py-2 text-sm text-base"
          >
            <div className="flex flex-col gap-0.5">
              <span>{pick(label, labelEn)}</span>
              {(rashiNe || rashiEn) && (
                <span className="text-sm">
                  {pick(rashiNe ?? "", rashiEn ?? TL_RASHI_EN[rashiNe ?? ""] ?? rashiNe ?? "")}
                </span>
              )}
            </div>
            <span className="font-num text-right tabular-nums">{coords}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function PanchangaTable({ rows }: { rows: { label: string; value?: string | null }[] }) {
  const visible = rows.filter((r) => r.value);
  if (!visible.length) return null;
  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-border">
      {visible.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-[88px_1fr] gap-3 border-b border-border px-3 py-2.5 text-sm text-base last:border-b-0"
        >
          <span>{row.label}</span>
          <span>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function CelestialTimesRow({ p, day }: { p: PanchangaDay; day: CalendarDay }) {
  const { lang, pick } = useLocale();
  const sunrise =
    getSunriseDisplay(p) ?? (day.sunrise ? formatClockNepali(day.sunrise) : undefined);
  const sunset =
    getSunsetDisplay(p) ?? (day.sunset ? formatClockNepali(day.sunset) : undefined);
  const moonrise = getMoonriseDisplay(p, lang);
  const moonset = getMoonsetDisplay(p, lang);

  if (!sunrise && !sunset && !moonrise && !moonset) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-base">
      {sunrise && (
        <span className="inline-flex items-center gap-1.5">
          <Sunrise size={16} strokeWidth={1.8} />
          <span>
            {pick("सूर्योदय", "Sunrise")} {sunrise}
          </span>
        </span>
      )}
      {sunset && (
        <span className="inline-flex items-center gap-1.5">
          <Sunset size={16} strokeWidth={1.8} />
          <span>
            {pick("सूर्यास्त", "Sunset")} {sunset}
          </span>
        </span>
      )}
      {moonrise && (
        <span className="inline-flex items-center gap-1.5">
          <Moon size={16} strokeWidth={1.8} />
          <span>
            {pick("चन्द्रोदय", "Moonrise")} {moonrise}
          </span>
        </span>
      )}
      {moonset && (
        <span className="inline-flex items-center gap-1.5">
          <Moon size={16} strokeWidth={1.8} />
          <span>
            {pick("चन्द्रास्त", "Moonset")} {moonset}
          </span>
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
  const { pick, lang } = useLocale();
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
    formatAngaTransition(anga as Parameters<typeof formatAngaTransition>[0], lang) ??
    pick(anga?.name_ne ?? neFallback, anga?.name ?? anga?.name_ne ?? enFallback ?? neFallback);
  const vaara = pick(getVaaraNe(p, day.weekday_ne ?? day.weekday), day.weekday_en ?? day.weekday);
  const pakshaDisplay = formatPakshaLabel(p, lang) ?? pick(formatPakshaNepaliDisplay(p), p.paksha?.label_en ?? formatPakshaNepaliDisplay(p));
  const nsSubtitle = formatNepalSambatSubtitle(p);

  return (
    <>
      <p className="mb-1 text-sm font-semibold">{formatPakshaTithiLine(p)}</p>
      {nsSubtitle && <p className="mb-3.5 text-sm text-base">{nsSubtitle}</p>}

      <CelestialTimesRow p={p} day={day} />

      <h4 className={sectionTitle}>{pick("पञ्चाङ्ग", "Panchanga")}</h4>
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

      <button type="button" className={cn(patroAsideLink, "mb-4 inline-block cursor-pointer border-none bg-transparent p-0 text-sm")} onClick={onFullPanchanga}>
        {pick("पूर्ण पञ्चाङ्ग हेर्नुहोस् →", "See full panchanga →")}
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
  const { pick, lang } = useLocale();
  const detail = getPanchangaDetail(p);
  const tithi = (detail?.tithi ?? p.tithi) as Parameters<typeof formatAngaTransition>[0];
  const nakshatra = (detail?.nakshatra ?? p.nakshatra) as Parameters<typeof formatAngaTransition>[0];
  const yoga = (detail?.yoga ?? p.yoga) as Parameters<typeof formatAngaTransition>[0];
  const karana = (detail?.karana ?? p.karana) as Parameters<typeof formatAngaTransition>[0];
  const angaVal = (anga: { name_ne?: string; name?: string } | null | undefined) =>
    formatAngaTransition(anga as Parameters<typeof formatAngaTransition>[0], lang) ??
    pick(anga?.name_ne, anga?.name ?? anga?.name_ne);
  const vaara = pick(getVaaraNe(p, day.weekday_ne ?? day.weekday), day.weekday_en ?? day.weekday);
  const paksha = formatPakshaLabel(p, lang) ?? pick(
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
  const ritu = pick(getRituDisplayNe(p), getRituDisplay(p, "en") ?? getRituDisplayNe(p));
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

  const dinVishesh = getDinVisheshLabels(p, day.festivals, lang);

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <div className={metaCard}>
          <div className={metaLabel}>{pick("वि.सं.", "BS")}</div>
          <div className="text-sm font-semibold">{bsLine}</div>
        </div>
        <div className={metaCard}>
          <div className={metaLabel}>{pick("इ.सन्", "AD")}</div>
          <div className="text-sm font-semibold">{formatAdShort(p, day.date_ad, lang)}</div>
        </div>
        {formatShakaYear(p) && (
          <div className={metaCard}>
            <div className={metaLabel}>{pick("शक संवत्", "Shaka Samvat")}</div>
            <div className="text-sm font-semibold">{formatShakaYear(p)}</div>
          </div>
        )}
        {formatNepalSambatDisplay(p) && (
          <div className={metaCard}>
            <div className={metaLabel}>{pick("नेपाल संवत्", "Nepal Samvat")}</div>
            <div className="text-sm font-semibold">{formatNepalSambatDisplay(p)}</div>
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
          { label: pick("सूर्योदय", "Sunrise"), value: getSunriseDisplay(p) ?? formatClockNepali(day.sunrise) },
          { label: pick("सूर्यास्त", "Sunset"), value: getSunsetDisplay(p) ?? formatClockNepali(day.sunset) },
          { label: pick("चन्द्रोदय", "Moonrise"), value: getMoonriseDisplay(p, lang) },
          { label: pick("चन्द्रास्त", "Moonset"), value: getMoonsetDisplay(p, lang) },
        ]}
      />

      {dinVishesh.length > 0 && (
        <p className="mb-4 text-sm text-base">
          {pick("दिन विशेष", "Day highlights")} : {dinVishesh.join(" · ")}
        </p>
      )}

      <PlanetsSection p={p} />
    </div>
  );
}

export function DayDetailModal({ day, bsYear, bsMonth, location, onClose }: Props) {
  const { pick, lang } = useLocale();
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
  const daysDiff = adDate ? Math.ceil((adDate.getTime() - Date.now()) / 86_400_000) : null;

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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "fixed z-[51] flex max-h-[90vh] w-full flex-col bg-card text-foreground shadow-lg",
            "inset-x-0 bottom-0 rounded-t-xl",
            "sm:inset-[50%_auto_auto_50%] sm:max-h-[85vh] sm:w-[min(560px,calc(100vw-32px))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl",
          )}
        >
          <div className="shrink-0 border-b border-border px-5 pt-5 pb-4">
            {showPanchanga ? (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <button
                    type="button"
                    className="mb-1 inline-flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-sm text-base hover:text-foreground"
                    onClick={() => setShowPanchanga(false)}
                  >
                    <ChevronLeft size={16} strokeWidth={1.8} />
                    {pick("फर्कनुहोस्", "Back")}
                  </button>
                  <Dialog.Title className="m-0 text-lg font-bold">{pick("पञ्चाङ्ग", "Panchanga")}</Dialog.Title>
                </div>
                <Dialog.Close
                  className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-card hover:bg-surface-inset hover:text-foreground"
                  aria-label={pick("बन्द", "Close")}
                >
                  <X size={16} strokeWidth={1.8} />
                </Dialog.Close>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div>
                  {daysDiff !== null && (
                    <div
                      className={cn(
                        "mb-1.5 text-xs font-semibold",
                        daysDiff === 0 && "text-secondary dark:text-secondary",
                      )}
                    >
                      {relativeDayLabel(daysDiff, lang)}
                    </div>
                  )}
                  <Dialog.Title className="m-0 text-lg font-bold">
                    {q.data
                      ? formatBsTitle(q.data, day?.day, bsMonth, bsYear)
                      : `${day?.day ?? ""}`}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-base">
                    {day
                      ? q.data
                        ? formatAdTitle(q.data, day.date_ad, lang)
                        : formatAdTitle({} as PanchangaDay, day.date_ad, lang)
                      : null}
                  </Dialog.Description>
                </div>
                <Dialog.Close
                  className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-card hover:bg-surface-inset hover:text-foreground"
                  aria-label={pick("बन्द", "Close")}
                >
                  <X size={16} strokeWidth={1.8} />
                </Dialog.Close>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-5 pt-4 pb-5">
            {q.isLoading && (
              <div className="flex flex-col gap-2">
                <div className="h-4 w-[70%] animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-4 w-[90%] animate-pulse rounded bg-muted" />
              </div>
            )}

            {q.isError && (
              <p className="text-sm text-danger">
                {pick("दिन विवरण लोड गर्न सकिएन।", "Failed to load day details.")}
              </p>
            )}

            {q.data && day && !showPanchanga && (
              <DaySummary p={q.data} day={day} onFullPanchanga={() => setShowPanchanga(true)} />
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
