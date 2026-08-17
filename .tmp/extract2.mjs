/**
 * Second pass over the same files, for the pair shapes scripts/i18n-extract.mjs
 * does not recognise:
 *
 *   { lat: 0, ne: "…", en: "…", c: … }   ne/en with siblings or reordered
 *   { res: "…", resEn: "…" }             an <x>/<x>En suffix pair
 *   bilingualText(lang, `…`, `…`)        template literals with no substitution
 *
 * Emits the same shape as the first pass so the two can be merged by hand.
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";

const files = process.argv.slice(2);
const STR = String.raw`"((?:[^"\\]|\\.)*)"`;

const PATTERNS = [
  // ne/en in one object literal, tolerating siblings between them.
  { name: "object*", re: new RegExp(String.raw`\bne:\s*${STR}[^{}]*?\ben:\s*${STR}`, "g") },
  // <x>: "…", <x>En: "…"
  { name: "xEn", re: new RegExp(String.raw`\b(\w+):\s*${STR},\s*\1En:\s*${STR}`, "g"), shift: 1 },
  // Template literals with nothing interpolated — still plain copy.
  {
    name: "tmpl",
    re: /\bbilingualText\(\s*lang\s*,\s*`([^`$\\]*)`\s*,\s*`([^`$\\]*)`\s*,?\s*\)/g,
  },
];

const out = {};
for (const file of files) {
  const source = readFileSync(file, "utf8");
  const label = basename(file).replace(/\.[jt]sx?$/, "");
  for (const { name, re, shift = 0 } of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(source))) {
      const ne = JSON.parse(`"${m[1 + shift]}"`);
      const en = JSON.parse(`"${m[2 + shift]}"`);
      if (!ne.trim() || !en.trim()) continue;
      const line = source.slice(0, m.index).split("\n").length;
      // Several pairs can share a line, so the id carries an occurrence count.
      let id = `${label}:${line}#${name}`;
      for (let n = 2; id in out; n++) id = `${label}:${line}#${name}#${n}`;
      out[id] = { ne, en };
    }
  }
}
console.log(JSON.stringify(out, null, 2));
console.error(`${Object.keys(out).length} pair(s)`);
