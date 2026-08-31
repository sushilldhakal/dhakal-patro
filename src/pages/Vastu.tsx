import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Compass } from "lucide-react";
import { PageShell, PageHeader } from "../components/PageShell";
import { VastuHousePlan } from "../components/VastuHousePlan";
import { useRouteLoading } from "@/lib/route-loading";
import { PlotPlanner } from "@/components/vastu/PlotPlanner";
import { VastuPurushaWheel } from "@/components/vastu/VastuPurushaWheel";
import {
  VASTU_DIRECTIONS,
  VASTU_ELEMENT_COLOR,
  vastuDirection,
  type VastuDirectionId,
} from "@/lib/vastu";
import { cn } from "@/lib/utils";

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
          <h2 className="text-sm font-semibold text-foreground">{t("vastu.plan.heading")}</h2>
          <span className="ml-auto text-sm">{t("vastu.plan.hint")}</span>
        </header>

        <div className="space-y-4 p-3 sm:p-4">
          <p className="text-sm">{t("vastu.wheel.blurb")}</p>
          <div className="space-y-5">
            <div className="-mx-1 sm:mx-0">
              <VastuPurushaWheel selected={selected} onSelect={setSelected} />
            </div>
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

      <PlotPlanner />

      <p className="rounded-xl border border-border bg-muted/40 p-3.5 text-sm text-muted-foreground">
        {t("vastu.note")}
      </p>
    </PageShell>
  );
}

export default Vastu;
