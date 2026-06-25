import { Fragment, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Moon,
  Sparkles,
  Sunrise,
  Sunset,
} from "lucide-react";
import {
  fetchMonthCalendar,
  fetchGochar,
  fetchGocharIngress,
  fetchSpecialMonths,
  panchangaKeys,
  gocharKeys,
  specialMonthsKeys,
  type CalendarDay,
  type CalendarDayAnga,
} from "@/lib/api";
import {
  BS_MONTHS_NE,
  BS_MONTH_NAMES,
  BS_SUPPORTED_START_YEAR,
  BS_SUPPORTED_END_YEAR,
  getCurrentBs,
} from "@/lib/bs-calendar";
import { toNepaliDigits, formatTimeShort, formatVedicPatroTime } from "@/lib/panchanga-format";
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
import {
  locationToSearch,
  sameLocationParams,
  sameSearch,
  searchToLocation,
  type ChandraKrantiSearch,
} from "@/lib/url-state";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DayPatroExpandPanel } from "@/components/chandrakranti/DayPatroExpandPanel";
import { GocharKundaliChart } from "@/components/chandrakranti/GocharKundaliChart";
import { GocharRashyadiTable } from "@/components/chandrakranti/GocharRashyadiTables";
import { buildRashyadiRangeTables } from "@/lib/chandrakranti/rashyadi-segments";
import { buildGapanshaLine, buildPapanshaDisplayLine } from "@/lib/chandrakranti/gapansha";
import { grahaRashiNe, formatGocharBsLabel } from "@/lib/chandrakranti/gochar-display";
import { MonthLagnaMatrix } from "@/components/chandrakranti/MonthLagnaMatrix";
import { MonthGrahaSpashta } from "@/components/chandrakranti/MonthGrahaSpashta";
import { MonthCalcNotes } from "@/components/chandrakranti/MonthCalcNotes";
import {
  buildCalcNotes,
  buildGrahaSpashtaMatrix,
  buildLagnaMatrix,
} from "@/lib/chandrakranti/month-patro-tables";

const N = toNepaliDigits;
const COL_SPAN = 13;

const routeApi = getRouteApi("/chandrakranti");

type Phase = "krishna" | "shukla";
type PakshaFilter = Phase | "all";

const RASHI_NE = [
  "मेष", "वृष", "मिथुन", "कर्क", "सिंह", "कन्या",
  "तुला", "वृश्चिक", "धनु", "मकर", "कुम्भ", "मीन",
] as const;

/** English rāśi names as returned by the gochar API, aligned to RASHI_NE order. */
const RASHI_EN = [
  "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
  "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
] as const;

function rashiEnToNe(en?: string): string | undefined {
  if (!en) return undefined;
  const i = RASHI_EN.findIndex((r) => r.toLowerCase() === en.toLowerCase());
  return i >= 0 ? RASHI_NE[i] : en;
}

/** 27 nakshatras in canonical order, matching the gochar API spellings. */
const NAKSHATRA_EN = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
  "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
] as const;

/** Rāśi (Nepali) containing a given nakshatra·pada — 9 padas span each rāśi. */
function rashiNeFromNakPada(nakshatraEn?: string, pada?: number): string | undefined {
  if (!nakshatraEn || !pada) return undefined;
  const ni = NAKSHATRA_EN.findIndex((n) => n.toLowerCase() === nakshatraEn.toLowerCase());
  if (ni < 0) return undefined;
  const absPada = ni * 4 + (pada - 1); // 0..107
  return RASHI_NE[Math.floor(absPada / 9)];
}

/** Insert the rāśi before the trailing "मा" — "कृत्तिका १ मा" → "कृत्तिका १ वृषमा". */
function embedRashi(labelNe: string, rashiNe?: string): string {
  if (!rashiNe) return labelNe;
  const out = labelNe.replace(/\s*मा\s*$/u, ` ${rashiNe}मा`);
  return out === labelNe ? `${labelNe} ${rashiNe}` : out;
}

/** Patro-style graha names (table column). */
const GRAHA_TABLE_NE: Record<string, string> = {
  sun: "सूर्य",
  moon: "चन्द्र",
  mars: "मंगल",
  mercury: "बुध",
  jupiter: "गुरु",
  venus: "शुक्र",
  saturn: "शनि",
  rahu: "राहु",
  ketu: "केतु",
};

function grahaTableNe(key: string, fallback?: string): string {
  return GRAHA_TABLE_NE[key] ?? fallback ?? key;
}

type TransitEvent = {
  planetNe: string;
  labelNe: string;
  time?: string;
  sortKey: string;
};
function resolvePatroRowDateAd(
  ev: { entry_vedic_date_ad?: string; entry_date_ad?: string },
  allDays: CalendarDay[],
): string | undefined {
  const civil = ev.entry_vedic_date_ad ?? ev.entry_date_ad;
  if (!civil) return undefined;
  if (allDays.some((d) => d.date_ad === civil)) return civil;
  // Fallback: vedic date may be last day of prior month when month starts mid-week.
  return ev.entry_date_ad;
}

