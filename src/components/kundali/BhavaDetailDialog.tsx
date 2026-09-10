import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLocale, bilingualText } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import type { BhavaHouse } from "@/lib/bhava";
import { houseBadge, formatHouseBadge, drishtiTargetHouses } from "@/lib/bhava";
import { GRAHA_NAME, type GrahaKey } from "@/lib/graha-details";
import type { BhavaReferencePayload } from "@/lib/api";
import {
  HOUSE_ORDINAL_NE,
  HOUSE_ORDINAL_EN,
  HOUSE_LORD_TITLE_NE,
  computeAspectedBy,
  splitList,
} from "@/lib/kundali/bhava-detail";
import { formatRashiByNumber } from "@/lib/rashi-i18n";

function grahaName(key: string, lang: "ne" | "en"): string {
  const entry = GRAHA_NAME[key as GrahaKey];
  return entry ? bilingualText(lang, entry.ne, entry.en, key) : key;
}

function joinNames(keys: string[], lang: "ne" | "en"): string {
  if (keys.length === 0) return bilingualText(lang, "कोही छैन", "None");
  return keys.map((k) => grahaName(k, lang)).join(lang === "en" ? ", " : ", ");
}

function yutiKey(keys: string[]): string {
  return [...keys].sort().join("+");
}

/** Every 3-element subset of `keys` — houses rarely hold more than 3-4
 * grahas, so this stays small in practice. */
function subsetsOf3(keys: string[]): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      for (let k = j + 1; k < keys.length; k++) {
        out.push([keys[i], keys[j], keys[k]]);
      }
    }
  }
  return out;
}

/** Plain header + content, no border/bg box — sections separate via the
 * parent's divide-y hairlines instead of nested cards. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-4 first:pt-0 last:pb-0">
      <h3 className="mb-2 text-sm font-bold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

const ratingBadgeCls: Record<string, string> = {
  uttam: "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  shubh: "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  mishrit: "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  kamjor: "border-destructive/20 bg-destructive/10 text-destructive",
};

function GrahaKarakatvaCard({
  grahaKey,
  house,
  reference,
  lang,
  digits,
}: {
  grahaKey: string;
  house: number;
  reference: BhavaReferencePayload;
  lang: "ne" | "en";
  digits: (v: string | number) => string;
}) {
  const k = reference.grahaKarakatva[grahaKey];
  if (!k) return null;
  const saravali = reference.grahaHouseSaravali[grahaKey]?.[house];

  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-foreground">🪐 {grahaName(grahaKey, lang)}</p>

      <div>
        <p className="text-sm font-semibold text-foreground">
          📜 {bilingualText(lang, "कारकत्व श्लोक", "Karakatva shloka")}
          <span className="ml-1 font-normal text-muted-foreground">
            — {bilingualText(lang, k.shlokaSourceNe, k.shlokaSourceEn)}
          </span>
        </p>
        <p className="mt-1 whitespace-pre-line text-sm italic leading-relaxed text-foreground/90">{k.shloka}</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">📋 {bilingualText(lang, "कारकत्व विषयहरू", "Karakatva subjects")}</p>
        <p className="mt-1 text-sm leading-relaxed">{bilingualText(lang, k.subjectsNe, k.subjectsEn)}।</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">💡 {bilingualText(lang, "ग्रहको महत्व", "Significance")}</p>
        <p className="mt-1 text-sm leading-relaxed">{bilingualText(lang, k.significanceNe, k.significanceEn)}</p>
      </div>

      <div className="border-l-2 border-secondary/40 pl-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">
            ⬡{" "}
            {bilingualText(
              lang,
              `भाव ${digits(house)} मा ${grahaName(grahaKey, lang)}को फल`,
              `${grahaName(grahaKey, lang)} in house ${digits(house)}`,
            )}
          </p>
          {saravali && (
            <span
              className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 text-sm font-semibold leading-none",
                ratingBadgeCls[saravali.rating],
              )}
            >
              {bilingualText(lang, reference.ratingLabel[saravali.rating].ne, reference.ratingLabel[saravali.rating].en)}
            </span>
          )}
        </div>

        {saravali ? (
          <>
            <p className="mt-2 text-sm font-semibold text-foreground">
              📜 {bilingualText(lang, "श्लोक", "Shloka")} — {bilingualText(lang, saravali.shlokaSourceNe, saravali.shlokaSourceEn)}
            </p>
            <p className="mt-1 whitespace-pre-line text-sm italic leading-relaxed text-foreground/90">{saravali.shloka}</p>
            <p className="mt-1.5 text-sm leading-relaxed">
              <span className="font-semibold text-foreground">{bilingualText(lang, "अर्थ:", "Meaning:")}</span>{" "}
              {bilingualText(lang, saravali.meaningNe, saravali.meaningEn)}
            </p>
            <p className="mt-1 text-sm leading-relaxed">
              <span className="font-semibold text-foreground">{bilingualText(lang, "व्याख्या:", "Explanation:")}</span>{" "}
              {bilingualText(lang, saravali.explanationNe, saravali.explanationEn)}
            </p>
          </>
        ) : (
          <p className="mt-1.5 text-sm text-muted-foreground">
            {bilingualText(
              lang,
              "यो भाव-ग्रह संयोजनको लागि सारावली श्लोक अहिले उपलब्ध छैन।",
              "No saravali shloka is available for this house-graha combination yet.",
            )}
          </p>
        )}
      </div>

      <PhaladeepikaSection grahaKey={grahaKey} house={house} reference={reference} lang={lang} digits={digits} />
    </div>
  );
}

/** Phaladeepika ch. 2 karakatva + traditional house-placement summary —
 * separate classical source from the Uttara Kalamrita karakatva and the
 * saravali table above, so shown as its own citation-backed block rather
 * than merged into them. */
