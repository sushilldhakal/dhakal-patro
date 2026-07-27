import { useTranslation } from "react-i18next";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { BsHeadline } from "@/components/BsHeadline";
import { BsNativeSelect } from "@/components/BsNativeSelect";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarEra } from "@/hooks/use-calendar-era";
import { useLocale } from "@/i18n/locale";
import { adToBS, bsToAD, getBSMonthLength } from "@/lib/bs-calendar";
import { getBsYearSpanLabel } from "@/lib/local-calendar";
import {
  PATRO_AD_YEAR_OPTIONS,
  PATRO_BS_YEAR_OPTIONS,
  clampAdYear,
  clampBsYear,
} from "@/lib/patro-date-options";
import { resolveSamvatsaraForBsYear } from "@/lib/samvatsara";
import { samvatsaraName } from "@/lib/samvatsara-i18n";
import {
  patroMonthChipDay,
  patroMonthChipHead,
  patroMonthChipShell,
  patroMonthNavBtn,
  patroMonthNavShell,
} from "@/lib/patro-classes";
import { cn } from "@/lib/utils";

export type PatroYearNavProps = {
  /** Browse year in the active {@link calendarMode} (BS or AD). */
  year: number;
  onYearChange: (year: number) => void;
  currentYear: number;
  calendarMode?: CalendarEra;
  yearOptions?: number[];
  location?: PanchangaLocation;
  onLocationChange?: (location: PanchangaLocation) => void;
  className?: string;
};

/**
 * Year-only navigation — graha yearly pages (asta, vakri), holidays, suryakranti.
 * {@link calendarMode} drives API boundaries: BS Baisakh–Chaitra vs AD Jan–Dec.
 */
