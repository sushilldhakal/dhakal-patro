import type { CardinalWall, VastuDirectionId } from "@/lib/vastu";
import {
  IDEAL_SIZE,
  WET_KINDS,
  boxFits,
  clampStoreys,
  expandPlannedSpaces,
  resolveStorey,
  type HousePlan,
  type PlannedSpace,
  type SpaceKind,
  type StoreyId,
  type VastuMode,
} from "@/lib/vastu-plan";
import { compileLayer, DOOR_W, sharedSeg, WET_DOOR_W } from "./building";
import { foyerRect, largest, splitBy, toiletForbidden } from "./classical";
import { furnishRoom } from "./furniture";
import { allowedRegions, HOST_KINDS, lifeZoneOf, vastuCost } from "./prefs";
import type {
  FloorConcept,
  HouseConcept,
  PlanConflict,
  PlannedDoor,
  PlannedRoom,
  Rect,
  SiteInput,
  StairShaft,
  Wall,
} from "./types";
import { validateConcept } from "./validate";

const STAIR_W = 1.25;
const STAIR_L = 2.5;
const NOTCH = 1.1;

type ZoneId = "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se";

const ZONE_DIR: Record<ZoneId, VastuDirectionId> = {
  nw: "northwest",
  n: "north",
  ne: "northeast",
  w: "west",
  e: "east",
  sw: "southwest",
  s: "south",
  se: "southeast",
};

const PLACE_ORDER: SpaceKind[] = [
  "puja",
  "kitchen",
  "master_bedroom",
  "living",
  "dining",
  "bedroom",
  "guest",
  "family",
  "study",
  "office",
  "store",
  "laundry",
  "garage",
  "garden",
  "balcony",
  "library",
  "gym",
  "servant",
];

const CORNER_ZONES: ZoneId[] = ["nw", "ne", "sw", "se"];

function facingZone(facing: CardinalWall): ZoneId {
  return facing === "east" ? "e" : facing === "west" ? "w" : facing === "north" ? "n" : "s";
}

function mandala(width: number, height: number) {
  const xs = [0, width / 3, (2 * width) / 3, width];
  const ys = [0, height / 3, (2 * height) / 3, height];
  const notch = Math.min(NOTCH, (xs[1] ?? 0) * 0.28, (ys[1] ?? 0) * 0.28);
  const center: Rect = { x: xs[1]!, y: ys[1]!, w: xs[2]! - xs[1]!, h: ys[2]! - ys[1]! };
  return {
    notch,
    center,
    cells: {
      nw: { x: xs[0]!, y: ys[0]!, w: xs[1]! - xs[0]!, h: ys[1]! - ys[0]! },
      n: { x: xs[1]!, y: ys[0]!, w: xs[2]! - xs[1]!, h: ys[1]! - ys[0]! },
      ne: { x: xs[2]!, y: ys[0]!, w: xs[3]! - xs[2]!, h: ys[1]! - ys[0]! },
      w: { x: xs[0]!, y: ys[1]!, w: xs[1]! - xs[0]!, h: ys[2]! - ys[1]! },
      e: { x: xs[2]!, y: ys[1]!, w: xs[3]! - xs[2]!, h: ys[2]! - ys[1]! },
      sw: { x: xs[0]!, y: ys[2]!, w: xs[1]! - xs[0]!, h: ys[3]! - ys[2]! },
      s: { x: xs[1]!, y: ys[2]!, w: xs[2]! - xs[1]!, h: ys[3]! - ys[2]! },
      se: { x: xs[2]!, y: ys[2]!, w: xs[3]! - xs[2]!, h: ys[3]! - ys[2]! },
    } as Record<ZoneId, Rect>,
  };
}

function notches(center: Rect, n: number): Rect[] {
  return [
    { x: center.x - n, y: center.y - n, w: n, h: n },
    { x: center.x + center.w, y: center.y - n, w: n, h: n },
    { x: center.x - n, y: center.y + center.h, w: n, h: n },
    { x: center.x + center.w, y: center.y + center.h, w: n, h: n },
  ];
}

