import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n/locale";

export function PanchangaSection({
  titleKey,
  titleNe,
  titleEn,
  children,
  className,
}: {
  titleKey?: string;
  titleNe?: string;
  titleEn?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();
  const { pick } = useLocale();
  const title = titleKey
    ? t(titleKey)
    : pick(titleNe ?? titleEn ?? "", titleEn ?? titleNe ?? "");

  return (
    <section
      className={cn(
        "rounded-xl overflow-hidden bg-card shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]",
        className,
      )}
    >
      <header className="flex items-baseline gap-2.5 px-4 py-2.5 border-b border-border bg-secondary/[0.09] dark:bg-secondary/20">
        <h2 className="text-sm font-bold m-0">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function rowLabel(labelKey?: string, label?: string, t?: (k: string) => string) {
  if (labelKey && t) return t(labelKey);
  return label ?? "";
}

function QuadLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "text-[11.5px] font-semibold leading-snug text-muted-foreground pt-0.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

function QuadValue({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "text-[13px] font-medium leading-snug flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** One table band: label|value on the left, optional label|value on the right. */
export function PanchangaQuadRow({
  left,
  right,
  className,
}: {
  left: { labelKey?: string; label?: string; children: React.ReactNode };
  right?: { labelKey?: string; label?: string; children: React.ReactNode };
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(4.75rem,6.25rem)_1fr] sm:grid-cols-[minmax(4.75rem,6.25rem)_1fr_minmax(4.75rem,6.25rem)_1fr]",
        "gap-x-3 gap-y-1.5 px-4 py-2 border-b border-border items-start",
        className,
      )}
    >
      <QuadLabel>{rowLabel(left.labelKey, left.label, t)}</QuadLabel>
      <QuadValue>{left.children}</QuadValue>
      {right ? (
        <>
          <QuadLabel className="max-sm:col-span-2 max-sm:mt-1.5 max-sm:pt-2 max-sm:border-t max-sm:border-dashed max-sm:border-border">
            {rowLabel(right.labelKey, right.label, t)}
          </QuadLabel>
          <QuadValue className="max-sm:col-span-2">{right.children}</QuadValue>
        </>
      ) : (
        <>
          <div className="hidden sm:block" aria-hidden />
          <div className="hidden sm:block" aria-hidden />
        </>
      )}
    </div>
  );
}

/** Full-width label|value row (e.g. long lists). */
export function PanchangaFullRow({
  labelKey,
  label,
  children,
  className,
}: {
  labelKey?: string;
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(4.75rem,6.25rem)_1fr] gap-x-3 gap-y-1 px-4 py-2 border-b border-border items-start",
        className,
      )}
    >
      <QuadLabel>{rowLabel(labelKey, label, t)}</QuadLabel>
      <QuadValue>{children}</QuadValue>
    </div>
  );
}

export function PanchangaTableBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("[&>*:last-child]:border-b-0", className)}>
      {children}
    </div>
  );
}

/** @deprecated use PanchangaQuadRow */
export function PanchangaRows({
  children,
}: {
  children: React.ReactNode;
  /** @deprecated ignored — use PanchangaQuadRow */
  twoCol?: boolean;
}) {
  return <PanchangaTableBody>{children}</PanchangaTableBody>;
}

/** @deprecated use PanchangaQuadRow or PanchangaFullRow */
export function PanchangaRow({
  labelKey,
  label,
  children,
  oddBorder: _oddBorder,
  className,
}: {
  labelKey?: string;
  label?: string;
  children: React.ReactNode;
  oddBorder?: boolean;
  className?: string;
}) {
  return (
    <PanchangaFullRow labelKey={labelKey} label={label} className={className}>
      {children}
    </PanchangaFullRow>
  );
}

