import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Moon, Sparkles } from "lucide-react";
import {
  fetchMonthCalendar,
  fetchGochar,
  panchangaKeys,
  gocharKeys,
  type CalendarDay,
} from "@/lib/api";
import {
  BS_MONTHS_NE,
  BS_MONTH_NAMES,
  BS_SUPPORTED_START_YEAR,
  BS_SUPPORTED_END_YEAR,
  getCurrentBs,
} from "@/lib/bs-calendar";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { PageShell, PageHeader } from "../components/PageShell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { cn } from "@/lib/utils";

const N = toNepaliDigits;

type Phase = "krishna" | "shukla";
type PakshaFilter = Phase | "all";

const RASHI_NE = [
  "मेष", "वृष", "मिथुन", "कर्क", "सिंह", "कन्या",
  "तुला", "वृश्चिक", "धनु", "मकर", "कुम्भ", "मीन",
] as const;

/** South-Indian गोचर square: fixed rāśi cells (1-indexed grid row/col). */
const RASHI_CELL: Record<number, { row: number; col: number }> = {
  12: { row: 1, col: 1 }, 1: { row: 1, col: 2 }, 2: { row: 1, col: 3 }, 3: { row: 1, col: 4 },
  4: { row: 2, col: 4 }, 5: { row: 3, col: 4 }, 6: { row: 4, col: 4 },
  7: { row: 4, col: 3 }, 8: { row: 4, col: 2 }, 9: { row: 4, col: 1 },
  10: { row: 3, col: 1 }, 11: { row: 2, col: 1 },
};

function phaseOf(day: CalendarDay): Phase | undefined {
  if (day.paksha === "shukla" || day.paksha_ne?.includes("शुक्ल")) return "shukla";
  if (day.paksha === "krishna" || day.paksha_ne?.includes("कृष्ण")) return "krishna";
  return undefined;
}

function pakshaShort(day: CalendarDay): string {
  const p = phaseOf(day);
  return p === "shukla" ? "शुक्ल" : p === "krishna" ? "कृष्ण" : "";
}

