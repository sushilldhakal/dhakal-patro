import { useTranslation } from "react-i18next";
import { useLocale } from "@/i18n/locale";
import { VastuPurushaSilhouette } from "@/components/vastu/VastuPurushaWheel";
import {
  ENTRANCE_PREFERRED_CORNER,
  VASTU_ELEMENT_COLOR,
  WALL_CORNERS,
  inscribedFootprint,
  roomsForDirection,
  solveTrapezoid,
  vastuDirection,
  type CardinalWall,
  type PlotFootprint,
  type VastuDirectionId,
} from "@/lib/vastu";
import { IDEAL_SIZE, STAIR_WIDTH_M, WET_KINDS, type SpaceKind } from "@/lib/vastu-plan";

export type LayoutRoom = { id: string; label: string; kind?: SpaceKind };

type Wall = "n" | "e" | "s" | "w";
type Cell = { x: number; y: number; w: number; h: number };

const WINDOW_KINDS = new Set<SpaceKind>([
  "living",
  "bedroom",
  "master_bedroom",
  "kitchen",
  "dining",
  "study",
  "office",
  "family",
  "guest",
  "gym",
  "library",
  "puja",
  "bathroom",
]);
const OPEN_KINDS = new Set<SpaceKind>(["garden", "courtyard", "balcony", "garage"]);

type PlacedRoom = { room: LayoutRoom; cell: Cell; doorWall?: Wall };

function overlapsY(a: Cell, b: Cell): boolean {
  return a.y < b.y + b.h && a.y + a.h > b.y;
}

function overlapsX(a: Cell, b: Cell): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x;
}

function intersection(a: Cell, b: Cell): Cell | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const r = Math.min(a.x + a.w, b.x + b.w);
  const btm = Math.min(a.y + a.h, b.y + b.h);
  if (r - x <= 0.6 || btm - y <= 0.6) return null;
  return { x, y, w: r - x, h: btm - y };
}

/** Push a room out of hall rectangles, keeping the largest leftover box. */
function shrinkOutOf(box: Cell, halls: Cell[]): Cell {
  let r = { ...box };
  for (const hall of halls) {
    const o = intersection(r, hall);
    if (!o) continue;
    const next: Cell[] = [];
    const above = o.y - r.y;
    if (above > 8) next.push({ x: r.x, y: r.y, w: r.w, h: above });
    const below = r.y + r.h - (o.y + o.h);
    if (below > 8) next.push({ x: r.x, y: o.y + o.h, w: r.w, h: below });
    const left = o.x - r.x;
    if (left > 8) next.push({ x: r.x, y: r.y, w: left, h: r.h });
    const right = r.x + r.w - (o.x + o.w);
    if (right > 8) next.push({ x: o.x + o.w, y: r.y, w: right, h: r.h });
    if (next.length) r = next.reduce((best, c) => (c.w * c.h > best.w * best.h ? c : best));
  }
  return r;
}

function entranceSpine(
  facing: CardinalWall,
  cellW: number,
  cellH: number,
  blockW: number,
  blockH: number,
  fpW: number,
  fpH: number,
): Cell {
  const cells = entranceCells(facing);
  const y0 = Math.min(...cells.map((c) => c.row)) * cellH;
  const y1 = (Math.max(...cells.map((c) => c.row)) + 1) * cellH;
  const x0 = Math.min(...cells.map((c) => c.col)) * cellW;
  const x1 = (Math.max(...cells.map((c) => c.col)) + 1) * cellW;
  const midX = blockW + blockW / 2;
  const midY = blockH + blockH / 2;
  if (facing === "east") {
    const yEnd = Math.max(y1, midY + (y1 - y0) * 0.15);
    return { x: blockW, y: y0, w: fpW - blockW, h: yEnd - y0 };
  }
  if (facing === "west") {
    const yEnd = Math.max(y1, midY + (y1 - y0) * 0.15);
    return { x: 0, y: y0, w: blockW * 2, h: yEnd - y0 };
  }
  if (facing === "north") {
    const xEnd = Math.max(x1, midX + (x1 - x0) * 0.15);
    return { x: x0, y: 0, w: xEnd - x0, h: blockH * 2 };
  }
  const xEnd = Math.max(x1, midX + (x1 - x0) * 0.15);
  return { x: x0, y: blockH, w: xEnd - x0, h: fpH - blockH };
}

