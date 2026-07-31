import { useEffect, useMemo } from "react";
import type { NavigateOptions } from "@tanstack/react-router";
import type { PatroMonthBrowseSearch, PatroYearBrowseSearch } from "@/lib/patro-era";
import {
  buildPageSearch,
  getLanguageForEra,
  parseEraFromUrl,
  type EraSelection,
  type Language,
} from "@/lib/era";
import {
  locationToSearch,
  sameLocationParams,
  sameSearch,
  searchToLocation,
  type LocationSearch,
} from "@/lib/url-state";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { coerceMonthBrowseFromUrl, usePatroMonthBrowse } from "@/hooks/use-patro-month-browse";
import { usePatroYearBrowse } from "@/hooks/use-patro-year-browse";
import { useLocale } from "@/i18n/locale";
import { usePatroDayUrlBrowse } from "@/hooks/use-patro-day-url-browse";

type NavigateFn = (opts: NavigateOptions) => void;

function fallbackLanguage(lang: string): Language {
  return lang === "en" ? "en" : "ne";
}

function urlYearUnparseable(search: object, language: Language): boolean {
  const raw = search as Record<string, unknown>;
  if (raw.year == null || raw.year === "") return false;
  return parseEraFromUrl(raw, language).year == null;
}

function urlMonthUnparseable(search: object, language: Language): boolean {
  const raw = search as Record<string, unknown>;
  if (raw.month == null || raw.month === "") return false;
  return parseEraFromUrl(raw, language).month == null;
}

function eraBrowseSelection(
  browse: { era: EraSelection["era"]; year: number; month?: number },
  urlLanguage?: Language,
): EraSelection {
  return {
    era: browse.era,
    language: urlLanguage ?? getLanguageForEra(browse.era),
    year: browse.year,
    month: browse.month,
  };
}

function buildEraBrowseSearch(
  loc: PanchangaLocation | undefined,
  browse: { era: EraSelection["era"]; year: number; month?: number },
  extra?: Record<string, unknown>,
  urlLanguage?: Language,
): Record<string, unknown> {
  return {
    ...(loc ? locationToSearch(loc) : {}),
    ...buildPageSearch(eraBrowseSelection(browse, urlLanguage), extra),
  };
}

function applyEraBrowseFromSearch(
  search: object,
  browse: {
    era: EraSelection["era"];
    year: number;
    month?: number;
    setEra: (era: EraSelection["era"]) => void;
    setYear: (year: number) => void;
    setMonth?: (month: number) => void;
  },
  language: Language,
): void {
  const raw = search as Record<string, unknown>;
  if (raw.year == null && raw.month == null && raw.era == null) return;
  if (urlYearUnparseable(search, language)) return;
  if (urlMonthUnparseable(search, language)) return;

  const parsed = parseEraFromUrl(raw, language);
  const coerced = coerceMonthBrowseFromUrl(parsed.era, parsed.year, parsed.month);
  if (parsed.era !== browse.era) browse.setEra(parsed.era);
  if (coerced.year != null && coerced.year !== browse.year) browse.setYear(coerced.year);
  if (coerced.month != null && browse.setMonth != null && coerced.month !== browse.month) {
    browse.setMonth(coerced.month);
  }
}

/** Month browse + URL mirror/back-forward — single pattern for Dainik Kranti, Abhijit, etc. */
export function usePatroMonthUrlBrowse(
  search: PatroMonthBrowseSearch & LocationSearch,
  navigate: NavigateFn,
  location: PanchangaLocation,
  setLocation: (loc: PanchangaLocation) => void,
  extra?: {
    /** Extra search keys mirrored to the URL (e.g. paksha). */
    mirror?: Record<string, unknown>;
  },
) {
  const { lang } = useLocale();
  const language = fallbackLanguage(lang);
  const parsed = useMemo(
    () => parseEraFromUrl(search as Record<string, unknown>, language),
    [search, language],
  );
  const monthBrowse = usePatroMonthBrowse(
    parsed.year != null || parsed.month != null
      ? { year: parsed.year, month: parsed.month }
      : undefined,
    { era: parsed.era },
  );
  const mirror = extra?.mirror;
  const mirrorPaksha = mirror?.paksha;

  useEffect(() => {
    if (urlYearUnparseable(search, language) || urlMonthUnparseable(search, language)) {
      return;
    }
    const desired = buildEraBrowseSearch(
      location,
      {
        era: monthBrowse.era,
        year: monthBrowse.year,
        month: monthBrowse.month,
      },
      mirror,
      parsed.language,
    );
    if (!sameSearch(desired, search)) {
      navigate({ search: desired, replace: true });
    }
  }, [
    location,
    monthBrowse.era,
    monthBrowse.year,
    monthBrowse.month,
    mirrorPaksha,
    search,
    navigate,
    mirror,
    parsed.language,
  ]);

  useEffect(() => {
    applyEraBrowseFromSearch(search, monthBrowse, language);
    const loc = searchToLocation(search);
    if (loc && !sameLocationParams(loc.params, location.params)) setLocation(loc);
  }, [search, language]);

  return monthBrowse;
}

