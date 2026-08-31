import type { CardinalWall, Point } from "@/lib/vastu";
import type { Rect, Wall } from "./types";

/** 1 hasta-adjacent clearance: bed must not touch the south or west wall. */
export const WALL_GAP = 0.076;

/** Door height is twice its width (1:2), or 1:1.75 as the alternate ratio. */
export const DOOR_RATIO = 2;

export const ENTRANCE_W = 1.05;
export const RING_W = 0.9;
export const FOYER_W = 1.4;

export const WIN_NE_W = 1.45;
export const WIN_SW_W = 0.75;
export const WIN_NE_SILL = 0.85;
export const WIN_SW_SILL = 1.45;
export const WIN_NE_H = 1.35;
export const WIN_SW_H = 0.7;

/**
 * 9 padas on each outer wall, numbered 1–9 from the first corner toward the second.
 * West follows the user's Mayamata list (SW → NW): Pitṛ … Varuṇa(5) Puṣpadanta(6) … Pāpayakṣmā.
 * East: SE → NE. North: NW → NE. South: SE → SW (auspicious padas stay toward SE, off the Yama axis).
 */
export const WALL_PADA_FROM: Record<CardinalWall, "sw_nw" | "se_ne" | "nw_ne" | "se_sw"> = {
  west: "sw_nw",
  east: "se_ne",
  north: "nw_ne",
  south: "se_sw",
};

/** Best / allowed door padas. Pad 5 is Varuṇa (west) but sits on the median — shift off-axis. */
export const DOOR_PADA: Record<CardinalWall, { best: number; ok: number; avoid: number[] }> = {
  west: { best: 6, ok: 5, avoid: [3, 4, 8, 9] },
  east: { best: 6, ok: 5, avoid: [3, 4, 8, 9] },
  north: { best: 6, ok: 5, avoid: [3, 4, 8, 9] },
  south: { best: 4, ok: 3, avoid: [5, 8, 9] },
};

export function padaCenterT(pada: number): number {
  return (pada - 0.5) / 9;
}

export type Pada32 = { id: string; name: string; good: boolean };

/**
 * The 32-pada Dvāra-vinyāsa boundary devatās (Viśvakarmā Prakāśa /
 * Mayamata), 8 per wall — a separate, finer-grained scheme from the 9-pada
 * {@link DOOR_PADA} table above, used only to mark each wall's auspicious
 * (+) and inauspicious (−) sectors, not to place the door itself. Each
 * wall's 8 entries walk the same direction as {@link WALL_CORNERS}' pair for
 * that wall, i.e. clockwise around the plot: north NW→NE, east NE→SE,
 * south SE→SW, west SW→NW.
 */
export const PADA_32: Record<CardinalWall, Pada32[]> = {
  north: [
    { id: "N1", name: "Roga", good: false },
    { id: "N2", name: "Naga", good: false },
    { id: "N3", name: "Mukhya", good: true },
    { id: "N4", name: "Bhallat", good: true },
    { id: "N5", name: "Soma", good: true },
    { id: "N6", name: "Bhujang", good: false },
    { id: "N7", name: "Aditi", good: true },
    { id: "N8", name: "Diti", good: true },
  ],
  east: [
    { id: "E1", name: "Shikhi", good: false },
    { id: "E2", name: "Parjanya", good: false },
    { id: "E3", name: "Jayant", good: true },
    { id: "E4", name: "Mahendra", good: true },
    { id: "E5", name: "Surya", good: false },
    { id: "E6", name: "Satya", good: false },
    { id: "E7", name: "Bhrisha", good: false },
    { id: "E8", name: "Antariksha", good: false },
  ],
  south: [
    { id: "S1", name: "Anil", good: false },
    { id: "S2", name: "Pusha", good: false },
    { id: "S3", name: "Vitatha", good: false },
    { id: "S4", name: "Grihakshat", good: true },
    { id: "S5", name: "Yama", good: false },
    { id: "S6", name: "Gandharv", good: true },
    { id: "S7", name: "Bhringaraja", good: false },
    { id: "S8", name: "Mruga", good: false },
  ],
  west: [
    { id: "W1", name: "Pitra", good: false },
    { id: "W2", name: "Dwarika", good: false },
    { id: "W3", name: "Sugreev", good: false },
    { id: "W4", name: "Pushpdant", good: true },
    { id: "W5", name: "Varun", good: true },
    { id: "W6", name: "Asur", good: false },
    { id: "W7", name: "Shosha", good: false },
    { id: "W8", name: "Papyakshma", good: false },
  ],
};

const PADA_32_ENDS: Record<CardinalWall, (w: number, h: number) => [Point, Point]> = {
  north: (w) => [{ x: 0, y: 0 }, { x: w, y: 0 }],
  east: (w, h) => [{ x: w, y: 0 }, { x: w, y: h }],
  south: (w, h) => [{ x: w, y: h }, { x: 0, y: h }],
  west: (_w, h) => [{ x: 0, y: h }, { x: 0, y: 0 }],
};

