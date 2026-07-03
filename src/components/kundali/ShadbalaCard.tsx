import { Fragment, useState } from "react";
import { ChevronRight } from "lucide-react";
import type {
  ShadbalaPlanet,
  ShadbalaResponse,
  ShadbalaStatus,
} from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

/** Classical display order for the matrix columns. */
const PLANET_ORDER = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];

const STHANA_SUBS: { key: string; label: string }[] = [
  { key: "uchcha", label: "Uchcha" },
  { key: "saptavargaja", label: "Sapta Vargiya" },
  { key: "oja_yugma", label: "Oja Yugma" },
  { key: "kendradi", label: "Kendradi" },
  { key: "drekkana", label: "Drekkana" },
];

const KALA_SUBS: { key: string; label: string }[] = [
  { key: "nathonnatha", label: "Nata Unnata" },
  { key: "paksha", label: "Paksha" },
  { key: "tribhaga", label: "Tri Bhaga" },
  { key: "varshadhipati", label: "Varshadhipati" },
  { key: "masadhipati", label: "Masadhipati" },
  { key: "varadhipati", label: "Varadhipati" },
  { key: "horadhipati", label: "Horadhipati" },
  { key: "ayana", label: "Ayana" },
  { key: "yuddha", label: "Yuddha" },
];

const th = "h-9 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
const td = "px-2.5 py-1.5 text-[12.5px]";
const num = "text-right font-mono tabular-nums";

function fmt(value: number | undefined, digits = 2): string {
  if (value == null) return "—";
  const abs = Math.abs(value).toFixed(digits);
  return value < 0 ? `−${abs}` : abs;
}

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

type MatrixRowProps = {
  label: string;
  planets: ShadbalaPlanet[];
  value: (p: ShadbalaPlanet) => string | React.ReactNode;
  bold?: boolean;
  expandable?: boolean;
  open?: boolean;
  onToggle?: () => void;
  sub?: boolean;
};

function MatrixRow({ label, planets, value, bold, expandable, open, onToggle, sub }: MatrixRowProps) {
  const labelCell = (
    <TableCell
      className={cn(
        td,
        "sticky left-0 z-10 bg-card whitespace-nowrap",
        sub ? "pl-8 text-muted-foreground" : "pl-3.5 font-semibold text-foreground",
      )}
    >
      {expandable ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="inline-flex items-center gap-1 font-semibold text-foreground hover:text-secondary transition-colors"
        >
          <ChevronRight
            className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-90")}
            aria-hidden
          />
          {label}
        </button>
      ) : (
        label
      )}
    </TableCell>
  );

  return (
    <TableRow className={cn(sub && "bg-muted/20")}>
      {labelCell}
      {planets.map((p) => (
        <TableCell
          key={p.key}
          className={cn(td, num, bold ? "font-semibold text-foreground" : sub ? "text-muted-foreground" : "text-foreground/90")}
        >
          {value(p)}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function ShadbalaCard({ data }: { data: ShadbalaResponse }) {
  const { planets, summary } = data;
  const [openSthana, setOpenSthana] = useState(false);
  const [openKala, setOpenKala] = useState(false);

  // Classical column order; rank derives from the ratio ordering.
  const ordered = PLANET_ORDER
    .map((key) => planets.find((p) => p.key === key))
    .filter((p): p is ShadbalaPlanet => p != null);
  const rankByKey = new Map(
    [...planets]
      .sort((a, b) => b.ratio - a.ratio)
      .map((p, i) => [p.key, i + 1]),
  );

  const hasSubs = ordered.some((p) => p.sub_balas != null);
  const hasPhala = ordered.some((p) => p.ishta_phala != null);

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

      {/* All planets in one matrix */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Shadbala table</h4>
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className={cn(th, "sticky left-0 z-10 bg-muted pl-3.5")}>Bala</TableHead>
                {ordered.map((p) => (
                  <TableHead key={p.key} className={cn(th, "text-right min-w-[5.25rem]")}>
                    <span className="block leading-tight">{p.name}</span>
                    <span className="block text-[10px] font-medium normal-case text-muted-foreground/80">
                      {p.name_ne}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <MatrixRow
                label="Relative Rank"
                planets={ordered}
                value={(p) => String(rankByKey.get(p.key) ?? "—")}
                bold
              />
              <MatrixRow
                label="Sthana"
                planets={ordered}
                value={(p) => fmt(p.breakdown.sthana)}
                expandable={hasSubs}
                open={openSthana}
                onToggle={() => setOpenSthana((v) => !v)}
              />
              {openSthana && (
                <Fragment>
                  {STHANA_SUBS.map((row) => (
                    <MatrixRow
                      key={row.key}
                      label={row.label}
                      planets={ordered}
                      value={(p) => fmt(p.sub_balas?.sthana?.[row.key])}
                      sub
                    />
                  ))}
                </Fragment>
              )}
              <MatrixRow label="Disha" planets={ordered} value={(p) => fmt(p.breakdown.dig)} />
              <MatrixRow
                label="Kala"
                planets={ordered}
                value={(p) => fmt(p.breakdown.kala)}
                expandable={hasSubs}
                open={openKala}
                onToggle={() => setOpenKala((v) => !v)}
              />
              {openKala && (
                <Fragment>
                  {KALA_SUBS.map((row) => (
                    <MatrixRow
                      key={row.key}
                      label={row.label}
                      planets={ordered}
                      value={(p) => fmt(p.sub_balas?.kala?.[row.key])}
                      sub
                    />
                  ))}
                </Fragment>
              )}
              <MatrixRow label="Chesta" planets={ordered} value={(p) => fmt(p.breakdown.cheshta)} />
              <MatrixRow
                label="Naisargika"
                planets={ordered}
                value={(p) => fmt(p.breakdown.naisargika)}
              />
              <MatrixRow label="Drishti" planets={ordered} value={(p) => fmt(p.breakdown.drik)} />
              <MatrixRow
                label="Total Pinda"
                planets={ordered}
                value={(p) => fmt(p.total_virupas)}
                bold
              />
              <MatrixRow label="Rupas" planets={ordered} value={(p) => fmt(p.rupas)} />
              <MatrixRow
                label="Min. Require"
                planets={ordered}
                value={(p) => fmt(p.required / 60)}
              />
              <MatrixRow
                label="Strength Ratio"
                planets={ordered}
                value={(p) => fmt(p.ratio, 4)}
                bold
              />
              {hasPhala && (
                <Fragment>
                  <MatrixRow
                    label="Ishta Phala"
                    planets={ordered}
                    value={(p) => fmt(p.ishta_phala)}
                  />
                  <MatrixRow
                    label="Kashta Phala"
                    planets={ordered}
                    value={(p) => fmt(p.kashta_phala)}
                  />
                </Fragment>
              )}
              <TableRow>
                <TableCell className={cn(td, "sticky left-0 z-10 bg-card pl-3.5 font-semibold text-foreground")}>
                  Status
                </TableCell>
                {ordered.map((p) => (
                  <TableCell key={p.key} className={cn(td, "text-right")}>
                    <StatusBadge status={p.status} />
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Virupas per bala; expand Sthana and Kala for their component
          strengths. Rank and Strength Ratio judge each planet against its own
          classical requirement.
        </p>
      </div>
    </div>
  );
}
