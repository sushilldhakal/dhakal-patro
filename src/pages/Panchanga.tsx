import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { fetchPanchanga, panchangaKeys } from "@/lib/api";
import { BS_MONTHS_NE, adToBS } from "@/lib/bs-calendar";
import { getSunrise, getSunset, toNepaliDigits } from "@/lib/panchanga-format";
import { cn } from "@/lib/utils";
import { PanchangaDateNav, QuickDateStrip } from "@/components/panchanga/PanchangaDateNav";
import { GhatiClock } from "@/components/panchanga/GhatiClock";
import { PanchangaMonthGrid } from "@/components/panchanga/PanchangaMonthGrid";
import {
  DinVisheshSection,
  FestivalsSection,
  MuhurtaTimingsSection,
  PanchangCoreSection,
  PlanetsPanel,
  RashiSection,
  RituSection,
  SamvatSection,
  SunMoonSection,
} from "@/components/panchanga/PanchangaSections";

type ViewMode = "day" | "month";

function toAdStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function Panchanga() {
  const [date, setDate] = useState(() => new Date());
  const [view, setView] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("dhakalPatroPanchView");
    return saved === "month" ? "month" : "day";
  });

  const adDateStr = toAdStr(date);
  const bs = adToBS(date);
  const todayBs = adToBS(new Date());
  const isToday =
    bs.day === todayBs.day && bs.month === todayBs.month && bs.year === todayBs.year;

  const switchView = (v: ViewMode) => {
    setView(v);
    localStorage.setItem("dhakalPatroPanchView", v);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: panchangaKeys.day(adDateStr, "ad"),
    queryFn: () => fetchPanchanga(adDateStr, "ad"),
    staleTime: 1000 * 60 * 30,
  });

  const sunrise = data ? getSunrise(data) : undefined;
  const sunset = data ? getSunset(data) : undefined;

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-6 pb-16">
      {/* Page header */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4 mt-2">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
            नेपाली पात्रो · पञ्चाङ्ग
          </div>
          <h1 className="text-[34px] font-bold leading-tight tracking-tight m-0">
            {view === "month"
              ? `${BS_MONTHS_NE[bs.month - 1]} ${toNepaliDigits(bs.year)} — मासिक पञ्चाङ्ग`
              : isToday
                ? "आजको पञ्चाङ्ग"
                : "पञ्चाङ्ग विवरण"}
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            {view === "month"
              ? `${bs.monthName} ${bs.year}`
              : data?.display?.bs_ne ??
                `${BS_MONTHS_NE[bs.month - 1]} ${toNepaliDigits(bs.day)}, वि.सं. ${toNepaliDigits(bs.year)}`}
            {" · "}
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              काठमाडौं, नेपाल
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="inline-flex p-0.5 gap-0.5 border border-border rounded-lg bg-card"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "month"}
              className={cn(
                "h-[26px] px-3 rounded-[calc(var(--radius-lg)-2px)] border-0 text-[12.5px] font-semibold cursor-pointer transition-colors",
                view === "month"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              )}
              onClick={() => switchView("month")}
            >
              महिना
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "day"}
              className={cn(
                "h-[26px] px-3 rounded-[calc(var(--radius-lg)-2px)] border-0 text-[12.5px] font-semibold cursor-pointer transition-colors",
                view === "day"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              )}
              onClick={() => switchView("day")}
            >
              दिन
            </button>
          </div>
        </div>
      </div>

      {view === "month" ? (
        <div className="flex flex-col gap-4">
          <QuickDateStrip date={date} onDateChange={setDate} />
          <PanchangaMonthGrid
            date={date}
            onPickDay={(d) => {
              setDate(d);
              switchView("day");
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_330px] gap-5 items-start">
          <div className="flex flex-col gap-4 min-w-0">
            <PanchangaDateNav date={date} onDateChange={setDate} />
            <QuickDateStrip date={date} onDateChange={setDate} />

            {isLoading && (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            )}

            {isError && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 text-destructive p-4 text-sm">
                Could not load panchanga. Check the date or try again.
              </div>
            )}

            {data && !isLoading && (
              <>
                <SunMoonSection p={data} />
                <PanchangCoreSection p={data} />
                <SamvatSection p={data} />
                <RashiSection p={data} />
                <RituSection p={data} />
                <MuhurtaTimingsSection p={data} />
                <DinVisheshSection p={data} />
                <FestivalsSection p={data} />
              </>
            )}
          </div>

          <aside className="flex flex-col gap-4 xl:sticky xl:top-[76px]">
            <GhatiClock sunrise={sunrise} sunset={sunset} />
            {data && <PlanetsPanel p={data} />}
          </aside>
        </div>
      )}

      <p className="mt-7 text-[11.5px] text-muted-foreground text-center">
        पञ्चाङ्गका मानहरू Dhakal Patro API बाट · Panchanga values from live API
      </p>
    </div>
  );
}
