import { useMemo } from "react";
import { Moon, Sunrise, SunMoon, Sunset } from "lucide-react";
import type { PanchangaDay } from "@/lib/api";
import { toNepaliDigits } from "@/lib/panchanga-format";
import {
  buildDayTimelineData,
  dualTimeAtGhati,
  type DayTimelineData,
  type TimelineRowData,
  type TimelineSegment,
} from "./day-timeline-data";

const W = 1000;
const X_LBL = 6;
const X0 = 96;
const X1 = 994;
const ROW_BAND_HALF = 36;

/** Layout — civil hours drive column grid; ghati is a secondary scale below. */
const CIVIL_LABEL_Y = 16;
const GHATI_LABEL_Y = 34;
const EVENTS_TOP = 48;
const EVENTS_H = 30;
const GRID_TOP = EVENTS_TOP + EVENTS_H + 6;
const ROW0 = 128;
const ROW_STEP = 72;

const GHATI_TICKS = Array.from({ length: 16 }, (_, i) => i * 4);

function makeGx(gMin: number, gMax: number) {
  return (g: number) => X0 + ((g - gMin) / (gMax - gMin)) * (X1 - X0);
}

interface Props {
  p: PanchangaDay;
  dateAd?: string;
}

export function DayTimeline({ p, dateAd }: Props) {
  const data = useMemo(() => buildDayTimelineData(p, dateAd), [p, dateAd]);
  if (!data) return null;

  const gx = makeGx(data.gMin, data.gMax);
  const rows = data.rows;
  const rowY = (i: number) => ROW0 + i * ROW_STEP;
  const choY = rowY(rows.length);
  const gridBottom = choY + 44;
  const H = gridBottom + 20;

  return (
    <div className="pg-timeline-card">
      <div className="pg-tl-head">
        <div className="pg-tl-head-text">
          <h2 className="text-base font-bold m-0">दिन-रेखा · ६० घडी</h2>
          <span className="pg-tl-sub">
            सूर्योदयदेखि सूर्योदयसम्म · घण्टा र घडी दुवै
          </span>
        </div>
        <span className="pg-tl-legend">
          <span className="pg-tl-key day" />
          दिन
          <span className="pg-tl-key night" />
          रात
        </span>
      </div>

      <div className="pg-tl-fit">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="pg-tl-svg"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Day timeline — 60 ghati panchanga chart"
        >
          <TimelineCanvas
            data={data}
            gx={gx}
            rows={rows}
            rowY={rowY}
            gridBottom={gridBottom}
          />
        </svg>
      </div>

    </div>
  );
}

