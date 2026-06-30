import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PanchangaDataMode } from "@/components/panchanga/use-panchanga-mode";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { cn } from "@/lib/utils";

interface Props {
  mode: PanchangaDataMode;
  onModeChange: (mode: PanchangaDataMode) => void;
  clock: string;
  onClockChange: (clock: string) => void;
  className?: string;
}

export function PanchangaModeControls({
  mode,
  onModeChange,
  clock,
  onClockChange,
  className,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className={cn("inline-flex items-center gap-2 flex-wrap", className)}>
      <div
        className="inline-flex p-0.5 gap-0.5 border border-border rounded-lg bg-card"
        role="group"
        aria-label={t("panchanga.mode_aria")}
      >
        <button
          type="button"
          className={cn(
            "h-[26px] px-3 rounded-[calc(var(--radius-lg)-2px)] border-0 text-[12.5px] font-semibold cursor-pointer transition-colors",
            mode === "udaya"
              ? "bg-secondary text-secondary-foreground"
              : "bg-transparent text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onModeChange("udaya")}
          title={t("panchanga.mode_udaya_title")}
        >
          {t("panchanga.mode_udaya")}
        </button>
        <button
          type="button"
          className={cn(
            "h-[26px] px-3 rounded-[calc(var(--radius-lg)-2px)] border-0 text-[12.5px] font-semibold cursor-pointer transition-colors",
            mode === "instant"
              ? "bg-secondary text-secondary-foreground"
              : "bg-transparent text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onModeChange("instant")}
          title={t("panchanga.mode_instant_title")}
        >
          {t("panchanga.mode_instant")}
        </button>
      </div>

      {mode === "instant" && (
        <label className="inline-flex items-center gap-1.5 h-[30px] px-2.5 rounded-lg border border-border bg-card text-[12.5px] font-medium text-foreground">
          <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground hidden sm:inline">{t("panchanga.clock_label")}</span>
          <input
            type="time"
            value={clock}
            onChange={(e) => onClockChange(e.target.value)}
            className="bg-transparent border-0 p-0 m-0 text-[12.5px] font-mono font-semibold text-foreground focus:outline-none focus:ring-0 min-w-[5.5rem]"
            aria-label={t("panchanga.pick_time")}
          />
          <span className="text-muted-foreground font-mono tabular-nums hidden md:inline">
            ({toNepaliDigits(clock)})
          </span>
        </label>
      )}
    </div>
  );
}