const BS_MIN_INDEX = BS_SUPPORTED_START_YEAR * 12;
const BS_MAX_INDEX = BS_SUPPORTED_END_YEAR * 12 + 11;

function phaseOf(day: CalendarDay): Phase | undefined {
  if (day.paksha === "shukla" || day.paksha_ne?.includes("शुक्ल")) return "shukla";
  if (day.paksha === "krishna" || day.paksha_ne?.includes("कृष्ण")) return "krishna";
  return undefined;
}

function pakshaShort(day: CalendarDay): string {
  const p = phaseOf(day);
  return p === "shukla" ? "शुक्ल" : p === "krishna" ? "कृष्ण" : "";
}

/** Lunar (chāndra) month names in Sanskrit-Nepali, keyed by the API's English name. */
const LUNAR_MONTH_NE: Record<string, string> = {
  baisakh: "वैशाख", baishakh: "वैशाख", vaisakha: "वैशाख", vaishakha: "वैशाख",
  jestha: "ज्येष्ठ", jyeshtha: "ज्येष्ठ", jyestha: "ज्येष्ठ",
  ashadh: "आषाढ", ashadha: "आषाढ", asar: "आषाढ",
  shrawan: "श्रावण", shrawn: "श्रावण", shravan: "श्रावण", shravana: "श्रावण",
  bhadra: "भाद्रपद", bhadau: "भाद्रपद", bhadrapada: "भाद्रपद",
  ashwin: "आश्विन", ashwina: "आश्विन", aswin: "आश्विन",
  kartik: "कार्तिक", kartika: "कार्तिक",
  mangsir: "मार्गशीर्ष", margashir: "मार्गशीर्ष", margashirsha: "मार्गशीर्ष", margasirsa: "मार्गशीर्ष",
  poush: "पौष", paush: "पौष", pausha: "पौष", push: "पौष",
  magh: "माघ", magha: "माघ",
  falgun: "फाल्गुन", phalgun: "फाल्गुन", phalguna: "फाल्गुन",
  chaitra: "चैत्र", chait: "चैत्र", chaitya: "चैत्र",
};

function lunarMonthNe(en?: string): string | undefined {
  if (!en) return undefined;
  const key = en.toLowerCase().replace(/[^a-z]/g, "");
  return LUNAR_MONTH_NE[key] ?? en;
}

type PakshaSegment = { key: string; label: string };

/**
 * Lunar-paksha label for a day, e.g. "अधिक ज्येष्ठ शुक्लपक्ष" / "शुद्ध ज्येष्ठ कृष्णपक्ष".
 * Prefers the pūrṇimānta layer (`lunar_calendar.purnimant`) — the reckoning Nepali
 * patro uses — and falls back to amānta or the flat `lunar_month`.
 */
function pakshaSegmentOf(day: CalendarDay, adhikMonthEn?: string): PakshaSegment {
  const lc = day.panchanga?.lunar_calendar;
  const layer = lc?.purnimant ?? lc?.amanta ?? day.panchanga?.lunar_month;
  const lunarEn = layer?.name;
  const lunarNe = lunarMonthNe(lunarEn) ?? lunarEn ?? "";
  const isAdhik = layer?.is_adhik === true || layer?.type === "adhik";
  const adhikName = lc?.adhik_maas?.name ?? adhikMonthEn;
  const isShuddha =
    !isAdhik &&
    Boolean(adhikName) &&
    Boolean(lunarEn) &&
    lunarEn!.toLowerCase() === adhikName!.toLowerCase();
  const prefix = isAdhik ? "अधिक " : isShuddha ? "शुद्ध " : "";
  const phase = phaseOf(day);
  const phaseNe = phase === "shukla" ? "शुक्ल" : phase === "krishna" ? "कृष्ण" : "";
  return {
    key: `${prefix}${lunarNe}|${phase ?? ""}`,
    label: `${prefix}${lunarNe} ${phaseNe}पक्ष`.trim(),
  };
}

