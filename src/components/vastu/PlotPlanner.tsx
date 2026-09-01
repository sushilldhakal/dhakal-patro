import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/browser";
import { useLocaleDigits } from "@/i18n/digits";
import { useLocale } from "@/i18n/locale";
import {
  CARDINAL_WALLS,
  ENTRANCE_PREFERRED_CORNER,
  HASTA_METERS,
  ayadiAuspicious,
  ayadiRemainder,
  metersToHasta,
  nearestAuspiciousWidthHasta,
  type CardinalWall,
} from "@/lib/vastu";
import { fromApiHousePlan } from "@/lib/house-plan/from-api";
import { useVastuHousePlan } from "@/hooks/use-vastu-house-plan";
import {
  clampStoreys,
  kindCounts,
  storeyPref,
  type HousePlan,
} from "@/lib/vastu-plan";
import { HouseRequirementsForm, readPlan } from "./HouseRequirementsForm";
import { HouseFloorPlan } from "./HouseFloorPlan";
import { HousePlan3D } from "./HousePlan3D";
import { OwnerCompatibility } from "./OwnerCompatibility";
import { cn } from "@/lib/utils";

const HOUSE_KEY = "vp.vastu.house";

const PLOT_KEY = "vp.vastu.plot";
const MIN_M = 3;
const MAX_M = 100;
const DEFAULT_LENGTH = "10";
const DEFAULT_BREADTH = "15";
const DEFAULT_FACING: CardinalWall = "east";

interface PlotState {
  /** North–South, metres. */
  length: string;
  /** East–West, metres. */
  breadth: string;
  facing: CardinalWall;
}

const DEFAULT_STATE: PlotState = {
  length: DEFAULT_LENGTH,
  breadth: DEFAULT_BREADTH,
  facing: DEFAULT_FACING,
};

