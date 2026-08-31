import { WALL_GAP } from "./classical";
import type { FixtureKind, PlannedRoom, Rect, RoomFixture, Wall } from "./types";

/** Sizes in metres — same ballpark as react-planner catalog items. */
export const FURNITURE: Record<
  Exclude<FixtureKind, "wc" | "basin">,
  { w: number; d: number; h: number; color: string }
> = {
  bed: { w: 2, d: 1.6, h: 0.45, color: "#d4c4a8" },
  sofa: { w: 1.8, d: 0.62, h: 0.72, color: "#6d7d5c" },
  armchair: { w: 0.78, d: 0.78, h: 0.72, color: "#7a6b58" },
  chair: { w: 0.44, d: 0.44, h: 0.48, color: "#b08960" },
  table: { w: 1.2, d: 0.8, h: 0.74, color: "#8b6a42" },
  desk: { w: 1.15, d: 0.58, h: 0.75, color: "#8b6a42" },
  wardrobe: { w: 1.2, d: 0.55, h: 2.1, color: "#6e5340" },
  cupboard: { w: 0.9, d: 0.4, h: 1.85, color: "#7a5c45" },
  bookcase: { w: 0.9, d: 0.32, h: 1.85, color: "#6a4e39" },
  stove: { w: 0.6, d: 0.6, h: 0.85, color: "#3c3c3e" },
  fridge: { w: 0.6, d: 0.62, h: 1.7, color: "#d5d8dc" },
  sink: { w: 0.52, d: 0.46, h: 0.85, color: "#cfd4d8" },
  tv: { w: 1.1, d: 0.1, h: 0.65, color: "#222326" },
  ac: { w: 0.9, d: 0.22, h: 0.28, color: "#e4e6e8" },
};