const PADA_32_OUTWARD: Record<CardinalWall, Point> = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
};

export type Pada32Point = Pada32 & { x: number; y: number; nx: number; ny: number };

/** Midpoint of each of a wall's 8 pada sectors, plus the outward unit normal to offset a marker along. */
export function pada32Points(wall: CardinalWall, width: number, height: number): Pada32Point[] {
  const [a, b] = PADA_32_ENDS[wall](width, height);
  const out = PADA_32_OUTWARD[wall];
  return PADA_32[wall].map((pada, i) => {
    const t = (i + 0.5) / 8;
    return { ...pada, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, nx: out.x, ny: out.y };
  });
}

/** Door center on the facing wall, off the Vaṁśadvāra median. */
export function mainDoorPoint(facing: CardinalWall, width: number, height: number): { x: number; y: number; t: number; pada: number } {
  const pada = DOOR_PADA[facing].best;
  const t = padaCenterT(pada);
  if (facing === "east") return { x: width, y: height * (1 - t), t, pada };
  if (facing === "west") return { x: 0, y: height * (1 - t), t, pada };
  if (facing === "north") return { x: width * t, y: 0, t, pada };
  return { x: width * (1 - t), y: height, t, pada };
}

export function foyerRect(facing: CardinalWall, width: number, height: number, depth: number): Rect {
  const door = mainDoorPoint(facing, width, height);
  const along = Math.max(FOYER_W, Math.min(width, height) / 9 + 0.85);
  const xs = [0, width / 3, (2 * width) / 3, width];
  const ys = [0, height / 3, (2 * height) / 3, height];
  const cell =
    facing === "west"
      ? { x: xs[0]!, y: ys[1]!, w: xs[1]! - xs[0]!, h: ys[2]! - ys[1]! }
      : facing === "east"
        ? { x: xs[2]!, y: ys[1]!, w: xs[3]! - xs[2]!, h: ys[2]! - ys[1]! }
        : facing === "north"
          ? { x: xs[1]!, y: ys[0]!, w: xs[2]! - xs[1]!, h: ys[1]! - ys[0]! }
          : { x: xs[1]!, y: ys[2]!, w: xs[2]! - xs[1]!, h: ys[3]! - ys[2]! };
  if (facing === "east" || facing === "west") {
    const y = Math.min(cell.y + cell.h - along, Math.max(cell.y, door.y - along / 2));
    return facing === "east"
      ? { x: cell.x + cell.w - Math.min(depth, cell.w * 0.4), y, w: Math.min(depth, cell.w * 0.4), h: along }
      : { x: cell.x, y, w: Math.min(depth, cell.w * 0.4), h: along };
  }
  const x = Math.min(cell.x + cell.w - along, Math.max(cell.x, door.x - along / 2));
  return facing === "north"
    ? { x, y: cell.y, w: along, h: Math.min(depth, cell.h * 0.4) }
    : { x, y: cell.y + cell.h - Math.min(depth, cell.h * 0.4), w: along, h: Math.min(depth, cell.h * 0.4) };
}

export function doorHeight(width: number): number {
  return width * DOOR_RATIO;
}

/** Even count that does not end in zero (avoid 10, 20…). */
export function nextLegalCount(n: number): number {
  let t = Math.max(2, n);
  if (t % 2 === 1) t += 1;
  if (t % 10 === 0) t += 2;
  return t;
}

export function isSolarWall(wall: Wall): boolean {
  return wall === "n" || wall === "e";
}

export function splitBy(outer: Rect, cut: Rect): Rect[] {
  const ix = Math.max(outer.x, cut.x);
  const iy = Math.max(outer.y, cut.y);
  const ir = Math.min(outer.x + outer.w, cut.x + cut.w);
  const ib = Math.min(outer.y + outer.h, cut.y + cut.h);
  if (ir <= ix + 0.02 || ib <= iy + 0.02) return [outer];
  const out: Rect[] = [];
  if (ix - outer.x >= 0.85) out.push({ x: outer.x, y: outer.y, w: ix - outer.x, h: outer.h });
  if (outer.x + outer.w - ir >= 0.85) out.push({ x: ir, y: outer.y, w: outer.x + outer.w - ir, h: outer.h });
  if (iy - outer.y >= 0.85) out.push({ x: ix, y: outer.y, w: ir - ix, h: iy - outer.y });
  if (outer.y + outer.h - ib >= 0.85) out.push({ x: ix, y: ib, w: ir - ix, h: outer.y + outer.h - ib });
  return out.filter((r) => r.w >= 0.85 && r.h >= 0.85);
}

export function largest(rects: Rect[]): Rect | null {
  return [...rects].sort((a, b) => b.w * b.h - a.w * a.h)[0] ?? null;
}

export function toiletForbidden(region: string): boolean {
  return region === "northeast" || region === "southwest" || region === "center";
}
