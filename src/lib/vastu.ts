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

/** Rooms whose ideal direction matches `id` — for grouping {@link VASTU_ROOMS} by zone. */
export function roomsForDirection(id: VastuDirectionId): VastuRoom[] {
  return VASTU_ROOMS.filter((room) => room.direction === id);
}

export type CardinalWall = "north" | "east" | "south" | "west";

/** A rectangular plot has exactly these 4 walls — the subset of {@link VASTU_DIRECTIONS} with `cardinal: true`. */
export const CARDINAL_WALLS: CardinalWall[] = ["north", "east", "south", "west"];

/** The two corner directions adjacent to each wall, walking clockwise. */
export const WALL_CORNERS: Record<CardinalWall, [VastuDirectionId, VastuDirectionId]> = {
  north: ["northwest", "northeast"],
  east: ["northeast", "southeast"],
  south: ["southeast", "southwest"],
  west: ["southwest", "northwest"],
};

/**
 * Which corner of each wall is generally preferred for an entrance —
 * the lighter, water/air corners over the heavy south-west one. A rough,
 * commonly-cited heuristic, not a substitute for a site-specific reading.
 */
export const ENTRANCE_PREFERRED_CORNER: Record<CardinalWall, VastuDirectionId> = {
  north: "northeast",
  east: "northeast",
  south: "southeast",
  west: "northwest",
};

/** 1 hasta (cubit), the traditional unit these calculations are done in. */
export const HASTA_METERS = 0.4572;

export function metersToHasta(meters: number): number {
  return meters / HASTA_METERS;
}

/**
 * Simplified Āyādi "income" check: whether a wall's length (in whole hasta)
 * lands on an auspicious remainder. Traditional sources compute several
 * vargas (income, expenditure, star, etc.) with named remainder categories;
 * this keeps just one widely-cited piece — a "zero income" width is
 * inauspicious — as an approximation, not full shastra.
 *
 * Note: with this formula `(hasta * 8) % 12` only ever lands on 0, 4 or 8
 * (8 and 12 share a factor of 4), so "odd remainder" can never happen —
 * the auspicious check below is "non-zero", not "odd".
 */
export function ayadiRemainder(widthHasta: number): number {
  const hasta = Math.round(widthHasta);
  return ((hasta * 8) % 12 + 12) % 12;
}

export function ayadiAuspicious(remainder: number): boolean {
  return remainder !== 0;
}

/** Nearest whole-hasta width (either direction) with non-zero remainder. */
export function nearestAuspiciousWidthHasta(widthHasta: number): number {
  const base = Math.round(widthHasta);
  for (let delta = 1; delta <= 6; delta++) {
    if (ayadiAuspicious(ayadiRemainder(base - delta))) return base - delta;
    if (ayadiAuspicious(ayadiRemainder(base + delta))) return base + delta;
  }
  return base;
}

export interface Point {
  x: number;
  y: number;
}

export interface PlotTrapezoid {
  sw: Point;
  se: Point;
  ne: Point;
  nw: Point;
  /** Vertical distance between the (horizontal, parallel) north and south walls. */
  height: number;
}

/**
 * Builds a plot from its four wall lengths without assuming a rectangle.
 * North and south stay horizontal and parallel (as a real plot's front/back
 * usually are) but can differ in length; east and west become the two legs
 * connecting them, whatever length each was given — a trapezoid, not a box.
 *
 * Four lengths alone don't fix a general quadrilateral (it can flex), but
 * fixing "north ∥ south, both horizontal" makes it solvable: south sits at
 * y=0 from (0,0) to (south,0), and the north edge's horizontal offset `wx`
 * and the trapezoid's height are pinned down by the two leg lengths.
 *
 * Returns `null` when the four lengths can't close into a real trapezoid —
 * e.g. the east/west legs are too short to span the north/south difference.
 */
export function solveTrapezoid(
  north: number,
  east: number,
  south: number,
  west: number,
): PlotTrapezoid | null {
  const d = north - south;
  let wx: number;
  if (d === 0) {
    // Same width top and bottom — only closes as a trapezoid if the legs
    // match too (anything else is inconsistent under this "vertical-ish
    // legs" model). wx = 0 then reduces cleanly to a plain rectangle.
    if (Math.abs(east - west) > 1e-6) return null;
    wx = 0;
  } else {
    wx = (east * east - west * west - d * d) / (2 * d);
  }
  const heightSq = west * west - wx * wx;
  if (!(heightSq > 0)) return null;
  const height = Math.sqrt(heightSq);
  return {
    sw: { x: 0, y: 0 },
    se: { x: south, y: 0 },
    ne: { x: wx + north, y: height },
    nw: { x: wx, y: height },
    height,
  };
}

export interface PlotFootprint {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The largest axis-aligned rectangle inside a {@link PlotTrapezoid}, inset by
 * `marginRatio` on each side for a visible buffer strip — the classical
 * answer to an irregular plot is to rectify a proper rectangle for the house
 * inside it, not to stretch the Vastu grid over the raw boundary.
 *
 * Because both parallel edges are horizontal and the legs are straight, the
 * horizontal span that stays inside the trapezoid at every height is exactly
 * the overlap of the two parallel edges' own spans — no search needed.
 */
export function inscribedFootprint(trapezoid: PlotTrapezoid, marginRatio = 0.06): PlotFootprint | null {
  const left = Math.max(trapezoid.sw.x, trapezoid.nw.x);
  const right = Math.min(trapezoid.se.x, trapezoid.ne.x);
  const maxWidth = right - left;
  const maxHeight = trapezoid.height;
  if (!(maxWidth > 0) || !(maxHeight > 0)) return null;
  const marginX = maxWidth * marginRatio;
  const marginY = maxHeight * marginRatio;
  const width = maxWidth - 2 * marginX;
  const height = maxHeight - 2 * marginY;
  if (!(width > 0) || !(height > 0)) return null;
  return { x: left + marginX, y: marginY, width, height };
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
