import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { KundaliControls } from "@/components/kundali/KundaliControls";
import {
  DEFAULT_PANCHANGA_LOCATION,
  type PanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";

export interface MilanBirthFormState {
  name: string;
  date: Date;
  era: "bs" | "ad";
  clock: string;
  location: PanchangaLocation;
}

interface Props {
  role: "boy" | "girl";
  state: MilanBirthFormState;
  onChange: (next: MilanBirthFormState) => void;
}

export function MilanBirthPanel({ role, state, onChange }: Props) {
  const { t } = useTranslation();
  const title = role === "boy" ? t("milan.vara_title") : t("milan.kanya_title");

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_8%,transparent)]">
      <h2 className="text-sm font-semibold text-foreground mb-3">{title}</h2>
      <div className="mb-3">
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          {t("milan.name")}
        </label>
        <Input
          value={state.name}
          onChange={(e) => onChange({ ...state, name: e.target.value })}
          placeholder={role === "boy" ? t("milan.boy_placeholder") : t("milan.girl_placeholder")}
        />
      </div>
      <KundaliControls
        date={state.date}
        onDateChange={(date) => onChange({ ...state, date })}
        era={state.era}
        onEraChange={(era) => onChange({ ...state, era })}
        clock={state.clock}
        onClockChange={(clock) => onChange({ ...state, clock })}
        location={state.location}
        onLocationChange={(location) => onChange({ ...state, location })}
      />
    </section>
  );
}

export function defaultMilanBirthState(name: string): MilanBirthFormState {
  return {
    name,
    date: new Date(2026, 6, 3),
    era: "ad",
    clock: "16:51",
    location: DEFAULT_PANCHANGA_LOCATION,
  };
}
