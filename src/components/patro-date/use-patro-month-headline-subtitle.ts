import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { usePatroDisplayLocale } from "@/hooks/use-patro-display-locale";
import type { Era, Language } from "@/lib/era";
import { fetchMonthCalendar, locationCacheKey } from "@/lib/api";
import { isGregorianEraBrowse } from "./patro-month-labels";
import {
  formatPatroAdRangeHeadlineSubtitle,
  formatPatroMonthCrossEraSubtitle,
} from "@/lib/patro-headline-subtitle";
import { canonicalCivilIso } from "@/lib/patro-day";

export function usePatroMonthHeadlineSubtitle(
  era: Era,
  year: number,
  month: number,
  location: PanchangaLocation | undefined,
  override?: string | null,
  displayLanguage?: Language,
): string | undefined {
  const { lang, digits } = usePatroDisplayLocale(displayLanguage);

  const local = useMemo(
    () => formatPatroMonthCrossEraSubtitle(era, year, month, lang, digits),
    [era, year, month, lang, digits],
  );

  const needsApi =
    (override == null || override === "") &&
    !local &&
    !isGregorianEraBrowse(era);

  const monthQ = useQuery({
    queryKey: [
      "patro-headline-month",
      era,
      year,
      month,
      locationCacheKey(location?.params),
    ] as const,
    queryFn: () =>
      fetchMonthCalendar(year, month, location?.params, { era, full: false }),
    enabled: needsApi,
    staleTime: 1000 * 60 * 30,
  });

  return useMemo(() => {
    if (override != null && override !== "") return override;
    if (local) return local;
    const data = monthQ.data;
    if (data?.month_start_ad && data.calendar?.length) {
      const first = canonicalCivilIso(data.month_start_ad);
      const lastRaw = data.calendar[data.calendar.length - 1]?.date_ad;
      if (lastRaw) {
        return formatPatroAdRangeHeadlineSubtitle(
          first,
          canonicalCivilIso(lastRaw),
          lang,
          digits,
        );
      }
    }
    if (!data?.calendar?.length) return undefined;
    const first = data.calendar[0]!.date_ad;
    const last = data.calendar[data.calendar.length - 1]!.date_ad;
    if (!first || !last) return undefined;
    return formatPatroAdRangeHeadlineSubtitle(
      canonicalCivilIso(first),
      canonicalCivilIso(last),
      lang,
      digits,
    );
  }, [override, local, monthQ.data, lang, digits]);
}
