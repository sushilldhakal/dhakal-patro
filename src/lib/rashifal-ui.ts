import {
  Ban,
  Briefcase,
  CalendarDays,
  CalendarRange,
  Clock,
  Coins,
  Compass,
  Flame,
  GraduationCap,
  Hash,
  Heart,
  HeartPulse,
  Orbit,
  Palette,
  Plane,
  RotateCcw,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { NavataraTone, RashifalDomainKey, RashifalPeriod } from "@/lib/api";

/**
 * Period tabs are icon-only on the page, so each icon has to carry the whole
 * meaning: the Sun is one sunrise, the two calendar glyphs are the week and the
 * month, and the orbit is a year — Jupiter's own sign-per-year circuit, which is
 * also the graha the server's yearly reading leans on.
 */
export const RASHIFAL_PERIOD_ICON: Record<RashifalPeriod, LucideIcon> = {
  daily: Sun,
  weekly: CalendarDays,
  monthly: CalendarRange,
  yearly: Orbit,
};

export const RASHIFAL_DOMAIN_ICON: Record<RashifalDomainKey, LucideIcon> = {
  career: Briefcase,
  finance: Coins,
  health: HeartPulse,
  love: Heart,
  learning: GraduationCap,
  travel: Plane,
};

export const RASHIFAL_LUCKY_ICON = {
  color: Palette,
  number: Hash,
  direction: Compass,
  time: Clock,
} satisfies Record<string, LucideIcon>;

/** Flags on a single gochar row. */
export const RASHIFAL_FLAG_ICON = {
  vedha: Ban,
  retrograde: RotateCcw,
  combust: Flame,
} satisfies Record<string, LucideIcon>;

/**
 * Score bar fill per tone. Kept as a separate scale from the tone *background*
 * chips so a 0–100 meter reads as a meter rather than as another badge.
 */
const TONE_BAR: Record<NavataraTone, string> = {
  best: "bg-emerald-500",
  good: "bg-emerald-400/80",
  neutral: "bg-amber-400/80",
  bad: "bg-orange-500/80",
  worst: "bg-rose-500",
};

export function rashifalToneBar(tone: NavataraTone | undefined): string {
  return TONE_BAR[tone ?? "neutral"];
}

const TONE_TEXT: Record<NavataraTone, string> = {
  best: "text-emerald-600 dark:text-emerald-400",
  good: "text-emerald-600 dark:text-emerald-400",
  neutral: "text-amber-600 dark:text-amber-400",
  bad: "text-orange-600 dark:text-orange-400",
  worst: "text-rose-600 dark:text-rose-400",
};

export function rashifalToneText(tone: NavataraTone | undefined): string {
  return TONE_TEXT[tone ?? "neutral"];
}

const NE_DIGITS = "०१२३४५६७८९";

/** Nepali numerals for a plain integer, matching the server's own formatting. */
export function toNepaliDigits(value: number | string, lang?: string): string {
  const text = String(value);
  if (lang !== "ne") return text;
  return text.replace(/\d/g, (d) => NE_DIGITS[Number(d)]);
}
