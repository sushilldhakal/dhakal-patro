/**
 * The date and time picker that opens over a fullscreen sky.
 *
 * The page's own date nav sits above the canvas and is out of reach once the
 * sky has the whole viewport, so this is the only way to jump dates there. It
 * is deliberately small — era, year, month, day and a clock — rather than the
 * full patro date sheet, which is wired into the page's URL browse state and
 * has nothing to say inside a canvas overlay.
 *
 * Everything is drawn inline. A popover or drawer would portal to `<body>`,
 * and the fullscreen layer this opens over is the only element the browser
 * paints while the Fullscreen API is engaged — a portalled panel simply would
 * not be on screen.
 *
 * The year is typed as well as stepped. The sky reaches पू.वि.सं. १३२०१ at one
 * end and वि.सं. १७२४७ at the other, and a native `<select>` of thirty thousand
 * options is not a way to reach either: on a phone it is a wheel you spin for a
 * minute, and it was capped at sixty years either side of today regardless. The
 * jump row below covers the distance in centuries and millennia; the input
 * covers the exact year.
 */

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BsNativeSelect, type BsNativeSelectOption } from "@/components/BsNativeSelect";
import { patroEraShortLabel } from "@/components/patro-date/patro-era-short-label";
import {
  adMonthLabel,
  bsMonthLabel,
  isGregorianEraBrowse,
} from "@/components/patro-date/patro-month-labels";
import type { Era } from "@/lib/era";
import { isDescendingEra, isPatroBrowseEraPair, togglePatroBrowseEra } from "@/lib/era";
import { clampBrowseYear, monthLengthInBrowseEra } from "@/lib/patro-browse-range";
import { cn } from "@/lib/utils";
import { useLocale, bilingualText } from "@/i18n/locale";

/** The rungs the jump row offers, in years. */
const YEAR_JUMPS = [1, 10, 100, 1000] as const;

type Props = {
  /** Which side of the Vikram epoch the year below is counted on. */
  era: Era;
  year: number;
  month: number;
  day: number;
  /** "HH:mm"; the time row is hidden when `onClockChange` is absent. */
  clock?: string;
  /**
   * A whole date, in whichever era the picker is showing. The page owns the
   * conversion: a पू.वि.सं. day cannot be dated from the offline table at all,
   * so it is a round trip to the backend and only the caller knows about that.
   */
  onSelectDate: (era: Era, year: number, month: number, day: number) => void;
  onClockChange?: (clock: string) => void;
  onDone: () => void;
};

function range(from: number, to: number): number[] {
  const out: number[] = [];
  for (let i = from; i <= to; i += 1) out.push(i);
  return out;
}

