import { CalendarClock, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { BS_MONTH_NAMES, BS_MONTHS_NE, adToBS, bsMonthLabel, bsToAD, getBSMonthLength } from "@/lib/bs-calendar";
import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import { resolveSamvatsaraForBsYear } from "@/lib/samvatsara";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { formatClockParts, parseClockParts } from "@/components/panchanga/use-panchanga-mode";
import { BsNativeSelect, type BsNativeSelectOption } from "@/components/BsNativeSelect";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
  /** Panchanga: on viewports below md, open date/time pickers in a bottom sheet. */
  mobileDateTimeDrawer?: boolean;
}

function chipMonthLabel(month: number, lang: string): string {
  if (lang === "en") {
    return BS_MONTH_NAMES[month - 1].slice(0, 3).toUpperCase();
  }
  return BS_MONTHS_NE[month - 1];
}

type NavControlsProps = {
  day?: number;
  dayOptions?: BsNativeSelectOption[];
  onDayChange?: (day: number) => void;
  dayAriaLabel?: string;
  month: number;
  monthOptions: BsNativeSelectOption[];
  monthAriaLabel: string;
  onMonthChange: (month: number) => void;
  year: number;
  yearSelectOptions: BsNativeSelectOption[];
  yearAriaLabel: string;
  onYearChange: (year: number) => void;
  hour: number;
  minute: number;
  hourOptions: BsNativeSelectOption[];
  minuteOptions: BsNativeSelectOption[];
  hourAriaLabel?: string;
  minuteAriaLabel?: string;
  onClockPart: (hour: number, minute: number) => void;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled: boolean;
  nextDisabled: boolean;
  prevAriaLabel: string;
  nextAriaLabel: string;
  showTime: boolean;
  /** comfortable widths inside the mobile drawer */
  spacious?: boolean;
};

