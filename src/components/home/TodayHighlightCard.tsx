import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Sunrise, Sunset } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CalendarMoonPhaseIcon } from "@/components/panchanga/CalendarMoonPhaseIcon";
import type { CalendarMonthContext } from "@/components/CalendarView";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { bilingualText, useLocale } from "@/i18n/locale";
import {
  fetchSaitMonthAll,
  saitMonthAllKey,
  type CalendarDay,
  type PanchangaDay,
} from "@/lib/api";
import {
  AD_MONTH_NAMES,
  AD_MONTH_NAMES_NE,
  BS_MONTH_NAMES,
  BS_MONTHS_NE,
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  adToBS,
} from "@/lib/bs-calendar";
import { civilIsoWeekday, parseCivilIsoToDate } from "@/lib/patro-day";
import {
  formatClockNepali,
  formatNepalSambatDisplay,
  formatPakshaLabel,
  formatTimeShort,
  getSunrise,
  getSunset,
} from "@/lib/panchanga-format";
import {
  formatPatroDayCrossEraSubtitle,
  patroHeadlineDigits,
} from "@/lib/patro-headline-subtitle";
import { SAIT_CATEGORIES } from "@/lib/sait-data";
import {
  tithiIndexFromCalendarDay,
  tithiIndexFromPanchanga,
} from "@/lib/tithi-wheel-data";
import { currentPatroDayLinkSearch, patroYearLinkSearch } from "@/lib/url-state";
import { cn } from "@/lib/utils";

const WEEKDAY_NE = [
  "आइतबार",
  "सोमबार",
  "मङ्गलबार",
  "बुधबार",
  "बिहीबार",
  "शुक्रबार",
  "शनिबार",
] as const;

const WEEKDAY_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

type Props = {
  selectedDay: CalendarDay | null;
  selectedAdDate: string;
  todayAd: string;
  monthContext: CalendarMonthContext;
  location: PanchangaLocation;
  p?: PanchangaDay;
  className?: string;
};

function moonPhasePhrase(index: number, lang: string): string {
  if (index === 14) return bilingualText(lang, "पूर्णिमा", "Full moon");
  if (index === 29) return bilingualText(lang, "औंसी", "New moon");
  if (index >= 6 && index <= 8) return bilingualText(lang, "बढ्दो अर्धचन्द्र", "Waxing half moon");
  if (index >= 21 && index <= 23) return bilingualText(lang, "घट्दो अर्धचन्द्र", "Waning half moon");
  if (index < 14) return bilingualText(lang, "बढ्दो चन्द्र", "Waxing moon");
  return bilingualText(lang, "घट्दो चन्द्र", "Waning moon");
}

function clockLabel(
  raw: string | undefined,
  lang: string,
  digits: (value: string | number) => string,
): string | undefined {
  if (!raw) return undefined;
  const short = formatTimeShort(raw) ?? raw;
  if (lang.slice(0, 2) === "en") return short;
  return formatClockNepali(short) ?? digits(short);
}

/**
 * Mobile-only summary directly under the calendar: the selected day's
 * festival, tithi, moon, sunrise and sunset, plus any sait that falls on it.
 * Desktop keeps the sidebar panchanga panel.
 */
