import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { GrahaBanner } from "@/components/graha/GrahaPageParts";
import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import { patroCard } from "@/lib/patro-classes";
import { adToBS, bsToAD, formatBsAdStamp, getBSMonthLength } from "@/lib/bs-calendar";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { PanchangaBrowseHeader } from "@/components/panchanga/PanchangaBrowseHeader";
import { defaultClockForTimezone } from "@/components/panchanga/use-panchanga-mode";
import { NavataraBalamCardGrid } from "@/components/panchanga/NavataraBalamCardGrid";
import { useRouteLoading } from "@/lib/route-loading";
import { ELEMENT_BY_ID } from "@/lib/panchanga-elements";
import { ELEMENT_DESCRIPTIONS } from "@/lib/panchanga-element-descriptions";
import { getChandraBalamCards, getTaraBalamCards } from "@/lib/balam-cards";
import { formatRashiDisplay, getChandrabalamTable, getTarabalaTable } from "@/lib/panchanga-format";
import { todayAdStringInTimezone, resolveTimeZone } from "@/lib/zoned-time";
import {
  elementKeys,
  fetchElementDay,
  fetchElementSpans,
  fetchPanchanga,
  panchangaKeys,
  type ElementSpan,
  type ElementStamp,
  type PanchangaDay,
} from "@/lib/api";

function toAdStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function clockFromGhati(sunriseMin: number | null, g: number): string | null {
  if (sunriseMin == null) return null;
  const total = sunriseMin + g * 24;
  let h = Math.floor(total / 60);
  const m = Math.round(total % 60);
  if (h >= 24) h -= 24;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseHHMM(s?: string | null): number | null {
  if (!s) return null;
  const m = s.match(/(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/* ── span (begin→end) view ─────────────────────────────────────────────── */

function SpanBoundary({
  label,
  stamp,
  tone,
  timeZone,
}: {
  label: string;
  stamp: ElementStamp;
  tone: "begin" | "end";
  timeZone?: string;
}) {
  const { digits, lang } = useLocale();
  const { weekday, bsMonthDay, adShort } = formatBsAdStamp(stamp.iso, {
    lang,
    timeZone,
    digits,
  });
  const shell =
    tone === "begin"
      ? "rounded-md bg-success/10 px-2 py-1.5"
      : "rounded-md bg-danger/10 px-2 py-1.5";
  const labelCls = tone === "begin" ? "font-semibold text-success" : "font-semibold text-danger";

  return (
    <div className={cn("flex flex-col gap-0.5", shell)}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className={labelCls}>{label}</span>
        <span className="font-num tabular-nums text-foreground">{digits(stamp.time_label)}</span>
      </div>
      <p className="m-0 font-num text-sm font-semibold leading-snug text-foreground md:text-base">
        <span>
          {weekday} {bsMonthDay}
        </span>
        <span className="text-base text-muted-foreground"> · {adShort}</span>
      </p>
    </div>
  );
}

function SpanList({ spans, timeZone }: { spans: ElementSpan[]; timeZone?: string }) {
  const { pick } = useLocale();
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {spans.map((s, i) => (
        <div key={`${s.name}-${i}`} className={cn(patroCard, "flex flex-col gap-2 p-3")}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-base font-bold text-foreground">{pick(s.name_ne, s.name)}</span>
            {s.paksha ? (
              <span className="text-xs text-base">
                {pick(s.paksha === "shukla" ? "शुक्ल" : "कृष्ण", s.paksha)}
              </span>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <SpanBoundary
              label={pick("आरम्भ", "Begins")}
              stamp={s.begins}
              tone="begin"
              timeZone={timeZone}
            />
            <SpanBoundary
              label={pick("अन्त्य", "Ends")}
              stamp={s.ends}
              tone="end"
              timeZone={timeZone}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── table (per-day) view — generic renderer ───────────────────────────── */

type AnyRow = Record<string, unknown>;

function toneClass(good: boolean, bad: boolean): string {
  if (bad) return "bg-danger/10 text-danger";
  if (good) return "bg-success/12 text-success-foreground dark:text-success";
  return "bg-foreground/4 text-foreground";
}

function TableView({ data, sunrise }: { data: unknown; sunrise?: string }) {
  const { pick, digits } = useLocale();
  const sunriseMin = parseHHMM(sunrise);

  // Object with a `rows` array → moon/star strength table (chandrabala/tarabala).
  if (data && typeof data === "object" && Array.isArray((data as AnyRow).rows)) {
    const obj = data as AnyRow;
    const rows = obj.rows as AnyRow[];
    const anchor = pick(
      String(obj.moon_label ?? obj.label_ne ?? ""),
      String(obj.moon_label_en ?? obj.label_en ?? ""),
    );
    return (
      <div className="flex flex-col gap-2">
        {anchor ? (
          <p className="text-sm text-base">
            {pick("चन्द्र राशि", "Moon sign")}: <span className="font-bold text-foreground">{anchor}</span>
          </p>
        ) : null}
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((r, i) => {
            const good = r.tone === "good" || r.quality === "शुभ";
            const bad = r.tone === "bad" || r.quality === "अशुभ";
            return (
              <div
                key={i}
                className={cn("flex items-center justify-between rounded-lg px-3 py-1.5 text-sm", toneClass(good, bad))}
              >
                <span className="font-semibold">{pick(String(r.name ?? ""), String(r.name_en ?? r.name ?? ""))}</span>
                <span className="text-sm opacity-90">
                  {pick(String(r.tara ?? ""), String(r.tara ?? ""))}
                  {r.quality ? ` · ${pick(String(r.quality), String(r.quality))}` : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Array of time segments (choghadiya / hora / lagna / panchaka / pushkara).
  if (Array.isArray(data)) {
    const rows = data as AnyRow[];
    if (rows.length === 0) {
      return <p className="text-sm">{pick("यस दिनका लागि विवरण छैन।", "No entries for this day.")}</p>;
    }
    return (
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((it, i) => {
          const label = pick(
            String(it.name_ne ?? it.planet_ne ?? it.lagna_ne ?? it.name ?? it.lagna ?? "—"),
            String(it.name ?? it.planet_en ?? it.lagna ?? it.name_ne ?? "—"),
          );
          let time: string | null = null;
          if (it.start_local_time_short) {
            time = `${digits(String(it.start_local_time_short))}–${digits(String(it.end_local_time_short ?? ""))}`;
          } else if (typeof it.start_g === "number") {
            const a = clockFromGhati(sunriseMin, it.start_g as number);
            const b = clockFromGhati(sunriseMin, it.end_g as number);
            if (a && b) time = `${digits(a)}–${digits(b)}`;
          }
          const bad = it.bad === true || it.good === false;
          const good = it.good === true || it.tone === "good";
          const hasPushkara = Array.isArray(it.pushkara_navamsha) && (it.pushkara_navamsha as unknown[]).length > 0;
          return (
            <div
              key={i}
              className={cn("flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm", toneClass(good, bad))}
            >
              <span className="flex items-center gap-1.5 font-semibold">
                {label}
                {hasPushkara ? (
                  <span className="rounded-full bg-secondary/20 px-1.5 py-px text-sm font-bold text-secondary dark:text-accent">
                    {pick("पुष्कर", "Pushkara")}
                  </span>
                ) : null}
              </span>
              {time ? <span className="font-num tabular-nums text-sm opacity-90">{time}</span> : null}
            </div>
          );
        })}
      </div>
    );
  }

  return <p className="text-sm">{pick("विवरण उपलब्ध छैन।", "No data available.")}</p>;
}

function NavataraBalamElementView({
  elementId,
  p,
  clock,
}: {
  elementId: "chandrabala" | "tarabala";
  p: PanchangaDay;
  clock?: string;
}) {
  const { pick, lang } = useLocale();
  const isChandra = elementId === "chandrabala";
  const cards = isChandra ? getChandraBalamCards(p) : getTaraBalamCards(p);
  const table = isChandra ? getChandrabalamTable(p) : getTarabalaTable(p);

  const moonRef = table?.moon_label
    ? pick(
        isChandra
          ? `सूर्योदयको चन्द्र राशि: ${table.moon_label}`
          : `सूर्योदयको चन्द्र नक्षत्र: ${table.moon_label}`,
        isChandra
          ? `Moon sign at sunrise: ${table.moon_label_en ?? table.moon_label}`
          : `Moon nakshatra at sunrise: ${table.moon_label_en ?? table.moon_label}`,
      )
    : undefined;

  const formatName = isChandra
    ? (card: ReturnType<typeof getChandraBalamCards>[number]) =>
        formatRashiDisplay(card.name, card.nameEn, lang) ?? pick(card.name, card.nameEn ?? card.name)
    : (card: ReturnType<typeof getTaraBalamCards>[number]) => pick(card.name, card.nameEn ?? card.name);

  if (!cards.length) {
    return <p className="text-sm">{pick("विवरण उपलब्ध छैन।", "No data available.")}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {moonRef ? <p className="m-0 text-center text-sm text-muted-foreground">{moonRef}</p> : null}
      <NavataraBalamCardGrid cards={cards} clock={clock} formatName={formatName} lang={lang} />
    </div>
  );
}

/* ── description (what it is · how it's calculated · what it means) ──────── */

function ElementDescription({ elementId }: { elementId: string }) {
  const { pick } = useLocale();
  const desc = ELEMENT_DESCRIPTIONS[elementId];
  if (!desc) return null;

  const blocks: { titleNe: string; titleEn: string; body: { ne: string; en: string } }[] = [
    { titleNe: "यो के हो", titleEn: "What it is", body: desc.what },
    { titleNe: "कसरी गणना गरिन्छ", titleEn: "How it's calculated", body: desc.how },
    { titleNe: "यसको अर्थ", titleEn: "What it means", body: desc.meaning },
  ];

  return (
    <section className={cn(patroCard, "mt-6 p-4")} aria-label={pick("विवरण", "About")}>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-secondary">
        {pick("बारेमा", "About")}
      </h2>
      <div className="flex flex-col gap-4">
        {blocks.map((b) => (
          <div key={b.titleEn} className="flex flex-col gap-1">
            <h3 className="text-sm font-bold text-foreground">{pick(b.titleNe, b.titleEn)}</h3>
            <p className="m-0 text-sm leading-relaxed text-muted-foreground">
              {pick(b.body.ne, b.body.en)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── page ───────────────────────────────────────────────────────────────── */

export function ElementPage() {
  const { name } = useParams({ strict: false }) as { name?: string };
  const { pick } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const meta = name ? ELEMENT_BY_ID[name] : undefined;
  const isNavataraBal = name === "chandrabala" || name === "tarabala";

  const today = new Date();
  const todayAd = toAdStr(today);
  const todayBs = adToBS(today);
  const isSpan = meta?.kind === "span";

  // span → browse by BS month; table → browse by BS day.
  const [bs, setBs] = useState({ year: todayBs.year, month: todayBs.month });
  const [tbs, setTbs] = useState({ year: todayBs.year, month: todayBs.month, day: todayBs.day });
  const dayAd = toAdStr(bsToAD(tbs.year, tbs.month, tbs.day));

  const spanQuery = useQuery({
    queryKey: elementKeys.month(name ?? "", bs.year, bs.month, location.params),
    queryFn: () => fetchElementSpans(name!, { bsYear: bs.year, bsMonth: bs.month }, location.params),
    enabled: Boolean(name) && Boolean(meta) && isSpan,
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  const dayQuery = useQuery({
    queryKey: elementKeys.day(name ?? "", dayAd, location.params),
    queryFn: () => fetchElementDay(name!, dayAd, location.params),
    enabled: Boolean(name) && Boolean(meta) && !isSpan && !isNavataraBal,
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  const panchangaQuery = useQuery({
    queryKey: panchangaKeys.day(dayAd, "ad", location.params),
    queryFn: () => fetchPanchanga(dayAd, "ad", location.params),
    enabled: Boolean(name) && Boolean(meta) && !isSpan && isNavataraBal,
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  const timezone = resolveTimeZone(undefined, location.params.timezone);
  const elementClock =
    dayAd === todayAdStringInTimezone(new Date(), timezone)
      ? defaultClockForTimezone(timezone)
      : undefined;

  const firstLoading = isSpan
    ? spanQuery.isLoading && !spanQuery.data
    : isNavataraBal
      ? panchangaQuery.isLoading && !panchangaQuery.data
      : dayQuery.isLoading && !dayQuery.data;
  useRouteLoading(Boolean(meta) && firstLoading);

  if (!meta) {
    return (
      <PageShell>
        <PageHeader icon={<Sparkles className="h-6 w-6 text-secondary" />} title={pick("अज्ञात तत्त्व", "Unknown element")} />
        <p className="text-sm">
          <Link to="/panchanga/details" className="text-primary underline">{pick("पञ्चाङ्ग विवरणमा फर्कनुहोस्", "Back to panchanga details")}</Link>
        </p>
      </PageShell>
    );
  }

  const setTableDate = (y: number, m: number, d: number) =>
    setTbs({ year: y, month: m, day: Math.min(d, getBSMonthLength(y, m)) });
  const stepMonth = (delta: number) => {
    let m = bs.month + delta;
    let y = bs.year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setBs({ year: y, month: m });
  };
  const stepDay = (delta: number) => {
    const d = bsToAD(tbs.year, tbs.month, tbs.day);
    d.setDate(d.getDate() + delta);
    setTbs(adToBS(d));
  };
  const goToday = () => {
    setBs({ year: todayBs.year, month: todayBs.month });
    setTbs({ year: todayBs.year, month: todayBs.month, day: todayBs.day });
  };

  return (
    <PageShell>
      <GrahaBanner
        icon={<Sparkles className="size-6" />}
        ne={meta.ne}
        en={meta.en}
        blurbNe={meta.blurbNe}
        blurbEn={meta.blurbEn}
      />

      <PanchangaBrowseHeader
        mode={isSpan ? "month" : "day"}
        year={isSpan ? bs.year : tbs.year}
        month={isSpan ? bs.month : tbs.month}
        day={isSpan ? undefined : tbs.day}
        onMonthChange={(m) => (isSpan ? setBs({ ...bs, month: m }) : setTableDate(tbs.year, m, tbs.day))}
        onYearChange={(y) => (isSpan ? setBs({ ...bs, year: y }) : setTableDate(y, tbs.month, tbs.day))}
        onSelectDate={(y, m, d) => (isSpan ? setBs({ year: y, month: m }) : setTableDate(y, m, d))}
        onPrev={() => (isSpan ? stepMonth(-1) : stepDay(-1))}
        onNext={() => (isSpan ? stepMonth(1) : stepDay(1))}
        onToday={goToday}
        todayAd={todayAd}
        location={location}
        onLocationChange={setLocation}
      />

      {isSpan ? (
        spanQuery.isLoading && !spanQuery.data ? (
          <p className="text-sm">{pick("लोड हुँदै…", "Loading…")}</p>
        ) : spanQuery.data ? (
          <SpanList spans={spanQuery.data.spans} timeZone={spanQuery.data.timezone} />
        ) : (
          <p className="text-sm text-danger">{pick("लोड गर्न सकिएन।", "Could not load.")}</p>
        )
      ) : isNavataraBal ? (
        panchangaQuery.isLoading && !panchangaQuery.data ? (
          <p className="text-sm">{pick("लोड हुँदै…", "Loading…")}</p>
        ) : panchangaQuery.data ? (
          <div className={cn(patroCard, "p-3.5")}>
            <NavataraBalamElementView
              elementId={name as "chandrabala" | "tarabala"}
              p={panchangaQuery.data}
              clock={elementClock}
            />
          </div>
        ) : (
          <p className="text-sm text-danger">{pick("लोड गर्न सकिएन।", "Could not load.")}</p>
        )
      ) : dayQuery.isLoading && !dayQuery.data ? (
        <p className="text-sm">{pick("लोड हुँदै…", "Loading…")}</p>
      ) : dayQuery.data ? (
        <div className={cn(patroCard, "p-3.5")}>
          <TableView data={dayQuery.data.data} sunrise={dayQuery.data.sunrise} />
        </div>
      ) : (
        <p className="text-sm text-danger">{pick("लोड गर्न सकिएन।", "Could not load.")}</p>
      )}

      <ElementDescription elementId={meta.id} />

      <p className="mt-6 text-sm">
        <Link to="/panchanga/details" className="text-primary underline">
          {pick("← सबै पञ्चाङ्ग तत्त्वहरू", "← All panchanga elements")}
        </Link>
      </p>
    </PageShell>
  );
}

export default ElementPage;
