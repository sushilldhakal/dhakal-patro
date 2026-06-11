import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  BS_MONTHS_NE,
  BS_MONTH_NAMES,
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  adToBS,
  bsToAD,
  getBSMonthLength,
} from "@/lib/bs-calendar";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { cn } from "@/lib/utils";

const BS_YEARS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i
);

function pickBsDate(
  onDateChange: (d: Date) => void,
  year: number,
  month: number,
  day: number
) {
  const safeDay = Math.min(day, getBSMonthLength(year, month));
  onDateChange(bsToAD(year, month, safeDay));
}

interface Props {
  date: Date;
  onDateChange: (d: Date) => void;
}

function fmtAdFull(d: Date): string {
  return d.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });
}

export function PanchangaDateNav({ date, onDateChange }: Props) {
  const bs = adToBS(date);
  const monthLen = getBSMonthLength(bs.year, bs.month);

  const step = (delta: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + delta);
    onDateChange(next);
  };

  const goToday = () => onDateChange(new Date());

  return (
    <div className="flex items-center justify-between gap-3.5 flex-wrap rounded-xl bg-card px-4 py-3 shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]">
      <div className="flex flex-col gap-0.5">
        <span className="text-lg font-bold">
          {BS_MONTHS_NE[bs.month - 1]} {toNepaliDigits(bs.day)}, {toNepaliDigits(bs.year)}
        </span>
        <span className="text-xs font-medium font-mono text-muted-foreground">{fmtAdFull(date)}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <select
          className="h-8 px-2.5 rounded-lg border border-border bg-card text-foreground text-[13px] font-medium cursor-pointer"
          value={bs.year}
          aria-label="Year"
          onChange={(e) =>
            pickBsDate(onDateChange, Number(e.target.value), bs.month, bs.day)
          }
        >
          {BS_YEARS.map((y) => (
            <option key={y} value={y}>
              वि.सं. {toNepaliDigits(y)}
            </option>
          ))}
        </select>

        <select
          className="h-8 px-2.5 rounded-lg border border-border bg-card text-foreground text-[13px] font-medium cursor-pointer"
          value={bs.month - 1}
          aria-label="Month"
          onChange={(e) => {
            const mIdx = Number(e.target.value);
            pickBsDate(onDateChange, bs.year, mIdx + 1, bs.day);
          }}
        >
          {BS_MONTHS_NE.map((ne, i) => (
            <option key={ne} value={i}>
              {ne} · {BS_MONTH_NAMES[i]}
            </option>
          ))}
        </select>

        <select
          className="h-8 px-2.5 rounded-lg border border-border bg-card text-foreground text-[13px] font-medium cursor-pointer"
          value={bs.day}
          aria-label="Day"
          onChange={(e) =>
            pickBsDate(onDateChange, bs.year, bs.month, Number(e.target.value))
          }
        >
          {Array.from({ length: monthLen }, (_, i) => i + 1).map((dd) => (
            <option key={dd} value={dd}>
              {toNepaliDigits(dd)} गते
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-border bg-card hover:bg-foreground/[0.06] transition-colors"
            onClick={() => step(-1)}
            aria-label="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="h-8 px-4 rounded-lg border-0 bg-secondary text-secondary-foreground text-[13.5px] font-semibold shadow-sm hover:brightness-105 active:translate-y-px transition"
            onClick={goToday}
          >
            आज
          </button>
          <button
            type="button"
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-border bg-card hover:bg-foreground/[0.06] transition-colors"
            onClick={() => step(1)}
            aria-label="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function QuickDateStrip({ date, onDateChange }: Props) {
  const bs = adToBS(date);
  const monthLen = getBSMonthLength(bs.year, bs.month);
  const todayBs = adToBS(new Date());

  const pickMonth = (mIdx: number) => {
    pickBsDate(onDateChange, bs.year, mIdx + 1, bs.day);
  };

  const stepMonth = (delta: number) => {
    let month = bs.month + delta;
    let year = bs.year;
    if (month < 1) {
      month = 12;
      year -= 1;
    } else if (month > 12) {
      month = 1;
      year += 1;
    }
    if (year < BS_SUPPORTED_START_YEAR || year > BS_SUPPORTED_END_YEAR) return;
    pickBsDate(onDateChange, year, month, bs.day);
  };

  const stepYear = (delta: number) => {
    const year = bs.year + delta;
    if (year < BS_SUPPORTED_START_YEAR || year > BS_SUPPORTED_END_YEAR) return;
    pickBsDate(onDateChange, year, bs.month, bs.day);
  };

  return (
    <div className="rounded-xl bg-card px-3 py-2.5 shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)] flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5 items-center">
        <button
          type="button"
          className="w-[26px] h-[26px] rounded-full border-0 bg-transparent text-muted-foreground hover:text-foreground disabled:opacity-30"
          disabled={bs.year <= BS_SUPPORTED_START_YEAR}
          onClick={() => stepYear(-1)}
          aria-label="Previous year"
        >
          ‹
        </button>
        <select
          className="h-[26px] min-w-[5.5rem] px-2 rounded-md border border-border bg-card text-foreground text-xs font-semibold cursor-pointer"
          value={bs.year}
          aria-label="Year"
          onChange={(e) =>
            pickBsDate(onDateChange, Number(e.target.value), bs.month, bs.day)
          }
        >
          {BS_YEARS.map((y) => (
            <option key={y} value={y}>
              {toNepaliDigits(y)}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="w-[26px] h-[26px] rounded-full border-0 bg-transparent text-muted-foreground hover:text-foreground disabled:opacity-30"
          disabled={bs.year >= BS_SUPPORTED_END_YEAR}
          onClick={() => stepYear(1)}
          aria-label="Next year"
        >
          ›
        </button>
      </div>

      <div className="flex flex-wrap gap-1 items-center">
        <button
          type="button"
          className="w-[26px] h-[26px] rounded-full border-0 bg-transparent text-muted-foreground hover:text-foreground disabled:opacity-30"
          disabled={bs.month <= 1 && bs.year <= BS_SUPPORTED_START_YEAR}
          onClick={() => stepMonth(-1)}
          aria-label="Previous month"
        >
          ‹
        </button>
        {BS_MONTHS_NE.map((ne, i) => (
          <button
            key={ne}
            type="button"
            className={cn(
              "h-[26px] px-2.5 rounded-full border-0 text-xs font-semibold cursor-pointer transition-colors",
              i + 1 === bs.month
                ? "bg-secondary text-secondary-foreground"
                : "bg-foreground/[0.04] text-muted-foreground hover:text-foreground hover:bg-foreground/[0.09]"
            )}
            onClick={() => pickMonth(i)}
          >
            {ne}
          </button>
        ))}
        <button
          type="button"
          className="w-[26px] h-[26px] rounded-full border-0 bg-transparent text-muted-foreground hover:text-foreground disabled:opacity-30"
          disabled={bs.month >= 12 && bs.year >= BS_SUPPORTED_END_YEAR}
          onClick={() => stepMonth(1)}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {Array.from({ length: monthLen }, (_, i) => i + 1).map((dd) => {
          const isSel = dd === bs.day;
          const isToday =
            dd === todayBs.day && bs.month === todayBs.month && bs.year === todayBs.year;
          return (
            <button
              key={dd}
              type="button"
              className={cn(
                "min-w-[30px] h-[26px] px-1.5 rounded-md border-0 font-mono text-xs font-semibold tabular-nums cursor-pointer transition-colors",
                isSel
                  ? "bg-secondary text-secondary-foreground"
                  : isToday
                    ? "bg-secondary/20 text-foreground"
                    : "bg-foreground/[0.04] text-foreground hover:bg-secondary/15"
              )}
              onClick={() => onDateChange(bsToAD(bs.year, bs.month, dd))}
            >
              {toNepaliDigits(dd)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
