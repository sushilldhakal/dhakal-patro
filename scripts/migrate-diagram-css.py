#!/usr/bin/env python3
"""Generate diagram-classes.ts + timeline-classes.ts and patch TSX className usage."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"

# class_name -> tailwind utility string (no leading dot)
DIAGRAM: dict[str, str] = {
    # ed-*
    "ed-moon-disk": "stroke-[color-mix(in_srgb,var(--tm-ink)_35%,transparent)] dark:stroke-[#5a6a72]",
    "ed-moon-lit": "[filter:drop-shadow(0_0_2px_color-mix(in_srgb,#fff_25%,transparent))]",
    "ed-moon-halo": "fill-[color-mix(in_srgb,var(--tm-teal)_8%,transparent)]",
    "ed-moon-rim": "stroke-[color-mix(in_srgb,var(--tm-ink)_40%,transparent)]",
    "ed-moon-full-ring": "stroke-[color-mix(in_srgb,#fff_55%,transparent)] opacity-[0.55]",
    "ed-moon-new": "stroke-[color-mix(in_srgb,var(--tm-ink)_50%,transparent)] dark:stroke-[#3a454c]",
    "ed-orbit-dir": "stroke-[var(--tm-teal)] [stroke-width:2] stroke-round opacity-[0.85]",
    "ed-orbit-dir-arrow": "fill-[var(--tm-teal)]",
    "ed-orbit-dir-label": "fill-[var(--tm-teal)] text-[13px] font-semibold [font-family:var(--pn-font)]",
    "ed-axis": "stroke-[color-mix(in_srgb,var(--tm-gold)_42%,transparent)] [stroke-width:1.2] [stroke-dasharray:2_6]",
    "ed-orbit": "fill-none stroke-[var(--tm-ring-soft)] [stroke-width:1]",
    "ed-earth-solar-orbit": "fill-none stroke-[color-mix(in_srgb,var(--tm-amber)_45%,transparent)] [stroke-width:1.6] [stroke-dasharray:5_6]",
    "ed-earth-orbit-arrow": "fill-[color-mix(in_srgb,var(--tm-amber)_70%,transparent)]",
    "ed-earth-orbit-label": "fill-[color-mix(in_srgb,var(--tm-amber)_80%,var(--tm-ink-faint))] text-[11px] font-semibold [font-family:var(--pn-font)]",
    "ed-ring": "fill-none stroke-[color-mix(in_srgb,var(--tm-teal)_36%,transparent)] [stroke-width:1.4]",
    "ed-degtick": "stroke-[var(--tm-gold)]",
    "ed-deglabel": "fill-[var(--tm-gold)] font-num text-[15px] font-bold",
    "ed-lens": "fill-[var(--tm-amber)] stroke-[color-mix(in_srgb,#000_30%,transparent)] [stroke-width:0.5]",
    "ed-tnum": "fill-[var(--tm-ink-faint)] font-num text-[13px] font-semibold",
    "ed-curband": "fill-none stroke-[var(--tm-gold)] [stroke-width:2]",
    "ed-arc": "stroke-[color-mix(in_srgb,var(--tm-teal)_35%,var(--tm-border))] [stroke-width:3.2] stroke-round dark:stroke-[color-mix(in_srgb,#c9d6da_60%,transparent)]",
    "ed-arc-cap": "fill-[color-mix(in_srgb,var(--tm-teal)_8%,var(--tm-card))] dark:fill-[#e7eef0]",
    "ed-arc-val": "fill-[var(--tm-teal)] font-num text-[30px] font-bold",
    "ed-rmline": "stroke-[color-mix(in_srgb,var(--tm-ink)_40%,transparent)] [stroke-width:1]",
    "ed-ray": "stroke-[#ffce5a] [stroke-width:2.4] stroke-round opacity-80",
    "ed-body-label": "fill-[var(--tm-ink-dim)] text-[15px] font-semibold [font-family:var(--pn-font)]",
    "ed-tilt-label": "fill-foreground text-sm font-semibold [font-family:var(--pn-font)] dark:fill-white",
    "ed-tilt-rim": "stroke-[color-mix(in_srgb,var(--foreground)_35%,transparent)] opacity-[0.55] dark:stroke-[color-mix(in_srgb,#fff_45%,transparent)]",
    "ed-tilt-eq": "stroke-[color-mix(in_srgb,var(--foreground)_40%,transparent)] opacity-[0.65] dark:stroke-[color-mix(in_srgb,#fff_50%,transparent)]",
    "ed-tilt-pole": "stroke-foreground opacity-90 dark:stroke-white",
    "ed-tilt-cap": "fill-[#8ed4a0]",
    "ed-paksha": "fill-[var(--tm-ink-faint)] text-sm font-semibold tracking-wide [font-family:var(--pn-font)]",
    "ed-end": "",  # handled by variants
    "ed-scrub": "ed-scrub flex-1 min-w-0 w-full h-[5px] rounded-full outline-none cursor-pointer",
    # ecl-*
    "ecl-panel-bg": "fill-[color-mix(in_srgb,var(--tm-card)_92%,#f4f7fb)] dark:fill-[color-mix(in_srgb,#0e1520_88%,var(--tm-card))]",
    "ecl-ecliptic-ring": "stroke-[color-mix(in_srgb,var(--tm-ink)_88%,transparent)] [stroke-width:2.2] stroke-round",
    "ecl-moon-orbit": "fill-none stroke-round",
    "ecl-axis": "stroke-[color-mix(in_srgb,var(--tm-gold)_35%,transparent)] [stroke-width:1] [stroke-dasharray:3_8]",
    "ecl-ray": "stroke-[color-mix(in_srgb,#ffcf57_75%,transparent)] [stroke-width:2.2] stroke-round",
    "ecl-sun-disc": "stroke-[color-mix(in_srgb,#e08a10_35%,transparent)] [stroke-width:1.5]",
    "ecl-penumbra": "fill-[color-mix(in_srgb,var(--tm-ink)_10%,transparent)] dark:fill-[color-mix(in_srgb,#0a0e12_34%,transparent)]",
    "ecl-umbra-shape": "stroke-none",
    "ecl-body-label": "fill-[color-mix(in_srgb,var(--tm-ink)_72%,transparent)] text-sm font-semibold [font-family:var(--pn-font)]",
    "ecl-plane-caption": "fill-[color-mix(in_srgb,var(--tm-ink)_58%,transparent)] text-[13px] font-semibold [font-family:var(--pn-font)]",
    "ecl-node-dot": "fill-[var(--tm-ink)] stroke-[var(--tm-card)] [stroke-width:2]",
    "ecl-node-line": "stroke-[var(--tm-amber)] [stroke-width:2.8] [stroke-dasharray:10_7] stroke-round opacity-[0.95]",
    "ecl-node-callout": "pointer-events-none",
    "ecl-node-arrow": "stroke-[color-mix(in_srgb,var(--tm-ink)_55%,transparent)] [stroke-width:1.4]",
    "ecl-node-arrow-head": "fill-[color-mix(in_srgb,var(--tm-ink)_70%,transparent)]",
    "ecl-node-title": "fill-[color-mix(in_srgb,var(--tm-ink)_88%,transparent)] text-[15px] font-bold [font-family:var(--pn-font)]",
    "ecl-node-sym": "fill-[var(--tm-amber)] text-[28px] font-extrabold [font-family:var(--pn-font)]",
    "ecl-earth-glow": "fill-[color-mix(in_srgb,var(--tm-teal)_12%,transparent)]",
    "ecl-blood-glow": "fill-[color-mix(in_srgb,#d2402a_38%,transparent)]",
    "ecl-blood-tint": "fill-[color-mix(in_srgb,#c0392b_46%,transparent)] [mix-blend-mode:multiply]",
    "ecl-moon-eclipsed": "[filter:drop-shadow(0_0_6px_color-mix(in_srgb,#e0473a_60%,transparent))]",
    "ecl-status": "text-[22px] font-extrabold [font-family:var(--pn-font)]",
    "ecl-status-sub": "fill-[var(--tm-ink-faint)] font-num text-[13px] font-semibold",
    "ecl-tilt-note": "fill-[var(--tm-ink-faint)] text-xs font-medium [font-family:var(--pn-font)]",
    # mot-*
    "mot-plane-face": "stroke-none",
    "mot-plane-rim": "stroke-[color-mix(in_srgb,#8fc0ff_62%,transparent)] [stroke-width:2]",
    "mot-plane-label": "fill-[#9fb6d8] text-sm font-semibold [font-family:var(--pn-font)]",
    "mot-earth-label": "fill-[#d4e4ee]",
    "mot-node-track": "stroke-[color-mix(in_srgb,#ffd86b_32%,transparent)] [stroke-width:1.6] [stroke-dasharray:2_7]",
    "mot-orbit": "stroke-round",
    "mot-node-line": "stroke-[color-mix(in_srgb,#ffd86b_52%,transparent)] [stroke-width:3] [stroke-dasharray:9_6]",
    "mot-sun-ray": "stroke-[color-mix(in_srgb,var(--tm-gold)_60%,transparent)] [stroke-width:1.6] [stroke-dasharray:5_5]",
    "mot-sun-label": "fill-[#ffdd80] text-sm font-semibold [font-family:var(--pn-font)]",
    "mot-earth-glow": "fill-[color-mix(in_srgb,#5aa9ff_22%,transparent)]",
    "mot-tilt-arc": "stroke-[#ffd86b] [stroke-width:2]",
    "mot-tilt-ref": "stroke-[color-mix(in_srgb,#cfe0ea_34%,transparent)] [stroke-width:1.4]",
    "mot-tilt-label": "fill-[#ffe08a] text-base font-bold [font-family:var(--pn-font)]",
    "mot-node": "fill-[#3ddc6f] stroke-[#07203a] [stroke-width:2.5]",
    "mot-node-dot": "fill-[#07351c]",
    "mot-node-label": "fill-[#84f0aa] text-lg font-bold [font-family:var(--pn-font)]",
    "mot-height-post": "stroke-[color-mix(in_srgb,#cfe0ea_32%,transparent)] [stroke-width:1.3] [stroke-dasharray:2_4]",
    "mot-base-dot": "fill-[color-mix(in_srgb,#cfe0ea_42%,transparent)]",
    "mot-moon": "stroke-[rgba(255,255,255,0.4)] [stroke-width:1]",
    "mot-moon-submerged": "opacity-50",
    "mot-moon-label": "fill-[#d4e4ee] text-[13px] font-semibold [font-family:var(--pn-font)]",
    "mot-legend-label": "fill-[#9fb6d8] text-[13px] font-semibold [font-family:var(--pn-font)]",
    "mot-shadow-dot": "fill-[rgba(212,228,238,0.62)]",
    "mot-shadow-label": "fill-[#d4e4ee] text-xs font-semibold [font-family:var(--pn-font)]",
    "mot-moon-eclipsing": "[filter:drop-shadow(0_0_7px_color-mix(in_srgb,#e0473a_55%,transparent))]",
    "mot-season-banner": "fill-[#d4e4ee] text-[17px] font-bold [font-family:var(--pn-font)]",
    # sol-*
    "sol-light": "fill-[color-mix(in_srgb,#ffd24a_9%,transparent)]",
    "sol-ray": "stroke-[color-mix(in_srgb,#ffcf57_70%,transparent)] [stroke-width:2.4] stroke-round",
    "sol-sun-glow": "fill-[color-mix(in_srgb,#ffcf57_26%,transparent)]",
    "sol-penumbra": "fill-[color-mix(in_srgb,var(--tm-ink)_18%,transparent)] dark:fill-[color-mix(in_srgb,#000_34%,transparent)]",
    "sol-antumbra": "fill-[color-mix(in_srgb,var(--tm-ink)_32%,transparent)] dark:fill-[color-mix(in_srgb,#000_52%,transparent)]",
    "sol-umbra": "fill-[color-mix(in_srgb,#11151b_88%,transparent)]",
    "sol-legend-label": "fill-[var(--tm-ink-faint)] text-[13px] font-semibold [font-family:var(--pn-font)]",
    "sol-moon": "fill-[#2b2f36] stroke-[color-mix(in_srgb,#fff_45%,transparent)] [stroke-width:1.5]",
    "sol-moon-label": "fill-[var(--tm-ink-dim)] text-[13px] font-semibold [font-family:var(--pn-font)]",
    "sol-earth-glow": "fill-[color-mix(in_srgb,var(--tm-teal)_18%,transparent)]",
    "sol-spot-pen": "fill-[color-mix(in_srgb,#11151b_22%,transparent)]",
    "sol-spot-umbra": "fill-[#0a0c10]",
    "sol-spot-anti": "fill-[color-mix(in_srgb,#11151b_46%,transparent)] stroke-[#ffd24a] [stroke-width:1.5]",
    "sol-eye-frame": "fill-[var(--tm-card)] stroke-[var(--tm-border)] [stroke-width:1.5]",
    "sol-eye-title": "fill-[var(--tm-ink-faint)] text-sm font-bold tracking-wide [font-family:var(--pn-font)]",
    "sol-eye-sky": "fill-[#070b16]",
    "sol-eye-sun": "fill-[#ffd24a]",
    "sol-eye-moon": "fill-[#05070c]",
    "sol-corona": "fill-[url(#sol-coronaGrad)]",
    "sol-eye-rim": "fill-none stroke-[var(--tm-border)] [stroke-width:2]",
    "sol-eye-status": "fill-[var(--tm-ink-dim)] text-[15px] font-bold [font-family:var(--pn-font)]",
    # ho-*
    "ho-orbit-ellipse": "fill-none stroke-[var(--tm-ring-soft)] [stroke-width:1.6] [stroke-dasharray:6_5]",
    "ho-orbit-guide": "stroke-[color-mix(in_srgb,var(--tm-teal)_12%,transparent)] [stroke-width:1] [stroke-dasharray:3_8] opacity-[0.45]",
    "ho-focus-line": "stroke-[color-mix(in_srgb,var(--tm-amber)_45%,transparent)] [stroke-width:1.2] [stroke-dasharray:4_5]",
    "ho-focus-aphelion": "stroke-[color-mix(in_srgb,var(--tm-teal)_40%,transparent)]",
    "ho-focus-label": "fill-[var(--tm-ink-faint)] text-[11px] font-semibold [font-family:var(--pn-font)]",
    "ho-orbit-dir": "fill-[var(--tm-teal)] text-[13px] font-semibold [font-family:var(--pn-font)]",
    "ho-marker-dot": "fill-[var(--tm-teal)] stroke-[var(--tm-card)] [stroke-width:2]",
    "ho-marker-ne": "fill-[var(--tm-ink)] text-sm font-bold [font-family:var(--pn-font)]",
    "ho-marker-detail": "fill-[var(--tm-ink-dim)] text-xs font-semibold [font-family:var(--pn-font)]",
    "ho-marker-tag": "fill-[var(--tm-amber)] text-[11px] font-semibold [font-family:var(--pn-font)]",
    "ho-sweep": "stroke-[var(--tm-amber)] [stroke-width:2.8] stroke-round opacity-[0.85]",
    "ho-sun-ray": "stroke-[color-mix(in_srgb,var(--tm-gold)_55%,transparent)] [stroke-width:1.3] [stroke-dasharray:4_5]",
    "ho-earth-glow": "fill-[color-mix(in_srgb,var(--tm-teal)_12%,transparent)]",
    "ho-earth-group": "will-change-transform",
    "ho-equator": "stroke-[color-mix(in_srgb,var(--tm-gold)_75%,white)] [stroke-width:2.2] stroke-round",
    "ho-tilt-ref": "stroke-[color-mix(in_srgb,var(--tm-ink)_22%,transparent)] [stroke-width:1.2] [stroke-dasharray:3_4]",
    "ho-tilt-arc": "stroke-[var(--tm-amber)] [stroke-width:1.6] stroke-round",
    "ho-pole-axis": "stroke-[color-mix(in_srgb,var(--tm-ink)_70%,transparent)] [stroke-width:2.8] stroke-round",
    "ho-north-pole": "fill-[var(--tm-amber)] stroke-[var(--tm-card)] [stroke-width:1.5]",
    "ho-pole-label": "fill-[var(--tm-amber)] text-xs font-semibold [font-family:var(--pn-font)]",
    "ho-callout-ne": "fill-[var(--tm-ink)] text-[13px] font-bold [font-family:var(--pn-font)]",
    "ho-callout-sub": "fill-[var(--tm-ink-faint)] font-num text-[11px] font-semibold",
    # ss-rot-*
    "ss-rot-dir": "fill-[var(--tm-ink-dim)] text-sm font-semibold [font-family:var(--pn-font)]",
    "ss-rot-axis": "stroke-[color-mix(in_srgb,var(--tm-ink)_18%,transparent)] [stroke-width:1.2] [stroke-dasharray:4_5]",
    "ss-rot-pole": "stroke-[color-mix(in_srgb,var(--tm-ink)_45%,transparent)] [stroke-width:2] stroke-round",
    "ss-rot-curve": "stroke-[var(--tm-amber)] [stroke-width:2.4] stroke-round",
    "ss-rot-arrow-head": "fill-[var(--tm-amber)]",
    "ss-rot-label": "fill-[var(--tm-teal)] text-sm font-semibold [font-family:var(--pn-font)]",
    # sem-*
    "sem-orbit": "fill-none stroke-[var(--tm-ring-soft)] [stroke-width:1.4]",
    "sem-orbit-guide": "stroke-[color-mix(in_srgb,var(--tm-teal)_12%,transparent)] [stroke-width:1] [stroke-dasharray:3_8] opacity-[0.45]",
    "sem-moon-orbit": "fill-none stroke-[color-mix(in_srgb,var(--tm-teal)_32%,transparent)] [stroke-width:1.1] [stroke-dasharray:3_4]",
    "sem-moon-orbit-guide": "stroke-[color-mix(in_srgb,var(--tm-teal)_18%,transparent)] [stroke-width:0.9] [stroke-dasharray:2_6] opacity-50",
    "sem-radius-line": "stroke-[color-mix(in_srgb,var(--tm-ink)_16%,transparent)] [stroke-width:1] [stroke-dasharray:2_6]",
    "sem-sun-lon-ray": "stroke-[color-mix(in_srgb,var(--tm-amber)_70%,transparent)] [stroke-width:1.8] [stroke-dasharray:4_5] pointer-events-none",
    "sem-sun-lon-marker": "fill-[var(--tm-amber)] stroke-[color-mix(in_srgb,var(--tm-card)_85%,white)] [stroke-width:2] pointer-events-none",
    "sem-tidal-marker": "fill-[color-mix(in_srgb,#000_45%,transparent)]",
    "sem-earth-glow": "fill-[color-mix(in_srgb,var(--tm-teal)_12%,transparent)]",
    # tm-*
    "tm-axis": "stroke-[var(--tm-ring-soft)] [stroke-width:1]",
    "tm-sunline": "stroke-[color-mix(in_srgb,var(--tm-gold)_60%,transparent)] [stroke-width:1.2] [stroke-dasharray:3_3]",
    "tm-date": "fill-[var(--tm-ink)] font-num text-sm font-bold",
    "tm-date-sub": "fill-[var(--tm-ink-faint)] text-[11px] font-medium [font-family:var(--pn-font)]",
    "tm-tl-cap": "fill-[var(--tm-ink-dim)] text-[13px] font-semibold [font-family:var(--pn-font)]",
    "tm-travel": "stroke-[color-mix(in_srgb,var(--tm-ink)_30%,transparent)] [stroke-width:1.4]",
    "tm-travel-head": "fill-[color-mix(in_srgb,var(--tm-ink)_40%,transparent)]",
    "tm-track-label": "fill-[var(--tm-ink)] text-[15px] font-bold [font-family:var(--pn-font)]",
    "tm-track-sub": "fill-[var(--tm-ink-faint)] text-[12.5px] font-medium [font-family:var(--pn-font)]",
    "tm-solar-band": "fill-[color-mix(in_srgb,var(--tm-gold)_16%,transparent)] stroke-[color-mix(in_srgb,var(--tm-gold)_42%,transparent)] [stroke-width:1.2]",
    "tm-seg-sym": "fill-[var(--tm-gold)] text-[17px] font-normal [font-family:var(--pn-font)]",
    "tm-seg-name": "fill-[var(--tm-ink)] text-sm font-bold [font-family:var(--pn-font)]",
    "tm-vline": "stroke-[color-mix(in_srgb,var(--tm-gold)_45%,transparent)] [stroke-width:1] [stroke-dasharray:3_4]",
    "tm-adhik-ring": "fill-none stroke-[var(--tm-amber)] [stroke-width:1.6] [stroke-dasharray:6_4]",
    "tm-adhik-note": "fill-[var(--tm-amber)] text-sm font-semibold [font-family:var(--pn-font)]",
    # earth globe
    "earth-globe-object": "pointer-events-none",
    "earth-globe-rim": "stroke-[color-mix(in_srgb,var(--tm-ink)_38%,transparent)] [stroke-width:1.3] dark:stroke-[color-mix(in_srgb,#d4ecff_34%,transparent)]",
}

TIMELINE: dict[str, str] = {
    "pgx-nightwash": "fill-[color-mix(in_srgb,var(--brand-teal)_7%,transparent)] dark:fill-[color-mix(in_srgb,var(--foreground)_8%,transparent)]",
    "pgx-scale-label": "text-[11px] font-semibold fill-muted-foreground [font-family:var(--font-sans)]",
    "pgx-hour": "text-[11px] font-semibold fill-foreground font-mono",
    "pgx-ghati": "text-[10px] font-medium fill-muted-foreground font-mono",
    "pgx-sunline": "stroke-border [stroke-width:1]",
    "pgx-moonline": "stroke-[color-mix(in_srgb,var(--muted-foreground)_35%,var(--border))] [stroke-width:1] [stroke-dasharray:3_5] opacity-70",
    "pgx-sunhair": "stroke-[var(--color-warning)] [stroke-width:1] [stroke-dasharray:2_4] opacity-[0.55]",
    "pgx-segname": "text-[12.5px] font-semibold fill-foreground [font-family:var(--font-sans)]",
    "pgx-segname-sm": "text-[10px] font-semibold tracking-tight",
    "pgx-paksha": "text-[10.5px] font-medium fill-muted-foreground [font-family:var(--font-sans)]",
    "pgx-time": "text-xs font-medium fill-foreground font-mono",
    "pgx-now": "",
    "pgx-now-pill": "fill-[var(--color-danger)]",
    "pgx-now-text": "text-xs font-semibold fill-white [font-family:var(--font-sans)]",
    "pg-tl-vgrid-major": "stroke-[color-mix(in_srgb,var(--foreground)_28%,var(--border))] [stroke-width:1] [stroke-dasharray:3_4] stroke-opacity-40 pointer-events-none dark:stroke-[color-mix(in_srgb,var(--foreground)_38%,var(--border))]",
    "pg-tl-axis": "stroke-foreground stroke-opacity-45 [stroke-width:1.2]",
    "pg-tl-tick": "stroke-foreground stroke-opacity-40 [stroke-width:1]",
    "pg-tl-sun-disc": "fill-[color-mix(in_srgb,var(--color-warning)_88%,#fff)] stroke-[color-mix(in_srgb,var(--color-warning)_70%,#c9a000)] [stroke-width:0.75]",
    "pg-tl-sun-horizon": "stroke-[color-mix(in_srgb,var(--color-warning)_55%,var(--muted-foreground))] [stroke-width:1] stroke-round",
    "pg-tl-moon": "font-mono text-sm font-bold fill-muted-foreground",
    "pg-tl-moon-emoji": "text-[15px]",
    "pg-tl-event-time": "font-mono text-[10.5px] font-semibold fill-[var(--color-warning)]",
    "pg-tl-rowlabel": "text-xs font-bold fill-foreground [font-family:var(--font-sans)]",
    "pg-tl-rowlabel-en": "text-[10px] font-semibold uppercase tracking-wide fill-muted-foreground [font-family:var(--font-sans)]",
    "pg-tl-segname-sm": "text-[10px] font-semibold fill-foreground [font-family:var(--font-sans)]",
    "pg-tl-badname": "text-[11px] font-bold fill-[var(--color-danger)] [font-family:var(--font-sans)]",
}

ROWLINE_COLORS = [
    "stroke-[color-mix(in_srgb,var(--brand-teal)_22%,transparent)]",
    "stroke-[color-mix(in_srgb,var(--brand-yellow)_18%,transparent)]",
    "stroke-[color-mix(in_srgb,var(--color-danger)_16%,transparent)]",
    "stroke-[color-mix(in_srgb,var(--secondary)_20%,transparent)]",
    "stroke-[color-mix(in_srgb,var(--foreground)_12%,transparent)]",
    "stroke-[color-mix(in_srgb,var(--brand-teal)_14%,transparent)]",
    "stroke-[color-mix(in_srgb,var(--brand-yellow)_12%,transparent)]",
]


def to_camel(css: str) -> str:
    parts = css.replace(".", "").split("-")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def gen_ts(exports: dict[str, str], header: str, extra: str = "") -> str:
    lines = [
        'import { cn } from "./utils";',
        "",
        header,
        "",
    ]
    if extra:
        lines.append(extra)
        lines.append("")
    for css, tw in sorted(exports.items()):
        if not tw:
            continue
        name = to_camel(css)
        lines.append(f'export const {name} = "{tw}";')
    lines.append("")
    return "\n".join(lines)


def gen_timeline_extra() -> str:
    lines = [
        'export const pgxSegBase = "stroke-[color-mix(in_srgb,var(--foreground)_10%,transparent)] [stroke-width:1]";',
        "",
        "const PG_SEG: Record<string, string> = {",
        '  tithi: "fill-[color-mix(in_srgb,var(--brand-yellow)_26%,var(--card))]",',
        '  "tithi-alt": "fill-[color-mix(in_srgb,var(--brand-yellow)_14%,var(--card))]",',
        '  nak: "fill-[color-mix(in_srgb,var(--brand-teal)_18%,var(--card))]",',
        '  "nak-alt": "fill-[color-mix(in_srgb,var(--brand-teal)_9%,var(--card))]",',
        '  yoga: "fill-[color-mix(in_srgb,#6c625a_20%,var(--card))] dark:fill-[color-mix(in_srgb,#9c4e1f_24%,var(--card))]",',
        '  "yoga-alt": "fill-[color-mix(in_srgb,#6c625a_10%,var(--card))] dark:fill-[color-mix(in_srgb,#9c4e1f_12%,var(--card))]",',
        '  karana: "fill-[color-mix(in_srgb,#cf8400_18%,var(--card))] dark:fill-[color-mix(in_srgb,#1c5d80_22%,var(--card))]",',
        '  "karana-alt": "fill-[color-mix(in_srgb,#cf8400_9%,var(--card))] dark:fill-[color-mix(in_srgb,#1c5d80_11%,var(--card))]",',
        '  lagna: "fill-[color-mix(in_srgb,var(--foreground)_7%,var(--card))]",',
        '  "lagna-alt": "fill-[color-mix(in_srgb,var(--foreground)_3%,var(--card))]",',
        '  "lagna-active": "fill-[color-mix(in_srgb,var(--secondary)_28%,var(--card))] stroke-secondary [stroke-width:1.5]",',
        '  "cho-good": "fill-[color-mix(in_srgb,var(--color-success)_13%,var(--card))]",',
        '  "cho-bad": "fill-[color-mix(in_srgb,var(--color-danger)_13%,var(--card))]",',
        "};",
        "",
        "export function pgxSeg(",
        "  kind: string,",
        "  opts?: { alt?: boolean; active?: boolean; bad?: boolean },",
        ") {",
        "  if (kind === 'cho' || kind === 'hora')",
        "    return cn(pgxSegBase, opts?.bad ? PG_SEG['cho-bad'] : PG_SEG['cho-good']);",
        "  const key = `${kind}${opts?.alt ? '-alt' : ''}${opts?.active ? '-active' : ''}`;",
        "  return cn(pgxSegBase, PG_SEG[key] ?? PG_SEG[kind]);",
        "}",
        "",
        'export const pgxArrow = "[&_line]:stroke-[var(--brand-teal)] [&_line]:[stroke-width:1.6] [&_line]:stroke-round dark:[&_line]:stroke-[var(--brand-yellow)] [&_path]:fill-[var(--brand-teal)] dark:[&_path]:fill-[var(--brand-yellow)]";',
        'export const pgxArrowBound = "stroke-[var(--brand-teal)] dark:stroke-[var(--brand-yellow)] [stroke-width:1.3] opacity-100";',
        "",
        "const ROW_LINES = [",
    ]
    for c in ROWLINE_COLORS:
        lines.append(f'  "{c}",')
    lines.extend([
        "] as const;",
        "",
        "export function pgTlRowline(i: number) {",
        '  return cn("stroke-[1.4] stroke-round", ROW_LINES[i % ROW_LINES.length]);',
        "}",
        "",
        "export function pgxScaleLabel(dim?: boolean) {",
        "  return cn(pgxScaleLabel, dim && 'opacity-75');",
        "}",
        "",
        "export function pgxSegnameCho(bad?: boolean) {",
        "  return cn(pgxSegname, 'text-[11px]', bad && 'fill-[var(--color-danger)]');",
        "}",
        "",
        "export function pgTlEventTime(moon?: boolean) {",
        "  return cn(pgTlEventTime, moon && 'fill-muted-foreground');",
        "}",
        "",
        "export function pgxTime(lagna?: boolean) {",
        "  return cn(pgxTime, lagna && 'opacity-90');",
        "}",
    ])
    return "\n".join(lines)


def gen_diagram_extra() -> str:
    return "\n".join([
        "export function eclMoonOrbit(above?: boolean) {",
        "  return cn(",
        "    eclMoonOrbit,",
        "    above",
        '      ? "stroke-[color-mix(in_srgb,var(--tm-ink)_82%,transparent)] [stroke-width:2] [stroke-dasharray:9_7]"',
        '      : "stroke-[color-mix(in_srgb,var(--tm-ink)_48%,transparent)] [stroke-width:1.7] [stroke-dasharray:7_8]",',
        "  );",
        "}",
        "",
        "export function motOrbit(variant: 'above' | 'below' | 'cross') {",
        "  const m = {",
        '    above: "stroke-[#ffd23a] [stroke-width:6]",',
        '    below: "stroke-[#c2a443] [stroke-width:5] opacity-90",',
        '    cross: "stroke-[#4ade80] [stroke-width:6.5]",',
        "  };",
        "  return cn(motOrbit, m[variant]);",
        "}",
        "",
        "export function motTiltRef(orbit?: boolean) {",
        "  return cn(motTiltRef, orbit && 'stroke-[color-mix(in_srgb,#ffd86b_70%,transparent)]');",
        "}",
        "",
        "export function tmBand(opts?: { alt?: boolean; dup?: boolean; skip?: boolean }) {",
        "  return cn(",
        '    "fill-[color-mix(in_srgb,var(--tm-teal)_14%,transparent)] stroke-[color-mix(in_srgb,var(--tm-teal)_30%,transparent)] [stroke-width:1]",',
        '    opts?.alt && "fill-[color-mix(in_srgb,var(--tm-teal)_22%,transparent)]",',
        '    opts?.dup && "fill-[color-mix(in_srgb,var(--tm-amber)_30%,transparent)] stroke-[var(--tm-amber)] [stroke-width:1.6]",',
        '    opts?.skip && "fill-[color-mix(in_srgb,var(--tm-amber)_10%,transparent)] stroke-[var(--tm-amber)] [stroke-width:1.4] [stroke-dasharray:5_4]",',
        "  );",
        "}",
        "",
        "export function tmBandNo(hot?: boolean) {",
        "  return cn('fill-[var(--tm-ink)] font-num text-base font-bold', hot && 'fill-[var(--tm-amber)]');",
        "}",
        "",
        "export function tmBandName(hot?: boolean) {",
        "  return cn('fill-[var(--tm-ink-dim)] text-[13px] font-semibold [font-family:var(--pn-font)]', hot && 'fill-[var(--tm-amber)]');",
        "}",
        "",
        "export function tmLunarBand(adhik?: boolean) {",
        "  return cn(",
        '    "fill-[color-mix(in_srgb,var(--tm-teal)_16%,transparent)] stroke-[color-mix(in_srgb,var(--tm-teal)_40%,transparent)] [stroke-width:1.2]",',
        '    adhik && "fill-[color-mix(in_srgb,var(--tm-amber)_28%,transparent)] stroke-[var(--tm-amber)] [stroke-width:1.8]",',
        "  );",
        "}",
        "",
        "export function tmSegName(adhik?: boolean) {",
        "  return cn(tmSegName, adhik && 'fill-[var(--tm-amber)]');",
        "}",
        "",
        "export function edEndNe() {",
        "  return 'fill-[var(--tm-gold)] text-[19px] font-bold [font-family:var(--pn-font)]';",
        "}",
        "",
        "export function edEndEn() {",
        "  return 'fill-[var(--tm-ink-faint)] font-num text-xs font-medium tracking-widest';",
        "}",
        "",
        "export const edScrub =",
        '  "ed-scrub flex-1 min-w-0 w-full h-[5px] rounded-full outline-none cursor-pointer";',
    ])


def patch_file(path: Path, mapping: dict[str, str]) -> bool:
    text = path.read_text()
    orig = text
    used: set[str] = set()

    # template literals with single class
    for css, var in mapping.items():
        if not var:
            continue
        pattern = rf'className="({re.escape(css)})(?:\s+([\w-]+))?"'
        def repl(m, css=css, var=var):
            extra = m.group(2)
            used.add(var)
            if extra:
                extra_var = mapping.get(extra) or to_camel(extra)
                used.add(extra_var)
                return f"className={{cn({var}, {extra_var})}}"
            return f"className={{{var}}}"
        text = re.sub(pattern, repl, text)

    # className={`foo bar`}
    for css, var in mapping.items():
        if not var:
            continue
        text = text.replace(f'className="{css}"', f"className={{{var}}}")

    if text == orig:
        return False

    # add import
    if used and "@/lib/diagram-classes" not in text and "@/lib/timeline-classes" not in text:
        mod = "diagram-classes" if any(u.startswith(("ed", "ecl", "mot", "sol", "ho", "sem", "ss", "tm", "earth"))) or path.name != "DayTimeline.tsx" else "timeline-classes"
        if path.name == "DayTimeline.tsx":
            mod = "timeline-classes"
        else:
            mod = "diagram-classes"
        names = sorted(used)
        imp = f'import {{ {", ".join(names)} }} from "@/lib/{mod}";\n'
        if 'from "@/lib/utils"' in text:
            text = text.replace('from "@/lib/utils"', f'from "@/lib/utils"\n{imp}', 1)
        elif 'import ' in text:
            idx = text.find('\n', text.find('import '))
            text = text[: idx + 1] + imp + text[idx + 1 :]
        else:
            text = imp + text
        if "cn(" in text and 'from "@/lib/utils"' not in text:
            text = 'import { cn } from "@/lib/utils";\n' + text

    path.write_text(text)
    return True


def main():
    tl_extra = gen_timeline_extra()
    (SRC / "lib" / "timeline-classes.ts").write_text(
        gen_ts(TIMELINE, "/** Day timeline chart (DayTimeline.tsx) SVG classes. */", tl_extra)
    )
    (SRC / "lib" / "diagram-classes.ts").write_text(
        gen_ts(DIAGRAM, "/** Interactive study / tithi diagram SVG classes. */", gen_diagram_extra())
    )
    print("Wrote timeline-classes.ts and diagram-classes.ts")

    for tsx in SRC.rglob("*.tsx"):
        if "node_modules" in str(tsx):
            continue
        if tsx.name == "DayTimeline.tsx":
            patch_file(tsx, {**TIMELINE, **{k: to_camel(k) for k in TIMELINE}})
        elif any(
            x in tsx.read_text()
            for x in ("ed-", "ecl-", "mot-", "sol-", "ho-", "sem-", "ss-rot", "tm-", "earth-globe")
        ):
            patch_file(tsx, {k: to_camel(k) for k, v in DIAGRAM.items() if v})

    print("Patched TSX files")


if __name__ == "__main__":
    main()
