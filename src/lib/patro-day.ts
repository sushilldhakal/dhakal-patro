/** AD date string helpers shared by day-browse patro pages. */
export function toAdStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  // Match Python `date.isoformat()` / `fromisoformat()` (e.g. BS 250 → 0193-03-20).
  return `${String(y).padStart(4, "0")}-${m}-${day}`;
}

/** Parse "YYYY-MM-DD" in local time (no UTC shift). */
export function parseAdStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}
