import { CalendarClock, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { BS_MONTH_NAMES, BS_MONTHS_NE, BS_MONTHS_SHORT, AD_MONTH_NAMES, AD_MONTHS_SHORT, AD_MONTHS_SHORT_NE, adMonthLabel, bsMonthLabel, bsToAD, getBSMonthLength } from "@/lib/bs-calendar";
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
import {
  MonthGridPicker,
  PatroDateChip,
  PatroDateSheet,
  PatroLocationChip,
  YearStepper,
} from "./PatroDateSheet";
import { usePatroDateSheet } from "./use-patro-date-sheet";
export type { PatroSheetTab } from "./use-patro-date-sheet";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  patroMonthChipButton,
  patroMonthChipDay,
  patroMonthChipHead,
  patroMonthChipSpan,
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
  /** Given both, the mobile sheet grows a Location tab beside the date one. */
  location?: PanchangaLocation;
  onLocationChange?: (location: PanchangaLocation) => void;
  /** Sheet state is lifted so the header's location chip can open it on the
   *  Location tab rather than opening a popup of its own. */
}

function chipMonthLabel(month: number, lang: string, calendarMode: "bs" | "ad" = "bs"): string {
  if (calendarMode === "ad") {
    return AD_MONTHS_SHORT[month - 1].toUpperCase();
  }
  if (lang === "en") {
    // Not a slice — that maps Ashadh and Ashwin onto the same "ASH".
    return BS_MONTHS_SHORT[month - 1].toUpperCase();
  }
  return BS_MONTHS_NE[month - 1];
}

/**
 * Day span for the month chip. Month views have no single day to show, and
 * printing "1" read as a date the user had not chosen — the month's own length
 * says "a month" without naming a day, and answers a question the dot grid it
 * replaced could not: BS months run 29–32 days, so १-३२ is real information.
 */
