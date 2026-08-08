/** Wall-clock parts for a timezone (24h). */
export function getZonedTimeParts(
  date: Date,
  timeZone: string
): { hour: number; minute: number; second: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  let hour = read("hour");
  if (hour === 24) hour = 0;

  return { hour, minute: read("minute"), second: read("second") };
}

/**
 * How far ahead of UT the zone stands at `date`, in ms.
 *
 * Read off the formatter rather than a table: it is the only thing that knows
 * what the offset actually was on that date, DST and historic shifts included.
 */
function zoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  let hour = read("hour");
  if (hour === 24) hour = 0;

  const wallAsUtc = Date.UTC(read("year"), read("month") - 1, read("day"), hour, read("minute"), read("second"));
  // Whole seconds on both sides, so a fractional input cannot leak into the offset.
  return wallAsUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * A wall-clock reading in some place → the instant it names.
 *
 * The inverse of {@link getZonedTimeParts}, and the thing to reach for whenever
 * a user picks "10:30 in Kathmandu": `new Date(y, m, d, h, min)` would build
 * 10:30 on *this device's* clock, which is a different moment entirely for
 * anyone outside that zone.
 *
 * Solved by iteration because the offset depends on the answer: guess the
 * instant by reading the wall time as UT, then correct by the offset in force
 * there. A second pass settles the DST edges, where the first guess can land on
 * the wrong side of a jump.
 */
export function zonedWallTimeToInstant(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const first = wallAsUtc - zoneOffsetMs(new Date(wallAsUtc), timeZone);
  return new Date(wallAsUtc - zoneOffsetMs(new Date(first), timeZone));
}

/** Minutes since local midnight in the given timezone. */
export function minutesSinceMidnightInTimezone(
  date: Date,
  timeZone: string,
  includeSeconds = false
): number {
  const { hour, minute, second } = getZonedTimeParts(date, timeZone);
  return hour * 60 + minute + (includeSeconds ? second / 60 : 0);
}

/** YYYY-MM-DD for "today" in the given timezone. */
export function todayAdStringInTimezone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function resolveTimeZone(
  apiTimezone?: string | null,
  locationTimezone?: string | null
): string {
  return (
    apiTimezone ??
    locationTimezone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
}
