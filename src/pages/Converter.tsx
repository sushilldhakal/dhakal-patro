import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, ArrowRight } from "lucide-react";
import {
  fetchAdToBs, fetchBsToAd,
  convertorKeys,
  type ConvertAdToBs, type ConvertBsToAd,
} from "../lib/api";
import { PageShell, PageHeader } from "../components/PageShell";
import { useRouteLoading } from "@/lib/route-loading";
import { StatCard } from "../components/StatCard";
import { cn } from "../lib/utils";

function todayAd() {
  return new Date().toISOString().split("T")[0];
}

export function Converter() {
  const [mode, setMode] = useState<"ad-to-bs" | "bs-to-ad">("ad-to-bs");
  const [adInput, setAdInput] = useState(todayAd());
  const [bsInput, setBsInput] = useState("2083-02-01");
  const [adDate, setAdDate] = useState(todayAd());
  const [bsDate, setBsDate] = useState("2083-02-01");

  const adToBsQ = useQuery({
    queryKey: convertorKeys.adToBs(adDate),
    queryFn: () => fetchAdToBs(adDate),
    enabled: mode === "ad-to-bs" && !!adDate,
    staleTime: Infinity,
  });

  const bsToAdQ = useQuery({
    queryKey: convertorKeys.bsToAd(bsDate),
    queryFn: () => fetchBsToAd(bsDate),
    enabled: mode === "bs-to-ad" && !!bsDate,
    staleTime: Infinity,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "ad-to-bs") setAdDate(adInput);
    else setBsDate(bsInput);
  }

  const adResult = adToBsQ.data as ConvertAdToBs | undefined;
  const bsResult = bsToAdQ.data as ConvertBsToAd | undefined;
  const loading = mode === "ad-to-bs" ? adToBsQ.isLoading : bsToAdQ.isLoading;
  const error = mode === "ad-to-bs" ? adToBsQ.isError : bsToAdQ.isError;

  useRouteLoading(loading);

  return (
    <PageShell>
      <PageHeader
        icon={<ArrowLeftRight className="w-6 h-6 text-secondary" />}
        title="Date Converter"
        subtitle="Convert between Bikram Sambat (BS) and Gregorian (AD) calendars"
      />

      {/* Mode toggle */}
      <div className="flex rounded-xl border border-border overflow-hidden w-fit">
        {(["ad-to-bs", "bs-to-ad"] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "px-5 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2",
              mode === m
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {m === "ad-to-bs" ? (
              <>AD <ArrowRight className="w-3.5 h-3.5" /> BS</>
            ) : (
              <>BS <ArrowRight className="w-3.5 h-3.5" /> AD</>
            )}
          </button>
        ))}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-3 flex-wrap">
        {mode === "ad-to-bs" ? (
          <div className="flex flex-col gap-1 flex-1 min-w-44">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              AD Date
            </label>
            <input
              type="date"
              value={adInput}
              onChange={e => setAdInput(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1 flex-1 min-w-44">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              BS Date (YYYY-MM-DD)
            </label>
            <input
              type="text"
              value={bsInput}
              onChange={e => setBsInput(e.target.value)}
              placeholder="2083-02-24"
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        )}
        <button
          type="submit"
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          Convert
        </button>
      </form>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-sm">
          Conversion failed. Please check the date format.
        </div>
      )}

      {/* AD → BS result */}
      {mode === "ad-to-bs" && adResult && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-2xl font-bold text-foreground">
            <span className="text-secondary">{adResult.ad_date}</span>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
            <span className="text-secondary">{adResult.bs_date}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <StatCard label="BS Date" value={adResult.bs_date} highlight />
            <StatCard label="BS Year" value={String(adResult.bs_year)} />
            <StatCard label="BS Month" value={`${adResult.bs_month_name_ne} (${adResult.bs_month_name})`} />
            <StatCard label="BS Day" value={String(adResult.bs_day)} />
            <StatCard label="AD Date" value={adResult.ad_date} />
            <StatCard label="Weekday" value={adResult.weekday} />
          </div>
        </div>
      )}

      {/* BS → AD result */}
      {mode === "bs-to-ad" && bsResult && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-2xl font-bold text-foreground">
            <span className="text-secondary">{bsResult.bs_date}</span>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
            <span className="text-secondary">{bsResult.ad_date}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <StatCard label="AD Date" value={bsResult.ad_date} highlight />
            <StatCard label="BS Date" value={bsResult.bs_date} />
            <StatCard label="BS Month" value={`${bsResult.bs_month_name_ne} (${bsResult.bs_month_name})`} />
            <StatCard label="BS Day" value={String(bsResult.bs_day)} />
            <StatCard label="BS Year" value={String(bsResult.bs_year)} />
            <StatCard label="Weekday" value={bsResult.weekday} />
          </div>
        </div>
      )}
    </PageShell>
  );
}
