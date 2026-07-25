import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BsHeadlineProps {
  /** Nepali BS date label — month + year, or year + वि.सं. */
  bs: ReactNode;
  /** संवत्सर name. Always rendered right after the Nepali year, before the AD date. */
  samvatsara?: ReactNode;
  /** Gregorian date / range subtitle. Always rendered last. */
  gregorian?: ReactNode;
  className?: string;
  bsClassName?: string;
  samvatsaraClassName?: string;
  gregorianClassName?: string;
}

/**
 * Single source of truth for every BS calendar page heading. Enforces the one
 * canonical order across the whole app:
 *
 *   <Nepali BS date>   <संवत्सर name>   <Gregorian date>
 *
 * e.g. `साउन २०८३ रौद्र २०२६ जुलाई २५`. The samvatsara name always sits between
 * the Nepali year and the Gregorian date — never reorder these in call sites,
 * change this component instead.
 */
export function BsHeadline({
  bs,
  samvatsara,
  gregorian,
  className,
  bsClassName,
  samvatsaraClassName,
  gregorianClassName,
}: BsHeadlineProps) {
  return (
    <h1
      className={cn(
        "m-0 flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5 font-bold leading-tight tracking-tight",
        className,
      )}
    >
      <span className={cn("min-w-0", bsClassName)}>{bs}</span>
      {samvatsara ? (
        <span className={cn("shrink-0 font-semibold text-foreground/90", samvatsaraClassName)}>
          {samvatsara}
        </span>
      ) : null}
      {gregorian ? <span className={gregorianClassName}>{gregorian}</span> : null}
    </h1>
  );
}
