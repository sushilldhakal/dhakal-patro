import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  Star,
  Sparkles,
  BookOpen,
  Sun,
  Moon,
  Menu,
  ChevronDown,
  Sunrise,
  Grid3x3,
  Heart,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "../lib/utils";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const PANCHANGA_LINKS = [
  { to: "/panchanga" as const, labelKey: "nav.surya_panchanga", icon: Star },
  { to: "/suryakranti" as const, labelKey: "nav.suryakranti", icon: Sunrise },
  { to: "/abhijit-muhurta" as const, labelKey: "nav.abhijit_muhurta", icon: Sparkles },
  { to: "/chandrakranti" as const, labelKey: "nav.chandrakranti", icon: Moon },
  { to: "/panchanga/avakahada-chakra" as const, labelKey: "nav.avakahada_chakra", icon: Grid3x3 },
] as const;

const JYOTISH_LINKS = [
  { to: "/kundali" as const, labelKey: "nav.jyotish_kundali", icon: Sparkles },
  { to: "/jyotish/kundali-milan" as const, labelKey: "nav.jyotish_kundali_milan", icon: Heart },
] as const;

const NAV = [{ to: "/learn" as const, labelKey: "nav.learn", icon: BookOpen }] as const;

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
    pathname === "/abhijit-muhurta" ||
    pathname === "/chandrakranti"
  );
}

function isJyotishRoute(pathname: string) {
  return pathname === "/kundali" || pathname.startsWith("/kundali/") || pathname.startsWith("/jyotish/");
}

