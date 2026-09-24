// Documents (शोत्र/स्तोत्र) — Sanskrit scripture text, meanings, and R2-hosted
// per-verse audio. Kept out of src/lib/api.ts (a panchanga-only catalogue at
// this point) as its own small, self-contained client.
import { API_DATA_BASE, ApiError } from "@/lib/api";

/**
 * Scripture text and meanings don't change under a reader's feet — the backend
 * only ever re-seeds on a content edit + redeploy. A long staleTime (plus the
 * default `refetchOnMount`, not "always") means clicking through chapters or
 * using back/forward serves cached data instantly instead of re-hitting the
 * API on every mount.
 */
export const DOCUMENTS_STALE_TIME = 60 * 60 * 1000;

export type DocumentCategory = "mantra" | "stotram" | "scripture";
export type DocumentCategoryTab = "all" | DocumentCategory;

const CATEGORY_TABS: readonly DocumentCategoryTab[] = ["all", "mantra", "stotram", "scripture"];

function toCategoryTab(value: unknown): DocumentCategoryTab | undefined {
  return CATEGORY_TABS.includes(value as DocumentCategoryTab)
    ? (value as DocumentCategoryTab)
    : undefined;
}

export interface DocumentsListSearch {
  category: DocumentCategoryTab;
}

/** The list page's active category tab — kept in the URL so it survives a reload/share and so leaving a document can return to the same tab. */
export function validateDocumentsListSearch(search: Record<string, unknown>): DocumentsListSearch {
  return { category: toCategoryTab(search.category) ?? "all" };
}

export interface DocumentDetailSearch {
  /** Which list-page tab this document was opened from, so its "back" link can return there. Absent for a direct/deep link. */
  category?: DocumentCategoryTab;
}

export function validateDocumentDetailSearch(search: Record<string, unknown>): DocumentDetailSearch {
  const category = toCategoryTab(search.category);
  return category ? { category } : {};
}

export interface DocumentSummary {
  slug: string;
  order_index: number;
  category: DocumentCategory;
  title_sa: string;
  title_ne: string;
  title_en: string;
  subtitle_ne?: string | null;
  subtitle_en?: string | null;
  description_ne?: string | null;
  description_en?: string | null;
  cover_image_url?: string | null;
  has_chapters: boolean;
  /**
   * When true with `has_chapters`, every chapter's verses are embedded on the
   * document detail response and the UI renders them as sections of one page
   * instead of linking out to `/documents/$slug/$chapter`.
   */
  inline_chapters?: boolean;
  chapter_count: number;
  shloka_count: number;
  /** One continuous recording of the whole document, separate from the per-verse clips. */
  full_audio_url?: string | null;
}

export interface Shloka {
  id: number;
  global_order: number;
  verse_number: number;
  /** Human-facing verse reference, e.g. "1.1" or "12" — matches the audio filenames. */
  verse_label: string;
  /**
   * Groups a chapter's shlokas one level below "chapter" — e.g. the Rigveda,
   * where a chapter is a Mandala and this is the Sukta a rik belongs to.
   * null for documents with no such sub-grouping (most of them).
   */
  sukta_number?: number | null;
  sanskrit: string;
  transliteration?: string | null;
  meaning_ne?: string | null;
  meaning_en?: string | null;
  /** null until the matching file is uploaded to R2. */
  audio_url?: string | null;
  audio_duration_seconds?: number | null;
  /**
   * Where this verse sits inside the document's `full_audio_url`, seconds —
   * measured by cross-correlating this verse's own clip against the full
   * recording's waveform. null until that's been run for this document.
   */
  full_audio_start?: number | null;
  full_audio_end?: number | null;
}

export interface DocumentChapter {
  /** null for a document with no chapters (has_chapters: false). */
  number: number | null;
  title_ne?: string | null;
  title_en?: string | null;
  /**
   * Present when verses are small enough to embed on the document page —
   * either a document with no chapter routes, or one with `inline_chapters`.
   * A paginated chaptered document's chapters carry `shloka_count` instead,
   * and its verses are fetched per chapter via `fetchDocumentChapter`.
   */
  shlokas?: Shloka[];
  /** Present only for a chaptered document's chapter entries (see above). */
  shloka_count?: number;
}

export interface DocumentDetail extends DocumentSummary {
  source_ne?: string | null;
  source_en?: string | null;
  chapters: DocumentChapter[];
}

export interface DocumentChapterDetail extends DocumentSummary {
  source_ne?: string | null;
  source_en?: string | null;
  chapter: {
    number: number | null;
    title_ne?: string | null;
    title_en?: string | null;
    shlokas: Shloka[];
  };
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_DATA_BASE}${path}`);
  if (!res.ok) {
    let detail: string | undefined;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, detail, path);
  }
  return res.json();
}

export const documentsKeys = {
  list: () => ["documents", "list"] as const,
  detail: (slug: string) => ["documents", "detail", slug] as const,
  chapter: (slug: string, chapterNumber: number) =>
    ["documents", "detail", slug, "chapter", chapterNumber] as const,
};

export const fetchDocuments = () =>
  get<{ count: number; documents: DocumentSummary[] }>("/documents");

export const fetchDocumentDetail = (slug: string) =>
  get<DocumentDetail>(`/documents/${encodeURIComponent(slug)}`);

export const fetchDocumentChapter = (slug: string, chapterNumber: number) =>
  get<DocumentChapterDetail>(
    `/documents/${encodeURIComponent(slug)}/chapters/${chapterNumber}`,
  );

/**
 * Every shloka in a document, in reading order, across chapter boundaries.
 * Empty for a paginated chaptered document (those chapters carry no inline
 * `shlokas`); read a chapter's verses via `fetchDocumentChapter` instead.
 */
export function flattenShlokas(doc: DocumentDetail): Shloka[] {
  return doc.chapters.flatMap((c) => c.shlokas ?? []);
}
