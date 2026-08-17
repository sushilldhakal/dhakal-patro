import fs from "node:fs";

const P = "scripts/i18n-maps/kundali-sait.json";
const map = JSON.parse(fs.readFileSync(P, "utf8"));

const add = {
  "kundali.x.vimshopaka_grade_full": { ne: "पूर्ण", en: "Full" },
  "kundali.x.vimshopaka_grade_mediocre": { ne: "मध्यम", en: "Mediocre" },
  "kundali.x.vimshopaka_grade_little": { ne: "अल्प", en: "Little" },
  "kundali.x.vimshopaka_grade_incapable": { ne: "असमर्थ", en: "Incapable" },
};

for (const [k, v] of Object.entries(add)) {
  if (map[k]) {
    console.log("already present:", k);
    continue;
  }
  map[k] = v;
}

const sorted = Object.fromEntries(Object.keys(map).sort().map((k) => [k, map[k]]));
fs.writeFileSync(P, JSON.stringify(sorted, null, 2) + "\n");
console.log("total keys:", Object.keys(sorted).length);
