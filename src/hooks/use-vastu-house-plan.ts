import { useQuery } from "@tanstack/react-query";
import {
  fetchVastuHousePlan,
  type VastuHouseRequirementInputApi,
  type VastuSiteInputApi,
} from "@/lib/api";
import type { CardinalWall } from "@/lib/vastu";
import type { HousePlan } from "@/lib/vastu-plan";
import { useDebouncedValue } from "./use-debounced-value";

export interface VastuPlanSite {
  /** East–West, metres. */
  width: number;
  /** North–South, metres. */
  height: number;
  facing: CardinalWall;
}

function toApiSite(site: VastuPlanSite): VastuSiteInputApi {
  return { plot_width: site.width, plot_depth: site.height, unit: "m", facing: site.facing };
}

function toApiRequirement(house: HousePlan): VastuHouseRequirementInputApi {
  return {
    bedrooms: house.bedrooms,
    master_bedroom_index: house.masterBedroom,
    toilets: house.toilets,
    bathrooms: house.bathrooms,
    combined_toilet_bath: house.combined,
    extras: house.extras,
    mode: house.mode,
    storeys: house.storeys,
    floors: house.floors as Record<string, "ground" | "first" | "third" | "any">,
  };
}

/** The engine is deterministic and disk-cached server-side for a given
 * (site, requirement, rule_version) — same input always produces the same
 * plan (api/vastu.py's vastu_house_plan_route docstring) — so this is fetched
 * via useQuery despite being a POST, not a useMutation (nothing is written
 * server-side). Debounced so dragging a plot-size input doesn't fire a
 * request per keystroke. */
export function useVastuHousePlan(site: VastuPlanSite, house: HousePlan) {
  const debouncedSite = useDebouncedValue(site, 400);
  const debouncedHouse = useDebouncedValue(house, 400);

  return useQuery({
    queryKey: ["vastu-house-plan", debouncedSite, debouncedHouse],
    queryFn: () => fetchVastuHousePlan(toApiSite(debouncedSite), toApiRequirement(debouncedHouse)),
    staleTime: Infinity,
  });
}
