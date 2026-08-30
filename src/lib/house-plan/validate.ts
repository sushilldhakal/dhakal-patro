import { WET_KINDS, type SpaceKind } from "@/lib/vastu-plan";
import { sharedSeg } from "./building";
import { toiletForbidden } from "./classical";
import type { FloorConcept, HouseConcept, PlanConflict, PlannedRoom, Rect, ValidationReport } from "./types";

function overlapLoose(a: Rect, b: Rect): boolean {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0.12 && h > 0.12;
}

function isRoom(row: PlannedRoom): boolean {
  return row.life !== "circulation";
}

function neighbors(room: PlannedRoom, floor: FloorConcept): string[] {
  const out = room.doors.map((d) => d.connectsTo);
  for (const other of floor.rooms) {
    if (other.id === room.id) continue;
    if (other.doors.some((d) => d.connectsTo === room.id)) out.push(other.id);
    const touch = sharedSeg(room.rect, other.rect);
    const bothOpen =
      (room.life === "circulation" || room.life === "outdoor") &&
      (other.life === "circulation" || other.life === "outdoor");
    if (bothOpen && touch) out.push(other.id);
    if (
      room.life !== "circulation" &&
      (other.life === "circulation" || other.life === "outdoor") &&
      (touch || overlapLoose(room.rect, other.rect))
    ) {
      out.push(other.id);
    }
  }
  return out;
}

export function validateConcept(floors: FloorConcept[], leftover: HouseConcept["leftover"], storeys: number): ValidationReport {
  const issues: PlanConflict[] = [];
  const missingDoor = floors.flatMap((f) => f.rooms.filter((r) => isRoom(r) && r.doors.length === 0));
  if (missingDoor.length) {
    issues.push({ id: "doors", severity: "warn", messageKey: "vastu.plan.valid.missing_door" });
  }

  let allReachable = true;
  for (const floor of floors) {
    const hall = floor.rooms.find(
      (r) =>
        r.kind === "hall" ||
        r.kind === "foyer" ||
        r.kind === "landing" ||
        r.kind === "brahmasthan" ||
        r.kind === "verandah",
    );
    if (!hall) {
      allReachable = false;
      issues.push({ id: `reach-${floor.storey}`, severity: "warn", messageKey: "vastu.plan.valid.no_hall" });
      continue;
    }
    const seen = new Set<string>([hall.id]);
    const q = [hall.id];
    const byId = new Map(floor.rooms.map((r) => [r.id, r]));
    while (q.length) {
      const id = q.pop()!;
      const node = byId.get(id);
      if (!node) continue;
      for (const next of neighbors(node, floor)) {
        if (seen.has(next)) continue;
        seen.add(next);
        q.push(next);
      }
    }
    for (const room of floor.rooms.filter(isRoom)) {
      if (!seen.has(room.id)) {
        allReachable = false;
        issues.push({ id: `iso-${room.id}`, severity: "warn", messageKey: "vastu.plan.valid.isolated" });
      }
    }
  }

  const privateThroughPrivate = floors.some((floor) =>
    floor.rooms.some((room) => {
      if (room.life !== "private") return false;
      const onlyPrivate = room.doors.every((d) => {
        const other = floor.rooms.find((r) => r.id === d.connectsTo);
        return other?.life === "private";
      });
      return (
        room.doors.length > 0 &&
        onlyPrivate &&
        !room.doors.some(
          (d) =>
            d.connectsTo.includes("hall") ||
            d.connectsTo.includes("center") ||
            d.connectsTo.includes("verandah") ||
            d.connectsTo.includes("foyer"),
        )
      );
    }),
  );
  if (privateThroughPrivate) {
    issues.push({ id: "privacy", severity: "warn", messageKey: "vastu.plan.valid.private_through" });
  }

  const stairConnects =
    storeys === 1 ||
    floors.every((f) => f.rooms.some((r) => r.kind === "staircase")) ||
    leftover.some((r) => r.kind === "staircase");
  if (storeys > 1 && !floors.every((f) => f.rooms.some((r) => r.kind === "staircase"))) {
    issues.push({ id: "stair", severity: "warn", messageKey: "vastu.plan.valid.stair" });
  }

  let kitchenNearDining = true;
  for (const floor of floors) {
    const kitchen = floor.rooms.find((r) => r.kind === "kitchen");
    const dining = floor.rooms.find((r) => r.kind === "dining");
    if (kitchen && dining) {
      const touch = kitchen.adjacentTo.includes(dining.id) || dining.adjacentTo.includes(kitchen.id);
      const viaHall = kitchen.doors.some((d) => dining.doors.some((e) => e.connectsTo === d.connectsTo));
      const bothOnCourt = kitchen.doors.some((d) => {
        const a = floor.rooms.find((r) => r.id === d.connectsTo);
        return (
          a &&
          (a.life === "circulation" || a.life === "outdoor") &&
          dining.doors.some((e) => {
            const b = floor.rooms.find((r) => r.id === e.connectsTo);
            return b && (b.life === "circulation" || b.life === "outdoor");
          })
        );
      });
      kitchenNearDining = touch || viaHall || bothOnCourt;
      if (!kitchenNearDining) {
        issues.push({ id: "kit-din", severity: "info", messageKey: "vastu.plan.valid.kitchen_dining" });
      }
    }
  }

  const wets = floors.flatMap((f) => f.rooms.filter((r) => WET_KINDS.has(r.kind as SpaceKind)));
  const wetOk = wets.every((r) => r.doors.length > 0);
  if (wets.length && !wetOk) {
    issues.push({ id: "wet-access", severity: "info", messageKey: "vastu.plan.valid.wet_access" });
  }

  const badToilet = floors.some((floor) =>
    floor.rooms.some((r) => (r.kind === "toilet" || r.kind === "combined") && toiletForbidden(r.vastuRegion)),
  );
  if (badToilet) {
    issues.push({ id: "toilet-zone", severity: "warn", messageKey: "vastu.plan.valid.toilet_zone" });
  }

  return {
    allReachable,
    everyRoomHasDoor: missingDoor.length === 0,
    stairConnects,
    kitchenNearDining,
    privateThroughPrivate,
    issues,
  };
}
