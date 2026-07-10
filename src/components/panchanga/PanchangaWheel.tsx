import { useTranslation } from "react-i18next";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Fullscreen, Minimize2, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import type { PanchangaDay } from "@/lib/api";
import { fetchPanchangaAtTime, panchangaKeys } from "@/lib/api";
import { getPanchangaDetail } from "@/lib/panchanga-format";
import { minutesSinceMidnightInTimezone, resolveTimeZone } from "@/lib/zoned-time";
import {
  buildWheelDetail,
  buildWheelMarkers,
  buildWheelMarkersAtTime,
  DEFAULT_WHEEL_TWEAKS,
  gClock,
  scrubGToDatetime,
  WHEEL_RASHIS,
  type WheelDetail,
} from "@/lib/wheel-data";
import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { WheelChart, type WheelHover, type WheelPick } from "./WheelChart";
import { WheelPanel } from "./WheelPanel";
import { useLocale } from "@/i18n/locale";
import { patroSkel, patroWheelShell } from "@/lib/patro-classes";
import {
  wheelDock,
  wheelDockGrp,
  wheelDockLabel,
  wheelDockSep,
  wheelDockTimeGrp,
  wheelDockTodayBtn,
  wheelDockVal,
  wheelExpandedShell,
  wheelHead,
  wheelHeadEyebrow,
  wheelHeadSub,
  wheelHeadTitle,
  wheelIconBtn,
  wheelLegend,
  wheelLegendDot,
  wheelLegendRow,
  wheelScrub,
  wheelStage,
  wheelStageExpanded,
  wheelSvgWrap,
  wheelTip,
  wheelTipKind,
  wheelTipRow,
  wheelTipSym,
  wheelTipTitle,
  wheelYearScrub,
  wheelYearScrubCount,
  wheelYearScrubLabel,
  wheelYearScrubPlayBtn,
  wheelYearScrubShell,
} from "@/lib/wheel-classes";
import { cn } from "@/lib/utils";
import { BS_MONTHS_NE, BS_MONTH_NAMES } from "@/lib/bs-calendar";
import { NAK_LORD_EN } from "@/lib/wheel-locale";

function bsMonthEnOf(ne: string): string {
  const i = BS_MONTHS_NE.indexOf(ne);
  return i >= 0 ? BS_MONTH_NAMES[i] : ne;
}

const wheelDockIcon = "h-3.5 w-3.5 max-[480px]:h-3 max-[480px]:w-3";

export type YearWheelScrub = {
  /** Global day index across the whole range (single year ⇒ 1..365). */
  day: number;
  /** Total days across the whole range. */
  totalDays: number;
  playing: boolean;
  onPlayToggle: () => void;
  /** Receives the global day index; the page maps it back to (year, day). */
  onDayChange: (day: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
  /** Multi-year range context — enables prev/next-year buttons + label. */
  yearLabel?: string;
  dayInYear?: number;
  daysInYear?: number;
  onPrevYear?: () => void;
  onNextYear?: () => void;
  canPrevYear?: boolean;
  canNextYear?: boolean;
};

function WheelYearScrub({ scrub }: { scrub: YearWheelScrub }) {
  const { t } = useTranslation();
  const { pick, digits } = useLocale();
  const {
    day,
    totalDays,
    playing,
    onPlayToggle,
    onDayChange,
    onScrubStart,
    onScrubEnd,
    yearLabel,
    dayInYear,
    daysInYear,
    onPrevYear,
    onNextYear,
    canPrevYear,
    canNextYear,
  } = scrub;
  const num = (n: number) => digits(n);
  const fillPct = totalDays <= 1 ? 100 : ((day - 1) / (totalDays - 1)) * 100;
  const hasRange = onPrevYear != null || onNextYear != null;

  return (
    <div className={wheelYearScrubShell}>
      <span className={wheelYearScrubLabel}>{pick("वर्ष", "Year")}</span>
      {hasRange && (
        <button
          type="button"
          className={cn(wheelYearScrubPlayBtn, "shrink-0")}
          onClick={onPrevYear}
          disabled={!canPrevYear}
          aria-label={pick("अघिल्लो वर्ष", "Previous year")}
          title={pick("अघिल्लो वर्ष", "Previous year")}
        >
          <SkipBack className={wheelDockIcon} strokeWidth={2} aria-hidden />
        </button>
      )}
      <button
        type="button"
        className={cn(wheelYearScrubPlayBtn, "shrink-0")}
        onClick={onPlayToggle}
        aria-label={playing ? t("panchanga_year.pause") : t("panchanga_year.play")}
        title={playing ? t("panchanga_year.pause") : t("panchanga_year.play_title")}
      >
        {playing ? (
          <Pause className={wheelDockIcon} strokeWidth={2} aria-hidden />
        ) : (
          <Play className={cn(wheelDockIcon, "translate-x-[1px]")} strokeWidth={2} aria-hidden />
        )}
      </button>
      {hasRange && (
        <button
          type="button"
          className={cn(wheelYearScrubPlayBtn, "shrink-0")}
          onClick={onNextYear}
          disabled={!canNextYear}
          aria-label={pick("अर्को वर्ष", "Next year")}
          title={pick("अर्को वर्ष", "Next year")}
        >
          <SkipForward className={wheelDockIcon} strokeWidth={2} aria-hidden />
        </button>
      )}
      <input
        type="range"
        className={wheelYearScrub}
        min={1}
        max={totalDays}
        step={1}
        value={day}
        aria-label={t("panchanga_year.scrub_label")}
        style={{ "--fill": `${fillPct}%` } as React.CSSProperties}
        onPointerDown={onScrubStart}
        onPointerUp={onScrubEnd}
        onPointerCancel={onScrubEnd}
        onLostPointerCapture={onScrubEnd}
        onChange={(e) => onDayChange(Number(e.target.value))}
      />
      <span className={wheelYearScrubCount}>
        {yearLabel != null && dayInYear != null && daysInYear != null ? (
          <>
            <span className="dim">{yearLabel} · </span>
            {num(dayInYear)}
            <span className="dim">/{num(daysInYear)}</span>
          </>
        ) : (
          <>
            {num(day)}
            <span className="dim">/{num(totalDays)}</span>
          </>
        )}
      </span>
    </div>
  );
}

function WheelHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  sub: React.ReactNode;
}) {
  return (
    <div className={wheelHead}>
      <div className={wheelHeadEyebrow}>{eyebrow}</div>
      <div className={wheelHeadTitle}>{title}</div>
      <div className={wheelHeadSub}>{sub}</div>
    </div>
  );
}

