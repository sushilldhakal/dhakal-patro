import { useId } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/i18n/locale";
import {
  VASTU_DIR16,
  VASTU_ELEMENT_COLOR,
  VASTU_ELEMENT_ORDER,
  VASTU_INK,
  VASTU_PADAS,
  annularSectorPath,
  evenBearings,
  vastuDirection,
  vastuElementAtBearing,
  vastuElementTint,
  vastuWheelPoint,
} from "@/lib/vastu";
import { ArcLabel, PadaCodeLabel, RingSeparators, VastuPurushaSilhouette, WHEEL_SIZE } from "./VastuPurushaWheel";
import type { BHole, BWall, BuildingLayer, FloorConcept, HouseConcept, PlannedRoom } from "@/lib/house-plan/types";

/** Pixels-per-metre converter, built fresh per render at whatever scale
 * fits the current plot inside the compass ring (see computeScale). */
type PxFn = (n: number) => number;

// ─── Compass ring geometry — same annular-band approach as VastuPurushaWheel,
// just wrapped around the house footprint instead of an empty hub, so the
// same degree/16-direction/N1–N8 reading applies to the actual room layout.
// RING_SIZE must equal WHEEL_SIZE: the reused ArcLabel/PadaCodeLabel/
// RingSeparators close over the wheel's own CX/CY rather than taking them as
// props, so this ring has to share that exact centre, not just its size.
const RING_SIZE = WHEEL_SIZE;
const CX = RING_SIZE / 2;
const CY = RING_SIZE / 2;
// Bands are single-line here (just the abbreviation/code, no second attribute
// line like the wheel's own DIR16 ring), so each can be much thinner than the
// wheel's — that leaves most of the radius for the house itself instead of
// the compass. Pushed out almost to the canvas edge (306 vs the wheel's own
// 304-of-310), same tightness the wheel already uses.
const R_DEG_OUTER = 306;
const R_DEG_INNER = 290;
const R_16_OUTER = R_DEG_INNER;
const R_16_INNER = 264;
const R_PADA_OUTER = R_16_INNER;
const R_PADA_INNER = 236;
/** Everything inside this radius is the house — kept clear of the ring bands. */
const R_HOUSE = 230;
const DEG_LABEL_R = (R_DEG_OUTER + R_DEG_INNER) / 2;
const DIR16_LABEL_R = (R_16_OUTER + R_16_INNER) / 2;
const PADA_LABEL_R = (R_PADA_OUTER + R_PADA_INNER) / 2;
const DIR16_BOUNDARIES = evenBearings(16, 11.25);
const PADA_BOUNDARIES = evenBearings(32, 0);
const PURUSHA_OPACITY = 0.16;
/** Matches VastuPurushaWheel's own PURUSHA_SIZE formula, sized to R_HOUSE instead of its DEG_INNER. */
const PURUSHA_SIZE = Math.round(R_HOUSE * Math.SQRT2 * 0.82);
/** Metres of clearance left inside R_HOUSE so exterior wall thickness never touches the pada ring. */
const HOUSE_MARGIN_M = 0.35;
/** px/metre this layout renders a typical (~14×15m) plot at — used to scale
 * label font size up/down for smaller or much larger plots. */
const REFERENCE_SCALE = 20;

function computeScale(width: number, height: number): number {
  const diag = Math.hypot(width + HOUSE_MARGIN_M * 2, height + HOUSE_MARGIN_M * 2);
  return (2 * R_HOUSE * 0.97) / diag;
}

/** Open/circulation kinds — Brahmasthan, its corner notches and other
 * leftover fragments, the foyer, a hall, an upper-floor landing. These are
 * all the same open floor (compileLayer draws no wall between adjacent
 * ones, in engine/vedic/vastu/building.py), so they share one fill — a
 * per-fragment opacity difference used to make the true mandala centre
 * "pop" but left every smaller fragment reading as its own separate,
 * disconnected patch instead of one continuous space. */
const OPEN_KINDS = new Set(["brahmasthan", "foyer", "hall", "landing"]);

function roomFill(room: PlannedRoom): string {
  const element = vastuDirection(room.vastuRegion).element;
  if (OPEN_KINDS.has(room.kind)) {
    return vastuElementTint(element, 0.3);
  }
  if (room.kind === "staircase") return vastuElementTint("earth", 0.18);
  return vastuElementTint(element, 0.26);
}

