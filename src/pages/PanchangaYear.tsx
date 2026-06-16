import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, MapPin } from "lucide-react";
import { fetchPanchanga, panchangaKeys } from "@/lib/api";
import {
  BS_MONTHS_NE,
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  adToBS,
  bsToAD,
  getBSMonthLength,
  getCurrentBs,
} from "@/lib/bs-calendar";
import { resolveTimeZone, todayAdStringInTimezone } from "@/lib/zoned-time";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { PanchangaWheel } from "@/components/panchanga/PanchangaWheel";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";

const BS_YEAR_OPTIONS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i
);

function daysInBsYear(year: number): number {
  let total = 0;
  for (let m = 1; m <= 12; m++) total += getBSMonthLength(year, m);
  return total;
}

function bsMonthDayFromDayOfYear(year: number, dayOfYear: number): { month: number; day: number } {
  let remaining = dayOfYear;
  for (let m = 1; m <= 12; m++) {
    const len = getBSMonthLength(year, m);
    if (remaining <= len) return { month: m, day: remaining };
    remaining -= len;
  }
  return { month: 12, day: getBSMonthLength(year, 12) };
}

function dayOfYearFromBs(year: number, month: number, day: number): number {
  let d = day;
  for (let m = 1; m < month; m++) d += getBSMonthLength(year, m);
  return d;
}

export function PanchangaYear() {
  const { location, setLocation } = usePanchangaLocation();
  const todayBs = useMemo(() => adToBS(new Date()), []);
  const [year, setYear] = useState(() => getCurrentBs().year);
  const [dayOfYear, setDayOfYear] = useState(() =>
    dayOfYearFromBs(todayBs.year, todayBs.month, todayBs.day)
  );

  const totalDays = useMemo(() => daysInBsYear(year), [year]);
  const clampedDay = Math.min(dayOfYear, totalDays);
  const { month: bsMonth, day: bsDay } = useMemo(
    () => bsMonthDayFromDayOfYear(year, clampedDay),
    [year, clampedDay]
  );
  const date = useMemo(() => bsToAD(year, bsMonth, bsDay), [year, bsMonth, bsDay]);

  const adDateStr = useMemo(() => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [date]);

  const { data, isLoading, isError } = useQuery({
    queryKey: panchangaKeys.day(adDateStr, "ad", location.params),
    queryFn: () => fetchPanchanga(adDateStr, "ad", location.params),
    staleTime: 1000 * 60 * 30,
  });

  const effectiveTimezone = resolveTimeZone(data?.location?.timezone, location.params.timezone);
  const isToday = adDateStr === todayAdStringInTimezone(new Date(), effectiveTimezone);
  const locationLabel = data?.location?.name ?? location.label;

  function handleYearChange(nextYear: number) {
    setYear(nextYear);
    setDayOfYear((d) => Math.min(d, daysInBsYear(nextYear)));
  }

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-6 pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4 mt-2">
        <div>
          <Link
            to="/panchanga"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            दिन हेराइमा फर्कनुहोस्
          </Link>
          <h1 className="text-[34px] font-bold leading-tight tracking-tight m-0">
            वार्षिक पञ्चाङ्ग चक्र
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            {BS_MONTHS_NE[bsMonth - 1]} {toNepaliDigits(bsDay)}, {toNepaliDigits(year)}
            {" · "}
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {locationLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto sm:justify-end">
          <select
            className="pn-select"
            value={year}
            aria-label="वि.सं. वर्ष"
            onChange={(e) => handleYearChange(Number(e.target.value))}
          >
            {BS_YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <LocationSelector
            compact
            className="shrink-0"
            location={location}
            onLocationChange={setLocation}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {data && !isLoading && (
          <PanchangaWheel
            p={data}
            bsYear={year}
            bsMonth={bsMonth}
            bsMonthNe={BS_MONTHS_NE[bsMonth - 1]!}
            bsDay={bsDay}
            isToday={isToday}
            timezone={effectiveTimezone}
            locationLabel={locationLabel}
          />
        )}

        {isLoading && (
          <div className="h-[600px] rounded-2xl bg-muted/50 animate-pulse" />
        )}

        {isError && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 text-destructive p-4 text-sm">
            Could not load panchanga for this date.
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
              वर्षभरि चलाउनुहोस्
            </span>
            <span className="text-sm font-mono font-semibold tabular-nums">
              {toNepaliDigits(clampedDay)} / {toNepaliDigits(totalDays)}
            </span>
          </div>
          <input
            type="range"
            className="w-full"
            min={1}
            max={totalDays}
            step={1}
            value={clampedDay}
            onChange={(e) => setDayOfYear(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