function wallOnHall(cell: Cell, halls: Cell[]): Wall | null {
  const gap = 2.4;
  for (const hall of halls) {
    if (Math.abs(cell.x + cell.w - hall.x) < gap && overlapsY(cell, hall)) return "e";
    if (Math.abs(hall.x + hall.w - cell.x) < gap && overlapsY(cell, hall)) return "w";
    if (Math.abs(cell.y + cell.h - hall.y) < gap && overlapsX(cell, hall)) return "s";
    if (Math.abs(hall.y + hall.h - cell.y) < gap && overlapsX(cell, hall)) return "n";
  }
  return null;
}

function pickWetOuter(zone: VastuDirectionId, w: number, h: number, hasStair: boolean): Wall {
  if (hasStair) {
    return zone === "northwest" || zone === "north" || zone === "northeast" ? "n" : "s";
  }
  if (w >= h) {
    return zone === "east" || zone === "northeast" || zone === "southeast" ? "e" : "w";
  }
  return zone === "south" || zone === "southeast" || zone === "southwest" ? "s" : "n";
}

function splitEnsuite(
  x: number,
  y: number,
  w: number,
  h: number,
  outer: Wall,
  wetSpan: number,
): { main: Cell; wet: Cell } {
  const along = outer === "n" || outer === "s" ? h : w;
  const span = Math.min(Math.max(wetSpan, along * 0.28), along * 0.4);
  if (outer === "n") {
    return { wet: { x, y, w, h: span }, main: { x, y: y + span, w, h: h - span } };
  }
  if (outer === "s") {
    return { wet: { x, y: y + h - span, w, h: span }, main: { x, y, w, h: h - span } };
  }
  if (outer === "w") {
    return { wet: { x, y, w: span, h }, main: { x: x + span, y, w: w - span, h } };
  }
  return { wet: { x: x + w - span, y, w: span, h }, main: { x, y, w: w - span, h } };
}

function wrapLabel(label: string): string[] {
  const trimmed = label.trim();
  if (trimmed.length <= 10) return [trimmed];
  const mid = Math.ceil(trimmed.length / 2);
  const space = trimmed.indexOf(" ", Math.max(4, mid - 4));
  if (space > 0 && space < trimmed.length - 2) {
    return [trimmed.slice(0, space), trimmed.slice(space + 1)];
  }
  return [trimmed];
}

function exteriorWalls(cell: Cell, fpW: number, fpH: number): Wall[] {
  const edge = 6;
  const out: Wall[] = [];
  if (cell.y <= edge) out.push("n");
  if (cell.x + cell.w >= fpW - edge) out.push("e");
  if (cell.y + cell.h >= fpH - edge) out.push("s");
  if (cell.x <= edge) out.push("w");
  return out;
}

function inwardWall(cell: Cell, fpW: number, fpH: number): Wall {
  const dx = fpW / 2 - (cell.x + cell.w / 2);
  const dy = fpH / 2 - (cell.y + cell.h / 2);
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "e" : "w";
  return dy >= 0 ? "s" : "n";
}

function opposite(wall: Wall): Wall {
  return wall === "n" ? "s" : wall === "s" ? "n" : wall === "e" ? "w" : "e";
}

function openingSize(cell: Cell, wall: Wall, ratio = 0.28): number {
  const along = wall === "n" || wall === "s" ? cell.w : cell.h;
  const depth = wall === "n" || wall === "s" ? cell.h : cell.w;
  return Math.max(4.5, Math.min(along * ratio, depth * 0.42, 11));
}

