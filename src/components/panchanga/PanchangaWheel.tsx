import { useTranslation } from "react-i18next";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Clock,
  FastForward,
  Fullscreen,
  Minimize2,
  Pause,
  Play,
  Rewind,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
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
  getWheelRashis,
  type WheelDetail,
} from "@/lib/wheel-data";
import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { WheelChart, type WheelHover, type WheelPick } from "./WheelChart";
import { WheelPanel } from "./WheelPanel";
import { useLocale, bilingualText } from "@/i18n/locale";
import { patroSkel, patroWheelShell } from "@/lib/patro-classes";
import {
  wheelDock,
  wheelDockEditInput,
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
  wheelYearScrubBtnActive,
  wheelYearScrubSpeed,
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
  /** Autoplay direction: -1 backward, 0 paused, 1 forward. */
  direction: -1 | 0 | 1;
  /** Autoplay speed multiplier while playing: 1 | 2 | 4 | 8. */
  speed: number;
  /** Play/step forward — repeated presses ramp 1×→2×→4×→8×. */
  onForward: () => void;
  /** Play/step backward — repeated presses ramp 1×→2×→4×→8×. */
  onBackward: () => void;
  /** Stop playback (resets speed). */
  onPause: () => void;
  /** Receives the global day index; the page maps it back to (year, day). */
  onDayChange: (day: number) => void;
  /** Jump straight to a day-in-year (1-based) within the active year; pauses playback. */
  onJumpDay: (dayInYear: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
  /** Multi-year range context — shows the active year + day-in-year label. */
  yearLabel?: string;
  dayInYear?: number;
  daysInYear?: number;
};

/** Year-view playback controls (rewind / play-pause / fast-forward) for the dock. */
function WheelYearPlayback({ scrub }: { scrub: YearWheelScrub }) {
  const { t } = useTranslation();
  const { lang, digits } = useLocale();
  const { direction, speed, onForward, onBackward, onPause } = scrub;
  const num = (n: number) => digits(n);
  const playing = direction !== 0;
  const speedTitle = (base: string) => (playing ? `${base} · ${num(speed)}×` : base);

  return (
    <div className={cn(wheelDockGrp, "shrink-0")}>
      {/* Rewind — press repeatedly to accelerate backward (2×/4×/8×). */}
      <button
        type="button"
        className={cn(wheelIconBtn, direction === -1 && wheelYearScrubBtnActive)}
        onClick={onBackward}
        aria-label={bilingualText(lang, "पछाडि", "Rewind")}
        aria-pressed={direction === -1}
        title={speedTitle(bilingualText(lang, "पछाडि चलाउनुहोस्", "Play backward"))}
      >
        <Rewind className={wheelDockIcon} strokeWidth={2} aria-hidden />
      </button>
      {/* Center: play forward when paused, pause when playing. */}
      <button
        type="button"
        className={wheelIconBtn}
        onClick={playing ? onPause : onForward}
        aria-label={playing ? t("panchanga_year.pause") : t("panchanga_year.play")}
        title={playing ? t("panchanga_year.pause") : t("panchanga_year.play_title")}
      >
        {playing ? (
          <Pause className={wheelDockIcon} strokeWidth={2} aria-hidden />
        ) : (
          <Play className={cn(wheelDockIcon, "translate-x-[1px]")} strokeWidth={2} aria-hidden />
        )}
      </button>
      {/* Fast-forward — press repeatedly to accelerate forward (2×/4×/8×). */}
      <button
        type="button"
        className={cn(wheelIconBtn, direction === 1 && wheelYearScrubBtnActive)}
        onClick={onForward}
        aria-label={bilingualText(lang, "अगाडि", "Fast forward")}
        aria-pressed={direction === 1}
        title={speedTitle(bilingualText(lang, "अगाडि चलाउनुहोस्", "Play forward"))}
      >
        <FastForward className={wheelDockIcon} strokeWidth={2} aria-hidden />
      </button>
      <span className={cn(wheelYearScrubSpeed, !playing && "opacity-0")} aria-hidden={!playing}>
        {num(speed)}×
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
  /** दिन-रात mode: anchor the time scrubber/clock/now-needle to 00:00 (midnight)
   * instead of sunrise, so the wheel's time axis matches the दिन-रात framing. */
  civil?: boolean;
  /** Year view: vertical day scrub + autoplay on the right inside the wheel. */
  yearScrub?: YearWheelScrub;
}

function PanchangaWheelSkeleton({
  bsYear,
  bsMonthNe,
  bsDay,
  locationLabel,
}: Pick<Props, "bsYear" | "bsMonthNe" | "bsDay" | "locationLabel">) {
  const { lang, digits } = useLocale();
  const num = (n: number | string) => digits(n);
  const locLabel = locationLabel ?? bilingualText(lang, "काठमाडौं", "Kathmandu");

  return (
    <div className={cn("pn-wheel", patroWheelShell)} aria-busy="true">
      <div className={wheelStage}>
        <WheelHead
          eyebrow={bilingualText(lang, "पञ्चाङ्ग चक्र", "Nepali Patro · Panchanga Wheel")}
          title={
            <>
              {bilingualText(lang, "ग्रह–नक्षत्र · तिथि–करण चक्र", "Graha–Nakshatra · Tithi–Karana wheel")}{" "}
              <span className="yr">{num(bsYear)}</span>
            </>
          }
          sub={
            <>
              {bilingualText(lang, bsMonthNe, bsMonthEnOf(bsMonthNe))} {num(bsDay)} · {locLabel}
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
  civil = false,
  yearScrub,
}: WheelBodyProps & { atTimeScrubOnly?: boolean; civil?: boolean; yearScrub?: YearWheelScrub }) {
  // दिन-रात re-anchors the time scrubber to midnight: sunriseMin drives every
  // g↔clock / now-needle / scrub-datetime calc, so overriding it to 0 makes the
  // wheel's time axis run 00:00 → 24:00 instead of sunrise → sunrise.
  const det: WheelDetail = useMemo(() => {
    const d = buildWheelDetail(p);
    return civil ? { ...d, sunriseMin: 0 } : d;
  }, [p, civil]);
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
  const [showYearTime, setShowYearTime] = useState(false);
  const [editingDay, setEditingDay] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
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

  // Commit an edited "HH:MM" clock value → convert to a g-offset from sunrise
  // (mirrors the nowG math) and pin the wheel to that moment of the same day.
  const commitTimeEdit = useCallback(
    (value: string) => {
      setEditingTime(false);
      const [hh, mm] = value.split(":").map(Number);
      if (hh == null || mm == null || Number.isNaN(hh) || Number.isNaN(mm)) return;
      const mins = hh * 60 + mm;
      let g = (mins - det.sunriseMin) / 24;
      g = ((g % 60) + 60) % 60;
      handleScrubChange(g);
    },
    [det.sunriseMin, handleScrubChange],
  );

  const commitDayEdit = useCallback(
    (value: string) => {
      setEditingDay(false);
      if (!yearScrub) return;
      const n = Number(value);
      if (!Number.isFinite(n)) return;
      yearScrub.onJumpDay(Math.round(n));
    },
    [yearScrub],
  );

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

  const dayKey = p.panchanga_date_ad ?? p.date_ad;
  const [trackedDayKey, setTrackedDayKey] = useState(dayKey);
  if (dayKey !== trackedDayKey) {
    setTrackedDayKey(dayKey);
    setScrubPinned(false);
    setSpin(0);
    setScrubG(isToday ? nowG : 0);
  }

  useEffect(() => {
    if (scrubPinned || !isToday) return;
    // Live-follow the clock hand when the user has not pinned a custom time.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScrubG(nowG);
  }, [nowG, isToday, scrubPinned]);

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

  const { lang, digits } = useLocale();
  const stageRef = useRef<HTMLDivElement>(null);
  const num = (n: number | string) => digits(n);
  const scrubClock = gClock(scrubG, det.sunriseMin);
  const scrubTithi = atTimeData
    ? (getPanchangaDetail(atTimeData)?.tithi as { name_ne?: string; name?: string } | undefined) ??
      (atTimeData.tithi as { name_ne?: string; name?: string } | undefined)
    : undefined;
  const tithiNe = scrubTithi?.name_ne ?? det.tithi2[0]?.ne ?? "—";
  const tithiEn = scrubTithi?.name ?? det.tithi2[0]?.en ?? tithiNe;
  const locLabel = locationLabel ?? p.location?.name ?? bilingualText(lang, "काठमाडौं", "Kathmandu");

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
          <div className={wheelTipKind}>{bilingualText(lang, "नक्षत्र", "Nakshatra")} · {num(hover.i + 1)}</div>
          <div className={wheelTipTitle}>{bilingualText(lang, ic.ne, ic.en)}</div>
          <div className={wheelTipRow}>
            <span>{bilingualText(lang, "स्वामी", "Lord")}</span>
            <b>{bilingualText(lang, ic.lord_ne, NAK_LORD_EN[ic.lord_ne] ?? ic.lord_ne)}</b>
          </div>
          <div className={wheelTipSym}>{ic.sym_ne}</div>
        </div>
      );
    } else {
      const rs = getWheelRashis()[hover.i]!;
      tipNode = (
        <div className={wheelTip(true)} style={{ left: tip.x, top: tip.y }}>
          <div className={wheelTipKind}>{bilingualText(lang, "राशि", "Rashi")} · {num(hover.i + 1)}</div>
          <div className={wheelTipTitle}>
            {bilingualText(lang, rs.ne, rs.en)}
          </div>
          <div className={wheelTipRow}>
            <span>{bilingualText(lang, "महिना", "Month")}</span>
            <b>{bilingualText(lang, bsMonthNe, bsMonthEnOf(bsMonthNe))}</b>
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
          eyebrow={bilingualText(lang, "पञ्चाङ्ग चक्र", "Nepali Patro · Panchanga Wheel")}
          title={
            <>
              {isToday && !scrubPinned ? bilingualText(lang, "आजको", "Today's") : ""}{" "}
              {bilingualText(lang, "ग्रह–नक्षत्र · तिथि–करण चक्र", "Graha–Nakshatra · Tithi–Karana wheel")}{" "}
              <span className="yr">{num(bsYear)}</span>
            </>
          }
          sub={
            <>
              {bilingualText(lang, det.weekday.ne, det.weekday.en)}, {bilingualText(lang, bsMonthNe, bsMonthEnOf(bsMonthNe))}{" "}
              {num(bsDay)} · {bilingualText(lang, tithiNe, tithiEn)} · {locLabel}
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
            {bilingualText(lang, "लग्न · वर्तमान नक्षत्र · तिथि", "Lagna · current nakshatra · tithi")}
          </div>
          <div className={wheelLegendRow}>
            <span className={wheelLegendDot} style={{ background: "#f2a81d" }} />
            {bilingualText(lang, "सूर्य राशि", "Sun sign")}
          </div>
          <div className={wheelLegendRow}>
            <span className={wheelLegendDot} style={{ background: "#d3dce4" }} />
            {bilingualText(lang, "चन्द्र राशि", "Moon sign")}
          </div>
          <div className={cn(wheelLegendRow, "mt-0.5 opacity-70")}>
            {bilingualText(lang, "घुमाउन तान्नुहोस् · जुम गर्नुहोस्", "Drag to rotate · pinch to zoom")}
          </div>
        </div>

        <div className={wheelDock}>
          {yearScrub ? (
            <>
              <WheelYearPlayback scrub={yearScrub} />
              <div className={wheelDockSep} />
              <div className={cn(wheelDockGrp, "min-w-0 justify-center")}>
                {editingDay ? (
                  <span className={cn(wheelDockVal, "inline-flex min-w-0 items-center gap-1")}>
                    {yearScrub.yearLabel != null && (
                      <span className="text-[var(--w-ink-dim)]">{yearScrub.yearLabel} · </span>
                    )}
                    <input
                      type="number"
                      autoFocus
                      defaultValue={yearScrub.dayInYear ?? yearScrub.day}
                      min={1}
                      max={yearScrub.daysInYear ?? yearScrub.totalDays}
                      aria-label={bilingualText(lang, "दिन जानुहोस्", "Jump to day")}
                      className={cn(wheelDockEditInput, "w-[54px] max-[720px]:w-[44px]")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitDayEdit((e.target as HTMLInputElement).value);
                        else if (e.key === "Escape") setEditingDay(false);
                      }}
                      onBlur={(e) => commitDayEdit(e.target.value)}
                    />
                    <span className="text-[var(--w-ink-dim)]">
                      /{num(yearScrub.daysInYear ?? yearScrub.totalDays)}
                    </span>
                  </span>
                ) : (
                  <button
                    type="button"
                    className={cn(wheelDockVal, "min-w-0 cursor-pointer whitespace-nowrap")}
                    title={bilingualText(lang, "दिन जानुहोस्", "Jump to day")}
                    onClick={() => {
                      yearScrub.onPause();
                      setEditingDay(true);
                    }}
                  >
                    {yearScrub.yearLabel != null &&
                    yearScrub.dayInYear != null &&
                    yearScrub.daysInYear != null ? (
                      <>
                        <span className="text-[var(--w-ink-dim)]">{yearScrub.yearLabel} · </span>
                        {num(yearScrub.dayInYear)}
                        <span className="text-[var(--w-ink-dim)]">/{num(yearScrub.daysInYear)}</span>
                      </>
                    ) : (
                      <>
                        {num(yearScrub.day)}
                        <span className="text-[var(--w-ink-dim)]">/{num(yearScrub.totalDays)}</span>
                      </>
                    )}
                  </button>
                )}
                {editingTime ? (
                  <input
                    type="time"
                    autoFocus
                    defaultValue={scrubClock}
                    aria-label={bilingualText(lang, "समय", "Time")}
                    className={cn(wheelDockEditInput, "w-[94px] max-[720px]:w-[80px]")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitTimeEdit((e.target as HTMLInputElement).value);
                      else if (e.key === "Escape") setEditingTime(false);
                    }}
                    onBlur={(e) => commitTimeEdit(e.target.value)}
                  />
                ) : showYearTime ? (
                  <button
                    type="button"
                    className={cn(wheelDockVal, "cursor-pointer whitespace-nowrap")}
                    title={bilingualText(lang, "समय बदल्नुहोस्", "Edit time")}
                    onClick={() => {
                      yearScrub.onPause();
                      setEditingTime(true);
                    }}
                  >
                    {num(scrubClock)}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={wheelIconBtn}
                    title={bilingualText(lang, "समय हेर्नुहोस्", "Show / edit time")}
                    onClick={() => {
                      yearScrub.onPause();
                      setShowYearTime(true);
                      setEditingTime(true);
                    }}
                  >
                    <Clock className={wheelDockIcon} strokeWidth={2} aria-hidden />
                  </button>
                )}
              </div>
              <div className={wheelDockSep} />
              <div className={cn(wheelDockGrp, "shrink-0")}>
                <button
                  type="button"
                  className={wheelIconBtn}
                  title={bilingualText(lang, 
                    `रिलोड · जुम रिसेट · ${civil ? "मध्यरात" : "सूर्योदय"}`,
                    `Reload · reset zoom · ${civil ? "midnight" : "sunrise"}`,
                  )}
                  onClick={resetToSunrise}
                >
                  <RotateCcw className={wheelDockIcon} strokeWidth={2} aria-hidden />
                </button>
                <button
                  type="button"
                  className={wheelIconBtn}
                  title={bilingualText(lang, "जुम इन", "Zoom in")}
                  onClick={() => handleZoom(zoom * 1.4)}
                >
                  <ZoomIn className={wheelDockIcon} strokeWidth={2} aria-hidden />
                </button>
                <button
                  type="button"
                  className={wheelIconBtn}
                  title={bilingualText(lang, "जुम आउट", "Zoom out")}
                  onClick={() => handleZoom(zoom / 1.4)}
                >
                  <ZoomOut className={wheelDockIcon} strokeWidth={2} aria-hidden />
                </button>
                <button
                  type="button"
                  className={wheelIconBtn}
                  title={
                    expanded
                      ? bilingualText(lang, "सामान्य दृश्य", "Exit full width")
                      : bilingualText(lang, "पूर्ण चौडाइ", "Full width view")
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
            </>
          ) : (
            <>
              <div className={wheelDockTimeGrp}>
                <span className={wheelDockLabel}>{bilingualText(lang, "समय", "Time")}</span>
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
                    title={bilingualText(lang, "अहिलेको समय", "Current time")}
                    onClick={snapToNow}
                  >
                    {bilingualText(lang, "आज", "Now")}
                  </button>
                )}
                <button
                  type="button"
                  className={wheelIconBtn}
                  title={bilingualText(lang, 
                    `उत्तर सिधा · जुम रिसेट · ${civil ? "मध्यरात" : "सूर्योदय"}`,
                    `North up · reset zoom · ${civil ? "midnight" : "sunrise"}`,
                  )}
                  onClick={resetToSunrise}
                >
                  ⟳
                </button>
                <button
                  type="button"
                  className={wheelIconBtn}
                  title={bilingualText(lang, "जुम इन", "Zoom in")}
                  onClick={() => handleZoom(zoom * 1.4)}
                >
                  +
                </button>
                <button
                  type="button"
                  className={wheelIconBtn}
                  title={bilingualText(lang, "जुम आउट", "Zoom out")}
                  onClick={() => handleZoom(zoom / 1.4)}
                >
                  −
                </button>
                <button
                  type="button"
                  className={wheelIconBtn}
                  title={
                    expanded
                      ? bilingualText(lang, "सामान्य दृश्य", "Exit full width")
                      : bilingualText(lang, "पूर्ण चौडाइ", "Full width view")
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
            </>
          )}
        </div>
      </div>
    </div>
  );

  return expanded ? createPortal(wheelNode, document.body) : wheelNode;
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