function fmtAd(dateAd: string): string {
  const d = new Date(`${dateAd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateAd;
  return d.toLocaleDateString("en", { day: "numeric", month: "short" });
}

/** Day-of-week index from an AD date string (0 = Sunday … 6 = Saturday). */
function dowOf(dateAd: string): number {
  const d = new Date(`${dateAd}T00:00:00`);
  return Number.isNaN(d.getTime()) ? -1 : d.getDay();
}

/** Local today as a "YYYY-MM-DD" key for highlighting. */
function todayKey(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

/**
 * End-time label for a panchanga aṅga. The calendar endpoint returns `end`
 * as a full datetime ("2026-06-20 16:02"); we surface the clock part in
 * Nepali digits — e.g. "१६:०२ बजे".
 */
function angaEnd(anga?: CalendarDayAnga): string | null {
  const t = formatTimeShort(anga?.end);
  if (!t) return null;
  return `${N(t)} बजे`;
}

const KARTAVYA: Record<Phase, string> = {
  krishna:
    "कृष्ण पक्षमा चन्द्रमा क्रमशः क्षीण हुँदै जान्छ। श्राद्ध, तर्पण र पितृकार्य, संयमित आहार, जप र दान शुभ मानिन्छ। एकादशीमा व्रत र अमावस्यामा पितृ-तर्पण गरिन्छ; नयाँ मांगलिक कार्य प्रायः शुक्ल पक्षमा सारिन्छ।",
  shukla:
    "शुक्ल पक्षमा चन्द्रमा क्रमशः वृद्धि हुँदै जान्छ। विवाह, व्रतबन्ध, गृहप्रवेश, यात्रा र नयाँ कार्यारम्भ जस्ता मांगलिक कार्य शुभ मानिन्छन्। एकादशी व्रत र पूर्णिमामा सत्यनारायण पूजा/व्रत गरिन्छ।",
};

const th = "whitespace-nowrap text-sm font-semibold text-muted-foreground";
const subLine = "text-xs leading-tight text-muted-foreground";

/** ग्रह उदयास्त सङ्केत — heliacal rising/setting + motion abbreviations. */
const UDAYAST_LEGEND: { code: string; full: string; meaning: string }[] = [
  { code: "व.उ.", full: "वक्र उदय", meaning: "ग्रह वक्र (उल्टो) अवस्थामा उदय भएको।" },
  { code: "बु.मा.उ.", full: "बुध मार्गी उदय", meaning: "बुध मार्गी (सुल्टो) भएर उदय भएको।" },
  { code: "वृ.व.उ.", full: "बृहस्पति वक्र उदय", meaning: "बृहस्पति (गुरु) वक्र अवस्थामा उदय भएको।" },
  { code: "शु.मा.उ.", full: "शुक्र मार्गी उदय", meaning: "शुक्र मार्गी भएर उदय भएको।" },
  { code: "श.मा.उ. ७अ.", full: "शनि मार्गी उदय, ७ अस्त", meaning: "शनि मार्गी भएर उदय भएको र ७ गते अस्त हुने।" },
];

/** गोचर / पापशान्ति घर-स्थिति सङ्केत. */
const GOCHAR_LEGEND: { code: string; meaning: string }[] = [
  { code: "पापाशाः", meaning: "पापशान्ति — कुण्डलीका अशुभ (पाप) ग्रहहरूको स्थिति।" },
  { code: "सू२", meaning: "सूर्य दोस्रो घर (भाव) मा रहेको।" },
  { code: "२७सू३", meaning: "२७ गते सूर्य तेस्रो घरमा प्रवेश गर्ने।" },
  { code: "म.१", meaning: "मंगल पहिलो घरमा रहेको।" },
  { code: "श.९", meaning: "शनि नवौँ घरमा रहेको।" },
  { code: "रा.५ के.११", meaning: "राहु पाँचौँ र केतु एघारौँ घरमा रहेको।" },
];

/** Planet motion in Nepali from the gochar `motion` / `is_retrograde` flags. */
function motionNe(g: { motion?: string; is_retrograde?: boolean }): { label: string; vakri: boolean } {
  const vakri = g.is_retrograde === true || /vakr|retro/i.test(g.motion ?? "");
  return { label: vakri ? "वक्री" : "मार्गी", vakri };
}

export function ChandraKranti() {
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  // Seed from the URL so a shared link opens on its month/paksha/location.
  const { location, setLocation } = usePanchangaLocation(searchToLocation(search));
  const today = useMemo(() => getCurrentBs(), []);
  const [year, setYear] = useState(() => search.year ?? today.year);
  const [month, setMonth] = useState(() => search.month ?? today.month);
  const [paksha, setPaksha] = useState<PakshaFilter>(() => search.paksha ?? "all");
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const nowKey = useMemo(() => todayKey(), []);

  // Mirror the selection into the URL so the view stays copy-paste shareable.
  useEffect(() => {
    const desired: ChandraKrantiSearch = {
      ...locationToSearch(location),
      year,
      month,
      paksha,
    };
    if (!sameSearch(desired, search)) {
      navigate({ search: desired, replace: true });
    }
  }, [location, year, month, paksha, search, navigate]);

  // Adopt URL changes from browser back/forward. This effect deliberately
  // subscribes page state to the router (an external system); the value guards
  // avoid fighting the mirror above.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (search.year != null && search.year !== year) setYear(search.year);
    if (search.month != null && search.month !== month) setMonth(search.month);
    if (search.paksha && search.paksha !== paksha) setPaksha(search.paksha);
    const loc = searchToLocation(search);
    if (loc && !sameLocationParams(loc.params, location.params)) setLocation(loc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleDayExpand = (dateAd: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dateAd)) next.delete(dateAd);
      else next.add(dateAd);
      return next;
    });
  };

  useEffect(() => {
    setExpandedDays(new Set());
  }, [year, month, paksha, location.params.lat, location.params.lon]);

  const stepMonth = (delta: number) => {
    const idx = Math.min(
      BS_MAX_INDEX,
      Math.max(BS_MIN_INDEX, year * 12 + (month - 1) + delta),
    );
    setYear(Math.floor(idx / 12));
    setMonth((idx % 12) + 1);
  };

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

  // Adhik / kshaya maas info for the displayed year (drives शुद्ध vs अधिक labels).
  const specialQ = useQuery({
    queryKey: specialMonthsKeys.year(year),
    queryFn: () => fetchSpecialMonths(year),
    staleTime: 1000 * 60 * 60,
  });
  const adhik = specialQ.data?.adhik_maas;
  const adhikMonthEn = adhik?.has_adhik_maas ? adhik.month_name : undefined;
  const monthHasAdhik = useMemo(
    () =>
      allDays.some((d) => {
        const lc = d.panchanga?.lunar_calendar;
        return (
          lc?.purnimant?.is_adhik === true ||
          lc?.amanta?.is_adhik === true ||
          d.panchanga?.lunar_month?.is_adhik === true
        );
      }),
    [allDays],
  );

  // Lunar-paksha section header to render before the first day of each segment.
  const headerByDate = useMemo(() => {
    const out: Record<string, string> = {};
    let prevKey = "";
    for (const d of days) {
      const seg = pakshaSegmentOf(d, adhikMonthEn);
      if (seg.key !== prevKey) {
        out[d.date_ad] = seg.label;
        prevKey = seg.key;
      }
    }
    return out;
  }, [days, adhikMonthEn]);

  // गोचर kundali + transit extraction are anchored to the month start so each
  // planet's `next_rashi_entry` covers the whole displayed month.
  const gocharDate = allDays[0]?.date_ad ?? nowKey;
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

  const monthEnd = allDays[allDays.length - 1]?.date_ad;
  const ingressQ = useQuery({
    queryKey: gocharKeys.ingress(
      gocharDate,
      monthEnd ?? gocharDate,
      "patro",
      location.params
    ),
    queryFn: () =>
      fetchGocharIngress(gocharDate, monthEnd ?? gocharDate, location.params, {
        level: "patro",
        era: "ad",
      }),
    enabled: Boolean(gocharDate && monthEnd),
    staleTime: 1000 * 60 * 30,
  });

  // Per-day ग्रहचार / उदयास्त — keyed by BS गते (vedic sunrise day).
  const transitsByBsDay = useMemo(() => {
    const out: Record<number, TransitEvent[]> = {};
    const dateToBsDay = Object.fromEntries(allDays.map((d) => [d.date_ad, d.day]));
    const sunriseByDate = Object.fromEntries(allDays.map((d) => [d.date_ad, d.sunrise]));

    for (const ev of ingressQ.data?.events ?? []) {
      const rowDateAd = resolvePatroRowDateAd(ev, allDays);
      if (!rowDateAd) continue;
      const bsDay = dateToBsDay[rowDateAd];
      if (bsDay == null) continue;

      const planetNe = grahaTableNe(ev.graha, ev.graha_ne);
      const isRashi = ev.level === "rashi";
      const isUdayast = ev.level === "udayast";
      const isMotion = ev.level === "motion";
      const baseLabel = isMotion
        ? (ev.label_ne ?? "")
        : isUdayast
        ? (ev.label_ne ?? "")
        : isRashi
        ? (ev.label_ne ?? `${ev.to_rashi_ne ?? ""}मा`)
        : (ev.label_ne ?? `${ev.to_nakshatra_ne ?? ""} ${ev.to_pada_ne ?? ""} मा`.trim());
      const rashiNe = isRashi
        ? ev.to_rashi_ne
        : rashiNeFromNakPada(ev.to_nakshatra, ev.to_pada);
      const labelNe =
        isMotion || isUdayast || isRashi ? baseLabel : embedRashi(baseLabel, rashiNe);
      const timeRaw = ev.entry_time_local_short ?? ev.entry_time_local?.split(" ")[1];
      const time = timeRaw
        ? formatVedicPatroTime(timeRaw, sunriseByDate[rowDateAd]) ?? timeRaw
        : undefined;

      (out[bsDay] ??= []).push({
        planetNe,
        labelNe,
        time,
        sortKey: ev.entry_time_utc ?? `${rowDateAd}T${timeRaw ?? "00:00"}`,
      });
    }

    for (const day of Object.keys(out)) {
      out[Number(day)]!.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }
    return out;
  }, [ingressQ.data, allDays]);

  const lagnaMatrix = useMemo(() => buildLagnaMatrix(days), [days]);
  const grahaMatrix = useMemo(() => buildGrahaSpashtaMatrix(days), [days]);
  const calcNotes = useMemo(
    () => buildCalcNotes(days, ingressQ.data?.events ?? [], headerByDate),
    [days, ingressQ.data?.events, headerByDate],
  );
  const rashyadiRange = useMemo(
    () =>
      buildRashyadiRangeTables(
        days,
        allDays,
        ingressQ.data?.events ?? [],
        (d) => pakshaSegmentOf(d, adhikMonthEn),
      ),
    [days, allDays, ingressQ.data?.events, adhikMonthEn],
  );
  const papanshaLine = useMemo(() => {
    if (days.length === 0) return "";
    return buildPapanshaDisplayLine(days[0]!);
  }, [days]);
  const gapanshaLine = useMemo(() => {
    if (days.length === 0) return "";
    return buildGapanshaLine(days, allDays, ingressQ.data?.events ?? []);
  }, [days, allDays, ingressQ.data?.events]);
  const lagnaByDate = useMemo(
    () => Object.fromEntries(lagnaMatrix.map((r) => [r.dateAd, r])),
    [lagnaMatrix],
  );
  const grahaByDate = useMemo(
    () => Object.fromEntries(grahaMatrix.map((r) => [r.dateAd, r])),
    [grahaMatrix],
  );
  const notesByDate = useMemo(() => {
    const out: Record<string, typeof calcNotes> = {};
    for (const n of calcNotes) {
      (out[n.dateAd] ??= []).push(n);
    }
    return out;
  }, [calcNotes]);

  const ritu = useMemo(
    () => allDays.find((d) => d.panchanga?.ritu_ne)?.panchanga?.ritu_ne,
    [allDays],
  );

  const monthLabel = `${BS_MONTHS_NE[month - 1]} (${BS_MONTH_NAMES[month - 1]})`;
  const pakshaLabel = paksha === "krishna" ? "कृष्णपक्ष" : paksha === "shukla" ? "शुक्लपक्ष" : "पूरा महिना";
  const atStart = year * 12 + (month - 1) <= BS_MIN_INDEX;
  const atEnd = year * 12 + (month - 1) >= BS_MAX_INDEX;

  return (
    <PageShell>
      <PageHeader
        icon={<Moon className="h-7 w-7 text-secondary" />}
        title="चन्द्र क्रान्ति"
        subtitle="पक्ष अनुसार दैनिक पञ्चाङ्ग — तिथि, नक्षत्र, योग, करण, सूर्योदय/अस्त, पर्व र ग्रह गोचर।"
      />

      {/* controls */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card/40 p-4">
        <div className="flex items-end gap-1">
          <button
            type="button"
            onClick={() => stepMonth(-1)}
            disabled={atStart}
            aria-label="अघिल्लो महिना"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => stepMonth(1)}
            disabled={atEnd}
            aria-label="अर्को महिना"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
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
            {([["all", "पूरै"], ["krishna", "कृष्ण"], ["shukla", "शुक्ल"]] as const).map(([v, lbl]) => (
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
        <button
          type="button"
          onClick={() => {
            const c = getCurrentBs();
            setYear(c.year);
            setMonth(c.month);
          }}
          className="ml-auto flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm text-foreground transition-colors hover:bg-muted"
        >
          <CalendarDays className="h-4 w-4" /> आज
        </button>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-lg font-bold text-foreground">
          {monthLabel} · {pakshaLabel}
        </h2>
        {monthQ.data?.year_bs ? (
          <span className="text-sm text-muted-foreground">{N(monthQ.data.year_bs)} बि.सं.</span>
        ) : null}
        {ritu ? <span className="text-sm text-muted-foreground">· ऋतु: {ritu}</span> : null}
        {allDays.length ? (
          <span className="text-xs text-muted-foreground">· {N(days.length)} दिन</span>
        ) : null}
      </div>

      {monthHasAdhik && adhik?.month_name ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <span className="font-semibold">अधिक मास:</span> यस वर्ष <span className="font-semibold">अधिक {lunarMonthNe(adhik.month_name)}</span> मास परेको छ — त्यसैले यो महिनामा अधिक र शुद्ध पक्षहरू छुट्टाछुट्टै देखाइएका छन्। (अधिक मास = मलमास / पुरुषोत्तम मास; यसमा सङ्क्रान्ति पर्दैन।)
        </div>
      ) : null}

      <div className="flex w-full flex-col gap-8">
        <div className="w-full min-w-0 space-y-4">
        {/* daily table */}
        <div className="w-full overflow-x-auto rounded-xl border border-border">
          <Table className="w-full min-w-max text-sm">
            <TableHeader>
              <TableRow className="sticky top-0 z-10 bg-muted hover:bg-muted">
                <TableHead className={cn(th, "w-9 px-1")} aria-label="विस्तार" />
                <TableHead className={th}>गते · ता.</TableHead>
                <TableHead className={th}>बा.</TableHead>
                <TableHead className={th}>तिथि</TableHead>
                <TableHead className={th}>नक्षत्र</TableHead>
                <TableHead className={th}>योग</TableHead>
                <TableHead className={th}>करण</TableHead>
                <TableHead className={cn(th, "text-amber-600 dark:text-amber-400")}>सु.उ.</TableHead>
                <TableHead className={cn(th, "text-indigo-600 dark:text-indigo-400")}>सु.अ.</TableHead>
                <TableHead className={th}>सूर्य राशि</TableHead>
                <TableHead className={th}>चन्द्र राशि</TableHead>
                <TableHead className={th}>ग्रहचार / उदयास्त (बजे)</TableHead>
                <TableHead className={th}>पर्व</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthQ.isLoading ? (
                <TableRow><TableCell colSpan={COL_SPAN} className="py-8 text-center text-muted-foreground">लोड हुँदैछ…</TableCell></TableRow>
              ) : monthQ.isError ? (
                <TableRow><TableCell colSpan={COL_SPAN} className="py-8 text-center text-muted-foreground">विवरण ल्याउन सकिएन। पुनः प्रयास गर्नुहोस्।</TableCell></TableRow>
              ) : days.length === 0 ? (
                <TableRow><TableCell colSpan={COL_SPAN} className="py-8 text-center text-muted-foreground">यो पक्षमा कुनै दिन भेटिएन।</TableCell></TableRow>
              ) : (
                days.map((d) => {
                  const det = d.panchanga;
                  const tithiEnd = angaEnd(det?.tithi);
                  const nakEnd = angaEnd(det?.nakshatra);
                  const yogaEnd = angaEnd(det?.yoga);
                  const karanaEnd = angaEnd(det?.karana);
                  const sunRashi = det?.surya_rashi_ne;
                  const moonRashi = det?.chandra_rashi_ne;
                  const dow = dowOf(d.date_ad);
                  const isSaturday = dow === 6;
                  const isToday = d.date_ad === nowKey;
                  const hasFestival = (d.festivals?.length ?? 0) > 0;
                  const segLabel = headerByDate[d.date_ad];
                  const isExpanded = expandedDays.has(d.date_ad);
                  return (
                    <Fragment key={d.date_ad}>
                    {segLabel ? (
                      <TableRow className="bg-muted/70 hover:bg-muted/70">
                        <TableCell colSpan={COL_SPAN} className="py-2 text-sm font-bold text-secondary">
                          {segLabel}
                        </TableCell>
                      </TableRow>
                    ) : null}
                    <TableRow
                      className={cn(
                        isToday && "bg-secondary/15 hover:bg-secondary/20",
                        !isToday && hasFestival && "bg-rose-500/5",
                        isExpanded && "border-b-0",
                      )}
                    >
                      <TableCell className="w-9 px-1">
                        <button
                          type="button"
                          onClick={() => toggleDayExpand(d.date_ad)}
                          aria-expanded={isExpanded}
                          aria-label={`${N(d.day)} गतेको लग्न र ग्रहस्पष्ट`}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <ChevronRight
                            className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")}
                          />
                        </button>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          {isToday ? <span className="h-1.5 w-1.5 rounded-full bg-secondary" aria-hidden /> : null}
                          <span className={cn("font-semibold", isSaturday || hasFestival ? "text-rose-600 dark:text-rose-400" : "text-foreground")}>{N(d.day)}</span>
                        </span>
                        <span className="ml-1.5 text-xs text-muted-foreground">{fmtAd(d.date_ad)}</span>
                      </TableCell>
                      <TableCell className={cn("whitespace-nowrap", isSaturday && "font-medium text-rose-600 dark:text-rose-400")}>{d.weekday_ne ?? d.weekday}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div><span className="text-muted-foreground">{pakshaShort(d)}</span> {d.tithi_ne ?? d.tithi ?? "—"}</div>
                        {tithiEnd ? <div className={subLine}>{tithiEnd} सम्म</div> : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div>{d.nakshatra_ne ?? d.nakshatra ?? "—"}</div>
                        {nakEnd ? <div className={subLine}>{nakEnd} सम्म</div> : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div>{d.yoga_ne ?? d.yoga ?? "—"}</div>
                        {yogaEnd ? <div className={subLine}>{yogaEnd} सम्म</div> : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div>{d.karana_ne ?? d.karana ?? "—"}</div>
                        {karanaEnd ? <div className={subLine}>{karanaEnd} सम्म</div> : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-amber-600 dark:text-amber-400">{d.sunrise ? N(formatTimeShort(d.sunrise) ?? d.sunrise) : "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-indigo-600 dark:text-indigo-400">{d.sunset ? N(formatTimeShort(d.sunset) ?? d.sunset) : "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {sunRashi ?? "—"}
                        {det?.ayana_mark ? <sup className="ml-0.5 text-[10px] text-muted-foreground">{det.ayana_mark}</sup> : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{moonRashi ?? "—"}</TableCell>
                      <TableCell className="align-top">
                        {(transitsByBsDay[d.day]?.length ?? 0) > 0 ? (
                          <div className="space-y-0.5">
                            {transitsByBsDay[d.day]!.map((ev, i) => (
                              <div key={i} className="whitespace-nowrap text-sm leading-tight">
                                <span className="text-foreground">{ev.labelNe}</span>{" "}
                                <span className="text-secondary">{ev.planetNe}</span>
                                {ev.time ? (
                                  <span className="text-muted-foreground"> {N(ev.time)}</span>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-48">
                        {hasFestival ? (
                          <span className="line-clamp-2 text-sm text-rose-600 dark:text-rose-300">{d.festivals.join(" · ")}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpanded ? (
                      <TableRow className="bg-muted/25 hover:bg-muted/25">
                        <TableCell
                          colSpan={COL_SPAN}
                          className="max-w-0 whitespace-normal px-2 py-2 sm:px-4"
                        >
                          <DayPatroExpandPanel
                            lagna={lagnaByDate[d.date_ad]}
                            graha={grahaByDate[d.date_ad]}
                            notes={notesByDate[d.date_ad]}
                          />
                        </TableCell>
                      </TableRow>
                    ) : null}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <Accordion type="multiple" className="rounded-xl border border-border px-4">
          <AccordionItem value="lagna-month">
            <AccordionTrigger className="py-3 text-base font-semibold text-foreground hover:no-underline">
              दैनिक लग्न आरम्भ समयतालिका (पूरा महिना)
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                प्रत्येक गते सूर्योदयदेखि अर्को सूर्योदयसम्म कुन राशि कहिले लग्नमा आउँछ।
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <MonthLagnaMatrix
                  embedded
                  rows={lagnaMatrix}
                  todayKey={nowKey}
                  loading={monthQ.isLoading}
                  empty={!monthQ.isLoading && days.length === 0}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="graha-month">
            <AccordionTrigger className="py-3 text-base font-semibold text-foreground hover:no-underline">
              उदयकालिक सूर्यादिग्रहस्पष्ट (पूरा महिना)
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                सूर्योदयको क्षणमा ग्रहहरूको राश्यादि स्थिति र दैनिक बेलान्तर।
              </p>
              <MonthGrahaSpashta
                embedded
                rows={grahaMatrix}
                todayKey={nowKey}
                loading={monthQ.isLoading}
                empty={!monthQ.isLoading && days.length === 0}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="calc-notes">
            <AccordionTrigger className="py-3 text-base font-semibold text-foreground hover:no-underline">
              गणना सूचना र विशेष दिनहरू
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <MonthCalcNotes
                embedded
                notes={calcNotes}
                loading={monthQ.isLoading || ingressQ.isLoading}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        </div>

        {/* bottom panels — was sidebar */}
        <aside className="grid w-full gap-5 md:grid-cols-2 xl:grid-cols-4">
          {/* sunrise / sunset quick glance for the reference day */}
          {(() => {
            const ref = days[0];
            if (!ref) return null;
            return (
              <div className="grid grid-cols-2 gap-3 md:col-span-2 xl:col-span-4">
                <div className="flex items-center gap-2 rounded-xl border border-border p-3">
                  <Sunrise className="h-5 w-5 text-amber-500" />
                  <div className="text-sm">
                    <div className="text-sm text-muted-foreground">सूर्योदय</div>
                    <div className="font-semibold text-foreground">{ref.sunrise ? N(formatTimeShort(ref.sunrise) ?? ref.sunrise) : "—"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-border p-3">
                  <Sunset className="h-5 w-5 text-indigo-500" />
                  <div className="text-sm">
                    <div className="text-sm text-muted-foreground">सूर्यास्त</div>
                    <div className="font-semibold text-foreground">{ref.sunset ? N(formatTimeShort(ref.sunset) ?? ref.sunset) : "—"}</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* gochar kundali flanked by rashyadi start / end */}
          <div className="grid grid-cols-1 items-stretch gap-4 md:col-span-2 xl:col-span-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,300px)_minmax(0,1fr)]">
            {rashyadiRange.start ? (
              <GocharRashyadiTable
                segment={rashyadiRange.start}
                kundaliGrahas={grahas}
                kundaliDateAd={gocharQ.data?.date_ad}
                loading={monthQ.isLoading || ingressQ.isLoading}
              />
            ) : null}
            <GocharKundaliChart
              className="flex flex-col justify-center lg:mx-auto lg:w-full lg:max-w-[300px]"
              grahas={grahas}
              gapanshaLine={gapanshaLine}
              papanshaLine={papanshaLine}
              dateBs={gocharQ.data?.date_bs}
              dateAd={gocharQ.data?.date_ad}
              loading={gocharQ.isLoading}
            />
            {rashyadiRange.end ? (
              <GocharRashyadiTable
                segment={rashyadiRange.end}
                loading={monthQ.isLoading || ingressQ.isLoading}
              />
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
                      <span className="ml-1 text-muted-foreground">{grahaRashiNe(g) ?? ""}</span>
                    </span>
                    {g.next_pada_entry ? (
                      <span className="shrink-0 text-right text-sm text-muted-foreground">
                        {g.next_pada_entry.label_ne}
                        <br />
                        {N(g.next_pada_entry.entry_time_local_short ?? g.next_pada_entry.entry_time_local ?? "")}
                      </span>
                    ) : g.next_rashi_entry ? (
                      <span className="shrink-0 text-right text-sm text-muted-foreground">
                        → {g.next_rashi_entry.to_rashi_ne ?? rashiEnToNe(g.next_rashi_entry.to_rashi) ?? g.next_rashi_entry.to_rashi}
                        <br />
                        {N(g.next_rashi_entry.entry_time_local)}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* kartavya */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 md:col-span-2 xl:col-span-4">
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

      <section className="rounded-xl border border-border">
        <header className="flex items-center gap-1.5 border-b border-border px-4 py-3">
          <Sparkles className="h-4 w-4 text-secondary" />
          <h3 className="text-sm font-semibold text-foreground">ग्रह स्पष्ट, उदयास्त र गोचर सङ्केत</h3>
          {gocharQ.data?.date_ad ? (
            <span className="ml-auto text-sm text-muted-foreground">
              {formatGocharBsLabel(gocharQ.data.date_bs, gocharQ.data.date_ad) ?? fmtAd(gocharQ.data.date_ad)} को स्थिति
            </span>
          ) : null}
        </header>

        <div className="grid gap-x-8 gap-y-6 p-4 md:grid-cols-2">
          {/* live graha spashta (degree · kala · vikala) + motion */}
          <div className="md:col-span-2">
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              ग्रह स्पष्ट (अंश° कला′ विकला″)
            </h4>
            {grahas.length === 0 ? (
              <p className="text-sm text-muted-foreground">{gocharQ.isLoading ? "लोड हुँदैछ…" : "विवरण उपलब्ध छैन।"}</p>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-4">
                {grahas.map((g) => {
                  const m = motionNe(g);
                  return (
                    <div key={g.key} className="flex items-baseline gap-1.5 text-sm">
                      <span className="text-secondary">{g.symbol}</span>
                      <span className="text-foreground">{g.name_ne}</span>
                      <span className="text-muted-foreground">{grahaRashiNe(g) ?? ""}</span>
                      {g.dms_in_rashi ? <span className="text-foreground">{N(g.dms_in_rashi)}</span> : null}
                      <span
                        className={cn(
                          "ml-auto shrink-0 rounded px-1.5 text-xs",
                          m.vakri ? "bg-rose-500/15 text-rose-600 dark:text-rose-300" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
                        )}
                      >
                        {m.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              प्रत्येक पक्षको आरम्भमा ग्रहहरूको स्पष्ट स्थान अंश°, कला′, विकला″ (र प्रति-विकला) मा दिइन्छ — जस्तै “१३ ६ २९ ४०” = १३ अंश ६ कला २९ विकला ४० प्रति-विकला। <span className="text-rose-600 dark:text-rose-300">वक्री</span> = उल्टो गति, <span className="text-emerald-600 dark:text-emerald-300">मार्गी</span> = सुल्टो गति।
            </p>
          </div>

          {/* udayast symbol legend */}
          <div>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              ग्रह उदयास्त सङ्केत
            </h4>
            <dl className="space-y-1.5">
              {UDAYAST_LEGEND.map((it) => (
                <div key={it.code} className="flex gap-2 text-sm">
                  <dt className="w-24 shrink-0">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-secondary">{it.code}</span>
                  </dt>
                  <dd className="text-muted-foreground">
                    <span className="text-foreground">{it.full}</span> — {it.meaning}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* gochar / papashanti house legend */}
          <div>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              गोचर / पापशान्ति घर-सङ्केत
            </h4>
            <dl className="space-y-1.5">
              {GOCHAR_LEGEND.map((it) => (
                <div key={it.code} className="flex gap-2 text-sm">
                  <dt className="w-20 shrink-0">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-secondary">{it.code}</span>
                  </dt>
                  <dd className="text-muted-foreground">{it.meaning}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">दशा कोष्ठक:</span> जन्म-समयमा बाँकी विंशोत्तरी दशाको वर्ष/महिना/दिन। <span className="font-semibold text-foreground">समय सुधार:</span> मुद्रणमा “उ” वा “०” जस्ता सङ्केतले शून्य अंश/कला जनाउँछ।
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

export default ChandraKranti;
