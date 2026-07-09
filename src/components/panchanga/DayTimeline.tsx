import { useEffect, useMemo, useState } from "react";
import type { PanchangaDay } from "@/lib/api";
import { getPlanetRows, getPlanetsAnchorLabel } from "@/lib/panchanga-format";
import { minutesSinceMidnightInTimezone, resolveTimeZone } from "@/lib/zoned-time";
import {
  buildDayTimelineData,
  dualTimeAtGhati,
  CHOGHADIYA_EN,
  TL_GRAHA_EN,
  TL_RASHI_EN,
  type TimelineRowData,
} from "./day-timeline-data";
import { useLocale } from "@/i18n/locale";
import { patroCard, patroMono, patroSecBand, patroSkel } from "@/lib/patro-classes";
import { cn } from "@/lib/utils";
import {
  pgTlAxis,
  pgTlEventTimeMoon,
  pgTlMoonEmoji,
  pgTlRowlabel,
  pgTlRowlabelEn,
  pgTlRowline,
  pgTlSunDisc,
  pgTlSunHorizon,
  pgTlTick,
  pgTlVgridMajor,
  pgxArrow,
  pgxArrowBound,
  pgxGhati,
  pgxHour,
  pgxMoonline,
  pgxNightwash,
  pgxNowLine,
  pgxNowPill,
  pgxNowText,
  pgxPaksha,
  pgxScaleLabelDim,
  pgxSeg,
  pgxSegname,
  pgxSegnameCho,
  pgxSegnameSm,
  pgxSunhair,
  pgxSunline,
  pgxTimeLagna,
} from "@/lib/timeline-classes";

const W = 1000;
/** Left inset for row labels + start of the ghati grid (~26px tighter than before). */
const X0 = 70;
const X1 = 994;
const RULER_H = 58;
const MOON_BAND_H = 20;
const SUN_H = 28;
/** Moon events sit above the sun row, just under the घडी ruler. */
const MOON_EMOJI_Y = RULER_H + 5;
const MOON_TIME_Y = RULER_H + 16;
const T0 = RULER_H + MOON_BAND_H + SUN_H + 6;
const TRACK = 58;
const BAND = 34;
const SUNLINE_Y = RULER_H + MOON_BAND_H + 8;
const MARKER_TIME_Y = SUNLINE_Y + 13;
const SUN_R = 6;

const GHATI_TICKS = Array.from({ length: 16 }, (_, i) => i * 4);

const PLANET_SYM: Record<string, string> = {
  सूर्य: "☉",
  चन्द्र: "☽",
  मंगल: "♂",
  बुध: "☿",
  बृहस्पति: "♃",
  शुक्र: "♀",
  शनि: "♄",
  राहु: "☊",
  केतु: "☋",
};

const TRACK_CLS: Record<string, string> = {
  तिथि: "tithi",
  नक्षत्र: "nak",
  योग: "yoga",
  करण: "karana",
  चौघडिया: "cho",
  होरा: "hora",
  लग्न: "lagna",
};

function gx(g: number) {
  return X0 + (Math.max(0, Math.min(60, g)) / 60) * (X1 - X0);
}

function clampX(x: number, pad: number) {
  return Math.max(X0 + pad, Math.min(X1 - pad, x));
}

interface ChartSegment {
  ne: string;
  en: string;
  fromG: number;
  toG: number;
  bad?: boolean;
  cut?: boolean;
  transitionLocal?: string;
}

function segmentsFromRow(row: TimelineRowData): ChartSegment[] {
  let prev = 0;
  return row.items.map((it) => {
    const toG = it.endG != null ? Math.min(it.endG, 60) : 60;
    const seg: ChartSegment = {
      ne: it.name,
      en: it.nameEn ?? it.name,
      fromG: prev,
      toG,
      bad: it.bad,
      cut: it.endG != null && it.endG < 60,
      transitionLocal: it.transitionLocal,
    };
    prev = toG;
    return seg;
  });
}

interface Props {
  p?: PanchangaDay;
  dateAd?: string;
  isToday?: boolean;
  timezone?: string;
  /** HH:MM — show needle at this clock on the vedic day chart (ephemeris mode). */
  needleClock?: string;
  /** When false, hide the time needle until the user picks a time. */
  showNeedle?: boolean;
  /** First load only — inline placeholder, not the full-page loader. */
  loading?: boolean;
}