function JyotishNavDropdown() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = isJyotishRoute(pathname);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(desktopLinkClass, isActive && "active")}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <Sparkles className="w-4 h-4" />
          {t("nav.jyotish")}
          <ChevronDown
            className={cn("w-3.5 h-3.5 opacity-60 transition-transform", open && "rotate-180")}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-52 p-1">
        {JYOTISH_LINKS.map(({ to, labelKey, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={desktopSubLinkClass}
            activeProps={{ className: "active" }}
            onClick={() => setOpen(false)}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {t(labelKey)}
          </Link>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function JyotishNavGroup({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [expanded, setExpanded] = useState(() => isJyotishRoute(pathname));
  const isActive = isJyotishRoute(pathname);

  return (
    <div>
      <button
        type="button"
        className={cn(linkClass, "w-full", isActive && "text-foreground")}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <Sparkles className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">{t("nav.jyotish")}</span>
        <ChevronDown
          className={cn("w-4 h-4 shrink-0 opacity-60 transition-transform", expanded && "rotate-180")}
        />
      </button>
      {expanded ? (
        <div className="flex flex-col gap-0.5 pb-1">
          {JYOTISH_LINKS.map(({ to, labelKey, icon: Icon }) => (
            <DrawerClose asChild key={to}>
              <Link
                to={to}
                className={subLinkClass}
                activeProps={{ className: "active" }}
                onClick={onNavigate}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {t(labelKey)}
              </Link>
            </DrawerClose>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PanchangaNavDropdown() {
  const { t } = useTranslation();
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
          {t("nav.surya_panchanga")}
          <ChevronDown
            className={cn("w-3.5 h-3.5 opacity-60 transition-transform", open && "rotate-180")}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-52 p-1">
        {PANCHANGA_LINKS.map(({ to, labelKey, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={desktopSubLinkClass}
            activeProps={{ className: "active" }}
            onClick={() => setOpen(false)}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {t(labelKey)}
          </Link>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function PanchangaNavGroup({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
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
        <span className="flex-1 text-left">{t("nav.surya_panchanga")}</span>
        <ChevronDown
          className={cn("w-4 h-4 shrink-0 opacity-60 transition-transform", expanded && "rotate-180")}
        />
      </button>
      {expanded ? (
        <div className="flex flex-col gap-0.5 pb-1">
          {PANCHANGA_LINKS.map(({ to, labelKey, icon: Icon }) => (
            <DrawerClose asChild key={to}>
              <Link
                to={to}
                className={subLinkClass}
                activeProps={{ className: "active" }}
                onClick={onNavigate}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {t(labelKey)}
              </Link>
            </DrawerClose>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BrandLogo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/favicon.svg"
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden
    />
  );
}

function BrandMark({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <Link to="/" className={cn("flex items-center gap-2.5 group min-w-0", className)}>
      <BrandLogo
        size={42}
        className=""
      />
      <span className="font-bold text-[15px] tracking-tight truncate">
        <span className="text-secondary dark:text-primary">{t("brand_vedic")}</span>
        <span className="text-foreground"> {t("brand_patro")}</span>
      </span>
    </Link>
  );
}

function ThemeToggle({ className, showLabel }: { className?: string; showLabel?: boolean }) {
  const { t } = useTranslation();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isDark = (resolvedTheme ?? theme) === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        showLabel
          ? "flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
          : "w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0",
        className,
      )}
      aria-label={t("theme_toggle")}
    >
      <Sun className="w-4 h-4 hidden dark:block" />
      <Moon className="w-4 h-4 dark:hidden" />
      {showLabel ? (
        <span>{isDark ? t("theme_light") : t("theme_dark")}</span>
      ) : null}
    </button>
  );
}

function MenuPreferences() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{t("language")}</span>
        <LanguageSwitcher />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{t("theme_toggle")}</span>
        <ThemeToggle showLabel />
      </div>
    </div>
  );
}

function NavMenuContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();

  return (
    <nav className="flex flex-col gap-1 p-3">
      <DrawerClose asChild>
        <Link to="/" className={linkClass} activeProps={{ className: "active" }} onClick={onNavigate}>
          <CalendarDays className="w-4 h-4 shrink-0" />
          {t("home")}
        </Link>
      </DrawerClose>
      <PanchangaNavGroup onNavigate={onNavigate} />
      <JyotishNavGroup onNavigate={onNavigate} />
      {NAV.map(({ to, labelKey, icon: Icon }) => (
        <DrawerClose asChild key={to}>
          <Link to={to} className={linkClass} activeProps={{ className: "active" }} onClick={onNavigate}>
            <Icon className="w-4 h-4 shrink-0" />
            {t(labelKey)}
          </Link>
        </DrawerClose>
      ))}
    </nav>
  );
}

function DrawerBrandHeader() {
  const { t } = useTranslation();

  return (
    <DrawerHeader className="border-b border-border text-left">
      <div className="flex items-center gap-2.5">
        <BrandLogo size={36} className="rounded-[22%] shadow" />
        <div>
          <DrawerTitle className="text-base">
            <span className="text-secondary">{t("brand_vedic")}</span>
            <span className="text-foreground"> {t("brand_patro")}</span>
          </DrawerTitle>
          <DrawerDescription>{t("tagline")}</DrawerDescription>
        </div>
      </div>
    </DrawerHeader>
  );
}

export function Header() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tabletOpen, setTabletOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-[1400px] py-4 mx-auto px-4 h-16 flex items-center gap-3">
        {/* Desktop — brand left, nav center, theme right */}
        <BrandMark className="hidden lg:flex" />

        <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
          <PanchangaNavDropdown />
          <JyotishNavDropdown />
          {NAV.map(({ to, labelKey, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={desktopLinkClass}
              activeProps={{ className: "active" }}
            >
              <Icon className="w-4 h-4" />
              {t(labelKey)}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <AccountMenu />
        </div>

        {/* Mobile (< 768px) — menu left, brand center, account right; sheet from left */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full md:hidden">
          <div className="flex justify-start">
            <Drawer direction="left" open={mobileOpen} onOpenChange={setMobileOpen}>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0" aria-label={t("menu_open")}>
                  <Menu className="size-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="flex h-full flex-col p-0">
                <DrawerBrandHeader />
                <div className="flex-1 overflow-y-auto">
                  <NavMenuContent onNavigate={() => setMobileOpen(false)} />
                </div>
                <DrawerFooter className="border-t border-border">
                  <MenuPreferences />
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>

          <BrandMark className="justify-center" />

          <div className="flex justify-end items-center shrink-0">
            <AccountMenu />
          </div>
        </div>

        {/* Tablet (768px–1023px) — menu left, brand center, lang/theme/account right */}
        <div className="hidden md:grid lg:hidden grid-cols-[1fr_auto_1fr] items-center w-full">
          <div className="flex justify-start">
            <Drawer direction="left" open={tabletOpen} onOpenChange={setTabletOpen}>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0" aria-label={t("menu_open")}>
                  <Menu className="size-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="p-0">
                <DrawerBrandHeader />
                <NavMenuContent onNavigate={() => setTabletOpen(false)} />
              </DrawerContent>
            </Drawer>
          </div>

          <BrandMark className="justify-center" />

          <div className="flex justify-end items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <AccountMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
