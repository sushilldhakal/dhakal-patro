/**
 * Rewrites src/lib/sait-rules-content.ts so the rule entries carry catalogue
 * keys instead of literal bilingual text, and emits the map of new keys.
 *
 *   node .tmp/xform-sait-rules.mjs            # writes .tmp/sait-rules-content.ts + .tmp/sait-map.json
 */
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "src/lib/sait-rules-content.ts";
const source = readFileSync(SRC, "utf8");
const lines = source.split("\n");

/* ── existing catalogue, so identical copy reuses a key ──────────────────── */
const flat = (obj, prefix = "", out = {}) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flat(v, key, out);
    else out[key] = v;
  }
  return out;
};
const flatNe = flat(JSON.parse(readFileSync("src/i18n/ne.json", "utf8")));
const flatEn = flat(JSON.parse(readFileSync("src/i18n/en.json", "utf8")));
const catalogueByPair = new Map();
for (const key of Object.keys(flatNe)) {
  if (!(key in flatEn)) continue;
  const pair = JSON.stringify([flatNe[key], flatEn[key]]);
  if (!catalogueByPair.has(pair)) catalogueByPair.set(pair, key);
}

/**
 * Rules the engine cannot toggle carry no `id`, so name them after what the
 * rule actually gates rather than their position in the array.
 */
const ROLE_BY_POSITION = {
  bratabandha_rule1: "bratabandha_season",
  bratabandha_rule4: "bratabandha_nakshatra",
  bratabandha_rule11: "bratabandha_sankranti_eclipse",
  griha_aarambha_rule1: "griha_aarambha_adhikmasa",
  griha_aarambha_rule2: "griha_aarambha_time_window",
  griha_aarambha_rule12: "griha_aarambha_durmuhurta",
  griha_aarambha_rule13: "griha_aarambha_chaturmasa",
  griha_pravesh_rule1: "griha_pravesh_month",
  griha_pravesh_rule2: "griha_pravesh_surya_bala",
  griha_pravesh_rule3: "griha_pravesh_tithi",
  griha_pravesh_rule4: "griha_pravesh_nakshatra",
  griha_pravesh_rule5: "griha_pravesh_yoga_karana",
  griha_pravesh_rule6: "griha_pravesh_graha",
  griha_pravesh_rule7: "griha_pravesh_lagna",
  griha_pravesh_rule8: "griha_pravesh_dosha",
  byaparik_pratisthan_rule1: "byaparik_pratisthan_month",
  byaparik_pratisthan_rule2: "byaparik_pratisthan_tithi",
  byaparik_pratisthan_rule3: "byaparik_pratisthan_nakshatra",
  byaparik_pratisthan_rule4: "byaparik_pratisthan_vara",
  byaparik_pratisthan_rule5: "byaparik_pratisthan_lagna",
  byaparik_pratisthan_rule6: "byaparik_pratisthan_yoga_karana",
  byaparik_pratisthan_rule7: "byaparik_pratisthan_dosha",
  byaparik_pratisthan_rule8: "byaparik_pratisthan_graha",
  rudri_jurne_rule1: "rudri_shiva_vasa",
  rudri_jurne_rule2: "rudri_shiva_vasa_barred",
  rudri_jurne_rule3: "rudri_agni_vasa",
  rudri_jurne_rule4: "rudri_nitya_naimittika",
  rudri_jurne_rule5: "rudri_yoga_karana",
  rudri_jurne_rule6: "rudri_tithi_month_preference",
  rudri_jurne_rule7: "rudri_sunrise_panchanga",
  agni_jurne_rule1: "agni_vasa_formula",
  agni_jurne_rule2: "agni_vasa_remainder",
  agni_jurne_rule3: "agni_absolute_tithi",
  agni_jurne_rule4: "agni_nitya_naimittika",
  agni_jurne_rule5: "agni_computation_basis",
  annaprasan_rule1: "annaprasan_month_age",
  annaprasan_rule2: "annaprasan_tithi",
  annaprasan_rule3: "annaprasan_nakshatra",
  annaprasan_rule4: "annaprasan_vara",
  annaprasan_rule5: "annaprasan_lagna_shuddhi",
  annaprasan_rule6: "annaprasan_guru_shukra_asta",
  annaprasan_rule7: "annaprasan_janma_tara",
  annaprasan_rule8: "annaprasan_safeguard_dosha",
  annaprasan_rule9: "annaprasan_daytime",
  annaprasan_rule10: "annaprasan_birth_date",
};

const map = {};
const byPair = new Map();
const reused = [];

/** One key per distinct pair; prefers an existing catalogue key. */
function keyFor(ne, en, proposed) {
  const pair = JSON.stringify([ne, en]);
  if (byPair.has(pair)) return byPair.get(pair);
  const existing = catalogueByPair.get(pair);
  if (existing) {
    byPair.set(pair, existing);
    reused.push(`${existing}  (would have been sait.x.${proposed})`);
    return existing;
  }
  let key = `sait.x.${proposed}`;
  let n = 2;
  while (key in map) key = `sait.x.${proposed}_${n++}`;
  map[key] = { ne, en };
  byPair.set(pair, key);
  return key;
}

const str = (line, field) => {
  const m = new RegExp(`^\\s*${field}:\\s*(".*")\\s*,?\\s*$`).exec(line);
  return m ? JSON.parse(m[1]) : null;
};

