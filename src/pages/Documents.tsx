import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import { PageHeader, PageShell } from "@/components/PageShell";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { documentsKeys, fetchDocuments } from "@/lib/documents-api";
import { useRouteLoading } from "@/lib/route-loading";

export function Documents() {
  const { t } = useTranslation();

  const docsQ = useQuery({
    queryKey: documentsKeys.list(),
    queryFn: fetchDocuments,
    staleTime: 1000 * 60 * 30,
  });

  useRouteLoading(docsQ.isLoading);

  const documents = docsQ.data?.documents ?? [];

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <DocumentCard key={doc.slug} doc={doc} />
          ))}
        </div>
      )}
    </PageShell>
  );
}

export default Documents;
