import { useMemo } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import { PageHeader, PageShell } from "@/components/PageShell";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { DocumentCategoryTabs } from "@/components/documents/DocumentCategoryTabs";
import {
  DOCUMENTS_STALE_TIME,
  documentsKeys,
  fetchDocuments,
  type DocumentCategoryTab,
} from "@/lib/documents-api";
import { useRouteLoading } from "@/lib/route-loading";

const routeApi = getRouteApi("/documents");

export function Documents() {
  const { t } = useTranslation();
  const { category: activeCategory } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const setActiveCategory = (category: DocumentCategoryTab) =>
    navigate({ search: { category }, replace: true });

  const docsQ = useQuery({
    queryKey: documentsKeys.list(),
    queryFn: fetchDocuments,
    staleTime: DOCUMENTS_STALE_TIME,
  });

  useRouteLoading(docsQ.isLoading);

  const documents = docsQ.data?.documents ?? [];
  const visibleDocuments = useMemo(
    () =>
      activeCategory === "all"
        ? documents
        : documents.filter((doc) => doc.category === activeCategory),
    [documents, activeCategory],
  );

  return (
    <PageShell showRelatedLinks={false}>
      <PageHeader
        icon={<BookOpen className="size-6 text-secondary" />}
        title={t("documents.page_title")}
        subtitle={t("documents.page_subtitle")}
      />

      {docsQ.isError ? (
        <p className="text-sm text-destructive">{t("documents.load_error")}</p>
      ) : !docsQ.isLoading && documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("documents.empty")}</p>
      ) : (
        <>
          <DocumentCategoryTabs activeId={activeCategory} onSelect={setActiveCategory} />
          {visibleDocuments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("documents.empty_category")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleDocuments.map((doc) => (
                <DocumentCard key={doc.slug} doc={doc} category={activeCategory} />
              ))}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}

export default Documents;
