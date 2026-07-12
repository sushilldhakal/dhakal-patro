import {
  AYANAMSHA_MODES,
  getAyanamshaModeInfo,
  matchesPanchangaAngas,
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
        <span className="text-sm font-semibold uppercase tracking-wider">
          {pick("अयनांश", "Ayanamsha")}
        </span>
        <span className="text-sm font-medium uppercase tracking-wider">
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
                "h-8 px-3 rounded-lg border text-sm font-medium transition-colors",
                mode === m.id
                  ? "border-secondary bg-secondary text-secondary-foreground"
                  : "border-border bg-background/40 dark:bg-background/20 text-foreground hover:bg-muted"
              )}
            >
              {m.id === "nepal" ? `${pick(m.labelNe, m.label)} ⭐` : pick(m.labelNe, m.label)}
            </button>
          ))}
        </div>

        <p className="text-sm leading-snug">
          {pick(current.labelNe, current.label)} — {pick(current.taglineNe, current.tagline)}
          {!matchesPanchangaAngas(mode) &&
            pick(
              " · ग्रह, लग्न र नक्षत्र यसै अयनांशमा गणना हुन्छ; तिथि/योग/करण भने लाहिरीमा आधारित रहन्छन्।",
              " · Grahas, lagna and nakshatra are computed in this ayanamsha; tithi/yoga/karana stay Lahiri-based.",
            )}
        </p>
      </div>
    </div>
  );
}
