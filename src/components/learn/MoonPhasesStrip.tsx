import { MoonPhaseDisc } from "@/components/tithi-mechanics/MoonPhaseDisc";
import {
  ssPhaseEn,
  ssPhaseItem,
  ssPhaseMoon,
  ssPhaseNe,
  ssPhasesList,
} from "@/lib/learn-classes";
import { useLocale } from "@/i18n/locale";

const PHASES = [
  { ne: "औंसी", en: "Amavasya", E: 0 },
  { ne: "शुक्ल पक्षको चन्द्र", en: "Shukla paksha", E: 45 },
  { ne: "प्रथम चौथी", en: "First quarter", E: 90 },
  { ne: "पूर्णिमा", en: "Purnima", E: 180 },
  { ne: "कृष्ण पक्षको चन्द्र", en: "Krishna paksha", E: 225 },
  { ne: "अन्तिम चौथी", en: "Last quarter", E: 270 },
  { ne: "पुनः औंसी", en: "Punah amavasya", E: 354 },
] as const;

const R = 26;

export function MoonPhasesStrip() {
  const { lang, pick } = useLocale();
  return (
    <div>
      <ol className={ssPhasesList}>
        {PHASES.map((p, i) => (
          <li key={`${p.ne}-${i}`} className={ssPhaseItem}>
            <svg viewBox={`0 0 ${R * 2 + 8} ${R * 2 + 8}`} className={ssPhaseMoon} aria-hidden>
              <g transform={`translate(${R + 4},${R + 4})`}>
                <MoonPhaseDisc elongation={p.E} r={R} uid={`ss-mp-${i}`} />
              </g>
            </svg>
            <span className={ssPhaseNe}>{pick(p.ne, p.en)}</span>
            {lang === "ne" && <span className={ssPhaseEn}>{p.en}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
