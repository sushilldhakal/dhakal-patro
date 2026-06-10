import { cn } from "../lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export function PageShell({ children, className }: Props) {
  return (
    <main className={cn("max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8", className)}>
      {children}
    </main>
  );
}

export function PageHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