export function SkyDateTimePicker({
  era,
  year,
  month,
  day,
  clock,
  onSelectDate,
  onClockChange,
  onDone,
}: Props) {
  const { lang, digits } = useLocale();
  const { t } = useTranslation();
  const pick = (ne: string, en: string) => bilingualText(lang, ne, en);

  /* The nav above the canvas can be browsing Gregorian instead — name the
     months in whichever calendar the year is being counted in. */
  const gregorian = isGregorianEraBrowse(era);
  const monthOptions: BsNativeSelectOption[] = useMemo(
    () =>
      range(1, 12).map((m) => ({
        value: m,
        label: gregorian ? adMonthLabel(m, lang) : bsMonthLabel(m, lang),
      })),
    [gregorian, lang],
  );

  /* Month lengths vary across the Vikram table — and a पू.वि.सं. year has to be
     read on the negative side of the axis to get them — so the day list is
     rebuilt for the era, year and month on screen rather than always offering
     32. */
  const dayOptions: BsNativeSelectOption[] = useMemo(
    () =>
      range(1, monthLengthInBrowseEra(era, year, month)).map((d) => ({
        value: d,
        label: digits(d),
      })),
    [era, year, month, digits],
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
     out so a jump from Jestha 32 to Poush never lands on a date that is not.
     The year is clamped to what the ephemeris can answer for, so holding down
     +१००० stops at the end of the axis instead of walking off it. */
  const commit = (nextEra: Era, rawYear: number, nextMonth: number, nextDay: number) => {
    const nextYear = clampBrowseYear(nextEra, rawYear);
    const length = monthLengthInBrowseEra(nextEra, nextYear, nextMonth);
    onSelectDate(nextEra, nextYear, nextMonth, Math.min(nextDay, length));
  };

  /**
   * The year box, while it is being typed in.
   *
   * Committing every keystroke would fight the typist — clearing the field to
   * retype "5000" would commit year 5, then 50, and each of those is a date
   * change the page may have to ask the backend about. So the text is local
   * until blur or Enter, and follows the committed year whenever that moves
   * from outside (the jump row, the arrows above the canvas).
   */
  const [yearText, setYearText] = useState(() => String(year));
  const [shownYear, setShownYear] = useState(year);
  if (shownYear !== year) {
    setShownYear(year);
    setYearText(String(year));
  }

  const commitYearText = () => {
    const parsed = Number.parseInt(yearText, 10);
    if (!Number.isFinite(parsed)) {
      setYearText(String(year));
      return;
    }
    const next = clampBrowseYear(era, parsed);
    setYearText(String(next));
    if (next !== year) commit(era, next, month, day);
  };

  /* The two sides of the epoch, the earlier one first, so the pair does not
     swap places under the finger when the era changes. */
  const otherEra = isPatroBrowseEraPair(era) ? togglePatroBrowseEra(era) : null;
  const eraPair: Era[] = otherEra
    ? isDescendingEra(era)
      ? [era, otherEra]
      : [otherEra, era]
    : [era];

  const jumpBtn =
    "min-w-0 flex-1 rounded-md border border-border bg-card px-1 py-1.5 font-num text-xs font-semibold text-foreground transition-colors hover:bg-surface-hover";

  return (
    <div className="flex flex-col gap-3">
      {/* Which side of the epoch, named on both buttons rather than hidden
          behind a single toggle: पू.वि.सं. is most of the range this sky can
          reach, and in fullscreen there is no nav above the canvas to say
          which era the date on screen is being read in. */}
      {otherEra ? (
        <div className="grid grid-cols-2 gap-2" role="group">
          {eraPair.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={option === era}
              onClick={() => {
                if (option !== era) commit(option, year, month, day);
              }}
              className={cn(
                "rounded-lg border px-2 py-2 text-sm font-semibold transition-colors",
                option === era
                  ? "border-secondary bg-secondary text-secondary-foreground"
                  : "border-border bg-card text-foreground hover:bg-surface-hover",
              )}
            >
              {patroEraShortLabel(option, t)}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={yearText}
          aria-label={bilingualText(lang, "वर्ष", "Year")}
          onChange={(e) => setYearText(e.target.value.replace(/[^0-9]/g, ""))}
          onBlur={commitYearText}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitYearText();
            }
          }}
          className="h-9 w-full min-w-0 rounded-md border border-border bg-card px-2 text-center font-num text-sm font-semibold text-foreground outline-none focus:border-secondary"
        />
        <span className="shrink-0 text-xs font-semibold text-muted-foreground">
          {patroEraShortLabel(era, t)}
        </span>
      </div>

      {/* The distance the wheel could not cover. पू.वि.सं. counts backwards, so
          "earlier" there means a bigger number — the row is labelled by
          direction in time, not by which way the digits go. */}
      <div className="flex items-center gap-1">
        {[...YEAR_JUMPS].reverse().map((step) => (
          <button
            key={`back-${step}`}
            type="button"
            className={jumpBtn}
            aria-label={pick(`${step} वर्ष पछाडि`, `${step} years back`)}
            onClick={() => commit(era, year + (era === "bbs" ? step : -step), month, day)}
          >
            −{digits(step)}
          </button>
        ))}
        {YEAR_JUMPS.map((step) => (
          <button
            key={`fwd-${step}`}
            type="button"
            className={jumpBtn}
            aria-label={pick(`${step} वर्ष अगाडि`, `${step} years forward`)}
            onClick={() => commit(era, year + (era === "bbs" ? -step : step), month, day)}
          >
            +{digits(step)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <BsNativeSelect
          value={month}
          options={monthOptions}
          onChange={(v) => commit(era, year, v, day)}
          ariaLabel={bilingualText(lang, "महिना", "Month")}
          comfortable
        />
        <BsNativeSelect
          value={day}
          options={dayOptions}
          onChange={(v) => commit(era, year, month, v)}
          ariaLabel={bilingualText(lang, "गते", "Day")}
          comfortable
        />
      </div>

      {onClockChange ? (
        <div className="grid grid-cols-2 gap-2">
          <BsNativeSelect
            value={hour}
            options={hourOptions}
            onChange={(v) => onClockChange(`${String(v).padStart(2, "0")}:${String(minute).padStart(2, "0")}`)}
            ariaLabel={bilingualText(lang, "घण्टा", "Hour")}
            comfortable
          />
          <BsNativeSelect
            value={minute}
            options={minuteOptions}
            onChange={(v) => onClockChange(`${String(hour).padStart(2, "0")}:${String(v).padStart(2, "0")}`)}
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
