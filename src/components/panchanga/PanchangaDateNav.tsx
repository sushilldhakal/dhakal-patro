import {
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  adToBS,
  bsToAD,
  getBSMonthLength,
} from "@/lib/bs-calendar";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/i18n/locale";
import { BsMonthHeaderTitle } from "@/components/BsMonthHeaderTitle";
import { cn } from "@/lib/utils";

const BS_YEARS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i,
);

function pickBsDate(
  onDateChange: (d: Date) => void,
  year: number,
  month: number,
  day: number,
) {
  const safeDay = Math.min(day, getBSMonthLength(year, month));
  onDateChange(bsToAD(year, month, safeDay));
}

interface Props {
  date: Date;
  onDateChange: (d: Date) => void;
  todayAd?: string;
  clock?: string;
  onClockChange?: (clock: string) => void;
  /** Toolbar on the chart column — mode toggle, location, etc. */
  toolbar?: React.ReactNode;
  className?: string;
}

export function PanchangaDateNav({
  date,
  onDateChange,
  todayAd,
  clock,
  onClockChange,
  toolbar,
  className,
}: Props) {
  const { t } = useTranslation();
  const { digits } = useLocale();
  const bs = adToBS(date);
  const monthLen = getBSMonthLength(bs.year, bs.month);

  const stepDay = (delta: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + delta);
    onDateChange(next);
  };

  const atMinDay =
    bs.year === BS_SUPPORTED_START_YEAR && bs.month === 1 && bs.day === 1;
  const atMaxDay =
    bs.year === BS_SUPPORTED_END_YEAR &&
    bs.month === 12 &&
    bs.day === getBSMonthLength(bs.year, bs.month);

  const dayOptions = Array.from({ length: monthLen }, (_, i) => ({
    value: i + 1,
    label: digits(i + 1),
  }));

  return (
    <div
      className={cn(
        "flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-3",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <BsMonthHeaderTitle
          year={bs.year}
          month={bs.month}
          day={bs.day}
          dayOptions={dayOptions}
          onDayChange={(nextDay) => pickBsDate(onDateChange, bs.year, bs.month, nextDay)}
          dayAriaLabel={t("calendar.day_aria")}
          yearOptions={BS_YEARS}
          todayAd={todayAd}
          onToday={() => onDateChange(todayAd ? new Date(`${todayAd}T12:00:00`) : new Date())}
          todayAriaLabel={t("calendar.today_btn")}
          onMonthChange={(nextMonth) => pickBsDate(onDateChange, bs.year, nextMonth, bs.day)}
          onYearChange={(nextYear) => pickBsDate(onDateChange, nextYear, bs.month, bs.day)}
          monthAriaLabel={t("calendar.month_aria")}
          yearAriaLabel={t("calendar.year_aria")}
          onPrev={() => stepDay(-1)}
          onNext={() => stepDay(1)}
          prevDisabled={atMinDay}
          nextDisabled={atMaxDay}
          prevAriaLabel={t("calendar.prev_day")}
          nextAriaLabel={t("calendar.next_day")}
          clock={clock}
          onClockChange={onClockChange}
          hourAriaLabel={t("panchanga.hour_aria")}
          minuteAriaLabel={t("panchanga.minute_aria")}
          mobileDateTimeDrawer={Boolean(clock && onClockChange)}
        />
      </div>
      {toolbar ? (
        <div className="flex w-full shrink-0 flex-col gap-2 md:w-auto md:items-end md:pt-0.5">
          {toolbar}
        </div>
      ) : null}
    </div>
  );
}