export function UptoValue({
  name,
  sym,
  endTime,
  badge,
  compact,
}: {
  name?: string;
  sym?: string;
  endTime?: string;
  badge?: string;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  if (!name) return null;
  return (
    <div
      className={cn(
        "flex items-baseline gap-1.5 min-w-0",
        compact ? "justify-between gap-2 w-full" : "flex-wrap",
      )}
    >
      <span className="inline-flex items-baseline gap-1.5 min-w-0">
        {sym && <span className="text-[13px] shrink-0">{sym}</span>}
        <span className="font-semibold">{name}</span>
        {badge && (
          <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full bg-secondary/15 text-secondary dark:text-accent">
            {badge}
          </span>
        )}
      </span>
      {endTime && (
        <span className="text-[11px] font-mono font-semibold text-foreground whitespace-nowrap shrink-0">
          {endTime} {t("sections.until")}
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
  const { t } = useTranslation();
  if (!start || !end) {
    return (
      <span className="text-muted-foreground text-xs">
        {t("sections.dash")} {t("sections.not_available")}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "font-mono text-[12px] font-semibold",
        variant === "good" && "text-[var(--color-success)]",
        variant === "bad" && "text-destructive",
        variant === "neutral" && "text-foreground",
      )}
    >
      {start} → {end}
    </span>
  );
}

/** Tight name | time rows — label and time stay on one line. */
export function DenseListTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-border/80 rounded-md border border-border/80", className)}>
      {children}
    </div>
  );
}

export function DenseListRow({
  label,
  time,
  note,
  highlight,
  className,
}: {
  label: React.ReactNode;
  time?: React.ReactNode;
  note?: React.ReactNode;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-2 px-2.5 py-1 text-[12px] leading-snug",
        highlight && "font-semibold text-success",
        className,
      )}
    >
      <span className="min-w-0 truncate">{label}</span>
      <span className="shrink-0 font-mono text-[11px] font-semibold text-foreground tabular-nums">
        {time ?? "—"}
      </span>
      {note ? (
        <span className="col-span-2 text-[10.5px] font-mono font-medium text-foreground/90 -mt-0.5 pb-0.5">
          {note}
        </span>
      ) : null}
    </div>
  );
}

/** Section sub-heading above a dense block. */
export function PanchangaSubBlock({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-border px-4 py-2 last:border-b-0", className)}>
      <p className="m-0 mb-1.5 text-[11px] font-semibold text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

/** Four-column paired timing table (two lists aligned row-by-row). */
export function PairedTimingTable({
  leftTitle,
  rightTitle,
  rows,
}: {
  leftTitle: string;
  rightTitle: string;
  rows: Array<{
    left?: { label: React.ReactNode; time?: React.ReactNode; note?: React.ReactNode; highlight?: boolean };
    right?: { label: React.ReactNode; time?: React.ReactNode; note?: React.ReactNode };
  }>;
}) {
  return (
    <div className="text-[12px]">
      <div className="hidden sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] sm:gap-x-2 border-b border-border bg-secondary/[0.06] px-3 py-1.5 text-[10.5px] font-semibold text-muted-foreground">
        <span className="col-span-2">{leftTitle}</span>
        <span className="col-span-2 border-l border-border/60 pl-2">{rightTitle}</span>
      </div>
      <div className="divide-y divide-border/80">
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-2 px-3 py-1.5 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] sm:gap-x-2 sm:gap-y-0 sm:py-1 sm:items-start"
          >
            <PairedTimingCell
              title={leftTitle}
              showTitleOnMobile
              label={row.left?.label}
              time={row.left?.time}
              note={row.left?.note}
              highlight={row.left?.highlight}
            />
            <PairedTimingCell
              title={rightTitle}
              showTitleOnMobile
              label={row.right?.label}
              time={row.right?.time}
              note={row.right?.note}
              bordered
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PairedTimingCell({
  title,
  label,
  time,
  note,
  highlight,
  showTitleOnMobile,
  bordered,
}: {
  title: string;
  label?: React.ReactNode;
  time?: React.ReactNode;
  note?: React.ReactNode;
  highlight?: boolean;
  showTitleOnMobile?: boolean;
  bordered?: boolean;
}) {
  if (!label && !time) {
    return <div className={cn("hidden sm:block sm:col-span-2", bordered && "sm:border-l sm:border-border/60")} />;
  }

  return (
    <div
      className={cn(
        "sm:col-span-2",
        bordered && "max-sm:pt-2 max-sm:border-t max-sm:border-border/60 sm:border-l sm:border-border/60 sm:pl-2",
      )}
    >
      {showTitleOnMobile ? (
        <span className="mb-0.5 block text-[10px] font-semibold text-muted-foreground sm:hidden">
          {title}
        </span>
      ) : null}
      <div className="flex items-start justify-between gap-2">
        <span className={cn("min-w-0 font-medium leading-snug", highlight && "font-semibold text-success")}>
          {label}
        </span>
        <div className="shrink-0 text-right">
          <div className="font-mono text-[11px] font-semibold text-foreground tabular-nums leading-snug">{time}</div>
          {note ? (
            <div className="mt-0.5 max-w-[9.5rem] text-[10.5px] font-mono font-medium text-foreground/90 leading-tight">
              {note}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
