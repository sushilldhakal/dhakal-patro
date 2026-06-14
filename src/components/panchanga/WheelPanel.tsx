import { NAKSHATRA_ICONS } from "@/lib/nakshatra-icons";
import {
  bsMonthsForWheel,
  PADA_AKSHAR,
  RASHI_ELEM,
  RASHI_LORDS,
  WHEEL_RASHIS,
} from "@/lib/wheel-data";
import type { WheelPick } from "./WheelChart";

const LORD_EN: Record<string, string> = {
  केतु: "Ketu",
  शुक्र: "Venus",
  सूर्य: "Sun",
  चन्द्र: "Moon",
  मङ्गल: "Mars",
  राहु: "Rahu",
  गुरु: "Jupiter",
  शनि: "Saturn",
  बुध: "Mercury",
};

interface WheelPanelProps {
  sel: WheelPick | null;
  open: boolean;
  num: (n: number | string) => string | number;
  onClose: () => void;
}

export function WheelPanel({ sel, open, num, onClose }: WheelPanelProps) {
  let body: React.ReactNode = null;

  if (sel?.type === "nak") {
    const ico = NAKSHATRA_ICONS[sel.i]!;
    const L0 = sel.i * (360 / 27);
    const L1 = L0 + 360 / 27;
    const ri0 = Math.floor(L0 / 30);
    const ri1 = Math.floor((L1 - 0.01) / 30);
    const rashiSpan =
      ri0 === ri1
        ? WHEEL_RASHIS[ri0]!.ne
        : `${WHEEL_RASHIS[ri0]!.ne}–${WHEEL_RASHIS[ri1]!.ne}`;

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
            <div className="w-panel-kind">नक्षत्र · {num(sel.i + 1)}</div>
            <h2 className="w-panel-title">{ico.ne}</h2>
            <div className="w-panel-sub">{ico.en}</div>
          </div>
          <button type="button" className="w-panel-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="w-panel-body">
          <div className="w-dl">
            <div className="w-dl-row">
              <span className="w-dl-k">स्वामी ग्रह</span>
              <span className="w-dl-v">
                {ico.lord_ne} · {LORD_EN[ico.lord_ne] ?? ico.lord_ne}
              </span>
            </div>
            <div className="w-dl-row">
              <span className="w-dl-k">चिन्ह</span>
              <span className="w-dl-v">{ico.sym_ne}</span>
            </div>
            <div className="w-dl-row">
              <span className="w-dl-k">राशि</span>
              <span className="w-dl-v">{rashiSpan}</span>
            </div>
            <div className="w-dl-row">
              <span className="w-dl-k">देशान्तर</span>
              <span className="w-dl-v mono">
                {num(L0.toFixed(1))}°–{num(L1.toFixed(1))}°
              </span>
            </div>
            <div className="w-dl-row">
              <span className="w-dl-k">पाद अक्षर</span>
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
        nakIn.push(NAKSHATRA_ICONS[i]!.ne);
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
            <div className="w-panel-kind">राशि · {num(sel.i + 1)}</div>
            <h2 className="w-panel-title">{rs.ne}</h2>
            <div className="w-panel-sub">{rs.en}</div>
          </div>
          <button type="button" className="w-panel-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="w-panel-body">
          <div className="w-dl">
            <div className="w-dl-row">
              <span className="w-dl-k">स्वामी ग्रह</span>
              <span className="w-dl-v">{RASHI_LORDS[sel.i]}</span>
            </div>
            <div className="w-dl-row">
              <span className="w-dl-k">तत्त्व</span>
              <span className="w-dl-v">{RASHI_ELEM[sel.i]}</span>
            </div>
            <div className="w-dl-row">
              <span className="w-dl-k">देशान्तर</span>
              <span className="w-dl-v mono">
                {num(sel.i * 30)}°–{num((sel.i + 1) * 30)}°
              </span>
            </div>
            <div className="w-dl-row">
              <span className="w-dl-k">नेपाली महिना</span>
              <span className="w-dl-v">{bsMonths[sel.i]?.ne}</span>
            </div>
            <div className="w-dl-row">
              <span className="w-dl-k">पाद</span>
              <span className="w-dl-v mono">{num(9)} पाद</span>
            </div>
          </div>
          <div className="w-panel-cons">
            <div className="w-panel-cons-txt" style={{ width: "100%" }}>
              <b>नक्षत्रहरू</b>
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
