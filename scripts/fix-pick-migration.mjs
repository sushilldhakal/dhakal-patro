#!/usr/bin/env node
/** Fix broken useTranslation injection inside parameter lists */
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

function fixFile(content) {
  let changed = false;

  // Move `const { t } = useTranslation();` out of destructured params
  const paramInject = /(\{)\s*\n\s*const\s*\{\s*t\s*\}\s*=\s*useTranslation\(\);\s*\n/g;
  if (paramInject.test(content)) {
    content = content.replace(paramInject, "$1\n");
    changed = true;
  }

  // Also inline: `export function Foo({ const { t } = useTranslation(); x }:`
  content = content.replace(
    /\(\{\s*const\s*\{\s*t\s*\}\s*=\s*useTranslation\(\);\s*/g,
    "({ ",
  );

  // Fix `}) {\n  ;\n` stray semicolon after broken inject
  content = content.replace(/\)\s*\{\s*;\s*\n/g, ") {\n");

  // Inject t at start of function body if file uses t("pick_static but missing hook in that function
  // Pattern: function X(...) {  -> add const { t } if body uses pick_static and no useTranslation in preceding 5 lines
  content = content.replace(
    /((?:export )?(?:default )?(?:function|const) \w+[^{=]*(?:=\s*)?\([^)]*\)\s*(?::\s*[^{]+)?\{)(\s*\n)/g,
    (full, head, nl) => {
      // look ahead in function - simplified: if next 500 chars has t("pick_static and not useTranslation
      const fnStart = content.indexOf(full);
      const fnEnd = content.indexOf("\n}", fnStart);
      const body = content.slice(fnStart + full.length, fnEnd > fnStart ? fnEnd : fnStart + 800);
      if (body.includes('t("pick_static') && !body.includes("useTranslation()") && !body.includes("useTranslation(")) {
        changed = true;
        return head + nl + "  const { t } = useTranslation();" + nl;
      }
      return full;
    },
  );

  // Fix nested pick in template - DayTimeline pattern
  content = content.replace(
    /bilingualText\(lang, `([^`]*)\$\{pick\(([^)]+)\)\}([^`]*)`/g,
    (m, before, pickArgs, after) => {
      const parts = pickArgs.split(",").map((s) => s.trim());
      if (parts.length >= 2) {
        changed = true;
        return `bilingualText(lang, \`${before}\${${parts[0]}}${after}\`, \`${before}\${${parts[1]}}${after}\`)`;
      }
      return m;
    },
  );

  // Fix remaining pick( in bilingualText templates
  content = content.replace(
    /`Switch to \$\{pick\(([^,]+),\s*([^)]+)\)\}`/g,
    "`Switch to ${bilingualText(lang, $1, $2)}`",
  );

  return { content, changed };
}

for (const f of walk(path.join(process.cwd(), "src"))) {
  let content = fs.readFileSync(f, "utf8");
  const orig = content;
  ({ content } = fixFile(content));
  if (content !== orig) fs.writeFileSync(f, content);
}

console.log("repair done");
