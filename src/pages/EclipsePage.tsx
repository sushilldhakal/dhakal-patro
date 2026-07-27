import { Link, getRouteApi } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Eclipse, MoonStar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/PageShell";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import {
  GrahaBanner,
  GrahaDescription,
} from "@/components/graha/GrahaPageParts";
import { usePatroYearUrlBrowse } from "@/hooks/use-patro-url-browse";
import { PatroYearNav } from "@/components/patro-date";
import { useLocale } from "@/i18n/locale";
import { useRouteLoading } from "@/lib/route-loading";
import { patroCard } from "@/lib/patro-classes";
import { cn } from "@/lib/utils";
import { searchToLocation } from "@/lib/url-state";
import {
  fetchEclipseYear,
  grahaDetailKeys,
  type EclipseEvent,
} from "@/lib/api";

const suryaRouteApi = getRouteApi("/panchanga-shell/panchanga/surya-grahan");
const chandraRouteApi = getRouteApi("/panchanga-shell/panchanga/chandra-grahan");

function fmtTime(iso?: string | null): string | null {
  if (!iso) return null;
  const m = iso.match(/T(\d{2}:\d{2})/);
  return m ? m[1] : null;
}

function EclipseCard({ ev, pageId }: { ev: EclipseEvent; pageId: string }) {
  const { digits, lang } = useLocale();
  const { t } = useTranslation();
  const begin = fmtTime(ev.begin_local);
  const end = fmtTime(ev.end_local);
  const max = fmtTime(ev.max_local);
  const isLunar = pageId === "chandra-grahan";
  const typeLabel = lang === "en" ? ev.type_en : ev.type_ne;
  return (
    <div className={cn(patroCard, "flex flex-col")}>
      <div
        className={cn(
          "flex items-baseline justify-between gap-2 border-b border-border px-3.5 py-2.5",
          ev.visible ? "bg-success/[0.12]" : "bg-secondary/[0.09] dark:bg-secondary/20",
        )}
      >
        <span className="text-base font-bold text-foreground">{typeLabel}</span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold",
            ev.visible
              ? "bg-success/20 text-success"
              : "bg-foreground/10 text-muted-foreground",
          )}
        >
          {ev.visible
            ? t("graha_pages.eclipse.visible_nepal")
            : t("graha_pages.eclipse.not_visible_nepal")}
        </span>
      </div>
      <div className="flex flex-col gap-1.5 p-3.5 text-sm">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-muted-foreground">{t("graha_pages.eclipse.date")}</span>
          <span className="text-right font-semibold text-foreground">
            <span className="font-num tabular-nums">
              {ev.date_bs ? digits(ev.date_bs) : digits(ev.date_ad)}
            </span>
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-muted-foreground">{t("graha_pages.eclipse.maximum")}</span>
          <span className="font-num tabular-nums text-foreground">{max ? digits(max) : "—"}</span>
        </div>
        {ev.visible && begin ? (
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-muted-foreground">
              {isLunar
                ? t("graha_pages.eclipse.partial_begins")
                : t("graha_pages.eclipse.first_contact")}
            </span>
            <span className="font-num tabular-nums text-foreground">{digits(begin)}</span>
          </div>
        ) : null}
        {ev.visible && end ? (
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-muted-foreground">
              {isLunar
                ? t("graha_pages.eclipse.partial_ends")
                : t("graha_pages.eclipse.last_contact")}
            </span>
            <span className="font-num tabular-nums text-foreground">{digits(end)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EclipseView({ kind }: { kind: "solar" | "lunar" }) {
  const { t } = useTranslation();
  const routeApi = kind === "solar" ? suryaRouteApi : chandraRouteApi;
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const { location, setLocation } = usePanchangaLocation(searchToLocation(search));
  const yearBrowse = usePatroYearUrlBrowse(search, navigate, location, setLocation);
  const pageId = kind === "solar" ? "surya-grahan" : "chandra-grahan";

  const query = useQuery({
    queryKey: grahaDetailKeys.eclipse(kind, yearBrowse.browseYear, location.params, yearBrowse.era),
    queryFn: () => fetchEclipseYear(kind, yearBrowse.browseYear, location.params, yearBrowse.era),
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  useRouteLoading(query.isLoading && !query.data);

  const banner =
    kind === "solar"
      ? {
          icon: <Eclipse className="h-6 w-6 text-accent dark:text-secondary" />,
          titleKey: "graha_pages.eclipse_solar.title",
          blurbKey: "graha_pages.eclipse_solar.blurb",
        }
      : {
          icon: <MoonStar className="h-6 w-6 text-accent dark:text-secondary" />,
          titleKey: "graha_pages.eclipse_lunar.title",
          blurbKey: "graha_pages.eclipse_lunar.blurb",
        };

  const events = query.data?.events ?? [];

  return (
    <PageShell>
      <GrahaBanner
        icon={banner.icon}
        titleKey={banner.titleKey}
        blurbKey={banner.blurbKey}
      />

      <div className="space-y-3">
        <PatroYearNav
          calendarMode={yearBrowse.era}
          year={yearBrowse.browseYear}
          onYearChange={yearBrowse.setBrowseYear}
          currentYear={yearBrowse.currentBrowseYear}
          yearOptions={yearBrowse.yearOptions}
          location={location}
          onLocationChange={setLocation}
        />
      </div>

      {query.isLoading && !query.data ? (
        <p className="text-sm">{t("common.loading")}</p>
      ) : query.data ? (
        events.length ? (
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {events.map((ev, i) => (
              <EclipseCard key={i} ev={ev} pageId={pageId} />
            ))}
          </div>
        ) : (
          <p className={cn(patroCard, "mt-2 p-4 text-sm text-muted-foreground")}>
            {t("graha_pages.eclipse.no_eclipses_year")}
          </p>
        )
      ) : (
        <p className="text-sm text-danger">{t("common.load_error")}</p>
      )}

      <GrahaDescription pageId={pageId} />

      <p className="mt-6 text-sm">
        <Link to="/panchanga/details" className="text-primary underline">
          {t("element_page.all_elements")}
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
