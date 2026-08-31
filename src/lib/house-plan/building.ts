import type { CardinalWall } from "@/lib/vastu";
import {
  ENTRANCE_W,
  WIN_NE_H,
  WIN_NE_SILL,
  WIN_NE_W,
  WIN_SW_H,
  WIN_SW_SILL,
  WIN_SW_W,
  doorHeight,
  isSolarWall,
  mainDoorPoint,
  nextLegalCount,
} from "./classical";
import type { BHole, BVertex, BWall, BuildingLayer, PlannedRoom, Rect, Wall } from "./types";

export const WALL_T = 0.18;
export const DOOR_W = 0.9;
export const WET_DOOR_W = 0.75;
export const WIN_W = WIN_NE_W;

function key(x: number, y: number): string {
  return `${Math.round(x * 200)}_${Math.round(y * 200)}`;
}

function overlap1(a0: number, a1: number, b0: number, b1: number): number {
  return Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
}

export function sharedSeg(a: Rect, b: Rect): { wall: Wall; x1: number; y1: number; x2: number; y2: number } | null {
  const eps = 0.04;
  if (Math.abs(a.x + a.w - b.x) < eps) {
    const lo = Math.max(a.y, b.y);
    const hi = Math.min(a.y + a.h, b.y + b.h);
    if (hi - lo > 0.45) return { wall: "e", x1: b.x, y1: lo, x2: b.x, y2: hi };
  }
  if (Math.abs(b.x + b.w - a.x) < eps) {
    const lo = Math.max(a.y, b.y);
    const hi = Math.min(a.y + a.h, b.y + b.h);
    if (hi - lo > 0.45) return { wall: "w", x1: a.x, y1: lo, x2: a.x, y2: hi };
  }
  if (Math.abs(a.y + a.h - b.y) < eps) {
    const lo = Math.max(a.x, b.x);
    const hi = Math.min(a.x + a.w, b.x + b.w);
    if (hi - lo > 0.45) return { wall: "s", x1: lo, y1: b.y, x2: hi, y2: b.y };
  }
  if (Math.abs(b.y + b.h - a.y) < eps) {
    const lo = Math.max(a.x, b.x);
    const hi = Math.min(a.x + a.w, b.x + b.w);
    if (hi - lo > 0.45) return { wall: "n", x1: lo, y1: a.y, x2: hi, y2: a.y };
  }
  return null;
}

function edges(rect: Rect): { wall: Wall; x1: number; y1: number; x2: number; y2: number }[] {
  return [
    { wall: "n", x1: rect.x, y1: rect.y, x2: rect.x + rect.w, y2: rect.y },
    { wall: "e", x1: rect.x + rect.w, y1: rect.y, x2: rect.x + rect.w, y2: rect.y + rect.h },
    { wall: "s", x1: rect.x, y1: rect.y + rect.h, x2: rect.x + rect.w, y2: rect.y + rect.h },
    { wall: "w", x1: rect.x, y1: rect.y, x2: rect.x, y2: rect.y + rect.h },
  ];
}

function onPerimeter(seg: { x1: number; y1: number; x2: number; y2: number }, W: number, H: number): boolean {
  const eps = 0.06;
  const onV = (x: number) => Math.abs(x) < eps || Math.abs(x - W) < eps;
  const onH = (y: number) => Math.abs(y) < eps || Math.abs(y - H) < eps;
  if (Math.abs(seg.x1 - seg.x2) < eps) return onV(seg.x1);
  return onH(seg.y1);
}

function facingEdge(facing: CardinalWall, W: number, H: number): { x1: number; y1: number; x2: number; y2: number } {
  if (facing === "east") return { x1: W, y1: 0, x2: W, y2: H };
  if (facing === "west") return { x1: 0, y1: 0, x2: 0, y2: H };
  if (facing === "north") return { x1: 0, y1: 0, x2: W, y2: 0 };
  return { x1: 0, y1: H, x2: W, y2: H };
}

function segsOverlap(
  a: { x1: number; y1: number; x2: number; y2: number },
  b: { x1: number; y1: number; x2: number; y2: number },
): number {
  const eps = 0.06;
  if (Math.abs(a.x1 - a.x2) < eps && Math.abs(b.x1 - b.x2) < eps && Math.abs(a.x1 - b.x1) < eps) {
    return overlap1(Math.min(a.y1, a.y2), Math.max(a.y1, a.y2), Math.min(b.y1, b.y2), Math.max(b.y1, b.y2));
  }
  if (Math.abs(a.y1 - a.y2) < eps && Math.abs(b.y1 - b.y2) < eps && Math.abs(a.y1 - b.y1) < eps) {
    return overlap1(Math.min(a.x1, a.x2), Math.max(a.x1, a.x2), Math.min(b.x1, b.x2), Math.max(b.x1, b.x2));
  }
  return 0;
}

