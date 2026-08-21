/**
 * Everything in the sky that can be looked up by name, in one list.
 *
 * The search box, the browse tree, the favourites and the recents all read from
 * here, so a thing is nameable in exactly one place. Adding धूमकेतु (comets) or
 * galaxies later is a matter of adding a `kind` and a builder — nothing that
 * consumes this list needs to know what is in it.
 *
 * Every entry carries a position the camera can be aimed at. Grahas move, so
 * theirs is a key the scene resolves live; stars and asterisms are fixed, so
 * theirs is an ecliptic longitude and latitude and the scene places them the
 * same way it places anything else.
 */

import { GRAHA_NAME, type GrahaKey } from "@/lib/graha-details";
import type { VedicStarPosition } from "@/lib/api";
import { GEO_BODY_ORDER } from "@/lib/sky3d/orbital-model";
import {
  equatorialToeclipticJ2000,
  NAKSHATRA_ASTERISMS,
  skyStarCommonName,
  skyStarNameNe,
} from "@/lib/sky3d/nakshatra-stars";

/**
 * What sort of thing it is. The browse tree is built from this, so a new kind
 * appears as a new branch without anything else being touched.
 */
export type SkyTargetKind = "planet" | "star" | "constellation";

/** Where the camera is pointed to find it. */
export type SkyTargetAt =
  /** A graha: it moves, so the scene looks up where it is right now. */
  | { at: "graha"; graha: GrahaKey }
  /** Fixed sky: ecliptic longitude and latitude at J2000, degrees. */
  | { at: "sky"; lon: number; lat: number };

export type SkyTarget = {
  /** Stable across sessions — favourites and recents are stored by this. */
  id: string;
  kind: SkyTargetKind;
  ne: string;
  en: string;
  /** Shown under the name in a result row: the नक्षत्र it sits in, and so on. */
  hintNe?: string;
  hintEn?: string;
} & SkyTargetAt;

/** The browse tree's branches, in the order they are offered. */
export const SKY_KINDS: { kind: SkyTargetKind; ne: string; en: string }[] = [
  { kind: "planet", ne: "ग्रह", en: "Planets" },
  { kind: "star", ne: "तारा", en: "Stars" },
  { kind: "constellation", ne: "नक्षत्र", en: "Constellations" },
];

/**
 * The catalogue, built once.
 *
 * Stars come out of the nakshatra asterisms, which is every star the sky
 * actually draws — there is no point offering a name the view cannot show. The
 * asterism itself is offered too, aimed at its योगतारा, which is the star the
 * nakshatra is named for and the sensible thing to centre.
 */
export const SKY_CATALOGUE: SkyTarget[] = (() => {
  const out: SkyTarget[] = [];

  for (const key of GEO_BODY_ORDER) {
    out.push({
      id: `planet:${key}`,
      kind: "planet",
      ne: GRAHA_NAME[key].ne,
      en: GRAHA_NAME[key].en,
      at: "graha",
      graha: key,
    });
  }

  for (const nak of NAKSHATRA_ASTERISMS) {
    const junction = nak.stars[0];
    const { lon, lat } = equatorialToeclipticJ2000(junction.ra, junction.dec);
    out.push({
      id: `constellation:${nak.index}`,
      kind: "constellation",
      ne: nak.ne,
      en: nak.en,
      hintNe: `नक्षत्र ${nak.index}`,
      hintEn: `Nakshatra ${nak.index}`,
      at: "sky",
      lon,
      lat,
    });
    for (const star of nak.stars) {
      const p = equatorialToeclipticJ2000(star.ra, star.dec);
      const common = skyStarCommonName(star.name);
      const neOwn = skyStarNameNe(star.name);
      out.push({
        id: `star:${nak.index}:${star.name}`,
        kind: "star",
        ne: neOwn ?? nak.ne,
        en: common ?? nak.en,
        hintNe: nak.ne,
        hintEn: nak.en,
        at: "sky",
        lon: p.lon,
        lat: p.lat,
      });
    }
  }

  return out;
})();

/** By id, for reading a favourites or recents list back into real entries. */
export const SKY_BY_ID = new Map(SKY_CATALOGUE.map((t) => [t.id, t]));

/**
 * Latin Vedic names for the 32-star catalogue, keyed on the server's English
 * modern name. The API stores `ne` in Devanagari and `en` as Canopus / Vega /
 * … — without these, typing "Agastya" or "Abhijit" would miss.
 */
