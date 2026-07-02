import {
  AYANAMSHA_MODES,
  getAyanamshaModeInfo,
  isApproximateMode,
  type AyanamshaMode,
} from "@/lib/ayanamsha";
import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n/locale";

interface Props {
  mode: AyanamshaMode;
  onModeChange: (mode: AyanamshaMode) => void;
}

export function AyanamshaSelector({ mode, onModeChange }: Props) {
  const { pick } = useLocale();
  const current = getAyanamshaModeInfo(mode);

  return (
    <div className="w-full rounded-xl overflow-hidden bg-card shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]">
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 px-3.5 py-2.5 border-b border-border bg-secondary/[0.09] dark:bg-secondary/20">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {pick("अयनांश", "Ayanamsha")}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
          Ayanamsha
        </span>
      </div>

      <div className="px-3.5 py-3 space-y-2.5">
        <div className="flex flex-wrap gap-1.5">
          {AYANAMSHA_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              title={m.tagline}
              onClick={() => onModeChange(m.id)}
              className={cn(
                "h-8 px-3 rounded-lg border text-[12.5px] font-medium transition-colors",
                mode === m.id
                  ? "border-secondary bg-secondary text-secondary-foreground"
                  : "border-border bg-background/40 dark:bg-background/20 text-foreground hover:bg-muted"
              )}
            >
              {m.id === "nepal" ? `${pick(m.labelNe, m.label)} ⭐` : pick(m.labelNe, m.label)}
            </button>
          ))}
        </div>

        <p className="text-[12px] text-muted-foreground leading-snug">
          {pick(current.labelNe, current.label)} — {pick(current.taglineNe, current.tagline)}
          {isApproximateMode(mode) &&
            pick(
              " · हाल लाहिरी-आधारित डेटाबाट अनुमानित गणना — राशि/नक्षत्रको सीमारेखामा सानो भिन्नता हुन सक्छ।",
              " · Currently an approximate calculation from Lahiri-based data — small differences may occur at rashi/nakshatra boundaries.",
            )}
        </p>
      </div>
    </div>
  );
}
