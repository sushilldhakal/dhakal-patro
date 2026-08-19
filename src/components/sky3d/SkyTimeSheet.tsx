/**
 * Stellarium-style time sheet over the 3D sky: wall-clock steppers, a bipolar
 * ×10000 rate slider, previous/next night, jump-to-now, and a daylight scrub.
 *
 * Drawn in-tree (not portalled) so it still paints inside the Fullscreen API
 * layer — the same constraint {@link SkyDateTimePicker} was written around.
 *
 * Nepali UI steps विक्रम संवत् year / month / day. English UI keeps Gregorian.
 */

import { useRef, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  History,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from "lucide-react";
import {
  adToBS,
  BS_OFFLINE_TABLE_START_YEAR,
  BS_SUPPORTED_END_YEAR,
  bsToAdOrNull,
  getBSMonthLength,
  shiftBsMonth,
} from "@/lib/bs-calendar";
import { useLocale, bilingualText } from "@/i18n/locale";
import { cn } from "@/lib/utils";

const SLIDER_MAX = 1000;
const RATE_MAX = 10_000;
const DEADZONE = 36;

/** Starts at बिहान (~04:00) so the labels read left → right as named. */
const DAY_ORIGIN_SEC = 4 * 3600;

/** बिहान → दिउँसो → सन्ध्या → जूनकिरण → मध्यरात. */
const DAYLIGHT_GRADIENT =
  "linear-gradient(90deg," +
  "#f6c56a 0%," +
  "#9bd4ff 14%," +
  "#5eb6ff 28%," +
  "#87c8f8 40%," +
  "#f4a04a 50%," +
  "#e85d2c 58%," +
  "#6b3278 66%," +
  "#1a2848 74%," +
  "#8eb8dc 80%," +
  "#0a1020 88%," +
  "#05070f 96%," +
  "#3a2458 100%)";

const DAY_PERIODS = [
  { id: "morning", at: 6, ne: "बिहान", en: "Morning" },
  { id: "afternoon", at: 30, ne: "दिउँसो", en: "Afternoon" },
  { id: "evening", at: 52, ne: "सन्ध्या", en: "Evening" },
  { id: "moonlight", at: 74, ne: "जूनकिरण", en: "Moonlight" },
  { id: "midnight", at: 92, ne: "मध्यरात", en: "Midnight" },
] as const;

function daySecToSlider(daySec: number): number {
  return (daySec - DAY_ORIGIN_SEC + 86_400) % 86_400;
}

function sliderToDaySec(slider: number): number {
  return (slider + DAY_ORIGIN_SEC) % 86_400;
}

export function sliderToRate(slider: number): number {
  const a = Math.abs(slider);
  if (a < DEADZONE) return 0;
  const u = (a - DEADZONE) / (SLIDER_MAX - DEADZONE);
  return Math.sign(slider) * RATE_MAX ** u;
}

export function rateToSlider(rate: number): number {
  if (rate === 0 || !Number.isFinite(rate)) return 0;
  const abs = Math.min(RATE_MAX, Math.max(1, Math.abs(rate)));
  const u = Math.log(abs) / Math.log(RATE_MAX);
  return Math.sign(rate) * (DEADZONE + u * (SLIDER_MAX - DEADZONE));
}

export type WallParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export function wallPartsFromMs(timeMs: number, zoneOffsetMs: number): WallParts {
  const local = new Date(timeMs + zoneOffsetMs);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
    second: local.getUTCSeconds(),
  };
}

function utcMsFromWall(p: WallParts): number {
  const ms = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second, 0);
  if (p.year < 0 || p.year > 99) return ms;
  const d = new Date(ms);
  d.setUTCFullYear(p.year);
  return d.getTime();
}

export function instantFromWall(p: WallParts, zoneOffsetMs: number): number {
  return utcMsFromWall(p) - zoneOffsetMs;
}

