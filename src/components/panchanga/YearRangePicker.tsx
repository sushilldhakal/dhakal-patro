import { useMemo, useState } from "react";
import { CalendarRange, ChevronDown } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { bilingualText, useLocale } from "@/i18n/locale";
import { patroSelect } from "@/lib/patro-classes";
import { cn } from "@/lib/utils";

/**
 * BS year selector for the year wheel — a single year by default, optionally a
 * range, committed as one unit.
 *
 * The two bare selects this replaced committed on every `change`, so picking a
 * start of 1700 while the end still read 2083 immediately widened the live range
 * to 384 years and set the page's prefetch chain fetching a year payload for
 * each of them — a range the user had not asked for and was mid-way through
 * typing. Here the draft lives inside the panel and `onApply` fires once, with
 * both bounds together, so no fetch happens until the range is actually set.
 */

type Mode = "single" | "range";

export type YearRangePickerProps = {
  /** The committed range currently driving the page. */
  start: number;
  end: number;
  minYear: number;
  maxYear: number;
  /** BS year "today" falls in — the reset target. */
  currentYear: number;
  /** Fires once per commit, with both bounds. */
  onApply: (start: number, end: number) => void;
};

/** Spans past this many years warn about their fetch cost before committing. */
const WIDE_SPAN = 10;

export function YearRangePicker({
  start,
  end,
  minYear,
  maxYear,
  currentYear,
  onApply,
}: YearRangePickerProps) {
  const { lang, digits } = useLocale();
  const [open, setOpen] = useState(false);
  // Bumped on every open and used as the draft's key. The panel outlives its
  // close by one exit animation, so without a fresh key a reopen reuses the old
  // draft instance and a cancelled edit comes back.
  const [openSeq, setOpenSeq] = useState(0);
  const span = end - start + 1;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setOpenSeq((seq) => seq + 1);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            patroSelect,
            "inline-flex items-center gap-1.5 tabular-nums",
            open && "ring-2 ring-ring",
          )}
          aria-label={bilingualText(lang, "वर्ष वा दायरा छान्नुहोस्", "Choose year or range")}
        >
          <CalendarRange className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
          <span className="font-semibold text-foreground">
            {span > 1 ? `${digits(start)} – ${digits(end)}` : digits(start)}
          </span>
          {span > 1 && (
            <span className="rounded bg-secondary/15 px-1 text-xs leading-tight text-base">
              {bilingualText(lang, `${digits(span)} वर्ष`, `${span} yrs`)}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[17.5rem] gap-3">
        {/* Keyed per open, so the draft always starts from the committed range. */}
        <RangeDraft
          key={openSeq}
          start={start}
          end={end}
          minYear={minYear}
          maxYear={maxYear}
          currentYear={currentYear}
          onCancel={() => setOpen(false)}
          onApply={(nextStart, nextEnd) => {
            setOpen(false);
            if (nextStart !== start || nextEnd !== end) onApply(nextStart, nextEnd);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function RangeDraft({
  start,
  end,
  minYear,
  maxYear,
  currentYear,
  onCancel,
  onApply,
}: {
  start: number;
  end: number;
  minYear: number;
  maxYear: number;
  currentYear: number;
  onCancel: () => void;
  onApply: (start: number, end: number) => void;
}) {
  const { lang, digits } = useLocale();
  const [mode, setMode] = useState<Mode>(end > start ? "range" : "single");
  const [draftStart, setDraftStart] = useState(start);
  const [draftEnd, setDraftEnd] = useState(end);

  const years = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i),
    [minYear, maxYear],
  );

  const effectiveEnd = mode === "range" ? Math.max(draftEnd, draftStart) : draftStart;
  const draftSpan = effectiveEnd - draftStart + 1;
  const unchanged = draftStart === start && effectiveEnd === end;

  function pickStart(next: number) {
    // Moving the start slides the window and keeps its width; widening only ever
    // happens by moving the end. Anchoring to the old end instead would turn a
    // 4-year draft into a 384-year one the moment someone picked 1700 with the
    // end still at 2083 — which is how the reported problem started.
    const width = Math.max(1, effectiveEnd - draftStart + 1);
    setDraftStart(next);
    setDraftEnd(Math.min(next + width - 1, maxYear));
  }

  function pickMode(next: Mode) {
    setMode(next);
    // Range mode opens as a one-year range for the user to widen, rather than
    // inheriting whatever end was last in the box.
    if (next === "range") setDraftEnd(draftStart);
  }

  return (
    <>
      <div
        role="group"
        aria-label={bilingualText(lang, "छनोट प्रकार", "Selection type")}
        className="inline-flex w-full rounded-lg border border-border bg-surface-inset p-0.5"
      >
        {(["single", "range"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => pickMode(m)}
            aria-pressed={mode === m}
            className={cn(
              "flex-1 cursor-pointer rounded-md px-2 py-1 text-xs font-semibold transition-colors",
              mode === m
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "single"
              ? bilingualText(lang, "एक वर्ष", "Single year")
              : bilingualText(lang, "दायरा", "Range")}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-xs text-base">
            {mode === "range"
              ? bilingualText(lang, "देखि", "From")
              : bilingualText(lang, "वर्ष", "Year")}
          </span>
          <select
            className={cn(patroSelect, "w-full tabular-nums")}
            value={draftStart}
            onChange={(e) => pickStart(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {digits(y)}
              </option>
            ))}
          </select>
        </label>

        {mode === "range" && (
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-xs text-base">{bilingualText(lang, "सम्म", "To")}</span>
            <select
              className={cn(patroSelect, "w-full tabular-nums")}
              value={effectiveEnd}
              onChange={(e) => setDraftEnd(Number(e.target.value))}
            >
              {years
                .filter((y) => y >= draftStart)
                .map((y) => (
                  <option key={y} value={y}>
                    {digits(y)}
                  </option>
                ))}
            </select>
          </label>
        )}
      </div>

      {/* The cost of the draft, stated before it is paid: one year payload is
          fetched per year in the range. */}
      <p className="m-0 text-xs text-base">
        {draftSpan > 1
          ? bilingualText(
              lang,
              `${digits(draftSpan)} वर्ष लोड हुनेछ`,
              `Will load ${draftSpan} years`,
            )
          : bilingualText(lang, "एक वर्ष लोड हुनेछ", "Will load 1 year")}
        {draftSpan > WIDE_SPAN && (
          <span className="text-danger">
            {bilingualText(lang, " · ठूलो दायरा", " · large range")}
          </span>
        )}
      </p>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("single");
            setDraftStart(currentYear);
            setDraftEnd(currentYear);
          }}
          disabled={draftStart === currentYear && draftSpan === 1}
          className="cursor-pointer rounded-md px-1 text-xs text-secondary underline-offset-2 hover:underline disabled:pointer-events-none disabled:opacity-40"
        >
          {bilingualText(lang, "यो वर्ष", "This year")}
        </button>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-md border border-border px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-muted"
          >
            {bilingualText(lang, "रद्द", "Cancel")}
          </button>
          <button
            type="button"
            onClick={() => onApply(draftStart, effectiveEnd)}
            disabled={unchanged}
            className="cursor-pointer rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground transition-[filter] hover:brightness-105 disabled:pointer-events-none disabled:opacity-40"
          >
            {bilingualText(lang, "लागू", "Apply")}
          </button>
        </div>
      </div>
    </>
  );
}
