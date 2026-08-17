import fs from "node:fs";
import { execSync } from "node:child_process";

const FILES = execSync(
  "rg -l --glob 'src/components/kundali/*.tsx' --glob 'src/components/sait/*.tsx' --glob 'src/lib/sait-rules-content.ts' --glob 'src/lib/kundali/janma-phala-tables.ts' -e '' .",
  { encoding: "utf8" },
).trim().split("\n");

const ASSIGNED = [
  "src/components/kundali/ShadbalaCard.tsx",
  "src/components/kundali/ShantiVidhiPanel.tsx",
  "src/components/kundali/AshtakavargaCard.tsx",
  "src/components/kundali/BhavaBalaCard.tsx",
  "src/components/kundali/VimshopakaCard.tsx",
  "src/components/kundali/JanmaPhalaTables.tsx",
  "src/components/kundali/DashaSystemPanel.tsx",
  "src/components/kundali/DashaTree.tsx",
  "src/components/kundali/YogaReferenceCatalog.tsx",
  "src/components/kundali/KundaliMilanResult.tsx",
  "src/components/kundali/DivisionalChartCompare.tsx",
  "src/components/kundali/GrahaDetailsList.tsx",
  "src/components/kundali/KundaliControls.tsx",
  "src/components/kundali/KundaliReport.tsx",
  "src/components/kundali/D1Chart.tsx",
  "src/lib/kundali/janma-phala-tables.ts",
  "src/components/sait/SaitDayCard.tsx",
  "src/components/sait/SaitRulesSection.tsx",
  "src/lib/sait-rules-content.ts",
];
void FILES;

const map = JSON.parse(fs.readFileSync("scripts/i18n-maps/kundali-sait.json", "utf8"));
const ne = JSON.parse(fs.readFileSync("src/i18n/ne.json", "utf8"));
const en = JSON.parse(fs.readFileSync("src/i18n/en.json", "utf8"));

const flat = new Set();
const walk = (obj, prefix) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") walk(v, key);
    else flat.add(key);
  }
};
walk(ne, "");

const missing = new Map();
const KEY_RE = /"((?:kundali|sait|grahas|sections|holidays|choghadiya|common|nakshatras|rashis|tithis|panchang|calendar|report|ui)\.[a-z0-9_.]+)"/gi;

for (const f of ASSIGNED) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(KEY_RE)) {
    const key = m[1];
    if (map[key] || flat.has(key)) continue;
    if (!missing.has(key)) missing.set(key, f);
  }
}

console.log("map keys:", Object.keys(map).length);
console.log("catalogue keys:", flat.size);
if (missing.size === 0) console.log("OK: every referenced key resolves");
else {
  console.log("MISSING (" + missing.size + "):");
  for (const [k, f] of missing) console.log(" ", k, "<-", f);
}

// Also: map keys that duplicate an existing catalogue pair (should have been reused)
const enFlat = {};
const walkV = (obj, prefix) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") walkV(v, key);
    else enFlat[key] = v;
  }
};
walkV(en, "");
const neFlat = {};
const walkN = (obj, prefix) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") walkN(v, key);
    else neFlat[key] = v;
  }
};
walkN(ne, "");

const byPair = new Map();
for (const k of Object.keys(neFlat)) {
  byPair.set(`${neFlat[k]}\u0000${enFlat[k]}`, k);
}
const shouldReuse = [];
for (const [k, v] of Object.entries(map)) {
  const hit = byPair.get(`${v.ne}\u0000${v.en}`);
  if (hit) shouldReuse.push([k, hit]);
}
console.log("map entries duplicating an existing catalogue pair:", shouldReuse.length);
for (const [k, hit] of shouldReuse.slice(0, 40)) console.log("  ", k, "=>", hit);
