/**
 * वास्तु reference data — structure only.
 *
 * Every label lives in the bilingual catalogue under `vastu.*`, same as the
 * rest of the app; what is here is the part that is not copy: where each
 * direction sits on the compass, which element it carries, and which direction
 * each room belongs to. The mobile app keeps an identical copy of this file so
 * both platforms draw the same wheel from the same numbers.
 */

export type VastuElementId = "earth" | "water" | "fire" | "air" | "space";

export type VastuDirectionId =
  | "north"
  | "northeast"
  | "east"
  | "southeast"
  | "south"
  | "southwest"
  | "west"
  | "northwest"
  | "center";

export interface VastuDirection {
  id: VastuDirectionId;
  /** Compass bearing in degrees (north = 0, clockwise). `null` for the centre. */
  bearing: number | null;
  element: VastuElementId;
  /** Cardinal points get the wider wheel segments in the drawing. */
  cardinal: boolean;
}

/** Clockwise from north — the order the wheel is drawn and listed in. */
export const VASTU_DIRECTIONS: VastuDirection[] = [
  { id: "north", bearing: 0, element: "water", cardinal: true },
  { id: "northeast", bearing: 45, element: "water", cardinal: false },
  { id: "east", bearing: 90, element: "air", cardinal: true },
  { id: "southeast", bearing: 135, element: "fire", cardinal: false },
  { id: "south", bearing: 180, element: "earth", cardinal: true },
  { id: "southwest", bearing: 225, element: "earth", cardinal: false },
  { id: "west", bearing: 270, element: "water", cardinal: true },
  { id: "northwest", bearing: 315, element: "air", cardinal: false },
  { id: "center", bearing: null, element: "space", cardinal: false },
];

export const VASTU_WHEEL_DIRECTIONS = VASTU_DIRECTIONS.filter(
  (d): d is VastuDirection & { bearing: number } => d.bearing !== null,
);

export const VASTU_CENTER: VastuDirection = VASTU_DIRECTIONS[VASTU_DIRECTIONS.length - 1]!;

/** Per-element accent, as a CSS custom-property-free hex so both apps can share it. */
export const VASTU_ELEMENT_COLOR: Record<VastuElementId, string> = {
  earth: "#a8763e",
  water: "#2f8fa6",
  fire: "#d2622f",
  air: "#7a9a5b",
  space: "#7a6bb0",
};

export interface VastuRoom {
  id: string;
  direction: VastuDirectionId;
}

/** Ordered the way a house is usually walked through, not alphabetically. */
export const VASTU_ROOMS: VastuRoom[] = [
  { id: "main_door", direction: "east" },
  { id: "puja", direction: "northeast" },
  { id: "living", direction: "north" },
  { id: "kitchen", direction: "southeast" },
  { id: "master_bedroom", direction: "southwest" },
  { id: "study", direction: "west" },
  { id: "bathroom", direction: "northwest" },
  { id: "staircase", direction: "southwest" },
  { id: "water_tank", direction: "northeast" },
  { id: "storage", direction: "southwest" },
];

/** Common doshas, most-asked first. Copy lives at `vastu.dosha.<id>.*`. */
export const VASTU_DOSHAS: string[] = [
  "northeast_fire",
  "center_heavy",
  "southwest_light",
  "northeast_heavy",
  "head_north",
  "blocked_door",
];

/**
 * The eight directions + Brahmasthan laid out as a North-up 3×3 house grid
 * (Vastu Purusha Mandala), in reading order — top-left → bottom-right:
 *
 *   NW │ N │ NE
 *   ───┼───┼───
 *    W │ C │ E
 *   ───┼───┼───
 *   SW │ S │ SE
 *
 * Shared with the mobile app so both platforms draw the same floor plan.
 */
export const VASTU_GRID_LAYOUT: VastuDirectionId[] = [
  "northwest",
  "north",
  "northeast",
  "west",
  "center",
  "east",
  "southwest",
  "south",
  "southeast",
];

/** Rooms grouped by their ideal direction, in the walk-through order of {@link VASTU_ROOMS}. */
export const VASTU_ROOMS_BY_DIRECTION: Record<VastuDirectionId, VastuRoom[]> =
  VASTU_DIRECTIONS.reduce(
    (acc, dir) => {
      acc[dir.id] = VASTU_ROOMS.filter((room) => room.direction === dir.id);
      return acc;
    },
    {} as Record<VastuDirectionId, VastuRoom[]>,
  );

export function vastuDirection(id: VastuDirectionId): VastuDirection {
  return VASTU_DIRECTIONS.find((d) => d.id === id) ?? VASTU_CENTER;
}

/** Rooms that ideally belong in a given direction (empty for the open centre). */
export function vastuRoomsForDirection(id: VastuDirectionId): VastuRoom[] {
  return VASTU_ROOMS_BY_DIRECTION[id] ?? [];
}

/** Point on the wheel for a bearing, with north at the top and east to the right. */
export function vastuWheelPoint(
  bearing: number,
  radius: number,
  cx = 0,
  cy = 0,
): { x: number; y: number } {
  const rad = ((bearing - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}