function monthChipSpan(
  year: number,
  month: number,
  isAdCalendar: boolean,
  digits: (value: number) => string,
): string {
  const length = isAdCalendar
    ? new Date(year, month, 0).getDate() // day 0 of the next month = last of this
    : getBSMonthLength(year, month);
  return `${digits(1)}-${digits(length)}`;
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
  // Below sm these were too narrow for their own contents — "Sep" and "2026"
  // both ellipsised. Wide enough for a three-letter month and a four-digit year
  // plus the chevron; there is spare room in the row at 360px.
  const monthW = spacious ? "w-[6.5rem]" : "w-[3.75rem] sm:w-[5.25rem]";
  const yearW = spacious ? "w-[5rem]" : "w-[4.25rem] sm:w-[4.5rem]";
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
  location,
  onLocationChange,
}: PatroDateNavCoreProps) {
  const sheet = usePatroDateSheet();
  const { lang, digits } = useLocale();
  const { t } = useTranslation();
  const isAdCalendar = calendarMode === "ad";

  const monthTitle = isAdCalendar
    ? adMonthLabel(month, lang)
    : bsMonthLabel(month, lang);
  /**
   * Phone heading: "SEP 2026" rather than "September 2026". Only the romanized
   * names run long — Devanagari is already compact, so Nepali keeps the full
   * name. The grid repeats the month beside day 1 either way.
   */
  const monthTitleShort =
    lang === "en"
      ? (isAdCalendar ? AD_MONTHS_SHORT[month - 1] : BS_MONTHS_SHORT[month - 1]).toUpperCase()
      : monthTitle;
  const samvatsara = isAdCalendar ? undefined : resolveSamvatsaraForBsYear(year);
  const samvatsaraLabel = samvatsara ? samvatsaraName(samvatsara, lang) : undefined;
  // Always day → month → year (e.g. "२५ जुलाई २०२६" / "25 Jul 2026"). Relying on
  // toLocaleDateString's own ordering put ne-NP as year-month-day, which reads
  // backwards; build the parts explicitly instead.
  // `ne-NP` has no abbreviated month forms in ICU — toLocaleDateString(…,
  // { month: "short" }) hands back the full "सेप्टेम्बर", which is what made the
  // Nepali header wide. Use our own short list so both languages abbreviate.
  const adMonthShort = (monthIndex: number) =>
    lang === "en" ? AD_MONTHS_SHORT[monthIndex] : AD_MONTHS_SHORT_NE[monthIndex];
  const adDayEnglish = (() => {
    if (day == null || isAdCalendar) return null;
    const d = bsToAD(year, month, day);
    const monthShort = adMonthShort(d.getMonth());
    const numLabel = (n: number) => (lang === "en" ? String(n) : digits(n));
    return `${numLabel(d.getDate())} ${monthShort} ${numLabel(d.getFullYear())}`;
  })();
  const adMonthRangeEnglish = (() => {
    if (day != null) return null;
    const start = bsToAD(year, month, 1);
    const end = bsToAD(year, month, getBSMonthLength(year, month));
    const startMonth = adMonthShort(start.getMonth());
    const endMonth = adMonthShort(end.getMonth());
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
  // The closed month control is the widest thing in the phone date sheet, so it
  // shows a three-letter form there; the option list keeps the full name.
  // English only — Devanagari month names already fit.
  const monthOptions = (isAdCalendar ? AD_MONTH_NAMES : BS_MONTH_NAMES).map((_: string, i: number) => ({
    value: i + 1,
    label: isAdCalendar ? adMonthLabel(i + 1, lang) : bsMonthLabel(i + 1, lang),
    shortLabel:
      lang === "en" ? (isAdCalendar ? AD_MONTHS_SHORT[i] : BS_MONTHS_SHORT[i]) : undefined,
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
  /** Picker chip: omit year when the title already shows it (panchanga day view). */
  const mobilePickerLabel =
    day != null
      ? clockSummary
        ? `${digits(day)} ${monthTitle} · ${clockSummary}`
        : `${digits(day)} ${monthTitle}`
      : `${monthTitle} ${digits(year)}`;
  /**
   * Below sm (<640px): day view drops the month token (title row shows it);
   * month view drops the year for the same reason. The chip always names the
   * month it is currently on — it is the control's value, not a caption.
   */
  const mobilePickerLabelCompact =
    day != null
      ? `${digits(day)}${clockSummary ? ` · ${clockSummary}` : ""}`
      : monthTitleShort;

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

  const calendarControl = (stepCls: string) => (
    <div className="flex min-w-0 items-center gap-1">
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
            <span className="min-w-0 font-num sm:hidden">{mobilePickerLabelCompact}</span>
            <span className="hidden min-w-0 font-num sm:inline">{mobilePickerLabel}</span>
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

  /**
   * The cross-calendar reference under the heading. `short` abbreviates the
   * romanized BS names ("Ash–Shr") for the phone header, where the full pair
   * plus a year is the widest thing in the top bar. The AD side is already
   * abbreviated in both languages, so it does not vary.
   */
  const buildSubtitleLine = (short: boolean) => {
    if (!isAdCalendar) return adDayEnglish ?? adMonthRangeEnglish;
    return day != null
      ? getAdDayBsLabel(year, month, day, lang, digits, short)
      : getAdMonthBsSpanLabel(year, month, lang, digits, short);
  };
  const subtitleLine = buildSubtitleLine(false);
  const subtitleLineShort = buildSubtitleLine(true);

  // Nepali BS date part of the heading. The संवत्सर name and Gregorian subtitle
  // are ordered by <BsHeadline>, which is the single source of truth for the
  // `<BS date> <संवत्सर> <Gregorian>` order shared across every page.
  const titlePartFor = (title: string) => (
    <>
      {title}{" "}
      <span className="font-num font-semibold text-secondary dark:text-secondary">{digits(year)}</span>
    </>
  );
  const bsTitlePart = titlePartFor(monthTitle);
  // Phone headings open on the year: the chip to their left already carries the
  // month name, so repeating it here only ate width in the narrowest row.
  const bsTitlePartShort = (
    <span className="font-num font-semibold text-secondary dark:text-secondary">{digits(year)}</span>
  );

  const mobileTitleBlock = (
    <BsHeadline
      className="text-sm"
      bs={bsTitlePartShort}
      bsClassName="min-w-0"
      samvatsara={samvatsaraLabel}
      samvatsaraClassName="text-sm"
      gregorian={subtitleLineShort}
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

  const dateTitle = showTime ? t("patro_date.date_time") : t("patro_date.month_year");

  // Every nav gets the same phone location control: a chip in the lower slot
  // that opens this sheet on its Location tab.
  const resolvedToolbarLower =
    mobileToolbarLower ??
    (location && onLocationChange ? (
      <PatroLocationChip location={location} onOpen={sheet.openLocation} />
    ) : null);

  const dateChip = mobileDateTimeDrawer ? (
    <PatroDateChip
        label={mobilePickerLabel}
        labelCompact={mobilePickerLabelCompact}
        ariaLabel={showTime ? t("patro_date.change_date_time") : t("patro_date.change_date")}
      onOpen={sheet.openDate}
    />
  ) : null;

  // Mounted whenever there is a sheet to open — day views drive dates from the
  // calendar popover, but their location chip still opens this.
  const sheetBlock =
    mobileDateTimeDrawer || resolvedToolbarLower ? (
      <PatroDateSheet
        sheet={sheet}
        dateTitle={dateTitle}
        location={location}
        onLocationChange={onLocationChange}
      >
        <MonthGridPicker month={month} options={monthOptions} onMonthChange={onMonthChange} />
        <YearStepper
          year={year}
          options={yearSelectOptions}
          ariaLabel={yearAriaLabel}
          onYearChange={onYearChange}
        />
        {dayOptions && onDayChange && dayAriaLabel ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">{dayAriaLabel}</span>
            <BsNativeSelect
              className="w-[5rem]"
              value={day ?? dayOptions[0]?.value ?? 1}
              options={dayOptions}
              ariaLabel={dayAriaLabel}
              onChange={onDayChange}
              comfortable
            />
          </div>
        ) : null}
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
      </PatroDateSheet>
    ) : null;

  return (
    <div className="flex min-w-0 items-start gap-1.5 sm:gap-3">
      {sheetBlock}
      <button
        type="button"
        className={cn(patroMonthChipShell, patroMonthChipButton)}
        onClick={onToday}
        aria-label={todayAriaLabel}
        title={todayAriaLabel}
      >
        <div className={patroMonthChipHead}>{chipMonthLabel(chipMonth, lang, calendarMode)}</div>
        {day != null ? (
          <div className={patroMonthChipDay}>{digits(chipDay)}</div>
        ) : (
          <div className={patroMonthChipSpan}>
            {monthChipSpan(year, chipMonth, isAdCalendar, digits)}
          </div>
        )}
      </button>

      <div className="@container/month-head min-w-0 flex-1">
        {/* Mobile only (<768px): row1 title|toolbar, row2 picker|toolbarLower */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-0.5 md:hidden">
          {/* self-center pairs with the fixed-height toolbar cell below: the
              chip is taller than the title, so centring puts the two on one
              line instead of leaving the difference as dead space above the
              date row. */}
          <div className="col-start-1 row-start-1 min-w-0 self-center">{mobileTitleBlock}</div>
          {mobileToolbar ? (
            // Every phone toolbar is pinned to the same 30px as the date,
            // location and step chips — each page passes its own control
            // (mode toggle, day cycle, paksha), and left to themselves they
            // came out 30/32/34px, so the top row never lined up.
            <div className="col-start-2 row-start-1 flex h-[30px] shrink-0 items-center justify-end self-start [&>*]:h-full">
              {mobileToolbar}
            </div>
          ) : null}
          <div className="col-start-1 row-start-2 flex min-w-0 flex-col gap-1">
            {mobileDateTimeDrawer ? (
              // Below md every nav opens the same sheet, day views included —
              // the calendar popover stays for md+ only. Prev/next arrows flank
              // it so the day can be stepped without opening the sheet.
              <div className="flex min-w-0 items-center gap-1 mt-[-7px]">
                <button
                  type="button"
                  className={patroMobileStepBtn}
                  onClick={onPrev}
                  disabled={prevDisabled}
                  aria-label={prevAriaLabel}
                >
                  <ChevronLeft size={15} strokeWidth={2} />
                </button>
                {dateChip}
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
            ) : useCalendarPicker ? (
              calendarControl(patroMobileStepBtn)
            ) : (
              <div className={patroMonthNavShell}>
                <MonthNavControls {...navProps} />
              </div>
            )}
            {panchangaSubtitle ? (
              <p className="m-0 text-sm text-base leading-none">{panchangaSubtitle}</p>
            ) : null}
          </div>
          {resolvedToolbarLower ? (
            <div className="col-start-2 row-start-2 flex shrink-0 items-end justify-end self-start">
              {resolvedToolbarLower}
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
