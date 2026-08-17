import fs from "node:fs";

const map = JSON.parse(fs.readFileSync("scripts/i18n-maps/kundali-sait.json", "utf8"));
const ne = JSON.parse(fs.readFileSync("src/i18n/ne.json", "utf8"));
const en = JSON.parse(fs.readFileSync("src/i18n/en.json", "utf8"));

const flatten = (obj, prefix = "", out = {}) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") flatten(v, key, out);
    else out[key] = v;
  }
  return out;
};
const N = flatten(ne);
const E = flatten(en);

const newKeys = [];
const reused = [];
const conflicts = [];

for (const [k, v] of Object.entries(map)) {
  const existing = k in N;
  if (!existing) {
    newKeys.push(k);
    if (!/^(kundali|sait)\.x\./.test(k)) console.log("BAD NAMESPACE (new key):", k);
    continue;
  }
  reused.push(k);
  if (N[k] !== v.ne || E[k] !== v.en) {
    conflicts.push([k, { catalogue: { ne: N[k], en: E[k] }, map: v }]);
  }
}

console.log("new keys:", newKeys.length, " reused existing keys:", reused.length);
console.log("\nreused keys:");
for (const k of reused.sort()) console.log("  ", k, "=", JSON.stringify(N[k]), "/", JSON.stringify(E[k]));
console.log("\nCONFLICTS (map text differs from catalogue text):", conflicts.length);
for (const [k, c] of conflicts) console.log("  ", k, JSON.stringify(c));
