import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Crosshair, Loader2, MapPin } from "lucide-react";
import { cityKeys, searchCities, type City } from "@/lib/api";
import {
  NEPAL_NEAREST_MAX_KM,
  nearestNepalCity,
  nepalCityToCity,
  searchNepalCities,
} from "@/lib/cities/nepal-cities";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n/locale";
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

function cityLabel(city: City): string {
  return city.ascii_name || city.name;
}

// Resolve a 2-letter ISO country code to a readable, localized name
// ("NP" → "Nepal" / "नेपाल") via the built-in Intl API. Cached per locale;
// falls back to the raw code if the runtime lacks the region data.
const countryNameCache = new Map<string, Intl.DisplayNames | null>();

function countryName(code: string | undefined | null, lang: string): string {
  if (!code) return "";
  const locale = lang === "ne" ? "ne" : "en";
  if (!countryNameCache.has(locale)) {
    try {
      countryNameCache.set(locale, new Intl.DisplayNames([locale], { type: "region" }));
    } catch {
      countryNameCache.set(locale, null);
    }
  }
  const dn = countryNameCache.get(locale);
  const upper = code.toUpperCase();
  try {
    return dn?.of(upper) ?? upper;
  } catch {
    return upper;
  }
}

function cityItemLabel(city: City, lang: string): string {
  const region = city.admin1_name ?? city.admin1;
  const country = countryName(city.country, lang);
  if (region) return `${cityLabel(city)}, ${region}, ${country}`;
  return `${cityLabel(city)}, ${country}`;
}

function LocationPickerPanel({
  debouncedQuery,
  isSearching,
  location,
  geoLoading,
  geoError,
  onPickCity,
  onUseCurrentLocation,
}: {
  debouncedQuery: string;
  isSearching: boolean;
  results: City[];
  location: PanchangaLocation;
  geoLoading: boolean;
  geoError: string | null;
  onPickCity: (city: City) => void;
  onUseCurrentLocation: () => void;
}) {
  const { pick, lang } = useLocale();
  return (
    <>
      <ComboboxInput
        showTrigger={false}
        placeholder={pick("सहर खोज्नुहोस्", "Search a city")}
        className="w-full"
      />

      <div className="px-1 pb-1">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onUseCurrentLocation}
          disabled={geoLoading}
          className="w-full"
        >
          {geoLoading ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <Crosshair data-icon="inline-start" />
          )}
          {pick("मेरो स्थान प्रयोग गर्नुहोस्", "Use my location")}
        </Button>
      </div>

      {geoError && (
        <p className="text-[11.5px] text-destructive px-2 pb-1" role="alert">
          {geoError}
        </p>
      )}

      <ComboboxEmpty className="py-3 text-xs">
        {debouncedQuery.length < 2
          ? pick("कम्तीमा २ अक्षर टाइप गर्नुहोस्", "Type at least 2 characters")
          : isSearching
            ? pick("खोज्दै…", "Searching…")
            : pick("कुनै सहर भेटिएन", "No city found")}
      </ComboboxEmpty>

      <ComboboxList className="max-h-60">
        {(city) => {
          const name = cityLabel(city);
          const selected = location.params.city_id === city.id;
          return (
            <ComboboxItem
              key={city.id}
              value={city}
              onClick={() => onPickCity(city)}
              className={cn(selected && "bg-secondary/20")}
            >
              <span className="font-semibold block">{name}</span>
              <span className="text-[11px] text-muted-foreground">
                {cityItemLabel(city, lang)}
              </span>
            </ComboboxItem>
          );
        }}
      </ComboboxList>
    </>
  );
}

