import { useEffect, useMemo, useState } from "react";
import type { NavigateOptions } from "@tanstack/react-router";
import {
  applyPatroMonthSearchToBrowse,
  applyPatroYearSearchToBrowse,
  patroMonthBrowseInit,
  patroYearBrowseInit,
  type PatroMonthBrowseSearch,
  type PatroYearBrowseSearch,
} from "@/lib/patro-era";
import {
  buildPatroDaySearch,
  buildPatroMonthBrowseSearch,
  buildPatroPanchangaSearch,
  buildPatroYearBrowseSearch,
  locationToSearch,
  sameLocationParams,
  sameSearch,
  searchToLocation,
  type LocationSearch,
  type PanchangaSearch,
} from "@/lib/url-state";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { usePanchangaClock } from "@/components/panchanga/use-panchanga-mode";
import { useCalendarEra } from "@/hooks/use-calendar-era";
import { usePatroMonthBrowse } from "@/hooks/use-patro-month-browse";
import { usePatroYearBrowse } from "@/hooks/use-patro-year-browse";
import { parseAdStr, toAdStr } from "@/lib/patro-day";

type NavigateFn = (opts: NavigateOptions) => void;

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
  const langEra = useCalendarEra();
  const { initial } = patroMonthBrowseInit(search);
  const monthBrowse = usePatroMonthBrowse(initial, { era: langEra });
  const mirror = extra?.mirror;
  const mirrorPaksha = mirror?.paksha;

  useEffect(() => {
    const desired = buildPatroMonthBrowseSearch(location, monthBrowse, mirror);
    if (!sameSearch(desired, search)) {
      navigate({ search: desired, replace: true });
    }
  }, [
    location,
    monthBrowse.era,
    monthBrowse.adYear,
    monthBrowse.adMonth,
    monthBrowse.bsYear,
    monthBrowse.bsMonth,
    mirrorPaksha,
    search,
    navigate,
    monthBrowse,
    mirror,
  ]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    applyPatroMonthSearchToBrowse(search, monthBrowse);
    const loc = searchToLocation(search);
    if (loc && !sameLocationParams(loc.params, location.params)) setLocation(loc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return monthBrowse;
}

/** Year browse + URL mirror/back-forward — single pattern for Surya Kranti, Panchak, etc. */
export function usePatroYearUrlBrowse(
  search: PatroYearBrowseSearch & LocationSearch,
  navigate: NavigateFn,
  location: PanchangaLocation | undefined,
  setLocation: ((loc: PanchangaLocation) => void) | undefined,
) {
  const langEra = useCalendarEra();
  const { initialBsYear, initialAdYear } = useMemo(
    () => patroYearBrowseInit(search),
    [search],
  );
  const yearBrowse = usePatroYearBrowse(initialBsYear, { era: langEra, initialAdYear });

  useEffect(() => {
    const desired = buildPatroYearBrowseSearch(location, yearBrowse);
    if (!sameSearch(desired, search)) {
      navigate({ search: desired, replace: true });
    }
  }, [location, yearBrowse.browseYear, yearBrowse.era, search, navigate, yearBrowse]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    applyPatroYearSearchToBrowse(search, yearBrowse);
    if (setLocation && location) {
      const loc = searchToLocation(search);
      if (loc && !sameLocationParams(loc.params, location.params)) setLocation(loc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const loc = searchToLocation(search);
    if (loc && !sameLocationParams(loc.params, location.params)) setLocation(loc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  /* eslint-enable react-hooks/set-state-in-effect */
}

/** Day browse + URL mirror/back-forward — panchanga, graha sthiti, element tables. */
export function usePatroDayUrlBrowse(
  search: PanchangaSearch & LocationSearch,
  navigate: NavigateFn,
  location: PanchangaLocation,
  setLocation: (loc: PanchangaLocation) => void,
) {
  const langEra = useCalendarEra();
  const today = new Date();
  const [date, setDate] = useState(() =>
    search.date ? parseAdStr(search.date) : today,
  );

  useEffect(() => {
    const desired = buildPatroDaySearch(location, toAdStr(date), langEra);
    if (!sameSearch(desired, search)) {
      navigate({ search: desired, replace: true });
    }
  }, [location, date, langEra, search, navigate]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (search.date && search.date !== toAdStr(date)) {
      setDate(parseAdStr(search.date));
    }
    const loc = searchToLocation(search);
    if (loc && !sameLocationParams(loc.params, location.params)) setLocation(loc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return {
    date,
    setDate,
    dateAd: toAdStr(date),
  } as const;
}

/** Panchanga day browse + `time` mirror — `/panchanga?date=…&time=…&lat=…`. */
export function usePatroPanchangaUrlBrowse(
  search: PanchangaSearch & LocationSearch,
  navigate: NavigateFn,
  location: PanchangaLocation,
  setLocation: (loc: PanchangaLocation) => void,
) {
  const timezone = location.params.timezone ?? "Asia/Kathmandu";
  const langEra = useCalendarEra();
  const today = new Date();
  const [date, setDate] = useState(() =>
    search.date ? parseAdStr(search.date) : today,
  );
  const { clock, setClock } = usePanchangaClock(timezone, { clock: search.time });
  const dateAd = toAdStr(date);

  useEffect(() => {
    const desired = buildPatroPanchangaSearch(location, dateAd, clock, langEra);
    if (!sameSearch(desired, search)) {
      navigate({ search: desired, replace: true });
    }
  }, [location, dateAd, clock, langEra, search, navigate]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (search.date && search.date !== dateAd) {
      setDate(parseAdStr(search.date));
    }
    if (search.time && search.time !== clock) {
      setClock(search.time);
    }
    const loc = searchToLocation(search);
    if (loc && !sameLocationParams(loc.params, location.params)) setLocation(loc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return {
    date,
    setDate,
    dateAd,
    clock,
    setClock,
  } as const;
}

/** Element pages — span (month) vs table (day) share location but mirror different keys. */
export function useElementPageUrlBrowse(
  isSpan: boolean,
  search: PatroMonthBrowseSearch & { date?: string } & LocationSearch,
  navigate: NavigateFn,
  location: PanchangaLocation,
  setLocation: (loc: PanchangaLocation) => void,
) {
  const langEra = useCalendarEra();
  const { initial } = patroMonthBrowseInit(search);
  const monthBrowse = usePatroMonthBrowse(initial, { era: langEra });

  const today = new Date();
  const [date, setDate] = useState(() =>
    search.date ? parseAdStr(search.date) : today,
  );

  useEffect(() => {
    const desired = isSpan
      ? buildPatroMonthBrowseSearch(location, monthBrowse)
      : buildPatroDaySearch(location, toAdStr(date), langEra);
    if (!sameSearch(desired, search)) {
      navigate({ search: desired, replace: true });
    }
  }, [
    isSpan,
    location,
    monthBrowse.era,
    monthBrowse.adYear,
    monthBrowse.adMonth,
    monthBrowse.bsYear,
    monthBrowse.bsMonth,
    date,
    search,
    navigate,
    monthBrowse,
  ]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    applyPatroMonthSearchToBrowse(search, monthBrowse);
    if (!isSpan && search.date && search.date !== toAdStr(date)) {
      setDate(parseAdStr(search.date));
    }
    const loc = searchToLocation(search);
    if (loc && !sameLocationParams(loc.params, location.params)) setLocation(loc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, isSpan]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return {
    monthBrowse,
    dayBrowse: { date, setDate, dateAd: toAdStr(date) },
  } as const;
}
