import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  AYANAMSHA_MODES,
  getAyanamshaModeInfo,
  isApproximateMode,
  type AyanamshaMode,
} from "@/lib/ayanamsha";
import { cn } from "@/lib/utils";

interface Props {
  mode: AyanamshaMode;
  onModeChange: (mode: AyanamshaMode) => void;
}

export function AyanamshaSelector({ mode, onModeChange }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(mode !== "nepal");
  const current = getAyanamshaModeInfo(mode);
  const advancedModes = AYANAMSHA_MODES.filter((m) => m.tier === "advanced");

  return (
    <div className="w-full rounded-xl bg-card px-3 py-2.5 shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground shrink-0">
            अयनांश
          </span>
          <button
            type="button"
            onClick={() => onModeChange("nepal")}
            className={cn(
              "h-7 px-2.5 rounded-full text-[12px] font-semibold transition-colors shrink-0 whitespace-nowrap",
              mode === "nepal"
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            नेपाल पञ्चाङ्ग ⭐
          </button>
          <span className="text-[11.5px] text-muted-foreground truncate hidden sm:inline">
            {mode === "nepal" ? current.taglineNe : `${current.labelNe} — ${current.taglineNe}`}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
          className="inline-flex items-center gap-1 h-7 px-2 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
        >
          Advanced
          <ChevronDown
            className={cn("w-3.5 h-3.5 transition-transform", showAdvanced && "rotate-180")}
          />
        </button>
      </div>

      {showAdvanced && (
        <div className="mt-2.5 pt-2.5 border-t border-border">
          <div className="flex flex-wrap gap-1.5">
            {advancedModes.map((m) => (
              <button
                key={m.id}
                type="button"
                title={m.tagline}
                onClick={() => onModeChange(m.id)}
                className={cn(
                  "h-8 px-3 rounded-lg border text-[12.5px] font-medium transition-colors",
                  mode === m.id
                    ? "border-secondary bg-secondary text-secondary-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted"
                )}
              >
                {m.labelNe}
              </button>
            ))}
          </div>
          {isApproximateMode(mode) && (
            <p className="mt-2 text-[11px] text-muted-foreground leading-snug">
              {current.taglineNe} · हाल लाहिरी-आधारित डेटाबाट अनुमानित गणना — राशि/नक्षत्रको सीमारेखामा सानो भिन्नता हुन सक्छ।
            </p>
          )}
        </div>
      )}
    </div>
  );
}
