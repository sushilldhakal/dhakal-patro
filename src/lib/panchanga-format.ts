import type { CalendarDay, Festival, PanchangaDay } from "./api";
import { adToBS, BS_MONTH_NAMES, BS_MONTHS_NE } from "./bs-calendar";
import { GRAHA_NAME } from "@/lib/graha-details";
import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { formatLocaleDigits } from "@/i18n/digits";

export function toNepaliDigits(value: string | number): string {
  return formatLocaleDigits(value);
}

export function formatTimeShort(time?: string | null): string | undefined {
  if (!time) return undefined;
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return time;
  const h = match[1]!.padStart(2, "0");
  const m = match[2]!;
  return `${h}:${m}`;
}

/** Clock time with Nepali digits (e.g. ०७:३२). */
export function formatClockNepali(time?: string | null): string | undefined {
  if (!time) return undefined;
  const short = formatTimeShort(time) ?? time;
  return toNepaliDigits(short);
}

export function formatGhatiEnd(clock?: string | null): string | undefined {
  if (!clock) return undefined;
  const parts = clock.split(":").map(Number);
  const ghati = parts[0];
  const pala = parts[1];
  if (ghati == null || pala == null) return undefined;
  const totalMinutes = ghati * 24 + pala;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

type AngaDetail = {
  name_ne?: string;
  name?: string;
  end_ghati_clock?: string;
  end_local_time?: string;
  end_hours_clock?: string;
  next?: { name_ne?: string; name?: string; end_ghati_clock?: string; end_local_time?: string };
};

export function formatAngaTransition(anga?: AngaDetail | null): string | undefined {
  if (!anga) return undefined;
  const current = anga.name_ne ?? anga.name;
  if (!current) return undefined;

  const endTime =
    formatTimeShort(anga.end_local_time) ??
    formatTimeShort(anga.end_hours_clock) ??
    formatGhatiEnd(anga.end_ghati_clock);

  const next = anga.next?.name_ne ?? anga.next?.name;
  if (!next) return current;
  if (!endTime) return `${current}, पछि ${next}`;

  const nextEnd =
    formatTimeShort(anga.next?.end_local_time) ??
    formatGhatiEnd(anga.next?.end_ghati_clock);

  if (nextEnd) {
    return `${current}, ${toNepaliDigits(endTime)} बजेपछि ${next}, ${toNepaliDigits(nextEnd)} बजेउप्रान्त गर`;
  }
  return `${current}, ${toNepaliDigits(endTime)} बजेपछि ${next}`;
}

type AngaPatro = {
  name_ne?: string;
  name?: string;
  end_local_time?: string;
  end_hours_clock?: string;
  end_ghati_clock?: string;
  next?: AngaPatro;
};

function patroAngaEndClock(anga: AngaPatro): string | undefined {
  const t =
    formatTimeShort(anga.end_local_time) ??
    formatTimeShort(anga.end_hours_clock) ??
    formatGhatiEnd(anga.end_ghati_clock);
  if (!t) return undefined;
  const [hh, mm] = t.split(":");
  if (!hh || !mm) return toNepaliDigits(t);
  return toNepaliDigits(`${hh.padStart(2, "0")}:${mm.padStart(2, "0")}`);
}

function angaEndsNextDay(anga: AngaPatro): boolean {
  if (anga.end_hours_clock) {
    const h = Number(anga.end_hours_clock.split(":")[0]);
    if (!Number.isNaN(h) && h >= 24) return true;
  }
  if (anga.end_ghati_clock) {
    const gh = Number(anga.end_ghati_clock.split(":")[0]);
    if (!Number.isNaN(gh) && gh >= 60) return true;
  }
  const end =
    formatTimeShort(anga.end_local_time) ??
    formatTimeShort(anga.end_hours_clock);
  if (end) {
    const h = Number(end.split(":")[0]);
    if (!Number.isNaN(h) && h < 5) return true;
  }
  return false;
}

/** Patro sidebar — शुक्ल त्रयोदशी•००:४३ बाट शुक्ल चतुर्दशी(अर्को दिन) */
export function formatAngaPatroChain(anga?: AngaPatro | null): string | undefined {
  if (!anga) return undefined;
  const first = anga.name_ne ?? anga.name;
  if (!first) return undefined;
  let result = first;
  let node: AngaPatro | undefined = anga;
  while (node?.next) {
    const end = patroAngaEndClock(node);
    const nextNode: AngaPatro = node.next;
    const nextName = nextNode.name_ne ?? nextNode.name ?? "";
    if (!end || !nextName) break;
    const isLast = !nextNode.next;
    const dayNote = isLast && angaEndsNextDay(node) ? "(अर्को दिन)" : "";
    result += `•${end} बाट ${nextName}${dayNote}`;
    node = nextNode;
  }
  return result;
}

/** Transition tail only — •००:४३ बाट शुक्ल चतुर्दशी(अर्को दिन) */
export function formatAngaPatroTransitionHint(
  anga?: AngaPatro | null,
): string | undefined {
  const full = formatAngaPatroChain(anga);
  const name = anga?.name_ne ?? anga?.name;
  if (!full || !name || full === name) return undefined;
  if (full.startsWith(name)) return full.slice(name.length);
  return full;
}

export function formatPakshaShortNe(p: PanchangaDay): string | undefined {
  const detail = getPanchangaDetail(p);
  const label =
    (detail?.paksha as { label_ne?: string } | undefined)?.label_ne ??
    p.paksha?.label_ne ??
    p.paksha_ne;
  if (!label) return undefined;
  return label.replace(/\s*पक्ष\s*$/u, "").trim();
}

export function formatPatroBelaantar(c?: SolarCorrection): string | undefined {
  if (!c || c.minutes == null || c.seconds == null) return undefined;
  const mm = toNepaliDigits(c.minutes);
  const ss = toNepaliDigits(String(c.seconds).padStart(2, "0"));
  const prefix = c.sign === "rin" ? "(-) " : "(+) ";
  return `${prefix}${mm}:${ss}`;
}

/** Patro label सूर्यक्रान्ति — maps to देशान्तर correction. */
export function formatPatroDeshaantar(c?: SolarCorrection): string | undefined {
  if (!c || c.minutes == null || c.seconds == null) return undefined;
  const mm = toNepaliDigits(c.minutes);
  const ss = toNepaliDigits(String(c.seconds).padStart(2, "0"));
  if (c.sign === "rin") return `(-) ${mm}:${ss}`;
  return `उ ${mm}:${ss}`;
}

export function getPanchangaDetail(p: PanchangaDay) {
  return (p as PanchangaDay & { detail?: Record<string, unknown> }).detail as
    | Record<string, unknown>
    | undefined;
}

export function getLagnaSpans(p: PanchangaDay) {
  const detail = getPanchangaDetail(p);
  const fromTop = p.lagna_spans;
  const fromDetail = detail?.lagna_spans as PanchangaDay["lagna_spans"];
  if (fromTop?.length) return fromTop;
  if (fromDetail?.length) return fromDetail;
  return undefined;
}

export function getSunrise(p: PanchangaDay): string | undefined {
  const detail = getPanchangaDetail(p);
  const fromDetail = (detail?.sunrise as { local_time_short?: string } | undefined)?.local_time_short;
  if (fromDetail) return fromDetail;
  if (typeof p.sunrise === "object") return p.sunrise?.local_time_short;
  if (typeof p.sunrise === "string") return p.sunrise;
  return p.sun?.sunrise;
}

export function getSunset(p: PanchangaDay): string | undefined {
  const detail = getPanchangaDetail(p);
  const fromDetail = (detail?.sunset as { local_time_short?: string } | undefined)?.local_time_short;
  if (fromDetail) return fromDetail;
  if (typeof p.sunset === "object") return p.sunset?.local_time_short;
  if (typeof p.sunset === "string") return p.sunset;
  return p.sun?.sunset;
}

export function getSunriseDisplay(p: PanchangaDay): string | undefined {
  return formatClockNepali(getSunrise(p));
}

export function getSunsetDisplay(p: PanchangaDay): string | undefined {
  return formatClockNepali(getSunset(p));
}

type SolarCorrection = {
  minutes?: number;
  seconds?: number;
  sign?: "dhan" | "rin";
  sign_ne?: string;
  name_ne?: string;
  label_ne?: string;
};

export type SolarCorrections = {
  belaantar?: SolarCorrection;
  deshaantar?: SolarCorrection;
  ishtakaal_note_ne?: string;
  sunrise_includes_corrections?: boolean;
};

export function getSolarCorrections(p: PanchangaDay): SolarCorrections | undefined {
  const detail = getPanchangaDetail(p);
  return (
    (detail?.solar_corrections as SolarCorrections | undefined) ??
    (p as PanchangaDay & { solar_corrections?: SolarCorrections }).solar_corrections
  );
}

/** Signed minutes — धन (+) / ऋण (−) per Surya Panchanga convention. */
export function signedSolarCorrectionMinutes(c?: SolarCorrection): number {
  if (!c || c.minutes == null) return 0;
  const total = c.minutes + (c.seconds ?? 0) / 60;
  return c.sign === "rin" ? -total : total;
}

export function totalSolarCorrectionMinutes(solar?: SolarCorrections): number {
  if (!solar) return 0;
  return (
    signedSolarCorrectionMinutes(solar.belaantar) +
    signedSolarCorrectionMinutes(solar.deshaantar)
  );
}

type RituBlock = { name_ne?: string; season?: string };

export function getRituDisplayNe(p?: PanchangaDay | null): string | undefined {
  if (!p) return undefined;
  const ritu = getPanchangaDetail(p)?.ritu as RituBlock | undefined;
  if (ritu?.name_ne) return ritu.name_ne;
  if (typeof p.ritu === "object" && p.ritu?.name_ne) return p.ritu.name_ne;
  return p.ritu_ne;
}

export function getRituSeason(p?: PanchangaDay | null): string | undefined {
  if (!p) return undefined;
  const ritu = getPanchangaDetail(p)?.ritu as RituBlock | undefined;
  if (ritu?.season) return ritu.season;
  if (typeof p.ritu === "object" && p.ritu?.season) return p.ritu.season;
  return undefined;
}

export function formatSolarCorrectionDisplay(c?: SolarCorrection): string | undefined {
  if (!c || c.minutes == null || c.seconds == null) return undefined;
  const prefix = c.sign === "rin" ? "-" : "+";
  const body = `${prefix}${c.minutes} मि ${String(c.seconds).padStart(2, "0")} से`;
  const signNe = c.sign_ne ? ` (${c.sign_ne})` : "";
  return `${toNepaliDigits(body)}${signNe}`;
}

type MoonTimeBlock = { local?: string; local_time_short?: string };

function parseTimeToMinutes(time?: string | null): number | null {
  if (!time) return null;
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const dt = new Date(y, m - 1, d + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** BS date label for a civil (AD) calendar day, e.g. जेठ २९. */
function formatEventDateBsNepali(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return toNepaliDigits(isoDate);
  const bs = adToBS(new Date(y, m - 1, d));
  return `${BS_MONTHS_NE[bs.month - 1]} ${toNepaliDigits(bs.day)}`;
}

/** BS date from YYYY-MM-DD (BS era), e.g. जेठ १५, वि.सं. २०८२. */
export function formatBsIsoDateNepali(
  bsIso?: string | null,
  opts?: { includeYear?: boolean; lang?: string }
): string | undefined {
  if (!bsIso) return undefined;
  const [ys, ms, ds] = bsIso.split("-");
  const year = Number(ys);
  const month = Number(ms);
  const day = Number(ds);
  if (!month || !day) return undefined;
  const isEn = (opts?.lang ?? "ne").slice(0, 2) === "en";
  const months = isEn ? BS_MONTH_NAMES : BS_MONTHS_NE;
  const era = isEn ? "BS" : "वि.सं.";
  const label = `${months[month - 1]} ${formatLocaleDigits(day, opts?.lang)}`;
  if (opts?.includeYear === false || !year) return label;
  return `${label}, ${era} ${formatLocaleDigits(year, opts?.lang)}`;
}

export function formatHolidayBsDisplay(
  holiday: {
    bs_start_date?: string;
    start_date: string;
  },
  lang?: string,
): string {
  const fromApi = formatBsIsoDateNepali(holiday.bs_start_date, { lang });
  if (fromApi) return fromApi;
  const [y, m, d] = holiday.start_date.split("-").map(Number);
  if (!y || !m || !d) return "";
  const bs = adToBS(new Date(y, m - 1, d));
  const isEn = (lang ?? "ne").slice(0, 2) === "en";
  const months = isEn ? BS_MONTH_NAMES : BS_MONTHS_NE;
  const era = isEn ? "BS" : "वि.सं.";
  return `${months[bs.month - 1]} ${formatLocaleDigits(bs.day, lang)}, ${era} ${formatLocaleDigits(bs.year, lang)}`;
}

function getMoonTimeBlock(p: PanchangaDay, key: "moonrise" | "moonset"): MoonTimeBlock | undefined {
  const detail = getPanchangaDetail(p);
  const fromDetail = detail?.[key] as MoonTimeBlock | undefined;
  if (fromDetail?.local_time_short) return fromDetail;
  const top = p[key];
  if (top?.local_time_short) return top;
  const fallback = key === "moonrise" ? p.moon?.rise : p.moon?.set;
  if (fallback) return { local_time_short: fallback };
  return undefined;
}

export function getMoonrise(p: PanchangaDay): string | undefined {
  return getMoonTimeBlock(p, "moonrise")?.local_time_short;
}

export function getMoonset(p: PanchangaDay): string | undefined {
  return getMoonTimeBlock(p, "moonset")?.local_time_short;
}

/** AD date of moonrise/moonset (often the next civil day within a sunrise-to-sunrise panchanga day). */
export function resolveMoonEventAdDate(
  p: PanchangaDay,
  key: "moonrise" | "moonset",
  block: MoonTimeBlock
): string | undefined {
  const dayDate = p.date_ad;
  if (!dayDate) return block.local?.slice(0, 10);

  const eventDate = block.local?.slice(0, 10);
  const eventMin = parseTimeToMinutes(block.local_time_short);
  const sunriseMin = parseTimeToMinutes(getSunrise(p));

  if (eventDate && eventDate !== dayDate) {
    return eventDate;
  }

  if (key === "moonrise" && eventMin != null && sunriseMin != null && eventMin < sunriseMin) {
    return addDaysIso(dayDate, 1);
  }

  return eventDate ?? dayDate;
}

/** Always show AD date + time — moonrise/moonset often fall on the next civil date. */
export function formatMoonEventDisplay(p: PanchangaDay, key: "moonrise" | "moonset"): string | undefined {
  const block = getMoonTimeBlock(p, key);
  if (!block?.local_time_short) return undefined;
  const time = formatClockNepali(block.local_time_short);
  const eventDate = resolveMoonEventAdDate(p, key, block);
  if (!time) return undefined;
  if (!eventDate) return time;
  return `${formatEventDateBsNepali(eventDate)} · ${time}`;
}

export function formatMonthMoonEventDisplay(day: {
  date_ad: string;
  sunrise?: string;
  moonrise?: string;
  moonrise_local?: string;
  moonset?: string;
  moonset_local?: string;
}, key: "moonrise" | "moonset"): string | undefined {
  const time = key === "moonrise" ? day.moonrise : day.moonset;
  if (!time) return undefined;
  const local = key === "moonrise" ? day.moonrise_local : day.moonset_local;
  const block: MoonTimeBlock = { local_time_short: time, local };
  const pseudo = { date_ad: day.date_ad, sunrise: day.sunrise } as PanchangaDay;
  const eventDate = resolveMoonEventAdDate(pseudo, key, block);
  const timeNe = formatClockNepali(time);
  if (!timeNe) return undefined;
  if (!eventDate) return timeNe;
  return `${formatEventDateBsNepali(eventDate)} · ${timeNe}`;
}

/** Month patro grid — clock only (no BS date prefix when moon event is next/prior civil day). */
export function formatMonthMoonTimeOnly(day: {
  moonrise?: string;
  moonset?: string;
}, key: "moonrise" | "moonset"): string | undefined {
  const time = key === "moonrise" ? day.moonrise : day.moonset;
  if (!time) return undefined;
  return formatClockNepali(time);
}

export function getMonthDayChandraRashi(
  day: CalendarDay,
  lang: "ne" | "en" | "hi",
): string | undefined {
  const moon = day.panchanga?.planets?.moon;
  const moonRashiNe =
    moon?.rashi_ne ??
    (moon?.rashi_no != null ? rashiNeFromNumber(moon.rashi_no) : undefined);
  const moonRashiEn = moon?.rashi ?? moon?.rashi_name;

  const ne =
    day.chandra_rashi_ne ??
    day.panchanga?.chandra_rashi_ne ??
    moonRashiNe ??
    day.chandra_rashi ??
    day.panchanga?.chandra_rashi ??
    moonRashiEn;
  const en =
    day.chandra_rashi ??
    day.panchanga?.chandra_rashi ??
    moonRashiEn ??
    day.chandra_rashi_ne ??
    day.panchanga?.chandra_rashi_ne ??
    moonRashiNe;

  const raw = lang === "en" ? en : ne;
  if (!raw) return undefined;
  return lang === "en" ? raw : formatRashiDisplayNe(raw) ?? raw;
}

export function getMonthDayNakshatra(
  day: CalendarDay,
  lang: "ne" | "en" | "hi",
): string | undefined {
  const ne =
    day.nakshatra_ne ??
    day.panchanga?.nakshatra?.name_ne ??
    day.nakshatra ??
    day.panchanga?.nakshatra?.name;
  const en =
    day.nakshatra ??
    day.panchanga?.nakshatra?.name ??
    day.nakshatra_ne ??
    day.panchanga?.nakshatra?.name_ne;

  const raw = lang === "en" ? en : ne;
  return raw || undefined;
}

export function getMoonriseDisplay(p: PanchangaDay): string | undefined {
  return formatMoonEventDisplay(p, "moonrise");
}

export function getMoonsetDisplay(p: PanchangaDay): string | undefined {
  return formatMoonEventDisplay(p, "moonset");
}

export function getVaaraNe(p: PanchangaDay, fallback?: string): string | undefined {
  const detail = getPanchangaDetail(p);
  return (
    (detail?.vaara as { name_ne?: string } | undefined)?.name_ne ??
    fallback
  );
}

export function formatBsTitle(p: PanchangaDay, fallbackDay?: number, fallbackMonth?: number, fallbackYear?: number): string {
  const detail = getPanchangaDetail(p);
  const bs = (detail?.bs_date ?? p.bs_date) as { year?: number; month?: number; day?: number; month_name?: string } | undefined;
  const weekdayEn = (detail?.vaara as { name_english?: string } | undefined)?.name_english ?? p.weekday;

  if (bs?.month_name && bs.day && bs.year) {
    return `${bs.month_name} ${bs.day}, ${bs.year}${weekdayEn ? `, ${weekdayEn}` : ""}`;
  }
  if (fallbackMonth && fallbackDay && fallbackYear) {
    return `${BS_MONTH_NAMES[fallbackMonth - 1]} ${fallbackDay}, ${fallbackYear}${weekdayEn ? `, ${weekdayEn}` : ""}`;
  }
  return p.display?.bs_ne ?? p.date_bs ?? "—";
}

export function formatAdTitle(p: PanchangaDay, dateAd: string): string {
  if (p.display?.gregorian_en) {
    const d = new Date(dateAd);
    return d.toLocaleDateString("en", { day: "2-digit", month: "long", year: "numeric" });
  }
  const d = new Date(dateAd);
  return d.toLocaleDateString("en", { day: "2-digit", month: "long", year: "numeric" });
}

export function formatAdShort(_p: PanchangaDay, dateAd: string): string {
  const d = new Date(dateAd);
  return d.toLocaleDateString("en", { day: "2-digit", month: "short", year: "numeric" });
}

function titleizeWords(text: string): string {
  return text.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

function tithiNameOnly(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const stripped = name
    .replace(/^(शुक्ल|कृष्ण)\s*/i, "")
    .replace(/^(Shukla|Krishna)\s*/i, "")
    .trim();
  return stripped || name;
}

function pakshaShortFromPanchanga(p: PanchangaDay): { ne?: string; en?: string } {
  const detail = getPanchangaDetail(p);
  const paksha = detail?.paksha as { label_en?: string; label_ne?: string; name?: string } | undefined;
  const labelNe = paksha?.label_ne ?? p.paksha?.label_ne ?? p.paksha_ne ?? "";
  const labelEn = paksha?.label_en ?? p.paksha?.label_en ?? "";
  const name = (paksha?.name ?? (typeof p.paksha === "string" ? p.paksha : "")).toLowerCase();

  if (labelNe.includes("शुक्ल") || /shukla/i.test(labelEn) || name === "shukla") {
    return { ne: "शुक्ल", en: "Shukla" };
  }
  if (labelNe.includes("कृष्ण") || /krishna/i.test(labelEn) || name === "krishna") {
    return { ne: "कृष्ण", en: "Krishna" };
  }
  return {};
}

/** e.g. शुक्ल अष्टमी / Krishna Ashtami */
export function formatTithiWithPaksha(p: PanchangaDay, lang: "ne" | "en" = "ne"): string | undefined {
  const detail = getPanchangaDetail(p);
  const tithi = (detail?.tithi ?? p.tithi) as AngaDetail | undefined;
  const tithiNe = tithiNameOnly(tithi?.name_ne ?? p.tithi?.name_ne);
  const tithiEn = tithiNameOnly(tithi?.name ?? p.tithi?.name);
  const short = pakshaShortFromPanchanga(p);

  if (lang === "en") {
    if (short.en && tithiEn) return `${short.en} ${tithiEn}`;
    return tithiEn ?? tithiNe;
  }
  if (short.ne && tithiNe) return `${short.ne} ${tithiNe}`;
  return tithiNe ?? tithiEn;
}

export function formatPakshaTithiLine(p: PanchangaDay): string | undefined {
  const detail = getPanchangaDetail(p);
  const paksha = detail?.paksha as { label_en?: string; label_ne?: string; name?: string } | undefined;
  const tithi = (detail?.tithi ?? p.tithi) as AngaDetail | undefined;

  const tithiEn = tithi?.name ?? p.tithi?.name;
  const pakshaEn = paksha?.label_en ?? p.paksha?.label_en;
  if (pakshaEn && tithiEn) {
    const base = pakshaEn.replace(/\s*paksha$/i, "").trim();
    return `${titleizeWords(base)} ${tithiEn}`;
  }

  const labelNe = paksha?.label_ne ?? p.paksha?.label_ne;
  const tithiNe = tithi?.name_ne ?? p.tithi?.name_ne;
  if (labelNe && tithiNe) return `${labelNe} ${tithiNe}`;
  return pakshaEn ?? tithiEn ?? labelNe ?? tithiNe;
}

export function getPakshaEmoji(p: PanchangaDay): string {
  const detail = getPanchangaDetail(p);
  const paksha = detail?.paksha as { name?: string } | undefined;
  const name = (paksha?.name ?? "").toLowerCase();
  return name === "shukla" ? "🌓" : "🌗";
}

export function formatPakshaNepaliDisplay(p: PanchangaDay): string | undefined {
  const detail = getPanchangaDetail(p);
  const paksha = detail?.paksha as { label_ne?: string } | undefined;
  const label = paksha?.label_ne ?? p.paksha?.label_ne ?? p.paksha_ne;
  if (!label) return undefined;
  return `${label} ${getPakshaEmoji(p)}`;
}

/** Short NS subtitle e.g. "अनालागा, 1146 N.S." */
export function formatNepalSambatSubtitle(p: PanchangaDay): string | undefined {
  const detail = getPanchangaDetail(p);
  const ns = detail?.ns_date as { paksha_ne?: string; year?: number } | undefined;
  if (ns?.paksha_ne && ns.year != null) {
    return `${ns.paksha_ne}, ${ns.year} N.S.`;
  }
  const display = detail?.display as { ns_ne?: string } | undefined;
  return display?.ns_ne ?? p.display?.ns_ne;
}

export function formatNepalSambatDisplay(p: PanchangaDay): string | undefined {
  const detail = getPanchangaDetail(p);
  const display = detail?.display as { ns_ne?: string } | undefined;
  const ns = detail?.ns_date as {
    year?: number;
    paksha_ne?: string;
    day?: number;
    label_ne?: string;
  } | undefined;
  const tithiNe =
    (detail?.tithi as { name_ne?: string } | undefined)?.name_ne ??
    p.tithi?.name_ne;

  if (ns?.year != null && ns.paksha_ne && tithiNe && ns.day != null) {
    return `ने.सं. ${toNepaliDigits(ns.year)} ${ns.paksha_ne} ${tithiNe} - ${toNepaliDigits(ns.day)}`;
  }

  if (display?.ns_ne) return display.ns_ne;
  if (ns?.label_ne) {
    return ns.year != null ? `ने.सं. ${toNepaliDigits(ns.year)} ${ns.label_ne}` : ns.label_ne;
  }
  return p.display?.ns_ne;
}

/** @deprecated use formatNepalSambatDisplay */
export function formatNepalSambatShort(p: PanchangaDay): string | undefined {
  return formatNepalSambatDisplay(p);
}

export function formatShakaYear(p: PanchangaDay): string | undefined {
  const detail = getPanchangaDetail(p);
  const bs = (detail?.bs_date ?? p.bs_date) as { year?: number } | undefined;
  if (bs?.year) return String(bs.year - 135);
  return undefined;
}

export function formatNepalSambatFull(p: PanchangaDay): string | undefined {
  return formatNepalSambatDisplay(p);
}

export function formatDinamaanShort(p: PanchangaDay): string | undefined {
  const detail = getPanchangaDetail(p);
  const dm = (detail?.dinamaan ?? p.dinamaan) as { hours?: number; minutes?: number; label_ne?: string } | undefined;
  if (dm?.hours != null && dm.minutes != null) {
    return toNepaliDigits(`${dm.hours}:${String(dm.minutes).padStart(2, "0")}`);
  }
  return dm?.label_ne ?? p.dinamaan?.label_ne;
}

const RASHI_NE = [
  "मेष", "वृष", "मिथुन", "कर्कट", "सिंह", "कन्या",
  "तुला", "वृश्चिक", "धनु", "मकर", "कुम्भ", "मीन",
] as const;

export const RASHI_SYM = [
  "♈", "♉", "♊", "♋", "♌", "♍",
  "♎", "♏", "♐", "♑", "♒", "♓",
] as const;

const RASHI_DISPLAY_NE: Record<string, string> = {
  मेष: "मेष",
  वृष: "वृषभ",
  मिथुन: "मिथुन",
  कर्कट: "कर्कट",
  सिंह: "सिंह",
  कन्या: "कन्या",
  तुला: "तुला",
  वृश्चिक: "वृश्चिक",
  धनु: "धनु",
  मकर: "मकर",
  कुम्भ: "कुम्भ",
  मीन: "मीन",
};

/** Clock time for patro tables — adds 24h when after midnight before sunrise. */
export function formatVedicPatroTime(
  timeShort?: string | null,
  sunriseShort?: string | null
): string | undefined {
  const t = formatTimeShort(timeShort);
  if (!t) return undefined;
  const sunrise = formatTimeShort(sunriseShort);
  if (!sunrise) return toNepaliDigits(t);
  const [th, tm] = t.split(":").map(Number);
  const [sh] = sunrise.split(":").map(Number);
  if (th != null && tm != null && sh != null && th < sh) {
    return toNepaliDigits(`${String(th + 24).padStart(2, "0")}:${String(tm).padStart(2, "0")}`);
  }
  return toNepaliDigits(t);
}

export function rashiNeFromNumber(rashi?: number): string | undefined {
  if (rashi == null || rashi < 1 || rashi > 12) return undefined;
  return RASHI_NE[rashi - 1];
}

export function rashiSymFromNumber(rashi?: number): string | undefined {
  if (rashi == null || rashi < 1 || rashi > 12) return undefined;
  return RASHI_SYM[rashi - 1];
}

export function formatRashiDisplayNe(nameNe?: string): string | undefined {
  if (!nameNe) return undefined;
  return RASHI_DISPLAY_NE[nameNe] ?? nameNe;
}

type SpanEndBlock = {
  end_local_time_short?: string;
  end_local_time?: string;
  end_hours_clock?: string;
  end_ghati_clock?: string;
};

export function formatSpanEndTime(span?: SpanEndBlock | null): string | undefined {
  if (!span) return undefined;
  const raw =
    span.end_local_time_short ??
    formatTimeShort(span.end_local_time) ??
    formatTimeShort(span.end_hours_clock) ??
    formatGhatiEnd(span.end_ghati_clock);
  return raw ? toNepaliDigits(raw) : undefined;
}

export function getChandraRashiSpans(p: PanchangaDay) {
  const detail = getPanchangaDetail(p);
  const spans = (detail?.chandra_rashi_spans ?? p.chandra_rashi_spans) as
    | import("@/lib/api").RashiSpan[]
    | undefined;
  return spans?.length ? spans : undefined;
}

export function getNakshatraPadaSpans(p: PanchangaDay) {
  const detail = getPanchangaDetail(p);
  const spans = (detail?.nakshatra_pada_spans ?? p.nakshatra_pada_spans) as
    | import("@/lib/api").NakshatraPadaSpan[]
    | undefined;
  return spans?.length ? spans : undefined;
}

export function getSuryaRashi(p: PanchangaDay) {
  const detail = getPanchangaDetail(p);
  const block = (detail?.surya_rashi ?? p.surya_rashi) as
    | { name_ne?: string; number?: number; name?: string }
    | undefined;
  if (block?.name_ne || block?.name) return block;
  if (p.surya_rashi_ne) return { name_ne: p.surya_rashi_ne };
  return undefined;
}

export function getSuryaNakshatra(p: PanchangaDay) {
  const detail = getPanchangaDetail(p);
  const block = (detail?.surya_nakshatra ?? p.surya_nakshatra) as
    | { name_ne?: string; name?: string }
    | undefined;
  return block?.name_ne || block?.name ? block : undefined;
}

export function getChandrabalam(p: PanchangaDay) {
  const detail = getPanchangaDetail(p);
  return (detail?.chandrabalam ?? p.chandrabalam) as import("@/lib/api").BalamBlock | undefined;
}

export function getTarabalam(p: PanchangaDay) {
  const detail = getPanchangaDetail(p);
  return (detail?.tarabalam ?? p.tarabalam) as import("@/lib/api").BalamBlock | undefined;
}

export function getTarabalaTable(p: PanchangaDay) {
  const detail = getPanchangaDetail(p);
  return (p.tarabala_table ?? detail?.tarabala_table) as import("@/lib/api").NavataraTableBlock | undefined;
}

export function getChandrabalamTable(p: PanchangaDay) {
  const detail = getPanchangaDetail(p);
  return (p.chandrabala_table ?? detail?.chandrabala_table) as
    | import("@/lib/api").NavataraTableBlock
    | undefined;
}

export function getHoraSlots(p: PanchangaDay) {
  const detail = getPanchangaDetail(p);
  const block = (p.hora ?? detail?.hora) as import("@/lib/api").ApiHoraSlot[] | undefined;
  return Array.isArray(block) ? block : [];
}

export function getHoraDaySlots(p: PanchangaDay) {
  const detail = getPanchangaDetail(p);
  const block = (p.hora_day ?? detail?.hora_day) as import("@/lib/api").ApiHoraSlot[] | undefined;
  if (Array.isArray(block) && block.length) return block;
  return getHoraSlots(p).filter((slot) => slot.phase === "day");
}

export function getPanchakaRahita(p: PanchangaDay) {
  const detail = getPanchangaDetail(p);
  const rows = (detail?.panchaka_rahita ?? p.panchaka_rahita) as
    | import("@/lib/api").PanchakaSegment[]
    | undefined;
  return rows?.length ? rows : undefined;
}

export function getUdayaLagna(p: PanchangaDay) {
  const detail = getPanchangaDetail(p);
  const rows = (detail?.udaya_lagna ?? p.udaya_lagna ?? detail?.lagna_spans ?? p.lagna_spans) as
    | import("@/lib/api").UdayaLagnaRow[]
    | undefined;
  return rows?.length ? rows : undefined;
}

export function formatShortClock(time?: string | null): string | undefined {
  if (!time) return undefined;
  const t = formatTimeShort(time) ?? time.slice(0, 5);
  return toNepaliDigits(t);
}

export function formatTimeRangeShort(
  start?: string | null,
  end?: string | null
): string | undefined {
  const a = formatShortClock(start);
  const b = formatShortClock(end);
  if (!a || !b) return undefined;
  return `${a} → ${b}`;
}

/** DMS within sign (deg|min|sec) from absolute sidereal longitude. */
export function longitudeToDegreeCells(longitude: number): string {
  const rem = longitude % 30;
  const deg = Math.floor(rem);
  const min = Math.floor((rem - deg) * 60);
  let sec = Math.round(((rem - deg) * 60 - min) * 60);
  let m = min;
  let d = deg;
  if (sec >= 60) {
    sec -= 60;
    m += 1;
  }
  if (m >= 60) {
    m -= 60;
    d += 1;
  }
  return [d, m, sec].map((n) => toNepaliDigits(n)).join("|");
}

/** Parse patro DMS string (22°59'15") to Nepali deg|min|sec cells. */
export function dmsInRashiToDegreeCells(dms: string): string | undefined {
  const match = dms.match(/(\d+)°(\d+)'(\d+)"/);
  if (!match) return undefined;
  return [match[1], match[2], match[3]].map((n) => toNepaliDigits(Number(n))).join("|");
}

export function longitudeToPlanetCells(longitude: number): string {
  const rashi = Math.floor(longitude / 30) + 1;
  return [rashi, ...longitudeToDegreeCells(longitude).split("|")].join("|");
}

const PLANET_LABELS: Record<string, string> = {
  sun: "सूर्य",
  moon: "चन्द्र",
  mars: "मंगल",
  mercury: "बुध",
  jupiter: "बृहस्पति",
  venus: "शुक्र",
  saturn: "शनि",
  rahu: "राहु",
  ketu: "केतु",
};

type PlanetDetail = {
  longitude?: number;
  rashi?: number;
  rashi_name?: string;
  rashi_ne?: string;
  deg_in_rashi?: number;
  dms_in_rashi?: string;
  nakshatra?: {
    number?: number;
    name?: string;
    name_ne?: string;
    pada?: number;
    lord?: string;
  };
};

export type PlanetRow = {
  label: string;
  rashiNe?: string;
  coords: string;
  nakshatraNe?: string;
  nakshatraEn?: string;
  pada?: number;
  nakshatraLordNe?: string;
  nakshatraLordEn?: string;
};

function planetNakshatraFields(info: PlanetDetail): Pick<
  PlanetRow,
  "nakshatraNe" | "nakshatraEn" | "pada" | "nakshatraLordNe" | "nakshatraLordEn"
> {
  // Nakshatra placement is computed by the API and shipped on each planet.
  const nak = info.nakshatra;
  if (!nak?.number) return {};
  const lord = nak.lord as keyof typeof GRAHA_NAME | undefined;
  return {
    nakshatraNe: nak.name_ne ?? NAKSHATRA_ICONS[nak.number - 1]?.ne,
    nakshatraEn: nak.name ?? NAKSHATRA_ICONS[nak.number - 1]?.en,
    pada: nak.pada,
    nakshatraLordNe: lord ? GRAHA_NAME[lord]?.ne : undefined,
    nakshatraLordEn: lord ? GRAHA_NAME[lord]?.en : undefined,
  };
}

export function getPlanetsAnchorLabel(p: PanchangaDay): string {
  const detail = getPanchangaDetail(p);
  const anchor = (detail?.planets_anchor ?? p.planets_anchor) as
    | { label_ne?: string; label_en?: string; local_time?: string }
    | undefined;
  if (anchor?.label_ne) {
    return anchor.local_time
      ? `${anchor.label_ne} (${toNepaliDigits(anchor.local_time)})`
      : anchor.label_ne;
  }
  return anchor?.label_en ?? "उदयकालिक स्पष्टग्रह (सूर्योदय)";
}

export type InstantLagna = {
  number?: number;
  name_ne?: string;
  name?: string;
  degree_in_rashi?: number;
  longitude?: number;
  /** Ecliptic latitude (shara) — 0 for the lagna by definition. */
  latitude?: number;
  right_ascension?: number;
  declination?: number;
  /** Ascendant motion in degrees/day. */
  speed?: number;
};

/** Birth-moment (ephemeris) or sunrise lagna block from the API. */
export function getInstantLagna(p: PanchangaDay): InstantLagna | undefined {
  const detail = getPanchangaDetail(p);
  if (p.mode === "ephemeris") {
    const instant = detail?.instant_lagna as InstantLagna | undefined;
    if (instant) return instant;
  }
  const lagna = (detail?.lagna ?? p.lagna) as InstantLagna | string | undefined;
  if (!lagna || typeof lagna === "string") return undefined;
  return lagna;
}

/** Sidereal lagna longitude — ephemeris `longitude` is the single source of truth. */
export function resolveLagnaSiderealLongitude(lagna: InstantLagna): number | undefined {
  if (lagna.longitude != null) return lagna.longitude;
  const { number, degree_in_rashi } = lagna;
  if (number != null && degree_in_rashi != null) {
    return (number - 1) * 30 + degree_in_rashi;
  }
  return undefined;
}

/** राशि number (१–१२) and Nepali name derived from sidereal longitude. */
export function lagnaRashiFromLongitude(longitude: number): {
  rashiNum: number;
  nameNe: string;
  degreeInRashi: number;
} {
  const lon = ((longitude % 360) + 360) % 360;
  const rashiNum = Math.floor(lon / 30) + 1;
  const nameNe = rashiNeFromNumber(rashiNum) ?? "—";
  const degreeInRashi = lon % 30;
  return { rashiNum, nameNe, degreeInRashi };
}

export function getLagnaDisplay(
  p: PanchangaDay
): {
  nameNe: string;
  degree?: string;
  degreeInRashi?: number;
  rashiNum?: number;
  longitude?: number;
} | undefined {
  const lagna = getInstantLagna(p);
  if (!lagna) {
    const top = p.lagna;
    if (typeof top === "string") return { nameNe: top };
    return undefined;
  }

  const longitude = resolveLagnaSiderealLongitude(lagna);
  if (longitude != null) {
    const { rashiNum, nameNe, degreeInRashi } = lagnaRashiFromLongitude(longitude);
    return {
      nameNe,
      degree: toNepaliDigits(degreeInRashi.toFixed(1)),
      degreeInRashi,
      rashiNum,
      longitude,
    };
  }

  const nameNe = lagna.name_ne ?? lagna.name;
  if (!nameNe) return undefined;
  const degreeInRashi = lagna.degree_in_rashi;
  const degree =
    degreeInRashi != null ? toNepaliDigits(degreeInRashi.toFixed(1)) : undefined;
  return { nameNe, degree, degreeInRashi, rashiNum: lagna.number, longitude: undefined };
}

function planetDegreeCells(info: PlanetDetail): string {
  if (info.dms_in_rashi) {
    const fromDms = dmsInRashiToDegreeCells(info.dms_in_rashi);
    if (fromDms) return fromDms;
  }
  if (info.deg_in_rashi != null && info.rashi != null) {
    return longitudeToDegreeCells((info.rashi - 1) * 30 + info.deg_in_rashi);
  }
  if (info.longitude != null) {
    return longitudeToDegreeCells(info.longitude);
  }
  return "—";
}

export function getPlanetRows(p: PanchangaDay): PlanetRow[] {
  const detail = getPanchangaDetail(p);
  const planets = (detail?.planets ?? p.planets) as Record<string, PlanetDetail | string> | undefined;
  if (!planets) return [];

  const order = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"];

  return order
    .filter((key) => key in planets)
    .map((key) => {
      const label = PLANET_LABELS[key] ?? key;
      const info = planets[key];
      if (typeof info === "string") {
        return { label, coords: info };
      }
      const rashiNe = info.rashi_ne ?? rashiNeFromNumber(info.rashi);
      const coords = planetDegreeCells(info);
      return { label, rashiNe, coords, ...planetNakshatraFields(info) };
    });
}

export function formatPlanetGocharLine(info: PlanetDetail): string {
  const cells = planetDegreeCells(info).split("|");
  const rashiNo = info.rashi;
  if (rashiNo != null && rashiNo >= 1 && rashiNo <= 12) {
    return [toNepaliDigits(rashiNo), ...cells].join(":");
  }
  return cells.join(":");
}

export function getPlanetGocharLines(
  p: PanchangaDay,
): { label: string; value: string }[] {
  const detail = getPanchangaDetail(p);
  const planets = (detail?.planets ?? p.planets) as
    | Record<string, PlanetDetail | string>
    | undefined;
  if (!planets) return [];

  const order = [
    "sun",
    "moon",
    "mars",
    "mercury",
    "jupiter",
    "venus",
    "saturn",
    "rahu",
    "ketu",
  ] as const;

  return order
    .filter((key) => key in planets)
    .map((key) => {
      const label = PLANET_LABELS[key] ?? key;
      const info = planets[key];
      if (typeof info === "string") {
        return { label, value: info };
      }
      return { label, value: formatPlanetGocharLine(info) };
    });
}

type MuhurtaWindow = {
  start_time?: string;
  end_time?: string;
  solar_noon?: string;
  is_auspicious?: boolean;
};

type MuhurtaDetail = {
  rahu_kalam?: MuhurtaWindow;
  yamaganda?: MuhurtaWindow;
  gulika?: MuhurtaWindow;
  abhijit?: MuhurtaWindow;
};

function formatMuhurtaRange(start?: string, end?: string): string | undefined {
  if (!start || !end) return undefined;
  const s = formatClockNepali(start) ?? start;
  const e = formatClockNepali(end) ?? end;
  return `${s} – ${e}`;
}

function clockMinutes(time?: string | null): number | null {
  if (!time) return null;
  const m = time.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function minutesToClock(mins: number): string {
  const rounded = Math.round(mins);
  const h = Math.floor(rounded / 60) % 24;
  const m = rounded % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export type AbhijitMuhurtaInfo = {
  start_time: string;
  end_time: string;
  solar_noon?: string;
  rangeDisplay: string;
  noonDisplay?: string;
};

/** Abhijit muhurta from sunrise/sunset — same 8th-muhurta rule as the backend. */
export function computeAbhijitFromSunTimes(
  sunrise?: string | null,
  sunset?: string | null,
): AbhijitMuhurtaInfo | null {
  const sr = clockMinutes(sunrise);
  const ss = clockMinutes(sunset);
  if (sr == null || ss == null || ss <= sr) return null;
  const total = ss - sr;
  const muh = total / 15;
  const start_time = minutesToClock(sr + 7 * muh);
  const end_time = minutesToClock(sr + 8 * muh);
  const solar_noon = minutesToClock(sr + total / 2);
  const rangeDisplay = formatMuhurtaRange(start_time, end_time) ?? `${start_time} – ${end_time}`;
  return {
    start_time,
    end_time,
    solar_noon,
    rangeDisplay,
    noonDisplay: formatClockNepali(solar_noon),
  };
}

export function getAbhijitMuhurta(p: PanchangaDay): AbhijitMuhurtaInfo | null {
  const detail = getPanchangaDetail(p);
  const m = (detail?.muhurta ?? p.muhurta) as MuhurtaDetail | undefined;
  const ab = m?.abhijit;
  if (ab?.start_time && ab?.end_time) {
    const rangeDisplay = formatMuhurtaRange(ab.start_time, ab.end_time);
    if (!rangeDisplay) return null;
    return {
      start_time: ab.start_time,
      end_time: ab.end_time,
      solar_noon: ab.solar_noon,
      rangeDisplay,
      noonDisplay: ab.solar_noon ? formatClockNepali(ab.solar_noon) : undefined,
    };
  }
  return computeAbhijitFromSunTimes(getSunrise(p), getSunset(p));
}

export function getMuhurtaRows(p: PanchangaDay): {
  label: string;
  value: string;
  auspicious?: boolean;
}[] {
  const detail = getPanchangaDetail(p);
  const m = (detail?.muhurta ?? p.muhurta) as MuhurtaDetail | undefined;
  if (!m) return [];

  const rows: { label: string; value: string; auspicious?: boolean }[] = [];

  const rahu = formatMuhurtaRange(m.rahu_kalam?.start_time, m.rahu_kalam?.end_time);
  if (rahu) rows.push({ label: "राहु काल", value: rahu });

  const yama = formatMuhurtaRange(m.yamaganda?.start_time, m.yamaganda?.end_time);
  if (yama) rows.push({ label: "यमगण्ड", value: yama });

  const gulika = formatMuhurtaRange(m.gulika?.start_time, m.gulika?.end_time);
  if (gulika) rows.push({ label: "गुलिक काल", value: gulika });

  const abhijit = getAbhijitMuhurta(p);
  if (abhijit) {
    rows.push({
      label: "अभिजित् मुहूर्त",
      value: abhijit.noonDisplay
        ? `${abhijit.rangeDisplay} (मध्यान्ह ${abhijit.noonDisplay})`
        : abhijit.rangeDisplay,
      auspicious: m?.abhijit?.is_auspicious ?? true,
    });
  }

  return rows;
}

/** Patro-style BS date, e.g. असार १४, २०८३ */
export function formatBsMonthDayPatro(
  bsYear: number,
  bsMonth: number,
  bsDay: number,
): string {
  return `${BS_MONTHS_NE[bsMonth - 1]} ${toNepaliDigits(bsDay)}, ${toNepaliDigits(bsYear)}`;
}

export type MonthFestivalEntry = {
  name: string;
  bsDay: number;
  isPublicHoliday?: boolean;
};

/** Bare lunar phases — tithi markers, not चाडपर्व unless named (e.g. कुशे औंसी). */
const BARE_LUNAR_PHASE_NE = new Set(["पूर्णिमा", "औंसी"]);

const TITHI_NAMES_NE = new Set([
  "प्रतिपदा",
  "द्वितीया",
  "तृतीया",
  "चतुर्थी",
  "पञ्चमी",
  "षष्ठी",
  "सप्तमी",
  "अष्टमी",
  "नवमी",
  "दशमी",
  "एकादशी",
  "द्वादशी",
  "त्रयोदशी",
  "चतुर्दशी",
  "पूर्णिमा",
  "औंसी",
]);

const TITHI_NAMES_EN = new Set([
  "pratipada",
  "dwitiya",
  "tritiya",
  "chaturthi",
  "panchami",
  "shashthi",
  "saptami",
  "ashtami",
  "navami",
  "dashami",
  "ekadashi",
  "dwadashi",
  "trayodashi",
  "chaturdashi",
  "purnima",
  "amavasya",
  "aunsi",
]);

function parseBsDayInMonth(
  festival: Festival,
  bsYear: number,
  bsMonth: number,
): number | null {
  if (festival.bs_start_date) {
    const [y, m, d] = festival.bs_start_date.split("-").map(Number);
    if (y === bsYear && m === bsMonth && d) return d;
  }
  if (festival.start_date) {
    const bs = adToBS(new Date(`${festival.start_date}T12:00:00`));
    if (bs.year === bsYear && bs.month === bsMonth) return bs.day;
  }
  return null;
}

function hasDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

function normalizeFestKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0900-\u097F]+/g, " ")
    .trim();
}

function isTithiOnlyLabel(name: string): boolean {
  const trimmed = name.trim();
  if (BARE_LUNAR_PHASE_NE.has(trimmed) || TITHI_NAMES_NE.has(trimmed)) return true;

  const pakshaNe = trimmed.match(/^(शुक्ल|कृष्ण)\s+(.+)$/);
  if (pakshaNe && TITHI_NAMES_NE.has(pakshaNe[2]!)) return true;

  const key = normalizeFestKey(trimmed);
  if (TITHI_NAMES_EN.has(key) || key === "full moon" || key === "new moon") return true;

  const pakshaEn = key.match(/^(shukla|krishna)\s+(.+)$/);
  if (pakshaEn && TITHI_NAMES_EN.has(pakshaEn[2]!)) return true;

  return false;
}

/** Map any festival label to a stable alias id for deduplication. */
function buildFestivalAliasIndex(festivals: Festival[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const festival of festivals) {
    const alias = `fest:${festival.id}`;
    for (const label of [festival.name_ne, festival.name_en, festival.name, festival.id]) {
      if (!label) continue;
      index.set(normalizeFestKey(label), alias);
    }
  }
  return index;
}

function resolveFestivalAlias(name: string, aliasIndex: Map<string, string>): string {
  return aliasIndex.get(normalizeFestKey(name)) ?? `name:${normalizeFestKey(name)}`;
}

function preferNepaliName(current: string, candidate: string): string {
  if (hasDevanagari(candidate) && !hasDevanagari(current)) return candidate;
  return current;
}

/** Collapse Nepali + English duplicates on the same calendar day. */
function dedupeDayFestivalNames(names: string[], aliasIndex: Map<string, string>): string[] {
  const byAlias = new Map<string, string>();
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const alias = resolveFestivalAlias(trimmed, aliasIndex);
    const existing = byAlias.get(alias);
    byAlias.set(alias, existing ? preferNepaliName(existing, trimmed) : trimmed);
  }
  return Array.from(byAlias.values());
}

/** Month-wide चाडपर्व list for the patro-style aside tab. */
export function buildMonthFestivalEntries(
  bsYear: number,
  bsMonth: number,
  days: CalendarDay[],
  apiFestivals: Festival[] = [],
): MonthFestivalEntry[] {
  const monthNe = BS_MONTHS_NE[bsMonth - 1];
  const aliasIndex = buildFestivalAliasIndex(apiFestivals);
  const byDay = new Map<number, MonthFestivalEntry[]>();
  const claimed = new Map<number, Set<string>>();

  const add = (
    bsDay: number,
    name: string,
    opts?: { isPublicHoliday?: boolean; alias?: string },
  ) => {
    const trimmed = name.trim();
    if (!trimmed || isTithiOnlyLabel(trimmed)) return false;
    const alias = opts?.alias ?? resolveFestivalAlias(trimmed, aliasIndex);
    const dayClaims = claimed.get(bsDay) ?? new Set<string>();
    if (dayClaims.has(alias)) return false;

    const list = byDay.get(bsDay) ?? [];
    const existing = list.find((entry) => resolveFestivalAlias(entry.name, aliasIndex) === alias);
    if (existing) {
      existing.name = preferNepaliName(existing.name, trimmed);
      existing.isPublicHoliday ||= opts?.isPublicHoliday;
      dayClaims.add(alias);
      claimed.set(bsDay, dayClaims);
      return false;
    }

    list.push({ name: trimmed, bsDay, isPublicHoliday: opts?.isPublicHoliday });
    byDay.set(bsDay, list);
    dayClaims.add(alias);
    claimed.set(bsDay, dayClaims);
    return true;
  };

  add(1, `${monthNe} संक्रान्ति`, { alias: `sankranti:${bsMonth}` });

  for (const festival of apiFestivals) {
    const bsDay = parseBsDayInMonth(festival, bsYear, bsMonth);
    if (bsDay == null) continue;
    const name = festival.name_ne ?? festival.name_en ?? festival.name ?? festival.id;
    add(bsDay, name, {
      isPublicHoliday: festival.is_public_holiday,
      alias: `fest:${festival.id}`,
    });
  }

  for (const day of days) {
    const names = dedupeDayFestivalNames(day.festivals ?? [], aliasIndex);
    for (const name of names) {
      add(day.day, name);
    }
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a - b)
    .map(([bsDay, entries]) => {
      if (entries.length === 1) return entries[0]!;
      return {
        bsDay,
        name: entries.map((entry) => entry.name).join(", "),
        isPublicHoliday: entries.some((entry) => entry.isPublicHoliday),
      };
    });
}

export function getEventNames(p: PanchangaDay, dayFestivals: string[]): string[] {
  const fromApi = (p.festivals ?? []).map((f) => f.name_ne ?? f.name_en ?? f.name ?? "").filter(Boolean);
  const merged = [...fromApi];
  for (const f of dayFestivals) {
    if (!merged.includes(f)) merged.push(f);
  }
  return merged;
}

export function getShraddhaLabel(tithiNameNe?: string | null): string | undefined {
  if (!tithiNameNe) return undefined;
  if (tithiNameNe === "पूर्णिमा" || tithiNameNe === "औंसी") return undefined;
  return `${tithiNameNe} श्राद्ध`;
}

export function getDinVisheshLabels(p: PanchangaDay, dayFestivals: string[]): string[] {
  const detail = getPanchangaDetail(p);
  const labels = getEventNames(p, dayFestivals);

  const markers = detail?.markers as {
    is_purnima?: boolean;
    is_amavasya?: boolean;
    is_ekadashi?: boolean;
  } | undefined;

  if (markers?.is_purnima && !labels.includes("पूर्णिमा")) labels.push("पूर्णिमा");
  if (markers?.is_amavasya && !labels.includes("औंसी")) labels.push("औंसी");
  if (markers?.is_ekadashi && !labels.includes("एकादशी")) labels.push("एकादशी");

  const tithiNe =
    (detail?.tithi as { name_ne?: string } | undefined)?.name_ne ??
    p.tithi?.name_ne;
  const shraddha = getShraddhaLabel(tithiNe);
  if (shraddha && !labels.some((label) => label.includes(tithiNe ?? ""))) {
    labels.push(shraddha);
  }

  return labels;
}

export function relativeDayLabel(daysDiff: number): string {
  if (daysDiff === 0) return "Today";
  if (daysDiff > 0) return `${daysDiff} Days left`;
  return `${Math.abs(daysDiff)} Days before`;
}

export function daysDiffFromAd(fromAd: string, toAd: string): number {
  const from = new Date(`${fromAd}T12:00:00`);
  const to = new Date(`${toAd}T12:00:00`);
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

/** Days until a festival — Nepali labels for the aside चाडपर्व tab. */
export function festivalRelLabelNepali(daysDiff: number): string {
  if (daysDiff === 0) return "आज";
  if (daysDiff === 1) return "भोलि";
  if (daysDiff > 1) return `${toNepaliDigits(daysDiff)} दिन`;
  if (daysDiff === -1) return "हिजो";
  return `${toNepaliDigits(Math.abs(daysDiff))} दिन अघि`;
}
