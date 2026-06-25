import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  titleNe: string;
  titleEn?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export function PatroTableShell({ titleNe, titleEn, subtitle, children, className }: Props) {
  return (
    <section className={cn("rounded-xl border border-border", className)}>
      <header className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">{titleNe}</h3>
        {titleEn ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{titleEn}</p>
        ) : null}
        {subtitle ? (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        ) : null}
      </header>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}
