import { useEffect } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  fetchPanchangaDay,
  panchangaKeys,
  type LocationParams,
} from "@/lib/api";
import type { PatroDayFetchState, ResolvedPatroDayFields } from "@/lib/patro-day-url";

type UseResolvedPatroDayQueryOptions = {
  enabled?: boolean;
  /** When false, skip picker/URL sync from the day payload (e.g. span-only element pages). */
  syncFromData?: boolean;
};

export function useResolvedPatroDayQuery(
  dayState: PatroDayFetchState,
  locationParams: LocationParams,
  sync: {
    syncPickerFromDateAd: (ad: string) => void;
    syncResolvedPatroDay: (fields: ResolvedPatroDayFields) => void;
  },
  options?: UseResolvedPatroDayQueryOptions,
) {
  const enabled = options?.enabled ?? true;
  const syncFromData = options?.syncFromData ?? true;

  const query = useQuery({
    queryKey: panchangaKeys.daySelection(dayState, locationParams),
    queryFn: () => fetchPanchangaDay(dayState, locationParams),
    enabled,
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!syncFromData) return;
    const data = query.data;
    if (!data) return;
    if (data.date_ad) sync.syncPickerFromDateAd(data.date_ad);
    sync.syncResolvedPatroDay({
      date_ad: data.date_ad,
      date_parts: data.date_parts,
      bs_date:
        data.bs_date && typeof data.bs_date === "object"
          ? {
              year: data.bs_date.year,
              month: data.bs_date.month,
              day: data.bs_date.day,
            }
          : undefined,
    });
  }, [
    syncFromData,
    query.data,
    sync.syncPickerFromDateAd,
    sync.syncResolvedPatroDay,
  ]);

  return query;
}