function PhaladeepikaSection({
  grahaKey,
  house,
  reference,
  lang,
  digits,
}: {
  grahaKey: string;
  house: number;
  reference: BhavaReferencePayload;
  lang: "ne" | "en";
  digits: (v: string | number) => string;
}) {
  const p = reference.phaladeepikaKarakatva[grahaKey];
  if (!p) return null;
  const houseResult = reference.phaladeepikaHouseResults[grahaKey]?.[house];

  return (
    <div className="border-l-2 border-secondary/40 pl-3">
      <p className="text-sm font-semibold text-foreground">
        📜 {bilingualText(lang, "फलदीपिका अनुसार", "Per the Phaladeepika")}
      </p>
      {p.shloka && (
        <>
          <p className="mt-1.5 text-sm font-semibold text-foreground">
            {bilingualText(lang, "कारकत्व श्लोक", "Karakatva shloka")}
            <span className="ml-1 font-normal text-muted-foreground">
              — {bilingualText(lang, p.shlokaSourceNe, p.shlokaSourceEn)}
            </span>
          </p>
          <p className="mt-1 whitespace-pre-line text-sm italic leading-relaxed text-foreground/90">{p.shloka}</p>
          <p className="mt-1 text-sm leading-relaxed">{bilingualText(lang, p.translationNe, p.translationEn)}</p>
        </>
      )}
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {bilingualText(lang, p.natureNe, p.natureEn)}
      </p>
      {houseResult && (
        <p className="mt-1.5 text-sm leading-relaxed">
          <span className="font-semibold text-foreground">
            {bilingualText(lang, `भाव ${digits(house)}:`, `House ${digits(house)}:`)}
          </span>{" "}
          {bilingualText(lang, houseResult.ne, houseResult.en)}
        </p>
      )}
      <p className="mt-1.5 text-sm text-muted-foreground">
        {bilingualText(lang, `स्रोत: ${reference.phaladeepikaSource}`, `Source: ${reference.phaladeepikaSource}`)}
      </p>
    </div>
  );
}

type Props = {
  houses: BhavaHouse[];
  houseNumber: number | null;
  reference: BhavaReferencePayload | undefined;
  onClose: () => void;
};

export function BhavaDetailDialog({ houses, houseNumber, reference, onClose }: Props) {
  const { lang, digits } = useLocale();
  const house = houseNumber != null ? houses.find((h) => h.house === houseNumber) : undefined;

  return (
    <Dialog open={Boolean(house)} onOpenChange={(next) => !next && onClose()}>
      {house && (
        reference ? (
          <BhavaDetailBody house={house} houses={houses} reference={reference} lang={lang} digits={digits} onClose={onClose} />
        ) : (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{bilingualText(lang, "लोड हुँदैछ…", "Loading…")}</DialogTitle>
            </DialogHeader>
          </DialogContent>
        )
      )}
    </Dialog>
  );
}

