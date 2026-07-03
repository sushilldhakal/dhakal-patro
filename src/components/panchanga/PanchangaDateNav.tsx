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
import { useTranslation } from "react-i18next";
import { useLocale } from "@/i18n/locale";

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
  /** Replaces the आज button — used for kundali time/location controls */
  centerSlot?: React.ReactNode;
}

function fmtAdFull(d: Date): string {
  return d.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });
}

export function PanchangaDateNav({ date, onDateChange, centerSlot }: Props) {
  const { t } = useTranslation();
  const { pick, digits } = useLocale();
  const bs = adToBS(date);
  const monthLen = getBSMonthLength(bs.year, bs.month);
  const era = pick("वि.सं.", "BS");

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
          {pick(BS_MONTHS_NE[bs.month - 1], BS_MONTH_NAMES[bs.month - 1])} {digits(bs.day)}, {digits(bs.year)}
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
              {era} {digits(y)}
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
              {pick(`${ne} · ${BS_MONTH_NAMES[i]}`, BS_MONTH_NAMES[i])}
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
              {pick(`${digits(dd)} गते`, `${digits(dd)}`)}
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
          {centerSlot ?? (
            <button
              type="button"
              className="h-8 px-4 rounded-lg border-0 bg-secondary text-secondary-foreground text-[13.5px] font-semibold shadow-sm hover:brightness-105 active:translate-y-px transition"
              onClick={goToday}
            >
              {t("calendar.today_btn")}
            </button>
          )}
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
