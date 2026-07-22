import { useRouterState } from "@tanstack/react-router";
import { useInPanchangaShell } from "@/components/panchanga/PanchangaShellLayout";
import { PanchangaSidebarNav } from "@/components/panchanga/PanchangaSidebarNav";
import { shouldShowPanchangaSidebar } from "@/lib/panchanga-sidebar-routes";
import { cn } from "../lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
  /** Override auto sidebar detection (desktop ≥992px). */
  sidebarNav?: boolean;
}

const SIDEBAR_CLASS =
  "hidden min-[992px]:sticky min-[992px]:top-20 min-[992px]:block w-56 shrink-0 self-start";

export function PageShell({ children, className, sidebarNav }: Props) {
  const inShell = useInPanchangaShell();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showSidebar = !inShell && (sidebarNav ?? shouldShowPanchangaSidebar(pathname));

  if (inShell) {
    return <div className={cn("space-y-8", className)}>{children}</div>;
  }

  if (showSidebar) {
    return (
      <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
        <div className="flex items-start gap-6">
          <PanchangaSidebarNav className={SIDEBAR_CLASS} />
          <div className={cn("min-w-0 flex-1 space-y-8", className)}>{children}</div>
        </div>
      </main>
    );
  }

  return (
    <main className={cn("max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-8", className)}>
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
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
