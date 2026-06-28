import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  Star,
  ArrowLeftRight,
  PartyPopper,
  Sparkles,
  BookOpen,
  Sun,
  Moon,
  Menu,
  ChevronDown,
  Sunrise,
  Grid3x3,
  Flame,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "../lib/utils";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AccountMenu } from "@/components/auth/AccountMenu";

const PANCHANGA_LINKS = [
  { to: "/panchanga" as const, label: "Surya Panchanga", icon: Star },
  { to: "/suryakranti" as const, label: "Suryakranti", icon: Sunrise },
  { to: "/chandrakranti" as const, label: "Chandra Kranti", icon: Moon },
  { to: "/shanti-vidhi" as const, label: "शान्ति विधि", icon: Flame },
  { to: "/panchanga/avakahada-chakra" as const, label: "अवकहडा चक्र", icon: Grid3x3 },
] as const;

const NAV = [
  { to: "/converter" as const, label: "Converter", icon: ArrowLeftRight },
  { to: "/holidays" as const, label: "Holidays", icon: PartyPopper },
  { to: "/kundali" as const, label: "Kundali", icon: Sparkles },
  { to: "/learn" as const, label: "Learn", icon: BookOpen },
] as const;

const linkClass =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground [&.active]:bg-secondary/10 [&.active]:text-secondary";

const subLinkClass =
  "flex items-center gap-3 rounded-lg py-2 pl-9 pr-3 text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground [&.active]:bg-secondary/10 [&.active]:text-secondary";

const desktopLinkClass =
  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted [&.active]:text-secondary [&.active]:bg-secondary/10";

const desktopSubLinkClass =
  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground [&.active]:bg-secondary/10 [&.active]:text-secondary";

function isPanchangaRoute(pathname: string) {
  return (
    pathname === "/panchanga" ||
    pathname.startsWith("/panchanga/") ||
    pathname === "/suryakranti" || pathname === "/sun-times" ||
    pathname === "/chandrakranti" || pathname === "/shanti-vidhi"
  );
}

function PanchangaNavDropdown() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = isPanchangaRoute(pathname);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(desktopLinkClass, isActive && "active")}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <Star className="w-4 h-4" />
          Surya Panchanga
          <ChevronDown
            className={cn("w-3.5 h-3.5 opacity-60 transition-transform", open && "rotate-180")}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-52 p-1">
        {PANCHANGA_LINKS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={desktopSubLinkClass}
            activeProps={{ className: "active" }}
            onClick={() => setOpen(false)}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function PanchangaNavGroup({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [expanded, setExpanded] = useState(() => isPanchangaRoute(pathname));
  const isActive = isPanchangaRoute(pathname);

  return (
    <div>
      <button
        type="button"
        className={cn(linkClass, "w-full", isActive && "text-foreground")}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <Star className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">Surya Panchanga</span>
        <ChevronDown
          className={cn("w-4 h-4 shrink-0 opacity-60 transition-transform", expanded && "rotate-180")}
        />
      </button>
      {expanded ? (
        <div className="flex flex-col gap-0.5 pb-1">
          {PANCHANGA_LINKS.map(({ to, label, icon: Icon }) => (
            <DrawerClose asChild key={to}>
              <Link
                to={to}
                className={subLinkClass}
                activeProps={{ className: "active" }}
                onClick={onNavigate}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            </DrawerClose>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BrandMark({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5 shrink-0 group min-w-0", className)}>
      <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shadow group-hover:shadow-primary/40 transition-shadow">
        <CalendarDays className="w-5 h-5 text-primary" />
      </div>
      <span className="font-bold text-[15px] tracking-tight truncate">
        <span className="text-secondary">Vedic</span>
        <span className="text-foreground"> Patro</span>
      </span>
    </Link>
  );
}

function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0",
        className,
      )}
      aria-label="Toggle theme"
    >
      <Sun className="w-4 h-4 hidden dark:block" />
      <Moon className="w-4 h-4 dark:hidden" />
    </button>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
        {/* Desktop — brand left, nav center, theme right */}
        <BrandMark className="hidden lg:flex" />

        <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
          <PanchangaNavDropdown />
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={desktopLinkClass}
              activeProps={{ className: "active" }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <ThemeToggle />
          <AccountMenu />
        </div>

        {/* Mobile / tablet (< 1024px) — menu left, brand center, theme right */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full lg:hidden">
          <div className="flex justify-start">
            <Drawer direction="left" open={open} onOpenChange={setOpen}>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="p-0">
                <DrawerHeader className="border-b border-border text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shadow">
                      <CalendarDays className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <DrawerTitle className="text-base">
                        <span className="text-secondary">Vedic</span>
                        <span className="text-foreground"> Patro</span>
                      </DrawerTitle>
                      <DrawerDescription>नेपाली पात्रो र पञ्चाङ्ग</DrawerDescription>
                    </div>
                  </div>
                </DrawerHeader>

                <nav className="flex flex-col gap-1 p-3">
                  <DrawerClose asChild>
                    <Link to="/" className={linkClass} activeProps={{ className: "active" }}>
                      <CalendarDays className="w-4 h-4 shrink-0" />
                      Home
                    </Link>
                  </DrawerClose>
                  <PanchangaNavGroup onNavigate={() => setOpen(false)} />
                  {NAV.map(({ to, label, icon: Icon }) => (
                    <DrawerClose asChild key={to}>
                      <Link to={to} className={linkClass} activeProps={{ className: "active" }}>
                        <Icon className="w-4 h-4 shrink-0" />
                        {label}
                      </Link>
                    </DrawerClose>
                  ))}
                </nav>
              </DrawerContent>
            </Drawer>
          </div>

          <BrandMark className="justify-center" />

          <div className="flex justify-end items-center gap-2">
            <ThemeToggle />
            <AccountMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
