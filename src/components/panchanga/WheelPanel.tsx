import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import { NAKSHATRA_GLYPHS, RASHI_GLYPHS, WheelGlyph } from "@/lib/wheel-glyphs";
import {
  bsMonthsForWheel,
  PADA_AKSHAR,
  RASHI_ELEM,
  RASHI_LORDS,
  getWheelRashis,
} from "@/lib/wheel-data";
import type { WheelPick } from "./WheelChart";
import { useLocale, bilingualText } from "@/i18n/locale";
import { NAK_LORD_EN as LORD_EN, TATTVA_EN } from "@/lib/wheel-locale";
import { BS_MONTHS_NE, BS_MONTH_NAMES } from "@/lib/bs-calendar";
import {
  wheelDl,
  wheelDlK,
  wheelDlRow,
  wheelDlV,
  wheelDlVMono,
  wheelPanel,
  wheelPanelClose,
  wheelPanelCons,
  wheelPanelConsTxt,
  wheelPanelHead,
  wheelPanelIco,
  wheelPanelKind,
  wheelPanelBody,
  wheelPanelSub,
  wheelPanelTitle,
} from "@/lib/wheel-classes";

function bsMonthEnOf(ne: string): string {
  const i = BS_MONTHS_NE.indexOf(ne);
  return i >= 0 ? BS_MONTH_NAMES[i] : ne;
}

interface WheelPanelProps {
  sel: WheelPick | null;
  open: boolean;
  num: (n: number | string) => string | number;
  onClose: () => void;
}

