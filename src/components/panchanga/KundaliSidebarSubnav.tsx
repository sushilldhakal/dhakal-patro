import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  KUNDALI_SECTIONS,
  parseKundaliSectionFromHash,
  type KundaliSectionId,
} from "@/components/kundali/KundaliSectionNav";
import { cn } from "@/lib/utils";

/** Section tabs nested under जन्मकुण्डली निर्माण in the panchanga sidebar. */
export function KundaliSidebarSubnav({
  profileId,
  activeSectionId,
}: {
  profileId: string;
  activeSectionId: KundaliSectionId;
}) {
  const { t } = useTranslation();

  return (
    <ul className="ml-2 flex flex-col gap-0.5 border-l border-border/70 pl-2 pb-1">
      {KUNDALI_SECTIONS.map(({ id, labelKey, ...rest }) => {
        const isChild = "parentId" in rest && rest.parentId != null;
        const active = activeSectionId === id;
        return (
          <li key={id}>
            <Link
              to="/kundali/$profileId"
              params={{ profileId }}
              hash={id}
              className={cn(
                "block rounded-lg py-1.5 text-left text-xs leading-snug transition-colors",
                isChild ? "pl-3 pr-2" : "px-2",
                active
                  ? "bg-secondary/12 font-medium text-secondary ring-1 ring-secondary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              aria-current={active ? "true" : undefined}
            >
              {t(labelKey)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export { parseKundaliSectionFromHash };