function DayTimelineBand() {
  const { pick } = useLocale();
  return (
    <div className={patroSecBand}>
      <h2 className={cn("m-0", "text-sm", "font-bold")}>{pick("दिन-चक्र", "Day cycle")}</h2>
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {pick("पूर्ण पञ्चाङ्ग रेखा · सूर्योदयदेखि सूर्योदय", "Full panchanga timeline · sunrise to sunrise")}
      </span>
      <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-medium normal-case tracking-normal text-muted-foreground">
        <i className="inline-block h-2.5 w-2.5 rounded-[3px] bg-success/34 not-italic" />
        {pick("शुभ", "Good")}
        <i className="inline-block h-2.5 w-2.5 rounded-[3px] bg-danger/30 not-italic" />
        {pick("अशुभ", "Bad")}
        <i className="inline-block h-2.5 w-2.5 rounded-[3px] bg-secondary/22 not-italic" />
        {pick("रात", "Night")}
      </span>
    </div>
  );
}

function minutesOnVedicChart(
  queryInstantLocal: string | undefined,
  anchorDateAd: string,
  needleClock: string | undefined
): number | null {
  if (needleClock) {
    const [hh, mm] = needleClock.split(":").map(Number);
    if (!Number.isNaN(hh) && !Number.isNaN(mm)) return hh * 60 + mm;
  }
  if (queryInstantLocal) {
    const [datePart, timePart] = queryInstantLocal.split(" ");
    if (!timePart) return null;
    const [hh, mm] = timePart.split(":").map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    const mins = hh * 60 + mm;
    if (datePart === anchorDateAd) return mins;
    return 24 * 60 + mins;
  }
  return null;
}

