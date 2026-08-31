import { useTranslation } from "react-i18next";
import { useLocale } from "@/i18n/locale";
import { CARDINAL_WALLS } from "@/lib/vastu";
import { pada32Points } from "@/lib/house-plan/classical";
import type { BHole, BWall, BuildingLayer, FloorConcept, HouseConcept, PlannedRoom } from "@/lib/house-plan/types";

const SCALE = 28;

function px(n: number): number {
  return n * SCALE;
}

function roomFill(kind: PlannedRoom["kind"], id: string): string {
  if (kind === "brahmasthan") {
    return id.startsWith("center_")
      ? "color-mix(in srgb, var(--primary) 18%, var(--card))"
      : "color-mix(in srgb, var(--primary) 10%, var(--card))";
  }
  if (kind === "verandah" || kind === "hall" || kind === "landing") {
    return "color-mix(in srgb, var(--secondary) 12%, var(--card))";
  }
  if (kind === "foyer") return "color-mix(in srgb, var(--secondary) 22%, var(--card))";
  if (kind === "staircase") return "color-mix(in srgb, var(--foreground) 7%, var(--card))";
  if (kind === "courtyard" || kind === "garden" || kind === "balcony" || kind === "garage") {
    return "color-mix(in srgb, var(--primary) 8%, var(--card))";
  }
  return "var(--card)";
}

function StairTreads({ room }: { room: PlannedRoom }) {
  const r = room.rect;
  const steps = 8;
  const along = r.h >= r.w;
  return (
    <g>
      {Array.from({ length: steps - 1 }, (_, i) => {
        if (along) {
          const y = r.y + ((i + 1) * r.h) / steps;
          return <line key={i} x1={px(r.x)} y1={px(y)} x2={px(r.x + r.w)} y2={px(y)} stroke="currentColor" strokeOpacity={0.35} />;
        }
        const x = r.x + ((i + 1) * r.w) / steps;
        return <line key={i} x1={px(x)} y1={px(r.y)} x2={px(x)} y2={px(r.y + r.h)} stroke="currentColor" strokeOpacity={0.35} />;
      })}
    </g>
  );
}

/** The 32-pada Dvāra-vinyāsa boundary marks — a "+" or "−" just outside each wall's 8 sectors. */
function PadaMarks({ width, height }: { width: number; height: number }) {
  const offset = 0.42;
  return (
    <g className="select-none">
      {CARDINAL_WALLS.flatMap((wall) =>
        pada32Points(wall, width, height).map((p) => (
          <text
            key={`${wall}-${p.id}`}
            x={px(p.x + p.nx * offset)}
            y={px(p.y + p.ny * offset)}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={9}
            fontWeight={700}
            fill={p.good ? "var(--color-success)" : "var(--color-danger)"}
          >
            <title>{`${p.id} · ${p.name} · ${p.good ? "+" : "−"}`}</title>
            {p.good ? "+" : "−"}
          </text>
        )),
      )}
    </g>
  );
}