function wallCivilUtc(p: WallParts): Date {
  const d = new Date(0);
  d.setUTCFullYear(p.year, p.month - 1, p.day);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function applyBsYmd(p: WallParts, year: number, month: number, day: number): WallParts | null {
  const y = Math.min(BS_SUPPORTED_END_YEAR, Math.max(BS_OFFLINE_TABLE_START_YEAR, year));
  const m = ((month - 1 + 12) % 12) + 1;
  const length = getBSMonthLength(y, m);
  const ad = bsToAdOrNull(y, m, Math.min(Math.max(1, day), length));
  if (!ad) return null;
  return {
    ...p,
    year: ad.getUTCFullYear(),
    month: ad.getUTCMonth() + 1,
    day: ad.getUTCDate(),
  };
}

function stepBsField(p: WallParts, field: "year" | "month" | "day", delta: number): WallParts | null {
  const bs = adToBS(wallCivilUtc(p));
  if (field === "year") return applyBsYmd(p, bs.year + delta, bs.month, bs.day);
  if (field === "month") {
    const next = shiftBsMonth(bs.year, bs.month, delta);
    return applyBsYmd(p, next.year, next.month, bs.day);
  }
  let day = bs.day + delta;
  let { year, month } = bs;
  for (let i = 0; i < 24 && day > getBSMonthLength(year, month); i += 1) {
    day -= getBSMonthLength(year, month);
    const next = shiftBsMonth(year, month, 1);
    year = next.year;
    month = next.month;
  }
  for (let i = 0; i < 24 && day < 1; i += 1) {
    const prev = shiftBsMonth(year, month, -1);
    year = prev.year;
    month = prev.month;
    day += getBSMonthLength(year, month);
  }
  return applyBsYmd(p, year, month, day);
}

type Field = keyof WallParts;

function addField(p: WallParts, field: Field, delta: number): WallParts {
  const d = new Date(utcMsFromWall(p));
  if (p.year >= 0 && p.year <= 99) d.setUTCFullYear(p.year);
  if (field === "year") d.setUTCFullYear(d.getUTCFullYear() + delta);
  else if (field === "month") d.setUTCMonth(d.getUTCMonth() + delta);
  else if (field === "day") d.setUTCDate(d.getUTCDate() + delta);
  else if (field === "hour") d.setUTCHours(d.getUTCHours() + delta);
  else if (field === "minute") d.setUTCMinutes(d.getUTCMinutes() + delta);
  else d.setUTCSeconds(d.getUTCSeconds() + delta);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
  };
}

function pad2(n: number): string {
  return String(Math.trunc(n)).padStart(2, "0");
}

function periodIdAtHour(hour: number): (typeof DAY_PERIODS)[number]["id"] {
  if (hour >= 4 && hour < 10) return "morning";
  if (hour >= 10 && hour < 16) return "afternoon";
  if (hour >= 16 && hour < 19) return "evening";
  if (hour >= 19) return "moonlight";
  return "midnight";
}

type Props = {
  timeMs: number;
  zoneOffsetMs: number;
  timeRate: number;
  onClose: () => void;
  onApplyMs: (ms: number) => void;
  onTimeRate: (rate: number) => void;
  onTogglePlay: () => void;
  onResetRate: () => void;
};