/** Year browse + URL mirror/back-forward — single pattern for Surya Kranti, Panchak, etc. */
export function usePatroYearUrlBrowse(
  search: PatroYearBrowseSearch & LocationSearch,
  navigate: NavigateFn,
  location: PanchangaLocation | undefined,
  setLocation: ((loc: PanchangaLocation) => void) | undefined,
) {
  const { lang } = useLocale();
  const language = fallbackLanguage(lang);
  const parsed = useMemo(
    () => parseEraFromUrl(search as Record<string, unknown>, language),
    [search, language],
  );
  const yearBrowse = usePatroYearBrowse(
    parsed.year != null ? { year: parsed.year } : undefined,
    { era: parsed.era },
  );

  useEffect(() => {
    if (urlYearUnparseable(search, language)) return;
    const desired = buildEraBrowseSearch(
      location,
      {
        era: yearBrowse.era,
        year: yearBrowse.year,
      },
      undefined,
      parsed.language,
    );
    if (!sameSearch(desired, search)) {
      navigate({ search: desired, replace: true });
    }
  }, [location, yearBrowse.year, yearBrowse.era, search, navigate, language, parsed.language]);

  useEffect(() => {
    applyEraBrowseFromSearch(search, yearBrowse, language);
    if (setLocation && location) {
      const loc = searchToLocation(search);
      if (loc && !sameLocationParams(loc.params, location.params)) setLocation(loc);
    }
  }, [search, language]);

  return yearBrowse;
}

/** Location-only URL mirror (ritu, static hubs with a place picker). */
export function usePatroLocationUrlBrowse(
  search: LocationSearch,
  navigate: NavigateFn,
  location: PanchangaLocation,
  setLocation: (loc: PanchangaLocation) => void,
) {
  useEffect(() => {
    const desired = locationToSearch(location);
    if (!sameSearch(desired, search)) {
      navigate({ search: desired, replace: true });
    }
  }, [location, search, navigate]);

  useEffect(() => {
    const loc = searchToLocation(search);
    if (loc && !sameLocationParams(loc.params, location.params)) setLocation(loc);
  }, [search]);
}

export {
  usePatroDayUrlBrowse,
  usePatroPanchangaUrlBrowse,
} from "@/hooks/use-patro-day-url-browse";

/** Element pages — span (month) vs table (day) share location but mirror different keys. */
export function useElementPageUrlBrowse(
  isSpan: boolean,
  search: PatroMonthBrowseSearch & LocationSearch,
  navigate: NavigateFn,
  location: PanchangaLocation,
  setLocation: (loc: PanchangaLocation) => void,
) {
  const { lang } = useLocale();
  const language = fallbackLanguage(lang);
  const parsed = useMemo(
    () => parseEraFromUrl(search as Record<string, unknown>, language),
    [search, language],
  );
  const monthBrowse = usePatroMonthBrowse(
    parsed.year != null || parsed.month != null
      ? { year: parsed.year, month: parsed.month }
      : undefined,
    { era: parsed.era },
  );

  const dayBrowse = usePatroDayUrlBrowse(search, navigate, location, setLocation, {
    mirrorUrl: !isSpan,
  });

  useEffect(() => {
    if (!isSpan) return;
    if (urlYearUnparseable(search, language) || urlMonthUnparseable(search, language)) {
      return;
    }
    const desired = buildEraBrowseSearch(
      location,
      {
        era: monthBrowse.era,
        year: monthBrowse.year,
        month: monthBrowse.month,
      },
      undefined,
      parsed.language,
    );
    if (!sameSearch(desired, search)) {
      navigate({ search: desired, replace: true });
    }
  }, [
    isSpan,
    location,
    monthBrowse.era,
    monthBrowse.year,
    monthBrowse.month,
    search,
    navigate,
    language,
    parsed.language,
  ]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isSpan) {
      applyEraBrowseFromSearch(search, monthBrowse, language);
    }
    const loc = searchToLocation(search);
    if (loc && !sameLocationParams(loc.params, location.params)) setLocation(loc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, isSpan, language]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return {
    monthBrowse,
    dayBrowse,
  } as const;
}