function clipT(t: number): number {
  return Math.min(0.82, Math.max(0.18, t));
}

function addDoor(room: PlannedRoom, wall: Wall, t: number, connectsTo: string, width = DOOR_W): PlannedDoor {
  const door: PlannedDoor = {
    id: `door_${room.id}_${wall}_${room.doors.length}`,
    roomId: room.id,
    wall,
    t: clipT(t),
    width,
    swing: wall === "n" || wall === "w" ? "in_right" : "in_left",
    connectsTo,
  };
  room.doors.push(door);
  return door;
}

function makeRoom(space: PlannedSpace, rect: Rect, floor: StoreyId, region: VastuDirectionId): PlannedRoom {
  return {
    id: `${space.id}_f${floor}`,
    kind: space.kind,
    index: space.index,
    floor,
    rect,
    life: lifeZoneOf(space.kind),
    vastuRegion: region,
    doors: [],
    windows: [],
    adjacentTo: [],
  };
}

function wetFootprint(kind: SpaceKind): { short: number; long: number } {
  if (kind === "toilet") return { short: 1, long: 1.5 };
  const size = IDEAL_SIZE[kind];
  return { short: size.minSide, long: Math.max(size.minSide, size.minArea / size.minSide) };
}

function pinToilet(cell: Rect, w: number, h: number, zone: ZoneId, avoid: Rect[] = []): Rect {
  const tw = Math.min(w, cell.w);
  const th = Math.min(h, cell.h);
  const spots: Rect[] = [
    { x: cell.x + cell.w - tw, y: cell.y + cell.h - th, w: tw, h: th },
    { x: cell.x, y: cell.y + cell.h - th, w: tw, h: th },
    { x: cell.x + cell.w - tw, y: cell.y, w: tw, h: th },
    { x: cell.x, y: cell.y, w: tw, h: th },
  ];
  const clear = spots.find((s) => avoid.every((a) => overlapArea(s, a) < 0.08));
  if (clear) return clear;
  if (zone === "nw") return { x: cell.x, y: cell.y + cell.h - th, w: tw, h: th };
  if (zone === "w") return { x: cell.x, y: cell.y + cell.h - th, w: tw, h: th };
  if (zone === "s") return { x: cell.x, y: cell.y + cell.h - th, w: tw, h: th };
  if (zone === "e") return { x: cell.x, y: cell.y + cell.h - th, w: tw, h: th };
  return spots[0]!;
}

function attachToilet(host: PlannedRoom, wet: PlannedSpace, floor: StoreyId): PlannedRoom | null {
  if (toiletForbidden(host.vastuRegion)) return null;
  if (host.vastuRegion !== "south" && host.vastuRegion !== "northwest" && host.vastuRegion !== "west") return null;
  const r = host.rect;
  const { short, long } = wetFootprint(wet.kind);
  const hostMin = IDEAL_SIZE[host.kind as SpaceKind].minSide;
  const upright = r.h >= long && r.w - short >= hostMin;
  const tw = upright ? short : long;
  const th = upright ? long : short;
  if (r.w < tw + hostMin && r.h < th + hostMin) return null;
  const west = host.vastuRegion === "south" || host.vastuRegion === "northwest";
  const south = host.vastuRegion === "south" || host.vastuRegion === "northwest" || host.vastuRegion === "west";
  const bath: Rect = {
    x: west ? r.x : r.x + r.w - tw,
    y: south ? r.y + r.h - th : r.y,
    w: tw,
    h: th,
  };
  const remain = largest(splitBy(r, bath));
  if (!remain || !boxFits(remain.w, remain.h, IDEAL_SIZE[host.kind as SpaceKind])) return null;
  host.rect = remain;
  const room = makeRoom(wet, bath, floor, host.vastuRegion);
  addDoor(room, west ? "e" : "w", 0.55, host.id, WET_DOOR_W);
  return room;
}