export function SkyTimeSheet({
  timeMs,
  zoneOffsetMs,
  timeRate,
  onClose,
  onApplyMs,
  onTimeRate,
  onTogglePlay,
  onResetRate,
}: Props) {
  const { lang, digits } = useLocale();
  const pick = (ne: string, en: string) => bilingualText(lang, ne, en);
  const nepaliCal = lang !== "en";
  const parts = wallPartsFromMs(timeMs, zoneOffsetMs);
  const bs = nepaliCal ? adToBS(wallCivilUtc(parts)) : null;
  const paused = timeRate === 0;
  const playing = !paused;
  const absRate = Math.abs(timeRate);
  const daySec = parts.hour * 3600 + parts.minute * 60 + parts.second;
  const activePeriod = periodIdAtHour(parts.hour);

  const apply = (next: WallParts) => onApplyMs(instantFromWall(next, zoneOffsetMs));
  const step = (field: Field, delta: number) => {
    if (nepaliCal && (field === "year" || field === "month" || field === "day")) {
      const next = stepBsField(parts, field, delta);
      if (next) apply(next);
      return;
    }
    apply(addField(parts, field, delta));
  };

  const speedLabel = paused
    ? pick("रोकिएको", "Paused")
    : `${pick("गति", "Speed")} ×${timeRate < 0 ? "-" : ""}${digits(String(Math.round(absRate)))}`;

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label={pick("बन्द गर्नुहोस्", "Close")}
        className="absolute inset-0 cursor-default bg-black/40"
        onClick={onClose}
      />
      <div
        data-sky-controls
        className="relative mx-auto w-full max-w-lg rounded-t-3xl border border-white/12 bg-[#1c1c1e]/88 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 text-white shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/30" />

        <div className="flex items-end justify-center gap-0.5 xs:gap-1.5">
          <Stepper
            value={digits(String(bs ? bs.year : parts.year))}
            onUp={() => step("year", 1)}
            onDown={() => step("year", -1)}
            upLabel={pick("वर्ष बढाउनुहोस्", "Increase year")}
            downLabel={pick("वर्ष घटाउनुहोस्", "Decrease year")}
            wide
          />
          <Sep>/</Sep>
          <Stepper
            value={digits(pad2(bs ? bs.month : parts.month))}
            onUp={() => step("month", 1)}
            onDown={() => step("month", -1)}
            upLabel={pick("महिना बढाउनुहोस्", "Increase month")}
            downLabel={pick("महिना घटाउनुहोस्", "Decrease month")}
          />
          <Sep>/</Sep>
          <Stepper
            value={digits(pad2(bs ? bs.day : parts.day))}
            onUp={() => step("day", 1)}
            onDown={() => step("day", -1)}
            upLabel={pick("दिन बढाउनुहोस्", "Increase day")}
            downLabel={pick("दिन घटाउनुहोस्", "Decrease day")}
          />
          <span className="w-2 shrink-0 xs:w-3" />
          <Stepper
            value={digits(pad2(parts.hour))}
            onUp={() => step("hour", 1)}
            onDown={() => step("hour", -1)}
            upLabel={pick("घण्टा बढाउनुहोस्", "Increase hour")}
            downLabel={pick("घण्टा घटाउनुहोस्", "Decrease hour")}
          />
          <Sep>:</Sep>
          <Stepper
            value={digits(pad2(parts.minute))}
            onUp={() => step("minute", 1)}
            onDown={() => step("minute", -1)}
            upLabel={pick("मिनेट बढाउनुहोस्", "Increase minute")}
            downLabel={pick("मिनेट घटाउनुहोस्", "Decrease minute")}
          />
          <Sep>:</Sep>
          <Stepper
            value={digits(pad2(parts.second))}
            onUp={() => step("second", 1)}
            onDown={() => step("second", -1)}
            upLabel={pick("सेकेन्ड बढाउनुहोस्", "Increase second")}
            downLabel={pick("सेकेन्ड घटाउनुहोस्", "Decrease second")}
          />
        </div>

        <p className="mt-4 mb-1 text-center text-sm font-semibold tracking-wide text-white/90">
          {speedLabel}
        </p>
        <div className="flex items-center gap-2">
          <IconRound
            label={playing ? pick("रोक्नुहोस्", "Pause") : pick("चलाउनुहोस्", "Play")}
            onPress={onTogglePlay}
          >
            {playing ? <Pause className="size-5 fill-white" /> : <Play className="size-5 fill-white" />}
          </IconRound>
          <input
            type="range"
            min={-SLIDER_MAX}
            max={SLIDER_MAX}
            step={1}
            value={Math.round(rateToSlider(timeRate))}
            aria-label={pick("गति", "Speed")}
            className="sky-time-slider sky-time-slider--thin min-w-0 flex-1"
            onChange={(e) => onTimeRate(sliderToRate(Number(e.target.value)))}
          />
          <IconRound label={pick("वास्तविक गति", "Realtime speed")} onPress={onResetRate}>
            <RotateCcw className="size-5" />
          </IconRound>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <NavAction
            icon={<SkipBack className="size-6" />}
            label={pick("अघिल्लो रात", "Previous night")}
            onPress={() => onApplyMs(timeMs - 86_400_000)}
          />
          <NavAction
            icon={<History className="size-6" />}
            label={pick("अहिलेको समय", "Set time to now")}
            onPress={() => onApplyMs(Date.now())}
          />
          <NavAction
            icon={<SkipForward className="size-6" />}
            label={pick("अर्को रात", "Next night")}
            onPress={() => onApplyMs(timeMs + 86_400_000)}
          />
        </div>

        <div className="mt-4">
          <input
            type="range"
            min={0}
            max={86_399}
            step={1}
            value={daySecToSlider(daySec)}
            aria-label={pick("दिनको उज्यालो", "Daylight")}
            className="sky-time-slider sky-time-slider--day w-full"
            onChange={(e) => {
              const sec = sliderToDaySec(Number(e.target.value));
              apply({
                ...parts,
                hour: Math.floor(sec / 3600),
                minute: Math.floor((sec % 3600) / 60),
                second: sec % 60,
              });
            }}
          />
          <div className="relative mt-1.5 h-4">
            {DAY_PERIODS.map((band) => {
              const active = band.id === activePeriod;
              const edge = band.at <= 8 ? "left" : band.at >= 88 ? "right" : "center";
              return (
                <span
                  key={band.id}
                  className={cn(
                    "absolute top-0 text-[10px] leading-none whitespace-nowrap",
                    active ? "font-semibold text-white" : "font-medium text-white/55",
                    edge === "left" && "left-0",
                    edge === "right" && "right-0",
                    edge === "center" && "-translate-x-1/2",
                  )}
                  style={edge === "center" ? { left: `${band.at}%` } : undefined}
                >
                  {pick(band.ne, band.en)}
                </span>
              );
            })}
          </div>
        </div>

        <style>{`
          .sky-time-slider {
            -webkit-appearance: none;
            appearance: none;
            background: transparent;
            touch-action: none;
          }
          .sky-time-slider:focus { outline: none; }
          .sky-time-slider--thin {
            height: 22px;
          }
          .sky-time-slider--thin::-webkit-slider-runnable-track {
            height: 3px;
            border-radius: 999px;
            background: #5c5c5e;
          }
          .sky-time-slider--thin::-moz-range-track {
            height: 3px;
            border-radius: 999px;
            background: #5c5c5e;
          }
          .sky-time-slider--day {
            height: 32px;
          }
          .sky-time-slider--day::-webkit-slider-runnable-track {
            height: 14px;
            border-radius: 999px;
            background: ${DAYLIGHT_GRADIENT};
          }
          .sky-time-slider--day::-moz-range-track {
            height: 14px;
            border-radius: 999px;
            background: ${DAYLIGHT_GRADIENT};
          }
          .sky-time-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            margin-top: -7.5px;
            border-radius: 50%;
            border: none;
            background: #e8eef8;
            box-shadow: 0 0 0 1px rgba(0,0,0,0.35);
          }
          .sky-time-slider--day::-webkit-slider-thumb {
            margin-top: -2px;
            background: #fff6e0;
            box-shadow: 0 0 0 2px rgba(0,0,0,0.35);
          }
          .sky-time-slider::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border: none;
            border-radius: 50%;
            background: #e8eef8;
          }
          .sky-time-slider--day::-moz-range-thumb {
            background: #fff6e0;
          }
        `}</style>
      </div>
    </div>
  );
}

