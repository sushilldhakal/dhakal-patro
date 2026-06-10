import type { DateLib } from "react-day-picker"
import { adToBS, bsToAD, getBSMonthLength } from "./bs-calendar"

function bsMonthIndex(date: Date) {
  const bs = adToBS(date)
  return bs.year * 12 + bs.month - 1
}

function fromBSMonthIndex(monthIndex: number, day: number) {
  const year = Math.floor(monthIndex / 12)
  const month = (monthIndex % 12) + 1
  return bsToAD(year, month, day)
}

function toDate(value: Date | number | string) {
  return value instanceof Date ? value : new Date(value)
}

export function createNepaliDateLib(): Partial<typeof DateLib.prototype> {
  return {
    newDate: (year, monthIndex, date) => bsToAD(year, monthIndex + 1, date),
    getMonth: (date) => adToBS(date).month - 1,
    getYear: (date) => adToBS(date).year,
    addMonths: (date, amount) => {
      const bs = adToBS(date)
      const targetMonthIndex = bsMonthIndex(date) + amount
      const targetYear = Math.floor(targetMonthIndex / 12)
      const targetMonth = (targetMonthIndex % 12) + 1
      const day = Math.min(bs.day, getBSMonthLength(targetYear, targetMonth))
      return fromBSMonthIndex(targetMonthIndex, day)
    },
    addYears: (date, amount) => {
      const bs = adToBS(date)
      const year = bs.year + amount
      const day = Math.min(bs.day, getBSMonthLength(year, bs.month))
      return bsToAD(year, bs.month, day)
    },
    differenceInCalendarMonths: (dateLeft, dateRight) =>
      bsMonthIndex(dateLeft) - bsMonthIndex(dateRight),
    eachMonthOfInterval: (interval) => {
      const months: Date[] = []
      const start = bsMonthIndex(toDate(interval.start))
      const end = bsMonthIndex(toDate(interval.end))
      for (let index = start; index <= end; index += 1) {
        months.push(fromBSMonthIndex(index, 1))
      }
      return months
    },
    eachYearOfInterval: (interval) => {
      const startYear = adToBS(toDate(interval.start)).year
      const endYear = adToBS(toDate(interval.end)).year
      const years: Date[] = []
      for (let year = startYear; year <= endYear; year += 1) {
        years.push(bsToAD(year, 1, 1))
      }
      return years
    },
    endOfMonth: (date) => {
      const bs = adToBS(date)
      return bsToAD(bs.year, bs.month, getBSMonthLength(bs.year, bs.month))
    },
    endOfYear: (date) => {
      const bs = adToBS(date)
      return bsToAD(bs.year, 12, getBSMonthLength(bs.year, 12))
    },
    format: (date, formatStr) => {
      const bs = adToBS(date)
      if (formatStr.includes("d")) return String(bs.day)
      if (formatStr.includes("MMMM") || formatStr.includes("LLLL")) return bs.monthName
      if (formatStr.includes("MMM") || formatStr.includes("LLL")) return bs.monthName.slice(0, 3)
      if (formatStr.includes("M") || formatStr.includes("L")) return String(bs.month)
      if (formatStr.includes("y")) return String(bs.year)
      return `${bs.monthName} ${bs.day}, ${bs.year}`
    },
    isSameMonth: (dateLeft, dateRight) => bsMonthIndex(dateLeft) === bsMonthIndex(dateRight),
    isSameYear: (dateLeft, dateRight) => adToBS(dateLeft).year === adToBS(dateRight).year,
    setMonth: (date, month) => {
      const bs = adToBS(date)
      const day = Math.min(bs.day, getBSMonthLength(bs.year, month + 1))
      return bsToAD(bs.year, month + 1, day)
    },
    setYear: (date, year) => {
      const bs = adToBS(date)
      const day = Math.min(bs.day, getBSMonthLength(year, bs.month))
      return bsToAD(year, bs.month, day)
    },
    startOfMonth: (date) => {
      const bs = adToBS(date)
      return bsToAD(bs.year, bs.month, 1)
    },
    startOfYear: (date) => {
      const bs = adToBS(date)
      return bsToAD(bs.year, 1, 1)
    },
  }
}
