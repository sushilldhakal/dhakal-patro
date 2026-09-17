// Documents (शोत्र/स्तोत्र) — Sanskrit scripture text, meanings, and R2-hosted
// per-verse audio. Kept out of src/lib/api.ts (a panchanga-only catalogue at
// this point) as its own small, self-contained client.
import { API_DATA_BASE, ApiError } from "@/lib/api";

export interface DocumentSummary {
  slug: string;
  order_index: number;
  title_sa: string;
  title_ne: string;
  title_en: string;
  subtitle_ne?: string | null;
  subtitle_en?: string | null;
  description_ne?: string | null;
  description_en?: string | null;
  cover_image_url?: string | null;
  has_chapters: boolean;
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
  shlokas: Shloka[];
}

export interface DocumentDetail extends DocumentSummary {
  source_ne?: string | null;
  source_en?: string | null;
  chapters: DocumentChapter[];
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
};

export const fetchDocuments = () =>
  get<{ count: number; documents: DocumentSummary[] }>("/documents");

export const fetchDocumentDetail = (slug: string) =>
  get<DocumentDetail>(`/documents/${encodeURIComponent(slug)}`);

/** Every shloka in a document, in reading order, across chapter boundaries. */
export function flattenShlokas(doc: DocumentDetail): Shloka[] {
  return doc.chapters.flatMap((c) => c.shlokas);
}
