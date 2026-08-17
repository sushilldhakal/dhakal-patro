import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  BS_MONTHS_NE,
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  adToBS,
  bsToAD,
  getBSMonthLength,
  getSupportedAdBounds,
} from "@/lib/bs-calendar";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { useCalendarEra } from "@/hooks/use-calendar-era";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";

const BS_YEARS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i
);

const AD_BOUNDS = getSupportedAdBounds();
const AD_YEARS = Array.from(
  { length: AD_BOUNDS.maxYear - AD_BOUNDS.minYear + 1 },
  (_, i) => AD_BOUNDS.minYear + i,
);

/** Catalogue keys for the Gregorian month names, January first. */
const AD_MONTH_KEYS = [
  "kundali.x.month_january",
  "kundali.x.month_february",
  "kundali.x.month_march",
  "kundali.x.month_april",
  "kundali.x.month_may",
  "kundali.x.month_june",
  "kundali.x.month_july",
  "kundali.x.month_august",
  "kundali.x.month_september",
  "kundali.x.month_october",
  "kundali.x.month_november",
  "kundali.x.month_december",
];

const selectClass =
  "h-9 min-w-0 flex-1 px-2.5 rounded-lg border border-border bg-card text-foreground text-sm text-base cursor-pointer";

function getADMonthLength(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

interface Props {
  date: Date;
  onDateChange: (d: Date) => void;
  clock: string;
  onClockChange: (clock: string) => void;
  location: PanchangaLocation;
  onLocationChange: (location: PanchangaLocation) => void;
}

export function KundaliControls({
  date,
  onDateChange,
  clock,
  onClockChange,
  location,
  onLocationChange,
}: Props) {
  const { t } = useTranslation();
  const calendarEra = useCalendarEra();
  const era: "bs" | "ad" =
    calendarEra === "ad" || calendarEra === "bc" ? "ad" : "bs";
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
      {era === "bs" ? (
        <>
          <select
            className={selectClass}
            value={bs.year}
            aria-label={t("kundali.year")}
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
            aria-label={t("kundali.month")}
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
            aria-label={t("kundali.day")}
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
            aria-label={t("kundali.year")}
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
            aria-label={t("kundali.month")}
            onChange={(e) => pickAd(adYear, Number(e.target.value) + 1, adDay)}
          >
            {AD_MONTH_KEYS.map((monthKey, i) => (
              <option key={monthKey} value={i}>
                {t(monthKey)}
              </option>
            ))}
          </select>

          <select
            className={selectClass}
            value={adDay}
            aria-label={t("kundali.day")}
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

      <label className="inline-flex items-center gap-1.5 h-9 shrink-0 px-2.5 rounded-lg border border-border bg-card text-sm text-base text-foreground min-w-[7.5rem]">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <input
          type="time"
          value={clock}
          onChange={(e) => onClockChange(e.target.value)}
          className="bg-transparent border-0 p-0 m-0 w-full text-sm font-mono font-semibold text-foreground focus:outline-none focus:ring-0"
          aria-label={t("kundali.birth_time")}
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
