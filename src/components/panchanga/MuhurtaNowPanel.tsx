import type { MuhurtaNowBlock, PanchangaDay } from "@/lib/api";
import { formatTimeShort, toNepaliDigits } from "@/lib/panchanga-format";
import { cn } from "@/lib/utils";

function windowLabel(block?: MuhurtaNowBlock | null): string | undefined {
  if (!block) return undefined;
  const start = formatTimeShort(block.start_time ?? block.start_local);
  const end = formatTimeShort(block.end_time ?? block.end_local);
  if (start && end) return `${toNepaliDigits(start)} – ${toNepaliDigits(end)}`;
  return start ? toNepaliDigits(start) : undefined;
}

const ROWS: { key: keyof NonNullable<PanchangaDay["muhurta_now"]>; label: string; labelEn: string }[] =
  [
    { key: "rahu_kalam", label: "राहु काल", labelEn: "Rahu Kalam" },
    { key: "yamaganda", label: "यमगण्ड", labelEn: "Yamaganda" },
    { key: "gulika", label: "गुलिक", labelEn: "Gulika" },
    { key: "abhijit", label: "अभिजित", labelEn: "Abhijit" },
  ];

interface Props {
  p: PanchangaDay;
  clock?: string;
}

export function MuhurtaNowPanel({ p, clock }: Props) {
  const now = p.muhurta_now;
  if (!now) return null;

  const instantLabel = p.query_instant_local ?? clock;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground mb-1">
        क्षणिक मुहूर्त · Muhurta now
      </div>
      {instantLabel && (
        <p className="text-sm text-muted-foreground mb-3 m-0">
          {toNepaliDigits(instantLabel.split(" ")[1] ?? instantLabel)} बजेको अवस्था
        </p>
      )}
      <ul className="space-y-2 m-0 p-0 list-none">
        {ROWS.map(({ key, label, labelEn }) => {
          const block = now[key];
          const active = block?.active;
          const range = windowLabel(block);
          return (
            <li
              key={key}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm",
                active ? "bg-secondary/20 text-secondary-foreground" : "bg-muted/40"
              )}
            >
              <span>
                <span className="font-semibold">{label}</span>
                <span className="text-muted-foreground text-xs ml-1.5">{labelEn}</span>
              </span>
              <span className="text-right shrink-0">
                {active ? (
                  <span className="text-xs font-bold uppercase tracking-wide text-secondary">
                    सक्रिय
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground font-mono tabular-nums">
                    {range ?? "—"}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function EphemerisModeBanner({ p, clock }: Props) {
  const time = p.query_instant_local?.split(" ")[1] ?? clock;
  const civil = p.before_sunrise_of_civil_day;
  return (
    <div className="rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm">
      <p className="m-0 font-semibold text-foreground">
        समय-आधारित पञ्चाङ्ग · Ephemeris mode
      </p>
      <p className="m-0 mt-1 text-foreground text-[13px] leading-relaxed">
        {time ? (
          <>
            <span className="font-mono tabular-nums">{toNepaliDigits(time)}</span> बजे चलिरहेको
            तिथि/नक्षत्र/योग/करण।
          </>
        ) : (
          "तोकिएको समयमा चलिरहेको तिथि/नक्षत्र/योग/करण।"
        )}
        {civil && (
          <>
            {" "}
            यो समय आजको सूर्योदय अघि भएकाले हिजोको वैदिक दिनको पञ्चाङ्ग देखाइँदैछ।
          </>
        )}
        {" "}
        ग्रह डिग्री drik (स्पष्ट) हुन् — मुद्रित सिद्धान्तिक पात्रोसँग मिल्दैन।
      </p>
    </div>
  );
}
