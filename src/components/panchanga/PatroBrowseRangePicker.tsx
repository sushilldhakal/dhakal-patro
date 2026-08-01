import { useMemo } from "react";

import { BsNativeSelect } from "@/components/BsNativeSelect";
import {
  AD_MONTH_NAMES,
  AD_MONTHS_SHORT,
  BS_MONTH_NAMES,
  BS_MONTHS_SHORT,
  adMonthLabel,
  bsMonthLabel,
  isGregorianEraBrowse,
} from "@/components/patro-date/patro-month-labels";
import { PatroYearPickerPopover } from "@/components/patro-date/PatroYearPickerPopover";
import { bilingualText, useLocale } from "@/i18n/locale";
import type { Era, Language } from "@/lib/era";
import {
  clampBrowseMonth,
  clampBrowseYear,
  normalizePatroBrowseRange,
  type PatroBrowseRange,
} from "@/lib/patro-browse-range";
import { cn } from "@/lib/utils";

export type PatroBrowseRangePickerProps = {
  range: PatroBrowseRange;
  onApply: (next: PatroBrowseRange) => void;
  onEraChange?: (era: Era) => void;
  className?: string;
  /** Roomier controls (drawer-style). */
  comfortable?: boolean;
};

const monthW = "w-[3.75rem] sm:w-[5.25rem]";
const yearW = "w-[4.5rem] sm:w-[5.25rem]";

export function PatroBrowseRangePicker({
  range,
  onApply,
  onEraChange,
  className,
  comfortable = false,
}: PatroBrowseRangePickerProps) {
  const { lang } = useLocale();
  const displayLanguage = lang as Language;
  const normalized = normalizePatroBrowseRange(range);
  const isGregorian = isGregorianEraBrowse(normalized.era);

  const monthOptions = useMemo(() => {
    return (isGregorian ? AD_MONTH_NAMES : BS_MONTH_NAMES).map((_, i) => {
      const m = i + 1;
      return {
        value: m,
        label: isGregorian ? adMonthLabel(m, lang) : bsMonthLabel(m, lang),
        shortLabel:
          lang === "en"
            ? (isGregorian ? AD_MONTHS_SHORT[i] : BS_MONTHS_SHORT[i])
            : undefined,
      };
    });
  }, [isGregorian, lang]);

  const endMonthOptions = useMemo(
    () =>
      monthOptions.filter(
        (o) =>
          normalized.endYear > normalized.startYear || o.value >= normalized.startMonth,
      ),
    [monthOptions, normalized.endYear, normalized.startYear, normalized.startMonth],
  );

  function commit(next: PatroBrowseRange) {
    const a = normalized;
    const b = normalizePatroBrowseRange(next);
    if (
      a.era !== b.era ||
      a.startYear !== b.startYear ||
      a.startMonth !== b.startMonth ||
      a.endYear !== b.endYear ||
      a.endMonth !== b.endMonth
    ) {
      onApply(b);
    }
  }

  function commitStartYear(era: Era, y: number) {
    onEraChange?.(era);
    const startYear = clampBrowseYear(era, y);
    const endYear = clampBrowseYear(era, normalized.endYear);
    commit({
      ...normalized,
      era,
      startYear,
      endYear: endYear < startYear ? startYear : endYear,
    });
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end",
        className,
      )}
      aria-label={bilingualText(lang, "मिति दायरा", "Date range")}
    >
      <div className="flex flex-wrap items-end gap-x-1.5 gap-y-1.5 sm:gap-x-1">
        <span className="w-full pb-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:w-auto sm:pb-2">
          {bilingualText(lang, "देखि", "From")}
        </span>
        <BsNativeSelect
          className={monthW}
          value={normalized.startMonth}
          options={monthOptions}
          ariaLabel={bilingualText(lang, "सुरु महिना", "Start month")}
          onChange={(m) =>
            commit({ ...normalized, startMonth: clampBrowseMonth(m) })
          }
          comfortable={comfortable}
        />
        <PatroYearPickerPopover
          className={yearW}
          era={normalized.era}
          value={normalized.startYear}
          displayLanguage={displayLanguage}
          comfortable={comfortable}
          ariaLabel={bilingualText(lang, "सुरु वर्ष", "Start year")}
          onChange={(y) => commitStartYear(normalized.era, y)}
          onBrowseCommit={commitStartYear}
        />
      </div>

      <div className="flex flex-wrap items-end gap-x-1.5 gap-y-1.5 sm:gap-x-1">
        <span className="w-full pb-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:w-auto sm:pb-2">
          {bilingualText(lang, "सम्म", "To")}
        </span>
        <BsNativeSelect
          className={monthW}
          value={normalized.endMonth}
          options={endMonthOptions}
          ariaLabel={bilingualText(lang, "अन्त्य महिना", "End month")}
          onChange={(m) =>
            commit({ ...normalized, endMonth: clampBrowseMonth(m) })
          }
          comfortable={comfortable}
        />
        <PatroYearPickerPopover
          className={yearW}
          era={normalized.era}
          value={normalized.endYear}
          displayLanguage={displayLanguage}
          comfortable={comfortable}
          ariaLabel={bilingualText(lang, "अन्त्य वर्ष", "End year")}
          onChange={(y) =>
            commit({
              ...normalized,
              endYear: clampBrowseYear(normalized.era, y),
            })
          }
        />
      </div>
    </div>
  );
}
