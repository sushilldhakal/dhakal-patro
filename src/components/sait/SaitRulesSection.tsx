import { Info, ScrollText } from "lucide-react";
import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import { patroCard } from "@/lib/patro-classes";

export interface SaitRule {
  ne: string;
  en: string;
}

/**
 * "How this list is generated" — the per-ceremony method paragraph plus the
 * classical rule list the engine actually applies. Rendered on every sāit
 * page so each ceremony explains how its dates are computed, exactly as the
 * vivāha page does. `method` and `rules` come from the backend
 * `/nepal/sait/{category}/about` endpoint (single source of truth).
 */
export function SaitRulesSection({
  method,
  rules,
  engineVersion,
}: {
  method?: { ne?: string; en?: string } | null;
  rules?: SaitRule[] | null;
  engineVersion?: string;
}) {
  const { pick } = useLocale();
  const intro = method ? pick(method.ne ?? "", method.en ?? "") : "";
  if (!intro && (!rules || rules.length === 0)) return null;

  return (
    <div className={cn(patroCard, "flex flex-col gap-3 border-l-2 border-secondary p-4")}>
      <div className="flex items-center gap-2">
        <ScrollText className="size-4 shrink-0 text-secondary" />
        <h2 className="text-base font-bold text-foreground">
          {pick("यो सूची कसरी बन्छ", "How this list is generated")}
        </h2>
      </div>
      {intro ? <p className="text-sm leading-relaxed text-foreground">{intro}</p> : null}
      {rules && rules.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {rules.map((r, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-secondary" aria-hidden />
              <span>{pick(r.ne, r.en)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {engineVersion ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5" />
          {pick("मुहूर्त इन्जिन संस्करण", "Muhūrta engine")} {engineVersion}
        </p>
      ) : null}
    </div>
  );
}

export default SaitRulesSection;