function overlap(a: Rect, b: Rect, pad = 0.05): boolean {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

function inside(room: Rect, item: Rect): boolean {
  return item.x >= room.x - 0.02 && item.y >= room.y - 0.02 && item.x + item.w <= room.x + room.w + 0.02 && item.y + item.h <= room.y + room.h + 0.02;
}

function doorBlocks(room: PlannedRoom, wall: Wall, t: number): boolean {
  return room.doors.some((d) => d.wall === wall && Math.abs(d.t - t) < 0.28);
}

/** Item against a wall; `facing` is the direction it looks (into the room). */
function againstWall(room: Rect, wall: Wall, along: number, depth: number, t: number): { rect: Rect; facing: Wall } | null {
  const gap = 0.06;
  if (wall === "n") {
    const w = Math.min(along, room.w - gap * 2);
    const x = room.x + gap + t * Math.max(0, room.w - w - gap * 2);
    const rect = { x, y: room.y + gap, w, h: depth };
    return inside(room, rect) ? { rect, facing: "s" } : null;
  }
  if (wall === "s") {
    const w = Math.min(along, room.w - gap * 2);
    const x = room.x + gap + t * Math.max(0, room.w - w - gap * 2);
    const rect = { x, y: room.y + room.h - gap - depth, w, h: depth };
    return inside(room, rect) ? { rect, facing: "n" } : null;
  }
  if (wall === "w") {
    const h = Math.min(along, room.h - gap * 2);
    const y = room.y + gap + t * Math.max(0, room.h - h - gap * 2);
    const rect = { x: room.x + gap, y, w: depth, h };
    return inside(room, rect) ? { rect, facing: "e" } : null;
  }
  const h = Math.min(along, room.h - gap * 2);
  const y = room.y + gap + t * Math.max(0, room.h - h - gap * 2);
  const rect = { x: room.x + room.w - gap - depth, y, w: depth, h };
  return inside(room, rect) ? { rect, facing: "w" } : null;
}

function add(
  out: RoomFixture[],
  occupied: Rect[],
  room: PlannedRoom,
  kind: FixtureKind,
  walls: Wall[],
  t: number,
  size?: { w: number; d: number },
  extra?: Partial<RoomFixture>,
): RoomFixture | null {
  const spec = kind === "wc" || kind === "basin" ? { w: size?.w ?? 0.4, d: size?.d ?? 0.4, h: 0.4, color: "" } : FURNITURE[kind];
  const along = size?.w ?? spec.w;
  const depth = size?.d ?? spec.d;
  for (const wall of walls) {
    if (doorBlocks(room, wall, t)) continue;
    const hit = againstWall(room.rect, wall, along, depth, t);
    if (!hit) continue;
    if (occupied.some((r) => overlap(r, hit.rect))) continue;
    const item: RoomFixture = {
      id: `${room.id}_${kind}_${out.length}`,
      kind,
      rect: hit.rect,
      facing: extra?.facing ?? hit.facing,
      height: extra?.height ?? spec.h,
      lift: extra?.lift,
    };
    out.push(item);
    occupied.push(hit.rect);
    return item;
  }
  return null;
}

function layoutToilet(room: PlannedRoom): RoomFixture[] {
  const r = room.rect;
  if (r.w < 0.95 || r.h < 0.95) return [];
  const wcW = 0.38;
  const wcD = 0.68;
  const basinW = 0.48;
  const basinD = 0.38;
  const gap = 0.08;
  const doorWall: Wall = room.doors[0]?.wall ?? "e";
  const sitSouth = doorWall !== "s";
  const wcFacing: Wall = sitSouth ? "s" : "n";
  const wcY = sitSouth ? r.y + gap : r.y + r.h - gap - wcD;
  const basinY = sitSouth ? r.y + r.h - gap - basinD : r.y + gap;
  const wc: RoomFixture = {
    id: `${room.id}_wc`,
    kind: "wc",
    facing: wcFacing,
    height: 0.42,
    rect:
      r.h >= wcD + basinD + gap * 3
        ? { x: r.x + (r.w - wcW) / 2, y: wcY, w: wcW, h: wcD }
        : { x: r.x + gap, y: sitSouth ? r.y + gap : r.y + r.h - gap - wcD, w: wcW, h: wcD },
  };
  const basin: RoomFixture = {
    id: `${room.id}_basin`,
    kind: "basin",
    height: 0.85,
    rect:
      r.h >= wcD + basinD + gap * 3
        ? { x: r.x + (r.w - basinW) / 2, y: basinY, w: basinW, h: basinD }
        : { x: r.x + r.w - gap - basinW, y: sitSouth ? r.y + r.h - gap - basinD : r.y + gap, w: basinW, h: basinD },
  };
  return [wc, basin];
}

function layoutBed(room: PlannedRoom): RoomFixture[] {
  const r = room.rect;
  const spec = FURNITURE.bed;
  const bw = Math.min(spec.w, r.w - WALL_GAP * 2 - 0.35);
  const bd = Math.min(spec.d, r.h - WALL_GAP * 2 - 0.45);
  if (bw < 1.2 || bd < 1.1) return [];
  if (r.h - WALL_GAP - bd >= WALL_GAP) {
    return [
      {
        id: `${room.id}_bed`,
        kind: "bed",
        facing: "s",
        height: spec.h,
        rect: { x: r.x + Math.max(WALL_GAP, 0.12), y: r.y + r.h - WALL_GAP - bd, w: bw, h: bd },
      },
    ];
  }
  const eastW = Math.min(spec.d, r.w - WALL_GAP * 2 - 0.35);
  const eastD = Math.min(spec.w, r.h - WALL_GAP * 2 - 0.35);
  if (eastW < 1.1 || eastD < 1.2) return [];
  return [
    {
      id: `${room.id}_bed`,
      kind: "bed",
      facing: "e",
      height: spec.h,
      rect: { x: r.x + r.w - WALL_GAP - eastW, y: r.y + WALL_GAP, w: eastW, h: eastD },
    },
  ];
}

function centerTable(room: Rect, w: number, d: number): Rect | null {
  if (room.w < w + 1.1 || room.h < d + 1.1) return null;
  return { x: room.x + (room.w - w) / 2, y: room.y + (room.h - d) / 2, w, h: d };
}

function chairsAround(table: Rect, room: PlannedRoom, occupied: Rect[], out: RoomFixture[]): void {
  const c = FURNITURE.chair;
  const spots: { rect: Rect; facing: Wall }[] = [
    { rect: { x: table.x + (table.w - c.w) / 2, y: table.y - c.d - 0.04, w: c.w, h: c.d }, facing: "s" },
    { rect: { x: table.x + (table.w - c.w) / 2, y: table.y + table.h + 0.04, w: c.w, h: c.d }, facing: "n" },
    { rect: { x: table.x - c.w - 0.04, y: table.y + (table.h - c.d) / 2, w: c.w, h: c.d }, facing: "e" },
    { rect: { x: table.x + table.w + 0.04, y: table.y + (table.h - c.d) / 2, w: c.w, h: c.d }, facing: "w" },
  ];
  for (const spot of spots) {
    if (!inside(room.rect, spot.rect) || occupied.some((r) => overlap(r, spot.rect))) continue;
    out.push({ id: `${room.id}_chair_${out.length}`, kind: "chair", rect: spot.rect, facing: spot.facing, height: c.h });
    occupied.push(spot.rect);
  }
}

/** Place catalog furniture for a finished room. */
export function furnishRoom(room: PlannedRoom): RoomFixture[] {
  if (room.kind === "toilet" || room.kind === "combined") return layoutToilet(room);
  if (room.kind === "bathroom") {
    const out: RoomFixture[] = [];
    const occupied: Rect[] = [];
    add(out, occupied, room, "sink", ["n", "e"], 0.45);
    add(out, occupied, room, "cupboard", ["w", "s"], 0.2);
    return out;
  }

  const out: RoomFixture[] = [];
  const occupied: Rect[] = [];

  if (room.kind === "master_bedroom" || room.kind === "bedroom" || room.kind === "guest") {
    const beds = layoutBed(room);
    out.push(...beds);
    occupied.push(...beds.map((b) => b.rect));
    add(out, occupied, room, "wardrobe", ["w", "s"], 0.15);
    add(out, occupied, room, "ac", ["w", "s"], 0.78, undefined, { lift: 2.15 });
    return out;
  }

  if (room.kind === "living" || room.kind === "family") {
    add(out, occupied, room, "sofa", ["s", "w"], 0.45);
    add(out, occupied, room, "tv", ["n", "e"], 0.5);
    add(out, occupied, room, "armchair", ["w", "s"], 0.12);
    add(out, occupied, room, "ac", ["w", "s"], 0.82, undefined, { lift: 2.15 });
    return out;
  }

  if (room.kind === "kitchen") {
    add(out, occupied, room, "stove", ["s", "e"], 0.78);
    add(out, occupied, room, "sink", ["n", "e"], 0.72);
    add(out, occupied, room, "fridge", ["w", "s"], 0.12);
    add(out, occupied, room, "cupboard", ["w", "s"], 0.55);
    return out;
  }

  if (room.kind === "dining") {
    const table = centerTable(room.rect, Math.min(FURNITURE.table.w, room.rect.w * 0.42), Math.min(FURNITURE.table.d, room.rect.h * 0.42));
    if (table) {
      out.push({ id: `${room.id}_table`, kind: "table", rect: table, height: FURNITURE.table.h });
      occupied.push(table);
      chairsAround(table, room, occupied, out);
    }
    add(out, occupied, room, "cupboard", ["w", "s"], 0.2);
    return out;
  }

  if (room.kind === "study" || room.kind === "office" || room.kind === "library") {
    add(out, occupied, room, "desk", ["e", "n"], 0.45);
    add(out, occupied, room, "chair", ["e", "n"], 0.55);
    add(out, occupied, room, "bookcase", ["w", "s"], 0.2);
    return out;
  }

  if (room.kind === "puja") {
    add(out, occupied, room, "cupboard", ["e", "n"], 0.4);
    return out;
  }

  if (room.kind === "store" || room.kind === "laundry") {
    add(out, occupied, room, "cupboard", ["w", "s"], 0.25);
    add(out, occupied, room, "cupboard", ["w", "s"], 0.7);
    return out;
  }

  return out;
}