function wetRectInCell(cell: Rect, kind: SpaceKind, zone: ZoneId, avoid: Rect[] = []): Rect {
  const { short, long } = wetFootprint(kind);
  const horizontal = cell.w >= long && cell.h >= short && cell.h < long;
  const tw = horizontal ? long : Math.min(cell.w, Math.max(short, horizontal ? long : short));
  const th = horizontal ? short : Math.min(cell.h, long);
  if (!boxFits(tw, th, IDEAL_SIZE[kind])) return cell;
  return pinToilet(cell, tw, th, zone, avoid);
}

function isWet(kind: PlannedRoom["kind"]): boolean {
  return kind === "toilet" || kind === "bathroom" || kind === "combined";
}

function placeFoyer(rooms: PlannedRoom[], foyer: Rect, storey: StoreyId, facing: CardinalWall): PlannedRoom | null {
  for (const room of rooms) {
    if (!isWet(room.kind) || overlapArea(room.rect, foyer) < 0.08) continue;
    const keep = largest(
      splitBy(room.rect, foyer).filter((p) => boxFits(p.w, p.h, IDEAL_SIZE[room.kind as SpaceKind])),
    );
    if (keep) room.rect = keep;
  }

  const hits = rooms.filter(
    (r) => !isWet(r.kind) && r.life !== "circulation" && r.life !== "outdoor" && overlapArea(r.rect, foyer) >= 0.15,
  );
  const carved: { room: PlannedRoom; remain: Rect }[] = [];
  for (const hit of hits) {
    const remain = largest(splitBy(hit.rect, foyer));
    if (!remain || !boxFits(remain.w, remain.h, IDEAL_SIZE[hit.kind as SpaceKind])) return null;
    carved.push({ room: hit, remain });
  }
  for (const { room, remain } of carved) room.rect = remain;

  for (const room of [...rooms]) {
    if (room.kind !== "brahmasthan") continue;
    if (overlapArea(room.rect, foyer) < 0.15) continue;
    const pieces = splitBy(room.rect, foyer).filter((p) => p.w >= 0.9 && p.h >= 0.9);
    const keep = largest(pieces);
    if (!keep) {
      rooms.splice(rooms.indexOf(room), 1);
      continue;
    }
    room.rect = keep;
    for (const piece of pieces) {
      if (piece === keep) continue;
      rooms.push(openPiece(`${room.id}_cut`, piece, storey, room.life === "outdoor"));
    }
  }

  const foyerRoom: PlannedRoom = {
    id: storey === 0 ? `foyer_${storey}` : `landing_${storey}`,
    kind: storey === 0 ? "foyer" : "landing",
    floor: storey,
    rect: foyer,
    life: "circulation",
    vastuRegion: ZONE_DIR[facingZone(facing)],
    doors: [],
    windows: [],
    adjacentTo: [],
  };
  rooms.push(foyerRoom);
  return foyerRoom;
}

function connectFoyer(foyerRoom: PlannedRoom, rooms: PlannedRoom[]): void {
  const open = rooms.filter((r) => r.id !== foyerRoom.id && (r.life === "circulation" || r.life === "outdoor"));
  doorOntoOpen(foyerRoom, open);
  if (foyerRoom.doors.length) return;
  const hosts = rooms
    .filter((r) => !isWet(r.kind) && r.life !== "circulation" && r.life !== "outdoor" && sharedSeg(r.rect, foyerRoom.rect))
    .sort((a, b) => {
      const rank = (s: PlannedRoom) => (s.kind === "dining" || s.kind === "living" ? 0 : 1);
      return rank(a) - rank(b);
    });
  const host = hosts[0];
  if (!host) return;
  const dx = host.rect.x + host.rect.w / 2 - (foyerRoom.rect.x + foyerRoom.rect.w / 2);
  const dy = host.rect.y + host.rect.h / 2 - (foyerRoom.rect.y + foyerRoom.rect.h / 2);
  addDoor(foyerRoom, Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "e" : "w") : dy > 0 ? "s" : "n", 0.5, host.id);
}