/** Classic plan door: 90° swing into the room, leaf from the hinge. */
function DoorSwing({ cell, wall }: { cell: Cell; wall: Wall }) {
  const r = openingSize(cell, wall, 0.24);
  let hx = 0;
  let hy = 0;
  let closedX = 0;
  let closedY = 0;
  let openX = 0;
  let openY = 0;
  if (wall === "n") {
    hx = cell.x + cell.w / 2 - r / 2;
    hy = cell.y;
    closedX = hx + r;
    closedY = hy;
    openX = hx;
    openY = hy + r;
  } else if (wall === "s") {
    hx = cell.x + cell.w / 2 + r / 2;
    hy = cell.y + cell.h;
    closedX = hx - r;
    closedY = hy;
    openX = hx;
    openY = hy - r;
  } else if (wall === "w") {
    hx = cell.x;
    hy = cell.y + cell.h / 2 - r / 2;
    closedX = hx;
    closedY = hy + r;
    openX = hx + r;
    openY = hy;
  } else {
    hx = cell.x + cell.w;
    hy = cell.y + cell.h / 2 + r / 2;
    closedX = hx;
    closedY = hy - r;
    openX = hx - r;
    openY = hy;
  }
  const sweep = wall === "n" || wall === "s" ? 1 : 0;
  return (
    <g>
      <line
        x1={closedX}
        y1={closedY}
        x2={hx}
        y2={hy}
        stroke="var(--card)"
        strokeWidth={2.4}
        strokeLinecap="butt"
      />
      <path
        d={`M ${closedX} ${closedY} A ${r} ${r} 0 0 ${sweep} ${openX} ${openY}`}
        fill="none"
        stroke="var(--secondary)"
        strokeWidth={1}
      />
      <line x1={hx} y1={hy} x2={openX} y2={openY} stroke="var(--secondary)" strokeWidth={1.15} />
    </g>
  );
}

function WindowMark({ cell, wall }: { cell: Cell; wall: Wall }) {
  const size = openingSize(cell, wall, 0.32);
  const gap = 1.4;
  if (wall === "n" || wall === "s") {
    const x = cell.x + cell.w / 2 - size / 2;
    const y = wall === "n" ? cell.y : cell.y + cell.h;
    return (
      <g>
        <line x1={x} y1={y} x2={x + size} y2={y} stroke="var(--card)" strokeWidth={2.2} />
        <line x1={x} y1={y - gap} x2={x + size} y2={y - gap} stroke="currentColor" strokeWidth={1} />
        <line x1={x} y1={y + gap} x2={x + size} y2={y + gap} stroke="currentColor" strokeWidth={1} />
      </g>
    );
  }
  const y = cell.y + cell.h / 2 - size / 2;
  const x = wall === "w" ? cell.x : cell.x + cell.w;
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + size} stroke="var(--card)" strokeWidth={2.2} />
      <line x1={x - gap} y1={y} x2={x - gap} y2={y + size} stroke="currentColor" strokeWidth={1} />
      <line x1={x + gap} y1={y} x2={x + gap} y2={y + size} stroke="currentColor" strokeWidth={1} />
    </g>
  );
}

/** Compact stair well in a corner — treads stay inside, arrow is a triangle. */
function StairMark({ cell }: { cell: Cell }) {
  const x = cell.x + 1.2;
  const y = cell.y + 1.2;
  const wellW = cell.w - 2.4;
  const wellH = cell.h - 2.4;
  const steps = 7;
  const tread = wellH / steps;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={wellW}
        height={wellH}
        fill="var(--card)"
        fillOpacity={0.35}
        stroke="currentColor"
        strokeOpacity={0.5}
        strokeWidth={0.9}
      />
      {Array.from({ length: steps - 1 }, (_, i) => {
        const yy = y + (i + 1) * tread;
        return (
          <line
            key={i}
            x1={x}
            y1={yy}
            x2={x + wellW}
            y2={yy}
            stroke="currentColor"
            strokeOpacity={0.45}
            strokeWidth={0.8}
          />
        );
      })}
      <polygon
        points={`${x + wellW / 2},${y + 2.2} ${x + wellW / 2 - 2.2},${y + 6} ${x + wellW / 2 + 2.2},${y + 6}`}
        fill="var(--secondary)"
      />
    </g>
  );
}

