import { Fragment, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useLocale } from "@/i18n/locale";
import type {
  BhavaBalaData,
  ShadbalaPlanet,
  ShadbalaResponse,
  ShadbalaStatus,
  YuddhaData,
} from "@/lib/api";
import { GRAHA_NAME, type GrahaKey } from "@/lib/graha-details";
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

const STHANA_SUBS: { key: string; ne: string; en: string }[] = [
  { key: "uchcha", ne: "उच्च", en: "Uchcha" },
  { key: "saptavargaja", ne: "सप्त वर्गीय", en: "Sapta Vargiya" },
  { key: "oja_yugma", ne: "ओज युग्म", en: "Oja Yugma" },
  { key: "kendradi", ne: "केन्द्रादि", en: "Kendradi" },
  { key: "drekkana", ne: "द्रेक्काण", en: "Drekkana" },
];

const KALA_SUBS: { key: string; ne: string; en: string }[] = [
  { key: "nathonnatha", ne: "नता उन्नत", en: "Nata Unnata" },
  { key: "paksha", ne: "पक्ष", en: "Paksha" },
  { key: "tribhaga", ne: "त्रि भाग", en: "Tri Bhaga" },
  { key: "varshadhipati", ne: "वर्षाधिपति", en: "Varshadhipati" },
  { key: "masadhipati", ne: "मासाधिपति", en: "Masadhipati" },
  { key: "varadhipati", ne: "वाराधिपति", en: "Varadhipati" },
  { key: "horadhipati", ne: "होराधिपति", en: "Horadhipati" },
  { key: "ayana", ne: "अयन", en: "Ayana" },
  { key: "yuddha", ne: "युद्ध", en: "Yuddha" },
];

const th = "h-9 px-2.5 text-sm font-semibold uppercase tracking-wide";
const td = "px-2.5 py-1.5 text-sm";
const num = "text-right font-mono tabular-nums";

function fmt(value: number | undefined, digits: (v: string | number) => string, places = 2): string {
  if (value == null) return "—";
  const abs = Math.abs(value).toFixed(places);
  const signed = value < 0 ? `−${abs}` : abs;
  return digits(signed);
}

const STATUS_LABEL: Record<ShadbalaStatus, { ne: string; en: string }> = {
  Exceptional: { ne: "उत्कृष्ट", en: "Exceptional" },
  Strong: { ne: "बलियो", en: "Strong" },
  Adequate: { ne: "पर्याप्त", en: "Adequate" },
  Borderline: { ne: "सीमान्त", en: "Borderline" },
  Weak: { ne: "कमजोर", en: "Weak" },
};

/** Yuddha virupas for display — API sub-bala value overlaid with the war table. */
function yuddhaVirupasForPlanet(planet: ShadbalaPlanet, yuddha: YuddhaData): number {
  const api = planet.sub_balas?.kala?.yuddha;
  if (api != null && api !== 0) return api;
  return yuddha.byPlanet[planet.key] ?? 0;
}

