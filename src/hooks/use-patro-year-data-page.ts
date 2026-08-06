import type { NavigateOptions } from "@tanstack/react-router";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { usePatroYearUrlBrowse } from "@/hooks/use-patro-url-browse";
import { searchToLocation } from "@/lib/url-state";

type NavigateFn = (opts: NavigateOptions) => void;

/** Location + year URL browse state shared by yearly patro data pages. */
export function usePatroYearDataPage(search: object, navigate: NavigateFn) {
  const { location, setLocation } = usePanchangaLocation(searchToLocation(search));
  const yearBrowse = usePatroYearUrlBrowse(search, navigate, location, setLocation);
  return { location, setLocation, yearBrowse };
}

export type PatroYearDataPageContext = ReturnType<typeof usePatroYearDataPage> & {
  gregorianRange?: { start: string; end: string } | null;
};
