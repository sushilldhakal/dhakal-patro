/**
 * Reports which of a set of candidate (ne, en) pairs already exist in the
 * catalogue, reading src/i18n/strings.ts directly so it stays right even when
 * the generated JSON is stale.
 *
 *   node .tmp/lookup.mjs <candidates.json>
 */
import { readFileSync } from "node:fs";

const source = readFileSync("src/i18n/strings.ts", "utf8");

/** key -> { ne, en } for every entry in the catalogue. */
const catalogue = new Map();
const byPair = new Map();
const byNe = new Map();
const byEn = new Map();

const STR = String.raw`"((?:[^"\\]|\\.)*)"`;
const entry = new RegExp(
  String.raw`^ {2}"([^"]+)":\s*\{\s*ne:\s*${STR},\s*en:\s*${STR},?\s*\},?$`,
  "gm",
);
const multi = new RegExp(
  String.raw`^ {2}"([^"]+)":\s*\{\s*\n\s*ne:\s*${STR},\s*\n\s*en:\s*${STR},?\s*\n\s*\},?$`,
  "gm",
);

for (const re of [entry, multi]) {
  let m;
  while ((m = re.exec(source))) {
    const ne = JSON.parse(`"${m[2]}"`);
    const en = JSON.parse(`"${m[3]}"`);
    catalogue.set(m[1], { ne, en });
    const pair = JSON.stringify([ne, en]);
    if (!byPair.has(pair)) byPair.set(pair, []);
    byPair.get(pair).push(m[1]);
    if (!byNe.has(ne)) byNe.set(ne, []);
    byNe.get(ne).push(m[1]);
    if (!byEn.has(en)) byEn.set(en, []);
    byEn.get(en).push(m[1]);
  }
}

console.error(`catalogue: ${catalogue.size} entries parsed`);

const candidates = JSON.parse(readFileSync(process.argv[2], "utf8"));
for (const [key, { ne, en }] of Object.entries(candidates)) {
  const exact = byPair.get(JSON.stringify([ne, en]));
  if (exact) {
    console.log(`EXACT  ${key} -> ${exact.join(", ")}`);
    continue;
  }
  const near = [
    ...(byNe.get(ne) ?? []).map((k) => `ne=${k} (en: ${JSON.stringify(catalogue.get(k).en)})`),
    ...(byEn.get(en) ?? []).map((k) => `en=${k} (ne: ${JSON.stringify(catalogue.get(k).ne)})`),
  ];
  if (near.length) console.log(`NEAR   ${key}: ${near.join(" | ")}`);
  else console.log(`NEW    ${key}`);
}
