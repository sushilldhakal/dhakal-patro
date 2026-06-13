import { useEffect, useMemo, useState } from "react";
import type { PanchangaDay } from "@/lib/api";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { minutesSinceMidnightInTimezone, resolveTimeZone } from "@/lib/zoned-time";
import { buildDayTimelineData, type TimelineRowData } from "./day-timeline-data";

// ─── geometry helpers ────────────────────────────────────────────────────────

const CX = 260;
const CY = 260;

function polarToCart(r: number, angleDeg: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function donutArc(
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number
): string {
  // clamp a full-circle arc to avoid degenerate paths
  let end = endDeg;
  if (end - startDeg >= 360) end = startDeg + 359.98;

  const [ox1, oy1] = polarToCart(outerR, startDeg);
  const [ox2, oy2] = polarToCart(outerR, end);
  const [ix2, iy2] = polarToCart(innerR, end);
  const [ix1, iy1] = polarToCart(innerR, startDeg);
  const lg = end - startDeg > 180 ? 1 : 0;

  return [
    `M ${ox1} ${oy1}`,
    `A ${outerR} ${outerR} 0 ${lg} 1 ${ox2} ${oy2}`,
    `L ${ix2} ${iy2}`,
    `A ${innerR} ${innerR} 0 ${lg} 0 ${ix1} ${iy1}`,
    "Z",
  ].join(" ");
}

function ghatiToDeg(g: number): number {
  return (g / 60) * 360;
}

// ─── ring definitions ────────────────────────────────────────────────────────

interface RingDef {
  key: string;
  labelNe: string;
  innerR: number;
  outerR: number;
  palette: string[];
  badColor?: string;
  dayColor?: string;
  nightColor?: string;
}

const RINGS: RingDef[] = [
  // innermost → outermost (Tithi → Earth)
  {
    key: "tithi",
    labelNe: "तिथि",
    innerR: 44,
    outerR: 72,
    palette: ["#f97316", "#fb923c", "#fdba74"],
  },
  {
    key: "nakshatra",
    labelNe: "नक्षत्र",
    innerR: 75,
    outerR: 103,
    palette: ["#3b82f6", "#60a5fa", "#93c5fd"],
  },
  {
    key: "yoga",
    labelNe: "योग",
    innerR: 106,
    outerR: 134,
    palette: ["#10b981", "#34d399", "#6ee7b7"],
  },
  {
    key: "karana",
    labelNe: "करण",
    innerR: 137,
    outerR: 165,
    palette: ["#ec4899", "#f472b6", "#f9a8d4"],
    badColor: "#be123c",
  },
  {
    key: "lagna",
    labelNe: "लग्न",
    innerR: 168,
    outerR: 196,
    palette: ["#8b5cf6", "#a78bfa", "#c4b5fd"],
  },
  {
    key: "graha",
    labelNe: "ग्रह",
    innerR: 199,
    outerR: 227,
    palette: ["#f59e0b", "#fbbf24", "#fcd34d"],
  },
  {
    key: "earth",
    labelNe: "पृथ्वी",
    innerR: 230,
    outerR: 258,
    palette: ["#f59e0b"],
    dayColor: "#fbbf24",
    nightColor: "#1e3a5f",
  },
];

// ─── segment data builders ───────────────────────────────────────────────────

interface Seg {
  fromG: number;
  toG: number;
  label: string;
  colorIdx: number;
  bad?: boolean;
}

function segmentsFromRow(row: TimelineRowData): Seg[] {
  const segs: Seg[] = [];
  let prev = 0;
  for (let i = 0; i < row.items.length; i++) {
    const item = row.items[i]!;
    const toG = item.endG != null ? Math.min(item.endG, 60) : 60;
    segs.push({ fromG: prev, toG, label: item.name, colorIdx: i % 3, bad: item.bad });
    prev = toG;
  }
  return segs;
}

// ─── arc text helper (place label along mid-arc) ────────────────────────────

function midArcText(
  midR: number,
  fromG: number,
  toG: number,
  label: string,
  fontSize: number
): JSX.Element | null {
  const span = toG - fromG;
  if (span < 3) return null; // too narrow
  const midDeg = ghatiToDeg((fromG + toG) / 2);
  const midRad = ((midDeg - 90) * Math.PI) / 180;
  const tx = CX + midR * Math.cos(midRad);
  const ty = CY + midR * Math.sin(midRad);

  // rotate text to follow ring tangent
  const rotateDeg = midDeg > 180 ? midDeg - 90 : midDeg - 90;

  // short label (max ~6 chars)
  const short =
    label.length > 7 ? label.slice(0, 6) + "…" : label;

  return (
    <text
      key={`lbl-${label}-${fromG}`}
      x={tx}
      y={ty}
      fontSize={fontSize}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      transform={`rotate(${rotateDeg}, ${tx}, ${ty})`}
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      {short}
    </text>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

interface Props {
  p: PanchangaDay;
  dateAd?: string;
  isToday?: boolean;
  timezone?: string;
  needleClock?: string;
}

export function PanchangaCircularDiagram({ p, dateAd, isToday, timezone, needleClock }: Props) {
  const [now, setNow] = useState(() => new Date());
  const tz = resolveTimeZone(p?.location?.timezone, timezone);

  useEffect(() => {
    if (!isToday && !needleClock) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [isToday, needleClock]);

  const tl = useMemo(() => buildDayTimelineData(p, dateAd), [p, dateAd]);

  // current ghati position for needle
  const needleG = useMemo(() => {
    if (needleClock) {
      const [hh, mm] = needleClock.split(":").map(Number);
      if (!Number.isNaN(hh) && !Number.isNaN(mm)) {
        const minsNow = hh * 60 + (mm ?? 0);
        const sr = tl?.sunriseMin ?? 0;
        let g = (minsNow - sr) / 24;
        if (g < 0) g += 60;
        return Math.min(g, 60);
      }
    }
    if (isToday) {
      const minsNow = minutesSinceMidnightInTimezone(now, tz, true);
      const sr = tl?.sunriseMin ?? 0;
      let g = (minsNow - sr) / 24;
      if (g < 0) g += 60;
      return Math.min(g, 60);
    }
    return null;
  }, [now, isToday, needleClock, tl, tz]);

  if (!tl) return null;

  // map row keys to ring keys
  const rowMap: Record<string, TimelineRowData | undefined> = {
    tithi: tl.rows.find((r) => r.label === "तिथि"),
    nakshatra: tl.rows.find((r) => r.label === "नक्षत्र"),
    yoga: tl.rows.find((r) => r.label === "योग"),
    karana: tl.rows.find((r) => r.label === "करण"),
    lagna: tl.rows.find((r) => r.label === "लग्न"),
    graha: tl.rows.find((r) => r.label === "ग्रह"),
  };

  const needleDeg = needleG != null ? ghatiToDeg(needleG) : null;

  // current hour / ghati label for center
  const gh = needleG != null ? Math.floor(needleG) : null;
  const pa = needleG != null ? Math.floor((needleG - Math.floor(needleG)) * 60) : null;

  const HOUR_TICKS = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            पञ्चाङ्ग चक्र
          </div>
          <div className="text-[15px] font-bold leading-tight">
            Panchanga Circular Diagram
          </div>
        </div>
        {gh != null && pa != null && (
          <div className="text-right font-mono">
            <div className="text-[11px] text-muted-foreground">अहिले</div>
            <div className="text-[18px] font-bold leading-none tabular-nums">
              {toNepaliDigits(String(gh).padStart(2, "0"))}
              <span className="text-muted-foreground">:</span>
              {toNepaliDigits(String(pa).padStart(2, "0"))}
            </div>
            <div className="text-[9px] text-muted-foreground">घडी:पला</div>
          </div>
        )}
      </div>

      <div className="w-full overflow-x-auto flex justify-center">
        <svg
          viewBox="0 0 520 520"
          width="100%"
          style={{ maxWidth: 480 }}
          aria-label="Panchanga circular diagram"
        >
          {/* dark background circle */}
          <circle cx={CX} cy={CY} r={262} fill="#0f1117" />

          {/* hour tick marks (24h) on the outer edge */}
          {HOUR_TICKS.map((h) => {
            const deg = (h / 24) * 360;
            const [ix, iy] = polarToCart(258, deg);
            const [ox, oy] = polarToCart(266, deg);
            return (
              <line
                key={h}
                x1={ix} y1={iy} x2={ox} y2={oy}
                stroke="#ffffff30"
                strokeWidth={h % 6 === 0 ? 2 : 1}
              />
            );
          })}

          {/* ghati ticks (every 5 ghati) inside */}
          {Array.from({ length: 12 }, (_, i) => i * 5).map((g) => {
            const deg = ghatiToDeg(g);
            const [ix, iy] = polarToCart(258, deg);
            const [ox, oy] = polarToCart(270, deg);
            return (
              <line
                key={g}
                x1={ix} y1={iy} x2={ox} y2={oy}
                stroke="#ffffff60"
                strokeWidth={g === 0 ? 2.5 : 1.5}
              />
            );
          })}

          {/* rings */}
          {RINGS.map((ring) => {
            if (ring.key === "earth") {
              // Earth: day / night split
              const dayEnd = ghatiToDeg(tl.dayG);
              return (
                <g key="earth">
                  {/* day arc */}
                  <path
                    d={donutArc(ring.innerR, ring.outerR, 0, dayEnd)}
                    fill={ring.dayColor ?? "#fbbf24"}
                    opacity={0.85}
                  />
                  {/* night arc */}
                  <path
                    d={donutArc(ring.innerR, ring.outerR, dayEnd, 360)}
                    fill={ring.nightColor ?? "#1e3a5f"}
                    opacity={0.9}
                  />
                  {/* divider lines */}
                  {[0, dayEnd].map((deg) => {
                    const [x1, y1] = polarToCart(ring.innerR, deg);
                    const [x2, y2] = polarToCart(ring.outerR, deg);
                    return (
                      <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke="#ffffff50" strokeWidth={1} />
                    );
                  })}
                  {/* labels */}
                  {midArcText((ring.innerR + ring.outerR) / 2, 0, tl.dayG, "दिन", 8)}
                  {midArcText((ring.innerR + ring.outerR) / 2, tl.dayG, 60, "रात", 8)}
                </g>
              );
            }

            const row = rowMap[ring.key];
            if (!row) {
              // empty ring placeholder
              return (
                <circle
                  key={ring.key}
                  cx={CX} cy={CY}
                  r={(ring.innerR + ring.outerR) / 2}
                  fill="none"
                  stroke="#ffffff10"
                  strokeWidth={ring.outerR - ring.innerR}
                />
              );
            }

            const segs = segmentsFromRow(row);
            const midR = (ring.innerR + ring.outerR) / 2;

            return (
              <g key={ring.key}>
                {segs.map((seg, si) => {
                  const fromDeg = ghatiToDeg(seg.fromG);
                  const toDeg = ghatiToDeg(seg.toG);
                  const color = seg.bad && ring.badColor
                    ? ring.badColor
                    : ring.palette[seg.colorIdx % ring.palette.length] ?? ring.palette[0]!;
                  const spanDeg = toDeg - fromDeg;
                  const opacity = si % 2 === 0 ? 0.88 : 0.72;
                  return (
                    <g key={si}>
                      <path
                        d={donutArc(ring.innerR, ring.outerR, fromDeg, toDeg)}
                        fill={color}
                        opacity={opacity}
                      />
                      {/* separator line */}
                      {si > 0 && (() => {
                        const [lx1, ly1] = polarToCart(ring.innerR, fromDeg);
                        const [lx2, ly2] = polarToCart(ring.outerR, fromDeg);
                        return (
                          <line x1={lx1} y1={ly1} x2={lx2} y2={ly2}
                            stroke="#00000030" strokeWidth={1} />
                        );
                      })()}
                      {/* segment label */}
                      {spanDeg >= 15 &&
                        midArcText(midR, seg.fromG, seg.toG, seg.label, 7.5)}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* ring separators (thin circles) */}
          {RINGS.map((ring) => (
            <circle
              key={`sep-${ring.key}`}
              cx={CX} cy={CY}
              r={ring.innerR - 1}
              fill="none"
              stroke="#1a1d27"
              strokeWidth={2}
            />
          ))}

          {/* center disc */}
          <circle cx={CX} cy={CY} r={42} fill="#07080d" />
          <circle cx={CX} cy={CY} r={42} fill="none" stroke="#ffffff15" strokeWidth={1} />

          {/* sunrise marker at 0° (top) */}
          <circle cx={CX} cy={CY - 262} r={4} fill="#fbbf24" />

          {/* sunset marker */}
          {(() => {
            const [sx, sy] = polarToCart(262, ghatiToDeg(tl.dayG));
            return <circle cx={sx} cy={sy} r={4} fill="#f97316" />;
          })()}

          {/* clock needle */}
          {needleDeg != null && (() => {
            const [nx, ny] = polarToCart(250, needleDeg);
            const [nx2, ny2] = polarToCart(30, needleDeg + 180);
            return (
              <g>
                <line
                  x1={CX} y1={CY} x2={nx} y2={ny}
                  stroke="#ef4444" strokeWidth={2} strokeLinecap="round"
                />
                <line
                  x1={CX} y1={CY} x2={nx2} y2={ny2}
                  stroke="#ef4444" strokeWidth={3} strokeLinecap="round"
                  opacity={0.5}
                />
                <circle cx={CX} cy={CY} r={5} fill="#ef4444" />
              </g>
            );
          })()}

          {/* center label (current anga names) */}
          <text
            x={CX} y={CY - 6}
            fontSize={9}
            fill="#ffffff80"
            textAnchor="middle"
            dominantBaseline="central"
            style={{ userSelect: "none" }}
          >
            {gh != null ? toNepaliDigits(`${String(gh).padStart(2, "0")}:${String(pa).padStart(2, "0")}`) : "☉"}
          </text>
          <text
            x={CX} y={CY + 8}
            fontSize={7}
            fill="#ffffff50"
            textAnchor="middle"
            dominantBaseline="central"
            style={{ userSelect: "none" }}
          >
            घडी:पला
          </text>

          {/* ring labels on the outside (every ring at 270° = left side) */}
          {RINGS.map((ring) => {
            const labelDeg = 270; // 9 o'clock position
            const [lx, ly] = polarToCart((ring.innerR + ring.outerR) / 2, labelDeg);
            return (
              <text
                key={`rl-${ring.key}`}
                x={lx - 8}
                y={ly}
                fontSize={7.5}
                fill="#ffffff70"
                textAnchor="end"
                dominantBaseline="central"
                style={{ userSelect: "none" }}
              >
                {ring.labelNe}
              </text>
            );
          })}

          {/* hour labels at 0, 6, 12, 18 ghati */}
          {[0, 15, 30, 45].map((g) => {
            const deg = ghatiToDeg(g);
            const [lx, ly] = polarToCart(278, deg);
            const civilH = Math.round((tl.sunriseMin + g * 24) / 60) % 24;
            return (
              <text
                key={g}
                x={lx} y={ly}
                fontSize={8}
                fill="#ffffff60"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ userSelect: "none" }}
              >
                {toNepaliDigits(String(civilH))}h
              </text>
            );
          })}
        </svg>
      </div>

      {/* legend */}
      <div className="grid grid-cols-4 gap-x-3 gap-y-1.5 px-1 pt-1">
        {[...RINGS].reverse().map((ring) => (
          <div key={ring.key} className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: ring.palette[0] }}
            />
            <span className="text-[10.5px] text-muted-foreground truncate">
              {ring.labelNe}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