const SIZE_BASIS = 320;
const GRID_CELLS = 9;

/** The 9 super-blocks (3x3 cells each) of the Paramasayika grid, north at top. */
const ZONE_BLOCKS: { id: VastuDirectionId; row: number; col: number }[] = [
  { id: "northwest", row: 0, col: 0 },
  { id: "north", row: 0, col: 1 },
  { id: "northeast", row: 0, col: 2 },
  { id: "west", row: 1, col: 0 },
  { id: "center", row: 1, col: 1 },
  { id: "east", row: 1, col: 2 },
  { id: "southwest", row: 2, col: 0 },
  { id: "south", row: 2, col: 1 },
  { id: "southeast", row: 2, col: 2 },
];

/** Two cells along the facing wall's 9-cell edge, biased toward the preferred
 * corner but never touching the corner (index 0/8) or the center (index 4). */
function entranceCells(facing: CardinalWall): { row: number; col: number }[] {
  const preferredIsSecond = WALL_CORNERS[facing][1] === ENTRANCE_PREFERRED_CORNER[facing];
  const indices = preferredIsSecond ? [5, 6] : [2, 3];
  switch (facing) {
    case "north":
      return indices.map((col) => ({ row: 0, col }));
    case "south":
      return indices.map((col) => ({ row: GRID_CELLS - 1, col }));
    case "east":
      return indices.map((row) => ({ row, col: GRID_CELLS - 1 }));
    case "west":
      return indices.map((row) => ({ row, col: 0 }));
  }
}

/** Same stair shaft on every floor: west strip of the remaining room box. One room, or room + ensuite. */
function zoneLayout(
  rooms: LayoutRoom[],
  zone: VastuDirectionId,
  box: Cell,
  mPerX: number,
  mPerY: number,
): PlacedRoom[] {
  const pad = 1.2;
  const x = box.x + pad;
  const y = box.y + pad;
  const w = box.w - pad * 2;
  const h = box.h - pad * 2;
  if (w < 10 || h < 10) return [];
  const stair = rooms.find((r) => r.kind === "staircase");
  const wet = rooms.find((r) => r.kind && WET_KINDS.has(r.kind));
  const main = rooms.find((r) => r.kind !== "staircase" && !(r.kind && WET_KINDS.has(r.kind)));
  const placed: PlacedRoom[] = [];
  let rx = x;
  let ry = y;
  let rw = w;
  const rh = h;
  if (stair) {
    const shaftW = Math.min(w * 0.38, Math.max(STAIR_WIDTH_M / mPerX, w * 0.2));
    placed.push({ room: stair, cell: { x, y, w: shaftW, h } });
    rx = x + shaftW + 1.2;
    rw = w - shaftW - 1.2;
  }
  if (main && wet) {
    const outer = pickWetOuter(zone, rw, rh, Boolean(stair));
    const wetM = IDEAL_SIZE[wet.kind ?? "combined"].minSide;
    const wetSpan = outer === "n" || outer === "s" ? wetM / mPerY : wetM / mPerX;
    const split = splitEnsuite(rx, ry, rw, rh, outer, wetSpan);
    placed.push({ room: main, cell: split.main });
    placed.push({ room: wet, cell: split.wet, doorWall: opposite(outer) });
    return placed;
  }
  if (main) placed.push({ room: main, cell: { x: rx, y: ry, w: rw, h: rh } });
  else if (wet) placed.push({ room: wet, cell: { x: rx, y: ry, w: rw, h: rh } });
  return placed;
}

function roomsInZone(
  blockId: VastuDirectionId,
  layoutRooms: Partial<Record<VastuDirectionId, LayoutRoom[]>> | undefined,
  t: (key: string) => string,
): LayoutRoom[] {
  const planned = layoutRooms?.[blockId] ?? [];
  if (layoutRooms) return planned;
  return roomsForDirection(blockId).map((r) => ({
    id: r.id,
    label: t(`vastu.room.${r.id}.name`),
    kind: r.id === "bathroom" ? "combined" : (r.id as SpaceKind),
  }));
}