const VEDIC_LATIN: Record<string, string> = {
  Canopus: "Agastya",
  Sirius: "Mrgavyadha Lubdhaka",
  Elnath: "Agni Hutabhuk",
  Capella: "Brahmahrdaya",
  Spica: "Apamvatsa",
  Auva: "Apas",
  Vega: "Abhijit",
  Alkaid: "Marici",
  Mizar: "Vasishtha",
  Alcor: "Arundhati",
  Alioth: "Angira",
  Megrez: "Atri",
  Phecda: "Pulastya",
  Merak: "Pulaha",
  Dubhe: "Kratu",
  "Alpha Centauri": "Mitra",
  "Beta Centauri / Hadar": "Mitraka",
  Deneb: "Hamsa",
  Fomalhaut: "Minasa",
  Rigel: "Rajanaya Rajanya",
  Procyon: "Prasva Prasu Lubdhaka-bandhu",
  Betelgeuse: "Ardra",
  Adhara: "Adhara",
  Saiph: "Kartavirya",
  Mintaka: "Chitralekha",
  Alnilam: "Aniruddha",
  Alnitak: "Usha",
  "Meissa / Lambda Orionis region": "Mrgasira",
  Orion: "Prajapati",
  "Ursa Major / Big Dipper": "Saptarishi",
  "Southern Cross / Crux": "Trisanku",
  Diti: "Diti",
  Aditi: "Aditi",
  Pollux: "Diti Soma Chandra",
  Castor: "Aditi Aditya",
  Gemini: "Mithuna Mithuna Mandala",
};

/** Extra search names that sit on an already-drawn वैदिक तारा. No extra dots. */
const VEDIC_ALIASES: { matchNe: string; ne: string; en: string; hintEn: string }[] = [
  { matchNe: "दिति", ne: "सोम", en: "Soma", hintEn: "Pollux" },
  { matchNe: "दिति", ne: "चन्द्र", en: "Chandra", hintEn: "Pollux" },
  { matchNe: "दिति", ne: "मिथुनस्य १", en: "Mithunasya 1", hintEn: "Pollux" },
  { matchNe: "अदिति", ne: "आदित्य", en: "Aditya", hintEn: "Castor" },
  { matchNe: "अदिति", ne: "मिथुनस्य २", en: "Mithunasya 2", hintEn: "Castor" },
  { matchNe: "मिथुन", ne: "मिथुन मण्डल", en: "Mithuna Mandala", hintEn: "Gemini" },
];

/** Live server positions → search/aim targets. Ids are stable for one payload. */
export function vedicStarTargets(stars: VedicStarPosition[]): SkyTarget[] {
  const primary = stars.map((star, index) => {
    const latin = VEDIC_LATIN[star.en] ?? "";
    const hint = [latin, star.en].filter(Boolean).join(" · ");
    return {
      id: `vedic:${index}`,
      kind: "star" as const,
      ne: star.ne,
      en: star.en,
      hintNe: hint,
      hintEn: hint,
      at: "sky" as const,
      lon: star.lon,
      lat: star.lat,
    };
  });
  const aliases: SkyTarget[] = [];
  for (const alias of VEDIC_ALIASES) {
    const host = primary.find((t) => t.ne.split(/[ /]/)[0] === alias.matchNe || t.ne === alias.matchNe);
    if (!host) continue;
    aliases.push({
      ...host,
      id: `vedic-alias:${alias.en}`,
      ne: alias.ne,
      en: alias.en,
      hintNe: host.ne,
      hintEn: alias.hintEn,
    });
  }
  return [...primary, ...aliases];
}

/** Everything of one kind, for the browse tree. */
export function skyTargetsOfKind(kind: SkyTargetKind, extra: SkyTarget[] = []): SkyTarget[] {
  const fromExtra = extra.filter((t) => t.kind === kind);
  const fromCat = SKY_CATALOGUE.filter((t) => t.kind === kind);
  return fromExtra.length ? [...fromExtra, ...fromCat] : fromCat;
}

/**
 * Name search, both languages at once.
 *
 * Deliberately not fuzzy. A prefix match on either name, then a contains match,
 * so typing "ma" puts मंगल / Mars above "Alcyone" rather than burying it. The
 * catalogue is a few hundred entries, so this runs on every keystroke without
 * anything cleverer.
 *
 * {@link extra} is searched first — the named वैदिक तारा, whose live positions
 * come from the gochar payload rather than the static asterism list.
 */
export function searchSky(query: string, limit = 40, extra: SkyTarget[] = []): SkyTarget[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts: SkyTarget[] = [];
  const contains: SkyTarget[] = [];
  const hay = (t: SkyTarget) =>
    `${t.ne} ${t.en} ${t.hintNe ?? ""} ${t.hintEn ?? ""}`.toLowerCase();
  for (const t of extra.length ? [...extra, ...SKY_CATALOGUE] : SKY_CATALOGUE) {
    const names = `${t.ne} ${t.en}`.toLowerCase();
    const blob = hay(t);
    if (names.startsWith(q) || t.ne.toLowerCase().startsWith(q) || t.en.toLowerCase().startsWith(q)) {
      starts.push(t);
    } else if (blob.includes(q)) {
      contains.push(t);
    }
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}
