import type { PanchangaDay } from "./api";
import { adToBS, BS_MONTH_NAMES, BS_MONTHS_NE } from "./bs-calendar";

const NEPALI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"] as const;

export function toNepaliDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => NEPALI_DIGITS[Number(d)] ?? d);
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

export function getPanchangaDetail(p: PanchangaDay) {
  return (p as PanchangaDay & { detail?: Record<string, unknown> }).detail as
    | Record<string, unknown>
    | undefined;
}

export function getLagnaSpans(p: PanchangaDay) {
  const detail = getPanchangaDetail(p);
  const fromDetail = detail?.lagna_spans as PanchangaDay["lagna_spans"];
  if (fromDetail?.length) return fromDetail;
  if (p.lagna_spans?.length) return p.lagna_spans;
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
  return detail?.solar_corrections as SolarCorrections | undefined;
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
  opts?: { includeYear?: boolean }
): string | undefined {
  if (!bsIso) return undefined;
  const [ys, ms, ds] = bsIso.split("-");
  const year = Number(ys);
  const month = Number(ms);
  const day = Number(ds);
  if (!month || !day) return undefined;
  const label = `${BS_MONTHS_NE[month - 1]} ${toNepaliDigits(day)}`;
  if (opts?.includeYear === false || !year) return label;
  return `${label}, वि.सं. ${toNepaliDigits(year)}`;
}

export function formatHolidayBsDisplay(holiday: {
  bs_start_date?: string;
  start_date: string;
}): string {
  const fromApi = formatBsIsoDateNepali(holiday.bs_start_date);
  if (fromApi) return fromApi;
  const [y, m, d] = holiday.start_date.split("-").map(Number);
  if (!y || !m || !d) return "";
  const bs = adToBS(new Date(y, m - 1, d));
  return `${BS_MONTHS_NE[bs.month - 1]} ${toNepaliDigits(bs.day)}, वि.सं. ${toNepaliDigits(bs.year)}`;
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
};

export function getPlanetsAnchorLabel(p: PanchangaDay): string {
  const detail = getPanchangaDetail(p);
  const anchor = detail?.planets_anchor as { label_ne?: string; label_en?: string } | undefined;
  return anchor?.label_ne ?? anchor?.label_en ?? "उदयकालिक स्पष्टग्रह (सूर्योदय)";
}

export function getLagnaDisplay(
  p: PanchangaDay
): { nameNe: string; degree?: string } | undefined {
  const detail = getPanchangaDetail(p);
  const lagna = (detail?.lagna ?? p.lagna) as
    | { name_ne?: string; name?: string; degree_in_rashi?: number }
    | undefined;
  const nameNe = lagna?.name_ne ?? lagna?.name;
  if (!nameNe) return undefined;
  const degree =
    lagna?.degree_in_rashi != null
      ? toNepaliDigits(lagna.degree_in_rashi.toFixed(1))
      : undefined;
  return { nameNe, degree };
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

export function getPlanetRows(p: PanchangaDay): { label: string; rashiNe?: string; coords: string }[] {
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
      return { label, rashiNe, coords };
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

  const abhijitRange = formatMuhurtaRange(m.abhijit?.start_time, m.abhijit?.end_time);
  if (abhijitRange) {
    const noon = m.abhijit?.solar_noon;
    rows.push({
      label: "अभिजित् मुहूर्त",
      value: noon
        ? `${abhijitRange} (मध्यान्ह ${formatClockNepali(noon) ?? noon})`
        : abhijitRange,
      auspicious: m.abhijit?.is_auspicious ?? true,
    });
  }

  return rows;
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
  if (tithiNameNe === "पूर्णिमा" || tithiNameNe === "अमावास्या") return undefined;
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
  if (markers?.is_amavasya && !labels.includes("अमावास्या")) labels.push("अमावास्या");
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