export function DayTimeline({
  p,
  dateAd,
  isToday = false,
  timezone,
  needleClock,
  showNeedle = true,
  loading = false,
}: Props) {
  const { pick, digits, isEnglish, lang } = useLocale();
  const data = useMemo(
    () => (p ? buildDayTimelineData(p, dateAd) : null),
    [p, dateAd],
  );
  const planets = useMemo(() => (p ? getPlanetRows(p) : []), [p]);
  const timeZone = resolveTimeZone(p?.location?.timezone, timezone);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!isToday) return;
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, [isToday]);

  if (loading || !p || !data) {
    return (
      <div className={cn(patroCard, "max-w-full")} aria-busy={loading || !data}>
        <DayTimelineBand />
        <div className={cn("w-full", "max-w-full", "overflow-hidden", "pl-1", "pr-2", "pt-3", "pb-1")}>
          <div className={cn(patroSkel, "w-full")} style={{ minHeight: 320 }} />
        </div>
      </div>
    );
  }

  const tracks = data.rows
    .filter((row) => row.kind !== "graha")
    .map((row) => {
      const cls = TRACK_CLS[row.label] ?? "tithi";
      const segs: ChartSegment[] =
        row.kind === "choghadiya"
          ? data.choghadiya.map((c) => ({
              ne: c.name,
              en: CHOGHADIYA_EN[c.name] ?? c.name,
              fromG: c.startG,
              toG: c.endG,
              bad: c.bad,
              cut: false,
            }))
          : row.kind === "hora"
            ? data.hora.map((h) => ({
                ne: h.name,
                en: h.nameEn,
                fromG: h.startG,
                toG: h.endG,
                bad: h.bad,
                cut: false,
              }))
            : segmentsFromRow(row);
      return { key: row.label, ne: row.label, en: row.en, cls, segs };
    });

  const H = T0 + tracks.length * TRACK + 6;
  const tLabel = (g: number) => dualTimeAtGhati(g, data.sunriseMin).clock;

  let nowG: number | null = null;
  let nowLabel = pick("अहिले", "Now");
  const anchorAd = p.panchanga_date_ad ?? p.date_ad ?? dateAd;
  const chartMins = minutesOnVedicChart(p.query_instant_local, anchorAd ?? "", needleClock);

  // The needle follows the chosen clock whatever the day's data mode is: the
  // chart is now always the civil date's udaya (sunrise-to-sunrise) day so it
  // stays aligned with the wheel, and the picked time just overlays a marker.
  if (showNeedle && chartMins != null) {
    nowG = (chartMins - data.sunriseMin) / 24;
    if (nowG < 0) nowG += 60;
    nowLabel = needleClock
      ? pick(`${digits(needleClock)} बजे`, digits(needleClock))
      : pick("छानिएको समय", "Chosen time");
  } else if (showNeedle && isToday) {
    const minsNow = minutesSinceMidnightInTimezone(now, timeZone);
    nowG = (minsNow - data.sunriseMin) / 24;
    if (nowG < 0) nowG += 60;
  }

  const trackY = (i: number) => T0 + i * TRACK;

  return (
    <div className={cn(patroCard, "max-w-full")}>
      <DayTimelineBand />

        <div className={cn("w-full", "max-w-full", "overflow-hidden", "pl-1", "pr-2", "pt-3", "pb-1")}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className={cn("block", "h-auto", "w-full", "max-w-full")}
          preserveAspectRatio="xMinYMid meet"
          role="img"
          aria-label={pick("पूर्ण दिन पञ्चाङ्ग चित्र", "Full panchanga day chart")}
        >
          <rect
            x={gx(data.dayG)}
            y={RULER_H - 8}
            width={X1 - gx(data.dayG)}
            height={H - RULER_H + 2}
            className={pgxNightwash}
          />

          <text x={X0 - 10} y={20} className={pgxScaleLabelDim()} textAnchor="end">
            {pick("घण्टा", "Hour")}
          </text>
          <text x={X0 - 10} y={47} className={pgxScaleLabelDim(true)} textAnchor="end">
            {pick("घडी", "Ghati")}
          </text>
          <line x1={X0} y1={30} x2={X1} y2={30} className={pgTlAxis} />
          {data.civilHourTicks.map(({ hour, g }) => (
            <g key={`h-${hour}-${g}`}>
              <line x1={gx(g)} y1={30} x2={gx(g)} y2={24} className={pgTlTick} />
              <text x={gx(g)} y={18} className={pgxHour} textAnchor="middle">
                {digits(hour)}
              </text>
            </g>
          ))}
          {GHATI_TICKS.map((g) => (
            <g key={`g-${g}`}>
              <line x1={gx(g)} y1={30} x2={gx(g)} y2={36} className={pgTlTick} />
              <text x={gx(g)} y={48} className={pgxGhati} textAnchor="middle">
                {digits(g)}
              </text>
            </g>
          ))}

          <line x1={X0} y1={SUNLINE_Y} x2={X1} y2={SUNLINE_Y} className={pgxSunline} />
          <line x1={X0} y1={T0 - 1} x2={X1} y2={T0 - 1} className={pgxMoonline} />
          <EventMarker g={0} sunriseMin={data.sunriseMin} kind="sunrise" anchor="start" />
          <EventMarker g={data.dayG} sunriseMin={data.sunriseMin} kind="sunset" anchor="middle" />
          {data.moonsetG != null && (
            <EventMarker g={data.moonsetG} sunriseMin={data.sunriseMin} kind="moonset" anchor="middle" />
          )}
          {data.moonriseG != null && (
            <EventMarker g={data.moonriseG} sunriseMin={data.sunriseMin} kind="moonrise" anchor="middle" />
          )}
          <EventMarker g={60} sunriseMin={data.sunriseMin} kind="next-sunrise" anchor="end" />

          {[0, data.dayG, 60].map((g) => (
            <line
              key={`hair-${g}`}
              x1={gx(g)}
              y1={T0}
              x2={gx(g)}
              y2={H - 4}
              className={pgxSunhair}
            />
          ))}

          {tracks.map((tr, ti) => {
            const y = trackY(ti);
            return (
              <g key={tr.key}>
                <text x={X0 - 10} y={y + BAND / 2 - 2} className={pgTlRowlabel} textAnchor="end">
                  {tr.ne}
                </text>
                {!isEnglish ? (
                  <text x={X0 - 10} y={y + BAND / 2 + 11} className={pgTlRowlabelEn} textAnchor="end">
                    {tr.en}
                  </text>
                ) : null}
                <line
                  x1={X0}
                  y1={y + BAND}
                  x2={X1}
                  y2={y + BAND}
                  className={pgTlRowline(ti)}
                />

                {tr.segs.map((s, si) => {
                  const x = gx(s.fromG);
                  const x2 = gx(s.toG);
                  const w = x2 - x;
                  const isActiveLagna =
                    tr.cls === "lagna" &&
                    nowG != null &&
                    nowG >= s.fromG &&
                    nowG < s.toG;
                  const segCls = pgxSeg(tr.cls, {
                    alt: tr.cls !== "cho" && tr.cls !== "hora" && si % 2 === 1,
                    active: isActiveLagna,
                    bad: s.bad,
                  });
                  const midX = clampX((x + x2) / 2, 26);
                  const narrow = w < 64;
                  const segText = pick(s.ne, s.en);
                  const [mainName, paksha] = segText.includes(", ")
                    ? [segText.split(", ")[0]!, segText.split(", ").slice(1).join(", ")]
                    : [segText, ""];

                  const clipId = `pgx-clip-${ti}-${si}`;
                  const labelY = y + BAND / 2 + 4.5;

                  return (
                    <g key={si}>
                      <defs>
                        <clipPath id={clipId}>
                          <rect
                            x={x + 1}
                            y={y}
                            width={Math.max(0, w - 2)}
                            height={BAND}
                            rx={4}
                          />
                        </clipPath>
                      </defs>
                      <rect
                        x={x + 1}
                        y={y}
                        width={Math.max(0, w - 2)}
                        height={BAND}
                        rx={4}
                        className={segCls}
                      >
                        <title>{`${pick(tr.ne, tr.en)}: ${segText} · ${tLabel(s.fromG)} – ${tLabel(s.toG)}`}</title>
                      </rect>
                      {tr.cls === "cho" || tr.cls === "hora" ? (
                        w > 20 && (
                          <text
                            x={(x + x2) / 2}
                            y={y + BAND / 2 + 4}
                            className={pgxSegnameCho(s.bad)}
                            textAnchor="middle"
                          >
                            {segText}
                          </text>
                        )
                      ) : (
                        w >= 20 && (
                          <text
                            x={midX}
                            y={labelY}
                            className={narrow ? cn(pgxSegname, pgxSegnameSm) : pgxSegname}
                            textAnchor="middle"
                            clipPath={`url(#${clipId})`}
                          >
                            {mainName}
                            {!narrow && paksha ? (
                              <tspan className={pgxPaksha}>{` · ${paksha}`}</tspan>
                            ) : null}
                          </text>
                        )
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {data.civilHourTicks.map(({ hour, g }) => (
            <line
              key={`hour-grid-${hour}-${g}`}
              x1={gx(g)}
              y1={T0}
              x2={gx(g)}
              y2={H - 4}
              className={pgTlVgridMajor}
            />
          ))}

          {tracks.map((tr, ti) => {
            const y = trackY(ti);
            if (tr.cls === "cho" || tr.cls === "hora") return null;
            return (
              <g key={`${tr.key}-cuts`}>
                {tr.segs.map((s, si) => {
                  if (!s.cut || s.toG >= 59.97) return null;
                  const x2 = gx(s.toG);
                  const time =
                    tr.cls === "lagna" && s.transitionLocal
                      ? digits(s.transitionLocal)
                      : tLabel(s.toG);
                  const prevTime =
                    si > 0 && tr.segs[si - 1]?.cut
                      ? tLabel(tr.segs[si - 1]!.toG)
                      : null;
                  if (prevTime === time) return null;
                  return (
                    <g key={`cut-${si}`}>
                      <TransitionArrow x2={x2} y={y} />
                      <text
                        x={clampX(x2, 22)}
                        y={y + BAND + 16}
                        className={pgxTimeLagna(tr.cls === "lagna")}
                        textAnchor="middle"
                      >
                        {time}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {nowG != null && nowG >= 0 && nowG <= 60 && (
            <g>
              <line x1={gx(nowG)} y1={RULER_H - 6} x2={gx(nowG)} y2={H - 4} className={pgxNowLine} />
              <rect
                x={clampX(gx(nowG), 30) - 48}
                y={RULER_H - 22}
                width={100}
                height={17}
                rx={9}
                className={pgxNowPill}
              />
              <text x={clampX(gx(nowG), 30)} y={RULER_H - 10} textAnchor="middle" className={pgxNowText}>
                {nowLabel} {tLabel(nowG)}
              </text>
            </g>
          )}
        </svg>
      </div>

      {planets.length > 0 && (
        <div className={cn("flex flex-col gap-2.5 border-t border-border px-4 py-3 pb-3.5")}>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[12.5px] font-bold leading-tight">{pick("ग्रह", "Planets")}</span>
            <span className="text-[11px] font-medium leading-snug text-muted-foreground">
              {getPlanetsAnchorLabel(p, lang)}
            </span>
          </div>
          <div className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
            {planets.map(
              ({
                label,
                rashiNe,
                coords,
                nakshatraNe,
                nakshatraEn,
                pada,
                nakshatraLordNe,
                nakshatraLordEn,
              }) => {
              const labelL = pick(label, TL_GRAHA_EN[label] ?? label);
              const rashiL = pick(rashiNe ?? "—", TL_RASHI_EN[rashiNe ?? ""] ?? rashiNe ?? "—");
              const nakName = pick(nakshatraNe, nakshatraEn ?? nakshatraNe);
              const padaLabel =
                pada != null
                  ? pick(`पद ${digits(pada)}`, `Pada ${digits(pada)}`)
                  : undefined;
              const lordL = pick(nakshatraLordNe, nakshatraLordEn ?? nakshatraLordNe);
              const nakLine =
                nakName && padaLabel ? `${nakName} · ${padaLabel}` : nakName ?? undefined;
              return (
              <div
                key={label}
                className="flex w-full flex-col items-center gap-0.5 rounded-lg bg-foreground/4 px-2 py-1.5 shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]"
                title={[labelL, rashiL, coords, nakLine, lordL].filter(Boolean).join(" · ")}
              >
                <span className="text-[13px] leading-none text-secondary dark:text-accent">
                  {PLANET_SYM[label] ?? "★"}
                </span>
                <span className="inline-flex max-w-full items-baseline justify-center gap-0.5 text-center text-[11px] font-semibold leading-tight">
                  <span className="truncate">{labelL}</span>
                  <span className="shrink-0">–{rashiL}</span>
                </span>
                <span className={cn(patroMono, "text-[10.5px] font-medium text-muted-foreground tabular-nums")}>{coords}</span>
                {nakLine ? (
                  <span className="max-w-full truncate text-center text-[10px] leading-tight text-muted-foreground">
                    {nakLine}
                  </span>
                ) : null}
                {lordL ? (
                  <span className="text-center text-[10px] leading-tight text-muted-foreground/90">
                    {pick("नक्षत्रेश", "Lord")} {lordL}
                  </span>
                ) : null}
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** ↔ marker on the row horizontal line at a segment boundary. */
function TransitionArrow({ x2, y }: { x2: number; y: number }) {
  const rowY = y + BAND;

  return (
    <g className={pgxArrow}>
      <line x1={x2 - 14} y1={rowY} x2={x2 - 5} y2={rowY} />
      <path d={`M ${x2 - 6} ${rowY - 3.6} L ${x2 - 1.5} ${rowY} L ${x2 - 6} ${rowY + 3.6} z`} />
      <line x1={x2 + 14} y1={rowY} x2={x2 + 5} y2={rowY} />
      <path d={`M ${x2 + 6} ${rowY - 3.6} L ${x2 + 1.5} ${rowY} L ${x2 + 6} ${rowY + 3.6} z`} />
      <line className={pgxArrowBound} x1={x2} y1={rowY - 5} x2={x2} y2={rowY + 5} />
    </g>
  );
}

function SunHalfIcon({ x, y, variant }: { x: number; y: number; variant: "rise" | "set" }) {
  const arc =
    variant === "rise"
      ? `M ${x - SUN_R} ${y} A ${SUN_R} ${SUN_R} 0 0 1 ${x + SUN_R} ${y} Z`
      : `M ${x - SUN_R} ${y} A ${SUN_R} ${SUN_R} 0 0 0 ${x + SUN_R} ${y} Z`;

  return (
    <g aria-hidden>
      <line x1={x - SUN_R - 3} y1={y} x2={x + SUN_R + 3} y2={y} className={pgTlSunHorizon} />
      <path d={arc} className={pgTlSunDisc} />
    </g>
  );
}

function EventMarker({
  g,
  sunriseMin,
  kind,
  anchor,
}: {
  g: number;
  sunriseMin: number;
  kind: "sunrise" | "sunset" | "moonrise" | "moonset" | "next-sunrise";
  anchor: "start" | "middle" | "end";
}) {
  const { clock } = dualTimeAtGhati(g, sunriseMin);
  const x = gx(g);
  const labelX = anchor === "start" ? x : anchor === "end" ? x : x;
  const isSun = kind === "sunrise" || kind === "sunset" || kind === "next-sunrise";
  const sunVariant = kind === "sunset" ? "set" : "rise";
  const moonEmoji = kind === "moonset" ? "🌘" : "🌒";

  return (
    <g>
      {isSun ? (
        <SunHalfIcon x={x} y={SUNLINE_Y} variant={sunVariant} />
      ) : (
        <text
          x={x}
          y={MOON_EMOJI_Y}
          textAnchor="middle"
          className={pgTlMoonEmoji}
          dominantBaseline="central"
          aria-hidden
        >
          {moonEmoji}
        </text>
      )}
      <text
        x={labelX}
        y={isSun ? MARKER_TIME_Y : MOON_TIME_Y}
        textAnchor={anchor}
        className={pgTlEventTimeMoon(!isSun)}
      >
        {clock}
      </text>
    </g>
  );
}
