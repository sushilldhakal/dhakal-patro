import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchGochar, gocharKeys, type LocationParams } from "@/lib/api";
import { formatClockNepali, toNepaliDigits } from "@/lib/panchanga-format";

const GRAHA_ORDER = [
  "sun",
  "moon",
  "mars",
  "mercury",
  "jupiter",
  "venus",
  "saturn",
  "rahu",
  "ketu",
] as const;

const GRAHA_EN: Record<string, string> = {
  sun: "Surya",
  moon: "Chandra",
  mars: "Mangal",
  mercury: "Budha",
  jupiter: "Guru",
  venus: "Shukra",
  saturn: "Shani",
  rahu: "Rahu",
  ketu: "Ketu",
};

const RASHI_EN_NE: Record<string, string> = {
  Mesha: "मेष",
  Vrishabha: "वृष",
  Mithuna: "मिथुन",
  Karka: "कर्कट",
  Karkata: "कर्कट",
  Simha: "सिंह",
  Kanya: "कन्या",
  Tula: "तुला",
  Vrishchika: "वृश्चिक",
  Dhanu: "धनु",
  Makara: "मकर",
  Kumbha: "कुम्भ",
  Meena: "मीन",
};

function rashiNe(english?: string): string {
  if (!english) return "—";
  return RASHI_EN_NE[english] ?? english;
}

function localTimePart(entryLocal: string): string {
  const m = entryLocal.match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : entryLocal;
}

function daysUntil(entryLocal: string, refDate: Date): number {
  const entryDay = entryLocal.slice(0, 10);
  const ref = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, "0")}-${String(refDate.getDate()).padStart(2, "0")}`;
  const a = new Date(`${entryDay}T12:00:00`);
  const b = new Date(`${ref}T12:00:00`);
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

interface Props {
  dateAd: string;
  location: LocationParams;
}

export function PlanetEventsPanel({ dateAd, location }: Props) {
  const refDate = useMemo(() => new Date(`${dateAd}T12:00:00`), [dateAd]);

  const { data, isLoading, isError } = useQuery({
    queryKey: gocharKeys.day(dateAd, "ad", location),
    queryFn: () => fetchGochar(dateAd, "ad", location),
    staleTime: 1000 * 60 * 60,
  });

  const events = useMemo(() => {
    if (!data?.gochar) return [];
    const rows = GRAHA_ORDER.map((key) => {
      const g = data.gochar[key];
      const entry = g?.next_rashi_entry;
      if (!g || !entry?.entry_time_local) return null;
      const rashi = rashiNe(entry.to_rashi);
      const time = formatClockNepali(localTimePart(entry.entry_time_local)) ?? "—";
      const rel = daysUntil(entry.entry_time_local, refDate);
      const enName = g.name_vedic ?? GRAHA_EN[key] ?? key;
      return {
        key,
        symbol: g.symbol,
        ne: `${g.name_ne} ${rashi}मा प्रवेश`,
        en: `${enName} enters ${entry.to_rashi}`,
        time,
        rel,
        sortKey: entry.entry_time_local,
      };
    }).filter((e): e is NonNullable<typeof e> => e != null);

    rows.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    return rows;
  }, [data, refDate]);

  return (
    <div className="pg-events-card">
      <div className="pg-events-head">
        <h2 className="text-base font-bold m-0">आगामी ग्रह-गोचर</h2>
        <span className="text-[11.5px] text-muted-foreground">Planetary events</span>
      </div>

      {isLoading && (
        <div className="px-4 py-6 text-sm text-muted-foreground">लोड हुँदै…</div>
      )}

      {isError && (
        <div className="px-4 py-6 text-sm text-muted-foreground">
          ग्रह-गोचर लोड गर्न सकिएन।
        </div>
      )}

      {!isLoading && !isError && events.length === 0 && (
        <div className="px-4 py-6 text-sm text-muted-foreground">कुनै आगामी गोचर छैन।</div>
      )}

      {!isLoading && !isError && events.length > 0 && (
        <div className="pg-planets">
          {events.map((e) => (
            <div key={e.key} className="pg-planet-row">
              <span className="pg-planet-sym">{e.symbol}</span>
              <span className="pg-planet-names">
                <span className="pg-planet-ne">{e.ne}</span>
                <span className="pg-planet-en">
                  {e.en} · <span className="font-mono">{e.time}</span>
                </span>
              </span>
              <span className="pg-planet-when font-mono">
                {e.rel <= 0 ? "आज" : `${toNepaliDigits(e.rel)} दिन`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
