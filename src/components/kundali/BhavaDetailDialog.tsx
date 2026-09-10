import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocale, bilingualText } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import type { BhavaHouse } from "@/lib/bhava";
import { houseBadge, formatHouseBadge } from "@/lib/bhava";
import { GRAHA_NAME, type GrahaKey } from "@/lib/graha-details";
import type { BhavaReferencePayload } from "@/lib/api";
import { HOUSE_ORDINAL_NE, HOUSE_ORDINAL_EN, computeAspectedBy } from "@/lib/kundali/bhava-detail";
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
  const title = bilingualText(
    lang,
    `भाव ${digits(house.house)} — ${ordinal} भाव`,
    `House ${digits(house.house)} — ${ordinal} house`,
  );
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

  return (
    <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-0 overflow-hidden p-0">
      <DialogHeader className="border-b border-border px-4 py-3.5">
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>

      <div className="flex-1 divide-y divide-border/60 overflow-y-auto px-4 py-1">
        {/* भाव फलादेश */}
        <Section
          title={bilingualText(
            lang,
            `भाव ${digits(house.house)} — ${info.themeNe}`,
            `House ${digits(house.house)} — ${info.themeEn}`,
          )}
        >
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
            <span>
              {bilingualText(lang, "राशि:", "Sign:")}{" "}
              <span className="font-semibold text-foreground">
                {digits(house.rashi)} {formatRashiByNumber(house.rashi, lang)}
              </span>
            </span>
            <span className="text-border">|</span>
            <span>
              {bilingualText(lang, "राशि स्वामी:", "Sign lord:")}{" "}
              <span className="font-semibold text-secondary">{grahaName(lordKey, lang)}</span>
            </span>
            {badge && (
              <>
                <span className="text-border">|</span>
                <span className="text-muted-foreground">{formatHouseBadge(badge, lang)}</span>
              </>
            )}
          </div>
          <p className="mb-2 text-sm">
            {bilingualText(lang, "यस भावमा:", "Occupants:")}{" "}
            <span className="font-semibold text-foreground">{joinNames(occupants.map((p) => p.key), lang)}</span>
          </p>
          <p className="text-sm leading-relaxed">{bilingualText(lang, info.summaryNe, info.summaryEn)}</p>
          <p className="mt-2.5 text-sm leading-relaxed">
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
        </Section>

        {/* ग्रह फलादेश — karakatva + one worked saravali example per occupying graha */}
        <Section title={bilingualText(lang, "🪐 ग्रह फलादेश", "🪐 Graha in this house")}>
          {occupants.length > 0 ? (
            <div className="divide-y divide-border/50">
              {occupants.map((p) => (
                <div key={p.key} className="py-3 first:pt-0 last:pb-0">
                  <GrahaKarakatvaCard grahaKey={p.key} house={house.house} reference={reference} lang={lang} digits={digits} />
                </div>
              ))}
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

        {/* मेडिकल ज्योतिष */}
        <Section title={bilingualText(lang, "🩺 मेडिकल ज्योतिष", "🩺 Medical astrology")}>
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
        </Section>

        {/* भावेश फल */}
        <Section title={bilingualText(lang, "🏠 भावेश फल", "🏠 Lord placement (bhavesh)")}>
          {lordHouse ? (
            <p className="text-sm">
              {bilingualText(
                lang,
                `${digits(house.house)} भाव (${info.themeNe.split(",")[0]}) को स्वामी ${grahaName(lordKey, lang)} → ${digits(lordHouse)} भाव (${reference.houseInfo[lordHouse]?.themeNe.split(",")[0]}) मा`,
                `Lord of house ${digits(house.house)} (${info.themeEn.split(",")[0]}), ${grahaName(lordKey, lang)}, sits in house ${digits(lordHouse)} (${reference.houseInfo[lordHouse]?.themeEn.split(",")[0]})`,
              )}
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
          {bhaveshEntry ? (
            <p className="mt-2 text-sm leading-relaxed">{bilingualText(lang, bhaveshEntry.ne, bhaveshEntry.en)}</p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {bilingualText(
                lang,
                "यो विशेष स्थान-सम्बन्धको लागि श्लोक-व्याख्या अहिले उपलब्ध छैन — यो स्थान-सम्बन्ध मात्र देखाइएको हो।",
                "No shloka commentary is available for this specific placement yet — only the placement fact is shown.",
              )}
            </p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            {bilingualText(lang, "स्रोत: बृहत्पाराशर होराशास्त्र, अध्याय २७", "Source: Brihat Parashara Hora Shastra, ch. 27")}
          </p>
        </Section>

        {/* लाल किताब भाव संकेत */}
        <Section title={bilingualText(lang, "📕 लाल किताब भाव संकेत", "📕 Lal Kitab house signals")}>
          <p className="mb-2 text-sm font-semibold text-foreground">
            {bilingualText(
              lang,
              `ग्रहगत लाल किताब सङ्केत — भाव ${digits(house.house)}`,
              `Graha-wise Lal Kitab signals — house ${digits(house.house)}`,
            )}
          </p>
          {occupants.length > 0 ? (
            <div className="space-y-3">
              {occupants.map((p) => {
                const entry = reference.lalKitabHouse[p.key]?.[house.house];
                if (!entry) return null;
                return (
                  <div key={p.key}>
                    <p className="text-sm font-semibold text-foreground">
                      🪐 {grahaName(p.key, lang)} — {bilingualText(lang, `भाव ${digits(house.house)}`, `house ${digits(house.house)}`)}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed">{bilingualText(lang, entry.ne, entry.en)}</p>
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
          <p className="mt-2 text-sm text-muted-foreground">
            {bilingualText(lang, "स्रोत: लाल किताब — भाग २–१०", "Source: Lal Kitab, parts 2–10")}
          </p>
        </Section>

        {/* लागू भएका भृगु नाडी सूत्र */}
        <Section
          title={bilingualText(
            lang,
            `📘 लागू भएका भृगु नाडी सूत्र — ${digits(applicableSutras.length)}`,
            `📘 Applicable Brighu Naadi sutras — ${digits(applicableSutras.length)}`,
          )}
        >
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
