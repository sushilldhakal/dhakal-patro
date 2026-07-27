import { CalendarClock, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { BS_MONTH_NAMES, BS_MONTHS_NE, AD_MONTH_NAMES, AD_MONTHS_SHORT, bsMonthLabel, bsToAD, getBSMonthLength } from "@/lib/bs-calendar";
import { getAdDayBsLabel, getAdMonthBsSpanLabel } from "@/lib/local-calendar";
import { useLocale } from "@/i18n/locale";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { resolveSamvatsaraForBsYear } from "@/lib/samvatsara";
import { samvatsaraName } from "@/lib/samvatsara-i18n";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { formatClockParts, parseClockParts } from "@/components/panchanga/use-panchanga-mode";
import { BsHeadline } from "@/components/BsHeadline";
import { BsNativeSelect, type BsNativeSelectOption } from "@/components/BsNativeSelect";
import { BsDateTimePicker } from "@/components/panchanga/BsDateTimePicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  patroMonthNavBtn,
  patroMonthRangeCompactBtn,
  patroMobilePickerBtn,
  patroMobileStepBtn,
} from "@/lib/patro-classes";

export type PatroDateNavCoreProps = {
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
  /** Combined year+month+day setter — enables the calendar popover date picker. */
  onSelectDate?: (year: number, month: number, day: number) => void;
  clock?: string;
  onClockChange?: (clock: string) => void;
  hourAriaLabel?: string;
  minuteAriaLabel?: string;
  /** Below md: hide inline nav and open date (and time when set) in a bottom sheet. */
  mobileDateTimeDrawer?: boolean;
  /** Below md: top-right on row 1 (toggle on home, location on panchanga). */
  mobileToolbar?: ReactNode;
  /** Below md: bottom-right on row 2 (location on home, under toggle). */
  mobileToolbarLower?: ReactNode;
  /** Gregorian month navigation when UI language is English. */
  calendarMode?: "bs" | "ad";
}

function chipMonthLabel(month: number, lang: string, calendarMode: "bs" | "ad" = "bs"): string {
  if (calendarMode === "ad") {
    return AD_MONTHS_SHORT[month - 1].toUpperCase();
  }
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
  /** hide prev/next when the sheet already has outer step buttons */
  hideNavArrows?: boolean;
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
  hideNavArrows = false,
}: NavControlsProps) {
  const dayW = spacious ? "w-[4rem]" : "w-[2.75rem] sm:w-[3.5rem]";
  const monthW = spacious ? "w-[6.5rem]" : "w-[3.25rem] sm:w-[5.25rem]";
  const yearW = spacious ? "w-[5rem]" : "w-[2.875rem] sm:w-[4.5rem]";
  const timeW = spacious ? "w-[4rem]" : "w-[2.75rem] sm:w-[3.5rem]";
  const btnClass = spacious ? patroMonthNavBtn : patroMonthRangeCompactBtn;

  return (
    <>
      {!hideNavArrows ? (
        <button
          type="button"
          className={btnClass}
          onClick={onPrev}
          disabled={prevDisabled}
          aria-label={prevAriaLabel}
        >
          <ChevronLeft size={14} strokeWidth={2} />
        </button>
      ) : null}

      {dayOptions && onDayChange && dayAriaLabel ? (
        <BsNativeSelect
          className={dayW}
          value={day ?? dayOptions[0]?.value ?? 1}
          options={dayOptions}
          ariaLabel={dayAriaLabel}
          onChange={onDayChange}
          comfortable={spacious}
        />
      ) : null}

      <BsNativeSelect
        className={monthW}
        value={month}
        options={monthOptions}
        ariaLabel={monthAriaLabel}
        onChange={onMonthChange}
        comfortable={spacious}
      />

      <BsNativeSelect
        className={yearW}
        value={year}
        options={yearSelectOptions}
        ariaLabel={yearAriaLabel}
        onChange={onYearChange}
        comfortable={spacious}
      />

      {showTime && hourAriaLabel && minuteAriaLabel ? (
        <>
          <BsNativeSelect
            className={timeW}
            value={hour}
            options={hourOptions}
            ariaLabel={hourAriaLabel}
            onChange={(nextHour) => onClockPart(nextHour, minute)}
            comfortable={spacious}
          />
          <BsNativeSelect
            className={timeW}
            value={minute}
            options={minuteOptions}
            ariaLabel={minuteAriaLabel}
            onChange={(nextMinute) => onClockPart(hour, nextMinute)}
            comfortable={spacious}
          />
        </>
      ) : null}

      {!hideNavArrows ? (
        <button
          type="button"
          className={btnClass}
          onClick={onNext}
          disabled={nextDisabled}
          aria-label={nextAriaLabel}
        >
          <ChevronRight size={14} strokeWidth={2} />
        </button>
      ) : null}
    </>
  );
}

