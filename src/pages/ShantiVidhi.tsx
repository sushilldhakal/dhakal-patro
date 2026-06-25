import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Flame,
  Gem,
  Sparkles,
  HandCoins,
  TreePine,
  CalendarDays,
  UserSearch,
  ArrowDownToLine,
} from "lucide-react";
import { PageShell, PageHeader } from "../components/PageShell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toNepaliDigits } from "@/lib/panchanga-format";
import {
  fetchVimshottari,
  fetchShadbala,
  vimshottariKeys,
  shadbalaKeys,
} from "@/lib/api";
import { buildAtTimeDatetime } from "@/lib/ephemeris-adapters";
import { KundaliControls } from "@/components/kundali/KundaliControls";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { defaultClockForTimezone } from "@/components/panchanga/use-panchanga-mode";
import { NAVAGRAHA_SHANTI, getGrahaShanti } from "@/lib/shanti/navagraha-shanti";

const N = toNepaliDigits;
const th = "whitespace-nowrap text-xs font-semibold text-muted-foreground";

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

function toAdStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
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
  const graha = grahaKey ? getGrahaShanti(grahaKey) : undefined;
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{heading}</div>
      {graha ? (
        <>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xl" style={{ color: graha.colorHex }}>{graha.symbol}</span>
            <span className="text-lg font-bold text-foreground">{graha.nameNe}</span>
          </div>
          {detailNe ? <p className="mt-0.5 text-xs text-muted-foreground">{detailNe}</p> : null}
          <button
            type="button"
            onClick={() => onSelect(graha.key)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-secondary/10 px-3 py-1.5 text-sm font-medium text-secondary transition-colors hover:bg-secondary/20"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" /> {graha.nameNe} शान्ति हेर्नुहोस्
          </button>
        </>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">—</p>
      )}
    </div>
  );
}