function pickZone(
  kind: SpaceKind,
  free: ZoneId[],
  mode: VastuMode,
  fits: (zone: ZoneId) => boolean,
): { zone: ZoneId; relaxed: boolean } | null {
  const preferred = allowedRegions(kind, "strict").filter((d) => free.some((id) => ZONE_DIR[id] === d));
  const acceptable = allowedRegions(kind, "flexible").filter((d) => !preferred.includes(d));
  const rank = (ids: VastuDirectionId[]) =>
    free
      .filter((id) => ids.includes(ZONE_DIR[id]) && fits(id))
      .sort((a, b) => vastuCost(kind, ZONE_DIR[a], mode).cost - vastuCost(kind, ZONE_DIR[b], mode).cost);
  const best = rank(preferred)[0];
  if (best) return { zone: best, relaxed: false };
  const next = rank(acceptable)[0];
  if (next) return { zone: next, relaxed: mode === "strict" };
  return null;
}

function doorOntoOpen(room: PlannedRoom, open: PlannedRoom[]): void {
  if (room.doors.length) return;
  const ranked = [...open].sort((a, b) => {
    const score = (s: PlannedRoom) => (s.id.startsWith("center_") ? 0 : s.kind === "brahmasthan" ? 1 : 2);
    return score(a) - score(b);
  });
  for (const space of ranked) {
    const seg = sharedSeg(room.rect, space.rect);
    if (seg) {
      addDoor(room, seg.wall, 0.5, space.id);
      return;
    }
  }
}

function usableCell(cell: Rect, cuts: Rect[]): Rect {
  let pieces = [cell];
  for (const cut of cuts) {
    pieces = pieces.flatMap((p) => splitBy(p, cut));
  }
  return largest(pieces) ?? cell;
}

function openPiece(id: string, rect: Rect, storey: StoreyId, wantCourt: boolean): PlannedRoom {
  return {
    id,
    kind: "brahmasthan",
    floor: storey,
    rect,
    life: wantCourt ? "outdoor" : "circulation",
    vastuRegion: "center",
    doors: [],
    windows: [],
    adjacentTo: [],
  };
}

