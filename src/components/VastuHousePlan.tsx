import { useTranslation } from "react-i18next";
import { ArrowUp, DoorOpen } from "lucide-react";
import {
  VASTU_ELEMENT_COLOR,
  VASTU_ELEMENT_ORDER,
  VASTU_GRID_LAYOUT,
  roomsForDirection,
  vastuDirection,
  type VastuDirectionId,
} from "@/lib/vastu";
import { cn } from "@/lib/utils";

/** Round each grid cell's outer corner so the nine zones read as one house. */
const CORNER_ROUNDING: Partial<Record<VastuDirectionId, string>> = {
  northwest: "rounded-tl-2xl",
  northeast: "rounded-tr-2xl",
  southwest: "rounded-bl-2xl",
  southeast: "rounded-br-2xl",
};

function ZoneCell({
  id,
  active,
  onSelect,
}: {
  id: VastuDirectionId;
  active: boolean;
  onSelect: (id: VastuDirectionId) => void;
}) {
  const { t } = useTranslation();
  const dir = vastuDirection(id);
  const color = VASTU_ELEMENT_COLOR[dir.element];
  const rooms = roomsForDirection(id);
  const isCenter = id === "center";

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={t(`vastu.dir.${id}.name`)}
      onClick={() => onSelect(id)}
      style={{
        backgroundColor: `${color}${active ? "3d" : "1f"}`,
        borderColor: active ? color : `${color}55`,
        boxShadow: active ? `0 0 0 2px ${color}` : undefined,
      }}
      className={cn(
        "group relative flex min-w-0 flex-col items-center justify-center gap-1 border p-1.5 text-center outline-none transition-[background-color,box-shadow]",
        "focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring",
        isCenter ? "rounded-xl border-dashed" : "rounded-lg",
        CORNER_ROUNDING[id],
      )}
    >
      <span
        className={cn(
          "text-[11px] leading-tight sm:text-[13px]",
          active ? "font-bold text-foreground" : "font-semibold text-foreground/90",
        )}
      >
        {t(`vastu.dir.${id}.name`)}
      </span>
      <span className="hidden text-[9px] leading-none text-muted-foreground sm:block">
        {t(`vastu.dir.${id}.deity`)}
      </span>

      {isCenter ? (
        <span className="mt-0.5 rounded-full bg-background/70 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
          {t("vastu.plan.center_open")}
        </span>
      ) : rooms.length > 0 ? (
        <span className="mt-0.5 flex flex-wrap items-center justify-center gap-1">
          {rooms.map((room) => (
            <span
              key={room.id}
              className="inline-flex items-center gap-0.5 rounded-full bg-background/80 px-1.5 py-0.5 text-[9px] font-medium text-foreground/80 shadow-sm"
              style={{ boxShadow: `inset 0 0 0 1px ${color}40` }}
            >
              {room.id === "main_door" && <DoorOpen className="h-2.5 w-2.5" style={{ color }} />}
              {t(`vastu.room.${room.id}.name`)}
            </span>
          ))}
        </span>
      ) : null}
    </button>
  );
}

export function VastuHousePlan({
  selected,
  onSelect,
}: {
  selected: VastuDirectionId;
  onSelect: (id: VastuDirectionId) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto w-full max-w-[440px]">
      <div className="mb-2 flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <ArrowUp className="h-3.5 w-3.5" />
        {t("vastu.plan.north")} (N)
      </div>

      <div
        role="group"
        aria-label={t("vastu.plan.heading")}
        className="grid aspect-square w-full grid-cols-3 grid-rows-3 gap-1.5 rounded-[20px] border-[3px] border-border/70 bg-muted/20 p-1.5 shadow-sm"
      >
        {VASTU_GRID_LAYOUT.map((id) => (
          <ZoneCell
            key={id}
            id={id}
            active={id === selected}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="mt-3">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t("vastu.plan.elements")}
        </p>
        <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
          {VASTU_ELEMENT_ORDER.map((element) => (
            <li key={element} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: VASTU_ELEMENT_COLOR[element] }}
              />
              {t(`vastu.element.${element}`)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default VastuHousePlan;
