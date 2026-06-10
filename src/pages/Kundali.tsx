import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { fetchKundali, kundaliKeys, type PlanetInfo } from "../lib/api";
import { PageShell, PageHeader } from "../components/PageShell";
import { cn } from "../lib/utils";

function todayAd() {
  return new Date().toISOString().split("T")[0];
}

const PLANET_LABELS: Record<string, string> = {
  sun: "☀️ Sun (सूर्य)",
  moon: "🌙 Moon (चन्द्र)",
  mars: "♂️ Mars (मंगल)",
  mercury: "☿ Mercury (बुध)",
  jupiter: "♃ Jupiter (बृहस्पति)",
  venus: "♀ Venus (शुक्र)",
  saturn: "♄ Saturn (शनि)",
  rahu: "☊ Rahu (राहु)",
  ketu: "☋ Ketu (केतु)",
};

export function Kundali() {
  const [era, setEra] = useState<"ad" | "bs">("ad");
  const [input, setInput] = useState(todayAd());
  const [date, setDate] = useState(todayAd());

  const { data, isLoading, isError } = useQuery({
    queryKey: kundaliKeys.kundali(date, era),
    queryFn: () => fetchKundali(date, era),
    staleTime: Infinity,
    enabled: !!date,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDate(input);
  }

  const planets = data?.planets;

  return (
    <PageShell>
      <PageHeader
        icon={<Sparkles className="w-6 h-6 text-secondary" />}
        title="Janma Kundali"
        subtitle="Planetary positions at sunrise (Udaya) for any date"
      />

      <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4 text-sm text-secondary">
        <strong>Note:</strong> This shows a Graha snapshot (planetary positions) at local sunrise for the selected date — not a full birth chart. Enter your birth date to see the planetary positions at that time.
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-end gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Era</label>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["ad", "bs"] as const).map(e => (
              <button
                key={e}
                type="button"
                onClick={() => setEra(e)}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors",
                  era === e ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {e.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-44">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Birth Date ({era === "ad" ? "Gregorian" : "BS YYYY-MM-DD"})
          </label>
          <input
            type={era === "ad" ? "date" : "text"}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={era === "bs" ? "2083-02-24" : undefined}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button
          type="submit"
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          Generate
        </button>
      </form>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-muted/50 animate-pulse rounded-xl h-24" />
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-sm">
          Could not load kundali data. Check the date format and try again.
        </div>
      )}

      {data && !isLoading && (
        <div className="space-y-6">
          {/* Date info */}
          <div className="bg-secondary rounded-2xl p-6 text-secondary-foreground">
            <p className="text-primary-foreground/80 text-sm mb-1">Graha Snapshot at Sunrise</p>
            <p className="text-2xl font-bold">{data.date_bs ?? date}</p>
            <p className="text-secondary-foreground/80 text-sm mt-0.5">{data.date_ad}</p>
            {data.sunrise?.local_time_short && (
              <p className="text-secondary-foreground/60 text-xs mt-2">
                ☀️ Sunrise: {data.sunrise.local_time_short}
              </p>
            )}
          </div>

          {/* Planets grid */}
          {planets && Object.keys(planets).length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Nava Graha (नव ग्रह)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(planets).map(([name, info]) => {
                  const planetInfo = info as PlanetInfo;
                  const rashi = planetInfo?.rashi_ne ?? planetInfo?.rashi ?? String(info);
                  const degrees = planetInfo?.degrees;
                  const retro = planetInfo?.retrograde;
                  const label = PLANET_LABELS[name.toLowerCase()] ?? name;

                  return (
                    <div
                      key={name}
                      className={cn(
                        "bg-card border rounded-xl p-4 space-y-1.5",
                        retro ? "border-secondary/30 bg-secondary/5" : "border-border"
                      )}
                    >
                      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                      <p className="text-lg font-bold text-foreground">{rashi ?? "—"}</p>
                      {degrees !== undefined && (
                        <p className="text-xs text-muted-foreground">{degrees.toFixed(1)}°</p>
                      )}
                      {retro && (
                        <span className="text-[10px] text-secondary font-semibold bg-secondary/10 px-2 py-0.5 rounded-full">
                          Vakri ↺
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No planet data available for this date.</p>
          )}
        </div>
      )}
    </PageShell>
  );
}
