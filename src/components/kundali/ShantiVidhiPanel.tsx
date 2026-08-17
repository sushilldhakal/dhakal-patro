import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Flame,
  Gem,
  Sparkles,
  HandCoins,
  TreePine,
  CalendarDays,
  ArrowDownToLine,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ShadbalaResponse, VimshottariResponse } from "@/lib/api";
import { NAVAGRAHA_SHANTI, getGrahaShanti } from "@/lib/shanti/navagraha-shanti";
import { useLocale, bilingualText, bilingualNode } from "@/i18n/locale";
import { GrahaPlanetIcon } from "@/components/graha/GrahaPlanetIcon";
import type { GrahaKey } from "@/lib/graha-details";

const th = "whitespace-nowrap text-xs font-semibold";

const SHADBALA_STATUS_NE: Record<string, string> = {
  Exceptional: "उत्कृष्ट",
  Strong: "बलियो",
  Adequate: "पर्याप्त",
  Borderline: "सीमान्त",
  Weak: "कमजोर",
};

/** Graha name (English / Vedic) → NAVAGRAHA_SHANTI key. */
const LORD_KEY: Record<string, string> = {
  sun: "sun", surya: "sun",
  moon: "moon", chandra: "moon",
  mars: "mars", mangal: "mars", mangala: "mars", kuja: "mars",
  mercury: "mercury", budha: "mercury", budh: "mercury",
  jupiter: "jupiter", guru: "jupiter", brihaspati: "jupiter",
  venus: "venus", shukra: "venus", sukra: "venus",
  saturn: "saturn", shani: "saturn", sani: "saturn",
  rahu: "rahu",
  ketu: "ketu",
};

function lordToKey(name?: string): string | undefined {
  if (!name) return undefined;
  return LORD_KEY[name.toLowerCase().replace(/[^a-z]/g, "")];
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-border bg-card/40 p-3">
      <div className="mt-0.5 text-secondary">{icon}</div>
      <div className="min-w-0">
        <div className="text-sm text-base uppercase tracking-wide">{label}</div>
        <div className="text-sm font-semibold text-foreground">{value}</div>
      </div>
    </div>
  );
}

function RecommendationCard({
  heading,
  grahaKey,
  detailNe,
  onSelect,
}: {
  heading: string;
  grahaKey?: string;
  detailNe?: string;
  onSelect: (key: string) => void;
}) {
  const { lang } = useLocale();
  const graha = grahaKey ? getGrahaShanti(grahaKey) : undefined;
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="text-sm text-base uppercase tracking-wide">{heading}</div>
      {graha ? (
        <>
          <div className="mt-1 flex items-center gap-2">
            <GrahaPlanetIcon graha={graha.key as GrahaKey} size={28} />
            <span className="text-lg font-bold text-foreground">{bilingualText(lang, graha.nameNe, graha.nameEn)}</span>
          </div>
          {detailNe ? <p className="mt-0.5 text-xs">{detailNe}</p> : null}
          <button
            type="button"
            onClick={() => onSelect(graha.key)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-secondary/10 px-3 py-1.5 text-sm text-base text-secondary transition-colors hover:bg-secondary/20"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" /> {bilingualText(lang, `${graha.nameNe} शान्ति हेर्नुहोस्`, `View ${graha.nameEn} shanti`)}
          </button>
        </>
      ) : (
        <p className="mt-1 text-sm">—</p>
      )}
    </div>
  );
}

/**
 * Navagraha Shanti recommendations + reference, driven by an already-computed
 * Vimshottari dasha and Shadbala for a chart. Used standalone (ShantiVidhi page)
 * and embedded in each kundali (KundaliView). No data fetching of its own.
 */