function buildFloor(
  storey: StoreyId,
  program: PlannedSpace[],
  site: SiteInput,
  mode: VastuMode,
  stair: StairShaft | null,
  wantCourt: boolean,
): { rooms: PlannedRoom[]; leftover: PlannedSpace[]; relaxed: PlanConflict[] } {
  const grid = mandala(site.width, site.height);
  const rooms: PlannedRoom[] = [];
  const relaxed: PlanConflict[] = [];
  const leftover: PlannedSpace[] = [];
  const cornerCuts = notches(grid.center, grid.notch);

  const centerId = `center_${storey}`;
  rooms.push(openPiece(centerId, grid.center, storey, wantCourt));
  for (const [i, rect] of cornerCuts.entries()) {
    rooms.push(openPiece(`center_notch_${i}_${storey}`, rect, storey, wantCourt));
  }

  const foyer = foyerRect(site.facing, site.width, site.height, 1.35);
  const free: ZoneId[] = Object.keys(grid.cells) as ZoneId[];
  const majors = program
    .filter((s) => !WET_KINDS.has(s.kind) && s.kind !== "staircase" && s.kind !== "courtyard")
    .sort((a, b) => PLACE_ORDER.indexOf(a.kind) - PLACE_ORDER.indexOf(b.kind));
  const wets = program.filter((s) => WET_KINDS.has(s.kind));
  const usedHosts = new Set<string>();

  const cellCuts = (zone: ZoneId) => (CORNER_ZONES.includes(zone) ? [cornerCuts[CORNER_ZONES.indexOf(zone)]!] : []);
  const cellRect = (zone: ZoneId) => usableCell(grid.cells[zone], cellCuts(zone));

  for (const space of majors) {
    const picked = pickZone(space.kind, free, mode, (zone) => boxFits(cellRect(zone).w, cellRect(zone).h, IDEAL_SIZE[space.kind]));
    if (!picked) {
      leftover.push(space);
      continue;
    }
    const { zone } = picked;
    const rect = cellRect(zone);
    free.splice(free.indexOf(zone), 1);
    const room = makeRoom(space, rect, storey, ZONE_DIR[zone]);
    if (picked.relaxed || vastuCost(space.kind, ZONE_DIR[zone], mode).relaxed) {
      relaxed.push({ id: `relax-${room.id}`, severity: "info", messageKey: "vastu.plan.valid.vastu_relaxed" });
    }
    rooms.push(room);
  }

  const placeWetInCell = (wet: PlannedSpace): boolean => {
    const picked = pickZone(
      wet.kind,
      free,
      mode,
      (zone) => {
        const box = wetRectInCell(cellRect(zone), wet.kind, zone, [foyer]);
        return !toiletForbidden(ZONE_DIR[zone]) && boxFits(box.w, box.h, IDEAL_SIZE[wet.kind]);
      },
    );
    if (!picked || toiletForbidden(ZONE_DIR[picked.zone])) return false;
    const cell = cellRect(picked.zone);
    const rect = wetRectInCell(cell, wet.kind, picked.zone, [foyer]);
    free.splice(free.indexOf(picked.zone), 1);
    rooms.push(makeRoom(wet, rect, storey, ZONE_DIR[picked.zone]));
    for (const piece of splitBy(cell, rect)) {
      if (piece.w >= 0.9 && piece.h >= 0.9) rooms.push(openPiece(`center_${picked.zone}_${storey}`, piece, storey, wantCourt));
    }
    return true;
  };

  const attachLater: PlannedSpace[] = [];
  for (const wet of wets) {
    if (wet.kind === "combined" && mode === "strict") {
      leftover.push(wet);
      relaxed.push({ id: `sep-${wet.id}`, severity: "info", messageKey: "vastu.plan.valid.wet_separate" });
      continue;
    }
    if (wet.kind === "toilet" || wet.kind === "combined") {
      attachLater.push(wet);
      continue;
    }
    if (!placeWetInCell(wet)) leftover.push(wet);
  }

  if (stair) {
    const hostRoom = rooms.find((r) => {
      if (r.life === "circulation" || r.kind === "staircase" || r.kind === "brahmasthan") return false;
      return contains(r.rect, stair.rect) || overlapArea(r.rect, stair.rect) > 0.4;
    });
    if (hostRoom) {
      const remain = largest(splitBy(hostRoom.rect, stair.rect));
      if (remain && boxFits(remain.w, remain.h, IDEAL_SIZE[hostRoom.kind as SpaceKind])) {
        hostRoom.rect = remain;
      }
    }
    rooms.push({
      id: `stair_${storey}`,
      kind: "staircase",
      floor: storey,
      rect: stair.rect,
      life: "vertical",
      vastuRegion: regionOfShaft(stair.rect, grid),
      doors: [],
      windows: [],
      adjacentTo: [centerId],
    });
  }

  for (const id of free) {
    const rect = cellRect(id);
    if (rect.w < 0.9 || rect.h < 0.9) continue;
    rooms.push(openPiece(`center_${id}_${storey}`, rect, storey, wantCourt));
  }

  const boxedFoyer = placeFoyer(rooms, foyer, storey, site.facing);

  for (const wet of attachLater) {
    let done = false;
    for (const host of rooms) {
      if (!HOST_KINDS.has(host.kind as SpaceKind) || usedHosts.has(host.id)) continue;
      const attached = attachToilet(host, wet, storey);
      if (attached) {
        usedHosts.add(host.id);
        rooms.push(attached);
        done = true;
        break;
      }
    }
    if (done) continue;
    if (!placeWetInCell(wet)) leftover.push(wet);
  }

  const open = rooms.filter((r) => r.life === "circulation" || r.life === "outdoor");
  if (boxedFoyer) connectFoyer(boxedFoyer, rooms);
  for (const room of rooms) {
    if (room.life === "circulation" || room.life === "outdoor") continue;
    doorOntoOpen(room, open);
    room.fixtures = furnishRoom(room);
  }

  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      if (sharedSeg(rooms[i]!.rect, rooms[j]!.rect)) {
        rooms[i]!.adjacentTo.push(rooms[j]!.id);
        rooms[j]!.adjacentTo.push(rooms[i]!.id);
      }
    }
  }

  return { rooms, leftover, relaxed };
}

