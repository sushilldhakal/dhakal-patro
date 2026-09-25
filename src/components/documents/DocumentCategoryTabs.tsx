import { useTranslation } from "react-i18next";
import type { DocumentCategoryTab } from "@/lib/documents-api";
import { cn } from "@/lib/utils";

export type { DocumentCategoryTab };

const TABS: { id: DocumentCategoryTab; labelKey: string }[] = [
  { id: "all", labelKey: "documents.category.all" },
  { id: "mantra", labelKey: "documents.category.mantra" },
  { id: "stotram", labelKey: "documents.category.stotram" },
  { id: "shruti", labelKey: "documents.category.shruti" },
  { id: "gita", labelKey: "documents.category.gita" },
  { id: "upanishad", labelKey: "documents.category.upanishad" },
  { id: "scripture", labelKey: "documents.category.scripture" },
];

export function DocumentCategoryTabs({
  activeId,
  onSelect,
}: {
  activeId: DocumentCategoryTab;
  onSelect: (id: DocumentCategoryTab) => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="mb-4 flex flex-wrap gap-1 rounded-xl border border-border/70 bg-muted/20 p-1"
      role="tablist"
      aria-label={t("documents.category_tabs_label")}
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeId === tab.id}
          onClick={() => onSelect(tab.id)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
            activeId === tab.id
              ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
              : "hover:text-foreground",
          )}
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  );
}
