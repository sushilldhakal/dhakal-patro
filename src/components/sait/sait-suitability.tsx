import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import type { SaitSuitability } from "@/lib/api";
import { SUITABILITY_STYLE } from "@/lib/sait-suitability";

/** A small verdict chip shown on a personalised day. */
export function SuitabilityBadge({
  suitability,
  className,
}: {
  suitability: SaitSuitability;
  className?: string;
}) {
  const { pick } = useLocale();
  const s = SUITABILITY_STYLE[suitability];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold",
        s.pill,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} aria-hidden />
      {pick(s.ne, s.en)}
    </span>
  );
}

/** Legend + optional counts, shown once a profile is chosen. */
export function SuitabilityLegend({
  counts,
}: {
  counts?: { favourable: number; neutral: number; avoid: number } | null;
}) {
  const { pick, digits } = useLocale();
  const order: SaitSuitability[] = ["favourable", "neutral", "avoid"];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">
        {pick("तपाईंको प्रोफाइलअनुसार", "For your profile")}
      </span>
      {order.map((k) => {
        const s = SUITABILITY_STYLE[k];
        return (
          <span key={k} className="inline-flex items-center gap-1">
            <span className={cn("size-2 rounded-full", s.dot)} aria-hidden />
            {pick(s.ne, s.en)}
            {counts ? (
              <span className="font-num tabular-nums">· {digits(counts[k])}</span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
