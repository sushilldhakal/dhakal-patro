"use client"

import * as React from "react"
import type { DayButtonProps, Formatters, Labels } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { createNepaliDateLib } from "@/lib/nepali-date-lib"
import {
  adToBS, BS_MONTH_NAMES, formatBSDate, formatBSMonthYear, getBSMonthADRange,
} from "@/lib/bs-calendar"
import { cn } from "@/lib/utils"

// ── Formatters & labels ────────────────────────────────────────────────────

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const
const WEEKDAY_ARIA = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const

function formatGregorianMonthSpan(date: Date) {
  const { start, end } = getBSMonthADRange(date)
  const fmt = new Intl.DateTimeFormat("en", { month: "short" })
  const s = fmt.format(start)
  const e = fmt.format(end)
  return s === e ? s : `${s}–${e}`
}

function dualCaption(date: Date) {
  return `${formatBSMonthYear(date)} / ${formatGregorianMonthSpan(date)}`
}

const nepaliFormatters: Partial<Formatters> = {
  formatCaption: (date) => dualCaption(date),
  formatDay: (date) => String(adToBS(date).day),
  formatMonthDropdown: (date) => {
    const bsMonth = BS_MONTH_NAMES[adToBS(date).month - 1] ?? BS_MONTH_NAMES[0]
    return `${bsMonth} / ${formatGregorianMonthSpan(date)}`
  },
  formatWeekdayName: (date: Date) => WEEKDAY_LABELS[date.getDay()] ?? "",
  formatYearDropdown: (date: Date) => String(adToBS(date).year),
}

const nepaliLabels: Partial<Labels> = {
  labelGrid: (date) => `${formatBSMonthYear(date)} calendar`,
  labelGridcell: (date) => formatBSDate(date),
  labelDayButton: (date, modifiers) => {
    const selected = modifiers.selected ? ", selected" : ""
    const today = modifiers.today ? ", today" : ""
    return `${formatBSDate(date)}${selected}${today}`
  },
  labelMonthDropdown: () => "Choose Bikram Sambat month",
  labelYearDropdown: () => "Choose Bikram Sambat year",
  labelNext: () => "Next Bikram Sambat month",
  labelPrevious: () => "Previous Bikram Sambat month",
  labelWeekday: (date) => WEEKDAY_ARIA[date.getDay()] ?? "",
}

// ── DayButton ──────────────────────────────────────────────────────────────

function NepaliDayButton({ day, modifiers, className, ...props }: DayButtonProps) {
  const bs = adToBS(day.date)
  const adDay = day.date.getDate()

  return (
    <button
      type="button"
      className={cn(
        "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col items-center justify-center gap-0.5 rounded-(--cell-radius) border-0 p-0 leading-none font-normal",
        "hover:bg-accent hover:text-accent-foreground",
        "data-[selected-single=true]:bg-secondary data-[selected-single=true]:text-secondary-foreground",
        "data-[today=true]:bg-muted data-[today=true]:text-foreground",
        "data-[outside=true]:text-muted-foreground data-[outside=true]:opacity-50",
        "data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed",
        className,
      )}
      data-selected-single={modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle}
      data-today={modifiers.today}
      data-outside={modifiers.outside}
      data-disabled={modifiers.disabled}
      {...props}
    >
      <span className="text-sm font-semibold leading-none">{bs.day}</span>
      <span className={cn(
        "text-sm leading-none opacity-50",
        modifiers.selected && "opacity-80",
      )}>
        {adDay}
      </span>
    </button>
  )
}

// ── NepaliCalendar ─────────────────────────────────────────────────────────

export type NepaliCalendarProps = React.ComponentProps<typeof Calendar> & {
  showGregorianDates?: boolean
}

export function NepaliCalendar({
  classNames,
  components,
  formatters,
  labels,
  showGregorianDates = true,
  ...props
}: NepaliCalendarProps) {
  const dateLib = React.useMemo(() => createNepaliDateLib(), [])

  return (
    <Calendar
      dateLib={dateLib}
      classNames={{
        month_grid: "w-full border-collapse",
        months: "w-full",
        month: "w-full",
        ...classNames,
      }}
      components={{
        DayButton: showGregorianDates
          ? (p) => <NepaliDayButton {...p} />
          : components?.DayButton,
        ...components,
      }}
      formatters={{ ...nepaliFormatters, ...formatters }}
      labels={{ ...nepaliLabels, ...labels }}
      {...props}
    />
  )
}