export function ShantiVidhi() {
  const { location, setLocation } = usePanchangaLocation();
  const [date, setDate] = useState(() => new Date());
  const [era, setEra] = useState<"bs" | "ad">("ad");
  const timezone = location.params.timezone ?? "Asia/Kathmandu";
  const [clock, setClock] = useState(() => defaultClockForTimezone(timezone));

  const [selectedKey, setSelectedKey] = useState("saturn");
  const [nowMs] = useState(() => Date.now());
  const detailRef = useRef<HTMLDivElement>(null);
  const graha = useMemo(() => getGrahaShanti(selectedKey) ?? NAVAGRAHA_SHANTI[0], [selectedKey]);

  const adDateStr = toAdStr(date);
  const atTimeDatetime = buildAtTimeDatetime(adDateStr, clock);

  const vimshottariQ = useQuery({
    queryKey: vimshottariKeys.atTime(atTimeDatetime, location.params),
    queryFn: () => fetchVimshottari(atTimeDatetime, location.params),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(atTimeDatetime),
  });

  const shadbalaQ = useQuery({
    queryKey: shadbalaKeys.atTime(atTimeDatetime, location.params),
    queryFn: () => fetchShadbala(atTimeDatetime, location.params),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(atTimeDatetime),
  });

  // current Mahadasha lord = the sequence period containing "now"
  const currentDasha = useMemo(() => {
    const seq = vimshottariQ.data?.sequence ?? [];
    const period = seq.find((p) => {
      const s = new Date(p.start).getTime();
      const e = new Date(p.end).getTime();
      return Number.isFinite(s) && Number.isFinite(e) && s <= nowMs && nowMs < e;
    });
    const fallbackLord = vimshottariQ.data?.mahadasha_lord;
    const key = lordToKey(period?.lord ?? fallbackLord);
    return { key, period };
  }, [vimshottariQ.data, nowMs]);

  const weakest = shadbalaQ.data?.summary.weakest;
  const weakestKey = lordToKey(weakest?.key) ?? weakest?.key;

  const isCalcLoading = vimshottariQ.isLoading || shadbalaQ.isLoading;
  const isCalcError = vimshottariQ.isError && shadbalaQ.isError;

  const selectAndScroll = (key: string) => {
    setSelectedKey(key);
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <PageShell>
      <PageHeader
        icon={<Flame className="h-7 w-7 text-secondary" />}
        title="शान्ति विधि"
        subtitle="नवग्रह शान्ति — जन्म विवरणबाट पीडित ग्रह पत्ता लगाउनुहोस् वा ग्रह छानेर बीज मन्त्र, समिधा, रत्न र दान हेर्नुहोस्।"
      />

      {/* ── व्यक्तिगत गणना (birth-details → afflicted graha) ───────────────── */}
      <section className="rounded-2xl border border-border">
        <header className="flex items-center gap-1.5 border-b border-border px-4 py-3">
          <UserSearch className="h-4 w-4 text-secondary" />
          <h2 className="text-sm font-semibold text-foreground">जन्म विवरणबाट गणना</h2>
          <span className="ml-auto text-[11px] text-muted-foreground">मिति · समय · स्थान</span>
        </header>

        <div className="space-y-4 p-4">
          <KundaliControls
            date={date}
            onDateChange={setDate}
            era={era}
            onEraChange={setEra}
            clock={clock}
            onClockChange={setClock}
            location={location}
            onLocationChange={setLocation}
          />

          {isCalcError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              गणना ल्याउन सकिएन। मिति/समय/स्थान जाँचेर पुनः प्रयास गर्नुहोस्।
            </div>
          ) : isCalcLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-28 animate-pulse rounded-xl bg-muted/50" />
              <div className="h-28 animate-pulse rounded-xl bg-muted/50" />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <RecommendationCard
                heading="वर्तमान महादशा (विंशोत्तरी)"
                grahaKey={currentDasha.key}
                detailNe={
                  currentDasha.period
                    ? `${currentDasha.period.lord_ne} महादशा चलिरहेको — यसको शान्ति उपयुक्त।`
                    : vimshottariQ.data?.mahadasha_lord_ne
                      ? `${vimshottariQ.data.mahadasha_lord_ne} महादशा (जन्मकालीन)।`
                      : undefined
                }
                onSelect={selectAndScroll}
              />
              <RecommendationCard
                heading="सबैभन्दा बलहीन ग्रह (षड्बल)"
                grahaKey={weakestKey}
                detailNe={
                  weakest
                    ? `${weakest.name_ne}: बल ${(weakest.ratio * 100).toFixed(0)}% (${weakest.status}) — बल बढाउन शान्ति गर्नुहोस्।`
                    : undefined
                }
                onSelect={selectAndScroll}
              />
            </div>
          )}
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            गणना जन्म समयको ग्रहस्थिति (विंशोत्तरी महादशा) र ग्रह बल (षड्बल) मा आधारित छ। यो सामान्य मार्गदर्शन
            हो — विधिवत् उपायका लागि योग्य ज्योतिषीसँग परामर्श गर्नुहोस्।
          </p>
        </div>
      </section>

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
              <span className="text-xl leading-none" style={{ color: active ? undefined : g.colorHex }}>
                {g.symbol}
              </span>
              <span className="text-xs font-semibold">{g.nameNe}</span>
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
            className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl text-white shadow"
            style={{ backgroundColor: graha.colorHex }}
          >
            {graha.symbol}
          </span>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">{graha.nameNe} शान्ति</h2>
            <p className="text-xs text-muted-foreground">{graha.nameEn}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" /> {graha.vaaraNe}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: graha.colorHex }} />
              {graha.colorNe}
            </span>
          </div>
        </header>

        <div className="space-y-5 p-5">
          {/* mantra + japa */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">बीज मन्त्र</div>
            <p className="text-lg font-semibold leading-relaxed text-foreground">{graha.beejMantra}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              जप संख्या: <span className="font-semibold text-foreground">{N(graha.japa)}</span> पटक
            </p>
          </div>

          {/* tiles */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoTile icon={<TreePine className="h-4 w-4" />} label="समिधा (हवन काठ)" value={<>{graha.samidhaNe} <span className="font-normal text-muted-foreground">· {graha.samidhaEn}</span></>} />
            <InfoTile icon={<Gem className="h-4 w-4" />} label="रत्न" value={<>{graha.gemNe} <span className="font-normal text-muted-foreground">· {graha.gemEn}</span></>} />
            <InfoTile icon={<Sparkles className="h-4 w-4" />} label="धातु" value={graha.metalNe} />
            <InfoTile icon={<Flame className="h-4 w-4" />} label="अधिदेवता" value={graha.adhidevataNe} />
          </div>

          {/* daan */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <HandCoins className="h-4 w-4 text-secondary" /> दान सामग्री
            </div>
            <div className="flex flex-wrap gap-2">
              {graha.daan.map((item) => (
                <span key={item} className="rounded-full border border-border bg-card/40 px-3 py-1 text-sm text-foreground">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <p className="rounded-lg border border-border bg-card/30 p-3 text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">उपयोग:</span> {graha.remedyNe}
          </p>
        </div>
      </section>

      {/* full reference table */}
      <div>
        <h3 className="mb-3 text-base font-bold text-foreground">नवग्रह शान्ति तालिका</h3>
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className={th}>ग्रह</TableHead>
                <TableHead className={th}>बार</TableHead>
                <TableHead className={th}>बीज मन्त्र</TableHead>
                <TableHead className={th}>जप</TableHead>
                <TableHead className={th}>समिधा</TableHead>
                <TableHead className={th}>रत्न</TableHead>
                <TableHead className={th}>धातु</TableHead>
                <TableHead className={th}>दान</TableHead>
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
                    <span className="mr-1.5" style={{ color: g.colorHex }}>{g.symbol}</span>
                    {g.nameNe}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{g.vaaraNe}</TableCell>
                  <TableCell className="whitespace-nowrap">{g.beejMantra}</TableCell>
                  <TableCell className="whitespace-nowrap">{N(g.japa)}</TableCell>
                  <TableCell className="whitespace-nowrap">{g.samidhaNe}</TableCell>
                  <TableCell className="whitespace-nowrap">{g.gemNe}</TableCell>
                  <TableCell className="whitespace-nowrap">{g.metalNe}</TableCell>
                  <TableCell className="max-w-56">
                    <span className="text-xs text-muted-foreground">{g.daan.join(", ")}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          सूचना: माथिका विवरण शास्त्रीय नवग्रह शान्ति परम्परामा आधारित छन्। रत्नधारण वा विधिवत् हवन गर्नुअघि योग्य
          ज्योतिषी/पुरोहितसँग परामर्श गर्नुहोस्।
        </p>
      </div>
    </PageShell>
  );
}

export default ShantiVidhi;