const out = [];
let category = null;
let ruleIdx = 0;
let inRules = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  /* module-scope `const X_GLOSS: BilingualText = { ne, en };` */
  const constGloss = /^const ([A-Z0-9_]+): BilingualText = \{$/.exec(line);
  if (constGloss) {
    const ne = str(lines[i + 1], "ne");
    const en = str(lines[i + 2], "en");
    if (ne == null || en == null || lines[i + 3] !== "};") {
      throw new Error(`unexpected const shape at line ${i + 1}`);
    }
    // MUHURTA_INTRO / DAYTIME_INTRO stay literal: they feed `method`, whose
    // prop type lives in files outside this migration.
    if (constGloss[1].endsWith("_INTRO")) {
      out.push(line, lines[i + 1], lines[i + 2], lines[i + 3]);
    } else {
      out.push(`const ${constGloss[1]} = ${JSON.stringify(keyFor(ne, en, constGloss[1].toLowerCase()))};`);
    }
    i += 3;
    continue;
  }

  /* category header inside SAIT_RULES_CONTENT */
  const cat = /^  "?([a-z-]+)"?: \{$/.exec(line);
  if (cat) {
    category = cat[1].replace(/-/g, "_");
    ruleIdx = 0;
    inRules = false;
    out.push(line);
    continue;
  }
  if (/^    rules: \[$/.test(line)) {
    inRules = true;
    out.push(line);
    continue;
  }
  if (/^    \],$/.test(line)) {
    inRules = false;
    out.push(line);
    continue;
  }

  /* `description: { ne, en },` — always a duplicate of sait.descriptions.<id> */
  if (/^    description: \{$/.test(line)) {
    const ne = str(lines[i + 1], "ne");
    const en = str(lines[i + 2], "en");
    if (ne == null || en == null || lines[i + 3] !== "    },") {
      throw new Error(`unexpected description shape at line ${i + 1}`);
    }
    out.push(`    description: ${JSON.stringify(keyFor(ne, en, `${category}_description`))},`);
    i += 3;
    continue;
  }

  if (inRules) {
    /* rule opens */
    if (/^      \{$/.test(line)) {
      ruleIdx++;
      // Role name: the toggle id when the rule has one, else its position.
      const idLine = /^        id: "([^"]+)",$/.exec(lines[i + 1]);
      const role = idLine ? idLine[1].replace(/-/g, "_") : `rule${ruleIdx}`;
      const positional = `${category}_${role}`;
      lines.currentRole = ROLE_BY_POSITION[positional] ?? positional;
      out.push(line);
      continue;
    }

    const role = lines.currentRole;

    /* the rule's own `ne:` + `en:` pair → a single `text:` key */
    if (/^        ne: "/.test(line) && /^        en: "/.test(lines[i + 1])) {
      const ne = str(line, "ne");
      const en = str(lines[i + 1], "en");
      out.push(`        text: ${JSON.stringify(keyFor(ne, en, role))},`);
      i += 1;
      continue;
    }

    /* one-line `source: { ne: "…", en: "…" },` */
    const inlineSource = /^        source: \{ ne: (".*?"), en: (".*?") \},$/.exec(line);
    if (inlineSource) {
      const key = keyFor(JSON.parse(inlineSource[1]), JSON.parse(inlineSource[2]), `${role}_source`);
      out.push(`        source: ${JSON.stringify(key)},`);
      continue;
    }

    /* wrapped `source: {` / `gloss: {` blocks */
    const block = /^        (source|gloss): \{$/.exec(line);
    if (block) {
      const ne = str(lines[i + 1], "ne");
      const en = str(lines[i + 2], "en");
      if (ne == null || en == null || lines[i + 3] !== "        },") {
        throw new Error(`unexpected ${block[1]} shape at line ${i + 1}`);
      }
      const key = keyFor(ne, en, `${role}_${block[1]}`);
      out.push(`        ${block[1]}: ${JSON.stringify(key)},`);
      i += 3;
      continue;
    }
  }

  out.push(line);
}

let result = out.join("\n");

/* the interfaces the rewritten data now satisfies */
result = result.replace(
  `export interface SaitRuleEntry extends BilingualText {
  /**
   * Stable id matching the backend's \`muhurta_engine.TOGGLEABLE_RULE_IDS\`. When
   * present, the rule can be switched off on the page and the engine recomputes
   * the dates without it. Rules without an id are always applied.
   */
  id?: string;
  source?: BilingualText;
  shloka?: string;
  gloss?: BilingualText;
}`,
  `export interface SaitRuleEntry {
  /**
   * Stable id matching the backend's \`muhurta_engine.TOGGLEABLE_RULE_IDS\`. When
   * present, the rule can be switched off on the page and the engine recomputes
   * the dates without it. Rules without an id are always applied.
   */
  id?: string;
  /** Catalogue key for the plain-language rule. */
  text: string;
  /** Catalogue key for the short citation. */
  source?: string;
  shloka?: string;
  /** Catalogue key for the translation of \`shloka\`. */
  gloss?: string;
}`,
);

result = result.replace(
  `export interface SaitContent {
  description: BilingualText;`,
  `export interface SaitContent {
  /** Catalogue key for the ceremony blurb. */
  description: string;`,
);

writeFileSync(".tmp/sait-rules-content.ts", result, "utf8");
writeFileSync(".tmp/sait-map.json", JSON.stringify(map, null, 2), "utf8");

console.log(`${Object.keys(map).length} new key(s), ${reused.length} existing key(s) reused.`);
for (const r of reused) console.log(`  ${r}`);
