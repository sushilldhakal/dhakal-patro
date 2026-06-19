import type {
  ShadbalaPlanet,
  ShadbalaResponse,
  ShadbalaStatus,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUS_ORDER: ShadbalaStatus[] = [
  "Exceptional",
  "Strong",
  "Adequate",
  "Borderline",
  "Weak",
];

const STATUS_STYLES: Record<ShadbalaStatus, string> = {
  Exceptional: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  Strong: "bg-sky-500/15 text-sky-500 border-sky-500/30",
  Adequate: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  Borderline: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  Weak: "bg-destructive/15 text-destructive border-destructive/30",
};

const BALA_ROWS: { key: keyof ShadbalaPlanet["breakdown"]; label: string }[] = [
  { key: "sthana", label: "Sthana Bala" },
  { key: "dig", label: "Dig Bala" },
  { key: "kala", label: "Kala Bala" },
  { key: "cheshta", label: "Cheshta Bala" },
  { key: "naisargika", label: "Naisargika Bala" },
  { key: "drik", label: "Drik Bala" },
];

function StatusBadge({ status }: { status: ShadbalaStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        STATUS_STYLES[status]
      )}
    >
      {status}
    </span>
  );
}

function GlanceTile({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
        {label}
      </p>
      {children}
    </div>
  );
}

export function ShadbalaCard({ data }: { data: ShadbalaResponse }) {
  const { planets, summary } = data;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          Shadbala — Planetary Strength (Virupas)
        </h3>
        <p className="text-xs text-muted-foreground mb-3">{data.method}</p>

        {/* At a glance */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <GlanceTile label="Strongest planet">
            <p className="text-lg font-bold text-foreground">{summary.strongest.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={summary.strongest.status} />
              <span className="text-xs text-muted-foreground">
                {summary.strongest.ratio.toFixed(2)}x required
              </span>
            </div>
          </GlanceTile>

          <GlanceTile label="Weakest planet">
            <p className="text-lg font-bold text-foreground">{summary.weakest.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={summary.weakest.status} />
              <span className="text-xs text-muted-foreground">
                {summary.weakest.ratio.toFixed(2)}x required
              </span>
            </div>
          </GlanceTile>

          <GlanceTile label="Average Rupas">
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {summary.average_rupas.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {summary.average_virupas.toFixed(2)} Virupas
            </p>
          </GlanceTile>

          <GlanceTile label="Planets meeting threshold">
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {summary.meeting_threshold}
              <span className="text-sm font-medium text-muted-foreground">
                {" "}
                / {summary.total_planets}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Adequate or stronger</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {STATUS_ORDER.map((s) => (
                <span
                  key={s}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                    summary.counts[s] > 0
                      ? STATUS_STYLES[s]
                      : "border-border text-muted-foreground/60"
                  )}
                >
                  {s} {summary.counts[s]}
                </span>
              ))}
            </div>
          </GlanceTile>
        </div>
      </div>

      {/* Planet strength table */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Planet strength table</h4>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground text-[11px] uppercase tracking-wide bg-muted/40">
                <th className="py-2 px-3 font-semibold">Planet</th>
                <th className="py-2 px-3 font-semibold text-right">Total Virupas</th>
                <th className="py-2 px-3 font-semibold text-right">Rupas</th>
                <th className="py-2 px-3 font-semibold text-right">Required</th>
                <th className="py-2 px-3 font-semibold text-right">Ratio</th>
                <th className="py-2 px-3 font-semibold">Status</th>
                <th className="py-2 px-3 font-semibold">Top Bala</th>
                <th className="py-2 px-3 font-semibold">Weakest Bala</th>
              </tr>
            </thead>
            <tbody>
              {planets.map((p) => (
                <tr key={p.key} className="border-t border-border">
                  <td className="py-2 px-3 font-medium text-foreground">{p.name}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-foreground">
                    {p.total_virupas.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                    {p.rupas.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                    {p.required.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums font-semibold text-foreground">
                    {p.ratio.toFixed(2)}x
                  </td>
                  <td className="py-2 px-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">{p.top_bala}</td>
                  <td className="py-2 px-3 text-muted-foreground">{p.weakest_bala}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Sorted by ratio so every planet is judged against its own classical
          requirement, not only by raw Virupas.
        </p>
      </div>

      {/* Per-planet breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">
          Planetary Shadbala Scores
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {planets.map((p) => (
            <div key={p.key} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-base font-bold text-foreground">
                    {p.name}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      {p.name_ne}
                    </span>
                  </p>
                  <StatusBadge status={p.status} />
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground tabular-nums leading-none">
                    {p.total_virupas.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Virupas ({p.rupas.toFixed(2)} Rupas)
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mb-2.5">
                Required: {p.required.toFixed(2)} Virupas
              </p>
              <div className="space-y-1.5">
                {BALA_ROWS.map((row) => {
                  const value = p.breakdown[row.key];
                  const pct = Math.max(0, Math.min(100, (value / 120) * 100));
                  return (
                    <div key={row.key}>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="tabular-nums font-medium text-foreground">
                          {value.toFixed(2)}
                          <span className="text-muted-foreground/70"> V</span>
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-secondary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