function TimelineCanvas({
  data,
  gx,
  rows,
  rowY,
  gridBottom,
}: {
  data: DayTimelineData;
  gx: (g: number) => number;
  rows: TimelineRowData[];
  rowY: (i: number) => number;
  gridBottom: number;
}) {
  const eventsCenterY = EVENTS_TOP + EVENTS_H / 2;

  return (
    <>
      {/* civil-hour column grid (normal time) */}
      {data.civilHourTicks.map(({ hour, g }) => (
        <line
          key={`civil-grid-${hour}`}
          x1={gx(g)}
          y1={GRID_TOP}
          x2={gx(g)}
          y2={gridBottom}
          className="pg-tl-vgrid-major"
        />
      ))}

      {/* day / night shading */}
      <rect
        x={gx(0)}
        y={GRID_TOP}
        width={gx(data.dayG) - gx(0)}
        height={gridBottom - GRID_TOP}
        className="pg-tl-day"
      />
      <rect
        x={gx(data.dayG)}
        y={GRID_TOP}
        width={gx(60) - gx(data.dayG)}
        height={gridBottom - GRID_TOP}
        className="pg-tl-night"
      />

      {/* row bands */}
      {rows.map((_, ri) => (
        <rect
          key={`band-${ri}`}
          x={gx(0)}
          y={rowY(ri) - ROW_BAND_HALF}
          width={gx(60) - gx(0)}
          height={ROW_BAND_HALF * 2}
          className={`pg-tl-row-band pg-tl-row-band-${ri % 7}`}
        />
      ))}

      {/* ── top axis: civil hours (column headers) ── */}
      <text x={X_LBL} y={CIVIL_LABEL_Y} className="pg-tl-axis-tag">
        घण्टा
      </text>
      {data.civilHourTicks.map(({ hour, g }) => (
        <g key={`civil-${hour}`}>
          <line
            x1={gx(g)}
            y1={CIVIL_LABEL_Y + 6}
            x2={gx(g)}
            y2={GHATI_LABEL_Y - 0}
            className="pg-tl-tick"
          />
          <text x={gx(g)} y={CIVIL_LABEL_Y} className="pg-tl-civil-hour" textAnchor="middle">
            {toNepaliDigits(hour)}
          </text>
        </g>
      ))}

      {/* ── secondary axis: ghati scale (labels only, no column grid) ── */}
      <text x={X_LBL} y={GHATI_LABEL_Y} className="pg-tl-axis-tag">
        घडी
      </text>
      {GHATI_TICKS.map((g) => (
        <text
          key={`ghati-${g}`}
          x={gx(g)}
          y={GHATI_LABEL_Y}
          className="pg-tl-ghati-hour"
          textAnchor="middle"
        >
          {toNepaliDigits(g)}
        </text>
      ))}

      {/* events strip background */}
      <rect
        x={gx(data.gMin)}
        y={EVENTS_TOP}
        width={gx(data.gMax) - gx(data.gMin)}
        height={EVENTS_H}
        className="pg-tl-events-bg"
        rx={4}
      />

      <EventMarker
        g={0}
        y={eventsCenterY}
        sunriseMin={data.sunriseMin}
        gx={gx}
        kind="sunrise"
        label={data.sunriseLabel}
      />
      <EventMarker
        g={data.dayG}
        y={eventsCenterY}
        sunriseMin={data.sunriseMin}
        gx={gx}
        kind="sunset"
        label={data.sunsetLabel}
      />
      {data.moonriseG != null && (
        <EventMarker
          g={data.moonriseG}
          y={eventsCenterY}
          sunriseMin={data.sunriseMin}
          gx={gx}
          kind="moonrise"
          label={data.moonriseLabel ?? undefined}
        />
      )}
      {data.moonsetG != null && (
        <EventMarker
          g={data.moonsetG}
          y={eventsCenterY}
          sunriseMin={data.sunriseMin}
          gx={gx}
          kind="moonset"
          label={data.moonsetLabel ?? undefined}
        />
      )}
      <EventMarker
        g={60}
        y={eventsCenterY}
        sunriseMin={data.sunriseMin}
        gx={gx}
        kind="next-sunrise"
      />

      {/* key vertical guides through chart only */}
      <line
        x1={gx(0)}
        y1={GRID_TOP}
        x2={gx(0)}
        y2={gridBottom}
        className="pg-tl-sunrise-line"
      />
      <line
        x1={gx(data.dayG)}
        y1={GRID_TOP}
        x2={gx(data.dayG)}
        y2={gridBottom}
        className="pg-tl-sunset-line"
      />
      <line
        x1={gx(60)}
        y1={GRID_TOP}
        x2={gx(60)}
        y2={gridBottom}
        className="pg-tl-end-line"
      />

      {/* panchanga rows */}
      {rows.map((row, ri) => (
        <TimelineRow
          key={row.label}
          y={rowY(ri)}
          rowIndex={ri}
          label={row.label}
          labelEn={row.en}
          items={row.items}
          kind={row.kind}
          sunriseMin={data.sunriseMin}
          dayG={data.dayG}
          weekdayNe={data.weekdayNe}
          gx={gx}
          gridTop={GRID_TOP}
        />
      ))}
    </>
  );
}

function EventMarker({
  g,
  y,
  sunriseMin,
  gx,
  kind,
}: {
  g: number;
  y: number;
  sunriseMin: number;
  gx: (g: number) => number;
  kind: "sunrise" | "sunset" | "moonrise" | "moonset" | "next-sunrise";
  label?: string;
}) {
  const { clock } = dualTimeAtGhati(g, sunriseMin);
  const x = gx(g);
  const anchor: "start" | "middle" | "end" =
    g <= 1 ? "start" : g >= 59 ? "end" : "middle";
  const tx = anchor === "start" ? x + 2 : anchor === "end" ? x - 2 : x;

  const Icon =
    kind === "sunrise" || kind === "next-sunrise"
      ? Sunrise
      : kind === "sunset"
        ? Sunset
        : kind === "moonset"
          ? Moon
          : SunMoon;

  const iconClass =
    kind === "sunrise" || kind === "sunset" || kind === "next-sunrise"
      ? "text-[var(--color-warning)]"
      : "text-foreground";

  return (
    <g>
      <foreignObject
        x={anchor === "end" ? tx - 52 : anchor === "start" ? tx - 2 : tx - 26}
        y={y - 10}
        width={54}
        height={24}
      >
        <div className={`flex flex-col items-center gap-0 leading-none ${iconClass}`}>
          <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2.2} aria-hidden />
          <span className="font-mono text-[10px] font-bold tabular-nums">{clock}</span>
        </div>
      </foreignObject>
    </g>
  );
}

