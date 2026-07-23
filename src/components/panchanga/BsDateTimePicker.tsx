import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  BS_MONTH_NAMES,
  adToBS,
  bsMonthLabel,
  bsToAD,
  getBSMonthLength,
} from "@/lib/bs-calendar";
import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import { BsNativeSelect } from "@/components/BsNativeSelect";
import { PopoverClose } from "@/components/ui/popover";
import { formatClockParts, parseClockParts } from "@/components/panchanga/use-panchanga-mode";

const WEEKDAYS_NE = ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"];
const WEEKDAYS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface Props {
  year: number;
  month: number;
  day: number;
  yearOptions: number[];
  todayAd?: string;
  /** Committed only when the user presses Done — no live refetch while browsing. */
  onSelectDate: (year: number, month: number, day: number) => void;
  monthAriaLabel: string;
  yearAriaLabel: string;
  clock?: string;
  onClockChange?: (clock: string) => void;
  hourAriaLabel?: string;
  minuteAriaLabel?: string;
  showTime: boolean;
}

/** 24h → 12h parts. */
function to12h(hour24: number): { hour12: number; meridiem: "AM" | "PM" } {
  const meridiem = hour24 < 12 ? "AM" : "PM";
  const base = hour24 % 12;
  return { hour12: base === 0 ? 12 : base, meridiem };
}

/** 12h parts → 24h. */
function from12h(hour12: number, meridiem: "AM" | "PM"): number {
  const base = hour12 % 12;
  return meridiem === "AM" ? base : base + 12;
}