export function ShantiVidhiPanel({
  vimshottari,
  shadbala,
  isError = false,
}: {
  vimshottari?: VimshottariResponse;
  shadbala?: ShadbalaResponse;
  isError?: boolean;
}) {
  const { t } = useTranslation();
  const { lang, digits } = useLocale();
  const [selectedKey, setSelectedKey] = useState("saturn");
  const [nowMs] = useState(() => Date.now());
  const detailRef = useRef<HTMLDivElement>(null);
  const graha = useMemo(() => getGrahaShanti(selectedKey) ?? NAVAGRAHA_SHANTI[0], [selectedKey]);

  // current Mahadasha lord = the sequence period containing "now"
  const currentDasha = useMemo(() => {
    const seq = vimshottari?.sequence ?? [];
    const period = seq.find((p) => {
      const s = new Date(p.start).getTime();
      const e = new Date(p.end).getTime();
      return Number.isFinite(s) && Number.isFinite(e) && s <= nowMs && nowMs < e;
    });
    const fallbackLord = vimshottari?.mahadasha_lord;
    const key = lordToKey(period?.lord ?? fallbackLord);
    return { key, period };
  }, [vimshottari, nowMs]);

  const weakest = shadbala?.summary.weakest;
  const weakestKey = lordToKey(weakest?.key) ?? weakest?.key;

  const selectAndScroll = (key: string) => {
    setSelectedKey(key);
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <div className="space-y-4">
      {/* recommendations from this chart */}
      {isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {t("kundali.x.shanti_load_error")}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <RecommendationCard
            heading={t("kundali.x.shanti_current_mahadasha")}
            grahaKey={currentDasha.key}
            detailNe={
              currentDasha.period
                ? bilingualText(lang, 
                    `${currentDasha.period.lord_ne} महादशा चलिरहेको — यसको शान्ति उपयुक्त।`,
                    `${currentDasha.period.lord} Mahadasha is running — its shanti is suitable.`,
                  )
                : vimshottari?.mahadasha_lord_ne
                  ? bilingualText(lang, 
                      `${vimshottari.mahadasha_lord_ne} महादशा (जन्मकालीन)।`,
                      `${vimshottari.mahadasha_lord ?? vimshottari.mahadasha_lord_ne} Mahadasha (at birth).`,
                    )
                  : undefined
            }
            onSelect={selectAndScroll}
          />
          <RecommendationCard
            heading={t("kundali.x.shanti_weakest_planet")}
            grahaKey={weakestKey}
            detailNe={
              weakest
                ? bilingualText(lang, 
                    `${weakest.name_ne}: बल ${(weakest.ratio * 100).toFixed(0)}% (${SHADBALA_STATUS_NE[weakest.status] ?? weakest.status}) — बल बढाउन शान्ति गर्नुहोस्।`,
                    `${weakest.name ?? weakest.name_ne}: strength ${(weakest.ratio * 100).toFixed(0)}% (${weakest.status}) — do shanti to strengthen it.`,
                  )
                : undefined
            }
            onSelect={selectAndScroll}
          />
        </div>
      )}
      <p className="text-sm leading-relaxed">
        {t("kundali.x.shanti_basis_note")}
      </p>

      {/* graha selector */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {NAVAGRAHA_SHANTI.map((g) => {
          const active = g.key === selectedKey;
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => setSelectedKey(g.key)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border p-3 transition-colors",
                active
                  ? "border-secondary bg-secondary/10 text-secondary"
                  : "border-border bg-card/30 text-foreground hover:bg-muted",
              )}
            >
              <GrahaPlanetIcon graha={g.key as GrahaKey} size={28} />
              <span className="text-xs font-semibold">{bilingualText(lang, g.nameNe, g.nameEn)}</span>
            </button>
          );
        })}
      </div>

      {/* selected graha detail */}
      <section ref={detailRef} className="scroll-mt-20 overflow-hidden rounded-2xl border border-border">
        <header
          className="flex flex-wrap items-center gap-3 border-b border-border p-5"
          style={{ background: `linear-gradient(90deg, ${graha.colorHex}1f, transparent)` }}
        >
          <span
            className="flex w-1.5 self-stretch rounded-full shadow"
            style={{ backgroundColor: graha.colorHex }}
            aria-hidden
          />
          <GrahaPlanetIcon graha={graha.key as GrahaKey} size={40} className="shrink-0" />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">{bilingualText(lang, `${graha.nameNe} शान्ति`, `${graha.nameEn} Shanti`)}</h2>
            <p className="text-xs">{bilingualText(lang, graha.nameEn, graha.nameNe)}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1">
              <CalendarDays className="h-3.5 w-3.5" /> {bilingualText(lang, graha.vaaraNe, graha.vaaraEn)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: graha.colorHex }} />
              {bilingualText(lang, graha.colorNe, graha.colorEn)}
            </span>
          </div>
        </header>

        <div className="space-y-5 p-5">
          {/* mantra + japa */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="mb-1 text-sm text-base uppercase tracking-wide">{t("kundali.x.shanti_beeja_mantra_heading")}</div>
            <p className="text-lg font-semibold leading-relaxed text-foreground">{graha.beejMantra}</p>
            <p className="mt-1.5 text-sm">
              {bilingualNode(lang, <>जप संख्या: <span className="font-semibold text-foreground">{digits(graha.japa)}</span> पटक</>,
                <>Japa count: <span className="font-semibold text-foreground">{digits(graha.japa)}</span> times</>,
              )}
            </p>
          </div>

          {/* tiles */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoTile icon={<TreePine className="h-4 w-4" />} label={t("kundali.x.shanti_samidha_heading")} value={bilingualText(lang, graha.samidhaNe, graha.samidhaEn)} />
            <InfoTile icon={<Gem className="h-4 w-4" />} label={t("kundali.x.shanti_gem")} value={bilingualText(lang, graha.gemNe, graha.gemEn)} />
            <InfoTile icon={<Sparkles className="h-4 w-4" />} label={t("kundali.x.shanti_metal")} value={bilingualText(lang, graha.metalNe, graha.metalEn)} />
            <InfoTile icon={<Flame className="h-4 w-4" />} label={t("kundali.x.shanti_deity")} value={bilingualText(lang, graha.adhidevataNe, graha.adhidevataEn)} />
          </div>

          {/* daan */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <HandCoins className="h-4 w-4 text-secondary" /> {t("kundali.x.shanti_donation_items")}
            </div>
            <div className="flex flex-wrap gap-2">
              {(lang === "en" ? graha.daanEn ?? graha.daan : graha.daan).map((item, idx) => (
                <span key={`${item}-${idx}`} className="rounded-full border border-border bg-card/40 px-3 py-1 text-sm text-foreground">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <p className="rounded-lg border border-border bg-card/30 p-3 text-sm leading-relaxed">
            <span className="font-semibold text-foreground">{t("kundali.x.shanti_use_label")}</span> {bilingualText(lang, graha.remedyNe, graha.remedyEn)}
          </p>
        </div>
      </section>

      {/* full reference table */}
      <div>
        <h3 className="mb-3 text-base font-bold text-foreground">{t("kundali.x.shanti_reference_table")}</h3>
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className={th}>{t("learn.playground.planet")}</TableHead>
                <TableHead className={th}>{t("kundali.day")}</TableHead>
                <TableHead className={th}>{t("kundali.x.shanti_beeja_mantra_column")}</TableHead>
                <TableHead className={th}>{t("kundali.x.shanti_japa_column")}</TableHead>
                <TableHead className={th}>{t("kundali.x.shanti_samidha_column")}</TableHead>
                <TableHead className={th}>{t("kundali.x.shanti_gem")}</TableHead>
                <TableHead className={th}>{t("kundali.x.shanti_metal")}</TableHead>
                <TableHead className={th}>{t("kundali.x.shanti_daan_column")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {NAVAGRAHA_SHANTI.map((g) => (
                <TableRow
                  key={g.key}
                  className={cn("cursor-pointer", g.key === selectedKey && "bg-secondary/10 hover:bg-secondary/15")}
                  onClick={() => setSelectedKey(g.key)}
                >
                  <TableCell className="whitespace-nowrap font-semibold text-foreground">
                    <span className="inline-flex items-center gap-2">
                      <GrahaPlanetIcon graha={g.key as GrahaKey} size={22} />
                      {bilingualText(lang, g.nameNe, g.nameEn)}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{bilingualText(lang, g.vaaraNe, g.vaaraEn)}</TableCell>
                  <TableCell className="whitespace-nowrap">{g.beejMantra}</TableCell>
                  <TableCell className="whitespace-nowrap">{digits(g.japa)}</TableCell>
                  <TableCell className="whitespace-nowrap">{bilingualText(lang, g.samidhaNe, g.samidhaEn)}</TableCell>
                  <TableCell className="whitespace-nowrap">{bilingualText(lang, g.gemNe, g.gemEn)}</TableCell>
                  <TableCell className="whitespace-nowrap">{bilingualText(lang, g.metalNe, g.metalEn)}</TableCell>
                  <TableCell className="max-w-56">
                    <span className="text-xs">{bilingualText(lang, Array.isArray(g.daan) ? g.daan.join(", ") : g.daan, Array.isArray(g.daanEn) ? g.daanEn.join(", ") : g.daanEn)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="mt-2 text-sm leading-relaxed">
          {t("kundali.x.shanti_disclaimer")}
        </p>
      </div>
    </div>
  );
}

export default ShantiVidhiPanel;
