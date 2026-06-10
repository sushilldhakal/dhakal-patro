import { cn } from "@/lib/utils";

export function PanchangaSection({
  titleNe,
  titleEn,
  children,
  className,
}: {
  titleNe: string;
  titleEn: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl overflow-hidden bg-card shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]",
        className
      )}
    >
      <header className="flex items-baseline gap-2.5 px-4 py-2.5 border-b border-border bg-secondary/[0.09] dark:bg-secondary/20">
        <h2 className="text-sm font-bold m-0">{titleNe}</h2>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {titleEn}
        </span>
      </header>
      {children}
    </section>
  );
}

export function PanchangaRows({
  children,
  twoCol = true,
}: {
  children: React.ReactNode;
  twoCol?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid",
        twoCol ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
      )}
    >
      {children}
    </div>
  );
}

export function PanchangaRow({
  label,
  labelEn,
  children,
  oddBorder,
}: {
  label: string;
  labelEn?: string;
  children: React.ReactNode;
  oddBorder?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[118px_1fr] gap-x-3 gap-y-0.5 px-4 py-2.5 border-b border-border items-start",
        oddBorder && "md:border-r md:border-border"
      )}
    >
      <div className="flex flex-col text-[12.5px] font-semibold leading-snug">
        {label}
        {labelEn && (
          <span className="text-[9.5px] font-medium uppercase tracking-wide text-muted-foreground">
            {labelEn}
          </span>
        )}
      </div>
      <div className="text-[13px] font-medium leading-snug flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0">
        {children}
      </div>
    </div>
  );
}

export function UptoValue({
  name,
  sym,
  endTime,
  badge,
}: {
  name?: string;
  sym?: string;
  endTime?: string;
  badge?: string;
}) {
  if (!name) return null;
  return (
    <div className="flex items-baseline gap-1.5 flex-wrap w-full">
      {sym && <span className="text-[13px] shrink-0">{sym}</span>}
      <span className="font-semibold">{name}</span>
      {badge && (
        <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full bg-secondary/15 text-secondary dark:text-teal-300">
          {badge}
        </span>
      )}
      {endTime && (
        <span className="text-[11.5px] font-mono text-muted-foreground whitespace-nowrap">
          {endTime} सम्म
        </span>
      )}
    </div>
  );
}

export function TimingRange({
  start,
  end,
  variant = "neutral",
}: {
  start?: string;
  end?: string;
  variant?: "good" | "bad" | "neutral";
}) {
  if (!start || !end) return <span className="text-muted-foreground text-xs">— छैन</span>;
  return (
    <span
      className={cn(
        "font-mono text-[12.5px]",
        variant === "good" && "text-[var(--color-success)]",
        variant === "bad" && "text-destructive"
      )}
    >
      {start} → {end}
    </span>
  );
}
