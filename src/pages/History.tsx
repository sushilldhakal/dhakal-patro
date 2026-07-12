import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  History as HistoryIcon,
  ScrollText,
  Video,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { useRouteLoading } from "@/lib/route-loading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  tmFcard,
  tmHero,
  tmHeroEyebrow,
  tmHeroSub,
  tmHeroTitle,
  tmLede,
  tmPageShell,
  tmSecHead,
  tmSecKicker,
  tmSecTitle,
  tmSection,
  tmWrap,
} from "@/lib/learn-classes";
import { cn } from "@/lib/utils";
import {
  HISTORY_ERA_NOTE,
  HISTORY_MILESTONES,
  HISTORY_SOURCE,
  SURYA_SIDDHANTA_HISTORY,
  type HistorySection,
} from "@/lib/history/surya-siddhanta-history";
import { formatBbse } from "@/lib/history/era-dates";
import { getCurrentBs } from "@/lib/bs-calendar";
import { toNepaliDigits } from "@/lib/panchanga-format";

function SectionBody({ section }: { section: HistorySection }) {
  return (
    <div className="flex flex-col gap-4">
      {section.paragraphs.map((paragraph, i) => (
        <p key={i} className={cn(tmLede, "m-0")}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function SectionBlock({
  section,
  className,
}: {
  section: HistorySection;
  className?: string;
}) {
  return (
    <section id={section.id} className={cn(tmSection, "scroll-mt-24", className)}>
      <div className={tmSecHead}>
        <span className={tmSecKicker}>{section.kicker}</span>
        <h2 className={tmSecTitle}>{section.title}</h2>
      </div>
      <SectionBody section={section} />
    </section>
  );
}

export function History() {
  useRouteLoading(false);
  const [activeId, setActiveId] = useState(SURYA_SIDDHANTA_HISTORY[0]?.id ?? "");
  const currentBsYear = getCurrentBs().year;

  useEffect(() => {
    const sections = SURYA_SIDDHANTA_HISTORY.map((s) => document.getElementById(s.id)).filter(
      Boolean,
    ) as HTMLElement[];

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveId(visible.target.id);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5] },
    );

    for (const el of sections) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <PageShell className="max-w-[1200px]">
      <Link
        to="/learn"
        className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        ज्ञानकेन्द्र
      </Link>

      <article className={cn(tmPageShell, "mt-4 rounded-2xl border border-border overflow-hidden")}>
        <div className={tmWrap}>
          <header className={tmHero}>
            <div className={tmHeroEyebrow}>इतिहास · खगोलशास्त्र सम्पदा</div>
            <h1 className={tmHeroTitle}>
              मयासुरको <b>सूर्य सिद्धान्त</b>
            </h1>
            <p className={tmHeroSub}>
              ८,८०० वर्ष पुरानो वैदिक पञ्चाङ्ग परम्परा — {formatBbse(6778)} को ग्रहसंयोगदेखि युग
              चक्र, नक्षत्र स्थानान्तरण, र विश्वका पात्रोहरूमा प्रभावसम्म। सबै मिति BBSE वा
              वि.सं. मा प्रस्तुत।
            </p>

            <a
              href={HISTORY_SOURCE.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-secondary/50 hover:bg-secondary/5"
            >
              <Video className="size-4 text-destructive" />
              {HISTORY_SOURCE.title}
              <ExternalLink className="size-3.5" />
            </a>
          </header>

          <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {HISTORY_MILESTONES.map((m) => (
              <div key={m.label} className={cn(tmFcard, "text-center")}>
                <div className="big">{m.year}</div>
                <div className="lbl">{m.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2 rounded-xl border border-border bg-card/50 px-4 py-3 text-sm sm:flex-row sm:gap-6">
            <p className="m-0">
              <span className="font-semibold text-foreground">BBSE</span>
              {" — "}
              {HISTORY_ERA_NOTE.bbse}
            </p>
            <p className="m-0">
              <span className="font-semibold text-foreground">वि.सं.</span>
              {" — "}
              {HISTORY_ERA_NOTE.bs}
              {" "}
              (आज {toNepaliDigits(currentBsYear)})
            </p>
          </div>

          <div className="mt-12 hidden lg:grid lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)] lg:gap-12">
            <nav
              className="sticky top-20 self-start rounded-xl border border-border bg-card/60 p-3 backdrop-blur-sm"
              aria-label="विषयसूची"
            >
              <p className="mb-2 px-2 text-sm font-semibold uppercase tracking-wider">
                विषयसूची
              </p>
              <ul className="flex flex-col gap-0.5">
                {SURYA_SIDDHANTA_HISTORY.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className={cn(
                        "block rounded-lg px-2.5 py-2 text-sm leading-snug transition-colors",
                        activeId === section.id
                          ? "bg-secondary/10 font-medium text-secondary"
                          : "hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <span className="mr-1.5 font-mono text-xs opacity-70">
                        {section.kicker}
                      </span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              {SURYA_SIDDHANTA_HISTORY.map((section) => (
                <SectionBlock key={section.id} section={section} />
              ))}
            </div>
          </div>

          <div className="mt-10 lg:hidden">
            <div className="mb-4 flex items-center gap-2 text-secondary">
              <ScrollText className="size-4" />
              <h2 className="text-sm font-semibold text-foreground">विषयहरू</h2>
            </div>
            <Accordion
              type="single"
              collapsible
              defaultValue={SURYA_SIDDHANTA_HISTORY[0]?.id}
              className="rounded-xl border border-border bg-card/40 px-3"
            >
              {SURYA_SIDDHANTA_HISTORY.map((section) => (
                <AccordionItem key={section.id} value={section.id} className="border-border">
                  <AccordionTrigger className="py-3 text-left hover:no-underline">
                    <span className="flex flex-col gap-0.5 pr-2">
                      <span className="text-xs font-mono">
                        {section.kicker}
                      </span>
                      <span className="text-base font-semibold text-foreground">
                        {section.title}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <SectionBody section={section} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <footer className={cn(tmSection, "mt-16 rounded-xl border border-border bg-card/50 p-6 text-center")}>
            <HistoryIcon className="mx-auto size-8 text-secondary" />
            <p className={cn(tmLede, "mx-auto mt-4 max-w-xl text-center")}>
              यो पृष्ठ{" "}
              <a
                href={HISTORY_SOURCE.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-secondary underline-offset-2 hover:underline"
              >
                वृत्तचित्र
              </a>{" "}
              को नेपाली प्रतिलेख हो — शैक्षिक उद्देश्यका लागि। विज्ञान र इतिहासका दावीहरू
              स्वतन्त्र रूपमा प्रमाणित गर्न सिफारिस गरिन्छ।
            </p>
            <Link
              to="/learn"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-secondary"
            >
              <BookOpen className="size-4" />
              ज्ञानकेन्द्रमा फर्कनुहोस्
            </Link>
          </footer>
        </div>
      </article>
    </PageShell>
  );
}

export default History;
