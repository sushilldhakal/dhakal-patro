import type { MouseEvent, PointerEvent } from "react";
import { useTranslation } from "react-i18next";
import { isPatroBrowseEraPair, togglePatroBrowseEra, type Era } from "@/lib/era";
import { cn } from "@/lib/utils";
import { patroEraShortLabel } from "./patro-era-short-label";

const VIKRAM_PAIR: readonly Era[] = ["bs", "bbs"];
const GREGORIAN_PAIR: readonly Era[] = ["ad", "bc"];

function stopBubble(e: PointerEvent | MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * - `inline` — beside year on day nav (month | year | day | BBS).
 * - `dropdown` — inside the year combobox panel (year-only / month+year nav).
 */
export function PatroYearEraToggle({
  era,
  onEraChange,
  className,
  compact = false,
  comfortable = false,
  variant = "inline",
}: {
  era: Era;
  onEraChange: (era: Era) => void;
  className?: string;
  compact?: boolean;
  comfortable?: boolean;
  variant?: "inline" | "dropdown";
}) {
  const { t } = useTranslation();
  if (!isPatroBrowseEraPair(era)) return null;

  if (variant === "dropdown") {
    const options = era === "ad" || era === "bc" ? GREGORIAN_PAIR : VIKRAM_PAIR;
    return (
      <div
        className={cn(
          "flex gap-1 border-b border-border px-2 pb-2 pt-1",
          className,
        )}
        role="group"
        aria-label={t("patro_date.year_era_toggle_aria")}
        onPointerDown={stopBubble}
        onMouseDown={stopBubble}
      >
        {options.map((option) => {
          const selected = option === era;
          const label = patroEraShortLabel(option, t);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              className={cn(
                "min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-xs font-semibold transition-colors",
                selected
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              onClick={(e) => {
                stopBubble(e);
                if (!selected) onEraChange(option);
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  const targetEra = togglePatroBrowseEra(era);
  if (targetEra == null) return null;

  const targetLabel = patroEraShortLabel(targetEra, t);

  return (
    <button
      type="button"
      className={cn(
        "relative z-10 shrink-0 truncate rounded-md border border-border bg-card font-semibold text-muted-foreground transition-colors",
        "pointer-events-auto hover:bg-muted hover:text-foreground",
        compact
          ? cn(
              "inline-flex items-center justify-center px-1.5",
              comfortable ? "h-9 text-xs" : "h-6 text-[10px] sm:h-7 sm:px-2 sm:text-xs",
            )
          : "px-2 py-1.5 text-xs",
        className,
      )}
      aria-label={t("patro_date.switch_to_era", { era: targetLabel, defaultValue: `Switch to ${targetLabel}` })}
      title={targetLabel}
      onPointerDown={stopBubble}
      onMouseDown={stopBubble}
      onClick={(e) => {
        stopBubble(e);
        onEraChange(targetEra);
      }}
    >
      {targetLabel}
    </button>
  );
}
