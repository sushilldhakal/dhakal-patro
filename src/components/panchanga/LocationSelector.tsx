import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import { cityKeys, searchCities } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  cityToLocation,
  coordsToLocation,
  type PanchangaLocation,
} from "./use-panchanga-location";

interface Props {
  location: PanchangaLocation;
  onLocationChange: (location: PanchangaLocation) => void;
  className?: string;
  compact?: boolean;
}

export function LocationSelector({
  location,
  onLocationChange,
  className,
  compact = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [labelMain, labelSub] = (() => {
    const parts = location.label.split(",").map((s) => s.trim());
    if (parts.length >= 2) return [parts[0], parts.slice(1).join(", ")];
    return [location.label, ""];
  })();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchData, isFetching: isSearching } = useQuery({
    queryKey: cityKeys.search(debouncedQuery),
    queryFn: () => searchCities(debouncedQuery),
    enabled: debouncedQuery.length >= 2 && open,
    staleTime: 60_000,
  });

  const results = searchData?.cities ?? [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pickCity = (city: (typeof results)[number]) => {
    onLocationChange(cityToLocation(city));
    setQuery("");
    setDebouncedQuery("");
    setOpen(false);
    setGeoError(null);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("जियोलोकेसन उपलब्ध छैन");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        onLocationChange(coordsToLocation(lat, lon));
        setQuery("");
        setDebouncedQuery("");
        setOpen(false);
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("अनुमति अस्वीकृत — सहर खोज्नुहोस्");
        } else if (err.code === err.TIMEOUT) {
          setGeoError("समय सकियो — पुन: प्रयास गर्नुहोस्");
        } else {
          setGeoError("स्थान पत्ता लागेन");
        }
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 }
    );
  };

  if (compact) {
    return (
      <div ref={containerRef} className={cn("relative", className)}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border bg-card text-sm font-semibold hover:bg-muted/50 transition-colors max-w-[200px]"
          title="स्थान छान्नुहोस्"
        >
          <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{labelMain}</span>
          {labelSub && (
            <span className="text-[10.5px] font-medium text-muted-foreground truncate hidden sm:inline">
              {labelSub}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[min(100vw-2rem,320px)] rounded-xl border border-border bg-popover p-3 shadow-lg flex flex-col gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setGeoError(null);
                }}
                placeholder="सहर खोज्नुहोस् · search city"
                className="w-full h-9 bg-background border border-border rounded-lg pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={geoLoading}
              className="inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border-0 bg-secondary/15 text-secondary dark:text-teal-300 text-sm font-semibold hover:brightness-105 disabled:opacity-60"
            >
              {geoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Crosshair className="w-4 h-4" />
              )}
              मेरो स्थान प्रयोग गर्नुहोस्
            </button>

            {geoError && (
              <p className="text-[11.5px] text-destructive px-0.5" role="alert">
                {geoError}
              </p>
            )}

            <div className="max-h-60 overflow-y-auto flex flex-col">
              {isSearching && debouncedQuery.length >= 2 && (
                <div className="px-2 py-2 text-sm text-muted-foreground">खोज्दै…</div>
              )}
              {!isSearching && debouncedQuery.length >= 2 && results.length === 0 && (
                <div className="px-2 py-2 text-sm text-muted-foreground">
                  कुनै सहर भेटिएन
                </div>
              )}
              {results.map((city) => {
                const name = city.ascii_name || city.name;
                const selected = location.params.city_id === city.id;
                return (
                  <button
                    key={city.id}
                    type="button"
                    className={cn(
                      "text-left px-2.5 py-2 rounded-lg text-sm transition-colors",
                      selected
                        ? "bg-secondary/20 text-foreground"
                        : "hover:bg-muted/70"
                    )}
                    onClick={() => pickCity(city)}
                  >
                    <span className="font-semibold block">{name}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {name}, {city.country}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setGeoError(null);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search city (e.g. Kathmandu, Delhi)…"
            className="w-full h-9 bg-background border border-border rounded-lg pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Search location"
          />
          {isSearching && (
            <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          )}

          {open && debouncedQuery.length >= 2 && (
            <ul
              role="listbox"
              className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 max-h-56 overflow-y-auto rounded-lg border border-border bg-popover shadow-md py-1"
            >
              {results.map((city) => (
                <li key={city.id} role="option">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/80 transition-colors"
                    onClick={() => pickCity(city)}
                  >
                    <span className="font-medium">{city.ascii_name || city.name}</span>
                    <span className="text-muted-foreground">, {city.country}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={geoLoading}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted/60 disabled:opacity-60 shrink-0"
        >
          {geoLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Crosshair className="w-4 h-4" />
          )}
          Current location
        </button>
      </div>

      {geoError && (
        <p className="text-xs text-destructive" role="alert">
          {geoError}
        </p>
      )}
    </div>
  );
}
