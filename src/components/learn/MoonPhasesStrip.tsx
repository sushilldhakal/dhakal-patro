import { MoonPhaseDisc } from "@/components/tithi-mechanics/MoonPhaseDisc";

const PHASES = [
  { ne: "अमावस्या", en: "Amavasya", E: 0 },
  { ne: "शुक्ल पक्षको चन्द्र", en: "Shukla paksha", E: 45 },
  { ne: "प्रथम चौथी", en: "First quarter", E: 90 },
  { ne: "पूर्णिमा", en: "Purnima", E: 180 },
  { ne: "कृष्ण पक्षको चन्द्र", en: "Krishna paksha", E: 225 },
  { ne: "अन्तिम चौथी", en: "Last quarter", E: 270 },
  { ne: "पुनः अमावस्या", en: "Punah amavasya", E: 354 },
] as const;

const R = 26;

export function MoonPhasesStrip() {
  return (
    <div className="ss-phases">
      <ol className="ss-phases-list">
        {PHASES.map((p, i) => (
          <li key={`${p.ne}-${i}`} className="ss-phase-item">
            <svg viewBox={`0 0 ${R * 2 + 8} ${R * 2 + 8}`} className="ss-phase-moon" aria-hidden>
              <g transform={`translate(${R + 4},${R + 4})`}>
                <MoonPhaseDisc elongation={p.E} r={R} uid={`ss-mp-${i}`} />
              </g>
            </svg>
            <span className="ss-phase-ne">{p.ne}</span>
            <span className="ss-phase-en">{p.en}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