export function PatroDateNavCore({
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
  onSelectDate,
  clock,
  onClockChange,
  hourAriaLabel,
  minuteAriaLabel,
  mobileDateTimeDrawer = false,
  mobileToolbar,
  mobileToolbarLower,
  calendarMode = "bs",
}: PatroDateNavCoreProps) {
  const { lang, digits } = useLocale();
  const { t } = useTranslation();
  const isAdCalendar = calendarMode === "ad";

  const monthTitle = isAdCalendar
    ? lang === "en"
      ? AD_MONTH_NAMES[month - 1]
      : new Date(year, month - 1, 1).toLocaleDateString("ne-NP", { month: "long" })
    : bsMonthLabel(month, lang);
  const samvatsara = isAdCalendar ? undefined : resolveSamvatsaraForBsYear(year);
  const samvatsaraLabel = samvatsara ? samvatsaraName(samvatsara, lang) : undefined;
  const adLocale = lang === "en" ? "en-US" : "ne-NP";
  // Always day → month → year (e.g. "२५ जुलाई २०२६" / "25 Jul 2026"). Relying on
  // toLocaleDateString's own ordering put ne-NP as year-month-day, which reads
  // backwards; build the parts explicitly instead.
  const adDayEnglish = (() => {
    if (day == null || isAdCalendar) return null;
    const d = bsToAD(year, month, day);
    const monthShort = d.toLocaleDateString(adLocale, { month: "short" });
    const numLabel = (n: number) => (lang === "en" ? String(n) : digits(n));
    return `${numLabel(d.getDate())} ${monthShort} ${numLabel(d.getFullYear())}`;
  })();
  const adMonthRangeEnglish = (() => {
    if (day != null) return null;
    if (isAdCalendar) {
      return getAdMonthBsSpanLabel(year, month, lang, digits);
    }
    const start = bsToAD(year, month, 1);
    const end = bsToAD(year, month, getBSMonthLength(year, month));
    const startMonth = start.toLocaleDateString(adLocale, { month: "short" });
    const endMonth = end.toLocaleDateString(adLocale, { month: "short" });
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const yearLabel = (y: number) => (lang === "en" ? String(y) : digits(y));
    if (startMonth === endMonth && startYear === endYear) {
      return `${startMonth} ${yearLabel(startYear)}`;
    }
    if (startYear === endYear) {
      return `${startMonth}/${endMonth} ${yearLabel(startYear)}`;
    }
    return `${startMonth} ${yearLabel(startYear)}/${endMonth} ${yearLabel(endYear)}`;
  })();
  // Month-only views: chip shows the browsed month (day 1). Day views keep today
  // in the chip because it doubles as the jump-to-today control.
  const chipDay = day ?? 1;
  const chipMonth = month;
  const monthOptions = (isAdCalendar ? AD_MONTH_NAMES : BS_MONTH_NAMES).map((_: string, i: number) => ({
    value: i + 1,
    label: isAdCalendar ? AD_MONTH_NAMES[i] : bsMonthLabel(i + 1, lang),
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
  const monthPickerHint = t("patro_date.month_aria");
  /** Picker chip: omit year when the title already shows it (panchanga day view). */
  const mobilePickerLabel =
    day != null
      ? clockSummary
        ? `${digits(day)} ${monthTitle} · ${clockSummary}`
        : `${digits(day)} ${monthTitle}`
      : monthPickerHint;
  /**
   * Below sm (<640px): day view drops the month token (title row shows it).
   * Month view uses a neutral hint — title already shows month + year.
   */
  const mobilePickerLabelCompact =
    day != null
      ? `${digits(day)}${clockSummary ? ` · ${clockSummary}` : ""}`
      : monthPickerHint;

  // Day views (panchanga) get a proper calendar + 12h time popover; month
  // views (home) keep the select-based nav / bottom sheet.
  const useCalendarPicker = day != null;
  const selectDate =
    onSelectDate ??
    ((y: number, m: number, d: number) => {
      if (y !== year) onYearChange(y);
      else if (m !== month) onMonthChange(m);
      else onDayChange?.(d);
    });

  const calendarControl = (stepCls: string, wrapperCls?: string) => (
    <div className={cn("flex min-w-0 items-center gap-1", wrapperCls)}>
      <button
        type="button"
        className={stepCls}
        onClick={onPrev}
        disabled={prevDisabled}
        aria-label={prevAriaLabel}
      >
        <ChevronLeft size={15} strokeWidth={2} />
      </button>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={patroMobilePickerBtn}
            aria-label={
              showTime
                ? t("patro_date.change_date_time")
                : t("patro_date.change_date")
            }
          >
            <CalendarClock className="hidden size-3.5 shrink-0 text-secondary sm:block" strokeWidth={2} />
            <span className="min-w-0 truncate font-num sm:hidden">{mobilePickerLabelCompact}</span>
            <span className="hidden min-w-0 truncate font-num sm:inline">{mobilePickerLabel}</span>
            <ChevronDown className="size-3.5 shrink-0 opacity-50" strokeWidth={2} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={6} className="w-[17.5rem]">
          <BsDateTimePicker
            calendarMode={calendarMode}
            year={year}
            month={month}
            day={day ?? 1}
            yearOptions={yearOptions}
            todayAd={todayAd}
            onSelectDate={selectDate}
            monthAriaLabel={monthAriaLabel}
            yearAriaLabel={yearAriaLabel}
            clock={clock}
            onClockChange={onClockChange}
            hourAriaLabel={hourAriaLabel}
            minuteAriaLabel={minuteAriaLabel}
            showTime={showTime}
          />
        </PopoverContent>
      </Popover>
      <button
        type="button"
        className={stepCls}
        onClick={onNext}
        disabled={nextDisabled}
        aria-label={nextAriaLabel}
      >
        <ChevronRight size={15} strokeWidth={2} />
      </button>
    </div>
  );

  const subtitleLine = isAdCalendar
    ? day != null
      ? getAdDayBsLabel(year, month, day, lang, digits)
      : adMonthRangeEnglish
    : adDayEnglish ?? adMonthRangeEnglish;

  // Nepali BS date part of the heading. The संवत्सर name and Gregorian subtitle
  // are ordered by <BsHeadline>, which is the single source of truth for the
  // `<BS date> <संवत्सर> <Gregorian>` order shared across every page.
  const bsTitlePart = (
    <>
      {monthTitle}{" "}
      <span className="font-num font-semibold text-secondary dark:text-secondary">{digits(year)}</span>
    </>
  );

  const mobileTitleBlock = (
    <BsHeadline
      className="text-sm"
      bs={bsTitlePart}
      bsClassName="min-w-0"
      samvatsara={samvatsaraLabel}
      samvatsaraClassName="text-sm"
      gregorian={subtitleLine}
      gregorianClassName="text-xs font-semibold text-muted-foreground"
    />
  );

  const titleBlock = (
    <BsHeadline
      className="text-xl text-base"
      bs={bsTitlePart}
      bsClassName="min-w-0"
      samvatsara={samvatsaraLabel}
      samvatsaraClassName="hidden text-xl sm:inline"
      gregorian={subtitleLine}
      gregorianClassName="text-xs font-semibold text-muted-foreground"
    />
  );

  const drawerBlock = mobileDateTimeDrawer ? (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          type="button"
          className={patroMobilePickerBtn}
          aria-label={
            showTime
              ? t("patro_date.change_date_time")
              : t("patro_date.change_date")
          }
        >
          <CalendarClock className="hidden size-3.5 shrink-0 text-secondary sm:block" strokeWidth={2} />
          <span className="min-w-0 truncate font-num sm:hidden">{mobilePickerLabelCompact}</span>
          <span className="hidden min-w-0 truncate font-num sm:inline">{mobilePickerLabel}</span>
          <ChevronDown className="size-3.5 shrink-0 opacity-50" strokeWidth={2} />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="pb-2 text-center">
          <DrawerTitle className="text-base text-center">
            {showTime
              ? t("patro_date.date_time")
              : t("patro_date.month_year")}
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-4 px-4 pb-2">
          <div className="flex w-full items-center justify-center">
            <div className={cn(patroMonthNavShell, "gap-2")}>
              <MonthNavControls
                {...navProps}
                showTime={false}
                spacious
                hideNavArrows
              />
            </div>
          </div>
          {showTime && hourAriaLabel && minuteAriaLabel ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t("common.time")}
              </p>
              <div className="flex w-full items-center justify-center gap-2">
                <BsNativeSelect
                  className="w-[4.5rem]"
                  value={hour}
                  options={hourOptions}
                  ariaLabel={hourAriaLabel}
                  onChange={(nextHour) => setClockPart(nextHour, minute)}
                  comfortable
                />
                <span className="px-0.5 font-num text-base font-semibold">:</span>
                <BsNativeSelect
                  className="w-[4.5rem]"
                  value={minute}
                  options={minuteOptions}
                  ariaLabel={minuteAriaLabel}
                  onChange={(nextMinute) => setClockPart(hour, nextMinute)}
                  comfortable
                />
              </div>
            </div>
          ) : null}
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <button
              type="button"
              className="h-10 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
            >
              {t("common.done")}
            </button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ) : null;

  return (
    <div className="flex min-w-0 items-start gap-1.5 sm:gap-3">
      <button
        type="button"
        className={cn(patroMonthChipShell, patroMonthChipButton)}
        onClick={onToday}
        aria-label={todayAriaLabel}
        title={todayAriaLabel}
      >
        <div className={patroMonthChipHead}>{chipMonthLabel(chipMonth, lang, calendarMode)}</div>
        <div className={patroMonthChipDay}>{digits(chipDay)}</div>
      </button>

      <div className="@container/month-head min-w-0 flex-1">
        {/* Mobile only (<768px): row1 title|toolbar, row2 picker|toolbarLower */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-0.5 md:hidden">
          <div className="col-start-1 row-start-1 min-w-0">{mobileTitleBlock}</div>
          {mobileToolbar ? (
            <div className="col-start-2 row-start-1 flex shrink-0 items-start justify-end self-start">
              {mobileToolbar}
            </div>
          ) : null}
          <div className="col-start-1 row-start-2 -mt-1 flex min-w-0 flex-col gap-1">
            {useCalendarPicker ? (
              // Prev/next arrows flank the calendar+time popover, so the day can
              // be stepped without opening the picker — mirrors the md+ nav row.
              calendarControl(patroMobileStepBtn, "-mt-[5px]")
            ) : mobileDateTimeDrawer ? (
              // Prev/next arrows flank the date picker so the month/day can be
              // stepped without opening the sheet — mirrors the md+ nav row.
              <div className="-mt-[5px] flex min-w-0 items-center gap-1">
                <button
                  type="button"
                  className={patroMobileStepBtn}
                  onClick={onPrev}
                  disabled={prevDisabled}
                  aria-label={prevAriaLabel}
                >
                  <ChevronLeft size={15} strokeWidth={2} />
                </button>
                {drawerBlock}
                <button
                  type="button"
                  className={patroMobileStepBtn}
                  onClick={onNext}
                  disabled={nextDisabled}
                  aria-label={nextAriaLabel}
                >
                  <ChevronRight size={15} strokeWidth={2} />
                </button>
              </div>
            ) : (
              <div className={patroMonthNavShell}>
                <MonthNavControls {...navProps} />
              </div>
            )}
            {panchangaSubtitle ? (
              <p className="m-0 text-sm text-base leading-none">{panchangaSubtitle}</p>
            ) : null}
          </div>
          {mobileToolbarLower ? (
            <div className="col-start-2 row-start-2 flex shrink-0 items-end justify-end self-start">
              {mobileToolbarLower}
            </div>
          ) : null}
        </div>

        {/* Desktop (md+): title, then nav row — same as before mobile drawer work */}
        <div className="hidden min-w-0 flex-col gap-0.5 sm:gap-1 md:flex">
          {titleBlock}
          {useCalendarPicker ? (
            <div className={patroMonthNavShell}>{calendarControl(patroMonthRangeCompactBtn)}</div>
          ) : (
            <div className={patroMonthNavShell}>
              <MonthNavControls {...navProps} />
            </div>
          )}
          {panchangaSubtitle ? (
            <p className="m-0 text-sm text-base leading-none">{panchangaSubtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
