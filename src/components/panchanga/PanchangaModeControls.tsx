import { Clock } from "lucide-react";
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
  return (
    <div className={cn("inline-flex items-center gap-2 flex-wrap", className)}>
      <div
        className="inline-flex p-0.5 gap-0.5 border border-border rounded-lg bg-card"
        role="group"
        aria-label="पञ्चाङ्ग मोड"
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
          title="उदय-आधारित — मुद्रित पात्रो जस्तै"
        >
          उदय
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
          title="क्षणिक समय — तोकिएको घण्टामा चलिरहेको तिथि/नक्षत्र"
        >
          समय
        </button>
      </div>

      {mode === "instant" && (
        <label className="inline-flex items-center gap-1.5 h-[30px] px-2.5 rounded-lg border border-border bg-card text-[12.5px] font-medium text-foreground">
          <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground hidden sm:inline">घण्टा</span>
          <input
            type="time"
            value={clock}
            onChange={(e) => onClockChange(e.target.value)}
            className="bg-transparent border-0 p-0 m-0 text-[12.5px] font-mono font-semibold text-foreground focus:outline-none focus:ring-0 min-w-[5.5rem]"
            aria-label="समय छान्नुहोस्"
          />
          <span className="text-muted-foreground font-mono tabular-nums hidden md:inline">
            ({toNepaliDigits(clock)})
          </span>
        </label>
      )}
    </div>
  );
}
