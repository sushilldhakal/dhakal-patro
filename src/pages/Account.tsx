import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Star, Trash2, Pencil, MailWarning, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouteLoading } from "@/lib/route-loading";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  listProfiles,
  updateProfile,
  deleteProfile,
  apiResendVerification,
  type Profile,
} from "@/lib/auth/client";
import {
  ProfileForm,
  EMPTY_PROFILE,
  profileToInput,
} from "@/components/auth/ProfileForm";

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

  useRouteLoading(authLoading || !user || loading);

  if (authLoading || !user) {
    return null;
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
          initial={editing === "new" ? EMPTY_PROFILE : profileToInput(editing)}
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