export function LocationSelector({
  location,
  onLocationChange,
  className,
  compact = false,
}: Props) {
  const { pick, lang } = useLocale();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [labelMain] = (() => {
    const parts = location.label.split(",").map((s) => s.trim());
    return [parts[0] ?? location.label];
  })();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchData, isFetching: isSearching } = useQuery({
    queryKey: cityKeys.search(debouncedQuery),
    queryFn: () => searchCities(debouncedQuery, 15),
    enabled: debouncedQuery.length >= 2 && open,
    staleTime: 60_000,
  });

  // Nepal comes from the curated local list; other countries from the backend
  // (its vague NP entries are dropped so Nepal is shown only once, cleanly).
  const results = useMemo<City[]>(() => {
    const nepal = searchNepalCities(debouncedQuery).map((c) => nepalCityToCity(c, lang));
    const world = (searchData?.cities ?? []).filter(
      (c) => c.country?.toUpperCase() !== "NP",
    );
    return [...nepal, ...world];
  }, [debouncedQuery, lang, searchData]);

  const pickCity = (city: City) => {
    onLocationChange(cityToLocation(city));
    setQuery("");
    setDebouncedQuery("");
    setOpen(false);
    setGeoError(null);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError(pick("जियोलोकेसन उपलब्ध छैन", "Geolocation unavailable"));
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        // Inside Nepal, snap to the nearest district HQ for a named location;
        // elsewhere keep the raw coordinates.
        const nearest = nearestNepalCity(lat, lon);
        if (nearest.distanceKm <= NEPAL_NEAREST_MAX_KM) {
          onLocationChange(cityToLocation(nepalCityToCity(nearest.city, lang)));
        } else {
          onLocationChange(coordsToLocation(lat, lon));
        }
        setQuery("");
        setDebouncedQuery("");
        setOpen(false);
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError(pick("अनुमति अस्वीकृत — सहर खोज्नुहोस्", "Permission denied — search for a city"));
        } else if (err.code === err.TIMEOUT) {
          setGeoError(pick("समय सकियो — पुन: प्रयास गर्नुहोस्", "Timed out — please try again"));
        } else {
          setGeoError(pick("स्थान पत्ता लागेन", "Location not found"));
        }
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 }
    );
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery("");
      setDebouncedQuery("");
    }
  };

  const comboboxSearchProps = {
    inputValue: query,
    onInputValueChange: (value: string) => {
      setQuery(value);
      setGeoError(null);
    },
  };

  const pickerPanel = (
    <LocationPickerPanel
      debouncedQuery={debouncedQuery}
      isSearching={isSearching}
      results={results}
      location={location}
      geoLoading={geoLoading}
      geoError={geoError}
      onPickCity={pickCity}
      onUseCurrentLocation={useCurrentLocation}
    />
  );

  if (compact) {
    return (
      <Combobox
        open={open}
        onOpenChange={handleOpenChange}
        items={results}
        filter={null}
        onValueChange={(city) => {
          if (city) pickCity(city);
        }}
        itemToStringValue={(city: City) => cityItemLabel(city, lang)}
        isItemEqualToValue={(a, b) => a.id === b.id}
        {...comboboxSearchProps}
      >
        <ComboboxTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full max-w-[12.5rem] justify-between gap-1 font-semibold",
                className
              )}
              title={pick("स्थान छान्नुहोस्", "Choose location")}
            />
          }
        >
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{labelMain}</span>
          </span>
        </ComboboxTrigger>
        <ComboboxContent
          align="end"
          side="bottom"
          sideOffset={8}
          className="w-[min(calc(100vw-1.25rem),20rem)] min-w-[16rem]"
        >
          {pickerPanel}
        </ComboboxContent>
      </Combobox>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Combobox
        open={open}
        onOpenChange={handleOpenChange}
        items={results}
        filter={null}
        onValueChange={(city) => {
          if (city) pickCity(city);
        }}
        itemToStringValue={(city: City) => cityItemLabel(city, lang)}
        isItemEqualToValue={(a, b) => a.id === b.id}
        {...comboboxSearchProps}
      >
        <ComboboxTrigger
          render={
            <Button
              variant="outline"
              className="w-full max-w-md justify-between font-normal"
            />
          }
        >
          <span className="inline-flex items-center gap-2 min-w-0">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{location.label}</span>
          </span>
        </ComboboxTrigger>
        <ComboboxContent
          align="start"
          className="w-[min(calc(100vw-1.25rem),24rem)] min-w-[16rem]"
        >
          {pickerPanel}
        </ComboboxContent>
      </Combobox>

      {geoError && (
        <p className="text-xs text-destructive" role="alert">
          {geoError}
        </p>
      )}
    </div>
  );
}