export function TodayHighlightCard({
  selectedDay,
  selectedAdDate,
  todayAd,
  monthContext,
  location,
  p,
  className,
}: Props) {
  const { t } = useTranslation();
  const { lang, digits } = useLocale();
  const isToday = selectedAdDate === todayAd;

  const fallbackBs = useMemo(() => {
    try {
      return adToBS(parseCivilIsoToDate(selectedAdDate));
    } catch {
      return null;
    }
  }, [selectedAdDate]);

  const vikram = p?.date_parts?.vikram;
  const bsFromApi =
    p?.bs_date && typeof p.bs_date === "object"
      ? p.bs_date
      : vikram?.year && vikram.month && vikram.day
        ? { year: vikram.year, month: vikram.month, day: vikram.day }
        : null;
  const bs = bsFromApi ?? fallbackBs;

  const dayNumber = monthContext.isAdCalendar
    ? (selectedDay && !selectedDay.outsideMonth ? selectedDay.day : undefined) ??
      Number(selectedAdDate.slice(8, 10))
    : (bs?.day ?? selectedDay?.day);

  const monthIndex = Math.max(
    0,
    (monthContext.isAdCalendar ? monthContext.adMonth : (bs?.month ?? monthContext.month)) - 1,
  );
  const monthName = monthContext.isAdCalendar
    ? bilingualText(lang, AD_MONTH_NAMES_NE[monthIndex], AD_MONTH_NAMES[monthIndex])
    : bilingualText(lang, BS_MONTHS_NE[monthIndex], BS_MONTH_NAMES[monthIndex]);
  const yearNumber = monthContext.isAdCalendar
    ? monthContext.adYear
    : (bs?.year ?? monthContext.year);

  const weekdayIndex = civilIsoWeekday(selectedAdDate);
  const weekday = bilingualText(
    lang,
    selectedDay?.weekday_ne ?? WEEKDAY_NE[weekdayIndex],
    selectedDay?.weekday_en ?? WEEKDAY_EN[weekdayIndex],
  );

  const crossEraLine = formatPatroDayCrossEraSubtitle(
    p?.date_ad ?? selectedAdDate,
    monthContext.isAdCalendar ? "ad" : "bs",
    lang,
    patroHeadlineDigits(lang),
  );

  const nsLabel = p ? formatNepalSambatDisplay(p, lang) : undefined;

  const festivals = useMemo(() => {
    const fromApi = (p?.festivals ?? [])
      .map((fest) =>
        bilingualText(lang, fest.name_ne ?? fest.name, fest.name_en ?? fest.name ?? fest.name_ne, ""),
      )
      .map((name) => name.trim())
      .filter(Boolean);
    if (fromApi.length) return fromApi.slice(0, 3);
    return (selectedDay?.festivals ?? []).map((name) => name.trim()).filter(Boolean).slice(0, 3);
  }, [p?.festivals, selectedDay?.festivals, lang]);

  const tithi = bilingualText(
    lang,
    p?.tithi?.name_ne ?? selectedDay?.tithi_ne ?? selectedDay?.tithi,
    p?.tithi?.name ?? selectedDay?.tithi ?? selectedDay?.tithi_ne,
    "",
  );
  const paksha = formatPakshaLabel(p, lang, selectedDay?.paksha_ne, selectedDay?.paksha) ?? "";
  const nakshatra = bilingualText(
    lang,
    p?.nakshatra?.name_ne ?? selectedDay?.nakshatra_ne,
    p?.nakshatra?.name ?? selectedDay?.nakshatra,
    "",
  );

  const specialTitle = festivals.length
    ? festivals.join(" / ")
    : tithi || bilingualText(lang, "यस दिनको पञ्चाङ्ग", "This day's panchanga");
  const pakshaShort = (() => {
    const stripped = paksha.replace(/\s*पक्ष/g, "").replace(/\s*paksha/gi, "").trim();
    if (monthName && stripped.toLowerCase().startsWith(monthName.toLowerCase())) {
      return stripped.slice(monthName.length).trim();
    }
    return stripped;
  })();
  const specialSubtitle = [monthName, pakshaShort, festivals.length ? tithi : nakshatra]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" · ");

  const tithiIndex = p
    ? tithiIndexFromPanchanga(p)
    : selectedDay
      ? tithiIndexFromCalendarDay(selectedDay)
      : undefined;
  const phaseLabel = tithiIndex != null ? moonPhasePhrase(tithiIndex, lang) : undefined;

  const sunrise = clockLabel((p ? getSunrise(p) : undefined) ?? selectedDay?.sunrise, lang, digits);
  const sunset = clockLabel((p ? getSunset(p) : undefined) ?? selectedDay?.sunset, lang, digits);

  const saitEnabled =
    bs != null && bs.year >= BS_SUPPORTED_START_YEAR && bs.year <= BS_SUPPORTED_END_YEAR;
  const saitQ = useQuery({
    queryKey: saitMonthAllKey(bs?.year ?? 0, bs?.month ?? 0),
    queryFn: () => fetchSaitMonthAll(bs!.year, bs!.month),
    enabled: saitEnabled,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  const todaySait = useMemo(() => {
    if (!bs || !saitQ.data) return [];
    return SAIT_CATEGORIES.filter((cat) => (saitQ.data.categories[cat.id] ?? []).includes(bs.day));
  }, [bs, saitQ.data]);

  const daySearch = currentPatroDayLinkSearch(location, selectedAdDate);

  return (
    <div id="home-today-highlight" className={cn("mx-2.5 mt-3 flex flex-col gap-2.5 md:hidden", className)}>
      <Link
        to="/panchanga"
        search={daySearch}
        className="block rounded-2xl border border-border bg-card px-4 py-4 text-inherit no-underline shadow-sm transition-colors hover:border-secondary/35"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-[3.4rem] pt-0.5 text-[2.75rem] font-bold leading-none text-danger">
            {dayNumber != null ? digits(dayNumber) : "—"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="text-base font-bold leading-tight text-foreground">
                {monthName} {digits(yearNumber)}
              </div>
              <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">{weekday}</div>
            <div className="text-sm text-muted-foreground">{crossEraLine}</div>
            {nsLabel ? <div className="mt-0.5 text-xs text-muted-foreground">{nsLabel}</div> : null}
          </div>
        </div>

        <div className="mt-3.5 border-t border-border pt-3">
          <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
            {isToday
              ? bilingualText(lang, "आज विशेष", "Special today")
              : bilingualText(lang, "यस दिनको विशेष", "Special this day")}
          </div>
          <div className="mt-1 text-base font-bold leading-snug text-danger">{specialTitle}</div>
          {specialSubtitle ? (
            <div className="mt-0.5 text-sm text-muted-foreground">{specialSubtitle}</div>
          ) : null}

          {phaseLabel && tithiIndex != null ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-foreground">
              <CalendarMoonPhaseIcon tithiIndex={tithiIndex} className="size-6" title={phaseLabel} />
              <span>{phaseLabel}</span>
            </div>
          ) : null}

          {sunrise || sunset ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground">
              {sunrise ? (
                <span className="inline-flex items-center gap-1.5">
                  <Sunrise className="size-4 text-warning" aria-hidden />
                  <span className="font-num">{sunrise}</span>
                </span>
              ) : null}
              {sunset ? (
                <span className="inline-flex items-center gap-1.5">
                  <Sunset className="size-4 text-warning" aria-hidden />
                  <span className="font-num">{sunset}</span>
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </Link>

      <section className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-sm font-bold text-foreground">
            {bilingualText(lang, "यस दिनको साइतहरू", "Sait this day")}
          </h2>
          <button
            type="button"
            className="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-danger"
            onClick={() => {
              document.getElementById("home-sait-links")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
          >
            {bilingualText(lang, "सबै हेर्नुहोस्", "See all")}
          </button>
        </div>

        {saitQ.isLoading ? (
          <div className="mt-2 h-5 w-28 animate-pulse rounded bg-muted" />
        ) : saitQ.isError ? (
          <p className="mb-0 mt-2 text-sm text-muted-foreground">{t("sait.no_data")}</p>
        ) : todaySait.length ? (
          <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
            {todaySait.map((cat) => (
              <li key={cat.id}>
                <Link
                  to="/sait/$category"
                  params={{ category: cat.id }}
                  search={bs ? patroYearLinkSearch(location, bs.year, "bs") : undefined}
                  className="text-sm font-medium text-foreground no-underline hover:text-secondary"
                >
                  {t(`sait.categories.${cat.id}`)}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-0 mt-2 text-sm text-muted-foreground">
            {bilingualText(lang, "यस दिन कुनै साइत छैन", "No sait on this day")}
          </p>
        )}
      </section>
    </div>
  );
}