export function WheelPanel({ sel, open, num, onClose }: WheelPanelProps) {
  const { lang, isEnglish } = useLocale();
  const WHEEL_RASHIS = getWheelRashis();
  let body: React.ReactNode = null;

  if (sel?.type === "nak") {
    const ico = NAKSHATRA_ICONS[sel.i]!;
    const L0 = sel.i * (360 / 27);
    const L1 = L0 + 360 / 27;
    const ri0 = Math.floor(L0 / 30);
    const ri1 = Math.floor((L1 - 0.01) / 30);
    const rashiSpan =
      ri0 === ri1
        ? bilingualText(lang, WHEEL_RASHIS[ri0]!.ne, WHEEL_RASHIS[ri0]!.en)
        : `${bilingualText(lang, WHEEL_RASHIS[ri0]!.ne, WHEEL_RASHIS[ri0]!.en)}–${bilingualText(lang, WHEEL_RASHIS[ri1]!.ne, WHEEL_RASHIS[ri1]!.en)}`;

    body = (
      <>
        <div className={wheelPanelHead}>
          {/* Same artwork the wheel's nakshatra ring draws. This used to inject
              `ico.svg` from nakshatra-icons-data.json — a different, stroke-based
              icon set — so the sheet showed a glyph that didn't match the ring. */}
          <div className={wheelPanelIco}>
            <svg viewBox="0 0 56 56">
              <WheelGlyph
                art={NAKSHATRA_GLYPHS[sel.i]}
                size={50}
                cx={28}
                cy={28}
                className="fill-current"
                title={bilingualText(lang, ico.ne, ico.en)}
              />
            </svg>
          </div>
          <div>
            <div className={wheelPanelKind}>{bilingualText(lang, "नक्षत्र", "Nakshatra")} · {num(sel.i + 1)}</div>
            <h2 className={wheelPanelTitle}>{bilingualText(lang, ico.ne, ico.en)}</h2>
            {isEnglish ? <div className={wheelPanelSub}>{ico.en}</div> : null}
          </div>
          <button type="button" className={wheelPanelClose} onClick={onClose} aria-label={bilingualText(lang, "बन्द", "Close")}>
            ✕
          </button>
        </div>
        <div className={wheelPanelBody}>
          <div className={wheelDl}>
            <div className={wheelDlRow}>
              <span className={wheelDlK}>{bilingualText(lang, "स्वामी ग्रह", "Lord planet")}</span>
              <span className={wheelDlV}>
                {bilingualText(lang, ico.lord_ne, LORD_EN[ico.lord_ne] ?? ico.lord_ne)}
              </span>
            </div>
            <div className={wheelDlRow}>
              <span className={wheelDlK}>{bilingualText(lang, "चिन्ह", "Symbol")}</span>
              <span className={wheelDlV}>{ico.sym_ne}</span>
            </div>
            <div className={wheelDlRow}>
              <span className={wheelDlK}>{bilingualText(lang, "राशि", "Rashi")}</span>
              <span className={wheelDlV}>{rashiSpan}</span>
            </div>
            <div className={wheelDlRow}>
              <span className={wheelDlK}>{bilingualText(lang, "देशान्तर", "Longitude")}</span>
              <span className={wheelDlVMono}>
                {num(L0.toFixed(1))}°–{num(L1.toFixed(1))}°
              </span>
            </div>
            <div className={wheelDlRow}>
              <span className={wheelDlK}>{bilingualText(lang, "पद अक्षर", "Pada syllables")}</span>
              <span className={wheelDlV}>{PADA_AKSHAR[sel.i]!.join(" · ")}</span>
            </div>
          </div>
        </div>
      </>
    );
  } else if (sel?.type === "rashi") {
    const rs = WHEEL_RASHIS[sel.i]!;
    const nakIn: string[] = [];
    for (let i = 0; i < 27; i++) {
      const L0 = i * (360 / 27);
      const L1 = (i + 1) * (360 / 27);
      if (L0 < (sel.i + 1) * 30 && L1 > sel.i * 30) {
        nakIn.push(bilingualText(lang, NAKSHATRA_ICONS[i]!.ne, NAKSHATRA_ICONS[i]!.en));
      }
    }
    const bsMonths = bsMonthsForWheel();

    body = (
      <>
        <div className={wheelPanelHead}>
          {/* The rashi sheet had no glyph at all; now that the ring carries the
              artwork, the sheet shows the same sign. */}
          <div className={wheelPanelIco}>
            <svg viewBox="0 0 56 56">
              <WheelGlyph
                art={RASHI_GLYPHS[sel.i]}
                size={50}
                cx={28}
                cy={28}
                className="fill-current"
                title={bilingualText(lang, rs.ne, rs.en)}
              />
            </svg>
          </div>
          <div>
            <div className={wheelPanelKind}>{bilingualText(lang, "राशि", "Rashi")} · {num(sel.i + 1)}</div>
            <h2 className={wheelPanelTitle}>{bilingualText(lang, rs.ne, rs.en)}</h2>
            {isEnglish ? <div className={wheelPanelSub}>{rs.en}</div> : null}
          </div>
          <button type="button" className={wheelPanelClose} onClick={onClose} aria-label={bilingualText(lang, "बन्द", "Close")}>
            ✕
          </button>
        </div>
        <div className={wheelPanelBody}>
          <div className={wheelDl}>
            <div className={wheelDlRow}>
              <span className={wheelDlK}>{bilingualText(lang, "स्वामी ग्रह", "Lord planet")}</span>
              <span className={wheelDlV}>{bilingualText(lang, RASHI_LORDS[sel.i], LORD_EN[RASHI_LORDS[sel.i]] ?? RASHI_LORDS[sel.i])}</span>
            </div>
            <div className={wheelDlRow}>
              <span className={wheelDlK}>{bilingualText(lang, "तत्त्व", "Element")}</span>
              <span className={wheelDlV}>{bilingualText(lang, RASHI_ELEM[sel.i], TATTVA_EN[RASHI_ELEM[sel.i]] ?? RASHI_ELEM[sel.i])}</span>
            </div>
            <div className={wheelDlRow}>
              <span className={wheelDlK}>{bilingualText(lang, "देशान्तर", "Longitude")}</span>
              <span className={wheelDlVMono}>
                {num(sel.i * 30)}°–{num((sel.i + 1) * 30)}°
              </span>
            </div>
            <div className={wheelDlRow}>
              <span className={wheelDlK}>{bilingualText(lang, "नेपाली महिना", "Nepali month")}</span>
              <span className={wheelDlV}>{bilingualText(lang, bsMonths[sel.i]?.ne ?? "", bsMonthEnOf(bsMonths[sel.i]?.ne ?? ""))}</span>
            </div>
            <div className={wheelDlRow}>
              <span className={wheelDlK}>{bilingualText(lang, "पद", "Padas")}</span>
              <span className={wheelDlVMono}>{bilingualText(lang, `${num(9)} पद`, `${num(9)} padas`)}</span>
            </div>
          </div>
          <div className={wheelPanelCons}>
            <div className={wheelPanelConsTxt}>
              <b>{bilingualText(lang, "नक्षत्रहरू", "Nakshatras")}</b>
              {nakIn.join(" · ")}
            </div>
          </div>
        </div>
      </>
    );
  }

  return <div className={wheelPanel(open)}>{body}</div>;
}
