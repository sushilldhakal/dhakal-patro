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
        className
      )}
    >
      <header className="flex items-baseline gap-2.5 px-4 py-2.5 border-b border-border bg-secondary/[0.09] dark:bg-secondary/20">
        <h2 className="text-sm font-bold m-0">{title}</h2>
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
  labelKey,
  label,
  children,
  oddBorder,
}: {
  labelKey?: string;
  label?: string;
  children: React.ReactNode;
  oddBorder?: boolean;
}) {
  const { t } = useTranslation();
  const displayLabel = labelKey ? t(labelKey) : (label ?? "");

  return (
    <div
      className={cn(
        "grid grid-cols-[118px_1fr] gap-x-3 gap-y-0.5 px-4 py-2.5 border-b border-border items-start",
        oddBorder && "md:border-r md:border-border"
      )}
    >
      <div className="flex flex-col text-[12.5px] font-semibold leading-snug">
        {displayLabel}
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
  const { t } = useTranslation();
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
        <span className="text-[11.5px] font-mono font-semibold text-foreground whitespace-nowrap">
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
        "font-mono text-[12.5px] font-semibold",
        variant === "good" && "text-[var(--color-success)]",
        variant === "bad" && "text-destructive",
        variant === "neutral" && "text-foreground"
      )}
    >
      {start} → {end}
    </span>
  );
}
