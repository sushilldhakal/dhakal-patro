import { useEffect, useMemo, useState } from "react";
import type { PanchangaDay } from "@/lib/api";
import { getPlanetRows, getPlanetsAnchorLabel, toNepaliDigits } from "@/lib/panchanga-format";
import { minutesSinceMidnightInTimezone, resolveTimeZone } from "@/lib/zoned-time";
import {
  buildDayTimelineData,
  dualTimeAtGhati,
  type TimelineRowData,
} from "./day-timeline-data";

const W = 1000;
const X0 = 96;
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
  p: PanchangaDay;
  dateAd?: string;
  isToday?: boolean;
  timezone?: string;
  /** HH:MM — show needle at this clock on the vedic day chart (ephemeris mode). */
  needleClock?: string;
}

function minutesOnVedicChart(
  queryInstantLocal: string | undefined,
  anchorDateAd: string,
  needleClock: string | undefined
): number | null {
  if (queryInstantLocal) {
    const [datePart, timePart] = queryInstantLocal.split(" ");
    if (!timePart) return null;
    const [hh, mm] = timePart.split(":").map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    const mins = hh * 60 + mm;
    if (datePart === anchorDateAd) return mins;
    return 24 * 60 + mins;
  }
  if (!needleClock) return null;
  const [hh, mm] = needleClock.split(":").map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

export function DayTimeline({ p, dateAd, isToday = false, timezone, needleClock }: Props) {
  const data = useMemo(() => buildDayTimelineData(p, dateAd), [p, dateAd]);
  const planets = useMemo(() => getPlanetRows(p), [p]);
  const timeZone = resolveTimeZone(p.location?.timezone, timezone);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!isToday) return;
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, [isToday]);

  if (!data) return null;

  const tracks = data.rows
    .filter((row) => row.kind !== "graha")
    .map((row) => {
      const cls = TRACK_CLS[row.label] ?? "tithi";
      const segs: ChartSegment[] =
        row.kind === "choghadiya"
          ? data.choghadiya.map((c) => ({
              ne: c.name,
              fromG: c.startG,
              toG: c.endG,
              bad: c.bad,
              cut: false,
            }))
          : segmentsFromRow(row);
      return { key: row.label, ne: row.label, en: row.en, cls, segs };
    });

  const H = T0 + tracks.length * TRACK + 6;
  const tLabel = (g: number) => dualTimeAtGhati(g, data.sunriseMin).clock;

  let nowG: number | null = null;
  let nowLabel = "अहिले";
  const anchorAd = p.panchanga_date_ad ?? p.date_ad ?? dateAd;
  const ephemerisNeedle = p.mode === "ephemeris";
  const chartMins = minutesOnVedicChart(p.query_instant_local, anchorAd ?? "", needleClock);

  if (ephemerisNeedle && chartMins != null) {
    nowG = (chartMins - data.sunriseMin) / 24;
    if (nowG < 0) nowG += 60;
    nowLabel = needleClock ? `${toNepaliDigits(needleClock)} बजे` : "छानिएको समय";
  } else if (isToday) {
    const minsNow = minutesSinceMidnightInTimezone(now, timeZone);
    nowG = (minsNow - data.sunriseMin) / 24;
    if (nowG < 0) nowG += 60;
  }

  const trackY = (i: number) => T0 + i * TRACK;

  return (
    <div className="pg-sec pgx-card">
      <div className="pg-sec-band pgx-band">
        <h2>दिन-चक्र</h2>
        <span>पूर्ण पञ्चाङ्ग रेखा · sunrise to sunrise</span>
        <span className="pgx-legend">
          <i className="pgx-key good" />
          शुभ
          <i className="pgx-key bad" />
          अशुभ
          <i className="pgx-key night" />
          रात
        </span>
      </div>

      <div className="pgx-scroll">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="pgx-svg"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Full panchanga day chart"
        >
          <rect
            x={gx(data.dayG)}
            y={RULER_H - 8}
            width={X1 - gx(data.dayG)}
            height={H - RULER_H + 2}
            className="pgx-nightwash"
          />

          <text x={X0 - 10} y={20} className="pgx-scale-label" textAnchor="end">
            घण्टा
          </text>
          <text x={X0 - 10} y={47} className="pgx-scale-label dim" textAnchor="end">
            घडी
          </text>
          <line x1={X0} y1={30} x2={X1} y2={30} className="pg-tl-axis" />
          {data.civilHourTicks.map(({ hour, g }) => (
            <g key={`h-${hour}-${g}`}>
              <line x1={gx(g)} y1={30} x2={gx(g)} y2={24} className="pg-tl-tick" />
              <text x={gx(g)} y={18} className="pgx-hour" textAnchor="middle">
                {toNepaliDigits(hour)}
              </text>
            </g>
          ))}
          {GHATI_TICKS.map((g) => (
            <g key={`g-${g}`}>
              <line x1={gx(g)} y1={30} x2={gx(g)} y2={36} className="pg-tl-tick" />
              <text x={gx(g)} y={48} className="pgx-ghati" textAnchor="middle">
                {toNepaliDigits(g)}
              </text>
            </g>
          ))}

          <line x1={X0} y1={SUNLINE_Y} x2={X1} y2={SUNLINE_Y} className="pgx-sunline" />
          <line x1={X0} y1={T0 - 1} x2={X1} y2={T0 - 1} className="pgx-moonline" />
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
              className="pgx-sunhair"
            />
          ))}

          {tracks.map((tr, ti) => {
            const y = trackY(ti);
            return (
              <g key={tr.key}>
                <text x={X0 - 10} y={y + BAND / 2 - 2} className="pg-tl-rowlabel" textAnchor="end">
                  {tr.ne}
                </text>
                <text x={X0 - 10} y={y + BAND / 2 + 11} className="pg-tl-rowlabel-en" textAnchor="end">
                  {tr.en}
                </text>
                <line
                  x1={X0}
                  y1={y + BAND}
                  x2={X1}
                  y2={y + BAND}
                  className={`pg-tl-rowline pg-tl-rowline-${ti % 7}`}
                />

                {tr.segs.map((s, si) => {
                  const x = gx(s.fromG);
                  const x2 = gx(s.toG);
                  const w = x2 - x;
                      const isActiveLagna =
                        ephemerisNeedle &&
                        tr.cls === "lagna" &&
                        nowG != null &&
                        nowG >= s.fromG &&
                        nowG < s.toG;
                      const segCls =
                        tr.cls === "cho"
                          ? s.bad
                            ? "pgx-seg cho-bad"
                            : "pgx-seg cho-good"
                          : `pgx-seg ${tr.cls}${si % 2 ? " alt" : ""}${isActiveLagna ? " active" : ""}`;
                  const midX = clampX((x + x2) / 2, 26);
                  const narrow = w < 64;
                  const [mainName, paksha] = s.ne.includes(", ")
                    ? [s.ne.split(", ")[0]!, s.ne.split(", ").slice(1).join(", ")]
                    : [s.ne, ""];

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
                        <title>{`${tr.ne}: ${s.ne} · ${tLabel(s.fromG)} – ${tLabel(s.toG)}`}</title>
                      </rect>
                      {tr.cls === "cho" ? (
                        w > 26 && (
                          <text
                            x={(x + x2) / 2}
                            y={y + BAND / 2 + 4}
                            className={`pgx-segname cho${s.bad ? " bad" : ""}`}
                            textAnchor="middle"
                          >
                            {s.ne}
                          </text>
                        )
                      ) : (
                        w >= 20 && (
                          <text
                            x={midX}
                            y={labelY}
                            className={narrow ? "pgx-segname pgx-segname-sm" : "pgx-segname"}
                            textAnchor="middle"
                            clipPath={`url(#${clipId})`}
                          >
                            {mainName}
                            {!narrow && paksha ? (
                              <tspan className="pgx-paksha">{` · ${paksha}`}</tspan>
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
              className="pg-tl-vgrid-major"
            />
          ))}

          {tracks.map((tr, ti) => {
            const y = trackY(ti);
            if (tr.cls === "cho") return null;
            return (
              <g key={`${tr.key}-cuts`}>
                {tr.segs.map((s, si) => {
                  if (!s.cut || s.toG >= 59.97) return null;
                  const x2 = gx(s.toG);
                  const time =
                    tr.cls === "lagna" && s.transitionLocal
                      ? toNepaliDigits(s.transitionLocal)
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
                        className={tr.cls === "lagna" ? "pgx-time lagna" : "pgx-time"}
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
            <g className="pgx-now">
              <line x1={gx(nowG)} y1={RULER_H - 6} x2={gx(nowG)} y2={H - 4} />
              <rect
                x={clampX(gx(nowG), 30) - 48}
                y={RULER_H - 22}
                width={100}
                height={17}
                rx={9}
                className="pgx-now-pill"
              />
              <text x={clampX(gx(nowG), 30)} y={RULER_H - 10} textAnchor="middle" className="pgx-now-text">
                {nowLabel} {tLabel(nowG)}
              </text>
            </g>
          )}
        </svg>
      </div>

      {planets.length > 0 && (
        <div className="pgx-grahas">
          <div className="pgx-grahas-label">
            <span className="ne">ग्रह</span>
            <span className="en">{getPlanetsAnchorLabel(p)}</span>
          </div>
          <div className="pgx-graha-row">
            {planets.map(({ label, rashiNe, coords }) => (
              <div key={label} className="pgx-graha" title={`${label} — ${rashiNe ?? ""} ${coords}`}>
                <span className="pgx-graha-sym">{PLANET_SYM[label] ?? "★"}</span>
                <span className="pgx-graha-name">
                  {label}–{rashiNe ?? "—"}
                </span>
                <span className="pgx-graha-deg mono">{coords}</span>
              </div>
            ))}
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
    <g className="pgx-arrow">
      <line x1={x2 - 14} y1={rowY} x2={x2 - 5} y2={rowY} />
      <path d={`M ${x2 - 6} ${rowY - 3.6} L ${x2 - 1.5} ${rowY} L ${x2 - 6} ${rowY + 3.6} z`} />
      <line x1={x2 + 14} y1={rowY} x2={x2 + 5} y2={rowY} />
      <path d={`M ${x2 + 6} ${rowY - 3.6} L ${x2 + 1.5} ${rowY} L ${x2 + 6} ${rowY + 3.6} z`} />
      <line className="pgx-arrow-bound" x1={x2} y1={rowY - 5} x2={x2} y2={rowY + 5} />
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
      <line x1={x - SUN_R - 3} y1={y} x2={x + SUN_R + 3} y2={y} className="pg-tl-sun-horizon" />
      <path d={arc} className="pg-tl-sun-disc" />
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
          className="pg-tl-moon-emoji"
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
        className={isSun ? "pg-tl-event-time" : "pg-tl-event-time moon"}
      >
        {clock}
      </text>
    </g>
  );
}
