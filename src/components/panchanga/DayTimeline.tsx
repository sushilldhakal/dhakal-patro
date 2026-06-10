import { useMemo } from "react";
import type { PanchangaDay } from "@/lib/api";
import { toNepaliDigits } from "@/lib/panchanga-format";
import {
  buildDayTimelineData,
  ghatiShortLabel,
  ghatiToClockLabel,
  type TimelineSegment,
} from "./day-timeline-data";

const W = 1000;
const X0 = 8;
const X1 = 992;

function gx(g: number): number {
  return X0 + (g / 60) * (X1 - X0);
}

interface Props {
  p: PanchangaDay;
  dateAd?: string;
  units?: "clock" | "ghati";
}

export function DayTimeline({ p, dateAd, units = "clock" }: Props) {
  const data = useMemo(() => buildDayTimelineData(p, dateAd), [p, dateAd]);
  if (!data) return null;

  const rowY = (i: number) => 92 + i * 44;
  const choY = rowY(4);
  const H = choY + 52;

  const tLabel = (g: number) =>
    units === "ghati" ? ghatiShortLabel(g) : ghatiToClockLabel(g, data.sunriseMin);

  return (
    <div className="rounded-xl bg-card px-[18px] pt-4 pb-2 shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]">
      <div className="flex items-baseline gap-2.5 flex-wrap mb-1">
        <h2 className="text-base font-bold m-0">दिन-रेखा · ६० घडी</h2>
        <span className="text-[11.5px] font-medium text-muted-foreground flex-1">
          सूर्योदयदेखि सूर्योदयसम्म · sunrise to sunrise
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-sm bg-[color-mix(in_srgb,var(--color-warning)_32%,var(--card))]" />
          दिन
          <span className="w-2.5 h-2.5 rounded-sm bg-[color-mix(in_srgb,var(--secondary)_18%,var(--card))]" />
          रात
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[760px] block"
          role="img"
          aria-label="Day timeline — 60 ghati from sunrise to sunrise"
        >
          <rect
            x={gx(0)}
            y={30}
            width={gx(data.dayG) - gx(0)}
            height={H - 64}
            className="fill-[color-mix(in_srgb,var(--color-warning)_14%,transparent)]"
          />
          <rect
            x={gx(data.dayG)}
            y={30}
            width={gx(60) - gx(data.dayG)}
            height={H - 64}
            className="fill-[color-mix(in_srgb,var(--secondary)_10%,transparent)]"
          />

          <line
            x1={X0}
            y1={46}
            x2={X1}
            y2={46}
            className="stroke-foreground/45"
            strokeWidth={1.2}
          />
          {Array.from({ length: 31 }, (_, i) => i * 2).map((g) => (
            <g key={g}>
              <line
                x1={gx(g)}
                y1={46}
                x2={gx(g)}
                y2={g % 4 === 0 ? 38 : 42}
                className="stroke-foreground/40"
                strokeWidth={1}
              />
              {g % 4 === 0 && (
                <text
                  x={gx(g)}
                  y={32}
                  className="fill-muted-foreground text-[10.5px] font-mono font-medium"
                  textAnchor="middle"
                >
                  {toNepaliDigits(g)}
                </text>
              )}
            </g>
          ))}

          <text
            x={gx(0)}
            y={60}
            className="fill-[var(--color-warning)] text-[11px] font-mono font-semibold"
            textAnchor="start"
          >
            ☀ {tLabel(0)}
          </text>
          <text
            x={gx(data.dayG)}
            y={60}
            className="fill-[var(--color-warning)] text-[11px] font-mono font-semibold"
            textAnchor="middle"
          >
            ☀ {tLabel(data.dayG)}
          </text>
          <text
            x={gx(60)}
            y={60}
            className="fill-[var(--color-warning)] text-[11px] font-mono font-semibold"
            textAnchor="end"
          >
            ☀ {toNepaliDigits(60)}
          </text>
          {data.moonriseG != null && (
            <text
              x={gx(data.moonriseG)}
              y={74}
              className="fill-muted-foreground text-[11px] font-mono font-semibold"
              textAnchor="middle"
            >
              ☾ {tLabel(data.moonriseG)}
            </text>
          )}

          {data.rows.map((row, ri) => (
            <TimelineRow
              key={row.label}
              y={rowY(ri)}
              label={row.label}
              labelEn={row.en}
              items={row.items}
              tLabel={tLabel}
            />
          ))}

          <g>
            <text x={X0} y={choY - 14} className="fill-foreground text-[11.5px] font-bold">
              चौघडिया{" "}
              <tspan className="fill-muted-foreground text-[9.5px] font-medium tracking-wide">
                {data.weekdayEn}
              </tspan>
            </text>
            <line
              x1={X0}
              y1={choY}
              x2={X1}
              y2={choY}
              className="stroke-border"
              strokeWidth={1}
            />
            <text
              x={gx(data.dayG / 2)}
              y={choY + 26}
              className="fill-muted-foreground text-xs font-medium"
              textAnchor="middle"
            >
              {data.weekdayNe}
            </text>
            {data.badChoghadiya.map((c, i) => (
              <g key={i}>
                <path
                  d={`M ${gx(c.startG)} ${choY - 6} v 6 h ${gx(c.endG) - gx(c.startG)} v -6`}
                  className="fill-none stroke-destructive"
                  strokeWidth={1.4}
                />
                <text
                  x={gx((c.startG + c.endG) / 2)}
                  y={choY - 9}
                  className="fill-destructive text-[10px] font-semibold"
                  textAnchor="middle"
                >
                  {c.name}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

function TimelineRow({
  y,
  label,
  labelEn,
  items,
  tLabel,
}: {
  y: number;
  label: string;
  labelEn: string;
  items: TimelineSegment[];
  tLabel: (g: number) => string;
}) {
  let prev = 0;
  return (
    <g>
      <text x={X0} y={y - 14} className="fill-foreground text-[11.5px] font-bold">
        {label}{" "}
        <tspan className="fill-muted-foreground text-[9.5px] font-medium tracking-wide">
          {labelEn}
        </tspan>
      </text>
      <line x1={X0} y1={y} x2={X1} y2={y} className="stroke-border" strokeWidth={1} />
      {items.map((it, ii) => {
        const end =
          it.endG !== undefined && it.endG !== null ? Math.min(it.endG, 60) : 60;
        const midX = gx((prev + end) / 2);
        const seg = (
          <g key={ii}>
            <text
              x={midX}
              y={y - 4}
              className="fill-foreground text-xs font-semibold"
              textAnchor="middle"
            >
              {it.name}
            </text>
            {it.endG !== undefined && it.endG !== null && it.endG < 60 && (
              <g>
                <path
                  d={`M ${gx(end)} ${y - 5} l 4 5 l -4 5 l -4 -5 z`}
                  className="fill-secondary dark:fill-[var(--color-warning)]"
                />
                <text
                  x={gx(end)}
                  y={y + 16}
                  className="fill-muted-foreground text-[10.5px] font-mono font-medium"
                  textAnchor="middle"
                >
                  {tLabel(end)}
                </text>
              </g>
            )}
          </g>
        );
        prev = end;
        return seg;
      })}
    </g>
  );
}
