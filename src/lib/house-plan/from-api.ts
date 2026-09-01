import type { VastuDirectionId } from "@/lib/vastu";
import type {
  VastuHousePlanResponseApi,
  VastuPlannedRoomApi,
  VastuPlanConflictApi,
} from "@/lib/api";
import type { SpaceKind, VastuMode } from "@/lib/vastu-plan";
import type {
  BHole,
  BuildingLayer,
  FloorConcept,
  HouseConcept,
  PlanConflict,
  PlannedDoor,
  PlannedRoom,
  PlannedWindow,
  StairShaft,
} from "./types";

/** The one place that knows both shapes — everything downstream
 * (HouseFloorPlan.tsx, HousePlan3D.tsx) keeps consuming HouseConcept exactly
 * as it did when it came from the local engine. */

function fromConflict(c: VastuPlanConflictApi): PlanConflict {
  return { id: c.id, severity: c.severity, messageKey: c.message_key };
}

function fromRoom(r: VastuPlannedRoomApi): PlannedRoom {
  return {
    id: r.id,
    kind: r.kind as PlannedRoom["kind"],
    index: r.index ?? undefined,
    floor: r.floor as PlannedRoom["floor"],
    rect: { x: r.x, y: r.y, w: r.w, h: r.h },
    life: r.life as PlannedRoom["life"],
    vastuRegion: r.vastu_region as VastuDirectionId,
    doors: r.doors.map(
      (d): PlannedDoor => ({
        id: d.id,
        roomId: d.room_id,
        wall: d.wall,
        t: d.t,
        width: d.width,
        swing: d.swing,
        connectsTo: d.connects_to,
      }),
    ),
    windows: r.windows.map(
      (w): PlannedWindow => ({
        id: w.id,
        roomId: w.room_id,
        wall: w.wall,
        t: w.t,
        width: w.width,
        type: w.type,
      }),
    ),
    adjacentTo: r.adjacent_to,
  };
}

function fromLayer(layer: VastuHousePlanResponseApi["floors"][number]["layer"]): BuildingLayer {
  return {
    vertices: layer.vertices.map((v) => ({ id: v.id, x: v.x, y: v.y })),
    walls: layer.walls.map((w) => ({ id: w.id, a: w.a, b: w.b, thickness: w.thickness, role: w.role })),
    holes: layer.holes.map(
      (h): BHole => ({
        id: h.id,
        wallId: h.wall_id,
        offset: h.offset,
        width: h.width,
        type: h.type,
        swing: h.swing,
        from: h.from,
        to: h.to,
        height: h.height ?? undefined,
        sill: h.sill ?? undefined,
      }),
    ),
  };
}

function fromFloor(floor: VastuHousePlanResponseApi["floors"][number]): FloorConcept {
  return {
    storey: floor.storey as FloorConcept["storey"],
    rooms: floor.rooms.map(fromRoom),
    layer: fromLayer(floor.layer),
  };
}

function fromStair(stair: VastuHousePlanResponseApi["stair"]): StairShaft | null {
  if (!stair) return null;
  return {
    id: stair.id,
    rect: { x: stair.x, y: stair.y, w: stair.w, h: stair.h },
    rise: stair.rise,
    floors: stair.floors as StairShaft["floors"],
    hostId: stair.host_id ?? undefined,
  };
}

export function fromApiHousePlan(response: VastuHousePlanResponseApi): HouseConcept {
  return {
    ruleVersion: response.rule_version,
    width: response.width,
    height: response.height,
    facing: response.facing,
    mode: response.mode as VastuMode,
    floors: response.floors.map(fromFloor),
    leftover: response.leftover.map((s) => ({ id: s.id, kind: s.kind as SpaceKind, index: s.index ?? undefined })),
    stair: fromStair(response.stair),
    validation: {
      allReachable: response.validation.all_reachable,
      everyRoomHasDoor: response.validation.every_room_has_door,
      stairConnects: response.validation.stair_connects,
      kitchenNearDining: response.validation.kitchen_near_dining,
      privateThroughPrivate: response.validation.private_through_private,
      issues: response.validation.issues.map(fromConflict),
    },
    vastuRelaxed: response.vastu_relaxed.map(fromConflict),
    score: {
      score: response.score.score,
      vastuScore: response.score.vastu_score,
      planningScore: response.score.planning_score,
      circulationScore: response.score.circulation_score,
      satisfiedRules: response.score.satisfied_rules,
      relaxedRules: response.score.relaxed_rules,
      conflicts: response.score.conflicts,
    },
  };
}