function StairTreads({ room, px }: { room: PlannedRoom; px: PxFn }) {
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

function wallEnds(layer: BuildingLayer, wall: BWall): { x1: number; y1: number; x2: number; y2: number; len: number } | null {
  const a = layer.vertices.find((v) => v.id === wall.a);
  const b = layer.vertices.find((v) => v.id === wall.b);
  if (!a || !b) return null;
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (len < 0.04) return null;
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, len };
}

function ThickWall({ layer, wall, holes, px }: { layer: BuildingLayer; wall: BWall; holes: BHole[]; px: PxFn }) {
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

function Opening({ layer, hole, px }: { layer: BuildingLayer; hole: BHole; px: PxFn }) {
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
  const clipId = `house-purusha-${useId().replace(/:/g, "")}`;
  const layer = floor.layer;
  const scale = computeScale(concept.width, concept.height);
  const px: PxFn = (n) => n * scale;
  const fontScale = Math.min(1.25, Math.max(0.6, scale / REFERENCE_SCALE));
  const originX = CX - px(concept.width) / 2;
  const originY = CY - px(concept.height) / 2;

  function labelOf(room: PlannedRoom): string {
    if (room.kind === "brahmasthan") {
      // "brahmasthan" is the shared kind for every open/circulation
      // fragment, not just the true centre — a leftover carve scrap in a
      // corner is this kind too. Only a fragment the engine actually
      // marked vastuRegion "center" (the real crossing of the corridor
      // spine) is a candidate for the "ब्रह्मस्थान" label; picking the
      // largest fragment *by area* regardless of where it is let a big
      // merged scrap off in some other zone outrank the true (deliberately
      // thin) centre band and get labeled the sacred centre in its place.
      const courts = floor.rooms.filter((r) => r.kind === "brahmasthan");
      const centreCourts = courts.filter((r) => r.vastuRegion === "center");
      const pool = centreCourts.length > 0 ? centreCourts : courts;
      const main = pool.reduce((a, b) => (a.rect.w * a.rect.h >= b.rect.w * b.rect.h ? a : b));
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
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className="mx-auto block h-auto w-full rounded-lg border border-border"
        style={{ backgroundColor: VASTU_INK.background }}
        overflow="visible"
        role="img"
        aria-label={t("vastu.plan.layout_heading")}
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx={CX} cy={CY} r={R_HOUSE} />
          </clipPath>
        </defs>

        <circle cx={CX} cy={CY} r={R_DEG_OUTER} fill={VASTU_INK.background} />

        {/* N1–N8 pada ring, with the same +/- auspicious marks as the wheel */}
        {VASTU_PADAS.map((pada) => {
          const color = VASTU_ELEMENT_COLOR[pada.element];
          return (
            <g key={`pada-${pada.id}`} aria-hidden="true">
              <title>{`${pada.wall}${digits(pada.index)} · ${t(`vastu.pada.${pada.id}.name`)} · ${t(`vastu.wheel.status.${pada.status}`)}`}</title>
              <path d={annularSectorPath(pada.bearing, 5.625, R_PADA_OUTER, R_PADA_INNER, CX, CY)} fill={color} fillOpacity={0.3} />
              <PadaCodeLabel bearing={pada.bearing} radius={PADA_LABEL_R} code={`${pada.wall}${digits(pada.index)}`} status={pada.status} />
            </g>
          );
        })}

        {/* 16-direction abbreviation ring (N, NNE, NE, …) */}
        {VASTU_DIR16.map((dir) => {
          const color = VASTU_ELEMENT_COLOR[vastuElementAtBearing(dir.bearing)];
          return (
            <g key={`dir16-${dir.id}`} aria-hidden="true">
              <title>{t(`vastu.dir16.${dir.id}.name`)}</title>
              <path d={annularSectorPath(dir.bearing, 11.25, R_16_OUTER, R_16_INNER, CX, CY)} fill={color} fillOpacity={0.34} />
              <ArcLabel bearing={dir.bearing} radius={DIR16_LABEL_R} fontSize={11} className="font-bold">
                {dir.abbr}
              </ArcLabel>
            </g>
          );
        })}

        {[R_DEG_OUTER, R_DEG_INNER, R_16_INNER, R_PADA_INNER].map((r) => (
          <circle key={`ring-div-${r}`} cx={CX} cy={CY} r={r} fill="none" stroke={VASTU_INK.text} strokeOpacity={0.4} strokeWidth={0.9} />
        ))}
        <RingSeparators bearings={DIR16_BOUNDARIES} innerR={R_16_INNER} outerR={R_16_OUTER} />
        <RingSeparators bearings={PADA_BOUNDARIES} innerR={R_PADA_INNER} outerR={R_PADA_OUTER} />

        {/* Degree tick rim on top, same as the wheel, so ring fills can't bleed over it */}
        {Array.from({ length: 360 }, (_, bearing) => {
          const every10 = bearing % 10 === 0;
          const every5 = bearing % 5 === 0;
          const cardinal = bearing % 90 === 0;
          const tickInner = every10 ? R_DEG_INNER : every5 ? R_DEG_INNER + 4 : R_DEG_OUTER - 5;
          const inner = vastuWheelPoint(bearing, tickInner, CX, CY);
          const outer = vastuWheelPoint(bearing, R_DEG_OUTER, CX, CY);
          return (
            <g key={`tick-${bearing}`} aria-hidden="true">
              <line
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={VASTU_INK.text}
                strokeOpacity={cardinal ? 0.9 : every10 ? 0.7 : every5 ? 0.5 : 0.28}
                strokeWidth={cardinal ? 1.3 : every10 ? 0.8 : every5 ? 0.42 : 0.26}
              />
              {every10 ? (
                <ArcLabel bearing={bearing} radius={DEG_LABEL_R} fontSize={7} className="font-semibold" fillOpacity={0.8}>
                  {digits(bearing)}
                </ArcLabel>
              ) : null}
            </g>
          );
        })}

        {/* Vastu Purusha, faint, behind the rooms — head northeast, feet southwest, same as the wheel */}
        <g clipPath={`url(#${clipId})`} pointerEvents="none" aria-hidden>
          <g transform={`translate(${CX} ${CY})`} opacity={PURUSHA_OPACITY} style={{ color: VASTU_INK.text }}>
            <VastuPurushaSilhouette size={PURUSHA_SIZE} />
          </g>
        </g>

        {/* the house plan itself, scaled to sit inside the ring, north at top */}
        <g transform={`translate(${originX} ${originY})`} style={{ color: VASTU_INK.text }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <line
              key={`vg${i}`}
              x1={px((concept.width * i) / 3)}
              y1={0}
              x2={px((concept.width * i) / 3)}
              y2={px(concept.height)}
              stroke={VASTU_INK.line}
              strokeOpacity={0.45}
            />
          ))}
          {Array.from({ length: 4 }).map((_, i) => (
            <line
              key={`hg${i}`}
              x1={0}
              y1={px((concept.height * i) / 3)}
              x2={px(concept.width)}
              y2={px((concept.height * i) / 3)}
              stroke={VASTU_INK.line}
              strokeOpacity={0.45}
            />
          ))}

          {floor.rooms.map((room) => (
            <rect
              key={`${room.id}-fill`}
              x={px(room.rect.x)}
              y={px(room.rect.y)}
              width={px(room.rect.w)}
              height={px(room.rect.h)}
              fill={roomFill(room)}
              stroke="none"
            />
          ))}

          {floor.rooms.map((room) => (room.kind === "staircase" ? <StairTreads key={`${room.id}-stair`} room={room} px={px} /> : null))}

          {layer.walls.map((wall) => (
            <ThickWall key={wall.id} layer={layer} wall={wall} holes={layer.holes} px={px} />
          ))}

          {layer.holes.map((hole) => (
            <Opening key={hole.id} layer={layer} hole={hole} px={px} />
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
                  y={cy - (small ? 0 : 6 * fontScale)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={VASTU_INK.text}
                  fontSize={(small ? 8 : 10) * fontScale}
                  fontWeight={600}
                >
                  {name}
                </text>
                {!small && (
                  <text x={cx} y={cy + 10 * fontScale} textAnchor="middle" fill={VASTU_INK.text} fillOpacity={0.65} fontSize={8 * fontScale}>
                    {size}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <li className="font-semibold text-foreground">{t("vastu.plan.elements")}</li>
        {VASTU_ELEMENT_ORDER.map((element) => (
          <li key={element} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: VASTU_ELEMENT_COLOR[element] }} aria-hidden />
            {t(`vastu.element.${element}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default HouseFloorPlan;