export function PatroYearNav({
  year,
  onYearChange,
  currentYear,
  calendarMode = "bs",
  yearOptions,
  location,
  onLocationChange,
  className,
}: PatroYearNavProps) {
  const { t } = useTranslation();
  const { digits, lang } = useLocale();
  const isAd = calendarMode === "ad";
  const options =
    yearOptions ?? (isAd ? PATRO_AD_YEAR_OPTIONS : PATRO_BS_YEAR_OPTIONS);
  const minYear = options[0]!;
  const maxYear = options[options.length - 1]!;
  const clampYear = (y: number) => (isAd ? clampAdYear(y, options) : clampBsYear(y, options));

  const chipEra = isAd ? t("patro_date.era_ad") : t("patro_date.era_bs");
  const chipYear = year;

  const bsYearForLabels = isAd ? adToBS(new Date(year, 6, 15)).year : year;
  const samvatsara = resolveSamvatsaraForBsYear(bsYearForLabels);
  const samvatsaraLabel = samvatsara ? samvatsaraName(samvatsara, lang) : undefined;

  const adLocale = lang === "en" ? "en-US" : "ne-NP";
  const adYearRange = isAd
    ? (() => {
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31);
        const startLabel = start.toLocaleDateString(adLocale, { month: "short", year: "numeric" });
        const endLabel = end.toLocaleDateString(adLocale, { month: "short", year: "numeric" });
        return `${startLabel} – ${endLabel}`;
      })()
    : (() => {
        const start = bsToAD(year, 1, 1);
        const end = bsToAD(year, 12, getBSMonthLength(year, 12));
        const startLabel = start.toLocaleDateString(adLocale, { month: "short", year: "numeric" });
        const endLabel = end.toLocaleDateString(adLocale, { month: "short", year: "numeric" });
        return `${startLabel} – ${endLabel}`;
      })();

  const bsYearSpanLabel = getBsYearSpanLabel(bsYearForLabels, lang, digits);

  const showLocation = Boolean(location && onLocationChange);

  const locationDesktop = showLocation ? (
    <LocationSelector
      compact
      location={location!}
      onLocationChange={onLocationChange!}
      className="h-8 min-w-0 w-auto max-w-[12.5rem]"
    />
  ) : null;

  const locationMobile = showLocation ? (
    <LocationSelector
      compact
      location={location!}
      onLocationChange={onLocationChange!}
      className="h-[30px] min-w-0 w-auto max-w-[9rem] shrink-0 px-2"
    />
  ) : null;

  const yearSelectOptions = options.map((y) => ({
    value: y,
    label: digits(y),
  }));

  const titleBlock = (sizeClass: string) => (
    <BsHeadline
      className={sizeClass}
      bs={
        isAd ? (
          <>
            <span className="font-num font-semibold text-secondary dark:text-secondary">
              {digits(year)}
            </span>{" "}
            <span>AD</span>
          </>
        ) : lang === "en" ? (
          <span className="font-num font-semibold text-secondary dark:text-secondary">
            {bsYearSpanLabel}
          </span>
        ) : (
          <>
            <span className="font-num font-semibold text-secondary dark:text-secondary">
              {digits(year)}
            </span>{" "}
            <span>{t("patro_date.era_bs")}</span>
          </>
        )
      }
      bsClassName="min-w-0"
      samvatsara={isAd || lang === "en" ? undefined : samvatsaraLabel}
      samvatsaraClassName={cn(
        "text-sm",
        sizeClass.includes("text-xl") && "hidden sm:inline sm:text-xl",
      )}
      gregorian={isAd ? bsYearSpanLabel : lang === "en" ? undefined : adYearRange}
      gregorianClassName="text-xs font-semibold text-muted-foreground"
    />
  );

  const navRow = (
    <div className="flex flex-wrap items-center gap-2">
      <div className={patroMonthNavShell}>
        <button
          type="button"
          className={patroMonthNavBtn}
          aria-label={t("patro_date.prev_year")}
          onClick={() => onYearChange(clampYear(year - 1))}
          disabled={year <= minYear}
        >
          <ChevronLeft size={14} strokeWidth={2} />
        </button>
        <BsNativeSelect
          className="w-[5.5rem] sm:w-[6.5rem]"
          value={year}
          options={yearSelectOptions}
          ariaLabel={t("calendar.year_aria")}
          onChange={onYearChange}
        />
        <button
          type="button"
          className={patroMonthNavBtn}
          aria-label={t("patro_date.next_year")}
          onClick={() => onYearChange(clampYear(year + 1))}
          disabled={year >= maxYear}
        >
          <ChevronRight size={14} strokeWidth={2} />
        </button>
      </div>
      {year !== currentYear && options.includes(currentYear) ? (
        <button
          type="button"
          onClick={() => onYearChange(currentYear)}
          className="shrink-0 rounded-full border border-border bg-card px-3 py-1 text-sm font-semibold text-foreground"
        >
          {t("patro_date.this_year")}
        </button>
      ) : null}
    </div>
  );

  const yearChip = (
    <div className={cn(patroMonthChipShell, "w-[2.85rem] sm:w-[3.75rem]")} aria-hidden>
      <div className={patroMonthChipHead}>{chipEra}</div>
      <div className={cn(patroMonthChipDay, "font-num px-0.5 text-[11px] sm:text-sm")}>
        {digits(chipYear)}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "w-full flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-3",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start gap-1.5 sm:gap-3">
          {yearChip}

          <div className="@container/month-head min-w-0 flex-1">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-0.5 md:hidden">
              <div className="col-start-1 row-start-1 min-w-0">{titleBlock("text-sm")}</div>
              {locationMobile ? (
                <div className="col-start-2 row-start-1 flex shrink-0 items-start justify-end self-start">
                  {locationMobile}
                </div>
              ) : null}
              <div className="col-start-1 row-start-2 -mt-1 min-w-0">{navRow}</div>
            </div>

            <div className="hidden min-w-0 flex-col gap-0.5 sm:gap-1 md:flex">
              {titleBlock("text-xl text-base")}
              {navRow}
            </div>
          </div>
        </div>
      </div>
      {locationDesktop ? (
        <div className="hidden shrink-0 md:flex md:w-auto md:flex-col md:items-end md:pt-0.5">
          {locationDesktop}
        </div>
      ) : null}
    </div>
  );
}
