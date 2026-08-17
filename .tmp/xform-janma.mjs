import fs from "node:fs";

const SRC = "src/lib/kundali/janma-phala-tables.ts";
const MAP = "scripts/i18n-maps/kundali-sait.json";

let src = fs.readFileSync(SRC, "utf8");
const map = JSON.parse(fs.readFileSync(MAP, "utf8"));

// (ne, en) -> existing key, so we never mint a second key for the same pair.
const byPair = new Map();
for (const [k, v] of Object.entries(map)) byPair.set(`${v.ne}\u0000${v.en}`, k);

const added = [];
const keyFor = (ne, en, proposed) => {
  const hit = byPair.get(`${ne}\u0000${en}`);
  if (hit) return hit;
  map[proposed] = { ne, en };
  byPair.set(`${ne}\u0000${en}`, proposed);
  added.push(proposed);
  return proposed;
};

// 1. graha columns: { id: "sun", ne: "सूर्य", en: "Sun" } -> { id: "sun", labelKey: "..." }
src = src.replace(
  /\{ id: "(\w+)", ne: "([^"]+)", en: "([^"]+)" \}/g,
  (_m, id, ne, en) => `{ id: "${id}", labelKey: "${keyFor(ne, en, `kundali.x.graha_${id.toLowerCase()}`)}" }`,
);

// 2. row house labels: houseNe/houseEn pair -> single houseKey
const HOUSE_SLUG = {
  "Tanu 1": "tanu_1",
  "Dhana 2": "dhana_2",
  "Bhrata 3": "bhrata_3",
  "Sukha 4": "sukha_4",
  "Putra 5": "putra_5",
  "Shatru 6": "shatru_6",
  "Stri 7": "stri_7",
  "Mrityu 8": "mrityu_8",
  "Dharma 9": "dharma_9",
  "Karma 10": "karma_10",
  "Labha 11": "labha_11",
  "Vyaya 12": "vyaya_12",
};
src = src.replace(
  /( *)houseNe: "([^"]+)",\n *houseEn: "([^"]+)",/g,
  (_m, indent, ne, en) =>
    `${indent}houseKey: "${keyFor(ne, en, `kundali.x.janma_house_${HOUSE_SLUG[en]}`)}",`,
);

// 3. short hint labels used by the chart summary line
const HINT = [
  ["तनु", "Tanu"],
  ["धन", "Dhana"],
  ["भ्राता", "Bhrata"],
  ["सुख", "Sukha"],
  ["पुत्र", "Putra"],
  ["रिपु", "Ripu"],
  ["कलत्र", "Kalatra"],
  ["आयु", "Ayus"],
  ["धर्म", "Dharma"],
  ["कर्म", "Karma"],
  ["लाभ", "Labha"],
  ["व्यय", "Vyaya"],
];
const hintKeys = HINT.map(([ne, en]) =>
  keyFor(ne, en, `kundali.x.house_hint_${en.toLowerCase()}`),
);
const striKey = keyFor("स्त्री", "Stri", "kundali.x.house_hint_stri");
const bhavaTagKey = keyFor("भाव {{n}}", "H {{n}}", "kundali.x.bhava_tag");

src = src.replace(
  /const HOUSE_HINT_NE = \[[\s\S]*?\] as const;\n\nconst HOUSE_HINT_EN = \[[\s\S]*?\] as const;/,
  `/** Catalogue key for each house's short name, 1st house first. */\nconst HOUSE_HINT_KEYS = [\n${hintKeys.map((k) => `  "${k}",`).join("\n")}\n] as const;`,
);

src = src.replace(
  /function houseHintLabel\(house: number, tab: "male" \| "female", lang: "en" \| "ne"\): string \{[\s\S]*?\n\}/,
  `function houseHintLabel(house: number, tab: "male" | "female", t: TFn): string {
  if (house === 7 && tab === "female") return t("${striKey}");
  return t(HOUSE_HINT_KEYS[house - 1]!);
}`,
);

// 4. thread `t` through the hint builders instead of `lang`
src = src.replace(
  /(export function buildJanmaPhalaHintParts\([\s\S]*?)  lang: "en" \| "ne",\n/,
  "$1  t: TFn,\n",
);
src = src.replace(
  /(export function buildJanmaPhalaHintLine\([\s\S]*?)  lang: "en" \| "ne",\n/,
  "$1  t: TFn,\n",
);
src = src.replace(
  "const parts = buildJanmaPhalaHintParts(planetBhavas, tab, lang, digits);",
  "const parts = buildJanmaPhalaHintParts(planetBhavas, tab, t, digits);",
);
src = src.replace("grahaLabel: lang === \"ne\" ? g.ne : g.en,", "grahaLabel: t(g.labelKey),");
src = src.replace("houseLabel: houseHintLabel(house, tab, lang),", "houseLabel: houseHintLabel(house, tab, t),");
src = src.replace(
  "bhavaTag: lang === \"ne\" ? `भाव ${digits(house)}` : `H ${digits(house)}`,",
  `bhavaTag: t("${bhavaTagKey}", { n: digits(house) }),`,
);

// TFn declaration
src = src.replace(
  '/** Graha-in-house classical phala — Purusha & Stree janma tables (static śāstra reference). */\n',
  '/** Graha-in-house classical phala — Purusha & Stree janma tables (static śāstra reference). */\n\n/** Minimal shape of react-i18next\'s `t`, so this data module stays hook-free. */\ntype TFn = (key: string, opts?: Record<string, unknown>) => string;\n',
);

src = src.replace("export type JanmaPhalaGrahaCol = { id: string; ne: string; en: string };", "export type JanmaPhalaGrahaCol = { id: string; /** Catalogue key for the column header. */ labelKey: string };");
src = src.replace("  houseNe: string;\n  houseEn: string;\n", "  /** Catalogue key for the house name. */\n  houseKey: string;\n");

fs.writeFileSync(SRC, src);

const sorted = Object.fromEntries(Object.keys(map).sort().map((k) => [k, map[k]]));
fs.writeFileSync(MAP, JSON.stringify(sorted, null, 2) + "\n");

console.log("new keys added:", added.length);
for (const k of added) console.log("  ", k, JSON.stringify(map[k]));
console.log("map total:", Object.keys(sorted).length);
