import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Star,
  ArrowLeftRight,
  PartyPopper,
  Sparkles,
  BookOpen,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "../lib/utils";

const NAV = [
  { to: "/panchanga" as const, label: "Surya Panchanga", icon: Star },
  { to: "/converter" as const, label: "Converter", icon: ArrowLeftRight },
  { to: "/holidays" as const, label: "Holidays", icon: PartyPopper },
  { to: "/kundali" as const, label: "Kundali", icon: Sparkles },
  { to: "/learn" as const, label: "Learn", icon: BookOpen },
];

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shadow group-hover:shadow-primary/40 transition-shadow">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-[15px] tracking-tight hidden sm:block">
            <span className="text-secondary">ढhakal</span>
            <span className="text-secondary"> Patro</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-muted [&.active]:text-secondary [&.active]:bg-secondary/10"
              )}
              activeProps={{ className: "active" }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          aria-label="Toggle theme"
        >
          <Sun className="w-4 h-4 hidden dark:block" />
          <Moon className="w-4 h-4 dark:hidden" />
        </button>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden flex border-t border-border/40">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                "text-muted-foreground hover:text-foreground [&.active]:text-secondary [&.active]:border-t-2 [&.active]:border-secondary [&.active]:-mt-px"
            )}
            activeProps={{ className: "active" }}
          >
            <Icon className="w-4 h-4" />
            <span className="truncate px-0.5">{label}</span>
          </Link>
        ))}
      </div>
    </header>
  );
}
