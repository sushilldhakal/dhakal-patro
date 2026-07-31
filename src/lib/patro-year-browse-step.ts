import { isDescendingEra, type Era } from "@/lib/era";

export function stepPatroBrowseYear(era: Era, year: number, direction: "prev" | "next"): number {
  const towardPast = direction === "prev";
  const delta = towardPast ? 1 : -1;
  const signed = isDescendingEra(era) ? delta : -delta;
  const next = year + signed;
  return next >= 1 ? next : year;
}