function fmtAd(dateAd: string): string {
  const d = new Date(`${dateAd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateAd;
  return d.toLocaleDateString("en", { day: "numeric", month: "short" });
}

const KARTAVYA: Record<Phase, string> = {
  krishna:
    "कृष्ण पक्षमा चन्द्रमा क्रमशः क्षीण हुँदै जान्छ। श्राद्ध, तर्पण र पितृकार्य, संयमित आहार, जप र दान शुभ मानिन्छ। एकादशीमा व्रत र अमावस्यामा पितृ-तर्पण गरिन्छ; नयाँ मांगलिक कार्य प्रायः शुक्ल पक्षमा सारिन्छ।",
  shukla:
    "शुक्ल पक्षमा चन्द्रमा क्रमशः वृद्धि हुँदै जान्छ। विवाह, व्रतबन्ध, गृहप्रवेश, यात्रा र नयाँ कार्यारम्भ जस्ता मांगलिक कार्य शुभ मानिन्छन्। एकादशी व्रत र पूर्णिमामा सत्यनारायण पूजा/व्रत गरिन्छ।",
};

const th = "whitespace-nowrap text-xs font-semibold text-muted-foreground";

export function ChandraKranti() {
  const { location, setLocation } = usePanchangaLocation();
  const today = useMemo(() => getCurrentBs(), []);
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);
  const [paksha, setPaksha] = useState<PakshaFilter>("krishna");

  const monthQ = useQuery({
    queryKey: panchangaKeys.month(year, month, location.params),
    queryFn: () => fetchMonthCalendar(year, month, location.params),
    staleTime: 1000 * 60 * 30,
  });

  const allDays = useMemo(() => monthQ.data?.calendar ?? [], [monthQ.data]);
  const days = useMemo(
    () => (paksha === "all" ? allDays : allDays.filter((d) => phaseOf(d) === paksha)),
    [allDays, paksha],
  );

  const gocharDate = days[0]?.date_ad ?? allDays[0]?.date_ad ?? new Date().toISOString().slice(0, 10);
  const gocharQ = useQuery({
    queryKey: gocharKeys.day(gocharDate, "ad", location.params),
    queryFn: () => fetchGochar(gocharDate, "ad", location.params),
    enabled: Boolean(gocharDate),
    staleTime: 1000 * 60 * 30,
  });

  const grahas = useMemo(
    () => Object.entries(gocharQ.data?.gochar ?? {}).map(([key, g]) => ({ key, ...g })),
    [gocharQ.data],
  );

  // planets grouped into their rāśi cell
  const planetsByRashi = useMemo(() => {
    const out: Record<number, string[]> = {};
    for (const g of grahas) {
      const idx = RASHI_NE.findIndex((r) => g.rashi?.includes(r));
      if (idx < 0) continue;
      const num = idx + 1;
      (out[num] ??= []).push(g.symbol || g.name_ne?.slice(0, 2) || g.key.slice(0, 2));
    }
    return out;
  }, [grahas]);

  const festivals = useMemo(() => {
    const seen = new Set<string>();
    const list: { day: number; name: string }[] = [];
    for (const d of days) {
      for (const f of d.festivals ?? []) {
        if (!f || seen.has(f)) continue;
        seen.add(f);
        list.push({ day: d.day, name: f });
      }
    }
    return list;
  }, [days]);

  const monthLabel = `${BS_MONTHS_NE[month - 1]} (${BS_MONTH_NAMES[month - 1]})`;
  const pakshaLabel = paksha === "krishna" ? "कृष्णपक्ष" : paksha === "shukla" ? "शुक्लपक्ष" : "पूरा महिना";

  return (
    <PageShell>
      <PageHeader
        icon={<Moon className="h-7 w-7 text-secondary" />}
        title="चन्द्र क्रान्ति"
        subtitle="पक्ष अनुसार दैनिक पञ्चाङ्ग — तिथि, नक्षत्र, योग, करण, सूर्योदय/अस्त, पर्व र ग्रह गोचर।"
      />

      {/* controls */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          वर्ष (बि.सं.)
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          >
            {Array.from({ length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 }, (_, i) => BS_SUPPORTED_START_YEAR + i).map((y) => (
              <option key={y} value={y}>{N(y)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          महिना
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          >
            {BS_MONTHS_NE.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          पक्ष
          <div className="inline-flex overflow-hidden rounded-md border border-border">
            {([["krishna", "कृष्ण"], ["shukla", "शुक्ल"], ["all", "पूरै"]] as const).map(([v, lbl]) => (
              <button
                key={v}
                type="button"
                onClick={() => setPaksha(v)}
                className={cn(
                  "px-3 py-1.5 text-sm transition-colors",
                  paksha === v ? "bg-secondary text-primary" : "bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          स्थान
          <LocationSelector location={location} onLocationChange={setLocation} />
        </div>
      </div>

      <h2 className="text-lg font-bold text-foreground">
        {monthLabel} · {pakshaLabel}
        {monthQ.data?.year_bs ? <span className="ml-2 font-normal text-muted-foreground">{N(monthQ.data.year_bs)} बि.सं.</span> : null}
      </h2>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* daily table */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className={th}>गते · ता.</TableHead>
                <TableHead className={th}>बा.</TableHead>
                <TableHead className={th}>तिथि</TableHead>
                <TableHead className={th}>नक्षत्र</TableHead>
                <TableHead className={th}>योग</TableHead>
                <TableHead className={th}>करण</TableHead>
                <TableHead className={th}>सु.उ.</TableHead>
                <TableHead className={th}>सु.अ.</TableHead>
                <TableHead className={th}>पर्व</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthQ.isLoading ? (
                <TableRow><TableCell colSpan={9} className="py-8 text-center text-muted-foreground">लोड हुँदैछ…</TableCell></TableRow>
              ) : days.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="py-8 text-center text-muted-foreground">यो पक्षमा कुनै दिन भेटिएन।</TableCell></TableRow>
              ) : (
                days.map((d) => (
                  <TableRow key={d.date_ad}>
                    <TableCell className="whitespace-nowrap">
                      <span className="font-semibold text-foreground">{N(d.day)}</span>
                      <span className="ml-1.5 text-xs text-muted-foreground">{fmtAd(d.date_ad)}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{d.weekday_ne ?? d.weekday}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="text-muted-foreground">{pakshaShort(d)}</span> {d.tithi_ne ?? d.tithi ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{d.nakshatra_ne ?? d.nakshatra ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">{d.yoga_ne ?? d.yoga ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">{d.karana_ne ?? d.karana ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-amber-600 dark:text-amber-400">{d.sunrise ? N(d.sunrise) : "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-indigo-600 dark:text-indigo-400">{d.sunset ? N(d.sunset) : "—"}</TableCell>
                    <TableCell className="max-w-48">
                      {d.festivals?.length ? (
                        <span className="line-clamp-2 text-xs text-rose-600 dark:text-rose-300">{d.festivals.join(" · ")}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* sidebar */}
        <aside className="space-y-5">
          {/* gochar kundali */}
          <div className="rounded-xl border border-border p-4">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-secondary" /> गोचर कुण्डली
            </h3>
            <div className="grid aspect-square w-full grid-cols-4 grid-rows-4 gap-px rounded-lg bg-border text-center">
              {RASHI_NE.map((rne, idx) => {
                const num = idx + 1;
                const pos = RASHI_CELL[num]!;
                const planets = planetsByRashi[num] ?? [];
                return (
                  <div
                    key={rne}
                    style={{ gridRow: pos.row, gridColumn: pos.col }}
                    className="flex flex-col items-center justify-center bg-card p-1"
                  >
                    <span className="text-[9px] leading-none text-muted-foreground">{rne}</span>
                    <span className="mt-0.5 text-[11px] font-semibold leading-tight text-secondary">
                      {planets.join(" ")}
                    </span>
                  </div>
                );
              })}
              <div
                style={{ gridRow: "2 / 4", gridColumn: "2 / 4" }}
                className="flex items-center justify-center bg-card text-xs font-medium text-muted-foreground"
              >
                गोचर
              </div>
            </div>
            {gocharQ.data?.date_ad ? (
              <p className="mt-2 text-center text-[11px] text-muted-foreground">{fmtAd(gocharQ.data.date_ad)} को स्थिति</p>
            ) : null}
          </div>

          {/* graha gochar / udayast */}
          <div className="rounded-xl border border-border p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">ग्रह गोचर र अर्को सङ्क्रान्ति</h3>
            {grahas.length === 0 ? (
              <p className="text-sm text-muted-foreground">{gocharQ.isLoading ? "लोड हुँदैछ…" : "विवरण उपलब्ध छैन।"}</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {grahas.map((g) => (
                  <li key={g.key} className="flex items-baseline justify-between gap-2">
                    <span className="text-foreground">
                      <span className="mr-1 text-secondary">{g.symbol}</span>
                      {g.name_ne}
                      <span className="ml-1 text-muted-foreground">{g.rashi ?? ""}</span>
                    </span>
                    {g.next_rashi_entry ? (
                      <span className="shrink-0 text-right text-[11px] text-muted-foreground">
                        → {g.next_rashi_entry.to_rashi}
                        <br />
                        {N(g.next_rashi_entry.entry_time_local)}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* festivals */}
          <div className="rounded-xl border border-border p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">पर्व र चाडबाड</h3>
            {festivals.length === 0 ? (
              <p className="text-sm text-muted-foreground">यो पक्षमा उल्लेख्य पर्व छैन।</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {festivals.map((f) => (
                  <li key={`${f.day}-${f.name}`} className="flex gap-2">
                    <span className="shrink-0 font-semibold text-secondary">{N(f.day)}</span>
                    <span className="text-foreground">{f.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* kartavya */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              {pakshaLabel} कर्तव्य
            </h3>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              {paksha === "all" ? (
                <>
                  <p>{KARTAVYA.krishna}</p>
                  <p>{KARTAVYA.shukla}</p>
                </>
              ) : (
                <p>{KARTAVYA[paksha]}</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

export default ChandraKranti;
