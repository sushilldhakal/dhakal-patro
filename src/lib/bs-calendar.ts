import calendarData from "./bs-calendar-data.json"

export const BS_MONTH_NAMES = [
  "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra",
] as const

export const BS_MONTHS_NE = [
  "वैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज",
  "कात्तिक", "मंसिर", "पुष", "माघ", "फागुन", "चैत",
]

export const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export type BikramSambatDate = {
  year: number
  month: number
  day: number
  monthName: string
}

type BsMonthLengths = readonly [number, number, number, number, number, number, number, number, number, number, number, number]

export const BS_SUPPORTED_START_YEAR = calendarData.start_year
export const BS_SUPPORTED_END_YEAR = calendarData.end_year

function asMonthLengths(lengths: number[]): BsMonthLengths {
  if (lengths.length !== 12) throw new Error(`BS month length row must have 12 entries, got ${lengths.length}`)
  return lengths as unknown as BsMonthLengths
}

const BS_YEAR_MONTH_LENGTHS: Record<number, BsMonthLengths> = Object.fromEntries(
  Object.entries(calendarData.month_lengths).map(([year, lengths]) => [Number(year), asMonthLengths(lengths)])
)

const BAISAKH_1_AD: Record<number, string> = Object.fromEntries(
  Object.entries(calendarData.baisakh_1_ad).map(([year, iso]) => [Number(year), iso])
)

type BsMonthStart = { year: number; month: number; adMs: number }

function parseAdDateOnly(isoDate: string): number {
  const parts = isoDate.split("-").map(Number)
  const y = parts[0] ?? 0
  const m = parts[1] ?? 1
  const d = parts[2] ?? 1
  return Date.UTC(y, m - 1, d)
}

function localDateFromUtcMs(ms: number): Date {
  const date = new Date(ms)
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

function buildMonthStarts(): BsMonthStart[] {
  const starts: BsMonthStart[] = []
  for (let year = BS_SUPPORTED_START_YEAR; year <= BS_SUPPORTED_END_YEAR; year += 1) {
    const baisakh1 = BAISAKH_1_AD[year]
    if (!baisakh1) continue
    let cursor = parseAdDateOnly(baisakh1)
    for (let month = 1; month <= 12; month += 1) {
      starts.push({ year, month, adMs: cursor })
      const days = BS_YEAR_MONTH_LENGTHS[year]?.[month - 1] ?? 30
      cursor += days * 86_400_000
    }
  }
  return starts
}

const BS_MONTH_STARTS = buildMonthStarts()

function normalizeToUtcDate(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

function monthStartFor(year: number, month: number): BsMonthStart | undefined {
  return BS_MONTH_STARTS.find((s) => s.year === year && s.month === month)
}

export function getBSMonthLength(year: number, month: number): number {
  const monthLength = BS_YEAR_MONTH_LENGTHS[year]?.[month - 1]
  if (monthLength) return monthLength
  const current = monthStartFor(year, month)
  if (!current) return 30
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const next =
    monthStartFor(nextYear, nextMonth) ??
    (nextMonth === 1 && BAISAKH_1_AD[nextYear]
      ? { year: nextYear, month: nextMonth, adMs: parseAdDateOnly(BAISAKH_1_AD[nextYear]) }
      : undefined)
  if (!next) return 30
  return Math.round((next.adMs - current.adMs) / 86_400_000)
}

export function bsToAD(year: number, month: number, day: number): Date {
  const monthStart = monthStartFor(year, month) ?? BS_MONTH_STARTS[0]
  if (!monthStart) return new Date(year, month - 1, day)
  const monthLength = getBSMonthLength(year, month)
  const safeDay = Math.min(Math.max(1, day), monthLength)
  return localDateFromUtcMs(monthStart.adMs + (safeDay - 1) * 86_400_000)
}

export function adToBS(date: Date): BikramSambatDate {
  const adMs = normalizeToUtcDate(date)
  const fallback = BS_MONTH_STARTS[0]
  if (!fallback) return { year: BS_SUPPORTED_START_YEAR, month: 1, day: 1, monthName: BS_MONTH_NAMES[0] }
  let match = fallback
  for (const start of BS_MONTH_STARTS) {
    if (start.adMs <= adMs) match = start
    else break
  }
  const day = Math.max(1, Math.floor((adMs - match.adMs) / 86_400_000) + 1)
  const monthName = BS_MONTH_NAMES[match.month - 1] ?? BS_MONTH_NAMES[0]
  return { year: match.year, month: match.month, day, monthName }
}

export function formatBSDate(date: Date): string {
  const bs = adToBS(date)
  return `${bs.monthName} ${bs.day}, ${bs.year}`
}

export function formatBSMonthYear(date: Date): string {
  const bs = adToBS(date)
  return `${bs.monthName} ${bs.year}`
}

export function getBSMonthADRange(date: Date): { start: Date; end: Date } {
  const bs = adToBS(date)
  return {
    start: bsToAD(bs.year, bs.month, 1),
    end: bsToAD(bs.year, bs.month, getBSMonthLength(bs.year, bs.month)),
  }
}

export function getCurrentBs(): { year: number; month: number } {
  const bs = adToBS(new Date())
  return { year: bs.year, month: bs.month }
}

export function bsMonthLabel(month: number): string {
  return `${BS_MONTHS_NE[month - 1]} (${BS_MONTH_NAMES[month - 1]})`
}
