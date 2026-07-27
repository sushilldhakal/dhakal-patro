import { useLocale } from "@/i18n/locale";
import {
  GRAHA_PAGE_DESCRIPTIONS,
  type GrahaPageDescription,
} from "@/lib/graha-detail-descriptions";
import { patroCard } from "@/lib/patro-classes";
import { cn } from "@/lib/utils";

export function GrahaBanner({
  icon,
  ne,
  en,
  blurbNe,
  blurbEn,
}: {
  icon: React.ReactNode;
  ne: string;
  en: string;
  blurbNe: string;
  blurbEn: string;
}) {
  const { pick } = useLocale();
  return (
    <header
      className={cn(
        patroCard,
        "rounded-2xl border border-border/80 bg-gradient-to-br from-secondary/10 via-card to-card px-5 py-5 dark:from-secondary/12",
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary ring-1 ring-secondary/20 [&_svg]:size-6"
          aria-hidden
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
            {pick(ne, en)}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {pick(blurbNe, blurbEn)}
          </p>
        </div>
      </div>
    </header>
  );
}

/** "About" block — what it is · how it's calculated · what it means. */
export function GrahaDescription({ pageId }: { pageId: string }) {
  const { pick } = useLocale();
  const desc: GrahaPageDescription | undefined = GRAHA_PAGE_DESCRIPTIONS[pageId];
  if (!desc) return null;

  const blocks: { titleNe: string; titleEn: string; body: { ne: string; en: string } }[] = [
    { titleNe: "यो के हो", titleEn: "What it is", body: desc.what },
    { titleNe: "कसरी गणना गरिन्छ", titleEn: "How it's calculated", body: desc.how },
    { titleNe: "यसको अर्थ", titleEn: "What it means", body: desc.meaning },
  ];

  return (
    <section className={cn(patroCard, "mt-6 p-4")} aria-label={pick("विवरण", "About")}>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-secondary">
        {pick("बारेमा", "About")}
      </h2>
      <div className="flex flex-col gap-4">
        {blocks.map((b) => (
          <div key={b.titleEn} className="flex flex-col gap-1">
            <h3 className="text-sm font-bold text-foreground">{pick(b.titleNe, b.titleEn)}</h3>
            <p className="m-0 text-sm leading-relaxed text-muted-foreground">
              {pick(b.body.ne, b.body.en)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
