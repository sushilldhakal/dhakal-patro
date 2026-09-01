import type { CardinalWall, VastuDirectionId } from "@/lib/vastu";
import type { PlannedSpace, SpaceKind, StoreyId, VastuMode } from "@/lib/vastu-plan";

export type Wall = "n" | "e" | "s" | "w";

export type Rect = { x: number; y: number; w: number; h: number };

export type LifeZone = "public" | "semi" | "private" | "service" | "vertical" | "outdoor" | "circulation";

export type CircKind = "hall" | "foyer" | "landing" | "brahmasthan" | "verandah";

export type PlanKind = SpaceKind | CircKind;

export type PlannedDoor = {
  id: string;
  roomId: string;
  wall: Wall;
  /** 0–1 along the wall from north/west. */
  t: number;
  width: number;
  swing: "in_left" | "in_right";
  connectsTo: string;
};

export type PlannedWindow = {
  id: string;
  roomId: string;
  wall: Wall;
  t: number;
  width: number;
  type: "full" | "high" | "vent";
};

export type FixtureKind =
  | "wc"
  | "basin"
  | "bed"
  | "sofa"
  | "armchair"
  | "chair"
  | "table"
  | "desk"
  | "wardrobe"
  | "cupboard"
  | "bookcase"
  | "stove"
  | "fridge"
  | "sink"
  | "tv"
  | "ac";

export type RoomFixture = {
  id: string;
  kind: FixtureKind;
  rect: Rect;
  /** Direction the sleeper's head, or the seated person, faces. */
  facing?: Wall;
  height?: number;
  /** Height above the floor — used for wall AC. */
  lift?: number;
};

export type PlannedRoom = {
  id: string;
  kind: PlanKind;
  index?: number;
  floor: StoreyId;
  rect: Rect;
  life: LifeZone;
  vastuRegion: VastuDirectionId;
  doors: PlannedDoor[];
  windows: PlannedWindow[];
  adjacentTo: string[];
  fixtures?: RoomFixture[];
};

export type StairShaft = {
  id: string;
  rect: Rect;
  rise: Wall;
  floors: StoreyId[];
  hostId?: string;
};

export type PlanConflict = {
  id: string;
  severity: "info" | "warn";
  messageKey: string;
};

export type ValidationReport = {
  allReachable: boolean;
  everyRoomHasDoor: boolean;
  stairConnects: boolean;
  kitchenNearDining: boolean;
  privateThroughPrivate: boolean;
  issues: PlanConflict[];
};

export type BVertex = { id: string; x: number; y: number };

export type BWall = {
  id: string;
  a: string;
  b: string;
  thickness: number;
  role: "exterior" | "interior";
};

export type BHole = {
  id: string;
  wallId: string;
  /** 0–1 along A→B, center of the opening. */
  offset: number;
  width: number;
  type: "door" | "window" | "entrance";
  swing: "left" | "right";
  from: string;
  to: string;
  /** Opening height (doors use 1:2 vs width). */
  height?: number;
  /** Sill above floor — high on south/west windows. */
  sill?: number;
};

/** Wall / hole / vertex graph — same idea as react-planner layers. */
export type BuildingLayer = {
  vertices: BVertex[];
  walls: BWall[];
  holes: BHole[];
};

export type FloorConcept = {
  storey: StoreyId;
  rooms: PlannedRoom[];
  layer: BuildingLayer;
};

export type PlanScore = {
  score: number;
  vastuScore: number;
  planningScore: number;
  circulationScore: number;
  satisfiedRules: string[];
  relaxedRules: string[];
  conflicts: string[];
};

export type HouseConcept = {
  ruleVersion: string;
  width: number;
  height: number;
  facing: CardinalWall;
  mode: VastuMode;
  floors: FloorConcept[];
  leftover: PlannedSpace[];
  stair: StairShaft | null;
  validation: ValidationReport;
  vastuRelaxed: PlanConflict[];
  score: PlanScore;
};

export type SiteInput = {
  width: number;
  height: number;
  facing: CardinalWall;
};