function contains(outer: Rect, inner: Rect): boolean {
  return inner.x >= outer.x - 0.05 && inner.y >= outer.y - 0.05 && inner.x + inner.w <= outer.x + outer.w + 0.05 && inner.y + inner.h <= outer.y + outer.h + 0.05;
}

function overlapArea(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

function regionOfShaft(rect: Rect, grid: ReturnType<typeof mandala>): VastuDirectionId {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  for (const id of Object.keys(grid.cells) as ZoneId[]) {
    const z = grid.cells[id];
    if (cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h) return ZONE_DIR[id];
  }
  return "south";
}

function stairOnSite(site: SiteInput, want: boolean): StairShaft | null {
  if (!want) return null;
  const grid = mandala(site.width, site.height);
  const face = facingZone(site.facing);
  const id: ZoneId = face === "s" ? "w" : "s";
  const cell = grid.cells[id];
  const rect: Rect =
    id === "s"
      ? { x: cell.x + cell.w - Math.min(STAIR_W, cell.w * 0.36), y: cell.y, w: Math.min(STAIR_W, cell.w * 0.36), h: Math.min(STAIR_L, cell.h) }
      : { x: cell.x + cell.w - Math.min(STAIR_W, cell.w * 0.36), y: cell.y + cell.h - Math.min(STAIR_L, cell.h), w: Math.min(STAIR_W, cell.w * 0.36), h: Math.min(STAIR_L, cell.h) };
  return { id: "stair_shaft", rect, rise: "n", floors: [0, 1, 2], hostId: id };
}

function buildConcept(plan: HousePlan, site: SiteInput): HouseConcept {
  const storeys = clampStoreys(plan.storeys);
  const mode = plan.mode;
  const all = expandPlannedSpaces(plan);
  const wantStair = storeys > 1;
  const stair = stairOnSite(site, wantStair);
  const wantCourt = all.some((s) => s.kind === "courtyard");

  const buckets: PlannedSpace[][] = [[], [], []];
  for (const space of all) {
    if (space.kind === "staircase") continue;
    buckets[resolveStorey(space, plan)]!.push(space);
  }

  const floors: FloorConcept[] = [];
  const leftover: PlannedSpace[] = [];
  const vastuRelaxed: PlanConflict[] = [];
  let overflow: PlannedSpace[] = [];

  for (let i = 0; i < storeys; i++) {
    const storey = i as StoreyId;
    const batch = [...overflow, ...(buckets[storey] ?? [])];
    overflow = [];
    const built = buildFloor(storey, batch, site, mode, stair, wantCourt);
    floors.push({
      storey,
      rooms: built.rooms,
      layer: compileLayer(site.width, site.height, site.facing, built.rooms),
    });
    vastuRelaxed.push(...built.relaxed);
    overflow = built.leftover;
  }
  leftover.push(...overflow);

  return {
    width: site.width,
    height: site.height,
    facing: site.facing,
    mode,
    floors,
    leftover,
    stair,
    validation: validateConcept(floors, leftover, storeys),
    vastuRelaxed,
  };
}

export function planHouse(plan: HousePlan, site: SiteInput): HouseConcept {
  return buildConcept(plan, site);
}

export { ZONE_DIR };
