import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Eclipse, MoonStar } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import {
  GrahaBanner,
  GrahaDescription,
  GrahaYearHeader,
} from "@/components/graha/GrahaPageParts";
import { useLocale } from "@/i18n/locale";
import { getCurrentBs } from "@/lib/bs-calendar";
import { useRouteLoading } from "@/lib/route-loading";
import { patroCard } from "@/lib/patro-classes";
import { cn } from "@/lib/utils";
import {
  fetchEclipseYear,
  grahaDetailKeys,
  type EclipseEvent,
} from "@/lib/api";

function fmtTime(iso?: string | null): string | null {
  if (!iso) return null;
  const m = iso.match(/T(\d{2}:\d{2})/);
  return m ? m[1] : null;
}

function EclipseCard({ ev, pageId }: { ev: EclipseEvent; pageId: string }) {
  const { pick, digits } = useLocale();
  const begin = fmtTime(ev.begin_local);
  const end = fmtTime(ev.end_local);
  const max = fmtTime(ev.max_local);
  const isLunar = pageId === "chandra-grahan";
  return (
    <div className={cn(patroCard, "flex flex-col")}>
      <div
        className={cn(
          "flex items-baseline justify-between gap-2 border-b border-border px-3.5 py-2.5",
          ev.visible ? "bg-success/[0.12]" : "bg-secondary/[0.09] dark:bg-secondary/20",
        )}
      >
        <span className="text-base font-bold text-foreground">
          {pick(ev.type_ne, ev.type_en)}
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold",
            ev.visible
              ? "bg-success/20 text-success"
              : "bg-foreground/10 text-muted-foreground",
          )}
        >
          {ev.visible
            ? pick("नेपालबाट देखिने", "Visible in Nepal")
            : pick("नेपालबाट नदेखिने", "Not visible in Nepal")}
        </span>
      </div>
      <div className="flex flex-col gap-1.5 p-3.5 text-sm">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-muted-foreground">{pick("मिति", "Date")}</span>
          <span className="text-right font-semibold text-foreground">
            <span className="font-num tabular-nums">
              {ev.date_bs ? digits(ev.date_bs) : digits(ev.date_ad)}
            </span>
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-muted-foreground">{pick("मध्य (चरम)", "Maximum")}</span>
          <span className="font-num tabular-nums text-foreground">{max ? digits(max) : "—"}</span>
        </div>
        {ev.visible && begin ? (
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-muted-foreground">
              {isLunar ? pick("आंशिक आरम्भ", "Partial begins") : pick("स्पर्श (आरम्भ)", "First contact")}
            </span>
            <span className="font-num tabular-nums text-foreground">{digits(begin)}</span>
          </div>
        ) : null}
        {ev.visible && end ? (
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-muted-foreground">
              {isLunar ? pick("आंशिक अन्त्य", "Partial ends") : pick("मोक्ष (अन्त्य)", "Last contact")}
            </span>
            <span className="font-num tabular-nums text-foreground">{digits(end)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EclipseView({ kind }: { kind: "solar" | "lunar" }) {
  const { pick } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const currentBs = getCurrentBs();
  const [year, setYear] = useState(currentBs.year);
  const pageId = kind === "solar" ? "surya-grahan" : "chandra-grahan";

  const query = useQuery({
    queryKey: grahaDetailKeys.eclipse(kind, year, location.params),
    queryFn: () => fetchEclipseYear(kind, year, location.params),
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  useRouteLoading(query.isLoading && !query.data);

  const banner =
    kind === "solar"
      ? {
          icon: <Eclipse className="h-6 w-6 text-accent dark:text-secondary" />,
          ne: "सूर्य ग्रहण",
          en: "Solar eclipse",
          blurbNe: "वर्षभरका सूर्य ग्रहण र नेपालबाट देखिने अवस्था",
          blurbEn: "The year's solar eclipses and visibility from Nepal",
        }
      : {
          icon: <MoonStar className="h-6 w-6 text-accent dark:text-secondary" />,
          ne: "चन्द्र ग्रहण",
          en: "Lunar eclipse",
          blurbNe: "वर्षभरका चन्द्र ग्रहण र नेपालबाट देखिने अवस्था",
          blurbEn: "The year's lunar eclipses and visibility from Nepal",
        };

  const events = query.data?.events ?? [];

  return (
    <PageShell>
      <GrahaBanner
        icon={banner.icon}
        ne={banner.ne}
        en={banner.en}
        blurbNe={banner.blurbNe}
        blurbEn={banner.blurbEn}
      />

      <div className="space-y-3">
        <GrahaYearHeader
          year={year}
          onYearChange={setYear}
          currentYear={currentBs.year}
          location={location}
          onLocationChange={setLocation}
        />
      </div>

      {query.isLoading && !query.data ? (
        <p className="text-sm">{pick("लोड हुँदै…", "Loading…")}</p>
      ) : query.data ? (
        events.length ? (
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {events.map((ev, i) => (
              <EclipseCard key={i} ev={ev} pageId={pageId} />
            ))}
          </div>
        ) : (
          <p className={cn(patroCard, "mt-2 p-4 text-sm text-muted-foreground")}>
            {pick(
              "यस वर्ष कुनै ग्रहण छैन।",
              "There are no eclipses of this kind this year.",
            )}
          </p>
        )
      ) : (
        <p className="text-sm text-danger">{pick("लोड गर्न सकिएन।", "Could not load.")}</p>
      )}

      <GrahaDescription pageId={pageId} />

      <p className="mt-6 text-sm">
        <Link to="/panchanga/details" className="text-primary underline">
          {pick("← सबै पञ्चाङ्ग तत्त्वहरू", "← All panchanga elements")}
        </Link>
      </p>
    </PageShell>
  );
}

export function SuryaGrahan() {
  return <EclipseView kind="solar" />;
}

export function ChandraGrahan() {
  return <EclipseView kind="lunar" />;
}

export default SuryaGrahan;