interface Props {
  p?: PanchangaDay;
  bsYear: number;
  bsMonthNe: string;
  bsDay: number;
  isToday?: boolean;
  timezone?: string;
  locationLabel?: string;
  /** First load only — inline placeholder, not the full-page loader. */
  loading?: boolean;
  /** When true, only fetch at-time after the user moves the wheel time slider. */
  atTimeScrubOnly?: boolean;
  /** Year view: vertical day scrub + autoplay on the right inside the wheel. */
  yearScrub?: YearWheelScrub;
}

function PanchangaWheelSkeleton({
  bsYear,
  bsMonthNe,
  bsDay,
  locationLabel,
}: Pick<Props, "bsYear" | "bsMonthNe" | "bsDay" | "locationLabel">) {
  const { pick, digits } = useLocale();
  const num = (n: number | string) => digits(n);
  const locLabel = locationLabel ?? pick("काठमाडौं", "Kathmandu");

  return (
    <div className={cn("pn-wheel", patroWheelShell)} aria-busy="true">
      <div className={wheelStage}>
        <WheelHead
          eyebrow={pick("पञ्चाङ्ग चक्र", "Nepali Patro · Panchanga Wheel")}
          title={
            <>
              {pick("ग्रह–नक्षत्र · तिथि–करण चक्र", "Graha–Nakshatra · Tithi–Karana wheel")}{" "}
              <span className="yr">{num(bsYear)}</span>
            </>
          }
          sub={
            <>
              {pick(bsMonthNe, bsMonthEnOf(bsMonthNe))} {num(bsDay)} · {locLabel}
            </>
          }
        />
        <div className={cn(patroSkel, wheelSvgWrap)} style={{ minHeight: 420, margin: "0 auto" }} />
      </div>
    </div>
  );
}

type WheelBodyProps = Omit<Props, "loading" | "p"> & { p: PanchangaDay };

