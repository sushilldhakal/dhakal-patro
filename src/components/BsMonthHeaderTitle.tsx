import { ChevronLeft, ChevronRight } from "lucide-react";
import { BS_MONTH_NAMES, BS_MONTHS_NE, adToBS, bsMonthLabel, bsToAD, getBSMonthLength } from "@/lib/bs-calendar";
import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import { resolveSamvatsaraForBsYear } from "@/lib/samvatsara";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { formatClockParts, parseClockParts } from "@/components/panchanga/use-panchanga-mode";
import { BsNativeSelect, type BsNativeSelectOption } from "@/components/BsNativeSelect";
import {
  patroMonthChipButton,
  patroMonthChipDay,
  patroMonthChipHead,
  patroMonthChipShell,
  patroMonthNavShell,
  patroMonthRangeCompactBtn,
} from "@/lib/patro-classes";

interface Props {
  year: number;
  month: number;
  yearOptions: number[];
  todayAd?: string;
  onToday: () => void;
  todayAriaLabel: string;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  monthAriaLabel: string;
  yearAriaLabel: string;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  prevAriaLabel: string;
  nextAriaLabel: string;
  panchangaSubtitle?: string;
  day?: number;
  dayOptions?: BsNativeSelectOption[];
  onDayChange?: (day: number) => void;
  dayAriaLabel?: string;
  clock?: string;
  onClockChange?: (clock: string) => void;
  hourAriaLabel?: string;
  minuteAriaLabel?: string;
}

function chipMonthLabel(month: number, lang: string): string {
  if (lang === "en") {
    return BS_MONTH_NAMES[month - 1].slice(0, 3).toUpperCase();
  }
  return BS_MONTHS_NE[month - 1];
}

