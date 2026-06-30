import { useCallback, useState } from "react";
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/browser";

export type PanchangaDataMode = "udaya" | "instant";

const MODE_KEY = "dhakalPatroPanchDataMode";
const CLOCK_KEY = "dhakalPatroPanchClock";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function defaultClockForTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = parts.find((p) => p.type === "hour")?.value ?? "12";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${pad2(Number(h) % 24)}:${m}`;
}

export function usePanchangaMode(
  defaultTimezone: string,
  initial?: { mode?: PanchangaDataMode; clock?: string }
) {
  // URL-supplied mode/clock (shared link) seed first render; otherwise we fall
  // back to the persisted preference.
  const [mode, setModeState] = useState<PanchangaDataMode>(() => {
    if (initial?.mode) return initial.mode;
    const saved = getLocalStorageItem(MODE_KEY);
    return saved === "instant" ? "instant" : "udaya";
  });

  const [clock, setClockState] = useState(() => {
    if (initial?.clock) return initial.clock;
    const saved = getLocalStorageItem(CLOCK_KEY);
    return saved ?? defaultClockForTimezone(defaultTimezone);
  });

  const setMode = useCallback(
    (next: PanchangaDataMode) => {
      setModeState(next);
      setLocalStorageItem(MODE_KEY, next);
      if (next === "instant") {
        const nowClock = defaultClockForTimezone(defaultTimezone);
        setClockState(nowClock);
        setLocalStorageItem(CLOCK_KEY, nowClock);
      }
    },
    [defaultTimezone]
  );

  const setClock = useCallback((next: string) => {
    setClockState(next);
    setLocalStorageItem(CLOCK_KEY, next);
  }, []);

  return { mode, setMode, clock, setClock };
}