function Sep({ children }: { children: string }) {
  return (
    <span className="mb-[0.35rem] pb-0.5 text-lg font-semibold text-white/80 xs:text-xl">
      {children}
    </span>
  );
}

function Stepper({
  value,
  onUp,
  onDown,
  upLabel,
  downLabel,
  wide,
  tabular = true,
}: {
  value: string;
  onUp: () => void;
  onDown: () => void;
  upLabel: string;
  downLabel: string;
  wide?: boolean;
  tabular?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center", wide ? "min-w-[3.25rem]" : "min-w-[1.7rem]")}>
      <HoldButton label={upLabel} onStep={onUp}>
        <ChevronUp className="size-4 text-white" strokeWidth={2.5} />
      </HoldButton>
      <span
        className={cn(
          "select-none text-lg font-semibold leading-none tracking-wide xs:text-xl",
          tabular && "tabular-nums",
        )}
      >
        {value}
      </span>
      <HoldButton label={downLabel} onStep={onDown}>
        <ChevronDown className="size-4 text-white" strokeWidth={2.5} />
      </HoldButton>
    </div>
  );
}

function HoldButton({
  label,
  onStep,
  children,
}: {
  label: string;
  onStep: () => void;
  children: ReactNode;
}) {
  const hold = useRef(0);
  const repeat = useRef(0);
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  const stop = () => {
    window.clearTimeout(hold.current);
    window.clearInterval(repeat.current);
    hold.current = 0;
    repeat.current = 0;
  };

  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-7 items-center justify-center rounded-md text-white/90 hover:bg-white/10 active:bg-white/20"
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        onStepRef.current();
        hold.current = window.setTimeout(() => {
          repeat.current = window.setInterval(() => onStepRef.current(), 70);
        }, 380);
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
    >
      {children}
    </button>
  );
}

function IconRound({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      className="flex size-10 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10"
    >
      {children}
    </button>
  );
}

function NavAction({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="flex flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-white hover:bg-white/8"
    >
      {icon}
      <span className="text-center text-[11px] font-medium leading-tight text-white/90">{label}</span>
    </button>
  );
}
