/**
 * Patro date navigation — three variants, one core implementation.
 *
 * - {@link PatroMonthYearNav} — month + year (home, month browse)
 * - {@link PatroDayTimeNav} — day + month + year, optional time (panchanga)
 * - {@link PatroYearNav} — year only (graha yearly pages)
 */
export { PatroDateNavCore, type PatroDateNavCoreProps } from "./PatroDateNavCore";
export { PatroMonthYearNav, type PatroMonthYearNavProps } from "./PatroMonthYearNav";
export { PatroDayTimeNav, type PatroDayTimeNavProps } from "./PatroDayTimeNav";
export { PatroYearNav, type PatroYearNavProps } from "./PatroYearNav";

export {
  PATRO_BS_YEAR_OPTIONS,
  PATRO_AD_YEAR_OPTIONS,
  buildBsDayOptions,
  pickBsDate,
  isAtMinBsDay,
  isAtMaxBsDay,
  clampBsYear,
} from "@/lib/patro-date-options";
