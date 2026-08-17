import { readFileSync } from "node:fs";

const ne = JSON.parse(readFileSync("src/i18n/ne.json", "utf8"));
const en = JSON.parse(readFileSync("src/i18n/en.json", "utf8"));

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

const flatNe = flatten(ne);
const flatEn = flatten(en);

const byPair = new Map();
for (const key of Object.keys(flatNe)) {
  if (!(key in flatEn)) continue;
  const pair = JSON.stringify([flatNe[key], flatEn[key]]);
  if (!byPair.has(pair)) byPair.set(pair, []);
  byPair.get(pair).push(key);
}

const candidates = JSON.parse(readFileSync(process.argv[2], "utf8"));
const result = {};
for (const [key, v] of Object.entries(candidates)) {
  const hit = byPair.get(JSON.stringify([v.ne, v.en]));
  result[key] = { ne: v.ne, en: v.en, _at: v._at, _via: v._via, reuse: hit ?? null };
}
console.log(JSON.stringify(result, null, 2));

const reusable = Object.values(result).filter((r) => r.reuse).length;
console.error(`${reusable}/${Object.keys(result).length} pairs have an exact existing key.`);
