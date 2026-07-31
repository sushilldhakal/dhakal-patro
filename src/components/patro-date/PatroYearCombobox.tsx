import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { BsNativeSelectOption } from "@/components/BsNativeSelect";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import type { Era, Language } from "@/lib/era";
import { cn } from "@/lib/utils";
import { usePatroDisplayLocale } from "@/hooks/use-patro-display-locale";
import { formatBrowsePatroYearPicker } from "@/lib/patro-year-axis";
import {
  parsePatroYearSearchQuery,
  signedTargetsForYearSearch,
} from "@/lib/patro-year-search-query";
import { PatroYearEraToggle } from "./PatroYearEraToggle";

export type PatroYearComboboxProps = {
  era: Era;
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  className?: string;
  comfortable?: boolean;
  displayLanguage?: Language;
  /** Full year list (mobile sheet); omit for nearby-year freeform list. */
  options?: BsNativeSelectOption[];
  /** BS↔BBS / AD↔BC — shown at the top of the dropdown (not beside the trigger). */
  onEraChange?: (era: Era) => void;
};

type YearItem = BsNativeSelectOption;

function filterLegacyYearItems(
  items: YearItem[],
  query: string,
  currentYear: number,
): YearItem[] {
  const q = query.trim();
  if (!q) {
    const idx = items.findIndex((o) => o.value === currentYear);
    if (idx < 0) return items.slice(0, 201);
    const start = Math.max(0, idx - 100);
    const end = Math.min(items.length, idx + 101);
    return items.slice(start, end);
  }

  const { n, era } = parsePatroYearSearchQuery(q);
  if (n != null) {
    const byValue = new Map(items.map((o) => [o.value, o]));
    const out: YearItem[] = [];
    for (const signed of signedTargetsForYearSearch(n, era)) {
      if (signed === 0) continue;
      const hit = byValue.get(signed);
      if (hit) out.push(hit);
    }
    return out;
  }

  const needle = q.toLowerCase();
  return items.filter((o) => o.label.toLowerCase().includes(needle)).slice(0, 20);
}

function freeformYearItems(
  era: Era,
  value: number,
  query: string,
  digits: (n: number | string) => string,
): YearItem[] {
  const q = query.trim();
  const { n } = parsePatroYearSearchQuery(q, era);
  if (n != null) {
    return [{ value: n, label: formatBrowsePatroYearPicker(n, digits) }];
  }
  if (q) return [];

  const items: YearItem[] = [];
  for (let offset = -12; offset <= 12; offset++) {
    const y = value + offset;
    if (y >= 1) {
      items.push({ value: y, label: formatBrowsePatroYearPicker(y, digits) });
    }
  }
  return items;
}

export function PatroYearCombobox(props: PatroYearComboboxProps) {
  const { t } = useTranslation();
  const { digits } = usePatroDisplayLocale(props.displayLanguage);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const useOptionList = props.options != null;

  const selected = useMemo(() => {
    if (useOptionList && props.options) {
      return (
        props.options.find((o) => o.value === props.value) ?? {
          value: props.value,
          label: digits(props.value),
        }
      );
    }
    const label = formatBrowsePatroYearPicker(props.value, digits);
    return { value: props.value, label };
  }, [useOptionList, props, digits]);

  const listItems = useMemo(() => {
    if (useOptionList && props.options) {
      return filterLegacyYearItems(props.options, query, props.value);
    }
    return freeformYearItems(props.era, props.value, query, digits);
  }, [useOptionList, props, query, digits]);

  const triggerLabel = selected.shortLabel ?? selected.label;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  };

  const commitTypedYear = () => {
    const { n } = parsePatroYearSearchQuery(query, props.era);
    if (n != null && n >= 1) {
      props.onChange(n);
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <Combobox
      open={open}
      onOpenChange={handleOpenChange}
      items={listItems}
      filter={null}
      value={selected}
      onValueChange={(item) => {
        if (item) {
          props.onChange(item.value);
          setOpen(false);
          setQuery("");
        }
      }}
      inputValue={query}
      onInputValueChange={setQuery}
      itemToStringValue={(item) => item.label}
      isItemEqualToValue={(a, b) => a.value === b.value}
    >
      <ComboboxTrigger
        aria-label={props.ariaLabel}
        className={cn(
          "inline-flex min-w-0 shrink-0 items-center justify-between gap-0.5 rounded-md border border-border bg-card font-num text-foreground",
          props.comfortable
            ? "h-9 gap-1 px-2 text-sm"
            : "h-6 gap-0.5 px-1 text-sm sm:h-7 sm:gap-1 sm:px-1.5 sm:text-xs",
          props.className,
        )}
      >
        <span className="truncate">{triggerLabel}</span>
      </ComboboxTrigger>
      <ComboboxContent
        align="start"
        side="bottom"
        sideOffset={4}
        className="min-w-[10rem] w-[min(calc(100vw-2rem),14rem)]"
      >
        {props.onEraChange ? (
          <PatroYearEraToggle
            era={props.era}
            onEraChange={props.onEraChange}
            variant="dropdown"
          />
        ) : null}
        <ComboboxInput
          showTrigger={false}
          placeholder={t("patro_date.year_search_placeholder")}
          className="w-full font-num"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitTypedYear();
            }
          }}
        />
        <ComboboxEmpty className="py-2 text-xs">
          {t("patro_date.year_search_empty")}
        </ComboboxEmpty>
        <ComboboxList className="max-h-60 font-num">
          {(item) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
