import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Sparkles, Star, Pencil, Loader2, MapPin, Clock, Navigation, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfileForm, EMPTY_PROFILE, profileToInput } from "@/components/auth/ProfileForm";
import { listProfiles, type Profile } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

export interface KundaliProfilePickerHandle {
  openAdd: () => void;
}

type DialogState = { mode: "add" } | { mode: "edit"; profile: Profile } | null;

/**
 * Signed-in users pick a saved profile to generate its kundali. Each card shows
 * the full birth details and has "View kundali" + "Edit". The "Add profile"
 * trigger is exposed via ref so the page heading can host the button.
 */
export const KundaliProfilePicker = forwardRef<
  KundaliProfilePickerHandle,
  { selectedId?: string | null; onSelect: (profile: Profile) => void }
>(function KundaliProfilePicker({ selectedId, onSelect }, ref) {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({ openAdd: () => setDialog({ mode: "add" }) }), []);

  async function load(): Promise<Profile[]> {
    try {
      const list = await listProfiles();
      setProfiles(list);
      return list;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your profiles");
      setProfiles([]);
      return [];
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (profiles === null) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-6 text-sm">
        <Loader2 className="size-4 animate-spin" /> Loading your profiles…
      </div>
    );
  }

  if (error) {
    return <p className="rounded-xl border border-border bg-card px-4 py-4 text-sm text-destructive">{error}</p>;
  }

  return (
    <>
      {profiles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-10 text-center">
          <p className="text-sm text-base text-foreground">No profiles yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm">
            Add your birth date, time and place to generate and save a kundali.
          </p>
          <Button className="mt-4" onClick={() => setDialog({ mode: "add" })}>
            <Sparkles className="size-4" /> Add your first profile
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <ProfileCard
              key={p.id}
              profile={p}
              active={p.id === selectedId}
              onView={() => onSelect(p)}
              onEdit={() => setDialog({ mode: "edit", profile: p })}
            />
          ))}
        </div>
      )}

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "edit" ? "Edit profile" : "Add profile"}</DialogTitle>
            <DialogDescription>
              Name, date of birth, time, place and gender — used to generate the kundali.
            </DialogDescription>
          </DialogHeader>
          {dialog && (
            <ProfileForm
              initial={dialog.mode === "edit" ? profileToInput(dialog.profile) : EMPTY_PROFILE}
              existing={dialog.mode === "edit" ? dialog.profile : undefined}
              onCancel={() => setDialog(null)}
              onSaved={async (saved) => {
                const wasEditingSelected =
                  dialog.mode === "edit" && dialog.profile.id === selectedId;
                setDialog(null);
                await load();
                // View the new profile, or re-render the one we just edited.
                if (dialog.mode === "add" || wasEditingSelected) onSelect(saved);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});

function ProfileCard({
  profile: p,
  active,
  onView,
  onEdit,
}: {
  profile: Profile;
  active: boolean;
  onView: () => void;
  onEdit: () => void;
}) {
  const place = p.location_label || p.city || "—";
  const dob = p.birth_date ? `${p.birth_date} ${(p.birth_era ?? "bs").toUpperCase()}` : "—";
  const latLon =
    p.latitude != null && p.longitude != null
      ? `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`
      : "—";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4 transition-colors",
        active ? "border-secondary bg-secondary/5 ring-1 ring-secondary/40" : "border-border bg-card"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <span className="truncate">{p.full_name}</span>
            {p.is_default && <Star className="size-3.5 shrink-0 text-secondary" />}
          </div>
          {p.gender && <span className="text-xs capitalize">{p.gender}</span>}
        </div>
        <Button variant="ghost" size="icon-sm" title="Edit profile" onClick={onEdit}>
          <Pencil className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-1.5 text-xs">
        <Row icon={Clock} label="DOB">{dob}{p.birth_time ? ` · ${p.birth_time}` : ""}</Row>
        <Row icon={MapPin} label="Place">{place}</Row>
        <Row icon={Navigation} label="Lat/Long">{latLon}</Row>
        <Row icon={Globe} label="Timezone">{p.timezone || "—"}</Row>
      </div>

      <Button
        onClick={onView}
        variant={active ? "default" : "outline"}
        size="sm"
        className="mt-auto w-full"
      >
        <Sparkles className="size-3.5" />
        {active ? "Viewing kundali" : "View kundali"}
      </Button>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-1.5">
      <Icon className="mt-0.5 size-3.5 shrink-0 opacity-70" />
      <span className="shrink-0 text-base text-foreground/70">{label}:</span>
      <span className="min-w-0 break-words text-foreground">{children}</span>
    </div>
  );
}
