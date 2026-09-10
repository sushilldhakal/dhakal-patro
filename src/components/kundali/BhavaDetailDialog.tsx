import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocale, bilingualText } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import type { BhavaHouse } from "@/lib/bhava";
import { houseBadge, formatHouseBadge } from "@/lib/bhava";
import { GRAHA_NAME, type GrahaKey } from "@/lib/graha-details";
import { GRAHA_DRISHTI } from "@/lib/kundali/graha-drishti";
import { janmaPhalaFor } from "@/lib/kundali/janma-phala-tables";
import { bhaveshPhalaFor } from "@/lib/kundali/bhavesh-phala";
import {
  RASHI_LORD,
  HOUSE_INFO,
  HOUSE_ORDINAL_NE,
  HOUSE_ORDINAL_EN,
  computeAspectedBy,
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

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card/40 p-3.5", className)}>
      <h3 className="mb-2 text-sm font-bold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function NotAvailable({ lang }: { lang: "ne" | "en" }) {
  return (
    <p className="rounded-lg border border-dashed border-border bg-muted/30 p-2.5 text-sm text-muted-foreground">
      {bilingualText(
        lang,
        "यो खण्ड अहिले उपलब्ध छैन — छिट्टै थपिनेछ।",
        "This section isn't available yet — coming soon.",
      )}
    </p>
  );
}

type Props = {
  houses: BhavaHouse[];
  houseNumber: number | null;
  onClose: () => void;
};

export function BhavaDetailDialog({ houses, houseNumber, onClose }: Props) {
  const { lang, digits } = useLocale();
  const house = houseNumber != null ? houses.find((h) => h.house === houseNumber) : undefined;

  return (
    <Dialog open={Boolean(house)} onOpenChange={(next) => !next && onClose()}>
      {house && (
        <BhavaDetailBody house={house} houses={houses} lang={lang} digits={digits} onClose={onClose} />
      )}
    </Dialog>
  );
}

