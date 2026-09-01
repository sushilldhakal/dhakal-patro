import type { VastuDirectionId } from "@/lib/vastu";
import { SPACE_ZONE_RULES, WET_KINDS, type SpaceKind, type VastuMode } from "@/lib/vastu-plan";
import type { LifeZone, PlanKind, Rect } from "./types";

/**
 * Data-shaped Vastu preferences. Swap this table for API-fed rules later;
 * the engine only reads preferred / acceptable / avoid regions.
 */
export type VastuPreference = {
  subject: SpaceKind;
  preferred_regions: VastuDirectionId[];
  avoid_regions: VastuDirectionId[];
  acceptable_regions: VastuDirectionId[];
};

export function vastuPreferences(): VastuPreference[] {
  return (Object.keys(SPACE_ZONE_RULES) as SpaceKind[]).map((subject) => {
    const rule = SPACE_ZONE_RULES[subject];
    return {
      subject,
      preferred_regions: rule.preferred,
      acceptable_regions: rule.acceptable,
      avoid_regions: rule.avoid,
    };
  });
}

const PREF_BY_KIND: Partial<Record<SpaceKind, VastuPreference>> = Object.fromEntries(
  vastuPreferences().map((row) => [row.subject, row]),
);

export function preferenceFor(kind: SpaceKind): VastuPreference | undefined {
  return PREF_BY_KIND[kind];
}

export function lifeZoneOf(kind: PlanKind): LifeZone {
  if (kind === "hall" || kind === "foyer" || kind === "landing" || kind === "brahmasthan" || kind === "verandah") {
    return "circulation";
  }
  if (kind === "staircase") return "vertical";
  if (kind === "garden" || kind === "courtyard" || kind === "balcony" || kind === "garage") return "outdoor";
  if (kind === "kitchen" || kind === "kitchen_dining" || kind === "store" || kind === "laundry" || WET_KINDS.has(kind)) return "service";
  if (kind === "master_bedroom" || kind === "bedroom" || kind === "guest") return "private";
  if (kind === "dining" || kind === "family" || kind === "study" || kind === "puja" || kind === "office" || kind === "library") {
    return "semi";
  }
  return "public";
}

export const ADJACENCY: Partial<Record<SpaceKind, SpaceKind[]>> = {
  living: ["dining", "family", "balcony", "guest"],
  dining: ["living", "kitchen", "family"],
  kitchen: ["dining", "store", "laundry"],
  master_bedroom: ["combined", "bathroom", "toilet"],
  bedroom: ["combined", "bathroom", "toilet"],
  guest: ["combined", "bathroom", "toilet"],
  family: ["living", "dining"],
  puja: ["living"],
  laundry: ["kitchen", "store"],
  store: ["kitchen"],
};

export function regionOf(rect: Rect, houseW: number, houseH: number): VastuDirectionId {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const col = cx < houseW / 3 ? 0 : cx < (2 * houseW) / 3 ? 1 : 2;
  const row = cy < houseH / 3 ? 0 : cy < (2 * houseH) / 3 ? 1 : 2;
  const grid: VastuDirectionId[][] = [
    ["northwest", "north", "northeast"],
    ["west", "center", "east"],
    ["southwest", "south", "southeast"],
  ];
  return grid[row]![col]!;
}

/** Strict uses preferred zones only. Flexible may use acceptable. Avoid and Brahmasthan stay off-limits. */
export function allowedRegions(kind: SpaceKind, mode: VastuMode): VastuDirectionId[] {
  const pref = preferenceFor(kind);
  if (!pref) return [];
  const list = mode === "strict" ? pref.preferred_regions : [...pref.preferred_regions, ...pref.acceptable_regions];
  return list.filter((z) => z !== "center");
}

/** Lower is better. Avoid / center are never chosen by the engine. */
export function vastuCost(kind: SpaceKind, region: VastuDirectionId, mode: VastuMode): { cost: number; relaxed: boolean } {
  const pref = preferenceFor(kind);
  if (!pref) return { cost: 4, relaxed: false };
  if (pref.preferred_regions.includes(region)) return { cost: 0, relaxed: false };
  if (pref.acceptable_regions.includes(region)) return { cost: mode === "strict" ? 80 : 2, relaxed: mode === "strict" };
  if (pref.avoid_regions.includes(region) || region === "center") return { cost: 200, relaxed: true };
  return { cost: mode === "strict" ? 80 : 5, relaxed: mode === "strict" };
}

export const HOST_KINDS = new Set<SpaceKind>(["master_bedroom", "bedroom", "guest"]);
export const HABITABLE = new Set<PlanKind>([
  "living",
  "dining",
  "family",
  "bedroom",
  "master_bedroom",
  "guest",
  "study",
  "office",
  "puja",
  "kitchen",
  "library",
  "gym",
  "servant",
]);