function MonthNavControls({
  day,
  dayOptions,
  onDayChange,
  dayAriaLabel,
  month,
  monthOptions,
  monthAriaLabel,
  onMonthChange,
  year,
  yearSelectOptions,
  yearAriaLabel,
  onYearChange,
  hour,
  minute,
  hourOptions,
  minuteOptions,
  hourAriaLabel,
  minuteAriaLabel,
  onClockPart,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  prevAriaLabel,
  nextAriaLabel,
  showTime,
  spacious = false,
}: NavControlsProps) {
  const dayW = spacious ? "w-[3.75rem]" : "w-[2.75rem] sm:w-[3.5rem]";
  const monthW = spacious ? "w-[5.75rem]" : "w-[3.25rem] sm:w-[5.25rem]";
  const yearW = spacious ? "w-[4.5rem]" : "w-[2.875rem] sm:w-[4.5rem]";
  const timeW = spacious ? "w-[3.75rem]" : "w-[2.75rem] sm:w-[3.5rem]";

  return (
    <>
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
          className={dayW}
          value={day ?? dayOptions[0]?.value ?? 1}
          options={dayOptions}
          ariaLabel={dayAriaLabel}
          onChange={onDayChange}
        />
      ) : null}

      <BsNativeSelect
        className={monthW}
        value={month}
        options={monthOptions}
        ariaLabel={monthAriaLabel}
        onChange={onMonthChange}
      />

      <BsNativeSelect
        className={yearW}
        value={year}
        options={yearSelectOptions}
        ariaLabel={yearAriaLabel}
        onChange={onYearChange}
      />

      {showTime && hourAriaLabel && minuteAriaLabel ? (
        <>
          <BsNativeSelect
            className={timeW}
            value={hour}
            options={hourOptions}
            ariaLabel={hourAriaLabel}
            onChange={(nextHour) => onClockPart(nextHour, minute)}
          />
          <BsNativeSelect
            className={timeW}
            value={minute}
            options={minuteOptions}
            ariaLabel={minuteAriaLabel}
            onChange={(nextMinute) => onClockPart(hour, nextMinute)}
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
    </>
  );
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
  mobileDateTimeDrawer = false,
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
  const showTime = Boolean(clock && onClockChange && hourAriaLabel && minuteAriaLabel);

  const setClockPart = (nextHour: number, nextMinute: number) => {
    onClockChange?.(formatClockParts(nextHour, nextMinute));
  };

  const navProps: NavControlsProps = {
    day,
    dayOptions,
    onDayChange,
    dayAriaLabel,
    month,
    monthOptions,
    monthAriaLabel,
    onMonthChange,
    year,
    yearSelectOptions,
    yearAriaLabel,
    onYearChange,
    hour,
    minute,
    hourOptions,
    minuteOptions,
    hourAriaLabel,
    minuteAriaLabel,
    onClockPart: setClockPart,
    onPrev,
    onNext,
    prevDisabled,
    nextDisabled,
    prevAriaLabel,
    nextAriaLabel,
    showTime,
  };

  const clockSummary = showTime
    ? `${toNepaliDigits(String(hour).padStart(2, "0"))}:${toNepaliDigits(String(minute).padStart(2, "0"))}`
    : null;
  const mobileSummary = day != null
    ? `${digits(day)} ${monthTitle} ${digits(year)}${clockSummary ? ` · ${clockSummary}` : ""}`
    : `${monthTitle} ${digits(year)}${clockSummary ? ` · ${clockSummary}` : ""}`;

  return (
    <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
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

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:gap-1">
        <div className="flex min-w-0 flex-col gap-0.5 md:flex-row md:items-center md:gap-3">
          <h1 className="m-0 min-w-0 text-[0.875rem] font-bold leading-tight tracking-tight sm:text-[1.5em] lg:text-[1.875rem]">
            <span className="max-md:inline-block max-md:max-w-full max-md:truncate">
              {monthTitle}{" "}
              <span className="font-num font-semibold text-secondary dark:text-secondary">{digits(year)}</span>
            </span>
            {samvatsaraLabel ? (
              <span className="ml-1 hidden text-[0.92em] font-semibold text-foreground/90 sm:inline">
                {samvatsaraLabel}
              </span>
            ) : null}
            {adDayEnglish ? (
              <span className="block text-[10px] font-medium text-muted-foreground sm:ml-1.5 sm:inline sm:text-xs">
                {adDayEnglish}
              </span>
            ) : adMonthRangeEnglish ? (
              <span className="block text-[10px] font-medium text-muted-foreground sm:ml-1.5 sm:inline sm:text-xs">
                {adMonthRangeEnglish}
              </span>
            ) : null}
          </h1>

          <div
            className={cn(
              patroMonthNavShell,
              mobileDateTimeDrawer && showTime
                ? "hidden md:inline-flex md:shrink-0"
                : "inline-flex md:shrink-0",
            )}
          >
            <MonthNavControls {...navProps} />
          </div>
        </div>

        {mobileDateTimeDrawer && showTime ? (
          <Drawer>
            <DrawerTrigger asChild>
              <button
                type="button"
                className="flex w-full max-w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-left text-[12px] font-medium text-foreground md:hidden"
                aria-label={pick("मिति र समय बदल्नुहोस्", "Change date and time")}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <CalendarClock className="size-4 shrink-0 text-secondary" strokeWidth={2} />
                  <span className="truncate font-num">{mobileSummary}</span>
                </span>
                <ChevronDown className="size-4 shrink-0 opacity-50" strokeWidth={2} />
              </button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader className="text-left">
                <DrawerTitle>{pick("मिति र समय", "Date & time")}</DrawerTitle>
              </DrawerHeader>
              <div className="flex flex-col gap-5 px-4 pb-2">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {pick("मिति", "Date")}
                  </p>
                  <div className={cn(patroMonthNavShell, "w-full justify-center")}>
                    <MonthNavControls {...navProps} showTime={false} spacious />
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {pick("समय", "Time")}
                  </p>
                  <div className={cn(patroMonthNavShell, "w-full justify-center")}>
                    <BsNativeSelect
                      className="w-[4rem]"
                      value={hour}
                      options={hourOptions}
                      ariaLabel={hourAriaLabel!}
                      onChange={(nextHour) => setClockPart(nextHour, minute)}
                    />
                    <span className="px-0.5 font-num text-sm font-semibold text-muted-foreground">:</span>
                    <BsNativeSelect
                      className="w-[4rem]"
                      value={minute}
                      options={minuteOptions}
                      ariaLabel={minuteAriaLabel!}
                      onChange={(nextMinute) => setClockPart(hour, nextMinute)}
                    />
                  </div>
                </div>
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <button
                    type="button"
                    className="h-10 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
                  >
                    {pick("भयो", "Done")}
                  </button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        ) : null}

        {panchangaSubtitle ? (
          <p className="m-0 text-[11px] font-medium leading-none text-muted-foreground">{panchangaSubtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
