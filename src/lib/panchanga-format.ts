import type { PanchangaDay } from "./api";
import { BS_MONTH_NAMES } from "./bs-calendar";

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

export function getMoonrise(p: PanchangaDay): string | undefined {
  const detail = getPanchangaDetail(p);
  const fromDetail = (detail?.moonrise as { local_time_short?: string } | undefined)?.local_time_short;
  if (fromDetail) return fromDetail;
  return p.moonrise?.local_time_short ?? p.moon?.rise;
}

export function getMoonset(p: PanchangaDay): string | undefined {
  const detail = getPanchangaDetail(p);
  const fromDetail = (detail?.moonset as { local_time_short?: string } | undefined)?.local_time_short;
  if (fromDetail) return fromDetail;
  return p.moonset?.local_time_short ?? p.moon?.set;
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

export function rashiNeFromNumber(rashi?: number): string | undefined {
  if (rashi == null || rashi < 1 || rashi > 12) return undefined;
  return RASHI_NE[rashi - 1];
}

export function longitudeToPlanetCells(longitude: number): string {
  const rashi = Math.floor(longitude / 30) + 1;
  const rem = longitude % 30;
  const deg = Math.floor(rem);
  const min = Math.floor((rem - deg) * 60);
  const sec = Math.round(((rem - deg) * 60 - min) * 60);
  return [rashi, deg, min, sec].map((n) => toNepaliDigits(n)).join("|");
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
};

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
      const rashiNe = rashiNeFromNumber(info.rashi);
      const coords =
        info.longitude != null ? longitudeToPlanetCells(info.longitude) : "—";
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
  return `${start} – ${end}`;
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
      value: noon ? `${abhijitRange} (मध्यान्ह ${noon})` : abhijitRange,
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