function StatusBadge({
  status,
  pick,
}: {
  status: ShadbalaStatus;
  pick: <T>(ne: T, en: T) => T;
}) {
  const label = pick(STATUS_LABEL[status].ne, STATUS_LABEL[status].en);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-sm font-semibold",
        STATUS_STYLES[status]
      )}
    >
      {label}
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
      <p className="text-sm font-semibold uppercase tracking-wide mb-1.5">
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
        sub ? "pl-8" : "pl-3.5 font-semibold text-foreground",
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
            className={cn("size-3.5 transition-transform", open && "rotate-90")}
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
          className={cn(td, num, bold ? "font-semibold text-foreground" : sub ? "" : "text-foreground/90")}
        >
          {value(p)}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function ShadbalaCard({
  data,
  yuddha,
  bhavaBala,
}: {
  data: ShadbalaResponse;
  /** Server-computed Graha Yuddha for the birth chart. */
  yuddha?: YuddhaData;
  /** Server-computed Bhava Bala (for the Bhava % row). */
  bhavaBala?: BhavaBalaData | null;
}) {
  const { pick, digits } = useLocale();
  const { planets, summary } = data;
  const [openSthana, setOpenSthana] = useState(false);
  const [openKala, setOpenKala] = useState(false);

  const planetName = (p: ShadbalaPlanet) => pick(p.name_ne, p.name);
  const grahaName = (key: string) => {
    const g = GRAHA_NAME[key as GrahaKey];
    return g ? pick(g.ne, g.en) : key;
  };

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
  const hasYuddhaActivity = (yuddha?.wars.length ?? 0) > 0;

  const rowLabel = (ne: string, en: string) => pick(ne, en);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-1">
          {pick("षड्बल — ग्रह शक्ति (विरुप)", "Shadbala — Planetary Strength (Virupas)")}
        </h3>
        <p className="text-xs mb-3">
          {pick(
            "पाराशरी षड्बल (लाहिरी निरयण, Swiss Ephemeris)",
            data.method,
          )}
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <GlanceTile label={pick("सबैभन्दा बलियो ग्रह", "Strongest planet")}>
            <p className="text-lg font-bold text-foreground">
              {pick(summary.strongest.name_ne, summary.strongest.name)}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={summary.strongest.status} pick={pick} />
              <span className="text-xs">
                {pick(
                  `${digits(summary.strongest.ratio.toFixed(2))}× आवश्यक`,
                  `${summary.strongest.ratio.toFixed(2)}x required`,
                )}
              </span>
            </div>
          </GlanceTile>

          <GlanceTile label={pick("सबैभन्दा कमजोर ग्रह", "Weakest planet")}>
            <p className="text-lg font-bold text-foreground">
              {pick(summary.weakest.name_ne, summary.weakest.name)}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={summary.weakest.status} pick={pick} />
              <span className="text-xs">
                {pick(
                  `${digits(summary.weakest.ratio.toFixed(2))}× आवश्यक`,
                  `${summary.weakest.ratio.toFixed(2)}x required`,
                )}
              </span>
            </div>
          </GlanceTile>

          <GlanceTile label={pick("औसत रूप", "Average Rupas")}>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {digits(summary.average_rupas.toFixed(2))}
            </p>
            <p className="text-xs mt-0.5">
              {digits(summary.average_virupas.toFixed(2))}{" "}
              {pick("विरुप", "Virupas")}
            </p>
          </GlanceTile>

          <GlanceTile label={pick("न्यूनतम पूरा गर्ने ग्रह", "Planets meeting threshold")}>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {digits(summary.meeting_threshold)}
              <span className="text-sm font-medium">
                {" "}
                / {digits(summary.total_planets)}
              </span>
            </p>
            <p className="text-xs mt-0.5">
              {pick("पर्याप्त वा बलियो", "Adequate or stronger")}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {STATUS_ORDER.map((s) => (
                <span
                  key={s}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-sm font-medium",
                    summary.counts[s] > 0
                      ? STATUS_STYLES[s]
                      : "border-border"
                  )}
                >
                  {pick(STATUS_LABEL[s].ne, STATUS_LABEL[s].en)}{" "}
                  {digits(summary.counts[s])}
                </span>
              ))}
            </div>
          </GlanceTile>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">
          {pick("षड्बल तालिका", "Shadbala table")}
        </h4>
        <div className="rounded-xl border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className={cn(th, "sticky left-0 z-10 bg-muted pl-3.5")}>
                  {pick("बल", "Bala")}
                </TableHead>
                {ordered.map((p) => (
                  <TableHead key={p.key} className={cn(th, "text-right min-w-[5.25rem]")}>
                    {planetName(p)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <MatrixRow
                label={rowLabel("सापेक्ष क्रम", "Relative Rank")}
                planets={ordered}
                value={(p) => digits(String(rankByKey.get(p.key) ?? "—"))}
                bold
              />
              <MatrixRow
                label={rowLabel("स्थान", "Sthana")}
                planets={ordered}
                value={(p) => fmt(p.breakdown.sthana, digits)}
                expandable={hasSubs}
                open={openSthana}
                onToggle={() => setOpenSthana((v) => !v)}
              />
              {openSthana && (
                <Fragment>
                  {STHANA_SUBS.map((row) => (
                    <MatrixRow
                      key={row.key}
                      label={pick(row.ne, row.en)}
                      planets={ordered}
                      value={(p) => fmt(p.sub_balas?.sthana?.[row.key], digits)}
                      sub
                    />
                  ))}
                </Fragment>
              )}
              <MatrixRow
                label={rowLabel("दिशा", "Disha")}
                planets={ordered}
                value={(p) => fmt(p.breakdown.dig, digits)}
              />
              <MatrixRow
                label={rowLabel("काल", "Kala")}
                planets={ordered}
                value={(p) => fmt(p.breakdown.kala, digits)}
                expandable={hasSubs}
                open={openKala}
                onToggle={() => setOpenKala((v) => !v)}
              />
              {openKala && (
                <Fragment>
                  {KALA_SUBS.map((row) => (
                    <MatrixRow
                      key={row.key}
                      label={pick(row.ne, row.en)}
                      planets={ordered}
                      value={(p) =>
                        row.key === "yuddha" && yuddha
                          ? fmt(yuddhaVirupasForPlanet(p, yuddha), digits)
                          : fmt(p.sub_balas?.kala?.[row.key], digits)
                      }
                      sub
                    />
                  ))}
                </Fragment>
              )}
              <MatrixRow
                label={rowLabel("चेष्टा", "Chesta")}
                planets={ordered}
                value={(p) => fmt(p.breakdown.cheshta, digits)}
              />
              <MatrixRow
                label={rowLabel("नैसर्गिक", "Naisargika")}
                planets={ordered}
                value={(p) => fmt(p.breakdown.naisargika, digits)}
              />
              <MatrixRow
                label={rowLabel("दृष्टि", "Drishti")}
                planets={ordered}
                value={(p) => fmt(p.breakdown.drik, digits)}
              />
              <MatrixRow
                label={rowLabel("कुल पिण्ड", "Total Pinda")}
                planets={ordered}
                value={(p) => fmt(p.total_virupas, digits)}
                bold
              />
              <MatrixRow
                label={rowLabel("रूप", "Rupas")}
                planets={ordered}
                value={(p) => fmt(p.rupas, digits)}
              />
              <MatrixRow
                label={rowLabel("न्यूनतम आवश्यक", "Min. Require")}
                planets={ordered}
                value={(p) => fmt(p.required / 60, digits)}
              />
              <MatrixRow
                label={rowLabel("शक्ति अनुपात", "Strength Ratio")}
                planets={ordered}
                value={(p) => fmt(p.ratio, digits, 4)}
                bold
              />
              {bhavaBala && (
                <MatrixRow
                  label={rowLabel("भाव (% मा)", "Bhava (in %)")}
                  planets={ordered}
                  value={(p) => {
                    const pct = bhavaBala.rulershipPercent[p.key];
                    return pct != null ? `${digits(pct.toFixed(1))}%` : "—";
                  }}
                  bold
                />
              )}
              {hasPhala && (
                <Fragment>
                  <MatrixRow
                    label={rowLabel("इष्ट फल", "Ishta Phala")}
                    planets={ordered}
                    value={(p) => fmt(p.ishta_phala, digits)}
                  />
                  <MatrixRow
                    label={rowLabel("कष्ट फल", "Kashta Phala")}
                    planets={ordered}
                    value={(p) => fmt(p.kashta_phala, digits)}
                  />
                </Fragment>
              )}
              <TableRow>
                <TableCell className={cn(td, "sticky left-0 z-10 bg-card pl-3.5 font-semibold text-foreground")}>
                  {pick("स्थिति", "Status")}
                </TableCell>
                {ordered.map((p) => (
                  <TableCell key={p.key} className={cn(td, "text-right")}>
                    <StatusBadge status={p.status} pick={pick} />
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <p className="text-xs mt-2">
          {pick(
            "प्रत्येक बलका विरुप; स्थान र काल विस्तार गर्नुहोस् (काल अन्तर्गत युद्ध)। दुई tara graha १° भित्र हुँदा युद्ध गणना हुन्छ — धेरैजसो कुण्डलीमा ०.०० देखिन्छ किनभने युद्ध दुर्लभ हुन्छ।",
            "Virupas per bala; expand Sthana and Kala for component strengths (Yuddha under Kala). Yuddha is computed when two tara grahas are within 1° — most charts show 0.00 because wars are rare.",
          )}
          {bhavaBala && (
            <>
              {" "}
              {pick(
                "भाव (%) ले प्रत्येक ग्रहले शासन गर्ने भावको औसत शक्ति देखाउँछ; पूर्ण तालिकाका लागि भाव बल हेर्नुहोस्।",
                "Bhava (in %) is the mean house-strength of bhavas ruled by each planet; see the Bhava Bala submenu for the full house table.",
              )}
            </>
          )}
        </p>
        {hasYuddhaActivity && yuddha && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            {pick("ग्रह युद्ध भयो:", "Graha Yuddha detected:")}{" "}
            {yuddha.wars
              .map((w) =>
                pick(
                  `${grahaName(w.winner)} ले ${grahaName(w.loser)} लाई पराजित (${fmt(w.yuddhaVirupas, digits)} virup, ${digits(w.separationDeg.toFixed(2))}° को दूरी)`,
                  `${grahaName(w.winner)} defeats ${grahaName(w.loser)} (${fmt(w.yuddhaVirupas, digits)} virupas, ${w.separationDeg.toFixed(2)}° apart)`,
                ),
              )
              .join("; ")}
            .
          </p>
        )}
      </div>
    </div>
  );
}