export function BsDateTimePicker({
  year,
  month,
  day,
  yearOptions,
  todayAd,
  onSelectDate,
  monthAriaLabel,
  yearAriaLabel,
  clock,
  onClockChange,
  hourAriaLabel,
  minuteAriaLabel,
  showTime,
}: Props) {
  const { lang, pick, digits } = useLocale();

  // Draft state — every interaction stays local; nothing is committed (and no
  // API refetch happens) until the user presses Done. The popover remounts on
  // each open, so this re-seeds from the current committed date/time.
  const [draft, setDraft] = useState({ year, month, day, clock: clock ?? "" });
  const { year: dYear, month: dMonth, day: dDay } = draft;

  const monthLen = getBSMonthLength(dYear, dMonth);
  const firstDow = bsToAD(dYear, dMonth, 1).getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: monthLen }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayBs = adToBS(todayAd ? new Date(`${todayAd}T12:00:00`) : new Date());

  const minYear = yearOptions[0] ?? dYear;
  const maxYear = yearOptions[yearOptions.length - 1] ?? dYear;

  const monthOptions = BS_MONTH_NAMES.map((_, i) => ({
    value: i + 1,
    label: bsMonthLabel(i + 1, lang),
  }));
  const yearSelectOptions = yearOptions.map((y) => ({ value: y, label: digits(y) }));
  const weekdays = lang === "en" ? WEEKDAYS_EN : WEEKDAYS_NE;

  const setMonthYear = (y: number, m: number) =>
    setDraft((d) => ({ ...d, year: y, month: m, day: Math.min(d.day, getBSMonthLength(y, m)) }));

  const stepMonth = (delta: number) => {
    let m = dMonth + delta;
    let y = dYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    if (y < minYear || y > maxYear) return;
    setMonthYear(y, m);
  };

  const prevDisabled = dYear <= minYear && dMonth <= 1;
  const nextDisabled = dYear >= maxYear && dMonth >= 12;

  const { hour, minute } = draft.clock ? parseClockParts(draft.clock) : { hour: 0, minute: 0 };
  const { hour12, meridiem } = to12h(hour);
  const hour12Options = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: digits(String(i + 1).padStart(2, "0")),
  }));
  const minuteOptions = Array.from({ length: 60 }, (_, i) => ({
    value: i,
    label: digits(String(i).padStart(2, "0")),
  }));
  const setTime = (nextHour12: number, nextMinute: number, nextMeridiem: "AM" | "PM") =>
    setDraft((d) => ({ ...d, clock: formatClockParts(from12h(nextHour12, nextMeridiem), nextMinute) }));

  const goDraftToday = () =>
    setDraft((d) => ({
      ...d,
      year: todayBs.year,
      month: todayBs.month,
      day: todayBs.day,
    }));

  // Push the draft to the page (and refetch) — only fires on Done.
  const commit = () => {
    const dateChanged = draft.year !== year || draft.month !== month || draft.day !== day;
    const clockChanged = showTime && draft.clock !== (clock ?? "");
    if (dateChanged) onSelectDate(draft.year, draft.month, draft.day);
    if (clockChanged) onClockChange?.(draft.clock);
  };

  return (
    <div className="mx-auto flex w-full max-w-[22.5rem] flex-col gap-2.5">
      {/* Month / year header with step arrows */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => stepMonth(-1)}
          disabled={prevDisabled}
          aria-label={pick("अघिल्लो महिना", "Previous month")}
          className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-surface-hover disabled:opacity-40"
        >
          <ChevronLeft size={15} strokeWidth={2} />
        </button>
        <BsNativeSelect
          className="min-w-0 flex-1"
          value={dMonth}
          options={monthOptions}
          ariaLabel={monthAriaLabel}
          onChange={(m) => setMonthYear(dYear, m)}
        />
        <BsNativeSelect
          className="w-[4.25rem] shrink-0"
          value={dYear}
          options={yearSelectOptions}
          ariaLabel={yearAriaLabel}
          onChange={(y) => setMonthYear(y, dMonth)}
        />
        <button
          type="button"
          onClick={() => stepMonth(1)}
          disabled={nextDisabled}
          aria-label={pick("अर्को महिना", "Next month")}
          className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-surface-hover disabled:opacity-40"
        >
          <ChevronRight size={15} strokeWidth={2} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {weekdays.map((wd, i) => (
            <div
              key={wd}
              className={cn(
                "flex h-6 items-center justify-center border-r border-border text-sm font-semibold uppercase tracking-tight last:border-r-0",
                (i === 0 || i === 6) && "text-danger/80",
              )}
            >
              {wd}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            if (d == null) {
              return (
                <div
                  key={`e-${i}`}
                  aria-hidden
                  className="h-8 border-b border-r border-border bg-muted/10"
                />
              );
            }
            const col = i % 7;
            const isWeekend = col === 0 || col === 6;
            const isSelected = d === dDay;
            const isToday =
              todayBs.year === dYear && todayBs.month === dMonth && todayBs.day === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDraft((prev) => ({ ...prev, day: d }))}
                aria-label={`${digits(d)}`}
                aria-pressed={isSelected}
                className={cn(
                  "font-num flex h-8 items-center justify-center border-b border-r border-border text-sm font-semibold tabular-nums transition-colors",
                  !isSelected && "hover:bg-surface-hover",
                  !isSelected && isWeekend && "text-danger",
                  !isSelected && !isWeekend && "text-foreground",
                  isToday && !isSelected && "ring-1 ring-inset ring-secondary",
                  isSelected && "bg-secondary text-secondary-foreground",
                )}
              >
                {digits(d)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time picker — 12 hour with AM/PM */}
      {showTime && hourAriaLabel && minuteAriaLabel ? (
        <div className="flex flex-col gap-1.5 border-t border-border pt-2.5">
          <span className="text-sm font-semibold uppercase tracking-[0.14em]">
            {pick("समय", "Time")}
          </span>
          <div className="flex items-center gap-1.5">
            <BsNativeSelect
              className="w-[3.5rem]"
              value={hour12}
              options={hour12Options}
              ariaLabel={hourAriaLabel}
              onChange={(h) => setTime(h, minute, meridiem)}
            />
            <span className="font-num text-sm font-semibold">:</span>
            <BsNativeSelect
              className="w-[3.5rem]"
              value={minute}
              options={minuteOptions}
              ariaLabel={minuteAriaLabel}
              onChange={(m) => setTime(hour12, m, meridiem)}
            />
            <div className="ml-auto inline-flex overflow-hidden rounded-md border border-border">
              {(["AM", "PM"] as const).map((mer) => (
                <button
                  key={mer}
                  type="button"
                  onClick={() => setTime(hour12, minute, mer)}
                  aria-pressed={meridiem === mer}
                  className={cn(
                    "px-2.5 py-1 text-sm font-bold transition-colors",
                    meridiem === mer
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-card hover:bg-surface-hover",
                  )}
                >
                  {mer}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Footer — Today stages the draft; Done commits and refetches. */}
      <div className="flex items-center gap-2 border-t border-border pt-2.5">
        <button
          type="button"
          onClick={goDraftToday}
          className="h-8 flex-1 rounded-md border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
        >
          {pick("आज", "Today")}
        </button>
        <PopoverClose asChild>
          <button
            type="button"
            onClick={commit}
            className="h-8 flex-1 rounded-md bg-secondary text-sm font-semibold text-secondary-foreground"
          >
            {pick("भयो", "Done")}
          </button>
        </PopoverClose>
      </div>
    </div>
  );
}