function pointOnEdge(room: PlannedRoom, wall: Wall, t: number): { x: number; y: number } {
  const r = room.rect;
  if (wall === "n") return { x: r.x + t * r.w, y: r.y };
  if (wall === "s") return { x: r.x + t * r.w, y: r.y + r.h };
  if (wall === "e") return { x: r.x + r.w, y: r.y + t * r.h };
  return { x: r.x, y: r.y + t * r.h };
}

/**
 * Compile rooms into a react-planner-style layer: vertices, thick walls, door/window holes.
 */
export function compileLayer(
  width: number,
  height: number,
  facing: CardinalWall,
  rooms: PlannedRoom[],
): BuildingLayer {
  const verts = new Map<string, BVertex>();
  const walls: BWall[] = [];
  const wallAt = new Map<string, BWall>();

  function vertex(x: number, y: number): BVertex {
    const id = `v_${key(x, y)}`;
    const hit = verts.get(id);
    if (hit) return hit;
    const v = { id, x, y };
    verts.set(id, v);
    return v;
  }

  function wall(x1: number, y1: number, x2: number, y2: number, role: BWall["role"]): BWall {
    const a = vertex(x1, y1);
    const b = vertex(x2, y2);
    if (a.id === b.id) {
      return { id: `w_${a.id}`, a: a.id, b: b.id, thickness: WALL_T, role };
    }
    const id = a.id < b.id ? `w_${a.id}_${b.id}` : `w_${b.id}_${a.id}`;
    const hit = wallAt.get(id);
    if (hit) {
      if (role === "exterior") hit.role = "exterior";
      return hit;
    }
    const w = { id, a: a.id, b: b.id, thickness: WALL_T, role };
    wallAt.set(id, w);
    walls.push(w);
    return w;
  }

  const closed = rooms.filter((r) => r.life !== "circulation" && r.life !== "outdoor");
  const open = rooms.filter((r) => r.life === "circulation" || r.life === "outdoor");

  wall(0, 0, width, 0, "exterior");
  wall(width, 0, width, height, "exterior");
  wall(0, height, width, height, "exterior");
  wall(0, 0, 0, height, "exterior");

  for (const room of closed) {
    for (const e of edges(room.rect)) {
      const role = onPerimeter(e, width, height) ? "exterior" : "interior";
      wall(e.x1, e.y1, e.x2, e.y2, role);
    }
  }

  const holes: BHole[] = [];
  let holeN = 0;

  function addHole(
    w: BWall,
    atX: number,
    atY: number,
    widthM: number,
    type: BHole["type"],
    from: string,
    to: string,
    extra?: { height?: number; sill?: number },
  ) {
    const va = verts.get(w.a)!;
    const vb = verts.get(w.b)!;
    const len = Math.hypot(vb.x - va.x, vb.y - va.y);
    if (len < 0.4) return false;
    const t = ((atX - va.x) * (vb.x - va.x) + (atY - va.y) * (vb.y - va.y)) / (len * len);
    const offset = Math.min(0.82, Math.max(0.18, t));
    const used = widthM / len;
    if (used > 0.85) return false;
    if (holes.some((h) => h.wallId === w.id && Math.abs(h.offset - offset) < 0.12)) return false;
    holes.push({
      id: `h_${holeN++}`,
      wallId: w.id,
      offset,
      width: widthM,
      type,
      swing: type === "window" ? "left" : offset > 0.5 ? "right" : "left",
      from,
      to,
      height: extra?.height ?? (type === "window" ? undefined : doorHeight(widthM)),
      sill: extra?.sill,
    });
    return true;
  }

  for (const room of rooms) {
    for (const door of room.doors) {
      const pt = pointOnEdge(room, door.wall, door.t);
      const edge = edges(room.rect).find((e) => e.wall === door.wall);
      if (!edge) continue;
      const w = wall(edge.x1, edge.y1, edge.x2, edge.y2, onPerimeter(edge, width, height) ? "exterior" : "interior");
      addHole(w, pt.x, pt.y, door.width, "door", room.id, door.connectsTo);
    }
  }

  for (const room of closed) {
    if (room.doors.length) continue;
    for (const space of open) {
      const seg = sharedSeg(room.rect, space.rect);
      if (!seg) continue;
      const w = wall(seg.x1, seg.y1, seg.x2, seg.y2, "interior");
      addHole(w, (seg.x1 + seg.x2) / 2, (seg.y1 + seg.y2) / 2, DOOR_W, "door", room.id, space.id);
      break;
    }
  }

  const face = facingEdge(facing, width, height);
  const door = mainDoorPoint(facing, width, height);
  const doorOnEdge = (e: { x1: number; y1: number; x2: number; y2: number }) => {
    const pad = 0.12;
    if (Math.abs(e.x1 - e.x2) < 0.06) {
      return Math.abs(door.x - e.x1) < 0.08 && door.y >= Math.min(e.y1, e.y2) - pad && door.y <= Math.max(e.y1, e.y2) + pad;
    }
    return Math.abs(door.y - e.y1) < 0.08 && door.x >= Math.min(e.x1, e.x2) - pad && door.x <= Math.max(e.x1, e.x2) + pad;
  };
  const onFace = closed.filter((r) => edges(r.rect).some((e) => segsOverlap(e, face) > 0.4 && doorOnEdge(e)));
  const entry =
    rooms.find((r) => r.kind === "foyer") ??
    [...onFace].sort((a, b) => {
      const d = (r: PlannedRoom) => Math.hypot(r.rect.x + r.rect.w / 2 - door.x, r.rect.y + r.rect.h / 2 - door.y);
      return d(a) - d(b);
    })[0];
  if (entry) {
    for (const e of edges(entry.rect)) {
      if (segsOverlap(e, face) < 0.4) continue;
      const w = wall(e.x1, e.y1, e.x2, e.y2, "exterior");
      addHole(w, door.x, door.y, ENTRANCE_W, "entrance", entry.id, "outside");
    }
  }

  const winCandidates: { wall: Wall; edge: { x1: number; y1: number; x2: number; y2: number }; room: PlannedRoom }[] = [];
  for (const room of closed) {
    if (room.kind === "staircase" || room.kind === "toilet") continue;
    for (const e of edges(room.rect)) {
      if (!onPerimeter(e, width, height)) continue;
      if (entry && segsOverlap(e, face) > 0.5) continue;
      const along = Math.hypot(e.x2 - e.x1, e.y2 - e.y1);
      if (along < 1.2) continue;
      winCandidates.push({ wall: e.wall, edge: e, room });
    }
  }

  const placeWindow = (c: (typeof winCandidates)[number], t: number, force = false) => {
    const solar = isSolarWall(c.wall);
    if (!solar && !force && winCandidates.filter((x) => x.wall === c.wall).length > 2) return false;
    const along = Math.hypot(c.edge.x2 - c.edge.x1, c.edge.y2 - c.edge.y1);
    const widthM = Math.min(solar ? WIN_NE_W : WIN_SW_W, along * (solar ? 0.42 : 0.28));
    if (widthM < 0.55) return false;
    const atX = c.edge.x1 + (c.edge.x2 - c.edge.x1) * t;
    const atY = c.edge.y1 + (c.edge.y2 - c.edge.y1) * t;
    const w = wall(c.edge.x1, c.edge.y1, c.edge.x2, c.edge.y2, "exterior");
    return addHole(w, atX, atY, widthM, "window", c.room.id, "outside", {
      height: solar ? WIN_NE_H : WIN_SW_H,
      sill: solar ? WIN_NE_SILL : WIN_SW_SILL,
    });
  };

  for (const c of winCandidates.filter((x) => isSolarWall(x.wall))) {
    placeWindow(c, 0.5);
    const along = Math.hypot(c.edge.x2 - c.edge.x1, c.edge.y2 - c.edge.y1);
    if (along > 3.6) placeWindow(c, 0.28);
  }
  const thermal = winCandidates.filter((x) => !isSolarWall(x.wall));
  for (const c of thermal.slice(0, Math.ceil(thermal.length / 2))) {
    placeWindow(c, 0.55);
  }

  const windows = () => holes.filter((h) => h.type === "window");
  for (const hole of [...windows()]) {
    const src = walls.find((w) => w.id === hole.wallId);
    if (!src) continue;
    const a = verts.get(src.a)!;
    const b = verts.get(src.b)!;
    const midX = a.x + (b.x - a.x) * hole.offset;
    const midY = a.y + (b.y - a.y) * hole.offset;
    const vertical = Math.abs(a.x - b.x) < 0.06;
    const pair = winCandidates.find((c) => {
      if (vertical) return (c.wall === "e" || c.wall === "w") && Math.abs(c.edge.y1 + (c.edge.y2 - c.edge.y1) * 0.5 - midY) < 1.2 && c.wall !== (a.x < width / 2 ? "w" : "e");
      return (c.wall === "n" || c.wall === "s") && Math.abs(c.edge.x1 + (c.edge.x2 - c.edge.x1) * 0.5 - midX) < 1.2 && c.wall !== (a.y < height / 2 ? "n" : "s");
    });
    if (pair) placeWindow(pair, 0.5, true);
  }

  let winCount = windows().length;
  const wantWin = nextLegalCount(winCount);
  for (const c of winCandidates) {
    if (winCount >= wantWin) break;
    if (placeWindow(c, 0.72, true)) winCount += 1;
  }

  return { vertices: [...verts.values()], walls, holes };
}
