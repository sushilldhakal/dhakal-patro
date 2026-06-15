import { Clock } from "lucide-react";
import {
  BS_MONTHS_NE,
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  adToBS,
  bsToAD,
  getBSMonthLength,
} from "@/lib/bs-calendar";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { cn } from "@/lib/utils";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";

const BS_YEARS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i
);

const AD_START_YEAR = 1943;
const AD_END_YEAR = 2030;
const AD_YEARS = Array.from(
  { length: AD_END_YEAR - AD_START_YEAR + 1 },
  (_, i) => AD_START_YEAR + i
);

const AD_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const selectClass =
  "h-9 min-w-0 flex-1 px-2.5 rounded-lg border border-border bg-card text-foreground text-[13px] font-medium cursor-pointer";

function getADMonthLength(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

interface Props {
  date: Date;
  onDateChange: (d: Date) => void;
  era: "bs" | "ad";
  onEraChange: (era: "bs" | "ad") => void;
  clock: string;
  onClockChange: (clock: string) => void;
  location: PanchangaLocation;
  onLocationChange: (location: PanchangaLocation) => void;
}

export function KundaliControls({
  date,
  onDateChange,
  era,
  onEraChange,
  clock,
  onClockChange,
  location,
  onLocationChange,
}: Props) {
  const bs = adToBS(date);
  const adYear = date.getFullYear();
  const adMonth = date.getMonth() + 1;
  const adDay = date.getDate();

  const pickBs = (year: number, month: number, day: number) => {
    const safeDay = Math.min(day, getBSMonthLength(year, month));
    onDateChange(bsToAD(year, month, safeDay));
  };

  const pickAd = (year: number, month: number, day: number) => {
    const safeDay = Math.min(day, getADMonthLength(year, month));
    onDateChange(new Date(year, month - 1, safeDay));
  };

  const monthLen = era === "bs" ? getBSMonthLength(bs.year, bs.month) : getADMonthLength(adYear, adMonth);

  return (
    <div className="w-full flex flex-wrap items-center gap-2 rounded-xl bg-card px-3 py-2.5 shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]">
      <div
        className="inline-flex shrink-0 p-0.5 gap-0.5 border border-border rounded-lg bg-card"
        role="group"
        aria-label="Era"
      >
        {(["bs", "ad"] as const).map((e) => (
          <button
            key={e}
            type="button"
            className={cn(
              "h-8 px-3 rounded-[calc(var(--radius-lg)-2px)] border-0 text-[12.5px] font-semibold cursor-pointer transition-colors",
              era === e
                ? "bg-secondary text-secondary-foreground"
                : "bg-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onEraChange(e)}
          >
            {e.toUpperCase()}
          </button>
        ))}
      </div>

      {era === "bs" ? (
        <>
          <select
            className={selectClass}
            value={bs.year}
            aria-label="Year"
            onChange={(e) => pickBs(Number(e.target.value), bs.month, bs.day)}
          >
            {BS_YEARS.map((y) => (
              <option key={y} value={y}>
                {toNepaliDigits(y)}
              </option>
            ))}
          </select>

          <select
            className={selectClass}
            value={bs.month - 1}
            aria-label="Month"
            onChange={(e) => pickBs(bs.year, Number(e.target.value) + 1, bs.day)}
          >
            {BS_MONTHS_NE.map((ne, i) => (
              <option key={ne} value={i}>
                {ne}
              </option>
            ))}
          </select>

          <select
            className={selectClass}
            value={bs.day}
            aria-label="Day"
            onChange={(e) => pickBs(bs.year, bs.month, Number(e.target.value))}
          >
            {Array.from({ length: monthLen }, (_, i) => i + 1).map((dd) => (
              <option key={dd} value={dd}>
                {toNepaliDigits(dd)}
              </option>
            ))}
          </select>
        </>
      ) : (
        <>
          <select
            className={selectClass}
            value={adYear}
            aria-label="Year"
            onChange={(e) => pickAd(Number(e.target.value), adMonth, adDay)}
          >
            {AD_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            className={selectClass}
            value={adMonth - 1}
            aria-label="Month"
            onChange={(e) => pickAd(adYear, Number(e.target.value) + 1, adDay)}
          >
            {AD_MONTHS.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>

          <select
            className={selectClass}
            value={adDay}
            aria-label="Day"
            onChange={(e) => pickAd(adYear, adMonth, Number(e.target.value))}
          >
            {Array.from({ length: monthLen }, (_, i) => i + 1).map((dd) => (
              <option key={dd} value={dd}>
                {dd}
              </option>
            ))}
          </select>
        </>
      )}

      <label className="inline-flex items-center gap-1.5 h-9 shrink-0 px-2.5 rounded-lg border border-border bg-card text-[13px] font-medium text-foreground min-w-[7.5rem]">
        <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <input
          type="time"
          value={clock}
          onChange={(e) => onClockChange(e.target.value)}
          className="bg-transparent border-0 p-0 m-0 w-full text-[13px] font-mono font-semibold text-foreground focus:outline-none focus:ring-0"
          aria-label="Birth time"
        />
      </label>

      <LocationSelector
        compact
        className="h-9 flex-[2] min-w-[10rem] max-w-none w-auto"
        location={location}
        onLocationChange={onLocationChange}
      />
    </div>
  );
}
