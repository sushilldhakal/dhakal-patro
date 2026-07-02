import { cn } from "./utils";

/** Scope for `--hora-*` tokens (keep on outer shell). */
export const horaTheme = "hora-theme";

export const horaStage = cn(
  "relative min-h-[520px] overflow-hidden",
  "bg-[linear-gradient(160deg,color-mix(in_srgb,var(--brand-teal)_7%,var(--card))_0%,var(--background)_52%,var(--parchment)_100%)]",
  "dark:bg-[radial-gradient(130%_120%_at_72%_40%,#0c1018_0%,#07080d_46%,#050609_100%)]",
);

const horaGlowBase =
  "pointer-events-none absolute rounded-full blur-[90px] animate-[hora-drift_24s_ease-in-out_infinite_alternate] motion-reduce:animate-none";

export const horaGlowTeal = cn(
  horaGlowBase,
  "left-1/2 top-[20%] -ml-[210px] h-[420px] w-[420px] bg-[#0c8f93] opacity-[0.08] dark:opacity-[0.18]",
);

export const horaGlowViolet = cn(
  horaGlowBase,
  "bottom-[10%] left-[20%] h-[380px] w-[380px] bg-[#6d3ad0] opacity-[0.06] dark:opacity-[0.12]",
  "[animation-delay:-12s]",
);

export const horaGlowAmber = cn(
  horaGlowBase,
  "right-[15%] top-[35%] h-[300px] w-[300px] bg-[#e08a1e] opacity-[0.05] dark:opacity-10",
  "[animation-delay:-6s]",
);

export const horaGridBg = cn(
  "pointer-events-none absolute inset-0 bg-[length:64px_64px]",
  "bg-[linear-gradient(color-mix(in_srgb,var(--foreground)_7%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--foreground)_7%,transparent)_1px,transparent_1px)]",
  "[mask-image:radial-gradient(ellipse_70%_55%_at_50%_42%,#000_0%,transparent_72%)]",
  "dark:bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)]",
);

export const horaSeg = "transition-[opacity,filter] duration-[400ms] ease-out";

export const horaSegText =
  "pointer-events-none transition-opacity duration-[400ms] ease-out [&_text]:font-semibold [&_text]:[font-family:var(--pn-font)]";

export const horaTickline =
  "stroke-[color-mix(in_srgb,var(--foreground)_20%,transparent)] [stroke-width:1] dark:stroke-[rgba(255,255,255,0.16)]";

export const horaCompassNep =
  "fill-[rgba(236,240,247,0.78)] text-xs font-normal italic [font-family:var(--pn-font)]";

export const horaCompassEn =
  "fill-[var(--hora-ink-faint)] text-[10px] font-semibold uppercase tracking-[0.14em] [font-family:var(--pn-font)]";

export const horaHubDay =
  "fill-[var(--hora-ink)] text-base font-semibold [font-family:var(--pn-font)]";

export const horaHubRom =
  "fill-[var(--hora-ink-faint)] text-[9px] font-semibold uppercase tracking-[0.18em] [font-family:var(--pn-font)]";

export const horaHubNum =
  "fill-[var(--hora-ink-faint)] font-num text-[10px] font-medium tracking-widest [font-family:var(--pn-num)]";

export const horaHubRuler =
  "text-2xl font-bold [font-family:var(--pn-font)]";
