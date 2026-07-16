import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchGochar, gocharKeys, type LocationParams } from "@/lib/api";
import { formatClockNepali } from "@/lib/panchanga-format";
import { GRAHA_NAME, type GrahaKey } from "@/lib/graha-details";
import { useLocale } from "@/i18n/locale";
import { patroCard } from "@/lib/patro-classes";

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
] as const satisfies readonly GrahaKey[];

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
  const { pick, digits } = useLocale();
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
      const enName = GRAHA_NAME[key].en;
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
    <div className={patroCard + " p-3.5 px-4"}>
      <div className="mb-2 flex flex-wrap items-baseline gap-2">
        <h2 className="m-0 text-base font-bold">{pick("आगामी ग्रह-गोचर", "Planetary events")}</h2>
      </div>

      {isLoading && (
        <div className="px-4 py-6 text-sm">{pick("लोड हुँदै…", "Loading…")}</div>
      )}

      {isError && (
        <div className="px-4 py-6 text-sm">
          {pick("ग्रह-गोचर लोड गर्न सकिएन।", "Could not load planetary events.")}
        </div>
      )}

      {!isLoading && !isError && events.length === 0 && (
        <div className="px-4 py-6 text-sm">
          {pick("कुनै आगामी गोचर छैन।", "No upcoming transits.")}
        </div>
      )}

      {!isLoading && !isError && events.length > 0 && (
        <div className="flex flex-col">
          {events.map((e) => (
            <div
              key={e.key}
              className="flex items-center gap-2.5 border-b border-border py-2 last:border-b-0"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-semibold">{pick(e.ne, e.en)}</span>
                <span className="text-sm font-semibold">
                  <span className="font-mono">{e.time}</span>
                </span>
              </span>
              <span className="whitespace-nowrap font-mono text-sm font-semibold">
                {e.rel <= 0
                  ? pick("आज", "Today")
                  : pick(`${digits(e.rel)} दिन`, `${digits(e.rel)}d`)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
