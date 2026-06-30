import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Clock, LogIn, Plus, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AYANAMSHA_MODES, type AyanamshaMode } from "@/lib/ayanamsha";
import { KundaliControls } from "@/components/kundali/KundaliControls";
import {
  KundaliProfilePicker,
  type KundaliProfilePickerHandle,
} from "@/components/kundali/KundaliProfilePicker";
import { AyanamshaSelector } from "@/components/kundali/AyanamshaSelector";
import { KundaliView } from "@/components/kundali/KundaliView";
import { useAuth } from "@/lib/auth/AuthContext";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { LearnMoreCard } from "@/components/LearnMoreCard";
import {
  usePanchangaLocation,
  type PanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";
import { defaultClockForTimezone } from "@/components/panchanga/use-panchanga-mode";

const CLOCK_KEY = "dhakalPatroKundaliClock";
const AYANAMSHA_KEY = "dhakalPatroAyanamshaMode";

function loadSavedAyanamshaMode(): AyanamshaMode {
  const saved = localStorage.getItem(AYANAMSHA_KEY);
  return AYANAMSHA_MODES.some((m) => m.id === saved) ? (saved as AyanamshaMode) : "nepal";
}

export function Kundali() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const pickerRef = useRef<KundaliProfilePickerHandle>(null);

  // ─── Anonymous generator state ──────────────────────────────────────────────
  const { location, setLocation } = usePanchangaLocation();
  const [date, setDate] = useState(() => new Date());
  const [era, setEra] = useState<"bs" | "ad">("bs");
  const [ayanamshaMode, setAyanamshaModeState] = useState<AyanamshaMode>(loadSavedAyanamshaMode);
  const setAyanamshaMode = (next: AyanamshaMode) => {
    setAyanamshaModeState(next);
    localStorage.setItem(AYANAMSHA_KEY, next);
  };
  const timezone = location.params.timezone ?? "Asia/Kathmandu";
  const [clock, setClock] = useState(() => {
    const saved = localStorage.getItem(CLOCK_KEY);
    return saved ?? defaultClockForTimezone(timezone);
  });
  const handleClockChange = (next: string) => {
    setClock(next);
    localStorage.setItem(CLOCK_KEY, next);
  };

  const [applied, setApplied] = useState<{
    date: Date;
    clock: string;
    location: PanchangaLocation;
    ayanamshaMode: AyanamshaMode;
  } | null>(null);
  const generate = () => setApplied({ date, clock, location, ayanamshaMode });

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-6 pb-16">
      <div className="mb-4 mt-2 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
            नेपाली पात्रो · जन्म कुण्डली
          </div>
          <h1 className="text-[34px] font-bold leading-tight tracking-tight m-0 flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-secondary shrink-0" />
            जन्म कुण्डली
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAuthenticated
              ? "आफ्नो प्रोफाइल छान्नुहोस् — कुण्डली, दशा र शान्ति विधि हेर्न।"
              : "जन्म मिति, समय र स्थान अनुसार राशि, ग्रह र दशा विवरण"}
          </p>
        </div>
        {isAuthenticated && (
          <Button className="shrink-0" onClick={() => pickerRef.current?.openAdd()}>
            <Plus className="size-4" /> प्रोफाइल थप्नुहोस्
          </Button>
        )}
      </div>

      {authLoading ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-12 text-center text-sm text-muted-foreground">
          लोड हुँदै… · Loading
        </div>
      ) : !isAuthenticated ? (
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_8%,transparent)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/15">
              <Sparkles className="h-7 w-7 text-secondary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              प्रोफाइल सुरक्षित राख्न लग-इन गर्नुहोस्
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              लग-इन गरेपछि आफ्ना कुण्डली प्रोफाइलहरू सुरक्षित राख्न सकिन्छ। बिना खाता पनि तलको फारम
              भरेर कुण्डली बनाउन सकिन्छ।
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" onClick={() => openAuth("login")}>
                <LogIn className="size-4" /> लग-इन
              </Button>
              <Button size="lg" variant="outline" onClick={() => openAuth("signup")}>
                <UserPlus className="size-4" /> खाता खोल्नुहोस्
              </Button>
            </div>
          </section>

          <KundaliControls
            date={date}
            onDateChange={setDate}
            era={era}
            onEraChange={setEra}
            clock={clock}
            onClockChange={handleClockChange}
            location={location}
            onLocationChange={setLocation}
          />
          <AyanamshaSelector mode={ayanamshaMode} onModeChange={setAyanamshaMode} />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={generate}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-secondary px-5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90"
            >
              <Sparkles className="h-4 w-4" />
              {applied ? "कुण्डली अपडेट गर्नुहोस्" : "कुण्डली बनाउनुहोस्"}
            </button>
            <p className="text-xs text-muted-foreground">
              जन्म मिति, समय र स्थान भरेर "कुण्डली बनाउनुहोस्" थिच्नुहोस्।
            </p>
          </div>

          {!applied ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-12 text-center">
              <Clock className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                कुण्डली देखाउन जन्म विवरण आवश्यक छ
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                माथि जन्म मिति, समय र स्थान भरेर "कुण्डली बनाउनुहोस्" थिच्नुहोस्।
              </p>
            </div>
          ) : (
            <KundaliView
              date={applied.date}
              clock={applied.clock}
              locationParams={applied.location.params}
              locationLabel={applied.location.label}
              ayanamshaMode={applied.ayanamshaMode}
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            कुण्डली हेर्न प्रोफाइल छान्नुहोस्। हरेक कुण्डलीमा ग्रह, दशा र शान्ति विधि समावेश छ।
          </p>
          <KundaliProfilePicker
            ref={pickerRef}
            selectedId={null}
            onSelect={(p) =>
              navigate({ to: "/kundali/$profileId", params: { profileId: p.id } })
            }
          />
        </div>
      )}

      <AuthDialog
        key={authMode}
        open={authOpen}
        onOpenChange={setAuthOpen}
        initialMode={authMode}
      />

      <LearnMoreCard
        className="mt-7"
        heading="कुण्डली बुझ्न आवश्यक आधार"
        slugs={["ayanamsha", "nakshatra", "solar-system"]}
      />
    </div>
  );
}