function PanchangaWheelBody({
  p,
  bsYear,
  bsMonthNe,
  bsDay,
  isToday,
  timezone,
  locationLabel,
  atTimeScrubOnly = false,
  yearScrub,
}: WheelBodyProps & { atTimeScrubOnly?: boolean; yearScrub?: YearWheelScrub }) {
  const det: WheelDetail = useMemo(() => buildWheelDetail(p), [p]);
  const tz = resolveTimeZone(p?.location?.timezone, timezone);
  const [now, setNow] = useState(() => new Date());

  const [spin, setSpin] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [picked, setPicked] = useState<WheelPick | null>(null);
  const [hover, setHover] = useState<WheelHover | null>(null);
  const [tip, setTip] = useState({ x: 0, y: 0 });
  const [scrubPinned, setScrubPinned] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const expandedHistoryRef = useRef(false);
  const ignorePopRef = useRef(false);

  const setExpandedMode = useCallback((next: boolean) => {
    if (next) {
      if (!expandedHistoryRef.current) {
        window.history.pushState({ panchangaWheelExpanded: true }, "");
        expandedHistoryRef.current = true;
      }
      setExpanded(true);
      return;
    }
    setExpanded(false);
    if (expandedHistoryRef.current) {
      expandedHistoryRef.current = false;
      ignorePopRef.current = true;
      window.history.back();
    }
  }, []);

  const toggleExpanded = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setExpandedMode(!expanded);
    },
    [expanded, setExpandedMode],
  );

  const handleZoom = useCallback((z: number) => {
    const next = Math.max(0.55, Math.min(14, z));
    setZoom(next);
    if (next <= 1) setPan({ x: 0, y: 0 });
  }, []);

  const handlePan = useCallback((x: number, y: number) => setPan({ x, y }), []);

  const handleLeave = useCallback(() => setHover(null), []);
  const handlePick = useCallback(
    (pick: WheelPick) =>
      setPicked((prev) =>
        prev && prev.type === pick.type && prev.i === pick.i ? null : pick
      ),
    []
  );

  const nowG = useMemo(() => {
    const mins = minutesSinceMidnightInTimezone(now, tz, true);
    let g = (mins - det.sunriseMin) / 24;
    if (g < 0) g += 60;
    return Math.max(0, Math.min(60, g));
  }, [now, det.sunriseMin, tz]);

  const [scrubG, setScrubG] = useState(() => (isToday ? nowG : 0));
  const [debouncedScrubG, setDebouncedScrubG] = useState(scrubG);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedScrubG(scrubG), 400);
    return () => clearTimeout(id);
  }, [scrubG]);

  const anchorAd = p.panchanga_date_ad ?? p.date_ad ?? "";
  const locationParams = useMemo(
    () =>
      p.location?.city_id != null
        ? { city_id: p.location.city_id as number }
        : p.location?.lat != null && p.location?.lon != null
          ? {
              lat: p.location.lat as number,
              lon: p.location.lon as number,
              timezone: p.location.timezone,
            }
          : undefined,
    [p.location]
  );

  const scrubDatetime = useMemo(
    () => scrubGToDatetime(anchorAd, debouncedScrubG, det.sunriseMin),
    [anchorAd, debouncedScrubG, det.sunriseMin]
  );

  const scrubbing =
    scrubPinned || Math.abs(scrubG - (isToday && !scrubPinned ? nowG : 0)) > 0.05;

  const needsAtTime =
    Boolean(anchorAd) &&
    (scrubbing || (isToday && !atTimeScrubOnly));

  const scrubQ = useQuery({
    queryKey: panchangaKeys.atTime(scrubDatetime, locationParams),
    queryFn: () => fetchPanchangaAtTime(scrubDatetime, locationParams),
    staleTime: 1000 * 60,
    placeholderData: keepPreviousData,
    enabled: needsAtTime,
  });

  /**
   * The exact-moment `/panchanga/at-time` payload is only trustworthy when the
   * at-time query is actually driving the current view (`needsAtTime`) AND the
   * data belongs to the settled datetime rather than a leftover from a previous
   * scrub/day (`!isPlaceholderData`). A disabled query keeps its last `data`, so
   * without this guard the wheel would freeze on stale markers when the day
   * changes via the year-view autoplay / day slider (and would lag the time
   * slider during the debounced refetch). When the guard fails we fall back to
   * the live sunrise-extrapolated estimate, which tracks `p`/`scrubG` instantly.
   */
  const atTimeData =
    needsAtTime && !scrubQ.isPlaceholderData ? scrubQ.data : undefined;

  const markers = useMemo(
    () => (atTimeData ? buildWheelMarkersAtTime(atTimeData) : buildWheelMarkers(p, det, scrubG)),
    [atTimeData, p, det, scrubG]
  );

  const handleScrubChange = useCallback((g: number) => {
    setScrubG(g);
    setScrubPinned(true);
  }, []);

  const snapToNow = useCallback(() => {
    setScrubPinned(false);
    setSpin(0);
    setPan({ x: 0, y: 0 });
    handleZoom(1);
    setScrubG(nowG);
  }, [nowG, handleZoom]);

  const resetToSunrise = useCallback(() => {
    setScrubPinned(true);
    setSpin(0);
    setPan({ x: 0, y: 0 });
    handleZoom(1);
    setScrubG(0);
  }, [handleZoom]);

  useEffect(() => {
    if (!isToday) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [isToday]);

  useEffect(() => {
    if (scrubPinned || !isToday) return;
    setScrubG(nowG);
  }, [nowG, isToday, scrubPinned]);

  useEffect(() => {
    setScrubPinned(false);
    setSpin(0);
    if (isToday) {
      setScrubG(nowG);
    } else {
      setScrubG(0);
    }
    // Only when the civil/vedic day changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.date_ad, p.panchanga_date_ad]);

  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpandedMode(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded, setExpandedMode]);

  useEffect(() => {
    const onPopState = () => {
      if (ignorePopRef.current) {
        ignorePopRef.current = false;
        return;
      }
      expandedHistoryRef.current = false;
      setExpanded(false);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const { pick, digits } = useLocale();
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!yearScrub) return;
    const el = stageRef.current;
    if (!el) return;
    const sync = () => {
      const { width, height } = el.getBoundingClientRect();
      const diameter = Math.min(width, height);
      el.style.setProperty("--w-year-span", `${Math.round(diameter * 0.92)}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [yearScrub, expanded]);
  const num = (n: number | string) => digits(n);
  const scrubClock = gClock(scrubG, det.sunriseMin);
  const scrubTithi = atTimeData
    ? (getPanchangaDetail(atTimeData)?.tithi as { name_ne?: string; name?: string } | undefined) ??
      (atTimeData.tithi as { name_ne?: string; name?: string } | undefined)
    : undefined;
  const tithiNe = scrubTithi?.name_ne ?? det.tithi2[0]?.ne ?? "—";
  const tithiEn = scrubTithi?.name ?? det.tithi2[0]?.en ?? tithiNe;
  const locLabel = locationLabel ?? p.location?.name ?? pick("काठमाडौं", "Kathmandu");

  const onStageMove = (e: React.MouseEvent) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    setTip({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  let tipNode: React.ReactNode = null;
  if (hover) {
    if (hover.type === "nak") {
      const ic = NAKSHATRA_ICONS[hover.i]!;
      tipNode = (
        <div className={wheelTip(true)} style={{ left: tip.x, top: tip.y }}>
          <div className={wheelTipKind}>{pick("नक्षत्र", "Nakshatra")} · {num(hover.i + 1)}</div>
          <div className={wheelTipTitle}>{pick(ic.ne, ic.en)}</div>
          <div className={wheelTipRow}>
            <span>{pick("स्वामी", "Lord")}</span>
            <b>{pick(ic.lord_ne, NAK_LORD_EN[ic.lord_ne] ?? ic.lord_ne)}</b>
          </div>
          <div className={wheelTipSym}>{ic.sym_ne}</div>
        </div>
      );
    } else {
      const rs = WHEEL_RASHIS[hover.i]!;
      tipNode = (
        <div className={wheelTip(true)} style={{ left: tip.x, top: tip.y }}>
          <div className={wheelTipKind}>{pick("राशि", "Rashi")} · {num(hover.i + 1)}</div>
          <div className={wheelTipTitle}>
            <span style={{ fontFamily: '"Noto Sans Symbols 2", "Segoe UI Symbol", serif' }}>
              {rs.sym + "\uFE0E"}
            </span>{" "}
            {pick(rs.ne, rs.en)}
          </div>
          <div className={wheelTipRow}>
            <span>{pick("महिना", "Month")}</span>
            <b>{pick(bsMonthNe, bsMonthEnOf(bsMonthNe))}</b>
          </div>
        </div>
      );
    }
  }

  const wheelNode = (
    <div
      className={cn(
        "pn-wheel",
        expanded ? wheelExpandedShell : patroWheelShell,
      )}
    >
      <div
        className={cn(wheelStage, expanded && wheelStageExpanded)}
        ref={stageRef}
        onMouseMove={onStageMove}
      >
        <WheelHead
          eyebrow={pick("पञ्चाङ्ग चक्र", "Nepali Patro · Panchanga Wheel")}
          title={
            <>
              {isToday && !scrubPinned ? pick("आजको", "Today's") : ""}{" "}
              {pick("ग्रह–नक्षत्र · तिथि–करण चक्र", "Graha–Nakshatra · Tithi–Karana wheel")}{" "}
              <span className="yr">{num(bsYear)}</span>
            </>
          }
          sub={
            <>
              {pick(det.weekday.ne, det.weekday.en)}, {pick(bsMonthNe, bsMonthEnOf(bsMonthNe))}{" "}
              {num(bsDay)} · {pick(tithiNe, tithiEn)} · {locLabel}
            </>
          }
        />

        <WheelChart
          det={det}
          markers={markers}
          spin={spin}
          tw={DEFAULT_WHEEL_TWEAKS}
          bsYear={bsYear}
          sel={picked}
          hover={hover}
          onHover={setHover}
          onLeave={handleLeave}
          onPick={handlePick}
          onSpin={setSpin}
          zoom={zoom}
          onZoom={handleZoom}
          pan={pan}
          onPan={handlePan}
        />

        {tipNode}

        <WheelPanel
          sel={picked}
          open={!!picked}
          num={num}
          onClose={() => setPicked(null)}
        />

        <div className={wheelLegend}>
          <div className={wheelLegendRow}>
            <span className={wheelLegendDot} style={{ background: "var(--w-accent)" }} />
            {pick("लग्न · वर्तमान नक्षत्र · तिथि", "Lagna · current nakshatra · tithi")}
          </div>
          <div className={wheelLegendRow}>
            <span className={wheelLegendDot} style={{ background: "#f2a81d" }} />
            {pick("सूर्य राशि", "Sun sign")}
          </div>
          <div className={wheelLegendRow}>
            <span className={wheelLegendDot} style={{ background: "#d3dce4" }} />
            {pick("चन्द्र राशि", "Moon sign")}
          </div>
          <div className={cn(wheelLegendRow, "mt-0.5 opacity-70")}>
            {pick("घुमाउन तान्नुहोस् · जुम गर्नुहोस्", "Drag to rotate · pinch to zoom")}
          </div>
        </div>

        <div className={wheelDock}>
          <div className={wheelDockTimeGrp}>
            <span className={wheelDockLabel}>{pick("समय", "Time")}</span>
            <input
              className={wheelScrub}
              type="range"
              min="0"
              max="60"
              step="0.25"
              value={scrubG}
              style={{ "--fill": `${(scrubG / 60) * 100}%` } as React.CSSProperties}
              onChange={(e) => handleScrubChange(+e.target.value)}
            />
            <span className={wheelDockVal}>{num(scrubClock)}</span>
          </div>
          <div className={wheelDockSep} />
          <div className={cn(wheelDockGrp, "shrink-0")}>
            {isToday && (
              <button
                type="button"
                className={wheelDockTodayBtn}
                title={pick("अहिलेको समय", "Current time")}
                onClick={snapToNow}
              >
                {pick("आज", "Now")}
              </button>
            )}
            <button
              type="button"
              className={wheelIconBtn}
              title={pick("उत्तर सिधा · जुम रिसेट · सूर्योदय", "North up · reset zoom · sunrise")}
              onClick={resetToSunrise}
            >
              ⟳
            </button>
            <button
              type="button"
              className={wheelIconBtn}
              title={pick("जुम इन", "Zoom in")}
              onClick={() => handleZoom(zoom * 1.4)}
            >
              +
            </button>
            <button
              type="button"
              className={wheelIconBtn}
              title={pick("जुम आउट", "Zoom out")}
              onClick={() => handleZoom(zoom / 1.4)}
            >
              −
            </button>
            <button
              type="button"
              className={wheelIconBtn}
              title={
                expanded
                  ? pick("सामान्य दृश्य", "Exit full width")
                  : pick("पूर्ण चौडाइ", "Full width view")
              }
              aria-pressed={expanded}
              onClick={toggleExpanded}
            >
              {expanded ? (
                <Minimize2 className={wheelDockIcon} strokeWidth={2} aria-hidden />
              ) : (
                <Fullscreen className={wheelDockIcon} strokeWidth={2} aria-hidden />
              )}
            </button>
          </div>
        </div>

        {yearScrub && <WheelYearScrub scrub={yearScrub} />}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        expanded &&
          "min-h-[min(90vh,960px)] max-[720px]:min-h-[520px]",
      )}
    >
      {expanded ? createPortal(wheelNode, document.body) : wheelNode}
    </div>
  );
}

function PanchangaWheelImpl(props: Props) {
  const { loading = false, p, atTimeScrubOnly, yearScrub, ...rest } = props;
  if (loading || !p) {
    return (
      <PanchangaWheelSkeleton
        bsYear={rest.bsYear}
        bsMonthNe={rest.bsMonthNe}
        bsDay={rest.bsDay}
        locationLabel={rest.locationLabel}
      />
    );
  }
  return (
    <PanchangaWheelBody
      p={p}
      atTimeScrubOnly={atTimeScrubOnly}
      yearScrub={yearScrub}
      {...rest}
    />
  );
}

export const PanchangaWheel = memo(PanchangaWheelImpl);
