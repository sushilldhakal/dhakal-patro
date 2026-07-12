/**
 * Client-side registry for the standalone panchanga-element pages.
 *
 * Mirrors the backend `/panchanga/elements` registry so the hub and detail
 * pages can render (and link) without a round-trip. `span` elements get a
 * begin→end month view; `table` elements get a per-day table view.
 */
import type { ElementKind } from "@/lib/api";

export interface ElementMeta {
  id: string;
  ne: string;
  en: string;
  kind: ElementKind;
  /** Short bilingual blurb for the hub card. */
  blurbNe: string;
  blurbEn: string;
}

export const ELEMENT_META: ElementMeta[] = [
  { id: "tithi", ne: "तिथि", en: "Tithi", kind: "span", blurbNe: "चन्द्र दिन — आरम्भ र अन्त्य", blurbEn: "Lunar day — begin & end" },
  { id: "nakshatra", ne: "नक्षत्र", en: "Nakshatra", kind: "span", blurbNe: "चन्द्र नक्षत्र सङ्क्रमण", blurbEn: "Moon nakshatra transitions" },
  { id: "yoga", ne: "योग", en: "Yoga", kind: "span", blurbNe: "सत्ताईस योग — आरम्भ र अन्त्य", blurbEn: "27 yogas — begin & end" },
  { id: "karana", ne: "करण", en: "Karana", kind: "span", blurbNe: "आधा तिथिको करण", blurbEn: "Half-tithi karana" },
  { id: "chandra-rashi", ne: "चन्द्र राशि", en: "Moon sign", kind: "span", blurbNe: "चन्द्रमा राशि सङ्क्रमण", blurbEn: "Moon sign transitions" },
  { id: "choghadiya", ne: "चौघडिया", en: "Choghadiya", kind: "table", blurbNe: "दिन/रातका आठ मुहूर्त", blurbEn: "Eight day/night muhurtas" },
  { id: "hora", ne: "होरा", en: "Hora", kind: "table", blurbNe: "ग्रह होरा — २४ खण्ड", blurbEn: "Planetary hora — 24 slots" },
  { id: "lagna", ne: "लग्न", en: "Lagna", kind: "table", blurbNe: "उदय लग्न क्रम", blurbEn: "Ascendant sequence" },
  { id: "udaya-lagna", ne: "उदय लग्न", en: "Udaya Lagna", kind: "table", blurbNe: "लग्न समय + पुष्कर नवांश", blurbEn: "Lagna times + Pushkara" },
  { id: "chandrabala", ne: "चन्द्रबल", en: "Chandrabala", kind: "table", blurbNe: "राशिअनुसार चन्द्रबल", blurbEn: "Moon strength by sign" },
  { id: "tarabala", ne: "ताराबल", en: "Tarabala", kind: "table", blurbNe: "नक्षत्रअनुसार ताराबल", blurbEn: "Star strength by nakshatra" },
  { id: "panchaka-rahita", ne: "पञ्चक रहित", en: "Panchaka Rahita", kind: "table", blurbNe: "पञ्चक रहित मुहूर्त", blurbEn: "Panchaka-free windows" },
  { id: "pushkara", ne: "पुष्कर नवांश", en: "Pushkara Navamsha", kind: "table", blurbNe: "पुष्कर नवांश क्षण", blurbEn: "Pushkara Navamsha moments" },
];

export const ELEMENT_BY_ID: Record<string, ElementMeta> = Object.fromEntries(
  ELEMENT_META.map((e) => [e.id, e]),
);

export interface CeremonyMeta {
  id: string;
  ne: string;
  en: string;
}

/** Shubha-muhurta ceremonies (mirrors /nepal/sait/categories). */
export const CEREMONY_META: CeremonyMeta[] = [
  { id: "vivah", ne: "विवाह", en: "Marriage" },
  { id: "bratabandha", ne: "ब्रतबन्ध", en: "Bratabandha" },
  { id: "griha-aarambha", ne: "गृह आराम्भ", en: "House foundation" },
  { id: "griha-pravesh", ne: "गृह प्रवेश", en: "Housewarming" },
  { id: "byaparik-pratisthan", ne: "व्यापारिक प्रतिष्ठान", en: "Business opening" },
  { id: "rudri-jurne", ne: "रुद्री जुर्ने", en: "Rudri homa" },
  { id: "agni-jurne", ne: "अग्नि जुर्ने", en: "Agni homa" },
  { id: "annaprasan", ne: "अन्नप्रासन", en: "Annaprasan" },
];
