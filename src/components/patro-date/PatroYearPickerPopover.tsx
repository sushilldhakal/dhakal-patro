import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Era, Language } from "@/lib/era";
import { cn } from "@/lib/utils";
import { usePatroDisplayLocale } from "@/hooks/use-patro-display-locale";
import { lazyBrowseYearListItems } from "@/lib/patro-browse-year-items";
import { buildPatroBrowseYearOptions } from "@/lib/patro-date-options";
import { formatBrowsePatroYearPicker, isValidBrowseYear } from "@/lib/patro-year-axis";
import { parsePatroYearSearchQuery } from "@/lib/patro-year-search-query";
import { PatroYearEraToggle } from "./PatroYearEraToggle";

export type PatroYearPickerPopoverProps = {
  era: Era;
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  className?: string;
  comfortable?: boolean;
  displayLanguage?: Language;
  /** When set, era toggles inside the panel are draft-only until a year is chosen. */
  onBrowseCommit?: (era: Era, year: number) => void;
  /** BS↔BBS / AD↔BC — toggles inside the panel (immediate commit). */
  onEraChange?: (era: Era) => void;
};

export function PatroYearPickerPopover({
  era,
  value,
  onChange,
  ariaLabel,
  className,
  comfortable = false,
  displayLanguage,
  onBrowseCommit,
  onEraChange,
}: PatroYearPickerPopoverProps) {
  const { t } = useTranslation();
  const { digits } = usePatroDisplayLocale(displayLanguage);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [draftEra, setDraftEra] = useState(era);

  useEffect(() => {
    if (open) setDraftEra(era);
  }, [open, era]);

  const pickerEra = onBrowseCommit ? draftEra : era;
  const draftYearRange = useMemo(
    () => buildPatroBrowseYearOptions(pickerEra),
    [pickerEra],
  );

  const triggerLabel = formatBrowsePatroYearPicker(value, digits);

  const listItems = useMemo(
    () => lazyBrowseYearListItems(draftYearRange, query, value, pickerEra, digits),
    [draftYearRange, query, value, pickerEra, digits],
  );

  /**
   * Centre the browsed year when the panel opens: the window straddles it, so
   * without this the list lands on the oldest year 50 rows above it.
   */
  const centerSelectedRow = useCallback((node: HTMLButtonElement | null) => {
    if (!node) return;
    const list = node.closest<HTMLElement>("[data-year-list]");
    if (!list) return;
    list.scrollTop = Math.max(
      0,
      node.offsetTop - list.clientHeight / 2 + node.offsetHeight / 2,
    );
  }, []);

  const pickYear = (y: number) => {
    if (!isValidBrowseYear(pickerEra, y)) return;
    if (onBrowseCommit) {
      onBrowseCommit(pickerEra, y);
    } else {
      onChange(y);
    }
    setOpen(false);
    setQuery("");
  };

  const commitSearch = () => {
    const { n } = parsePatroYearSearchQuery(query, pickerEra);
    if (n != null && n >= 1 && isValidBrowseYear(pickerEra, n)) {
      pickYear(n);
    }
  };

  return (
    <Popover
      modal
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          data-vaul-no-drag
          aria-label={ariaLabel}
          className={cn(
            "inline-flex min-w-0 shrink-0 cursor-pointer items-center justify-between gap-0.5 rounded-md border border-border bg-card font-num text-foreground",
            comfortable
              ? "h-9 gap-1 px-2 text-sm"
              : "h-6 gap-0.5 px-1 text-sm sm:h-7 sm:gap-1 sm:px-1.5 sm:text-xs",
            className,
          )}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown className="size-3 shrink-0 opacity-45" strokeWidth={2.25} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        collisionPadding={{ top: 8, bottom: 88, left: 8, right: 8 }}
        data-vaul-no-drag
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="z-[120] w-[min(calc(100vw-2rem),14rem)] gap-0 p-0"
      >
        {onBrowseCommit ? (
          <PatroYearEraToggle
            era={pickerEra}
            onEraChange={setDraftEra}
            variant="dropdown"
          />
        ) : onEraChange ? (
          <PatroYearEraToggle era={era} onEraChange={onEraChange} variant="dropdown" />
        ) : null}
        <div className="border-b border-border px-2 py-1.5">
          <input
            type="text"
            inputMode="numeric"
            data-vaul-no-drag
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitSearch();
              }
            }}
            placeholder={t("patro_date.year_search_placeholder")}
            enterKeyHint="search"
            className="patro-native-select h-9 w-full rounded-md border border-input/30 bg-input/30 px-2 text-base font-num outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>
        <ul
          data-year-list
          className="max-h-60 min-h-32 overflow-y-auto overscroll-contain p-1 font-num"
          role="listbox"
          aria-label={ariaLabel}
        >
          {listItems.length === 0 ? (
            <li className="px-2 py-2 text-center text-xs text-muted-foreground">
              {t("patro_date.year_search_empty")}
            </li>
          ) : (
            listItems.map((item) => {
              const selected = item.value === value && pickerEra === era;
              return (
                <li key={item.value} role="presentation">
                  <button
                    ref={selected ? centerSelectedRow : undefined}
                    type="button"
                    role="option"
                    data-vaul-no-drag
                    aria-selected={selected}
                    className={cn(
                      "flex w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                      selected
                        ? "bg-secondary text-secondary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground",
                    )}
                    onClick={() => pickYear(item.value)}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
