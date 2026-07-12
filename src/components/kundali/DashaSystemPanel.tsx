import { useState } from "react";
import { useLocale } from "@/i18n/locale";
import type { DashaSystem, DashaTreeResponse } from "@/lib/api";
import { DashaTree } from "@/components/kundali/DashaTree";
import { cn } from "@/lib/utils";

type DashaTab = {
  id: DashaSystem;
  labelNe: string;
  labelEn: string;
  data: DashaTreeResponse | null | undefined;
  maxLevel: number;
};

type DashaSystemPanelProps = {
  vimshottari: DashaTreeResponse | null | undefined;
  tribhagi: DashaTreeResponse | null | undefined;
  yogini: DashaTreeResponse | null | undefined;
  timeZone?: string;
};

export function DashaSystemPanel({
  vimshottari,
  tribhagi,
  yogini,
  timeZone,
}: DashaSystemPanelProps) {
  const { pick } = useLocale();
  const tabs: DashaTab[] = [
    {
      id: "vimshottari",
      labelNe: "विंशोत्तरी",
      labelEn: "Vimshottari",
      data: vimshottari,
      maxLevel: 4,
    },
    {
      id: "tribhagi",
      labelNe: "त्रिभागि",
      labelEn: "Tribhagi",
      data: tribhagi,
      maxLevel: 4,
    },
    {
      id: "yogini",
      labelNe: "योगिनी",
      labelEn: "Yogini",
      data: yogini,
      maxLevel: 1,
    },
  ];
  const [active, setActive] = useState<DashaSystem>("vimshottari");
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0]!;
  const dasha = current.data;

  if (!vimshottari && !tribhagi && !yogini) return null;

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap gap-1 rounded-xl border border-border/70 bg-muted/20 p-1"
        role="tablist"
        aria-label={pick("दशा प्रणाली", "Dasha system")}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
              active === tab.id
                ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                : "hover:text-foreground",
            )}
          >
            {pick(tab.labelNe, tab.labelEn)}
          </button>
        ))}
      </div>

      {dasha ? (
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/80 bg-card px-3.5 py-3 min-w-0 shadow-[0_0_0_1px_color-mix(in_srgb,var(--foreground)_5%,transparent)]">
            <p className="text-sm font-semibold uppercase tracking-wider mb-1 truncate">
              {pick("महादशा सुरु (जन्मकालीन)", "Mahadasha at birth")}
            </p>
            <p className="text-base font-bold text-foreground leading-tight">
              {dasha.mahadasha_lord_ne}
            </p>
            <p className="text-xs mt-0.5">
              {pick(`बाँकी अवधि: ${dasha.balance_label}`, `Balance: ${dasha.balance_label}`)}
            </p>
          </div>
        </div>
      ) : null}

      {dasha?.tree?.length ? (
        <DashaTree
          tree={dasha.tree}
          timeZone={timeZone}
          system={current.id}
          maxLevel={current.maxLevel}
          cycleYears={current.id === "yogini" ? yogini?.cycle_years : undefined}
        />
      ) : (
        <p className="text-sm">
          {pick("दशा विवरण उपलब्ध छैन।", "Dasha details are not available.")}
        </p>
      )}
    </div>
  );
}
