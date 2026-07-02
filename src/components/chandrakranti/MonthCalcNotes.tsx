import type { CalcNote } from "@/lib/chandrakranti/month-patro-tables";
import { cn } from "@/lib/utils";
import { PatroTableShell } from "./PatroTableShell";
import { useLocale } from "@/i18n/locale";

const UDAYAST_LEGEND: { code: string; full: string; fullEn: string; meaning: string; meaningEn: string }[] = [
  { code: "व.उ.", full: "वक्र उदय", fullEn: "Retrograde rising", meaning: "ग्रह वक्र (उल्टो) अवस्थामा उदय भएको।", meaningEn: "The planet rises while retrograde (moving backward)." },
  { code: "बु.मा.उ.", full: "बुध मार्गी उदय", fullEn: "Mercury direct rising", meaning: "बुध मार्गी (सुल्टो) भएर उदय भएको।", meaningEn: "Mercury rises while direct." },
  { code: "वृ.व.उ.", full: "बृहस्पति वक्र उदय", fullEn: "Jupiter retrograde rising", meaning: "बृहस्पति (गुरु) वक्र अवस्थामा उदय भएको।", meaningEn: "Jupiter rises while retrograde." },
  { code: "शु.मा.उ.", full: "शुक्र मार्गी उदय", fullEn: "Venus direct rising", meaning: "शुक्र मार्गी भएर उदय भएको।", meaningEn: "Venus rises while direct." },
  { code: "श.मा.उ. ७अ.", full: "शनि मार्गी उदय, ७ अस्त", fullEn: "Saturn direct rising, sets on the 7th", meaning: "शनि मार्गी भएर उदय भएको र ७ गते अस्त हुने।", meaningEn: "Saturn rises while direct and sets on the 7th." },
];

const KIND_LABEL: Record<CalcNote["kind"], string> = {
  ingress: "ग्रहचार",
  udayast: "उदयास्त",
  motion: "वक्री/मार्गी",
  late_night: "रात्रिकालीन",
  paksha_boundary: "पक्ष सीमा",
};

const KIND_LABEL_EN: Record<CalcNote["kind"], string> = {
  ingress: "Transit",
  udayast: "Rise/Set",
  motion: "Retro/Direct",
  late_night: "Late night",
  paksha_boundary: "Paksha boundary",
};

type Props = {
  notes: CalcNote[];
  loading?: boolean;
  embedded?: boolean;
};

export function MonthCalcNotes({ notes, loading, embedded }: Props) {
  const { pick, digits } = useLocale();
  const notesList = loading ? (
    <p className="px-4 py-8 text-center text-sm text-muted-foreground">{pick("लोड हुँदैछ…", "Loading…")}</p>
  ) : notes.length === 0 ? (
    <p className="px-4 py-8 text-center text-sm text-muted-foreground">
      {pick("यस महिनामा विशेष गणना सूचना छैन।", "No special calculation notes this month.")}
    </p>
  ) : (
    <ul className="divide-y divide-border">
      {notes.map((note) => (
        <li
          key={`${note.dateAd}-${note.kind}-${note.text}`}
          className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2.5 text-sm"
        >
          <span className="shrink-0 font-semibold text-secondary">
            {digits(note.day)}
          </span>
          <span
            className={cn(
              "shrink-0 rounded px-2 py-0.5 text-xs font-semibold sm:text-sm",
              note.kind === "late_night" && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
              note.kind === "ingress" && "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
              note.kind === "paksha_boundary" && "bg-muted text-muted-foreground",
            )}
          >
            {pick(KIND_LABEL[note.kind], KIND_LABEL_EN[note.kind])}
          </span>
          <span className="text-foreground">{pick(note.text, note.textEn ?? note.text)}</span>
        </li>
      ))}
    </ul>
  );

  const legend = (
    <section className={cn(!embedded && "rounded-xl border border-border p-4", embedded && "mt-4 border-t border-border pt-4")}>
      <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {pick("ग्रह उदयास्त सङ्केत", "Planet rise-set symbols")}
      </h4>
      <dl className="space-y-1.5">
        {UDAYAST_LEGEND.map((it) => (
          <div key={it.code} className="flex gap-2 text-sm">
            <dt className="w-24 shrink-0">
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-secondary sm:text-sm">
                {it.code}
              </span>
            </dt>
            <dd className="text-muted-foreground">
              <span className="text-foreground">{pick(it.full, it.fullEn)}</span> — {pick(it.meaning, it.meaningEn)}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {pick(
          <>
            <span className="font-semibold text-foreground">दशा कोष्ठक:</span> जन्म-समयमा बाँकी
            विंशोत्तरी दशाको वर्ष/महिना/दिन।{" "}
            <span className="font-semibold text-foreground">समय सुधार:</span> मुद्रणमा “उ” वा “०”
            जस्ता सङ्केतले शून्य अंश/कला जनाउँछ। सूचीबद्ध सूर्योदयमा बेलान्तर र देशान्तर पहिल्यै
            समायोजित छन्।
          </>,
          <>
            <span className="font-semibold text-foreground">Dasha bracket:</span> the years/months/days
            of Vimshottari dasha remaining at birth.{" "}
            <span className="font-semibold text-foreground">Time correction:</span> in print, symbols like
            “u” or “0” indicate zero degrees/kala. The listed sunrise already has belaantar and
            deshaantar corrections applied.
          </>,
        )}
      </p>
    </section>
  );

  if (embedded) {
    return (
      <div>
        {notesList}
        {legend}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PatroTableShell
        titleNe="गणना सूचना र विशेष दिनहरू"
        titleEn="Special Calculation Notes"
        subtitle="ग्रह सङ्क्रान्ति, २४:०० पछिको लग्न/ग्रहचार, र अधिक/शुद्ध पक्ष सीमाहरू — जन्मकुण्डली र विधि समयका लागि ध्यान दिनुपर्ने दिनहरू।"
        subtitleEn="Planetary sankrantis, post-24:00 lagna/transits, and adhik/shuddha paksha boundaries — days to note for birth-chart and ritual timing."
      >
        {notesList}
      </PatroTableShell>
      {legend}
    </div>
  );
}
