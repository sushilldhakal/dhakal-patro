/** BS month hero art — 1 = बैशाख … 12 = चैत्र. */
import month1 from "@/assets/month/1.jpg";
import month2 from "@/assets/month/2.jpg";
import month3 from "@/assets/month/3.jpg";
import month4 from "@/assets/month/4.jpg";
import month5 from "@/assets/month/5.jpg";
import month6 from "@/assets/month/6.jpg";
import month7 from "@/assets/month/7.jpg";
import month8 from "@/assets/month/8.jpg";
import month9 from "@/assets/month/9.jpg";
import month10 from "@/assets/month/10.jpg";
import month11 from "@/assets/month/11.jpg";
import month12 from "@/assets/month/12.jpg";

const BS_MONTH_ART: Record<number, string> = {
  1: month1,
  2: month2,
  3: month3,
  4: month4,
  5: month5,
  6: month6,
  7: month7,
  8: month8,
  9: month9,
  10: month10,
  11: month11,
  12: month12,
};

export function bsMonthArtUrl(month: number): string {
  const m = Math.min(12, Math.max(1, Math.round(month)));
  return BS_MONTH_ART[m]!;
}
