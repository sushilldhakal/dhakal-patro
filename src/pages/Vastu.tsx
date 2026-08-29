import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Compass, DoorOpen, TriangleAlert, Wrench } from "lucide-react";
import { PageShell, PageHeader } from "../components/PageShell";
import { useRouteLoading } from "@/lib/route-loading";
import {
  VASTU_DIRECTIONS,
  VASTU_DOSHAS,
  VASTU_ELEMENT_COLOR,
  VASTU_ROOMS,
  VASTU_WHEEL_DIRECTIONS,
  vastuDirection,
  vastuWheelPoint,
  type VastuDirectionId,
} from "@/lib/vastu";
import { cn } from "@/lib/utils";

const WHEEL_SIZE = 340;
const CX = WHEEL_SIZE / 2;
const CY = WHEEL_SIZE / 2;
const OUTER_R = 162;
const INNER_R = 62;
const LABEL_R = (OUTER_R + INNER_R) / 2;

/** Annular sector for one 45° slice, centred on `bearing`. */
function sectorPath(bearing: number): string {
  const from = bearing - 22.5;
  const to = bearing + 22.5;
  const o1 = vastuWheelPoint(from, OUTER_R, CX, CY);
  const o2 = vastuWheelPoint(to, OUTER_R, CX, CY);
  const i1 = vastuWheelPoint(to, INNER_R, CX, CY);
  const i2 = vastuWheelPoint(from, INNER_R, CX, CY);
  return [
    `M ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
    `A ${OUTER_R} ${OUTER_R} 0 0 1 ${o2.x.toFixed(2)} ${o2.y.toFixed(2)}`,
    `L ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
    `A ${INNER_R} ${INNER_R} 0 0 0 ${i2.x.toFixed(2)} ${i2.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function DirectionWheel({
  selected,
  onSelect,
}: {
  selected: VastuDirectionId;
  onSelect: (id: VastuDirectionId) => void;
}) {
  const { t } = useTranslation();

  return (
    <svg
      viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
      className="mx-auto h-auto w-full max-w-[340px]"
      role="group"
      aria-label={t("vastu.wheel.heading")}
    >
      {VASTU_WHEEL_DIRECTIONS.map((dir) => {
        const active = dir.id === selected;
        const color = VASTU_ELEMENT_COLOR[dir.element];
        const label = vastuWheelPoint(dir.bearing, LABEL_R, CX, CY);
        return (
          <g
            key={dir.id}
            role="button"
            tabIndex={0}
            aria-pressed={active}
            aria-label={t(`vastu.dir.${dir.id}.name`)}
            className="cursor-pointer outline-none [&:focus-visible>path]:stroke-[3]"
            onClick={() => onSelect(dir.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(dir.id);
              }
            }}
          >
            <path
              d={sectorPath(dir.bearing)}
              fill={color}
              fillOpacity={active ? 0.42 : 0.14}
              stroke={color}
              strokeOpacity={active ? 1 : 0.35}
              strokeWidth={active ? 2.5 : 1}
              className="transition-[fill-opacity,stroke-opacity]"
            />
            <text
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="central"
              className={cn(
                "pointer-events-none select-none text-[15px]",
                active ? "font-bold" : "font-semibold",
              )}
              fill="currentColor"
              fillOpacity={active ? 1 : 0.75}
            >
              {t(`vastu.dir.${dir.id}.name`)}
            </text>
          </g>
        );
      })}

      <g
        role="button"
        tabIndex={0}
        aria-pressed={selected === "center"}
        aria-label={t("vastu.dir.center.name")}
        className="cursor-pointer outline-none [&:focus-visible>circle]:stroke-[3]"
        onClick={() => onSelect("center")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect("center");
          }
        }}
      >
        <circle
          cx={CX}
          cy={CY}
          r={INNER_R - 6}
          fill={VASTU_ELEMENT_COLOR.space}
          fillOpacity={selected === "center" ? 0.4 : 0.12}
          stroke={VASTU_ELEMENT_COLOR.space}
          strokeOpacity={selected === "center" ? 1 : 0.35}
          strokeWidth={selected === "center" ? 2.5 : 1}
          className="transition-[fill-opacity,stroke-opacity]"
        />
        <text
          x={CX}
          y={CY}
          textAnchor="middle"
          dominantBaseline="central"
          className="pointer-events-none select-none text-[13px] font-bold"
          fill="currentColor"
        >
          {t("vastu.dir.center.name")}
        </text>
      </g>
    </svg>
  );
}

function DirectionDetail({ id }: { id: VastuDirectionId }) {
  const { t } = useTranslation();
  const dir = vastuDirection(id);
  const color = VASTU_ELEMENT_COLOR[dir.element];

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-xl font-bold text-foreground">{t(`vastu.dir.${id}.name`)}</h3>
        <span
          className="rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: `${color}26`, color }}
        >
          {t(`vastu.element.${dir.element}`)}
        </span>
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex gap-3">
          <dt className="w-20 shrink-0 font-semibold text-muted-foreground">
            {t("vastu.labels.deity")}
          </dt>
          <dd className="min-w-0 text-foreground">{t(`vastu.dir.${id}.deity`)}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-20 shrink-0 font-semibold text-muted-foreground">
            {t("vastu.labels.best")}
          </dt>
          <dd className="min-w-0 text-foreground">{t(`vastu.dir.${id}.best`)}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-20 shrink-0 font-semibold text-muted-foreground">
            {t("vastu.labels.avoid")}
          </dt>
          <dd className="min-w-0 text-danger">{t(`vastu.dir.${id}.avoid`)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function Vastu() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<VastuDirectionId>("northeast");

  // Static page — nothing to fetch, so clear the route overlay (it starts on).
  useRouteLoading(false);

  return (
    <PageShell>
      <PageHeader
        icon={<Compass className="h-7 w-7 text-secondary" />}
        title={t("vastu.title")}
        subtitle={t("vastu.subtitle")}
      />

      <section className="rounded-2xl border border-border">
        <header className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-3">
          <Compass className="h-4 w-4 shrink-0 text-secondary" />
          <h2 className="text-sm font-semibold text-foreground">{t("vastu.wheel.heading")}</h2>
          <span className="ml-auto text-sm">{t("vastu.wheel.hint")}</span>
        </header>

        <div className="space-y-4 p-4">
          <p className="text-sm">{t("vastu.wheel.blurb")}</p>
          <div className="grid gap-5 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)] md:items-start">
            <DirectionWheel selected={selected} onSelect={setSelected} />
            <DirectionDetail id={selected} />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {VASTU_DIRECTIONS.map((dir) => {
              const active = dir.id === selected;
              const color = VASTU_ELEMENT_COLOR[dir.element];
              return (
                <button
                  key={dir.id}
                  type="button"
                  onClick={() => setSelected(dir.id)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-sm font-semibold transition-colors",
                    active
                      ? "border-transparent text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                  style={active ? { backgroundColor: `${color}2e` } : undefined}
                >
                  {t(`vastu.dir.${dir.id}.name`)}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border">
        <header className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-3">
          <DoorOpen className="h-4 w-4 shrink-0 text-secondary" />
          <h2 className="text-sm font-semibold text-foreground">{t("vastu.rooms.heading")}</h2>
          <span className="ml-auto text-sm">{t("vastu.rooms.ideal")}</span>
        </header>

        <div className="space-y-4 p-4">
          <p className="text-sm">{t("vastu.rooms.blurb")}</p>
          <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {VASTU_ROOMS.map((room) => {
              const dir = vastuDirection(room.direction);
              const color = VASTU_ELEMENT_COLOR[dir.element];
              return (
                <li
                  key={room.id}
                  className="rounded-xl border border-border bg-card p-3"
                  style={{ borderLeftWidth: 4, borderLeftColor: color }}
                >
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h3 className="font-semibold text-foreground">{t(`vastu.room.${room.id}.name`)}</h3>
                    <span className="text-sm font-semibold" style={{ color }}>
                      {t(`vastu.dir.${room.direction}.name`)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{t(`vastu.room.${room.id}.note`)}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-border">
        <header className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-3">
          <TriangleAlert className="h-4 w-4 shrink-0 text-secondary" />
          <h2 className="text-sm font-semibold text-foreground">{t("vastu.dosha.heading")}</h2>
        </header>

        <div className="space-y-4 p-4">
          <p className="text-sm">{t("vastu.dosha.blurb")}</p>
          <ul className="space-y-2.5">
            {VASTU_DOSHAS.map((id) => (
              <li key={id} className="rounded-xl border border-border bg-card p-3.5">
                <div className="flex items-start gap-2">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                  <p className="min-w-0 font-semibold text-foreground">
                    {t(`vastu.dosha.${id}.problem`)}
                  </p>
                </div>
                <div className="mt-2 flex items-start gap-2">
                  <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                  <p className="min-w-0 text-sm">{t(`vastu.dosha.${id}.remedy`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="rounded-xl border border-border bg-muted/40 p-3.5 text-sm text-muted-foreground">
        {t("vastu.note")}
      </p>
    </PageShell>
  );
}

export default Vastu;
