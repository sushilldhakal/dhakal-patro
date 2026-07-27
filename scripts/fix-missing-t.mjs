#!/usr/bin/env node
/** Add missing const { t } = useTranslation() where t( is used */
import fs from "fs";
import path from "path";

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.(tsx?)$/.test(ent.name)) files.push(p);
  }
  return files;
}

function fix(content, filePath) {
  if (!/\bt\s*\(\s*["`]/.test(content)) return content;
  if (filePath.endsWith("locale.ts")) return content;

  if (!content.includes("useTranslation")) {
    content = `import { useTranslation } from "react-i18next";\n${content}`;
  }

  // File-level: if t( used outside functions, skip complex cases
  const fnRe = /((?:export )?(?:default )?(?:function \w+|const \w+ = (?:async )?\([^)]*\) =>))\s*(\([^)]*\))?\s*(?::\s*[^{]+)?\{/g;
  let m;
  const inserts = [];
  while ((m = fnRe.exec(content)) !== null) {
    const fnStart = m.index + m[0].length;
    // find matching close brace (approximate: next function or end)
    let depth = 1;
    let i = fnStart;
    while (i < content.length && depth > 0) {
      if (content[i] === "{") depth++;
      else if (content[i] === "}") depth--;
      i++;
    }
    const body = content.slice(fnStart, i - 1);
    if (!/\bt\s*\(\s*["`]/.test(body)) continue;
    if (/const\s*\{\s*[^}]*\bt\b/.test(body.slice(0, 400))) continue;
    if (/const\s*\{\s*t\s*,/.test(body.slice(0, 400)) || /,\s*t\s*\}/.test(body.slice(0, 400))) continue;
    inserts.push({ pos: fnStart, text: "\n  const { t } = useTranslation();" });
  }

  for (let i = inserts.length - 1; i >= 0; i--) {
    const { pos, text } = inserts[i];
    content = content.slice(0, pos) + text + content.slice(pos);
  }

  // Module-level arrow components: export const Foo = () => {
  content = content.replace(
    /(export const \w+ = \([^)]*\) => \{)(\s*\n)(?!.*const \{ t \} = useTranslation)/,
    (full, head, nl) => {
      const fnStart = content.indexOf(full) + head.length + nl.length;
      const next200 = content.slice(fnStart, fnStart + 500);
      if (/\bt\s*\(\s*["`]/.test(next200) && !/const\s*\{\s*[^}]*\bt\b/.test(next200.slice(0, 200))) {
        return head + nl + "  const { t } = useTranslation();" + nl;
      }
      return full;
    },
  );

  return content;
}

let n = 0;
for (const f of walk(path.join(process.cwd(), "src"))) {
  const orig = fs.readFileSync(f, "utf8");
  const fixed = fix(orig, f);
  if (fixed !== orig) {
    fs.writeFileSync(f, fixed);
    n++;
  }
}
console.log("fixed", n, "files");
