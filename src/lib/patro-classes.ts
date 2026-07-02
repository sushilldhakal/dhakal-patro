import { cn } from "./utils";

/** Teal/yellow accent link used in aside panels and section headers. */
export const patroAsideLink =
  "shrink-0 text-xs font-medium text-secondary no-underline whitespace-nowrap hover:underline";

export const patroEmpty =
  "m-0 py-5 text-center text-[13px] font-medium text-muted-foreground";

export function patroAsideTab(active: boolean) {
  return cn(
    "min-h-[2.75em] min-w-0 cursor-pointer rounded-md border px-1.5 py-2 text-xs font-semibold leading-snug text-balance transition-colors",
    active
      ? "border-secondary/25 bg-tab-active font-bold text-foreground shadow-[0_0_0_1px_color-mix(in_srgb,var(--secondary)_15%,transparent)] dark:border-primary/20 dark:bg-primary/10"
      : "border-transparent bg-transparent text-muted-foreground hover:bg-tab-hover hover:text-foreground",
  );
}

export function patroMiniSubTab(active: boolean) {
  return cn(
    "min-w-0 cursor-pointer rounded-md border bg-surface-inset px-1 py-1.5 text-[11px] font-semibold leading-tight text-muted-foreground transition-colors",
    active
      ? "border-secondary/30 bg-tab-active font-bold text-foreground"
      : "border-transparent hover:bg-tab-hover hover:text-foreground",
  );
}

export function patroSaitCat(active: boolean) {
  return cn(
    "shrink-0 cursor-pointer whitespace-nowrap rounded-md border bg-surface-inset px-2.5 py-1.5 text-[11.5px] leading-tight font-semibold text-muted-foreground transition-colors",
    active
      ? "border-secondary/30 bg-tab-active font-bold text-foreground"
      : "border-transparent hover:bg-tab-hover hover:text-foreground",
  );
}

export function patroSegBtn(active: boolean) {
  return cn(
    "h-[26px] cursor-pointer rounded-[calc(var(--radius-lg)-2px)] border-none px-3 text-xs font-semibold transition-colors",
    active
      ? "bg-secondary text-secondary-foreground"
      : "bg-transparent text-muted-foreground",
  );
}

export function patroFestRow(opts: { today?: boolean; past?: boolean }) {
  return cn(
    "grid min-h-9 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 border-b border-border/70 px-2 py-1.5 last:border-b-0",
    opts.today && "bg-fest-today",
    opts.past && "opacity-55",
  );
}

type Tone = "best" | "good" | "neutral" | "bad" | "worst";

const NAVATARA_TONE_BG: Record<Tone, string> = {
  best: "bg-tone-best",
  good: "bg-tone-good",
  neutral: "bg-tone-neutral",
  bad: "bg-tone-bad",
  worst: "bg-tone-worst",
};

export function patroNavataraRow(tone: Tone, current?: boolean) {
  return cn(
    "flex min-w-0 flex-col gap-0.5 rounded-md p-1.5",
    NAVATARA_TONE_BG[tone] ?? "bg-surface-inset",
    current && "shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--accent)_45%,transparent)]",
  );
}

export function patroSlotRow(tone: "good" | "bad" | "neutral", nightStart?: boolean) {
  return cn(
    "flex min-w-0 flex-row items-start justify-between gap-1.5 rounded-md p-1.5 text-xs",
    tone === "good" && "bg-slot-good",
    tone === "bad" && "bg-slot-bad",
    tone === "neutral" && "bg-slot-neutral",
    nightStart && "shadow-[inset_0_2px_0_color-mix(in_srgb,var(--border)_80%,transparent)]",
  );
}

export function patroSlotBadge(tone: "good" | "bad" | "neutral") {
  return cn(
    "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none whitespace-nowrap",
    tone === "good" && "bg-badge-good text-secondary",
    tone === "bad" && "bg-badge-bad text-danger",
    tone === "neutral" && "bg-badge-neutral text-muted-foreground",
  );
}

export const patroSelect =
  "h-8 cursor-pointer rounded-[var(--radius-lg)] border border-border bg-card px-2.5 text-[13px] font-medium text-foreground";

export const patroNoteBox =
  "mb-4 rounded-xl border border-border bg-secondary/8 p-3 text-[13px] leading-relaxed text-muted-foreground";

export const patroErrorBox =
  "rounded-lg border border-danger/30 bg-error-surface px-3 py-2.5 text-[13px] font-medium text-danger";

export const patroSkel =
  "block h-7 w-4/5 mx-auto rounded animate-pulse bg-foreground/5";

export const patroAyanaNorth =
  "mb-0.5 inline-block text-xs font-extrabold leading-none text-accent dark:text-[#7fd6db]";

export const patroAyanaSouth =
  "mb-0.5 inline-block text-xs font-extrabold leading-none text-danger opacity-95";

export const patroDataTableWrap =
  "overflow-x-auto rounded-[14px] border border-border bg-card";

export const patroSunRise =
  "block text-[13px] font-semibold text-accent dark:text-[#7fd6db]";

export const patroSunSet =
  "block text-[13px] font-semibold text-danger/90";