export function PlotMandalaDiagram({
  north,
  east,
  south,
  west,
  facing,
  layoutRooms,
  clipId = "vastu-house-footprint",
  showNotes = true,
}: {
  north: number;
  east: number;
  south: number;
  west: number;
  facing: CardinalWall;
  /** One box is drawn for each room the form requested. */
  layoutRooms?: Partial<Record<VastuDirectionId, LayoutRoom[]>>;
  clipId?: string;
  showNotes?: boolean;
}) {
  const { t } = useTranslation();
  const { digits } = useLocale();
  const trapezoid = solveTrapezoid(north, east, south, west);
  const footprint: PlotFootprint | null = trapezoid ? inscribedFootprint(trapezoid) : null;

  if (!trapezoid || !footprint) {
    return <p className="text-sm text-destructive">{t("vastu.plot.invalid_shape")}</p>;
  }

  const maxX = Math.max(trapezoid.sw.x, trapezoid.se.x, trapezoid.ne.x, trapezoid.nw.x);
  const minX = Math.min(trapezoid.sw.x, trapezoid.se.x, trapezoid.ne.x, trapezoid.nw.x);
  const scale = SIZE_BASIS / Math.max(maxX - minX, trapezoid.height);
  const toSvg = (p: { x: number; y: number }) => ({
    x: (p.x - minX) * scale,
    y: (trapezoid.height - p.y) * scale,
  });

  const svgW = (maxX - minX) * scale;
  const svgH = trapezoid.height * scale;

  const sw = toSvg(trapezoid.sw);
  const se = toSvg(trapezoid.se);
  const ne = toSvg(trapezoid.ne);
  const nw = toSvg(trapezoid.nw);
  const boundaryPoints = [sw, se, ne, nw].map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const fpX = (footprint.x - minX) * scale;
  const fpY = (trapezoid.height - (footprint.y + footprint.height)) * scale;
  const fpW = footprint.width * scale;
  const fpH = footprint.height * scale;
  const mPerX = footprint.width / fpW;
  const mPerY = footprint.height / fpH;

  const cellW = fpW / GRID_CELLS;
  const cellH = fpH / GRID_CELLS;
  const blockW = cellW * 3;
  const blockH = cellH * 3;
  const spine = entranceSpine(facing, cellW, cellH, blockW, blockH, fpW, fpH);
  const halls: Cell[] = [
    { x: blockW, y: blockH, w: blockW, h: blockH },
    spine,
  ];
  const floor = ZONE_BLOCKS.map((block) => {
    const x = block.col * blockW;
    const y = block.row * blockH;
    const rooms = roomsInZone(block.id, layoutRooms, t);
    const openOnly = rooms.length > 0 && rooms.every((r) => r.kind && OPEN_KINDS.has(r.kind));
    const usable =
      block.id === "center" || openOnly
        ? { x, y, w: blockW, h: blockH }
        : shrinkOutOf({ x, y, w: blockW, h: blockH }, halls);
    return { block, x, y, placed: zoneLayout(rooms, block.id, usable, mPerX, mPerY) };
  });
  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${svgW.toFixed(1)} ${svgH.toFixed(1)}`}
        className="h-auto w-full"
        role="img"
        aria-label={t("vastu.plot.heading")}
      >
        <polygon points={boundaryPoints} fill="currentColor" fillOpacity={0.05} stroke="currentColor" strokeOpacity={0.4} strokeWidth={1.5} />

        <g transform={`translate(${fpX.toFixed(1)}, ${fpY.toFixed(1)})`}>
          <defs>
            <clipPath id={clipId}>
              <rect x={0} y={0} width={fpW} height={fpH} />
            </clipPath>
          </defs>

          {ZONE_BLOCKS.map((block) => {
            const dir = vastuDirection(block.id);
            const color = VASTU_ELEMENT_COLOR[dir.element];
            const x = block.col * blockW;
            const y = block.row * blockH;
            return (
              <rect
                key={`fill-${block.id}`}
                x={x}
                y={y}
                width={blockW}
                height={blockH}
                fill={color}
                fillOpacity={block.id === "center" ? 0.22 : 0.12}
                stroke={color}
                strokeOpacity={0.4}
                strokeWidth={1}
              />
            );
          })}

          {Array.from({ length: GRID_CELLS + 1 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * cellW}
              y1={0}
              x2={i * cellW}
              y2={fpH}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={0.5}
            />
          ))}
          {Array.from({ length: GRID_CELLS + 1 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i * cellH}
              x2={fpW}
              y2={i * cellH}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={0.5}
            />
          ))}

          {halls.map((hall, i) => (
            <rect
              key={`hall-${i}`}
              x={hall.x}
              y={hall.y}
              width={hall.w}
              height={hall.h}
              fill="var(--secondary)"
              fillOpacity={0.18}
            />
          ))}

          {floor.map(({ block, placed }) => {
            return (
              <g key={block.id}>
                {placed.map(({ room, cell }) => {
                  const open = room.kind ? OPEN_KINDS.has(room.kind) : false;
                  return (
                    <rect
                      key={room.id}
                      x={cell.x}
                      y={cell.y}
                      width={cell.w}
                      height={cell.h}
                      rx={1.5}
                      fill="var(--card)"
                      fillOpacity={open ? 0.08 : 0.28}
                      stroke="currentColor"
                      strokeOpacity={0.45}
                      strokeWidth={1.1}
                      strokeDasharray={open ? "3 2" : undefined}
                    />
                  );
                })}
              </g>
            );
          })}

          <g clipPath={`url(#${clipId})`} pointerEvents="none" aria-hidden>
            <g transform={`translate(${fpW / 2} ${fpH / 2})`} className="text-foreground" opacity={0.05}>
              <VastuPurushaSilhouette size={Math.min(fpW, fpH) * 1.04} />
            </g>
          </g>

          <text
            x={
              facing === "east"
                ? fpW - cellW
                : facing === "west"
                  ? cellW
                  : spine.x + spine.w / 2
            }
            y={
              facing === "north"
                ? cellH * 0.7
                : facing === "south"
                  ? fpH - cellH * 0.7
                  : spine.y + spine.h / 2
            }
            textAnchor="middle"
            dominantBaseline="central"
            className="pointer-events-none select-none font-semibold"
            fill="var(--secondary)"
            fillOpacity={0.9}
            fontSize={7.5}
          >
            {t("vastu.plan.hall_label")}
          </text>
          <text
            x={blockW + blockW / 2}
            y={blockH + blockH / 2}
            textAnchor="middle"
            dominantBaseline="central"
            className="pointer-events-none select-none font-semibold"
            fill="currentColor"
            fillOpacity={0.5}
            fontSize={8}
          >
            {t("vastu.dir.center.name")}
          </text>

          {floor.map(({ block, x, y, placed }) => {
            const dirName = t(`vastu.dir.${block.id}.name`);
            return (
              <g key={`detail-${block.id}`}>
                {placed.length === 0 && block.id !== "center" && block.id !== facing && (
                  <text
                    x={x + blockW / 2}
                    y={y + blockH / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="pointer-events-none select-none text-[9px] font-semibold"
                    fill="currentColor"
                    fillOpacity={0.45}
                  >
                    {dirName}
                  </text>
                )}
                {placed.map(({ room, cell, doorWall: doorOverride }) => {
                  const kind = room.kind;
                  const isStair = kind === "staircase";
                  const doorWall =
                    doorOverride ?? wallOnHall(cell, halls) ?? inwardWall(cell, fpW, fpH);
                  const outer = exteriorWalls(cell, fpW, fpH);
                  const windowWall =
                    kind && WINDOW_KINDS.has(kind)
                      ? outer.find((w) => w !== doorWall) ?? outer[0] ?? opposite(doorWall)
                      : null;
                  const lines = wrapLabel(room.label);
                  const font = cell.h < 30 || cell.w < 38 ? 6.2 : 7.5;
                  const wM = cell.w * mPerX;
                  const hM = cell.h * mPerY;
                  const sizeLabel = t("vastu.plan.room_size", {
                    w: digits(wM.toFixed(1)),
                    h: digits(hM.toFixed(1)),
                  });
                  return (
                    <g key={room.id}>
                      {isStair ? (
                        <StairMark cell={cell} />
                      ) : (
                        <>
                          {!kind || !OPEN_KINDS.has(kind) ? <DoorSwing cell={cell} wall={doorWall} /> : null}
                          {windowWall && cell.w > 18 && cell.h > 18 ? (
                            <WindowMark cell={cell} wall={windowWall} />
                          ) : null}
                        </>
                      )}
                      <text
                        x={cell.x + cell.w / 2}
                        y={cell.y + cell.h / 2 - (lines.length > 1 ? 4 : 2)}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="pointer-events-none select-none font-semibold"
                        fill="currentColor"
                        fontSize={font}
                      >
                        {lines.map((line, li) => (
                          <tspan
                            key={li}
                            x={cell.x + cell.w / 2}
                            dy={li === 0 ? 0 : font + 1}
                          >
                            {line}
                          </tspan>
                        ))}
                      </text>
                      <text
                        x={cell.x + cell.w / 2}
                        y={cell.y + cell.h / 2 + lines.length * (font * 0.7) + 5}
                        textAnchor="middle"
                        className="pointer-events-none select-none"
                        fill="currentColor"
                        fillOpacity={0.7}
                        fontSize={Math.max(5.5, font - 1.2)}
                      >
                        {sizeLabel}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          <rect x={0} y={0} width={fpW} height={fpH} fill="none" stroke="currentColor" strokeOpacity={0.6} strokeWidth={1.5} />

          <line x1={0} y1={0} x2={fpW} y2={fpH} stroke="currentColor" strokeOpacity={0.22} strokeWidth={1} strokeDasharray="4 3" />
          <line x1={fpW} y1={0} x2={0} y2={fpH} stroke="currentColor" strokeOpacity={0.22} strokeWidth={1} strokeDasharray="4 3" />

          {entranceCells(facing).map(({ row, col }) => {
            const thick = 5;
            const door =
              facing === "north"
                ? { x: col * cellW, y: 0, w: cellW, h: thick }
                : facing === "south"
                  ? { x: col * cellW, y: fpH - thick, w: cellW, h: thick }
                  : facing === "east"
                    ? { x: fpW - thick, y: row * cellH, w: thick, h: cellH }
                    : { x: 0, y: row * cellH, w: thick, h: cellH };
            return (
              <rect
                key={`${row}-${col}`}
                x={door.x}
                y={door.y}
                width={door.w}
                height={door.h}
                fill="var(--secondary)"
                stroke="var(--secondary)"
                strokeWidth={1}
              />
            );
          })}
        </g>
      </svg>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm bg-secondary/25" aria-hidden />
          {t("vastu.plan.legend.hall")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden>
            <path d="M2 2 A8 8 0 0 0 10 2" fill="none" stroke="var(--secondary)" strokeWidth="1.4" />
            <line x1="2" y1="2" x2="2" y2="10" stroke="var(--secondary)" strokeWidth="1.4" />
          </svg>
          {t("vastu.plan.legend.door")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden>
            <line x1="2" y1="4" x2="16" y2="4" stroke="currentColor" strokeWidth="1.4" />
            <line x1="2" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          {t("vastu.plan.legend.window")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <rect x="2" y="1" width="10" height="12" fill="none" stroke="currentColor" strokeWidth="1" />
            <line x1="2" y1="4" x2="12" y2="4" stroke="currentColor" strokeWidth="0.8" />
            <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="0.8" />
            <line x1="2" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="0.8" />
            <polygon points="7,2.2 5.4,4.4 8.6,4.4" fill="var(--secondary)" />
          </svg>
          {t("vastu.plan.legend.stair")}
        </span>
      </div>

      {showNotes && (
        <>
          <p className="text-sm text-muted-foreground">{t("vastu.plot.buffer_note")}</p>
          <p className="text-sm text-muted-foreground">{t("vastu.plot.marma_note")}</p>
        </>
      )}
    </div>
  );
}

export default PlotMandalaDiagram;
