import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Heart, Loader2, MapPin, Clock, Navigation, Globe, Pencil, Sparkles, Star } from "lucide-react";
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

export interface MilanProfilePickerHandle {
  openAdd: () => void;
}

type DialogState = { mode: "add" } | { mode: "edit"; profile: Profile } | null;

interface Props {
  boyId: string | null;
  girlId: string | null;
  onBoySelect: (profile: Profile) => void;
  onGirlSelect: (profile: Profile) => void;
}

export const MilanProfilePicker = forwardRef<MilanProfilePickerHandle, Props>(
  function MilanProfilePicker({ boyId, girlId, onBoySelect, onGirlSelect }, ref) {
    const { t } = useTranslation();
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
        setError(e instanceof Error ? e.message : t("account.load_error"));
        setProfiles([]);
        return [];
      }
    }

    useEffect(() => {
      void load();
    }, []);

    if (profiles === null) {
      return (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> {t("common.loading")}
        </div>
      );
    }

    if (error) {
      return (
        <p className="rounded-xl border border-border bg-card px-4 py-4 text-sm text-destructive">
          {error}
        </p>
      );
    }

    if (profiles.length === 0) {
      return (
        <>
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-10 text-center">
            <p className="text-sm font-medium text-foreground">{t("milan.no_profiles_title")}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              {t("milan.no_profiles_body")}
            </p>
            <Button className="mt-4" onClick={() => setDialog({ mode: "add" })}>
              <Sparkles className="size-4" /> {t("kundali.add_profile")}
            </Button>
          </div>
          <ProfileDialog dialog={dialog} setDialog={setDialog} onSaved={load} />
        </>
      );
    }

    return (
      <>
        <div className="grid gap-4 lg:grid-cols-2">
          <ProfileRoleColumn
            role="boy"
            title={t("milan.vara_title")}
            hint={t("milan.select_boy")}
            profiles={profiles}
            selectedId={boyId}
            otherSelectedId={girlId}
            onSelect={onBoySelect}
            onEdit={(profile) => setDialog({ mode: "edit", profile })}
          />
          <ProfileRoleColumn
            role="girl"
            title={t("milan.kanya_title")}
            hint={t("milan.select_girl")}
            profiles={profiles}
            selectedId={girlId}
            otherSelectedId={boyId}
            onSelect={onGirlSelect}
            onEdit={(profile) => setDialog({ mode: "edit", profile })}
          />
        </div>
        <ProfileDialog dialog={dialog} setDialog={setDialog} onSaved={load} />
      </>
    );
  },
);

function ProfileRoleColumn({
  role,
  title,
  hint,
  profiles,
  selectedId,
  otherSelectedId,
  onSelect,
  onEdit,
}: {
  role: "boy" | "girl";
  title: string;
  hint: string;
  profiles: Profile[];
  selectedId: string | null;
  otherSelectedId: string | null;
  onSelect: (profile: Profile) => void;
  onEdit: (profile: Profile) => void;
}) {
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_8%,transparent)]">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
      </div>
      <div className="flex flex-col gap-2 max-h-[28rem] overflow-y-auto pr-0.5">
        {profiles.map((p) => (
          <MilanProfileCard
            key={`${role}-${p.id}`}
            profile={p}
            role={role}
            active={p.id === selectedId}
            alsoSelectedAsOther={p.id === otherSelectedId}
            onSelect={() => onSelect(p)}
            onEdit={() => onEdit(p)}
            selectLabel={role === "boy" ? t("milan.select_as_boy") : t("milan.select_as_girl")}
            selectedLabel={role === "boy" ? t("milan.selected_boy") : t("milan.selected_girl")}
          />
        ))}
      </div>
    </section>
  );
}

function MilanProfileCard({
  profile: p,
  role,
  active,
  alsoSelectedAsOther,
  onSelect,
  onEdit,
  selectLabel,
  selectedLabel,
}: {
  profile: Profile;
  role: "boy" | "girl";
  active: boolean;
  alsoSelectedAsOther: boolean;
  onSelect: () => void;
  onEdit: () => void;
  selectLabel: string;
  selectedLabel: string;
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
        "flex flex-col gap-2 rounded-xl border p-3 transition-colors",
        active ? "border-secondary bg-secondary/5 ring-1 ring-secondary/40" : "border-border bg-muted/10",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-semibold text-foreground text-sm">
            <span className="truncate">{p.full_name}</span>
            {p.is_default && <Star className="size-3 shrink-0 text-secondary" />}
          </div>
          {p.gender ? (
            <span className="text-[11px] capitalize text-muted-foreground">{p.gender}</span>
          ) : null}
        </div>
        <Button variant="ghost" size="icon-sm" title="Edit profile" onClick={onEdit}>
          <Pencil className="size-3.5" />
        </Button>
      </div>

      <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
        <Row icon={Clock}>
          {dob}
          {p.birth_time ? ` · ${p.birth_time}` : ""}
        </Row>
        <Row icon={MapPin}>{place}</Row>
        <Row icon={Navigation}>{latLon}</Row>
        <Row icon={Globe}>{p.timezone || "—"}</Row>
      </div>

      {alsoSelectedAsOther && !active ? (
        <p className="text-[10px] text-muted-foreground">{selectLabel}</p>
      ) : null}

      <Button
        onClick={onSelect}
        variant={active ? "default" : "outline"}
        size="sm"
        className="w-full"
      >
        <Heart className={cn("size-3.5", role === "boy" && "rotate-0")} />
        {active ? selectedLabel : selectLabel}
      </Button>
    </div>
  );
}

function Row({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-1.5">
      <Icon className="mt-0.5 size-3 shrink-0 opacity-70" />
      <span className="min-w-0 break-words text-foreground">{children}</span>
    </div>
  );
}

function ProfileDialog({
  dialog,
  setDialog,
  onSaved,
}: {
  dialog: DialogState;
  setDialog: (v: DialogState) => void;
  onSaved: () => Promise<Profile[]>;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {dialog?.mode === "edit" ? t("kundali.edit_profile") : t("kundali.add_profile")}
          </DialogTitle>
          <DialogDescription>{t("milan.profile_form_hint")}</DialogDescription>
        </DialogHeader>
        {dialog ? (
          <ProfileForm
            initial={dialog.mode === "edit" ? profileToInput(dialog.profile) : EMPTY_PROFILE}
            existing={dialog.mode === "edit" ? dialog.profile : undefined}
            onCancel={() => setDialog(null)}
            onSaved={async () => {
              setDialog(null);
              await onSaved();
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
