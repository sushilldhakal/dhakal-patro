import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import type { CalendarEra } from "@/hooks/use-calendar-era";
import { useCalendarEra } from "@/hooks/use-calendar-era";
import { useLocale } from "@/i18n/locale";
import { adToBS } from "@/lib/bs-calendar";
import { cn } from "@/lib/utils";
import {
  PATRO_AD_YEAR_OPTIONS,
  PATRO_BS_YEAR_OPTIONS,
  buildAdDayOptions,
  buildBsDayOptions,
  isAtMaxAdDay,
  isAtMaxBsDay,
  isAtMinAdDay,
  isAtMinBsDay,
  pickAdDate,
  pickBsDate,
} from "@/lib/patro-date-options";
import { PatroDateNavCore } from "./PatroDateNavCore";

export type PatroDayTimeNavProps = {
  date: Date;
  onDateChange: (d: Date) => void;
  todayAd?: string;
  /** Gregorian day navigation when UI language is English. */
  calendarMode?: CalendarEra;
  /** When set, shows hour/minute pickers (panchanga at-time mode). */
  clock?: string;
  onClockChange?: (clock: string) => void;
  location?: PanchangaLocation;
  onLocationChange?: (location: PanchangaLocation) => void;
  toolbar?: ReactNode;
  mobileToolbar?: ReactNode;
  mobileToolbarLower?: ReactNode;
  className?: string;
};

/**
 * Day + month + year navigation, with optional time — panchanga day view and
 * day-browse pages (graha sthiti, element tables). Pass `clock` for time.
 */
export function PatroDayTimeNav({
  date,
  onDateChange,
  todayAd,
  calendarMode,
  clock,
  onClockChange,
  location,
  onLocationChange,
  toolbar,
  mobileToolbar,
  mobileToolbarLower,
  className,
}: PatroDayTimeNavProps) {
  const { t } = useTranslation();
  const { digits } = useLocale();
  const langEra = useCalendarEra();
  const mode = calendarMode ?? langEra;
  const isAd = mode === "ad";

  const bs = adToBS(date);
  const navYear = isAd ? date.getFullYear() : bs.year;
  const navMonth = isAd ? date.getMonth() + 1 : bs.month;
  const navDay = isAd ? date.getDate() : bs.day;
  const yearOptions = isAd ? PATRO_AD_YEAR_OPTIONS : PATRO_BS_YEAR_OPTIONS;
  const dayOptions = isAd
    ? buildAdDayOptions(navYear, navMonth, digits)
    : buildBsDayOptions(navYear, navMonth, digits);

  const pickDate = (y: number, m: number, d: number) =>
    isAd ? pickAdDate(onDateChange, y, m, d) : pickBsDate(onDateChange, y, m, d);

  const stepDay = (delta: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + delta);
    onDateChange(next);
  };

  const locationDesktop =
    toolbar ??
    (location && onLocationChange ? (
      <LocationSelector
        compact
        location={location}
        onLocationChange={onLocationChange}
        className="h-8 min-w-0 w-auto max-w-[12.5rem]"
      />
    ) : null);

  const resolvedMobileToolbar =
    mobileToolbar ??
    (location && onLocationChange ? (
      <LocationSelector
        compact
        location={location}
        onLocationChange={onLocationChange}
        className="h-[30px] min-w-0 w-auto max-w-[9rem] shrink-0 px-2"
      />
    ) : undefined);

  return (
    <div
      className={cn(
        "w-full flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-3",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <PatroDateNavCore
          calendarMode={mode}
          year={navYear}
          month={navMonth}
          day={navDay}
          dayOptions={dayOptions}
          onDayChange={(nextDay) => pickDate(navYear, navMonth, nextDay)}
          onSelectDate={(y, m, d) => pickDate(y, m, d)}
          dayAriaLabel={t("calendar.day_aria")}
          yearOptions={yearOptions}
          todayAd={todayAd}
          onToday={() =>
            onDateChange(todayAd ? new Date(`${todayAd}T12:00:00`) : new Date())
          }
          todayAriaLabel={t("calendar.today_btn")}
          onMonthChange={(nextMonth) => pickDate(navYear, nextMonth, navDay)}
          onYearChange={(nextYear) => pickDate(nextYear, navMonth, navDay)}
          monthAriaLabel={t("calendar.month_aria")}
          yearAriaLabel={t("calendar.year_aria")}
          onPrev={() => stepDay(-1)}
          onNext={() => stepDay(1)}
          prevDisabled={
            isAd
              ? isAtMinAdDay(navYear, navMonth, navDay)
              : isAtMinBsDay(navYear, navMonth, navDay)
          }
          nextDisabled={
            isAd
              ? isAtMaxAdDay(navYear, navMonth, navDay)
              : isAtMaxBsDay(navYear, navMonth, navDay)
          }
          prevAriaLabel={t("calendar.prev_day")}
          nextAriaLabel={t("calendar.next_day")}
          clock={clock}
          onClockChange={onClockChange}
          hourAriaLabel={clock ? t("panchanga.hour_aria") : undefined}
          minuteAriaLabel={clock ? t("panchanga.minute_aria") : undefined}
          mobileDateTimeDrawer
          mobileToolbar={resolvedMobileToolbar ?? toolbar}
          mobileToolbarLower={mobileToolbarLower}
        />
      </div>
      {locationDesktop ? (
        <div className="hidden shrink-0 md:flex md:w-auto md:flex-col md:items-end md:pt-0.5">
          {locationDesktop}
        </div>
      ) : null}
    </div>
  );
}
