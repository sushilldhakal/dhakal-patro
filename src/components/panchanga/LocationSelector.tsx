import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Crosshair, Loader2, MapPin } from "lucide-react";
import { cityKeys, searchCities, type City } from "@/lib/api";
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

function cityItemLabel(city: City): string {
  return `${cityLabel(city)}, ${city.country}`;
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
  return (
    <>
      <ComboboxInput
        showTrigger={false}
        placeholder="सहर खोज्नुहोस् · search city"
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
          मेरो स्थान प्रयोग गर्नुहोस्
        </Button>
      </div>

      {geoError && (
        <p className="text-[11.5px] text-destructive px-2 pb-1" role="alert">
          {geoError}
        </p>
      )}

      <ComboboxEmpty className="py-3 text-xs">
        {debouncedQuery.length < 2
          ? "कम्तीमा २ अक्षर टाइप गर्नुहोस्"
          : isSearching
            ? "खोज्दै…"
            : "कुनै सहर भेटिएन"}
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
                {cityItemLabel(city)}
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
    queryFn: () => searchCities(debouncedQuery),
    enabled: debouncedQuery.length >= 2 && open,
    staleTime: 60_000,
  });

  const results = searchData?.cities ?? [];

  const pickCity = (city: City) => {
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
        itemToStringValue={cityItemLabel}
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
              title="स्थान छान्नुहोस्"
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
        itemToStringValue={cityItemLabel}
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
