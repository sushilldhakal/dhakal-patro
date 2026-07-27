#!/usr/bin/env node
/** Simple pick migration: JSX → bilingualNode, else → bilingualText */
import fs from "fs";
import path from "path";

const files = process.argv.slice(2);

function migrate(content) {
  if (!/\bpick\s*\(/.test(content)) return content;

  content = content.replace(/\bconst\s*\{\s*([^}]*)\}\s*=\s*useLocale\(\)/g, (_, inner) => {
    const parts = inner.split(",").map((s) => s.trim()).filter((p) => p && p !== "pick");
    if (!parts.includes("lang")) parts.unshift("lang");
    return `const { ${parts.join(", ")} } = useLocale()`;
  });

  // JSX first (pick followed by fragment or element)
  content = content.replace(/\bpick\s*\(\s*(<)/g, "bilingualNode(lang, $1");
  // remaining
  content = content.replace(/\bpick\s*\(/g, "bilingualText(lang, ");

  if (content.includes("bilingualText(") || content.includes("bilingualNode(")) {
    if (!content.includes("@/i18n/locale")) {
      content = `import { bilingualText, bilingualNode, useLocale } from "@/i18n/locale";\n${content}`;
    } else {
      content = content.replace(
        /import\s*\{([^}]*)\}\s*from\s*"@\/i18n\/locale"/,
        (_, im) => {
          const parts = im.split(",").map((s) => s.trim()).filter(Boolean);
          for (const s of ["bilingualText", "bilingualNode", "useLocale"]) {
            if (!parts.includes(s)) parts.push(s);
          }
          return `import { ${parts.join(", ")} } from "@/i18n/locale"`;
        },
      );
    }
  }

  if (content.includes('t("pick_static.') || content.includes("bilingualText(lang, \"")) {
    // static bilingualText with two string literals - optional upgrade later
  }

  return content;
}

for (const f of files) {
  const c = migrate(fs.readFileSync(f, "utf8"));
  fs.writeFileSync(f, c);
  console.log("ok", f);
}
