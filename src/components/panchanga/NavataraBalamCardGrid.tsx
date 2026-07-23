import type { BalamCardItem } from "@/lib/balam-cards";
import { findCurrentBalamCard } from "@/lib/balam-cards";
import { formatNavataraQuality, formatNavataraTara } from "@/lib/navatara-bala";
import { PanchangaBalamCard, panchangaCardGrid } from "./PanchangaLayout";

export function NavataraBalamCardGrid({
  cards,
  clock,
  formatName,
  lang,
}: {
  cards: BalamCardItem[];
  clock?: string;
  formatName: (card: BalamCardItem) => string;
  lang?: string;
}) {
  const current = findCurrentBalamCard(cards, clock);
  if (!cards.length) return null;

  return (
    <div className={panchangaCardGrid}>
      {cards.map((card) => {
        const subtitle = `${formatNavataraTara(card.tara, lang)}/${formatNavataraQuality(card.quality, lang)}`;
        const name = formatName(card);
        const titleLine = (
          <>
            {name}
            {card.timeRange ? (
              <>
                {" "}
                <span className="font-mono font-semibold tabular-nums">{card.timeRange}</span>
              </>
            ) : null}
          </>
        );
        return (
          <PanchangaBalamCard
            key={card.key}
            titleLine={titleLine}
            subtitleLine={subtitle}
            tone={card.tone}
            isCurrent={current?.key === card.key}
          />
        );
      })}
    </div>
  );
}
