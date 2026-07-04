import type { NavataraTone } from "@/lib/api";

export type { NavataraRow, NavataraTableBlock, NavataraTone } from "@/lib/api";

export function navataraSlotTone(tone: NavataraTone): "good" | "bad" | "neutral" {
  if (tone === "best" || tone === "good") return "good";
  if (tone === "bad" || tone === "worst") return "bad";
  return "neutral";
}
