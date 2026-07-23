import { Flame, RotateCcw } from "lucide-react";
import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";

/** Compact "व = वक्री · अ = अस्त" key explaining the chart markers. */
export function GrahaStatusLegend({ className }: { className?: string }) {
  const { pick } = useLocale();
  return (
    <p
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        <RotateCcw className="size-3 text-secondary" aria-hidden />
        <span className="font-semibold text-secondary">{pick("व", "R")}</span>
        {pick("= वक्री", "= retrograde")}
      </span>
      <span className="inline-flex items-center gap-1">
        <Flame className="size-3 text-destructive" aria-hidden />
        <span className="font-semibold text-destructive">{pick("अ", "C")}</span>
        {pick("= अस्त", "= combust")}
      </span>
    </p>
  );
}

type Props = {
  isRetrograde?: boolean;
  isCombust?: boolean;
  /** "badge" (default) shows a pill with icon + label; "icon" shows only the icon. */
  variant?: "badge" | "icon";
  className?: string;
};

/**
 * वक्री (retrograde) and अस्त (combust) status markers for a graha, shared by
 * every planet readout so the icons and colours stay consistent — RotateCcw /
 * secondary for वक्री, Flame / destructive for अस्त.
 */
export function GrahaStatusBadges({ isRetrograde, isCombust, variant = "badge", className }: Props) {
  const { pick } = useLocale();
  if (!isRetrograde && !isCombust) return null;

  if (variant === "icon") {
    return (
      <span className={cn("inline-flex items-center gap-0.5", className)}>
        {isRetrograde && (
          <RotateCcw
            className="size-3 text-secondary"
            aria-label={pick("वक्री", "Retrograde")}
          />
        )}
        {isCombust && (
          <Flame
            className="size-3 text-destructive"
            aria-label={pick("अस्त", "Combust")}
          />
        )}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {isRetrograde && (
        <span
          className="inline-flex items-center gap-0.5 rounded-full bg-secondary/15 px-1 py-0.5 text-sm font-bold normal-case text-secondary"
          title={pick("वक्री (retrograde)", "Retrograde")}
        >
          <RotateCcw className="size-2.5" aria-hidden />
          {pick("वक्री", "R")}
        </span>
      )}
      {isCombust && (
        <span
          className="inline-flex items-center gap-0.5 rounded-full bg-destructive/10 px-1 py-0.5 text-sm font-bold normal-case text-destructive"
          title={pick("अस्त (सूर्य सामीप्य)", "Combust")}
        >
          <Flame className="size-2.5" aria-hidden />
          {pick("अस्त", "C")}
        </span>
      )}
    </span>
  );
}