function NorthArrow({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${px(x)} ${px(y)})`} className="text-foreground">
      <polygon points="0,-16 -6,8 0,4 6,8" fill="currentColor" />
      <text y={20} textAnchor="middle" fontSize={9} fontWeight={700} fill="currentColor">
        N
      </text>
    </g>
  );
}

function wallEnds(layer: BuildingLayer, wall: BWall): { x1: number; y1: number; x2: number; y2: number; len: number } | null {
  const a = layer.vertices.find((v) => v.id === wall.a);
  const b = layer.vertices.find((v) => v.id === wall.b);
  if (!a || !b) return null;
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (len < 0.04) return null;
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, len };
}

function ThickWall({ layer, wall, holes }: { layer: BuildingLayer; wall: BWall; holes: BHole[] }) {
  const ends = wallEnds(layer, wall);
  if (!ends) return null;
  const { x1, y1, x2, y2, len } = ends;
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const half = wall.thickness / 2;
  const cuts = holes
    .filter((h) => h.wallId === wall.id)
    .map((h) => ({ lo: h.offset - h.width / 2 / len, hi: h.offset + h.width / 2 / len }))
    .sort((a, b) => a.lo - b.lo);
  const spans: { lo: number; hi: number }[] = [];
  let cursor = 0;
  for (const cut of cuts) {
    const lo = Math.max(0, cut.lo);
    const hi = Math.min(1, cut.hi);
    if (lo > cursor + 0.01) spans.push({ lo: cursor, hi: lo });
    cursor = Math.max(cursor, hi);
  }
  if (cursor < 0.99) spans.push({ lo: cursor, hi: 1 });

  return (
    <g transform={`translate(${px(x1)} ${px(y1)}) rotate(${angle})`}>
      {spans.map((span, i) => (
        <rect
          key={i}
          x={px(span.lo * len)}
          y={px(-half)}
          width={px((span.hi - span.lo) * len)}
          height={px(wall.thickness)}
          fill="color-mix(in srgb, var(--foreground) 72%, var(--card))"
        />
      ))}
    </g>
  );
}

function Opening({ layer, hole }: { layer: BuildingLayer; hole: BHole }) {
  const wall = layer.walls.find((w) => w.id === hole.wallId);
  if (!wall) return null;
  const ends = wallEnds(layer, wall);
  if (!ends) return null;
  const { x1, y1, x2, y2, len } = ends;
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const along = hole.offset * len;
  const w = hole.width;
  if (hole.type === "window") {
    return (
      <g transform={`translate(${px(x1)} ${px(y1)}) rotate(${angle})`}>
        <line x1={px(along - w / 2)} y1={0} x2={px(along + w / 2)} y2={0} stroke="var(--card)" strokeWidth={5} />
        <line
          x1={px(along - w / 2)}
          y1={0}
          x2={px(along + w / 2)}
          y2={0}
          stroke="currentColor"
          strokeWidth={1.4}
          strokeDasharray="3 2"
        />
      </g>
    );
  }
  const flip = hole.swing === "right" ? 1 : -1;
  return (
    <g transform={`translate(${px(x1)} ${px(y1)}) rotate(${angle})`}>
      <line x1={px(along - w / 2)} y1={0} x2={px(along + w / 2)} y2={0} stroke="var(--card)" strokeWidth={6} />
      <path
        d={`M ${px(along - w / 2)} 0 A ${px(w)} ${px(w)} 0 0 ${flip > 0 ? 1 : 0} ${px(along - w / 2)} ${px(w * flip)}`}
        fill="none"
        stroke="var(--secondary)"
        strokeWidth={1.3}
        strokeDasharray="4 3"
      />
      <line
        x1={px(along - w / 2)}
        y1={0}
        x2={px(along - w / 2)}
        y2={px(w * flip)}
        stroke="var(--secondary)"
        strokeWidth={1.4}
      />
    </g>
  );
}

export function HouseFloorPlan({
  concept,
  floor,
}: {
  concept: HouseConcept;
  floor: FloorConcept;
}) {
  const { t } = useTranslation();
  const { digits } = useLocale();
  const pad = 1.2;
  const svgW = px(concept.width + pad * 2);
  const svgH = px(concept.height + pad * 2);
  const layer = floor.layer;

  function labelOf(room: PlannedRoom): string {
    if (room.kind === "brahmasthan") {
      const courts = floor.rooms.filter((r) => r.kind === "brahmasthan");
      const main = courts.reduce((a, b) => (a.rect.w * a.rect.h >= b.rect.w * b.rect.h ? a : b));
      return room.id === main.id ? t("vastu.dir.center.name") : "";
    }
    if (room.kind === "verandah") return "";
    if (room.kind === "hall" || room.kind === "landing") return t("vastu.plan.hall_label");
    if (room.kind === "foyer") return t("vastu.plan.foyer_label");
    const many = floor.rooms.filter((r) => r.kind === room.kind).length > 1;
    if (many && room.index != null) return t(`vastu.plan.space.${room.kind}_n`, { n: digits(room.index) });
    return t(`vastu.plan.space.${room.kind}`);
  }

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="h-auto w-full rounded-lg border border-border bg-[color-mix(in_srgb,var(--background)_70%,var(--card))]"
        role="img"
        aria-label={t("vastu.plan.layout_heading")}
      >
        <g transform={`translate(${px(pad)} ${px(pad)})`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <line
              key={`vg${i}`}
              x1={px((concept.width * i) / 3)}
              y1={0}
              x2={px((concept.width * i) / 3)}
              y2={px(concept.height)}
              stroke="currentColor"
              strokeOpacity={0.05}
            />
          ))}
          {Array.from({ length: 4 }).map((_, i) => (
            <line
              key={`hg${i}`}
              x1={0}
              y1={px((concept.height * i) / 3)}
              x2={px(concept.width)}
              y2={px((concept.height * i) / 3)}
              stroke="currentColor"
              strokeOpacity={0.05}
            />
          ))}

          {floor.rooms.map((room) => (
            <rect
              key={`${room.id}-fill`}
              x={px(room.rect.x)}
              y={px(room.rect.y)}
              width={px(room.rect.w)}
              height={px(room.rect.h)}
              fill={roomFill(room.kind, room.id)}
              stroke="none"
            />
          ))}

          {floor.rooms.map((room) => (room.kind === "staircase" ? <StairTreads key={`${room.id}-stair`} room={room} /> : null))}

          {layer.walls.map((wall) => (
            <ThickWall key={wall.id} layer={layer} wall={wall} holes={layer.holes} />
          ))}

          {layer.holes.map((hole) => (
            <Opening key={hole.id} layer={layer} hole={hole} />
          ))}

          {floor.rooms.map((room) => {
            const name = labelOf(room);
            if (!name) return null;
            const size = t("vastu.plan.room_size", {
              w: digits(room.rect.w.toFixed(1)),
              h: digits(room.rect.h.toFixed(1)),
            });
            const cx = px(room.rect.x + room.rect.w / 2);
            const cy = px(room.rect.y + room.rect.h / 2);
            const small = room.rect.w < 2.2 || room.rect.h < 1.8;
            return (
              <g key={`${room.id}-lab`}>
                <text
                  x={cx}
                  y={cy - (small ? 0 : 6)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="currentColor"
                  fontSize={small ? 8 : 10}
                  fontWeight={600}
                >
                  {name}
                </text>
                {!small && (
                  <text x={cx} y={cy + 10} textAnchor="middle" fill="currentColor" fillOpacity={0.65} fontSize={8}>
                    {size}
                  </text>
                )}
              </g>
            );
          })}

          <PadaMarks width={concept.width} height={concept.height} />
          <NorthArrow x={concept.width - 0.55} y={0.7} />
        </g>
      </svg>
    </div>
  );
}

export default HouseFloorPlan;
