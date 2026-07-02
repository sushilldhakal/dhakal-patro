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
import { formatTimeShort, formatVedicPatroTime } from "@/lib/panchanga-format";
import { useRouteLoading } from "@/lib/route-loading";
import { PageShell, PageHeader } from "@/components/PageShell";
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
import { useLocale } from "@/i18n/locale";
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

const GRAHA_TABLE_EN: Record<string, string> = {
  sun: "Sun", moon: "Moon", mars: "Mars", mercury: "Mercury", jupiter: "Jupiter",
  venus: "Venus", saturn: "Saturn", rahu: "Rahu", ketu: "Ketu",
};

function grahaTableEn(key: string, fallback?: string): string {
  return GRAHA_TABLE_EN[key.toLowerCase()] ?? fallback ?? key;
}

type TransitEvent = {
  planetNe: string;
  planetEn: string;
  labelNe: string;
  labelEn: string;
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

function pakshaShort(day: CalendarDay, isEn = false): string {
  const p = phaseOf(day);
  if (isEn) return p === "shukla" ? "Shukla" : p === "krishna" ? "Krishna" : "";
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

function lunarMonthNe(en?: string, isEn = false): string | undefined {
  if (!en) return undefined;
  if (isEn) return en.charAt(0).toUpperCase() + en.slice(1);
  const key = en.toLowerCase().replace(/[^a-z]/g, "");
  return LUNAR_MONTH_NE[key] ?? en;
}

type PakshaSegment = { key: string; label: string };

/**
 * Lunar-paksha label for a day, e.g. "अधिक ज्येष्ठ शुक्लपक्ष" / "शुद्ध ज्येष्ठ कृष्णपक्ष".
 * Prefers the pūrṇimānta layer (`lunar_calendar.purnimant`) — the reckoning Nepali
 * patro uses — and falls back to amānta or the flat `lunar_month`.
 */
function pakshaSegmentOf(day: CalendarDay, adhikMonthEn?: string, isEn = false): PakshaSegment {
  const lc = day.panchanga?.lunar_calendar;
  const layer = lc?.purnimant ?? lc?.amanta ?? day.panchanga?.lunar_month;
  const lunarEn = layer?.name;
  const lunar = lunarMonthNe(lunarEn, isEn) ?? lunarEn ?? "";
  const isAdhik = layer?.is_adhik === true || layer?.type === "adhik";
  const adhikName = lc?.adhik_maas?.name ?? adhikMonthEn;
  const isShuddha =
    !isAdhik &&
    Boolean(adhikName) &&
    Boolean(lunarEn) &&
    lunarEn!.toLowerCase() === adhikName!.toLowerCase();
  const prefix = isAdhik ? (isEn ? "Adhik " : "अधिक ") : isShuddha ? (isEn ? "Shuddha " : "शुद्ध ") : "";
  const phase = phaseOf(day);
  const phaseLabel = isEn
    ? phase === "shukla" ? "Shukla" : phase === "krishna" ? "Krishna" : ""
    : phase === "shukla" ? "शुक्ल" : phase === "krishna" ? "कृष्ण" : "";
  const pakshaWord = isEn ? (phaseLabel ? " Paksha" : "") : "पक्ष";
  return {
    key: `${prefix}${lunar}|${phase ?? ""}`,
    label: `${prefix}${lunar} ${phaseLabel}${pakshaWord}`.trim(),
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
function angaEnd(anga: CalendarDayAnga | undefined, d: (v: string | number) => string, isEn: boolean): string | null {
  const t = formatTimeShort(anga?.end);
  if (!t) return null;
  return isEn ? d(t) : `${d(t)} बजे`;
}

const KARTAVYA: Record<Phase, { ne: string; en: string }> = {
  krishna: {
    ne: "कृष्ण पक्षमा चन्द्रमा क्रमशः क्षीण हुँदै जान्छ। श्राद्ध, तर्पण र पितृकार्य, संयमित आहार, जप र दान शुभ मानिन्छ। एकादशीमा व्रत र अमावस्यामा पितृ-तर्पण गरिन्छ; नयाँ मांगलिक कार्य प्रायः शुक्ल पक्षमा सारिन्छ।",
    en: "During Krishna Paksha the Moon gradually wanes. Shraddha, tarpana and ancestral rites, moderate diet, japa and charity are considered auspicious. Ekadashi fasting and ancestral tarpana on Amavasya are observed; new auspicious ceremonies are usually moved to Shukla Paksha.",
  },
  shukla: {
    ne: "शुक्ल पक्षमा चन्द्रमा क्रमशः वृद्धि हुँदै जान्छ। विवाह, व्रतबन्ध, गृहप्रवेश, यात्रा र नयाँ कार्यारम्भ जस्ता मांगलिक कार्य शुभ मानिन्छन्। एकादशी व्रत र पूर्णिमामा सत्यनारायण पूजा/व्रत गरिन्छ।",
    en: "During Shukla Paksha the Moon gradually waxes. Auspicious ceremonies such as weddings, sacred-thread rites, house-warming, travel and new beginnings are considered favourable. Ekadashi fasting and Satyanarayan puja/fasting on the full moon are observed.",
  },
};

const th = "whitespace-nowrap text-sm font-semibold text-muted-foreground";
const subLine = "text-xs leading-tight text-muted-foreground";

/** ग्रह उदयास्त सङ्केत — heliacal rising/setting + motion abbreviations. */
const UDAYAST_LEGEND: { code: string; full: string; fullEn: string; meaning: string; meaningEn: string }[] = [
  { code: "व.उ.", full: "वक्र उदय", fullEn: "Retrograde rising", meaning: "ग्रह वक्र (उल्टो) अवस्थामा उदय भएको।", meaningEn: "The planet rises while retrograde (moving backward)." },
  { code: "बु.मा.उ.", full: "बुध मार्गी उदय", fullEn: "Mercury direct rising", meaning: "बुध मार्गी (सुल्टो) भएर उदय भएको।", meaningEn: "Mercury rises while direct (moving forward)." },
  { code: "वृ.व.उ.", full: "बृहस्पति वक्र उदय", fullEn: "Jupiter retrograde rising", meaning: "बृहस्पति (गुरु) वक्र अवस्थामा उदय भएको।", meaningEn: "Jupiter rises while retrograde." },
  { code: "शु.मा.उ.", full: "शुक्र मार्गी उदय", fullEn: "Venus direct rising", meaning: "शुक्र मार्गी भएर उदय भएको।", meaningEn: "Venus rises while direct." },
  { code: "श.मा.उ. ७अ.", full: "शनि मार्गी उदय, ७ अस्त", fullEn: "Saturn direct rising, sets on the 7th", meaning: "शनि मार्गी भएर उदय भएको र ७ गते अस्त हुने।", meaningEn: "Saturn rises while direct and sets on the 7th." },
];

/** गोचर / पापशान्ति घर-स्थिति सङ्केत. */
const GOCHAR_LEGEND: { code: string; meaning: string; meaningEn: string }[] = [
  { code: "पापाशाः", meaning: "पापशान्ति — कुण्डलीका अशुभ (पाप) ग्रहहरूको स्थिति।", meaningEn: "Papashanti — position of the malefic (papa) planets in the chart." },
  { code: "सू२", meaning: "सूर्य दोस्रो घर (भाव) मा रहेको।", meaningEn: "The Sun is in the second house (bhava)." },
  { code: "२७सू३", meaning: "२७ गते सूर्य तेस्रो घरमा प्रवेश गर्ने।", meaningEn: "The Sun enters the third house on the 27th." },
  { code: "म.१", meaning: "मंगल पहिलो घरमा रहेको।", meaningEn: "Mars is in the first house." },
  { code: "श.९", meaning: "शनि नवौँ घरमा रहेको।", meaningEn: "Saturn is in the ninth house." },
  { code: "रा.५ के.११", meaning: "राहु पाँचौँ र केतु एघारौँ घरमा रहेको।", meaningEn: "Rahu is in the fifth and Ketu in the eleventh house." },
];

/** Planet motion from the gochar `motion` / `is_retrograde` flags. */
function motionNe(g: { motion?: string; is_retrograde?: boolean }): { label: string; labelEn: string; vakri: boolean } {
  const vakri = g.is_retrograde === true || /vakr|retro/i.test(g.motion ?? "");
  return { label: vakri ? "वक्री" : "मार्गी", labelEn: vakri ? "Retrograde" : "Direct", vakri };
}

export function ChandraKranti() {
  const { lang, pick, digits: dg } = useLocale();
  const isEn = lang === "en";
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
      const seg = pakshaSegmentOf(d, adhikMonthEn, isEn);
      if (seg.key !== prevKey) {
        out[d.date_ad] = seg.label;
        prevKey = seg.key;
      }
    }
    return out;
  }, [days, adhikMonthEn, isEn]);

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
      const planetEn = grahaTableEn(ev.graha, ev.graha_ne);
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
      const labelEn =
        isMotion || isUdayast
          ? (ev.label_ne ?? "")
          : isRashi
          ? `→ ${ev.to_rashi ?? ev.to_rashi_ne ?? ""}`.trim()
          : `${ev.to_nakshatra ?? ev.to_nakshatra_ne ?? ""}${ev.to_pada ? ` pada ${ev.to_pada}` : ""}`.trim();
      const timeRaw = ev.entry_time_local_short ?? ev.entry_time_local?.split(" ")[1];
      const time = timeRaw
        ? formatVedicPatroTime(timeRaw, sunriseByDate[rowDateAd]) ?? timeRaw
        : undefined;

      (out[bsDay] ??= []).push({
        planetNe,
        planetEn,
        labelNe,
        labelEn,
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
        (d) => pakshaSegmentOf(d, adhikMonthEn, isEn),
      ),
    [days, allDays, ingressQ.data?.events, adhikMonthEn, isEn],
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

  const ritu = useMemo(() => {
    const dp = allDays.find((d) => d.panchanga?.ritu_ne)?.panchanga;
    if (!dp) return undefined;
    return isEn ? ((dp as { ritu?: string }).ritu ?? dp.ritu_ne) : dp.ritu_ne;
  }, [allDays, isEn]);

  const monthLabel = isEn
    ? `${BS_MONTH_NAMES[month - 1]} (${BS_MONTHS_NE[month - 1]})`
    : `${BS_MONTHS_NE[month - 1]} (${BS_MONTH_NAMES[month - 1]})`;
  const pakshaLabel = isEn
    ? paksha === "krishna" ? "Krishna Paksha" : paksha === "shukla" ? "Shukla Paksha" : "Full month"
    : paksha === "krishna" ? "कृष्णपक्ष" : paksha === "shukla" ? "शुक्लपक्ष" : "पूरा महिना";
  const atStart = year * 12 + (month - 1) <= BS_MIN_INDEX;
  const atEnd = year * 12 + (month - 1) >= BS_MAX_INDEX;

  const pageLoading =
    monthQ.isLoading ||
    specialQ.isLoading ||
    gocharQ.isLoading ||
    ingressQ.isLoading;

  useRouteLoading(pageLoading);

  return (
    <PageShell>
      <PageHeader
        icon={<Moon className="h-7 w-7 text-secondary" />}
        title={pick("दैनिक क्रान्ति", "Daily Kranti")}
        subtitle={pick(
          "पक्ष अनुसार दैनिक पञ्चाङ्ग — तिथि, नक्षत्र, योग, करण, सूर्योदय/अस्त, पर्व र ग्रह गोचर।",
          "Daily panchanga by paksha — tithi, nakshatra, yoga, karana, sunrise/sunset, festivals and planetary transits.",
        )}
      />

      {/* controls */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card/40 p-4">
        <div className="flex items-end gap-1">
          <button
            type="button"
            onClick={() => stepMonth(-1)}
            disabled={atStart}
            aria-label={pick("अघिल्लो महिना", "Previous month")}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => stepMonth(1)}
            disabled={atEnd}
            aria-label={pick("अर्को महिना", "Next month")}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          {pick("वर्ष (बि.सं.)", "Year (BS)")}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          >
            {Array.from({ length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 }, (_, i) => BS_SUPPORTED_START_YEAR + i).map((y) => (
              <option key={y} value={y}>{dg(y)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          {pick("महिना", "Month")}
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          >
            {BS_MONTHS_NE.map((m, i) => (
              <option key={m} value={i + 1}>{pick(m, BS_MONTH_NAMES[i])}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          {pick("पक्ष", "Paksha")}
          <div className="inline-flex overflow-hidden rounded-md border border-border">
            {([["all", pick("पूरै", "All")], ["krishna", pick("कृष्ण", "Krishna")], ["shukla", pick("शुक्ल", "Shukla")]] as const).map(([v, lbl]) => (
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
          {pick("स्थान", "Location")}
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
          <CalendarDays className="h-4 w-4" /> {pick("आज", "Today")}
        </button>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-lg font-bold text-foreground">
          {monthLabel} · {pakshaLabel}
        </h2>
        {monthQ.data?.year_bs ? (
          <span className="text-sm text-muted-foreground">{dg(monthQ.data.year_bs)} {pick("बि.सं.", "BS")}</span>
        ) : null}
        {ritu ? <span className="text-sm text-muted-foreground">· {pick("ऋतु", "Ritu")}: {ritu}</span> : null}
        {allDays.length ? (
          <span className="text-xs text-muted-foreground">· {dg(days.length)} {pick("दिन", "days")}</span>
        ) : null}
      </div>

      {monthHasAdhik && adhik?.month_name ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          {pick(
            <>
              <span className="font-semibold">अधिक मास:</span> यस वर्ष <span className="font-semibold">अधिक {lunarMonthNe(adhik.month_name)}</span> मास परेको छ — त्यसैले यो महिनामा अधिक र शुद्ध पक्षहरू छुट्टाछुट्टै देखाइएका छन्। (अधिक मास = मलमास / पुरुषोत्तम मास; यसमा सङ्क्रान्ति पर्दैन।)
            </>,
            <>
              <span className="font-semibold">Adhik Maas:</span> this year has an{" "}
              <span className="font-semibold">Adhik {lunarMonthNe(adhik.month_name, true)}</span> month — so the adhik and shuddha pakshas are shown separately for this month. (Adhik Maas = Malamas / Purushottam Maas; it contains no sankranti.)
            </>,
          )}
        </div>
      ) : null}

      <div className="flex w-full flex-col gap-8">
        <div className="w-full min-w-0 space-y-4">
        {/* daily table */}
        <div className="w-full overflow-x-auto rounded-xl border border-border">
          <Table className="w-full min-w-max text-sm">
            <TableHeader>
              <TableRow className="sticky top-0 z-10 bg-muted hover:bg-muted">
                <TableHead className={cn(th, "w-9 px-1")} aria-label={pick("विस्तार", "Expand")} />
                <TableHead className={th}>{pick("गते · ता.", "Date")}</TableHead>
                <TableHead className={th}>{pick("बा.", "Day")}</TableHead>
                <TableHead className={th}>{pick("तिथि", "Tithi")}</TableHead>
                <TableHead className={th}>{pick("नक्षत्र", "Nakshatra")}</TableHead>
                <TableHead className={th}>{pick("योग", "Yoga")}</TableHead>
                <TableHead className={th}>{pick("करण", "Karana")}</TableHead>
                <TableHead className={cn(th, "text-amber-600 dark:text-amber-400")}>{pick("सु.उ.", "Rise")}</TableHead>
                <TableHead className={cn(th, "text-indigo-600 dark:text-indigo-400")}>{pick("सु.अ.", "Set")}</TableHead>
                <TableHead className={th}>{pick("सूर्य राशि", "Sun sign")}</TableHead>
                <TableHead className={th}>{pick("चन्द्र राशि", "Moon sign")}</TableHead>
                <TableHead className={th}>{pick("ग्रहचार / उदयास्त (बजे)", "Transits / rise-set")}</TableHead>
                <TableHead className={th}>{pick("पर्व", "Festival")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthQ.isError ? (
                <TableRow><TableCell colSpan={COL_SPAN} className="py-8 text-center text-muted-foreground">{pick("विवरण ल्याउन सकिएन। पुनः प्रयास गर्नुहोस्।", "Could not load details. Please try again.")}</TableCell></TableRow>
              ) : days.length === 0 ? (
                <TableRow><TableCell colSpan={COL_SPAN} className="py-8 text-center text-muted-foreground">{pick("यो पक्षमा कुनै दिन भेटिएन।", "No days found in this paksha.")}</TableCell></TableRow>
              ) : (
                days.map((d) => {
                  const det = d.panchanga;
                  const tithiEnd = angaEnd(det?.tithi, dg, isEn);
                  const nakEnd = angaEnd(det?.nakshatra, dg, isEn);
                  const yogaEnd = angaEnd(det?.yoga, dg, isEn);
                  const karanaEnd = angaEnd(det?.karana, dg, isEn);
                  const sunRashi = pick(det?.surya_rashi_ne, det?.surya_rashi);
                  const moonRashi = pick(det?.chandra_rashi_ne, det?.chandra_rashi);
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
                          aria-label={pick(`${dg(d.day)} गतेको लग्न र ग्रहस्पष्ट`, `Lagna & planets for day ${dg(d.day)}`)}
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
                          <span className={cn("font-semibold", isSaturday || hasFestival ? "text-rose-600 dark:text-rose-400" : "text-foreground")}>{dg(d.day)}</span>
                        </span>
                        <span className="ml-1.5 text-xs text-muted-foreground">{fmtAd(d.date_ad)}</span>
                      </TableCell>
                      <TableCell className={cn("whitespace-nowrap", isSaturday && "font-medium text-rose-600 dark:text-rose-400")}>{pick(d.weekday_ne ?? d.weekday, d.weekday_en ?? d.weekday)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div><span className="text-muted-foreground">{pakshaShort(d, isEn)}</span> {pick(d.tithi_ne ?? d.tithi, d.tithi ?? d.tithi_ne) ?? "—"}</div>
                        {tithiEnd ? <div className={subLine}>{pick(`${tithiEnd} सम्म`, `until ${tithiEnd}`)}</div> : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div>{pick(d.nakshatra_ne ?? d.nakshatra, d.nakshatra ?? d.nakshatra_ne) ?? "—"}</div>
                        {nakEnd ? <div className={subLine}>{pick(`${nakEnd} सम्म`, `until ${nakEnd}`)}</div> : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div>{pick(d.yoga_ne ?? d.yoga, d.yoga ?? d.yoga_ne) ?? "—"}</div>
                        {yogaEnd ? <div className={subLine}>{pick(`${yogaEnd} सम्म`, `until ${yogaEnd}`)}</div> : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div>{pick(d.karana_ne ?? d.karana, d.karana ?? d.karana_ne) ?? "—"}</div>
                        {karanaEnd ? <div className={subLine}>{pick(`${karanaEnd} सम्म`, `until ${karanaEnd}`)}</div> : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-amber-600 dark:text-amber-400">{d.sunrise ? dg(formatTimeShort(d.sunrise) ?? d.sunrise) : "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-indigo-600 dark:text-indigo-400">{d.sunset ? dg(formatTimeShort(d.sunset) ?? d.sunset) : "—"}</TableCell>
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
                                <span className="text-foreground">{pick(ev.labelNe, ev.labelEn)}</span>{" "}
                                <span className="text-secondary">{pick(ev.planetNe, ev.planetEn)}</span>
                                {ev.time ? (
                                  <span className="text-muted-foreground"> {dg(ev.time)}</span>
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
              {pick("दैनिक लग्न आरम्भ समयतालिका (पूरा महिना)", "Daily lagna start timetable (full month)")}
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                {pick(
                  "प्रत्येक गते सूर्योदयदेखि अर्को सूर्योदयसम्म कुन राशि कहिले लग्नमा आउँछ।",
                  "For each day, which rashi rises as the lagna and when, from sunrise to the next sunrise.",
                )}
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
              {pick("उदयकालिक सूर्यादिग्रहस्पष्ट (पूरा महिना)", "Planetary positions at sunrise (full month)")}
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                {pick(
                  "सूर्योदयको क्षणमा ग्रहहरूको राश्यादि स्थिति र दैनिक बेलान्तर।",
                  "The planets' rashi positions at the moment of sunrise, and the daily time-difference.",
                )}
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
              {pick("गणना सूचना र विशेष दिनहरू", "Calculation notes & special days")}
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
                    <div className="text-sm text-muted-foreground">{pick("सूर्योदय", "Sunrise")}</div>
                    <div className="font-semibold text-foreground">{ref.sunrise ? dg(formatTimeShort(ref.sunrise) ?? ref.sunrise) : "—"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-border p-3">
                  <Sunset className="h-5 w-5 text-indigo-500" />
                  <div className="text-sm">
                    <div className="text-sm text-muted-foreground">{pick("सूर्यास्त", "Sunset")}</div>
                    <div className="font-semibold text-foreground">{ref.sunset ? dg(formatTimeShort(ref.sunset) ?? ref.sunset) : "—"}</div>
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
            <h3 className="mb-2 text-sm font-semibold text-foreground">{pick("ग्रह गोचर र अर्को सङ्क्रान्ति", "Planetary transits & next sankranti")}</h3>
            {grahas.length === 0 ? (
              <p className="text-sm text-muted-foreground">{gocharQ.isLoading ? pick("लोड हुँदैछ…", "Loading…") : pick("विवरण उपलब्ध छैन।", "No details available.")}</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {grahas.map((g) => (
                  <li key={g.key} className="flex items-baseline justify-between gap-2">
                    <span className="text-foreground">
                      <span className="mr-1 text-secondary">{g.symbol}</span>
                      {pick(g.name_ne, g.name_vedic ?? g.name_ne)}
                      <span className="ml-1 text-muted-foreground">{pick(grahaRashiNe(g), g.rashi ?? grahaRashiNe(g)) ?? ""}</span>
                    </span>
                    {g.next_pada_entry ? (
                      <span className="shrink-0 text-right text-sm text-muted-foreground">
                        {pick(g.next_pada_entry.label_ne, g.next_pada_entry.to_rashi ?? g.next_pada_entry.label_ne)}
                        <br />
                        {dg(g.next_pada_entry.entry_time_local_short ?? g.next_pada_entry.entry_time_local ?? "")}
                      </span>
                    ) : g.next_rashi_entry ? (
                      <span className="shrink-0 text-right text-sm text-muted-foreground">
                        → {pick(g.next_rashi_entry.to_rashi_ne ?? rashiEnToNe(g.next_rashi_entry.to_rashi) ?? g.next_rashi_entry.to_rashi, g.next_rashi_entry.to_rashi ?? g.next_rashi_entry.to_rashi_ne)}
                        <br />
                        {dg(g.next_rashi_entry.entry_time_local)}
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
              {pakshaLabel} {pick("कर्तव्य", "duties")}
            </h3>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              {paksha === "all" ? (
                <>
                  <p>{pick(KARTAVYA.krishna.ne, KARTAVYA.krishna.en)}</p>
                  <p>{pick(KARTAVYA.shukla.ne, KARTAVYA.shukla.en)}</p>
                </>
              ) : (
                <p>{pick(KARTAVYA[paksha].ne, KARTAVYA[paksha].en)}</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      <section className="rounded-xl border border-border">
        <header className="flex items-center gap-1.5 border-b border-border px-4 py-3">
          <Sparkles className="h-4 w-4 text-secondary" />
          <h3 className="text-sm font-semibold text-foreground">{pick("ग्रह स्पष्ट, उदयास्त र गोचर सङ्केत", "Planet positions, rise-set & transit legend")}</h3>
          {gocharQ.data?.date_ad ? (
            <span className="ml-auto text-sm text-muted-foreground">
              {pick(
                `${formatGocharBsLabel(gocharQ.data.date_bs, gocharQ.data.date_ad) ?? fmtAd(gocharQ.data.date_ad)} को स्थिति`,
                `Position on ${formatGocharBsLabel(gocharQ.data.date_bs, gocharQ.data.date_ad) ?? fmtAd(gocharQ.data.date_ad)}`,
              )}
            </span>
          ) : null}
        </header>

        <div className="grid gap-x-8 gap-y-6 p-4 md:grid-cols-2">
          {/* live graha spashta (degree · kala · vikala) + motion */}
          <div className="md:col-span-2">
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {pick("ग्रह स्पष्ट (अंश° कला′ विकला″)", "Planet positions (deg° kala′ vikala″)")}
            </h4>
            {grahas.length === 0 ? (
              <p className="text-sm text-muted-foreground">{gocharQ.isLoading ? pick("लोड हुँदैछ…", "Loading…") : pick("विवरण उपलब्ध छैन।", "No details available.")}</p>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-4">
                {grahas.map((g) => {
                  const m = motionNe(g);
                  return (
                    <div key={g.key} className="flex items-baseline gap-1.5 text-sm">
                      <span className="text-secondary">{g.symbol}</span>
                      <span className="text-foreground">{pick(g.name_ne, g.name_vedic ?? g.name_ne)}</span>
                      <span className="text-muted-foreground">{pick(grahaRashiNe(g), g.rashi ?? grahaRashiNe(g)) ?? ""}</span>
                      {g.dms_in_rashi ? <span className="text-foreground">{dg(g.dms_in_rashi)}</span> : null}
                      <span
                        className={cn(
                          "ml-auto shrink-0 rounded px-1.5 text-xs",
                          m.vakri ? "bg-rose-500/15 text-rose-600 dark:text-rose-300" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
                        )}
                      >
                        {pick(m.label, m.labelEn)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {pick(
                <>प्रत्येक पक्षको आरम्भमा ग्रहहरूको स्पष्ट स्थान अंश°, कला′, विकला″ (र प्रति-विकला) मा दिइन्छ — जस्तै “१३ ६ २९ ४०” = १३ अंश ६ कला २९ विकला ४० प्रति-विकला। <span className="text-rose-600 dark:text-rose-300">वक्री</span> = उल्टो गति, <span className="text-emerald-600 dark:text-emerald-300">मार्गी</span> = सुल्टो गति।</>,
                <>At the start of each paksha, each planet's exact position is given in degrees°, kala′, vikala″ (and prati-vikala) — e.g. “13 6 29 40” = 13 deg 6 kala 29 vikala 40 prati-vikala. <span className="text-rose-600 dark:text-rose-300">Vakri</span> = retrograde (backward) motion, <span className="text-emerald-600 dark:text-emerald-300">Margi</span> = direct (forward) motion.</>,
              )}
            </p>
          </div>

          {/* udayast symbol legend */}
          <div>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {pick("ग्रह उदयास्त सङ्केत", "Planet rise-set symbols")}
            </h4>
            <dl className="space-y-1.5">
              {UDAYAST_LEGEND.map((it) => (
                <div key={it.code} className="flex gap-2 text-sm">
                  <dt className="w-24 shrink-0">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-secondary">{it.code}</span>
                  </dt>
                  <dd className="text-muted-foreground">
                    <span className="text-foreground">{pick(it.full, it.fullEn)}</span> — {pick(it.meaning, it.meaningEn)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* gochar / papashanti house legend */}
          <div>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {pick("गोचर / पापशान्ति घर-सङ्केत", "Transit / Papashanti house symbols")}
            </h4>
            <dl className="space-y-1.5">
              {GOCHAR_LEGEND.map((it) => (
                <div key={it.code} className="flex gap-2 text-sm">
                  <dt className="w-20 shrink-0">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-secondary">{it.code}</span>
                  </dt>
                  <dd className="text-muted-foreground">{pick(it.meaning, it.meaningEn)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {pick(
                <><span className="font-semibold text-foreground">दशा कोष्ठक:</span> जन्म-समयमा बाँकी विंशोत्तरी दशाको वर्ष/महिना/दिन। <span className="font-semibold text-foreground">समय सुधार:</span> मुद्रणमा “उ” वा “०” जस्ता सङ्केतले शून्य अंश/कला जनाउँछ।</>,
                <><span className="font-semibold text-foreground">Dasha bracket:</span> the years/months/days of Vimshottari dasha remaining at birth. <span className="font-semibold text-foreground">Time correction:</span> in print, symbols like “u” or “0” indicate zero degrees/kala.</>,
              )}
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

export default ChandraKranti;
