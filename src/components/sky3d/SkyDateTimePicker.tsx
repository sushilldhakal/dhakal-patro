/**
 * The date and time picker that opens over a fullscreen sky.
 *
 * The page's own date nav sits above the canvas and is out of reach once the
 * sky has the whole viewport, so this is the only way to jump dates there. It
 * is deliberately small — year, month, day and a clock — rather than the full
 * patro date sheet, which is wired into the page's URL browse state and has
 * nothing to say inside a canvas overlay.
 */

import { useMemo } from "react";
import { BsNativeSelect, type BsNativeSelectOption } from "@/components/BsNativeSelect";
import { bsMonthLabel, getBSMonthLength } from "@/lib/bs-calendar";
import { clampBrowseYear, maxBrowseYearForEraOrDefault } from "@/lib/patro-browse-range";
import { useLocale, bilingualText } from "@/i18n/locale";

/** How many years either side of the current one the year select offers. */
const YEAR_RADIUS = 60;

type Props = {
  year: number;
  month: number;
  day: number;
  /** "HH:mm"; the time row is hidden when `onClockChange` is absent. */
  clock?: string;
  onSelectDate: (year: number, month: number, day: number) => void;
  onClockChange?: (clock: string) => void;
  onDone: () => void;
};

function range(from: number, to: number): number[] {
  const out: number[] = [];
  for (let i = from; i <= to; i += 1) out.push(i);
  return out;
}

export function SkyDateTimePicker({
  year,
  month,
  day,
  clock,
  onSelectDate,
  onClockChange,
  onDone,
}: Props) {
  const { lang, digits } = useLocale();

  const yearOptions: BsNativeSelectOption[] = useMemo(() => {
    const max = maxBrowseYearForEraOrDefault("bs");
    const y = clampBrowseYear("bs", year);
    return range(Math.max(1, y - YEAR_RADIUS), Math.min(max, y + YEAR_RADIUS)).map((v) => ({
      value: v,
      label: digits(v),
    }));
  }, [year, digits]);

  const monthOptions: BsNativeSelectOption[] = useMemo(
    () => range(1, 12).map((m) => ({ value: m, label: bsMonthLabel(m, lang) })),
    [lang],
  );

  /* Month lengths vary across the BS table, so the day list is rebuilt for the
     year and month on screen rather than always offering 32. */
  const dayOptions: BsNativeSelectOption[] = useMemo(
    () => range(1, getBSMonthLength(year, month)).map((d) => ({ value: d, label: digits(d) })),
    [year, month, digits],
  );

  const [hour, minute] = useMemo(() => {
    const [h, m] = (clock ?? "12:00").split(":");
    return [Number(h) || 0, Number(m) || 0];
  }, [clock]);

  const hourOptions: BsNativeSelectOption[] = useMemo(
    () => range(0, 23).map((h) => ({ value: h, label: digits(String(h).padStart(2, "0")) })),
    [digits],
  );
  const minuteOptions: BsNativeSelectOption[] = useMemo(
    () => range(0, 59).map((m) => ({ value: m, label: digits(String(m).padStart(2, "0")) })),
    [digits],
  );

  /* Shortening the month can strand the day past its end — clamp on the way
     out so a jump from Jestha 32 to Poush never lands on a date that is not. */
  const commit = (nextYear: number, nextMonth: number, nextDay: number) => {
    const length = getBSMonthLength(nextYear, nextMonth);
    onSelectDate(nextYear, nextMonth, Math.min(nextDay, length));
  };

  const setClock = (h: number, m: number) =>
    onClockChange?.(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <BsNativeSelect
          value={year}
          options={yearOptions}
          onChange={(v) => commit(v, month, day)}
          ariaLabel={bilingualText(lang, "वर्ष", "Year")}
          comfortable
        />
        <BsNativeSelect
          value={month}
          options={monthOptions}
          onChange={(v) => commit(year, v, day)}
          ariaLabel={bilingualText(lang, "महिना", "Month")}
          comfortable
        />
        <BsNativeSelect
          value={day}
          options={dayOptions}
          onChange={(v) => commit(year, month, v)}
          ariaLabel={bilingualText(lang, "गते", "Day")}
          comfortable
        />
      </div>

      {onClockChange ? (
        <div className="grid grid-cols-2 gap-2">
          <BsNativeSelect
            value={hour}
            options={hourOptions}
            onChange={(v) => setClock(v, minute)}
            ariaLabel={bilingualText(lang, "घण्टा", "Hour")}
            comfortable
          />
          <BsNativeSelect
            value={minute}
            options={minuteOptions}
            onChange={(v) => setClock(hour, v)}
            ariaLabel={bilingualText(lang, "मिनेट", "Minute")}
            comfortable
          />
        </div>
      ) : null}

      <button
        type="button"
        onClick={onDone}
        className="rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90"
      >
        {bilingualText(lang, "भयो", "Done")}
      </button>
    </div>
  );
}