function BhavaDetailBody({
  house,
  houses,
  lang,
  digits,
  onClose,
}: {
  house: BhavaHouse;
  houses: BhavaHouse[];
  lang: "ne" | "en";
  digits: (v: string | number) => string;
  onClose: () => void;
}) {
  const info = HOUSE_INFO[house.house];
  const lordKey = RASHI_LORD[house.rashi];
  const lordHouse = houses.find((h) => h.planets.some((p) => p.key === lordKey))?.house;

  const occupants = house.planets;
  const aspectedBy = computeAspectedBy(houses, house.house);

  const beneficPresent = [...occupants.map((p) => p.key), ...aspectedBy].some(
    (k) => GRAHA_DRISHTI[k as GrahaKey]?.isMalefic === false,
  );
  const maleficPresent = [...occupants.map((p) => p.key), ...aspectedBy].some(
    (k) => GRAHA_DRISHTI[k as GrahaKey]?.isMalefic === true,
  );

  const badge = houseBadge(house.house);
  const ordinal = bilingualText(lang, HOUSE_ORDINAL_NE[house.house - 1], HOUSE_ORDINAL_EN[house.house - 1]);
  const title = bilingualText(
    lang,
    `भाव ${digits(house.house)} — ${ordinal} भाव`,
    `House ${digits(house.house)} — ${ordinal} house`,
  );

  return (
    <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-0 overflow-hidden p-0">
      <DialogHeader className="border-b border-border px-6 py-4">
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>

      <div className="flex-1 space-y-4 overflow-y-auto p-6">
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
                <span className="rounded-full border border-border bg-background px-2 py-0.5 text-sm">
                  {formatHouseBadge(badge, lang)}
                </span>
              </>
            )}
          </div>
          <p className="mb-2 text-sm">
            {bilingualText(lang, "यस भावमा:", "Occupants:")}{" "}
            <span className="font-semibold text-foreground">{joinNames(occupants.map((p) => p.key), lang)}</span>
          </p>
          <p className="text-sm leading-relaxed">{bilingualText(lang, info.summaryNe, info.summaryEn)}</p>
          <div className="mt-2.5 grid gap-1.5 text-sm sm:grid-cols-2">
            <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5">
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                {bilingualText(lang, "शुभ ग्रह:", "Benefics:")}
              </span>{" "}
              {bilingualText(lang, info.beneficEffectNe, info.beneficEffectEn)}
            </p>
            <p className="rounded-md border border-destructive/20 bg-destructive/10 px-2.5 py-1.5">
              <span className="font-semibold text-destructive">
                {bilingualText(lang, "पापग्रह:", "Malefics:")}
              </span>{" "}
              {bilingualText(lang, info.maleficEffectNe, info.maleficEffectEn)}
            </p>
          </div>
        </Section>

        {/* ग्रह फलादेश — real data: janma-phala classical phrase per occupying graha */}
        {occupants.length > 0 && (
          <Section title={bilingualText(lang, "🪐 ग्रह फलादेश", "🪐 Graha in this house")}>
            <div className="space-y-2">
              {occupants.map((p) => {
                const phala = janmaPhalaFor(p.key, house.house);
                return (
                  <div key={p.key} className="rounded-lg border border-border bg-background p-2.5">
                    <p className="text-sm font-semibold text-foreground">{grahaName(p.key, lang)}</p>
                    {phala ? (
                      <p className="mt-0.5 text-sm">
                        {bilingualText(lang, `जन्म फल: ${phala}`, `Classical phala: ${phala}`)}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {bilingualText(lang, "जन्म फल उपलब्ध छैन", "No classical phala available")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {bilingualText(
                lang,
                "स्रोत: पुरुष जन्म फल तालिका (परम्परागत ज्योतिष सन्दर्भ)। कारकत्व श्लोक र सारावली विवरण अहिले उपलब्ध छैन।",
                "Source: Purusha janma-phala table (classical reference). Karakatva shloka and saravali detail aren't available yet.",
              )}
            </p>
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
                `${digits(house.house)} भाव (${info.themeNe.split(",")[0]}) को स्वामी ${grahaName(lordKey, lang)} → ${digits(lordHouse)} भाव (${HOUSE_INFO[lordHouse]?.themeNe.split(",")[0]}) मा`,
                `Lord of house ${digits(house.house)} (${info.themeEn.split(",")[0]}), ${grahaName(lordKey, lang)}, sits in house ${digits(lordHouse)} (${HOUSE_INFO[lordHouse]?.themeEn.split(",")[0]})`,
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
          {lordHouse && bhaveshPhalaFor(house.house, lordHouse) ? (
            <p className="mt-2 rounded-lg border border-border bg-background p-2.5 text-sm leading-relaxed">
              {bilingualText(
                lang,
                bhaveshPhalaFor(house.house, lordHouse)!.ne,
                bhaveshPhalaFor(house.house, lordHouse)!.en,
              )}
            </p>
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

        {/* सम्पूर्ण लाल किताब भाव फलादेश */}
        <Section title={bilingualText(lang, "📕 सम्पूर्ण लाल किताब भाव फलादेश", "📕 Complete Lal Kitab house prediction")}>
          <NotAvailable lang={lang} />
        </Section>

        {/* सम्पूर्ण ज्योतिष सूत्र सङ्ग्रह */}
        <Section title={bilingualText(lang, "📜 सम्पूर्ण ज्योतिष सूत्र सङ्ग्रह", "📜 Complete jyotish sutra collection")}>
          <NotAvailable lang={lang} />
        </Section>

        {/* लागू भएका भृगु नन्दी नाडी सूत्र */}
        <Section title={bilingualText(lang, "📘 लागू भएका भृगु नन्दी नाडी सूत्र", "📘 Applicable Bhrigu Nandi Nadi sutras")}>
          <NotAvailable lang={lang} />
        </Section>
      </div>

      <div className="flex justify-end border-t border-border px-6 py-3.5">
        <Button variant="outline" onClick={onClose}>
          {bilingualText(lang, "बन्द गर्नुहोस्", "Close")}
        </Button>
      </div>
    </DialogContent>
  );
}
