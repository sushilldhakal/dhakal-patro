import { useCallback, useState } from "react";

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

export function usePanchangaMode(defaultTimezone: string) {
  const [mode, setModeState] = useState<PanchangaDataMode>(() => {
    const saved = localStorage.getItem(MODE_KEY);
    return saved === "instant" ? "instant" : "udaya";
  });

  const [clock, setClockState] = useState(() => {
    const saved = localStorage.getItem(CLOCK_KEY);
    return saved ?? defaultClockForTimezone(defaultTimezone);
  });

  const setMode = useCallback(
    (next: PanchangaDataMode) => {
      setModeState(next);
      localStorage.setItem(MODE_KEY, next);
      if (next === "instant") {
        const nowClock = defaultClockForTimezone(defaultTimezone);
        setClockState(nowClock);
        localStorage.setItem(CLOCK_KEY, nowClock);
      }
    },
    [defaultTimezone]
  );

  const setClock = useCallback((next: string) => {
    setClockState(next);
    localStorage.setItem(CLOCK_KEY, next);
  }, []);

  return { mode, setMode, clock, setClock };
}
