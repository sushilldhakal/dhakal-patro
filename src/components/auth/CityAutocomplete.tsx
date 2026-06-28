import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchCities, type City } from "@/lib/api";

export interface CitySelection {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  location_label: string;
}

/** Debounced city search that fills city/country/lat/lon/timezone on select. */
export function CityAutocomplete({
  value,
  onSelect,
  placeholder = "Search a city…",
}: {
  value?: string | null;
  onSelect: (sel: CitySelection) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value ?? "");
  const [results, setResults] = useState<City[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    let active = true;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchCities(query.trim(), 8);
        if (active) setResults(res.cities);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function pick(city: City) {
    const name = city.ascii_name || city.name;
    const label = `${name}, ${city.country}`;
    setQuery(label);
    setOpen(false);
    onSelect({
      city: name,
      country: city.country,
      latitude: city.lat,
      longitude: city.lon,
      timezone: city.timezone,
      location_label: label,
    });
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="pl-8"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-md">
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => pick(c)}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">
                  {c.ascii_name || c.name}, {c.country}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
