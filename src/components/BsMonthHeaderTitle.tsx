import { ChevronLeft, ChevronRight } from "lucide-react";
import { BS_MONTH_NAMES, BS_MONTHS_NE, adToBS, bsMonthLabel } from "@/lib/bs-calendar";
import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import { getBsMonthAdSpanCompact } from "@/lib/local-calendar";
import { BsNativeSelect } from "@/components/BsNativeSelect";
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
}: Props) {
  const { lang, pick, digits } = useLocale();

  const todayBs = adToBS(
    todayAd ? new Date(`${todayAd}T12:00:00`) : new Date(),
  );

  const monthTitle = pick(BS_MONTHS_NE[month - 1], BS_MONTH_NAMES[month - 1]);
  const adMonthCompact = getBsMonthAdSpanCompact(year, month);
  const monthOptions = BS_MONTH_NAMES.map((_: string, i: number) => ({
    value: i + 1,
    label: bsMonthLabel(i + 1, lang),
  }));
  const yearSelectOptions = yearOptions.map((y) => ({
    value: y,
    label: digits(y),
  }));

  return (
    <div className="flex min-w-0 items-center gap-3">
      <button
        type="button"
        className={cn(patroMonthChipShell, patroMonthChipButton)}
        onClick={onToday}
        aria-label={todayAriaLabel}
        title={todayAriaLabel}
      >
        <div className={patroMonthChipHead}>{chipMonthLabel(todayBs.month, lang)}</div>
        <div className={patroMonthChipDay}>{digits(todayBs.day)}</div>
      </button>

      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="m-0 text-[1.375rem] font-bold leading-none tracking-tight sm:text-[1.625rem] lg:text-[1.875rem]">
          {monthTitle}{" "}
          <span className="font-num font-semibold text-secondary dark:text-secondary">{digits(year)}</span>
          <span className="ml-1.5 text-[11px] font-medium lowercase text-muted-foreground sm:text-xs">
            {adMonthCompact}
          </span>
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
