import { useTranslation } from "react-i18next";
import { BsMonthHeaderTitle } from "@/components/BsMonthHeaderTitle";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { useLocale } from "@/i18n/locale";
import {
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  getBSMonthLength,
} from "@/lib/bs-calendar";
import { cn } from "@/lib/utils";

const BS_YEAR_OPTIONS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i,
);

interface Props {
  /** "month" → year+month picker; "day" → year+month+day calendar picker. */
  mode: "month" | "day";
  year: number;
  month: number;
  day?: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onSelectDate: (year: number, month: number, day: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  todayAd?: string;
  location: PanchangaLocation;
  onLocationChange: (location: PanchangaLocation) => void;
  subtitle?: string;
}

/**
 * The home-calendar header (month/year stepper + calendar date picker) with a
 * location selector on the right — reused across the standalone element pages so
 * every view is browsable by year, month (and day) and location.
 */
export function PanchangaBrowseHeader({
  mode,
  year,
  month,
  day,
  onMonthChange,
  onYearChange,
  onSelectDate,
  onPrev,
  onNext,
  onToday,
  todayAd,
  location,
  onLocationChange,
  subtitle,
}: Props) {
  const { t } = useTranslation();
  const { digits } = useLocale();
  const isDay = mode === "day";

  const dayOptions = isDay
    ? Array.from({ length: getBSMonthLength(year, month) }, (_, i) => ({
        value: i + 1,
        label: digits(i + 1),
      }))
    : undefined;

  const locationDesktop = (
    <LocationSelector
      compact
      location={location}
      onLocationChange={onLocationChange}
      className="h-8 min-w-0 w-auto max-w-[12.5rem]"
    />
  );
  const locationMobile = (
    <LocationSelector
      compact
      location={location}
      onLocationChange={onLocationChange}
      className="h-[30px] min-w-0 w-auto max-w-[9rem] shrink-0 px-2"
    />
  );

  return (
    <div
      className={cn(
        // Full width of the (already padded) page column — no extra mobile rail
        // inset, so the header lines up with the home page header padding.
        "w-full",
        "flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-3",
      )}
    >
      <div className="min-w-0 flex-1">
        <BsMonthHeaderTitle
          year={year}
          month={month}
          day={isDay ? day : undefined}
          dayOptions={dayOptions}
          onDayChange={isDay ? (d) => onSelectDate(year, month, d) : undefined}
          dayAriaLabel={isDay ? t("calendar.day_aria") : undefined}
          onSelectDate={onSelectDate}
          yearOptions={BS_YEAR_OPTIONS}
          todayAd={todayAd}
          onToday={onToday}
          todayAriaLabel={t("calendar.today_btn")}
          onMonthChange={onMonthChange}
          onYearChange={onYearChange}
          monthAriaLabel={t("calendar.month_aria")}
          yearAriaLabel={t("calendar.year_aria")}
          onPrev={onPrev}
          onNext={onNext}
          prevDisabled={month === 1 && year <= BS_SUPPORTED_START_YEAR && !isDay}
          nextDisabled={month === 12 && year >= BS_SUPPORTED_END_YEAR && !isDay}
          prevAriaLabel={isDay ? t("calendar.prev_day") : t("calendar.prev_month")}
          nextAriaLabel={isDay ? t("calendar.next_day") : t("calendar.next_month")}
          panchangaSubtitle={subtitle}
          mobileDateTimeDrawer
          mobileToolbar={locationMobile}
        />
      </div>

      <div className="hidden shrink-0 md:flex md:w-auto md:flex-col md:items-end md:pt-0.5">
        {locationDesktop}
      </div>
    </div>
  );
}
