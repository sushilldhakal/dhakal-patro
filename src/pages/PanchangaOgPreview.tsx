import { useEffect } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { fetchPanchanga, panchangaKeys } from "@/lib/api";
import { searchToLocation } from "@/lib/url-state";
import { DayTimeline } from "@/components/panchanga/DayTimeline";
import { resolveTimeZone } from "@/lib/zoned-time";
import { useRouteLoading } from "@/lib/route-loading";
import { useLocale } from "@/i18n/locale";
import { BS_MONTH_NAMES, BS_MONTHS_NE, adToBS } from "@/lib/bs-calendar";

/**
 * Headless render target for the Open Graph share image. The backend points
 * Playwright at this route (fixed 1200-wide) and screenshots the #og-capture
 * element to produce the /og-image PNG for a shared /panchanga link. Not linked
 * anywhere and noindex — it exists purely to be screenshotted.
 */
const routeApi = getRouteApi("/panchanga/og-preview");

/** Default when the URL carries no location: Kathmandu (coords → no cities DB dependency). */
const KATHMANDU = {
  label: "Kathmandu",
  params: { lat: 27.7172, lon: 85.324, timezone: "Asia/Kathmandu" },
} as const;

const AD_MONTHS_NE = [
  "जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन",
  "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर",
];

function toAdStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseAdStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function PanchangaOgPreview() {
  const { pick, digits } = useLocale();
  const search = routeApi.useSearch();
  const location = searchToLocation(search) ?? KATHMANDU;
  const date = search.date ? parseAdStr(search.date) : new Date();
  const adDateStr = toAdStr(date);

  const q = useQuery({
    queryKey: panchangaKeys.day(adDateStr, "ad", location.params),
    queryFn: () => fetchPanchanga(adDateStr, "ad", location.params),
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });
  const p = q.data;
  const tz = resolveTimeZone(p?.location?.timezone, location.params.timezone);

  // Never show the full-page route-loading overlay on the capture target — the
  // chart shows its own inline skeleton until the data arrives.
  useRouteLoading(false);

  // Signal the screenshotter that fonts have loaded and the chart has painted.
  useEffect(() => {
    if (!p && !q.isError) return;
    let raf = 0;
    const mark = () => {
      document.getElementById("og-capture")?.setAttribute("data-og-ready", "1");
    };
    const fontsReady = (document as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready
      ?? Promise.resolve();
    void fontsReady.then(() => {
      raf = requestAnimationFrame(() => requestAnimationFrame(mark));
    });
    return () => cancelAnimationFrame(raf);
  }, [p, q.isError]);

  const placeLabel =
    ("place" in search && search.place) || location.label || p?.location?.name || "Kathmandu";

  const bs = adToBS(date);
  const bsLine = `${pick(BS_MONTHS_NE[bs.month - 1], BS_MONTH_NAMES[bs.month - 1])} ${digits(bs.day)}, ${digits(bs.year)}`;
  const adLine = `${digits(date.getDate())} ${AD_MONTHS_NE[date.getMonth()]} ${digits(date.getFullYear())}`;
  const weekday = typeof p?.weekday === "string" ? p.weekday : "";

  return (
    <div style={{ width: 1232, padding: 16, background: "#F7F3EA" }}>
      <div
        id="og-capture"
        style={{ width: 1200, background: "#F7F3EA", borderRadius: 16, padding: "18px 0 20px" }}
      >
        {/* Slim brand strip above the chart */}
        <div className="mb-3 flex items-end justify-between">
          <div className="flex items-baseline gap-3">
            <span className="text-[28px] font-extrabold tracking-tight text-[#0b565a]">
              वैदिक पात्रो
            </span>
            <span className="text-[18px] font-bold text-[#d97706]">{placeLabel}</span>
          </div>
          <div className="text-right leading-tight">
            <div className="text-[20px] font-bold text-[#202a2c]">
              {[weekday, adLine].filter(Boolean).join(" · ")}
            </div>
            <div className="text-[15px] text-[#6e7878]">{bsLine} · vedicpatro.com</div>
          </div>
        </div>

        <DayTimeline
          p={p}
          dateAd={adDateStr}
          isToday={false}
          timezone={tz}
          mode="Day-Night"
          showToggle={false}
          chartOnly
          showNeedle={Boolean("time" in search && search.time)}
          needleClock={"time" in search ? search.time : undefined}
        />
      </div>
    </div>
  );
}
