import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import {
  bsMonthsForWheel,
  PADA_AKSHAR,
  RASHI_ELEM,
  RASHI_LORDS,
  WHEEL_RASHIS,
} from "@/lib/wheel-data";
import type { WheelPick } from "./WheelChart";
import { useLocale } from "@/i18n/locale";
import { NAK_LORD_EN as LORD_EN, TATTVA_EN } from "@/lib/wheel-locale";
import { BS_MONTHS_NE, BS_MONTH_NAMES } from "@/lib/bs-calendar";

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
  const { pick } = useLocale();
  let body: React.ReactNode = null;

  if (sel?.type === "nak") {
    const ico = NAKSHATRA_ICONS[sel.i]!;
    const L0 = sel.i * (360 / 27);
    const L1 = L0 + 360 / 27;
    const ri0 = Math.floor(L0 / 30);
    const ri1 = Math.floor((L1 - 0.01) / 30);
    const rashiSpan =
      ri0 === ri1
        ? pick(WHEEL_RASHIS[ri0]!.ne, WHEEL_RASHIS[ri0]!.en)
        : `${pick(WHEEL_RASHIS[ri0]!.ne, WHEEL_RASHIS[ri0]!.en)}–${pick(WHEEL_RASHIS[ri1]!.ne, WHEEL_RASHIS[ri1]!.en)}`;

    body = (
      <>
        <div className="w-panel-head">
          <div className="w-panel-ico">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              dangerouslySetInnerHTML={{ __html: ico.svg }}
            />
          </div>
          <div>
            <div className="w-panel-kind">{pick("नक्षत्र", "Nakshatra")} · {num(sel.i + 1)}</div>
            <h2 className="w-panel-title">{pick(ico.ne, ico.en)}</h2>
            <div className="w-panel-sub">{pick(ico.en, ico.ne)}</div>
          </div>
          <button type="button" className="w-panel-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="w-panel-body">
          <div className="w-dl">
            <div className="w-dl-row">
              <span className="w-dl-k">{pick("स्वामी ग्रह", "Lord planet")}</span>
              <span className="w-dl-v">
                {pick(`${ico.lord_ne} · ${LORD_EN[ico.lord_ne] ?? ico.lord_ne}`, LORD_EN[ico.lord_ne] ?? ico.lord_ne)}
              </span>
            </div>
            <div className="w-dl-row">
              <span className="w-dl-k">{pick("चिन्ह", "Symbol")}</span>
              <span className="w-dl-v">{ico.sym_ne}</span>
            </div>
            <div className="w-dl-row">
              <span className="w-dl-k">{pick("राशि", "Rashi")}</span>
              <span className="w-dl-v">{rashiSpan}</span>
            </div>
            <div className="w-dl-row">
              <span className="w-dl-k">{pick("देशान्तर", "Longitude")}</span>
              <span className="w-dl-v mono">
                {num(L0.toFixed(1))}°–{num(L1.toFixed(1))}°
              </span>
            </div>
            <div className="w-dl-row">
              <span className="w-dl-k">{pick("पद अक्षर", "Pada syllables")}</span>
              <span className="w-dl-v">{PADA_AKSHAR[sel.i]!.join(" · ")}</span>
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
        nakIn.push(pick(NAKSHATRA_ICONS[i]!.ne, NAKSHATRA_ICONS[i]!.en));
      }
    }
    const bsMonths = bsMonthsForWheel();

    body = (
      <>
        <div className="w-panel-head">
          <div
            className="w-panel-glyph"
            style={{ fontFamily: '"Noto Sans Symbols 2", "Segoe UI Symbol", serif' }}
          >
            {rs.sym + "\uFE0E"}
          </div>
          <div>
            <div className="w-panel-kind">{pick("राशि", "Rashi")} · {num(sel.i + 1)}</div>
            <h2 className="w-panel-title">{pick(rs.ne, rs.en)}</h2>
            <div className="w-panel-sub">{pick(rs.en, rs.ne)}</div>
          </div>
          <button type="button" className="w-panel-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="w-panel-body">
          <div className="w-dl">
            <div className="w-dl-row">
              <span className="w-dl-k">{pick("स्वामी ग्रह", "Lord planet")}</span>
              <span className="w-dl-v">{pick(RASHI_LORDS[sel.i], LORD_EN[RASHI_LORDS[sel.i]] ?? RASHI_LORDS[sel.i])}</span>
            </div>
            <div className="w-dl-row">
              <span className="w-dl-k">{pick("तत्त्व", "Element")}</span>
              <span className="w-dl-v">{pick(RASHI_ELEM[sel.i], TATTVA_EN[RASHI_ELEM[sel.i]] ?? RASHI_ELEM[sel.i])}</span>
            </div>
            <div className="w-dl-row">
              <span className="w-dl-k">{pick("देशान्तर", "Longitude")}</span>
              <span className="w-dl-v mono">
                {num(sel.i * 30)}°–{num((sel.i + 1) * 30)}°
              </span>
            </div>
            <div className="w-dl-row">
              <span className="w-dl-k">{pick("नेपाली महिना", "Nepali month")}</span>
              <span className="w-dl-v">{pick(bsMonths[sel.i]?.ne ?? "", bsMonthEnOf(bsMonths[sel.i]?.ne ?? ""))}</span>
            </div>
            <div className="w-dl-row">
              <span className="w-dl-k">{pick("पद", "Padas")}</span>
              <span className="w-dl-v mono">{pick(`${num(9)} पद`, `${num(9)} padas`)}</span>
            </div>
          </div>
          <div className="w-panel-cons">
            <div className="w-panel-cons-txt" style={{ width: "100%" }}>
              <b>{pick("नक्षत्रहरू", "Nakshatras")}</b>
              {nakIn.join(" · ")}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className={`w-panel${open ? " open" : ""}`} style={{ pointerEvents: open ? "auto" : "none" }}>
      {body}
    </div>
  );
}
