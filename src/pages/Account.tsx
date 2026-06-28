import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Star, Trash2, Pencil, MailWarning, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  listProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  apiResendVerification,
  type Profile,
  type ProfileInput,
} from "@/lib/auth/client";
import { CityAutocomplete } from "@/components/auth/CityAutocomplete";

const labelClass = "text-sm font-medium text-foreground";
const fieldWrap = "flex flex-col gap-1.5";

const EMPTY: ProfileInput = {
  full_name: "",
  phone: "",
  email: "",
  gender: "",
  country: "",
  city: "",
  location_label: "",
  latitude: null,
  longitude: null,
  timezone: "",
  birth_date: "",
  birth_time: "",
  birth_era: "bs",
  is_default: false,
};

export function Account() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Profile | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      void navigate({ to: "/" });
    }
  }, [authLoading, user, navigate]);

  async function load() {
    setLoading(true);
    try {
      setProfiles(await listProfiles());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profiles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) void load();
  }, [user]);

  async function onDelete(id: string) {
    if (!confirm("Delete this profile?")) return;
    await deleteProfile(id);
    void load();
  }

  async function onMakeDefault(p: Profile) {
    await updateProfile(p.id, { is_default: true });
    void load();
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My account</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </header>

      {!user.is_verified && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-sm dark:border-amber-500/30 dark:bg-amber-500/10">
          <MailWarning className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="text-amber-800 dark:text-amber-200">
              Please verify your email address.
            </p>
            <button
              type="button"
              disabled={resent}
              className="mt-1 font-medium text-amber-700 hover:underline disabled:opacity-60 dark:text-amber-300"
              onClick={async () => {
                await apiResendVerification();
                setResent(true);
              }}
            >
              {resent ? "Verification email sent ✓" : "Resend verification email"}
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Kundali profiles</h2>
        {editing === null && (
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="size-3.5" />
            Add profile
          </Button>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {editing !== null ? (
        <ProfileForm
          initial={editing === "new" ? EMPTY : toInput(editing)}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
            void refreshUser();
          }}
          existing={editing === "new" ? undefined : editing}
        />
      ) : loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          No profiles yet. Add your birth details to save your kundali.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {profiles.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-foreground">{p.full_name}</p>
                  {p.is_default && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-medium text-secondary">
                      <Star className="size-3" /> Default
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {[p.location_label || p.city, p.birth_date && `${p.birth_date}${p.birth_time ? " " + p.birth_time : ""}`]
                    .filter(Boolean)
                    .join(" · ") || "No birth details"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {!p.is_default && (
                  <Button variant="ghost" size="icon-sm" title="Make default" onClick={() => onMakeDefault(p)}>
                    <Star className="size-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => setEditing(p)}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Delete" onClick={() => onDelete(p.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function toInput(p: Profile): ProfileInput {
  return {
    full_name: p.full_name,
    phone: p.phone ?? "",
    email: p.email ?? "",
    gender: p.gender ?? "",
    country: p.country ?? "",
    city: p.city ?? "",
    location_label: p.location_label ?? "",
    latitude: p.latitude,
    longitude: p.longitude,
    timezone: p.timezone ?? "",
    birth_date: p.birth_date ?? "",
    birth_time: p.birth_time ?? "",
    birth_era: p.birth_era ?? "bs",
    is_default: p.is_default,
  };
}

function ProfileForm({
  initial,
  existing,
  onCancel,
  onSaved,
}: {
  initial: ProfileInput;
  existing?: Profile;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ProfileInput>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ProfileInput>(key: K, val: ProfileInput[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) {
      setError("Name is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Drop empty strings so optional fields stay null on the server.
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === "" ? null : v])
      ) as ProfileInput;
      payload.full_name = form.full_name.trim();
      if (existing) await updateProfile(existing.id, payload);
      else await createProfile(payload);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={fieldWrap}>
          <label className={labelClass}>Full name *</label>
          <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required />
        </div>
        <div className={fieldWrap}>
          <label className={labelClass}>Phone</label>
          <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="+977…" />
        </div>
        <div className={fieldWrap}>
          <label className={labelClass}>Email</label>
          <Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div className={fieldWrap}>
          <label className={labelClass}>Gender</label>
          <select
            value={form.gender ?? ""}
            onChange={(e) => set("gender", e.target.value)}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">—</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className={fieldWrap}>
        <label className={labelClass}>City / birth place</label>
        <CityAutocomplete
          value={form.location_label || form.city}
          onSelect={(sel) =>
            setForm((f) => ({
              ...f,
              city: sel.city,
              country: sel.country,
              latitude: sel.latitude,
              longitude: sel.longitude,
              timezone: sel.timezone,
              location_label: sel.location_label,
            }))
          }
        />
        {form.country && (
          <p className="text-xs text-muted-foreground">
            {form.country}
            {form.timezone ? ` · ${form.timezone}` : ""}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={fieldWrap}>
          <label className={labelClass}>Birth date</label>
          <Input
            value={form.birth_date ?? ""}
            onChange={(e) => set("birth_date", e.target.value)}
            placeholder="YYYY-MM-DD"
          />
        </div>
        <div className={fieldWrap}>
          <label className={labelClass}>Birth time</label>
          <Input
            value={form.birth_time ?? ""}
            onChange={(e) => set("birth_time", e.target.value)}
            placeholder="HH:MM"
          />
        </div>
        <div className={fieldWrap}>
          <label className={labelClass}>Calendar</label>
          <select
            value={form.birth_era ?? "bs"}
            onChange={(e) => set("birth_era", e.target.value)}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="bs">Bikram Sambat</option>
            <option value="ad">Gregorian (AD)</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={!!form.is_default}
          onChange={(e) => set("is_default", e.target.checked)}
          className="size-4 accent-[var(--secondary)]"
        />
        Set as default profile
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : existing ? "Save changes" : "Create profile"}
        </Button>
      </div>
    </form>
  );
}
