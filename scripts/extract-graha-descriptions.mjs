import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "src");
const raw = fs.readFileSync(path.join(root, "lib/graha-detail-descriptions.ts.bak"), "utf8").catch?.() 
  ?? fs.readFileSync(path.join(root, "lib/graha-detail-descriptions.ts"), "utf8");

// Read from git if file was already overwritten
let src = raw;
if (!src.includes("GRAHA_PAGE_DESCRIPTIONS")) {
  const { execSync } = await import("child_process");
  try {
    src = execSync("git show HEAD:src/lib/graha-detail-descriptions.ts", { cwd: process.cwd() }).toString();
  } catch {
    console.error("Cannot find original graha descriptions");
    process.exit(1);
  }
}

const en = JSON.parse(fs.readFileSync(path.join(root, "i18n/en.json"), "utf8"));
const ne = JSON.parse(fs.readFileSync(path.join(root, "i18n/ne.json"), "utf8"));
const enDesc = {};
const neDesc = {};
const pages = ["graha-sthiti", "graha-asta", "graha-vakri", "surya-grahan", "chandra-grahan"];
const sections = ["what", "how", "meaning"];

for (const page of pages) {
  enDesc[page] = {};
  neDesc[page] = {};
  for (const sec of sections) {
    const pat = new RegExp(
      `"${page.replace(/-/g, "\\-")}":\\s*\\{[\\s\\S]*?${sec}:\\s*\\{\\s*ne:\\s*"((?:\\\\.|[^"])*)"\\s*,\\s*en:\\s*"((?:\\\\.|[^"])*)"`,
    );
    const m = src.match(pat);
    if (m) {
      neDesc[page][sec] = JSON.parse(`"${m[1]}"`);
      enDesc[page][sec] = JSON.parse(`"${m[2]}"`);
    }
  }
}

en.graha_descriptions = enDesc;
ne.graha_descriptions = neDesc;
fs.writeFileSync(path.join(root, "i18n/en.json"), JSON.stringify(en, null, 2) + "\n");
fs.writeFileSync(path.join(root, "i18n/ne.json"), JSON.stringify(ne, null, 2) + "\n");
console.log("Done", Object.keys(enDesc));
