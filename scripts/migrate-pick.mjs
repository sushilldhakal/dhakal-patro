#!/usr/bin/env node
/**
 * Migrates pick() → t() for static literals, bilingualText(lang,…) for dynamic.
 * Skips src/i18n/locale.ts
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";

const SRC = path.join(process.cwd(), "src");
const EN_JSON = path.join(SRC, "i18n/en.json");
const NE_JSON = path.join(SRC, "i18n/ne.json");

const enJson = JSON.parse(fs.readFileSync(EN_JSON, "utf8"));
const neJson = JSON.parse(fs.readFileSync(NE_JSON, "utf8"));
if (!enJson.pick_static) {
  enJson.pick_static = {};
  neJson.pick_static = {};
}

const staticKeys = new Map();

function slugKey(en) {
  const base = en
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 55);
  const hash = crypto.createHash("md5").update(en).digest("hex").slice(0, 6);
  return `${base || "text"}_${hash}`;
}

function registerStatic(ne, en) {
  const k = `${ne}\0${en}`;
  if (staticKeys.has(k)) return staticKeys.get(k);
  let key = slugKey(en);
  let i = 0;
  while (enJson.pick_static[key] && enJson.pick_static[key] !== en) {
    key = `${slugKey(en)}_${++i}`;
  }
  enJson.pick_static[key] = en;
  neJson.pick_static[key] = ne;
  staticKeys.set(k, key);
  return key;
}

function isStringLiteral(s) {
  const t = s.trim();
  return (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'")) ||
    (t.startsWith("`") && t.endsWith("`") && !t.slice(1, -1).includes("${"))
  );
}

function unquote(s) {
  const t = s.trim();
  if (t.startsWith("`")) return t.slice(1, -1);
  try {
    return JSON.parse(t.replace(/^'/, '"').replace(/'$/, '"'));
  } catch {
    return t.slice(1, -1);
  }
}

function parsePickArgs(content, openParenIdx) {
  let depth = 1;
  let i = openParenIdx + 1;
  const args = [];
  let argStart = i;
  while (i < content.length && depth > 0) {
    const c = content[i];
    if (c === "(" || c === "{" || c === "[") depth++;
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
    i++;
  }
  return { args, endIdx: i };
}

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.(tsx?)$/.test(ent.name)) files.push(p);
  }
  return files;
}

function addImport(content, modulePath, symbol) {
  const re = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*"${modulePath.replace("/", "\\/")}"`);
  const m = content.match(re);
  if (m) {
    const parts = m[1].split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.includes(symbol)) {
      parts.push(symbol);
      return content.replace(re, `import { ${parts.join(", ")} } from "${modulePath}"`);
    }
    return content;
  }
  const line = `import { ${symbol} } from "${modulePath}";\n`;
  const firstImport = content.match(/^import .+\n/m);
  if (firstImport) {
    return content.replace(firstImport[0], firstImport[0] + line);
  }
  return line + content;
}

function ensureUseTranslation(content) {
  if (!content.includes("useTranslation")) {
    content = addImport(content, "react-i18next", "useTranslation");
  }
  return content;
}

function injectLangInFunctions(content) {
  // For function bodies using bilingualText(lang but missing lang declaration
  return content.replace(
    /((?:export )?(?:function|const) \w+[^{=]*(?:=\s*)?\([^)]*\)\s*(?::\s*[^{]+)?\{)([\s\S]*?)(?=\n(?:export )?(?:function|const)|\n*$)/g,
    (full, head, body) => {
      if (!body.includes("bilingualText(lang") || body.includes("useLocale()")) return full;
      if (body.includes("const { lang") || body.includes("let lang")) return full;
      return head + "\n  const { lang } = useLocale();" + body;
    },
  );
}

function processFile(filePath) {
  if (filePath.endsWith(`${path.sep}locale.ts`)) return { changed: false, count: 0 };

  let content = fs.readFileSync(filePath, "utf8");
  if (!/\bpick\s*\(/.test(content)) return { changed: false, count: 0 };

  let count = 0;
  let needsBilingual = false;
  let needsStaticT = false;

  const replacements = [];
  let searchFrom = 0;
  while (true) {
    const idx = content.indexOf("pick(", searchFrom);
    if (idx === -1) break;
    // skip pickLocale
    if (idx >= 4 && content.slice(idx - 4, idx) === "Locale") {
      searchFrom = idx + 5;
      continue;
    }
    const { args, endIdx } = parsePickArgs(content, idx + 4);
    if (args.length < 2) {
      searchFrom = endIdx + 1;
      continue;
    }
    const [a0, a1] = args;
    let replacement;
    if (isStringLiteral(a0) && isStringLiteral(a1)) {
      const key = registerStatic(unquote(a0), unquote(a1));
      replacement = `t("pick_static.${key}")`;
      needsStaticT = true;
    } else {
      replacement = `bilingualText(lang, ${a0}, ${a1})`;
      needsBilingual = true;
    }
    replacements.push({ start: idx, end: endIdx + 1, replacement });
    count++;
    searchFrom = endIdx + 1;
  }

  if (!replacements.length) return { changed: false, count: 0 };

  for (let i = replacements.length - 1; i >= 0; i--) {
    const r = replacements[i];
    content = content.slice(0, r.start) + r.replacement + content.slice(r.end);
  }

  if (needsBilingual || needsStaticT) {
    // Fix useLocale destructuring
    content = content.replace(
      /const\s*\{\s*([^}]*)\}\s*=\s*useLocale\(\)/g,
      (m, inner) => {
        const parts = inner
          .split(",")
          .map((s) => s.trim())
          .filter((p) => p && p !== "pick");
        if (needsBilingual && !parts.includes("lang")) parts.unshift("lang");
        if (!parts.length) return "";
        return `const { ${parts.join(", ")} } = useLocale()`;
      },
    );
    content = content.replace(/^\s*const\s*\{\s*\}\s*=\s*useLocale\(\);\s*\n/gm, "");
  }

  if (needsBilingual) {
    content = addImport(content, "@/i18n/locale", "bilingualText");
    if (!content.includes("useLocale")) {
      content = addImport(content, "@/i18n/locale", "useLocale");
    }
    content = injectLangInFunctions(content);
  }

  if (needsStaticT) {
    content = ensureUseTranslation(content);
    // Add t to existing useTranslation destructure
    content = content.replace(
      /const\s*\{\s*([^}]*)\}\s*=\s*useTranslation\(\)/g,
      (m, inner) => {
        const parts = inner.split(",").map((s) => s.trim()).filter(Boolean);
        if (!parts.includes("t")) parts.unshift("t");
        return `const { ${parts.join(", ")} } = useTranslation()`;
      },
    );
    // Inject t in top-level export function if missing
    if (!content.match(/const\s*\{[^}]*\bt\b[^}]*\}\s*=\s*useTranslation\(\)/)) {
      content = content.replace(
        /(export (?:default )?function \w+[^{]*\{)/,
        "$1\n  const { t } = useTranslation();",
      );
    }
    content = injectLangInFunctions(content);
  }

  fs.writeFileSync(filePath, content);
  return { changed: true, count };
}

const files = walk(SRC);
let total = 0;
const changedFiles = [];
for (const f of files) {
  const r = processFile(f);
  if (r.changed) {
    changedFiles.push(path.relative(process.cwd(), f));
    total += r.count;
  }
}

fs.writeFileSync(EN_JSON, JSON.stringify(enJson, null, 2) + "\n");
fs.writeFileSync(NE_JSON, JSON.stringify(neJson, null, 2) + "\n");

console.log(JSON.stringify({ total, files: changedFiles.length, staticKeys: Object.keys(enJson.pick_static).length }, null, 2));
