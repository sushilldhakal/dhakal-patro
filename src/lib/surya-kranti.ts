/** Uttarayana rashis (0-based sidereal index): Makara → Mithuna. */
const UTTAR_RASHI_INDICES = new Set([9, 10, 11, 0, 1, 2]);

export type SankrantiBoundary = {
  to_rashi_index: number;
  local_date: string;
};

export function ayanaMarkFromRashiIndex(rashiIndex: number): "उ" | "द" {
  const idx = ((rashiIndex % 12) + 12) % 12;
  return UTTAR_RASHI_INDICES.has(idx) ? "उ" : "द";
}

/** Infer उ/द from sankranti ingress dates (fallback only — sunrise-day approximation). */
export function ayanaMarkFromDate(
  dateAd: string,
  sankrantis: SankrantiBoundary[],
): "उ" | "द" | undefined {
  if (!dateAd || !sankrantis.length) return undefined;

  const sorted = [...sankrantis].sort((a, b) => a.local_date.localeCompare(b.local_date));
  let rashiIndex = sorted[0]!.to_rashi_index;

  for (const s of sorted) {
    if (s.local_date < dateAd) rashiIndex = s.to_rashi_index;
    else break;
  }

  return ayanaMarkFromRashiIndex(rashiIndex);
}