function TimelineRow({
  y,
  rowIndex,
  label,
  labelEn,
  items,
  kind,
  sunriseMin,
  dayG,
  weekdayNe,
  gx,
  gridTop,
}: {
  y: number;
  rowIndex: number;
  label: string;
  labelEn: string;
  items: TimelineSegment[];
  kind?: "choghadiya" | "lagna" | "graha";
  sunriseMin: number;
  dayG: number;
  weekdayNe: string;
  gx: (g: number) => number;
  gridTop: number;
}) {
  const isChoghadiya = kind === "choghadiya";
  const isLagna = kind === "lagna";
  const isGraha = kind === "graha";
  let prev = 0;

  return (
    <g>
      <text x={X_LBL} y={y - 20} className="pg-tl-rowlabel">
        {label}
      </text>
      <text x={X_LBL} y={y - 4} className="pg-tl-rowlabel-en">
        {labelEn}
      </text>
      <line
        x1={gx(0)}
        y1={y}
        x2={gx(60)}
        y2={y}
        className={`pg-tl-rowline pg-tl-rowline-${rowIndex % 7}`}
      />

      {items.map((it, ii) => {
        const end =
          it.endG !== undefined && it.endG !== null ? Math.min(it.endG, 60) : 60;
        const span = end - prev;
        const midX = gx((prev + end) / 2);
        const xStart = gx(prev);
        const xEnd = gx(end);

        const seg = (
          <g key={ii}>
            {isChoghadiya && it.bad && (
              <path
                d={`M ${xStart} ${y - 8} v 8 h ${xEnd - xStart} v -8`}
                className="pg-tl-bad"
              />
            )}
            {(isChoghadiya ? span >= 2 : true) && (
              <>
                {isGraha && it.subLabel && span >= 1.5 && (
                  <text
                    x={midX}
                    y={y - 14}
                    className="pg-tl-graha-title"
                    textAnchor="middle"
                  >
                    {it.subLabel}
                  </text>
                )}
                <text
                  x={midX}
                  y={y + (isGraha ? 14 : 0) - (isChoghadiya && it.bad ? 11 : isGraha ? 0 : 8)}
                  className={
                    isChoghadiya && it.bad
                      ? "pg-tl-badname"
                      : isGraha
                        ? "pg-tl-graha-coords"
                        : span < (isChoghadiya ? 3 : isLagna ? 3.5 : 8)
                          ? "pg-tl-segname-sm"
                          : isLagna
                            ? "pg-tl-lagna-name"
                            : "pg-tl-segname"
                  }
                  textAnchor="middle"
                >
                  {it.name}
                </text>
              </>
            )}
            {!isChoghadiya &&
              !isGraha &&
              it.endG !== undefined &&
              it.endG !== null &&
              it.endG < 60 && (
                <TransitionMarker
                  g={end}
                  y={y}
                  sunriseMin={sunriseMin}
                  gx={gx}
                  gridTop={gridTop}
                  segmentSpan={span}
                  nextSpan={60 - end}
                  minimal={isLagna}
                />
              )}
          </g>
        );
        prev = end;
        return seg;
      })}

      {isChoghadiya && (
        <text
          x={gx(dayG / 2)}
          y={y + 34}
          className="pg-tl-segname dim"
          textAnchor="middle"
        >
          {weekdayNe}
        </text>
      )}
    </g>
  );
}

function TransitionMarker({
  g,
  y,
  sunriseMin,
  gx,
  gridTop,
  segmentSpan,
  nextSpan,
  minimal = false,
}: {
  g: number;
  y: number;
  sunriseMin: number;
  gx: (g: number) => number;
  gridTop: number;
  segmentSpan: number;
  nextSpan: number;
  minimal?: boolean;
}) {
  const { clock } = dualTimeAtGhati(g, sunriseMin);
  const x = gx(g);
  const narrow = segmentSpan < 10 || nextSpan < 10;
  const anchor: "start" | "middle" | "end" =
    g > 52 ? "end" : g < 8 ? "start" : "middle";
  const dx = anchor === "end" ? -4 : anchor === "start" ? 4 : 0;

  if (minimal) {
    return (
      <text
        x={x + dx}
        y={y + (narrow ? 22 : 26)}
        className="pg-tl-time"
        textAnchor={anchor}
      >
        {clock}
      </text>
    );
  }

  return (
    <g>
      <line
        x1={x}
        y1={gridTop}
        x2={x}
        y2={y - 7}
        className="pg-tl-row-connector"
      />
      <path
        d={`M ${x - 8} ${y - 5} L ${x - 2} ${y} L ${x - 8} ${y + 5}`}
        className="pg-tl-arrow"
        fill="none"
      />
      <path
        d={`M ${x + 8} ${y - 5} L ${x + 2} ${y} L ${x + 8} ${y + 5}`}
        className="pg-tl-arrow"
        fill="none"
      />
      <line x1={x} y1={y - 5} x2={x} y2={y + 5} className="pg-tl-arrow-tick" />
      <text
        x={x + dx}
        y={y + (narrow ? 22 : 26)}
        className="pg-tl-time"
        textAnchor={anchor}
      >
        {clock}
      </text>
      {/* <text
        x={x + dx}
        y={y + (narrow ? 36 : 42)}
        className="pg-tl-time-sub"
        textAnchor={anchor}
      >
        {ghati}
      </text> */}
    </g>
  );
}
