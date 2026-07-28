import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { cn } from "@/lib/utils";
import {
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
} from "@/lib/bs-calendar";
import {
  PATRO_AD_YEAR_OPTIONS,
  PATRO_BS_YEAR_OPTIONS,
} from "@/lib/patro-date-options";
import { PatroDateNavCore } from "./PatroDateNavCore";

export type PatroMonthYearNavProps = {
  year: number;
  month: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  todayAd?: string;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  /** Gregorian month grid when English or AD era. */
  calendarMode?: "bs" | "ad";
  yearOptions?: number[];
  subtitle?: string;
  location?: PanchangaLocation;
  onLocationChange?: (location: PanchangaLocation) => void;
  mobileToolbar?: ReactNode;
  mobileToolbarLower?: ReactNode;
  desktopToolbar?: ReactNode;
  className?: string;
};

/**
 * Month + year date navigation — home calendar, dainik kranti, month-browse pages.
 * No day picker, no time picker.
 */
export function PatroMonthYearNav({
  year,
  month,
  onMonthChange,
  onYearChange,
  onPrev,
  onNext,
  onToday,
  todayAd,
  prevDisabled,
  nextDisabled,
  calendarMode = "bs",
  yearOptions,
  subtitle,
  location,
  onLocationChange,
  mobileToolbar,
  mobileToolbarLower,
  desktopToolbar,
  className,
}: PatroMonthYearNavProps) {
  const { t } = useTranslation();
  const isAd = calendarMode === "ad";
  const resolvedYearOptions =
    yearOptions ?? (isAd ? PATRO_AD_YEAR_OPTIONS : PATRO_BS_YEAR_OPTIONS);

  const defaultPrevDisabled =
    prevDisabled ??
    (isAd
      ? false
      : month === 1 && year <= BS_SUPPORTED_START_YEAR);
  const defaultNextDisabled =
    nextDisabled ??
    (isAd
      ? false
      : month === 12 && year >= BS_SUPPORTED_END_YEAR);

  const locationDesktop =
    desktopToolbar ??
    (location && onLocationChange ? (
      <LocationSelector
        compact
        location={location}
        onLocationChange={onLocationChange}
        className="h-8 min-w-0 w-auto max-w-[12.5rem]"
      />
    ) : null);

  // No LocationSelector fallback here: below md the location lives in the date
  // sheet's Location tab, and rendering the popup too would put two location
  // controls in the same header.
  const resolvedMobileToolbar = mobileToolbar;


  return (
    <div
      className={cn(
        "w-full flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-3",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <PatroDateNavCore
          calendarMode={calendarMode}
          year={year}
          month={month}
          yearOptions={resolvedYearOptions}
          todayAd={todayAd}
          onToday={onToday}
          todayAriaLabel={t("calendar.today_btn")}
          onMonthChange={onMonthChange}
          onYearChange={onYearChange}
          monthAriaLabel={t("calendar.month_aria")}
          yearAriaLabel={t("calendar.year_aria")}
          onPrev={onPrev}
          onNext={onNext}
          prevDisabled={defaultPrevDisabled}
          nextDisabled={defaultNextDisabled}
          prevAriaLabel={t("calendar.prev_month")}
          nextAriaLabel={t("calendar.next_month")}
          panchangaSubtitle={subtitle}
          mobileDateTimeDrawer
          mobileToolbar={resolvedMobileToolbar}
          mobileToolbarLower={mobileToolbarLower}
          location={location}
          onLocationChange={onLocationChange}
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
