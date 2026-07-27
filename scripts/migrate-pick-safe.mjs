#!/usr/bin/env node
/** Safe pick migration for specific files — no param-list injection */
import fs from "fs";
import path from "path";
import crypto from "crypto";

const files = process.argv.slice(2);
const EN_JSON = path.join(process.cwd(), "src/i18n/en.json");
const NE_JSON = path.join(process.cwd(), "src/i18n/ne.json");
const enJson = JSON.parse(fs.readFileSync(EN_JSON, "utf8"));
const neJson = JSON.parse(fs.readFileSync(NE_JSON, "utf8"));
if (!enJson.pick_static) { enJson.pick_static = {}; neJson.pick_static = {}; }

function slugKey(en) {
  const hash = crypto.createHash("md5").update(en).digest("hex").slice(0, 6);
  const base = en.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 55);
  return `${base || "text"}_${hash}`;
}

function registerStatic(ne, en) {
  let key = slugKey(en);
  let i = 0;
  while (enJson.pick_static[key] && enJson.pick_static[key] !== en) key = `${slugKey(en)}_${++i}`;
  enJson.pick_static[key] = en;
  neJson.pick_static[key] = ne;
  return key;
}

function parsePickArgs(content, startIdx) {
  let depth = 1;
  let i = startIdx;
  let argStart = startIdx;
  const args = [];
  let inStr = null;
  let escape = false;
  let tmplDepth = 0;
  while (i < content.length && depth > 0) {
    const c = content[i];
    if (inStr) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (inStr === "`" && c === "$" && content[i + 1] === "{") tmplDepth++;
      else if (inStr === "`" && c === "}" && tmplDepth > 0) tmplDepth--;
      else if (c === inStr && tmplDepth === 0) inStr = null;
    } else {
      if (c === '"' || c === "'" || c === "`") inStr = c;
      else if (c === "(" || c === "{" || c === "[") depth++;
      else if (c === ")" || c === "}" || c === "]") {
        depth--;
        if (depth === 0 && c === ")") {
          args.push(content.slice(argStart, i).trim());
          break;
        }
      } else if (c === "," && depth === 1) {
        args.push(content.slice(argStart, i).trim());
        argStart = i + 1;
      }
    }
    i++;
  }
  return { args, endIdx: i };
}

function isStaticArg(s) {
  const t = s.trim();
  if (t.startsWith("`") && !t.includes("${")) return true;
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return true;
  return false;
}

function unquote(s) {
  const t = s.trim();
  if (t.startsWith("`")) return t.slice(1, -1);
  try { return JSON.parse(t.replace(/^'/, '"').replace(/'$/, '"')); } catch { return t.slice(1, -1); }
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  if (!/\bpick\s*\(/.test(content)) return 0;
  let count = 0;
  const reps = [];
  let idx = 0;
  while (true) {
    const pos = content.indexOf("pick(", idx);
    if (pos === -1) break;
    if (pos >= 4 && content.slice(pos - 4, pos) === "Locale") { idx = pos + 5; continue; }
    const { args, endIdx } = parsePickArgs(content, pos + 5);
    if (args.length < 2) { idx = endIdx + 1; continue; }
    let rep;
    if (args[0].trimStart().startsWith("<") && args[1].trimStart().startsWith("<")) {
      rep = `bilingualNode(lang, ${args[0]}, ${args[1]})`;
    } else if (isStaticArg(args[0]) && isStaticArg(args[1])) {
      rep = `t("pick_static.${registerStatic(unquote(args[0]), unquote(args[1]))}")`;
    } else {
      rep = `bilingualText(lang, ${args[0]}, ${args[1]})`;
    }
    reps.push({ start: pos, end: endIdx + 1, rep });
    count++;
    idx = endIdx + 1;
  }
  for (let i = reps.length - 1; i >= 0; i--) {
    const r = reps[i];
    content = content.slice(0, r.start) + r.rep + content.slice(r.end);
  }
  if (content.includes("bilingualText(") || content.includes("bilingualNode(")) {
    if (!content.includes('from "@/i18n/locale"')) {
      content = `import { bilingualText, bilingualNode, useLocale } from "@/i18n/locale";\n${content}`;
    } else {
      if (content.includes("bilingualText(") && !content.includes("bilingualText")) {
        // noop
      }
      content = content.replace(/import\s*\{([^}]*)\}\s*from\s*"@\/i18n\/locale"/, (_, im) => {
        const parts = im.split(",").map((s) => s.trim()).filter(Boolean);
        if (content.includes("bilingualText(") && !parts.includes("bilingualText")) parts.push("bilingualText");
        if (content.includes("bilingualNode(") && !parts.includes("bilingualNode")) parts.push("bilingualNode");
        if (!parts.includes("useLocale")) parts.push("useLocale");
        return `import { ${parts.join(", ")} } from "@/i18n/locale"`;
      });
    }
    content = content.replace(/const\s*\{\s*([^}]*)\}\s*=\s*useLocale\(\)/g, (_, inner) => {
      const parts = inner.split(",").map((s) => s.trim()).filter((p) => p && p !== "pick");
      if (!parts.includes("lang")) parts.unshift("lang");
      return `const { ${parts.join(", ")} } = useLocale()`;
    });
    // add lang to inner functions
    content = content.replace(
      /function (\w+)\([^)]*\)\s*\{([^{}]*(?:bilingualText|bilingualNode)\(lang)/g,
      (full, name, start) => {
        if (start.includes("useLocale()")) return full;
        return full.replace("{", "{\n  const { lang } = useLocale();");
      },
    );
  }
  if (content.includes('t("pick_static.')) {
    if (!content.includes("useTranslation")) content = `import { useTranslation } from "react-i18next";\n${content}`;
    // add t hook at start of each function/component that uses t( but lacks it
    content = content.replace(
      /((?:export )?(?:default )?(?:function|const) \w+[^{=]*(?:=\s*)?\([^)]*\)\s*(?::\s*[^{]+)?\{)(\s*\n)/g,
      (full, head, nl, offset) => {
        const bodyStart = content.indexOf(full) + full.length;
        const nextClose = content.indexOf("\nexport ", bodyStart);
        const body = content.slice(bodyStart, nextClose > bodyStart ? nextClose : bodyStart + 2000);
        if (body.includes('t("pick_static') && !body.slice(0, 200).includes("useTranslation()")) {
          return head + nl + "  const { t } = useTranslation();" + nl;
        }
        return full;
      },
    );
  }
  fs.writeFileSync(filePath, content);
  return count;
}

let total = 0;
for (const f of files) total += migrateFile(f);
fs.writeFileSync(EN_JSON, JSON.stringify(enJson, null, 2) + "\n");
fs.writeFileSync(NE_JSON, JSON.stringify(neJson, null, 2) + "\n");
console.log("migrated", total, "in", files.length, "files");
