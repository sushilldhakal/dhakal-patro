import { cn } from "./utils";

/** Tabular monospace numerals (replaces legacy `.mono`). */
export const patroMono = "font-num tabular-nums";

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

export const patroCard =
  "overflow-hidden rounded-xl bg-card shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_10%,transparent)]";

export const patroSecBand =
  "flex flex-wrap items-baseline gap-2.5 border-b border-border bg-secondary/[0.09] px-4 py-2.5 dark:bg-secondary/20";

export const patroHeroPill =
  "text-[11.5px] font-semibold leading-none whitespace-nowrap rounded-full border border-white/14 bg-white/8 px-2.5 py-1.5 text-[#f5f5f1]";

export function patroHeroPillEv(kind: "public" | "festival") {
  return cn(
    patroHeroPill,
    kind === "public" &&
      "border-[rgba(255,120,120,0.35)] bg-[rgba(255,90,90,0.16)] text-[#ffb4b4]",
    kind === "festival" &&
      "border-[rgba(0,200,210,0.35)] bg-[rgba(0,170,180,0.18)] text-[#8fe3e8]",
  );
}

export const patroWheelShell = "overflow-hidden rounded-2xl border border-border";

export const GANA_PILL_CLASS: Record<string, string> = {
  "देव": "bg-emerald-500/25 text-emerald-300",
  "नर": "bg-sky-500/25 text-sky-300",
  "राक्षस": "bg-rose-500/25 text-rose-300",
};

export const GANA_SWATCH_CLASS: Record<string, string> = {
  "देव": "bg-[var(--av-gana-dev)]",
  "नर": "bg-[var(--av-gana-nar)]",
  "राक्षस": "bg-[var(--av-gana-rak)]",
};

export const patroHeroMonthOverlay =
  "pointer-events-none absolute inset-0 bg-gradient-to-br from-black/72 via-black/42 to-black/28";

export const patroHeroMonthShell =
  "relative isolate overflow-hidden bg-cover bg-center bg-no-repeat";

/** @deprecated use patroHeroMonthShell — kept for any legacy dark hero usage */
export const patroHeroDeco = cn(
  "relative isolate overflow-hidden",
  "before:pointer-events-none before:absolute before:-z-10 before:rounded-full before:blur-[46px]",
  "before:w-[260px] before:h-[260px] before:-top-[110px] before:-right-[70px]",
  "before:bg-[radial-gradient(circle,rgba(0,170,180,0.45),transparent_70%)]",
  "before:animate-[pn-drift_22s_ease-in-out_infinite_alternate]",
  "after:pointer-events-none after:absolute after:-z-10 after:rounded-full after:blur-[46px]",
  "after:w-[220px] after:h-[220px] after:-bottom-[120px] after:-left-[60px]",
  "after:bg-[radial-gradient(circle,rgba(255,215,10,0.2),transparent_70%)]",
  "after:animate-[pn-drift_22s_ease-in-out_infinite_alternate-reverse]",
  "motion-reduce:before:animate-none motion-reduce:after:animate-none",
);

export const patroHeroGrid = cn(
  "pointer-events-none absolute inset-0 -z-10",
  "bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)]",
  "bg-size-[48px_48px]",
  "[mask-image:radial-gradient(circle_at_50%_0%,#000_30%,transparent_80%)]",
);
