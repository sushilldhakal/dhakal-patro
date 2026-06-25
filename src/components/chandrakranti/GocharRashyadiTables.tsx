import type { GocharGraha } from "@/lib/api";
import {
  formatPlanetRashiHeader,
  formatRashyadiNumberLine,
  mergeKundaliRashi,
  RASHYADI_PLANET_KEYS,
  type RashyadiSegment,
} from "@/lib/chandrakranti/rashyadi";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { cn } from "@/lib/utils";

type GrahaRow = GocharGraha & { key: string };

type Props = {
  segments: RashyadiSegment[];
  kundaliGrahas?: GrahaRow[];
  kundaliDateAd?: string | null;
  loading?: boolean;
  className?: string;
};

export function GocharRashyadiTables({
  segments,
  kundaliGrahas,
  kundaliDateAd,
  loading,
  className,
}: Props) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-sm font-semibold text-foreground">राश्यादि स्पष्ट ग्रह</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          शीर्षकमा <span className="font-mono text-foreground">सू.२</span> जस्तो सङ्केतले ग्रहको
          राशि देखाउँछ (गोचर कुण्डलीसँग मेल)। तलको पङ्क्तिमा अंश, कला, विकला, प्रति-विकला, त्रुटि —
          दृष्टि र वर्ग कुण्डलीका लागि सटीक देशान्तर।
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          चन्द्रमा यस तालिकामा छैन — दैनिक पञ्चाङ्गको{" "}
          <span className="font-medium text-foreground/90">च.रा.</span> कोलमबाट हेर्नुहोस्।
        </p>
        <details className="mt-2 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground/80 hover:text-foreground">
            किन धेरै तालिका हुन्छन्?
          </summary>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 leading-relaxed">
            <li>
              <strong className="font-medium text-foreground/90">पक्ष संस्करण:</strong> प्रत्येक
              शुक्ल/कृष्ण पक्ष (१५ दिन) का लागि छुट्टै रेकर्ड।
            </li>
            <li>
              <strong className="font-medium text-foreground/90">ग्रह राशि परिवर्तन:</strong> पक्षभित्र
              चन्द्र बाहेकका ग्रहले राशि बदल्दा मात्र थप तालिका (चन्द्रको दैनिक गति यहाँबाट होइन)।
            </li>
            <li>
              <strong className="font-medium text-foreground/90">संक्रान्ति र अधिक मास:</strong>{" "}
              सङ्क्रान्ति वा अधिक मासमा अधिक संस्करण तालिका।
            </li>
            <li>
              <strong className="font-medium text-foreground/90">गा.पाशाः:</strong>{" "}
              <span className="font-mono">२७सू३</span> = २७ गते सूर्य तेस्रो राशिमा प्रवेश।
            </li>
          </ul>
        </details>
      </div>

      {loading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">लोड हुँदैछ…</p>
      ) : segments.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">विवरण उपलब्ध छैन।</p>
      ) : (
        segments.map((seg) => {
          const planets =
            kundaliGrahas &&
            kundaliDateAd &&
            seg.anchorDateAd === kundaliDateAd
              ? mergeKundaliRashi(seg.planets, kundaliGrahas)
              : seg.planets;

          return (
            <div
              key={seg.id}
              className="overflow-x-auto rounded-lg border border-border bg-muted/20"
            >
              <div className="border-b border-border bg-muted/40 px-3 py-2">
                <p className="text-sm font-semibold text-secondary">{seg.versionNe}</p>
                <p className="text-sm text-foreground">
                  {seg.bsDay != null ? (
                    <span className="mr-1.5 font-medium">{toNepaliDigits(seg.bsDay)} गते</span>
                  ) : null}
                  {seg.labelNe}
                </p>
                {seg.moonRashiNe ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    च.रा. (चन्द्र राशि):{" "}
                    <span className="font-medium text-foreground">{seg.moonRashiNe}</span>
                  </p>
                ) : null}
              </div>
              <table className="w-full min-w-[24rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="min-w-[4.5rem] px-2 py-1.5 text-left text-xs font-semibold text-foreground">
                      गा.पाशाः
                    </th>
                    {RASHYADI_PLANET_KEYS.map((key) => (
                      <th
                        key={key}
                        className="min-w-[3.5rem] px-1 py-1.5 text-center text-xs font-semibold text-foreground"
                      >
                        {planets[key]
                          ? formatPlanetRashiHeader(key, planets[key]!.rashi)
                          : "—"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="align-top px-2 py-2 text-xs leading-relaxed text-muted-foreground">
                      {seg.transitCodes.length > 0 ? (
                        <div className="space-y-0.5 font-mono text-foreground">
                          {seg.transitCodes.map((code) => (
                            <div key={code}>{code}</div>
                          ))}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    {RASHYADI_PLANET_KEYS.map((key) => {
                      const row = planets[key];
                      return (
                        <td
                          key={`${seg.id}-${key}-nums`}
                          className="px-1 py-2 text-center font-mono text-sm leading-snug tabular-nums text-foreground"
                        >
                          {row ? (
                            <>
                              <div>{formatRashyadiNumberLine(row)}</div>
                              <div
                                className={cn(
                                  "mt-0.5 text-[10px] font-medium",
                                  row.vakri
                                    ? "text-rose-600 dark:text-rose-300"
                                    : "text-emerald-600 dark:text-emerald-300",
                                )}
                              >
                                {row.vakri ? "वक्री" : "मार्गी"}
                              </div>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
              <p className="border-t border-border/60 px-3 py-1.5 text-[10px] text-muted-foreground">
                अंश · कला · विकला · प्रति-विकला · त्रुटि
              </p>
            </div>
          );
        })
      )}
    </div>
  );
}