function BhavaDetailBody({
  house,
  houses,
  reference,
  lang,
  digits,
  onClose,
}: {
  house: BhavaHouse;
  houses: BhavaHouse[];
  reference: BhavaReferencePayload;
  lang: "ne" | "en";
  digits: (v: string | number) => string;
  onClose: () => void;
}) {
  const info = reference.houseInfo[house.house];
  const lordKey = reference.rashiLord[house.rashi];
  const lordHouse = houses.find((h) => h.planets.some((p) => p.key === lordKey))?.house;

  const occupants = house.planets;
  const aspectedBy = computeAspectedBy(houses, house.house);

  const beneficPresent = [...occupants.map((p) => p.key), ...aspectedBy].some(
    (k) => reference.grahaDrishti[k]?.isMalefic === false,
  );
  const maleficPresent = [...occupants.map((p) => p.key), ...aspectedBy].some(
    (k) => reference.grahaDrishti[k]?.isMalefic === true,
  );

  const badge = houseBadge(house.house);
  const ordinal = bilingualText(lang, HOUSE_ORDINAL_NE[house.house - 1], HOUSE_ORDINAL_EN[house.house - 1]);
  const lalKitabFixedLord = reference.lalKitabFixedLord[house.house] ?? [];
  const bhaveshEntry = lordHouse != null ? reference.bhaveshPhala[house.house]?.[lordHouse] : undefined;

  const occupantKeys = occupants.map((p) => p.key);
  const yuti2Entry = occupantKeys.length === 2 ? reference.grahaYuti2[yutiKey(occupantKeys)] : undefined;
  const yuti3Entries =
    occupantKeys.length >= 3
      ? subsetsOf3(occupantKeys)
          .map((triple) => reference.grahaYuti3[yutiKey(triple)])
          .filter((e): e is NonNullable<typeof e> => Boolean(e))
      : [];
  const showYutiSection = occupantKeys.length >= 2;

  const applicableSutras = reference.naadiSutras
    .filter((s) => s.grahas.some((g) => occupantKeys.includes(g)))
    .sort((a, b) => a.number - b.number);
  const lalKitabEntries = occupants
    .map((p) => ({ key: p.key, entry: reference.lalKitabHouse[p.key]?.[house.house] }))
    .filter((e): e is { key: string; entry: NonNullable<typeof e.entry> } => Boolean(e.entry));
  const lalKitabYutiMatch =
    occupantKeys.length >= 2 && occupantKeys.length <= 3
      ? reference.lalKitabYuti.find((y) => yutiKey(y.grahas) === yutiKey(occupantKeys))
      : undefined;

  const themes = splitList(bilingualText(lang, info.themeNe, info.themeEn));
  const lordTitle = bilingualText(
    lang,
    HOUSE_LORD_TITLE_NE[house.house - 1],
    `Lord of house ${digits(house.house)}`,
  );
  const classicalName = reference.houseClassicalName[house.house];

  return (
    <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-0 overflow-hidden p-0">
      <DialogHeader className="gap-1 border-b border-border px-4 py-3.5">
        <DialogTitle className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-sm font-bold text-secondary">
            {digits(house.house)}
          </span>
          {ordinal} {bilingualText(lang, "भाव", "house")}
          {classicalName && (
            <span className="font-normal text-muted-foreground">
              · {bilingualText(lang, classicalName.ne, classicalName.en)}
            </span>
          )}
        </DialogTitle>
        <p className="text-sm text-muted-foreground">{themes.join(" · ")}</p>
        <div className="flex flex-wrap items-center gap-2 pt-1 text-sm">
          <span>
            <span className="font-semibold text-foreground">
              {digits(house.rashi)} {formatRashiByNumber(house.rashi, lang)}
            </span>{" "}
            {bilingualText(lang, "राशि", "sign")}
          </span>
          <span className="text-border">·</span>
          <span>
            {bilingualText(lang, "स्वामी", "Lord")}{" "}
            <span className="font-semibold text-secondary">{grahaName(lordKey, lang)}</span>
          </span>
          {badge && (
            <>
              <span className="text-border">·</span>
              <span className="text-muted-foreground">{formatHouseBadge(badge, lang)}</span>
            </>
          )}
        </div>
        <Accordion type="single" collapsible className="-mb-1">
          <AccordionItem value="house-summary" className="border-b-0">
            <AccordionTrigger className="py-1.5 text-sm text-secondary hover:no-underline">
              {bilingualText(lang, "भाव विवरण हेर्नुहोस्", "View house description")}
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm leading-relaxed">{bilingualText(lang, info.summaryNe, info.summaryEn)}</p>
              <p className="mt-2 text-sm leading-relaxed">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {bilingualText(lang, "शुभ ग्रह:", "Benefics:")}
                </span>{" "}
                {bilingualText(lang, info.beneficEffectNe, info.beneficEffectEn)}
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                <span className="font-semibold text-destructive">
                  {bilingualText(lang, "पापग्रह:", "Malefics:")}
                </span>{" "}
                {bilingualText(lang, info.maleficEffectNe, info.maleficEffectEn)}
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DialogHeader>

      <div className="flex-1 divide-y divide-border/60 overflow-y-auto px-4 py-1">
        {/* यस भावमा — occupying grahas, condensed */}
        <Section title={bilingualText(lang, "🪐 यस भावमा", "🪐 Occupants")}>
          {occupants.length > 0 ? (
            <div className="space-y-2">
              {occupants.map((p) => {
                const k = reference.grahaKarakatva[p.key];
                const subjects = k
                  ? splitList(bilingualText(lang, k.subjectsNe, k.subjectsEn)).slice(0, 4).join(" · ")
                  : "";
                return (
                  <div key={p.key}>
                    <p className="text-sm font-semibold text-foreground">{grahaName(p.key, lang)}</p>
                    {subjects && <p className="text-sm text-muted-foreground">{subjects}</p>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm leading-relaxed">
              <p>
                <span className="font-semibold text-foreground">
                  {bilingualText(lang, "रिक्त भाव:", "Empty house:")}
                </span>{" "}
                {bilingualText(
                  lang,
                  "यस भावमा कुनै ग्रह नभएमा भावस्वामी ग्रहको स्थिति र दृष्टिबाट फल निर्धारण हुन्छ।",
                  "When no graha occupies this house, its result is read from the position and aspects of the house's ruling graha instead.",
                )}
              </p>
              <p className="mt-1.5">
                {bilingualText(
                  lang,
                  `राशि स्वामी ${grahaName(lordKey, lang)}को स्थिति हेर्नुहोस्।`,
                  `See the placement of ${grahaName(lordKey, lang)}, this house's ruling graha.`,
                )}
              </p>
            </div>
          )}
        </Section>

        {/* मुख्य संकेत — which occupying grahas influence each house theme */}
        <Section title={bilingualText(lang, "🔎 मुख्य संकेत", "🔎 Key signals")}>
          <div className="space-y-1.5">
            {themes.map((theme) => (
              <div key={theme} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-foreground">{theme}</span>
                {occupants.length > 0 ? (
                  <span className="text-muted-foreground">
                    ●{" "}
                    <span className="font-medium text-foreground">{joinNames(occupantKeys, lang)}</span>{" "}
                    {bilingualText(lang, "कारक", "karaka")}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* ग्रह फलादेश — one worked saravali example per occupying graha, expandable for full karakatva */}
        <Section title={bilingualText(lang, "🪐 ग्रह फलादेश", "🪐 Graha in this house")}>
          {occupants.length > 0 ? (
            <Accordion type="multiple" className="divide-y divide-border/50">
              {occupants.map((p) => {
                const saravali = reference.grahaHouseSaravali[p.key]?.[house.house];
                return (
                  <AccordionItem key={p.key} value={p.key} className="border-b-0 py-2 first:pt-0 last:pb-0">
                    <p className="text-sm font-semibold text-foreground">
                      🪐 {grahaName(p.key, lang)}{" "}
                      {bilingualText(lang, `${digits(house.house)}औँ भावमा`, `in house ${digits(house.house)}`)}
                    </p>
                    {saravali && (
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {bilingualText(lang, saravali.meaningNe, saravali.meaningEn)}
                      </p>
                    )}
                    <AccordionTrigger className="py-1.5 text-sm text-secondary hover:no-underline">
                      {bilingualText(lang, "श्लोक तथा स्रोत हेर्नुहोस्", "View shloka & source")}
                    </AccordionTrigger>
                    <AccordionContent>
                      <GrahaKarakatvaCard grahaKey={p.key} house={house.house} reference={reference} lang={lang} digits={digits} />
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <p className="text-sm text-muted-foreground">
              {bilingualText(
                lang,
                "यस भावमा कुनै ग्रह नभएकाले ग्रह फलादेश छैन।",
                "No graha occupies this house, so there's no graha-in-house reading.",
              )}
            </p>
          )}
          {occupants.length > 0 && (
            <Accordion type="single" collapsible className="mt-2">
              <AccordionItem value="dustha-sustha" className="border-b-0">
                <AccordionTrigger className="py-1.5 text-sm text-secondary hover:no-underline">
                  {bilingualText(lang, "यी फल कहिले लागू हुन्छन्?", "When do these results apply?")}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="whitespace-pre-line text-sm italic leading-relaxed text-foreground/90">
                    {reference.grahaDusthaSusthaRule.shloka}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {bilingualText(
                      lang,
                      reference.grahaDusthaSusthaRule.shlokaSourceNe,
                      reference.grahaDusthaSusthaRule.shlokaSourceEn,
                    )}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed">
                    {bilingualText(lang, reference.grahaDusthaSusthaRule.ne, reference.grahaDusthaSusthaRule.en)}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </Section>

        {/* ग्रह युति फल — shown only when 2+ grahas share this house */}
        {showYutiSection && (
          <Section title={bilingualText(lang, "👥 ग्रह युति फल", "👥 Graha conjunction (yuti) result")}>
            <div className="space-y-3">
              {yuti2Entry && (
                <div className="border-l-2 border-secondary/40 pl-3">
                  <p className="text-sm font-semibold text-foreground">
                    {joinNames(occupantKeys, lang)}
                    {yuti2Entry.yogaNameNe && (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        ({bilingualText(lang, yuti2Entry.yogaNameNe, yuti2Entry.yogaNameEn ?? yuti2Entry.yogaNameNe)})
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">{bilingualText(lang, yuti2Entry.textNe, yuti2Entry.textEn)}</p>
                </div>
              )}
              {yuti3Entries.map((entry) => (
                <div key={yutiKey(entry.grahas)} className="border-l-2 border-secondary/40 pl-3">
                  <p className="text-sm font-semibold text-foreground">{joinNames(entry.grahas, lang)}</p>
                  <p className="mt-1 text-sm leading-relaxed">{bilingualText(lang, entry.textNe, entry.textEn)}</p>
                </div>
              ))}
              {occupantKeys.length >= 3 && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {bilingualText(lang, reference.grahaYutiGeneralRule.ne, reference.grahaYutiGeneralRule.en)}
                </p>
              )}
              {!yuti2Entry && yuti3Entries.length === 0 && occupantKeys.length < 3 && (
                <p className="text-sm text-muted-foreground">
                  {bilingualText(
                    lang,
                    "यो विशेष ग्रह-युतिको लागि सन्दर्भ अहिले उपलब्ध छैन।",
                    "No reference is available for this specific graha combination yet.",
                  )}
                </p>
              )}
            </div>
          </Section>
        )}

        {/* भावेश सम्बन्ध */}
        <Section title={bilingualText(lang, "👑 भावेश सम्बन्ध", "👑 Lord placement")}>
          {lordHouse ? (
            <p className="text-sm">
              <span className="font-semibold text-foreground">{lordTitle}</span>{" "}
              <span className="font-semibold text-secondary">{grahaName(lordKey, lang)}</span> →{" "}
              {bilingualText(lang, `${digits(lordHouse)}औँ भाव`, `house ${digits(lordHouse)}`)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {bilingualText(
                lang,
                `राशि स्वामी ${grahaName(lordKey, lang)} यो D1 चार्टमा फेला परेन।`,
                `Sign lord ${grahaName(lordKey, lang)} wasn't found placed in this D1 chart.`,
              )}
            </p>
          )}
          {lordHouse && (
            <Accordion type="single" collapsible className="mt-1">
              <AccordionItem value="bhavesh" className="border-b-0">
                <AccordionTrigger className="py-1.5 text-sm text-secondary hover:no-underline">
                  {bilingualText(lang, "भावेश फल हेर्नुहोस्", "View lord-placement result")}
                </AccordionTrigger>
                <AccordionContent>
                  {bhaveshEntry ? (
                    <>
                      {bhaveshEntry.shloka && (
                        <p className="whitespace-pre-line text-sm italic leading-relaxed text-foreground/90">
                          {bhaveshEntry.shloka}
                        </p>
                      )}
                      <p className="mt-1.5 text-sm leading-relaxed">{bilingualText(lang, bhaveshEntry.ne, bhaveshEntry.en)}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {bilingualText(
                        lang,
                        "यो विशेष स्थान-सम्बन्धको लागि श्लोक-व्याख्या अहिले उपलब्ध छैन — यो स्थान-सम्बन्ध मात्र देखाइएको हो।",
                        "No shloka commentary is available for this specific placement yet — only the placement fact is shown.",
                      )}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">
                    {bilingualText(lang, `स्रोत: ${reference.bhaveshPhalaSource}`, `Source: ${reference.bhaveshPhalaSource}`)}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </Section>

        {/* दृष्टि — outgoing aspects from occupants, expandable for the full incoming picture */}
        <Section title={bilingualText(lang, "👁️ दृष्टि", "👁️ Aspects")}>
          {occupants.length > 0 ? (
            <div className="space-y-1.5">
              {occupants.map((p) => {
                const targets = drishtiTargetHouses(p.key, house.house);
                return (
                  <p key={p.key} className="text-sm">
                    <span className="font-semibold text-foreground">{grahaName(p.key, lang)}</span>
                    {" → "}
                    {targets.map((t) => bilingualText(lang, `${digits(t)}औँ`, digits(t))).join(" · ")}{" "}
                    {bilingualText(lang, "भाव", "house")}
                  </p>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {bilingualText(
                lang,
                "यस भावमा कुनै ग्रह नभएकाले यहाँबाट बाहिर दृष्टि पर्दैन।",
                "No graha occupies this house, so it casts no aspect outward.",
              )}
            </p>
          )}
          <Accordion type="single" collapsible className="mt-1">
            <AccordionItem value="drishti-full" className="border-b-0">
              <AccordionTrigger className="py-1.5 text-sm text-secondary hover:no-underline">
                {bilingualText(lang, "सबै दृष्टि हेर्नुहोस्", "View all aspects")}
              </AccordionTrigger>
              <AccordionContent>
                {aspectedBy.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      {bilingualText(lang, "यस भावमा दृष्टि गर्ने ग्रहहरू:", "Grahas aspecting this house:")}
                    </p>
                    {aspectedBy.map((k) => {
                      const d = reference.grahaDrishti[k];
                      return (
                        <div key={k}>
                          <p className="text-sm font-semibold text-foreground">{grahaName(k, lang)}</p>
                          {d && (
                            <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                              {bilingualText(lang, d.summaryNe, d.summaryEn)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {bilingualText(lang, "यस भावमा कुनै ग्रहको दृष्टि पर्दैन।", "No graha aspects this house.")}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Section>

        {/* सम्बन्धित नियम — Brighu Naadi sutras + Lal Kitab signals, collapsed by default */}
        <Section title={bilingualText(lang, "📚 सम्बन्धित नियम", "📚 Related rules")}>
          <Accordion type="multiple">
            <AccordionItem value="naadi">
              <AccordionTrigger className="text-sm hover:no-underline">
                <span className="flex-1">{bilingualText(lang, "भृगु नाडी सूत्र", "Brighu Naadi sutras")}</span>
                <span className="text-muted-foreground">{digits(applicableSutras.length)}</span>
              </AccordionTrigger>
              <AccordionContent>
                {applicableSutras.length > 0 ? (
                  <div className="space-y-3">
                    {applicableSutras.map((s) => (
                      <div key={s.number} className="border-l-2 border-secondary/40 pl-3">
                        <p className="text-sm font-semibold text-foreground">
                          {bilingualText(lang, `सूत्र ${digits(s.number)} — ${s.titleNe}`, `Sutra ${digits(s.number)} — ${s.titleEn}`)}
                        </p>
                        <p className="text-sm text-muted-foreground">{bilingualText(lang, s.categoryNe, s.categoryEn)}</p>
                        <p className="mt-1 text-sm leading-relaxed">{bilingualText(lang, s.bodyNe, s.bodyEn)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {bilingualText(
                      lang,
                      "यस भावमा कुनै ग्रह नभएकाले लागू हुने भृगु नाडी सूत्र देखिएका छैनन्।",
                      "No Brighu Naadi sutras apply, since no graha occupies this house.",
                    )}
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  {bilingualText(lang, `स्रोत: ${reference.naadiSutraSource}`, `Source: ${reference.naadiSutraSource}`)}
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="lalkitab">
              <AccordionTrigger className="text-sm hover:no-underline">
                <span className="flex-1">{bilingualText(lang, "लाल किताब", "Lal Kitab")}</span>
                <span className="text-muted-foreground">{digits(lalKitabEntries.length)}</span>
              </AccordionTrigger>
              <AccordionContent>
                {lalKitabEntries.length > 0 ? (
                  <div className="space-y-3">
                    {lalKitabEntries.map(({ key, entry }) => {
                      const tip = reference.lalKitabSafetyTips[key];
                      return (
                        <div key={key}>
                          <p className="text-sm font-semibold text-foreground">
                            🪐 {grahaName(key, lang)} — {bilingualText(lang, `भाव ${digits(house.house)}`, `house ${digits(house.house)}`)}
                          </p>
                          <p className="mt-0.5 text-sm leading-relaxed">{bilingualText(lang, entry.ne, entry.en)}</p>
                          {tip && (
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                              {bilingualText(lang, "सुरक्षित व्यवहार:", "Safe practice:")} {bilingualText(lang, tip.ne, tip.en)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {bilingualText(
                      lang,
                      `यस भावमा कुनै ग्रह नभएकाले प्रत्यक्ष लाल किताब सङ्केत छैन। यस भावको पक्का घर स्वामी ${joinNames(lalKitabFixedLord, lang)}को स्थिति हेर्नुहोस्।`,
                      `This house has no occupying graha, so there's no direct Lal Kitab signal. See the placement of ${joinNames(lalKitabFixedLord, lang)}, this house's fixed (pakka ghar) lord.`,
                    )}
                  </p>
                )}
                {lalKitabYutiMatch && (
                  <div className="mt-3 border-l-2 border-secondary/40 pl-3">
                    <p className="text-sm font-semibold text-foreground">
                      {bilingualText(lang, "👥 ग्रह युति —", "👥 Graha yuti —")} {joinNames(lalKitabYutiMatch.grahas, lang)}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">
                      {bilingualText(lang, lalKitabYutiMatch.textNe, lalKitabYutiMatch.textEn)}
                    </p>
                  </div>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  {bilingualText(lang, "स्रोत: लाल किताब — भाग २–११", "Source: Lal Kitab, parts 2–11")}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Section>

        {/* स्वास्थ्य संकेत */}
        <Section title={bilingualText(lang, "🩺 स्वास्थ्य संकेत", "🩺 Health signals")}>
          <Accordion type="single" collapsible>
            <AccordionItem value="health" className="border-b-0">
              <AccordionTrigger className="py-1.5 text-sm text-secondary hover:no-underline">
                {bilingualText(lang, "परम्परागत संकेत हेर्नुहोस्", "View traditional health signals")}
              </AccordionTrigger>
              <AccordionContent>
                <p className="mb-2 text-sm">
                  <span className="font-semibold text-foreground">
                    {bilingualText(lang, "यस भावका शरीरका अंग:", "Body parts of this house:")}
                  </span>{" "}
                  {bilingualText(lang, info.medicalNe, info.medicalEn)}
                </p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm font-semibold",
                    maleficPresent
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                  )}
                >
                  {maleficPresent
                    ? bilingualText(lang, "⚠️ ध्यान दिनुपर्ने", "⚠️ Needs attention")
                    : bilingualText(lang, "✅ सामान्यतया ठीक", "✅ Generally fine")}
                </span>
                {!maleficPresent && !beneficPresent && (
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {bilingualText(
                      lang,
                      "यस भावमा कुनै ग्रहको दृष्टि वा उपस्थिति छैन।",
                      "No graha occupies or aspects this house.",
                    )}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Section>
      </div>

      <div className="flex justify-end border-t border-border px-4 py-3">
        <Button variant="outline" onClick={onClose}>
          {bilingualText(lang, "बन्द गर्नुहोस्", "Close")}
        </Button>
      </div>
    </DialogContent>
  );
}
