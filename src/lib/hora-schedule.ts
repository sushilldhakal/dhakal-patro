import {
  HORA_CYCLE,
  HORA_DEVA,
  type HoraPlanetKey,
} from "@/lib/hora-data";

export type HoraSlot = {
  index: number;
  phase: "दिन" | "रात";
  planet: HoraPlanetKey;
  planetNe: string;
  startMin: number;
  endMin: number;
};

const WEEKDAY_LORDS: HoraPlanetKey[] = [
  "ravi",
  "soma",
  "mangala",
  "budha",
  "guru",
  "shukra",
  "shani",
];

function parseClockToMinutes(time?: string | null): number | null {
  if (!time) return null;
  const m = time.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function cycleLord(start: HoraPlanetKey, offset: number): HoraPlanetKey {
  const base = HORA_CYCLE.indexOf(start);
  return HORA_CYCLE[(base + offset) % HORA_CYCLE.length]!;
}

const HORA_AUSPICIOUS = new Set<HoraPlanetKey>([
  "ravi",
  "soma",
  "budha",
  "guru",
  "shukra",
]);

export function horaQuality(planet: HoraPlanetKey): "शुभ" | "अशुभ" {
  return HORA_AUSPICIOUS.has(planet) ? "शुभ" : "अशुभ";
}

export function horaTone(planet: HoraPlanetKey): "good" | "bad" {
  return HORA_AUSPICIOUS.has(planet) ? "good" : "bad";
}

export function buildHoraSchedule(
  sunrise?: string | null,
  sunset?: string | null,
  jsWeekday?: number,
): HoraSlot[] {
  const sunriseMin = parseClockToMinutes(sunrise);
  const sunsetMin = parseClockToMinutes(sunset);
  if (sunriseMin == null || sunsetMin == null || jsWeekday == null) return [];

  const dayLen = sunsetMin - sunriseMin;
  const nightLen = 24 * 60 - dayLen;
  if (dayLen <= 0 || nightLen <= 0) return [];

  const dayHoraLen = dayLen / 12;
  const nightHoraLen = nightLen / 12;
  const startLord = WEEKDAY_LORDS[((jsWeekday % 7) + 7) % 7]!;
  const slots: HoraSlot[] = [];

  for (let i = 0; i < 12; i++) {
    const planet = cycleLord(startLord, i);
    slots.push({
      index: i + 1,
      phase: "दिन",
      planet,
      planetNe: HORA_DEVA[planet],
      startMin: sunriseMin + i * dayHoraLen,
      endMin: sunriseMin + (i + 1) * dayHoraLen,
    });
  }

  for (let i = 0; i < 12; i++) {
    const planet = cycleLord(startLord, 12 + i);
    slots.push({
      index: i + 1,
      phase: "रात",
      planet,
      planetNe: HORA_DEVA[planet],
      startMin: sunsetMin + i * nightHoraLen,
      endMin: sunsetMin + (i + 1) * nightHoraLen,
    });
  }

  return slots;
}

export function formatMinutesClock(min: number): string {
  const wrapped = ((min % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(wrapped / 60);
  const m = Math.round(wrapped % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