function dimString(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function fromLegacyWalls(p: Record<string, unknown>): Pick<PlotState, "length" | "breadth"> | null {
  const num = (key: string) => {
    const v = p[key];
    if (typeof v !== "string" && typeof v !== "number") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const north = num("north");
  const south = num("south");
  const east = num("east");
  const west = num("west");
  if (north == null || south == null || east == null || west == null) return null;
  return {
    length: dimString((east + west) / 2),
    breadth: dimString((north + south) / 2),
  };
}

function readPlot(): PlotState {
  const raw = getLocalStorageItem(PLOT_KEY);
  if (!raw) return DEFAULT_STATE;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return DEFAULT_STATE;
    const p = parsed as Record<string, unknown>;
    const facing = CARDINAL_WALLS.includes(p.facing as CardinalWall) ? (p.facing as CardinalWall) : DEFAULT_FACING;
    if (typeof p.length === "string" && typeof p.breadth === "string") {
      return { length: p.length, breadth: p.breadth, facing };
    }
    const legacy = fromLegacyWalls(p);
    if (legacy) return { ...legacy, facing };
    return DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

const selectClass =
  "h-9 min-w-0 rounded-lg border border-border bg-card px-2 text-sm text-foreground cursor-pointer";

function parseDimension(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

export function PlotPlanner() {
  const { t } = useTranslation();
  const { digits: localeDigits } = useLocale();
  const digits = useLocaleDigits();
  const [plot, setPlot] = useState<PlotState>(() => readPlot());
  const [house, setHouse] = useState<HousePlan>(() => readPlan());
  const [view, setView] = useState<"2d" | "3d">("2d");

  function updateHouse(next: HousePlan) {
    setHouse(next);
    setLocalStorageItem(HOUSE_KEY, JSON.stringify(next));
  }

  const storeys = clampStoreys(house.storeys);

  function update(next: Partial<PlotState>) {
    setPlot((prev) => {
      const merged = { ...prev, ...next };
      setLocalStorageItem(PLOT_KEY, JSON.stringify(merged));
      return merged;
    });
  }

  const parsed = {
    length: parseDimension(plot.length),
    breadth: parseDimension(plot.breadth),
  };
  const errors = {
    length: parsed.length === null || parsed.length < MIN_M || parsed.length > MAX_M,
    breadth: parsed.breadth === null || parsed.breadth < MIN_M || parsed.breadth > MAX_M,
  };
  const hasError = errors.length || errors.breadth;

  const lengthM = clamp(parsed.length ?? Number(DEFAULT_LENGTH), MIN_M, MAX_M);
  const breadthM = clamp(parsed.breadth ?? Number(DEFAULT_BREADTH), MIN_M, MAX_M);

  const footprint = useMemo(
    () => ({ width: breadthM, height: lengthM }),
    [breadthM, lengthM],
  );

  const site = useMemo(
    () => ({ width: footprint.width, height: footprint.height, facing: plot.facing }),
    [footprint, plot.facing],
  );
  const planQuery = useVastuHousePlan(site, house);
  const concept = useMemo(() => (planQuery.data ? fromApiHousePlan(planQuery.data) : null), [planQuery.data]);
  const leftover = concept?.leftover ?? [];
  const counts = useMemo(() => kindCounts(leftover), [leftover]);

  const ayadi = useMemo(() => {
    if (!footprint) return null;
    const lengthHasta = metersToHasta(footprint.height);
    const widthHasta = metersToHasta(footprint.width);
    const remainder = ayadiRemainder(widthHasta);
    const auspicious = ayadiAuspicious(remainder);
    const suggestedHasta = auspicious ? null : nearestAuspiciousWidthHasta(widthHasta);
    return {
      lengthHasta,
      widthHasta,
      remainder,
      auspicious,
      suggestedHasta,
      suggestedMeters: suggestedHasta === null ? null : suggestedHasta * HASTA_METERS,
    };
  }, [footprint]);

  const preferredCorner = ENTRANCE_PREFERRED_CORNER[plot.facing];

  return (
    <section className="rounded-2xl border border-border">
      <header className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{t("vastu.plot.heading")}</h2>
      </header>

      <div className="space-y-4 p-4">
        <p className="text-sm">{t("vastu.plot.blurb")}</p>

        <OwnerCompatibility />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="plot-length" className="mb-1 block text-xs font-semibold text-muted-foreground">
              {t("vastu.plot.length_label")}
            </label>
            <Input
              id="plot-length"
              type="number"
              inputMode="decimal"
              value={plot.length}
              onChange={(e) => update({ length: e.target.value })}
              aria-invalid={errors.length}
            />
          </div>
          <div>
            <label htmlFor="plot-breadth" className="mb-1 block text-xs font-semibold text-muted-foreground">
              {t("vastu.plot.breadth_label")}
            </label>
            <Input
              id="plot-breadth"
              type="number"
              inputMode="decimal"
              value={plot.breadth}
              onChange={(e) => update({ breadth: e.target.value })}
              aria-invalid={errors.breadth}
            />
          </div>
        </div>

        <div>
          <label htmlFor="plot-facing" className="mb-1 block text-xs font-semibold text-muted-foreground">
            {t("vastu.plot.facing_label")}
          </label>
          <select
            id="plot-facing"
            className={cn(selectClass, "w-full sm:w-auto")}
            value={plot.facing}
            onChange={(e) => update({ facing: e.target.value as CardinalWall })}
          >
            {CARDINAL_WALLS.map((wall) => (
              <option key={wall} value={wall}>
                {t(`vastu.dir.${wall}.name`)}
              </option>
            ))}
          </select>
        </div>

        {hasError && (
          <p className="text-sm text-destructive">
            {t("vastu.plot.range_error", { min: digits(MIN_M), max: digits(MAX_M) })}
          </p>
        )}

        <HouseRequirementsForm plan={house} onChange={updateHouse} />

        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-foreground">{t("vastu.plan.layout_heading")}</h3>
            <div className="inline-flex rounded-lg border border-border p-0.5">
              <button
                type="button"
                className={cn(
                  "h-8 rounded-md px-2.5 text-xs font-semibold",
                  view === "2d" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground",
                )}
                onClick={() => setView("2d")}
                aria-pressed={view === "2d"}
              >
                {t("vastu.plan.view.2d")}
              </button>
              <button
                type="button"
                className={cn(
                  "h-8 rounded-md px-2.5 text-xs font-semibold",
                  view === "3d" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground",
                )}
                onClick={() => setView("3d")}
                aria-pressed={view === "3d"}
              >
                {t("vastu.plan.view.3d")}
              </button>
            </div>
          </div>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">{t("vastu.plan.layout_blurb")}</p>
          {leftover.length > 0 && (
            <div className="mb-4 rounded-lg border border-border bg-background px-3 py-2.5">
              <p className="text-sm font-semibold text-foreground">{t("vastu.plan.cannot_fit_heading")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("vastu.plan.cannot_fit_blurb")}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {leftover.map((row) => {
                  const many = (counts.get(row.kind) ?? 0) > 1 && row.kind !== "staircase";
                  const name =
                    many && row.index != null
                      ? t(`vastu.plan.space.${row.kind}_n`, { n: localeDigits(row.index) })
                      : t(`vastu.plan.space.${row.kind}`);
                  return (
                    <li
                      key={row.id}
                      className="rounded-md border border-border px-2 py-0.5 text-xs font-semibold text-foreground"
                    >
                      {name}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {planQuery.isLoading && (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("vastu.plan.loading")}</p>
          )}
          {planQuery.isError && (
            <p className="py-6 text-center text-sm text-destructive">{t("vastu.plan.load_failed")}</p>
          )}
          {concept && view === "3d" && <HousePlan3D concept={concept} />}
          {concept && view === "2d" && (
            <div className="flex flex-col gap-8">
              {concept.floors.map((floor) => (
                <div key={floor.storey} className="min-w-0">
                  {storeys > 1 && (
                    <h4 className="mb-2 text-sm font-semibold text-foreground">
                      {t(`vastu.plan.floor.${storeyPref(floor.storey)}`)}
                    </h4>
                  )}
                  <HouseFloorPlan concept={concept} floor={floor} />
                </div>
              ))}
            </div>
          )}
          {concept && concept.vastuRelaxed.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {[...new Set(concept.vastuRelaxed.map((row) => row.messageKey))].map((key) => (
                <li key={key}>{t(key)}</li>
              ))}
            </ul>
          )}
          {concept && concept.validation.issues.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {concept.validation.issues.map((issue) => (
                <li key={issue.id}>{t(issue.messageKey)}</li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-sm text-muted-foreground">{t("vastu.plot.buffer_note")}</p>
          <p className="text-sm text-muted-foreground">{t("vastu.plot.marma_note")}</p>
        </div>

        {footprint && ayadi && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-3.5">
              <h3 className="text-sm font-semibold text-foreground">{t("vastu.plot.ayadi_heading")}</h3>
              <dl className="mt-2 space-y-1.5 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{t("vastu.plot.footprint_length_label")}</dt>
                  <dd>
                    {digits(footprint.height.toFixed(1))} {t("vastu.plot.unit_m")} ·{" "}
                    {digits(ayadi.lengthHasta.toFixed(1))} {t("vastu.plot.unit_hasta")}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{t("vastu.plot.footprint_width_label")}</dt>
                  <dd>
                    {digits(footprint.width.toFixed(1))} {t("vastu.plot.unit_m")} ·{" "}
                    {digits(ayadi.widthHasta.toFixed(1))} {t("vastu.plot.unit_hasta")}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{t("vastu.plot.ayadi_remainder_label")}</dt>
                  <dd className="font-semibold">{digits(ayadi.remainder)}</dd>
                </div>
              </dl>
              <p
                className={cn(
                  "mt-2 text-sm font-semibold",
                  ayadi.auspicious ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
                )}
              >
                {t(ayadi.auspicious ? "vastu.plot.ayadi_auspicious" : "vastu.plot.ayadi_inauspicious")}
              </p>
              {ayadi.suggestedHasta !== null && ayadi.suggestedMeters !== null && (
                <p className="mt-1 text-sm">
                  {t("vastu.plot.ayadi_suggestion", {
                    hasta: digits(ayadi.suggestedHasta),
                    meters: digits(ayadi.suggestedMeters.toFixed(1)),
                  })}
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">{t("vastu.plot.ayadi_disclaimer")}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-3.5">
              <h3 className="text-sm font-semibold text-foreground">{t("vastu.plot.entrance_heading")}</h3>
              <p className="mt-2 text-sm">
                {t("vastu.plot.entrance_note", {
                  wall: t(`vastu.dir.${plot.facing}.name`),
                  corner: t(`vastu.dir.${preferredCorner}.name`),
                })}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{t("vastu.plot.entrance_disclaimer")}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default PlotPlanner;
