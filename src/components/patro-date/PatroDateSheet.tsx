import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CalendarClock, ChevronDown, MapPin, Minus, Plus } from "lucide-react";
import { BsNativeSelect, type BsNativeSelectOption } from "@/components/BsNativeSelect";
import { LocationSearchPanel } from "@/components/panchanga/LocationSearchPanel";
import {
  displayLocationLabel,
  type PanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useLocale } from "@/i18n/locale";
import { patroMobilePickerBtn, patroMonthNavBtn } from "@/lib/patro-classes";
import { cn } from "@/lib/utils";
import type { PatroDateSheetState } from "./use-patro-date-sheet";

/** Month picker for the sheet: 12 buttons, three to a row, no dropdown. */
export function MonthGridPicker({
  month,
  options,
  onMonthChange,
}: {
  month: number;
  options: BsNativeSelectOption[];
  onMonthChange: (month: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2" role="group">
      {options.map((option) => {
        const selected = option.value === month;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onMonthChange(option.value)}
            className={cn(
              "min-w-0 truncate rounded-lg border px-2 py-2.5 text-sm font-semibold transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-surface-hover",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Year row for the sheet: the select flanked by step-by-one buttons. */
export function YearStepper({
  year,
  options,
  ariaLabel,
  onYearChange,
}: {
  year: number;
  options: BsNativeSelectOption[];
  ariaLabel: string;
  onYearChange: (year: number) => void;
}) {
  const values = options.map((o) => o.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        className={patroMonthNavBtn}
        onClick={() => onYearChange(year - 1)}
        disabled={year <= min}
        aria-label={`${ariaLabel} −1`}
      >
        <Minus size={16} strokeWidth={2.25} />
      </button>
      <BsNativeSelect
        className="w-[6.5rem]"
        value={year}
        options={options}
        ariaLabel={ariaLabel}
        onChange={onYearChange}
        comfortable
      />
      <button
        type="button"
        className={patroMonthNavBtn}
        onClick={() => onYearChange(year + 1)}
        disabled={year >= max}
        aria-label={`${ariaLabel} +1`}
      >
        <Plus size={16} strokeWidth={2.25} />
      </button>
    </div>
  );
}

/** Chip that opens the sheet on its Location tab — the phone location control. */
export function PatroLocationChip({
  location,
  onOpen,
  className,
}: {
  location: PanchangaLocation;
  onOpen: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const { lang } = useLocale();
  return (
    <button
      type="button"
      className={cn(patroMobilePickerBtn, "max-w-[10rem]", className)}
      onClick={onOpen}
      aria-label={t("location.choose_location")}
    >
      <MapPin className="size-3.5 shrink-0 text-secondary" strokeWidth={2} />
      <span className="min-w-0 truncate">
        {displayLocationLabel(location, undefined, lang).split(",")[0]?.trim()}
      </span>
    </button>
  );
}

/** Chip that opens the sheet on its date tab. */
export function PatroDateChip({
  label,
  labelCompact,
  ariaLabel,
  onOpen,
}: {
  label: string;
  labelCompact: string;
  ariaLabel: string;
  onOpen: () => void;
}) {
  return (
    <button type="button" className={patroMobilePickerBtn} onClick={onOpen} aria-label={ariaLabel}>
      <CalendarClock
        className="hidden size-3.5 shrink-0 text-secondary sm:block"
        strokeWidth={2}
      />
      <span className="min-w-0 truncate font-num sm:hidden">{labelCompact}</span>
      <span className="hidden min-w-0 truncate font-num sm:inline">{label}</span>
      <ChevronDown className="size-3.5 shrink-0 opacity-50" strokeWidth={2} />
    </button>
  );
}

/**
 * The phone sheet itself. Opened by either chip; `children` is whatever date
 * controls that nav offers, so a year-only nav shows just a year stepper while
 * the month nav shows the month grid too.
 */
export function PatroDateSheet({
  sheet,
  dateTitle,
  location,
  onLocationChange,
  children,
}: {
  sheet: PatroDateSheetState;
  dateTitle: string;
  location?: PanchangaLocation;
  onLocationChange?: (location: PanchangaLocation) => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const hasLocation = Boolean(location && onLocationChange);
  const onLocationTab = hasLocation && sheet.tab === "location";

  return (
    <Drawer open={sheet.open} onOpenChange={sheet.setOpen}>
      <DrawerContent>
        <DrawerHeader className="pb-2 text-center">
          <DrawerTitle className="text-base text-center">
            {onLocationTab ? t("location.choose_location") : dateTitle}
          </DrawerTitle>
        </DrawerHeader>

        {hasLocation ? (
          // Half each, and tall — the location tab is the only way into the
          // picker on a phone, so it has to be obvious rather than discovered.
          <div className="grid grid-cols-2 gap-2 px-4 pb-3" role="tablist">
            {(["date", "location"] as const).map((id) => {
              const selected = sheet.tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`patro-sheet-${id}`}
                  onClick={() => sheet.setTab(id)}
                  className={cn(
                    "h-12 rounded-xl border text-sm font-bold transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-surface-hover",
                  )}
                >
                  {id === "date" ? dateTitle : t("location.tab")}
                </button>
              );
            })}
          </div>
        ) : null}

        {onLocationTab ? (
          <div id="patro-sheet-location" role="tabpanel" className="px-4 pb-2">
            <LocationSearchPanel
              location={location!}
              onLocationChange={onLocationChange!}
              active={sheet.open}
            />
          </div>
        ) : (
          <div id="patro-sheet-date" role="tabpanel" className="flex flex-col gap-4 px-4 pb-2">
            {children}
          </div>
        )}

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
  );
}