export function BsMonthHeaderTitle({
  year,
  month,
  yearOptions,
  todayAd,
  onToday,
  todayAriaLabel,
  onMonthChange,
  onYearChange,
  monthAriaLabel,
  yearAriaLabel,
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
  prevAriaLabel,
  nextAriaLabel,
  panchangaSubtitle,
  day,
  dayOptions,
  onDayChange,
  dayAriaLabel,
  clock,
  onClockChange,
  hourAriaLabel,
  minuteAriaLabel,
}: Props) {
  const { lang, pick, digits } = useLocale();

  const todayBs = adToBS(
    todayAd ? new Date(`${todayAd}T12:00:00`) : new Date(),
  );

  const monthTitle = pick(BS_MONTHS_NE[month - 1], BS_MONTH_NAMES[month - 1]);
  const samvatsara = resolveSamvatsaraForBsYear(year);
  const samvatsaraLabel = samvatsara ? pick(samvatsara.name_ne, samvatsara.name_en) : undefined;
  const adDayEnglish =
    day != null
      ? bsToAD(year, month, day).toLocaleDateString("en", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null;
  // Gregorian span a BS month covers (usually two English months, e.g. Asar →
  // "Jul/Aug 2026"). Shown on the landing page where no single day is selected.
  const adMonthRangeEnglish = (() => {
    if (day != null) return null;
    const start = bsToAD(year, month, 1);
    const end = bsToAD(year, month, getBSMonthLength(year, month));
    const startMonth = start.toLocaleDateString("en", { month: "short" });
    const endMonth = end.toLocaleDateString("en", { month: "short" });
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    if (startMonth === endMonth && startYear === endYear) {
      return `${startMonth} ${startYear}`;
    }
    if (startYear === endYear) {
      return `${startMonth}/${endMonth} ${startYear}`;
    }
    return `${startMonth} ${startYear}/${endMonth} ${endYear}`;
  })();
  const chipDay = day ?? todayBs.day;
  const chipMonth = day != null ? month : todayBs.month;
  const monthOptions = BS_MONTH_NAMES.map((_: string, i: number) => ({
    value: i + 1,
    label: bsMonthLabel(i + 1, lang),
  }));
  const yearSelectOptions = yearOptions.map((y) => ({
    value: y,
    label: digits(y),
  }));
  const { hour, minute } = clock ? parseClockParts(clock) : { hour: 0, minute: 0 };
  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: toNepaliDigits(String(i).padStart(2, "0")),
  }));
  const minuteOptions = Array.from({ length: 60 }, (_, i) => ({
    value: i,
    label: toNepaliDigits(String(i).padStart(2, "0")),
  }));

  const setClockPart = (nextHour: number, nextMinute: number) => {
    onClockChange?.(formatClockParts(nextHour, nextMinute));
  };

  return (
    <div className="flex min-w-0 items-center gap-3">
      <button
        type="button"
        className={cn(patroMonthChipShell, patroMonthChipButton)}
        onClick={onToday}
        aria-label={todayAriaLabel}
        title={todayAriaLabel}
      >
        <div className={patroMonthChipHead}>{chipMonthLabel(chipMonth, lang)}</div>
        <div className={patroMonthChipDay}>{digits(chipDay)}</div>
      </button>

      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="m-0 text-[1.375rem] font-bold leading-none tracking-tight sm:text-[1.625rem] lg:text-[1.875rem]">
          {monthTitle}{" "}
          <span className="font-num font-semibold text-secondary dark:text-secondary">{digits(year)}</span>
          {samvatsaraLabel ? (
            <span className="ml-1.5 text-[0.92em] font-semibold text-foreground/90">{samvatsaraLabel}</span>
          ) : null}
          {adDayEnglish ? (
            <span className="ml-1.5 text-[11px] font-medium text-muted-foreground sm:text-xs">
              {adDayEnglish}
            </span>
          ) : adMonthRangeEnglish ? (
            <span className="ml-1.5 text-[11px] font-medium text-muted-foreground sm:text-xs">
              {adMonthRangeEnglish}
            </span>
          ) : null}
        </h1>

        <div className={patroMonthNavShell}>
          <button
            type="button"
            className={patroMonthRangeCompactBtn}
            onClick={onPrev}
            disabled={prevDisabled}
            aria-label={prevAriaLabel}
          >
            <ChevronLeft size={14} strokeWidth={2} />
          </button>

          {dayOptions && onDayChange && dayAriaLabel ? (
            <BsNativeSelect
              className="w-[3.25rem] sm:w-[3.5rem]"
              value={day ?? dayOptions[0]?.value ?? 1}
              options={dayOptions}
              ariaLabel={dayAriaLabel}
              onChange={onDayChange}
            />
          ) : null}

          <BsNativeSelect
            className="w-[4.75rem] sm:w-[5.25rem]"
            value={month}
            options={monthOptions}
            ariaLabel={monthAriaLabel}
            onChange={onMonthChange}
          />

          <BsNativeSelect
            className="w-[4rem] sm:w-[4.5rem]"
            value={year}
            options={yearSelectOptions}
            ariaLabel={yearAriaLabel}
            onChange={onYearChange}
          />

          {clock && onClockChange && hourAriaLabel && minuteAriaLabel ? (
            <>
              <BsNativeSelect
                className="w-[3.25rem] sm:w-[3.5rem]"
                value={hour}
                options={hourOptions}
                ariaLabel={hourAriaLabel}
                onChange={(nextHour) => setClockPart(nextHour, minute)}
              />
              <BsNativeSelect
                className="w-[3.25rem] sm:w-[3.5rem]"
                value={minute}
                options={minuteOptions}
                ariaLabel={minuteAriaLabel}
                onChange={(nextMinute) => setClockPart(hour, nextMinute)}
              />
            </>
          ) : null}

          <button
            type="button"
            className={patroMonthRangeCompactBtn}
            onClick={onNext}
            disabled={nextDisabled}
            aria-label={nextAriaLabel}
          >
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        </div>

        {panchangaSubtitle ? (
          <p className="m-0 text-[11px] font-medium leading-none text-muted-foreground">{panchangaSubtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
