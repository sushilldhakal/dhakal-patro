import { Link, getRouteApi } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Orbit } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { PatroDayTimeNav } from "@/components/patro-date";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { GrahaBanner, GrahaDescription } from "@/components/graha/GrahaPageParts";
import { useCalendarEra } from "@/hooks/use-calendar-era";
import { usePatroDayUrlBrowse } from "@/hooks/use-patro-url-browse";
import { useLocale } from "@/i18n/locale";
import { useRouteLoading } from "@/lib/route-loading";
import { toAdStr } from "@/lib/patro-day";
import {
  grahaSthitiLord,
  grahaSthitiNakshatra,
  grahaSthitiName,
  grahaSthitiRekhamsha,
  grahaSthitiShara,
  grahaSthitiSubLord,
} from "@/lib/graha-sthiti-display";
import { searchToLocation } from "@/lib/url-state";
import { patroDataTableWrap } from "@/lib/patro-classes";
import { cn } from "@/lib/utils";
import {
  fetchGrahaSthiti,
  grahaDetailKeys,
  type GrahaSthitiRow,
} from "@/lib/api";

const routeApi = getRouteApi("/panchanga-shell/panchanga/graha-sthiti");

function signed(value: number, digits: (v: number | string) => string): string {
  const s = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${s}${digits(Math.abs(value).toFixed(2))}`;
}

const COLS: { ne: string; en: string }[] = [
  { ne: "ग्रह", en: "Graha" },
  { ne: "रेखांश", en: "Longitude" },
  { ne: "नक्षत्र / पद", en: "Nakshatra / Pada" },
  { ne: "स्वामी / उप स्वामी", en: "Lord / Sub-lord" },
  { ne: "पूर्ण डिग्री", en: "Full degree" },
  { ne: "अक्षांश / शर", en: "Latitude" },
  { ne: "गति °/दिन", en: "Speed °/day" },
  { ne: "विषुवांश", en: "R.A." },
  { ne: "क्रान्ति", en: "Decl." },
];

function GrahaRow({ row }: { row: GrahaSthitiRow }) {
  const { pick, digits, lang } = useLocale();
  const isLagna = row.graha === "lagna";
  return (
    <tr className={cn("border-t border-border", isLagna && "bg-secondary/[0.06]")}>
      <td className="whitespace-nowrap px-3 py-2 font-bold text-foreground">
        <span className="mr-1 text-muted-foreground">{row.symbol}</span>
        {grahaSthitiName(row, lang)}
        {row.is_retrograde ? (
          <span className="ml-1 text-danger" title={pick("वक्री", "Retrograde")}>
            ↺
          </span>
        ) : null}
        {row.is_combust ? (
          <span className="ml-1" title={pick("अस्त", "Combust")}>
            🔥
          </span>
        ) : null}
      </td>
      <td className="whitespace-nowrap px-3 py-2 font-num tabular-nums text-foreground">
        {lang === "en" ? grahaSthitiRekhamsha(row, lang) : digits(grahaSthitiRekhamsha(row, lang))}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-foreground">
        {grahaSthitiNakshatra(row, lang)}
        <span className="text-muted-foreground"> · {digits(row.pada)}</span>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-foreground">
        {grahaSthitiLord(row, lang)}
        <span className="text-muted-foreground"> / {grahaSthitiSubLord(row, lang)}</span>
      </td>
      <td className="whitespace-nowrap px-3 py-2 font-num tabular-nums text-foreground">
        {digits(row.full_degree.toFixed(2))}
      </td>
      <td className="whitespace-nowrap px-3 py-2 font-num tabular-nums text-foreground">
        {lang === "en" ? grahaSthitiShara(row, lang) : digits(grahaSthitiShara(row, lang))}
      </td>
      <td
        className={cn(
          "whitespace-nowrap px-3 py-2 font-num tabular-nums",
          row.is_retrograde ? "text-danger" : "text-foreground",
        )}
      >
        {signed(row.speed_deg_day, digits)}
      </td>
      <td className="whitespace-nowrap px-3 py-2 font-num tabular-nums text-foreground">
        {digits(row.right_ascension.toFixed(2))}
      </td>
      <td className="whitespace-nowrap px-3 py-2 font-num tabular-nums text-foreground">
        {signed(row.declination, digits)}
      </td>
    </tr>
  );
}

export function GrahaSthiti() {
  const { pick } = useLocale();
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const { location, setLocation } = usePanchangaLocation(searchToLocation(search));
  const langEra = useCalendarEra();
  const dayBrowse = usePatroDayUrlBrowse(search, navigate, location, setLocation);
  const todayAd = toAdStr(new Date());
  const dayAd = dayBrowse.dateAd;

  const query = useQuery({
    queryKey: grahaDetailKeys.sthiti(dayAd, location.params),
    queryFn: () => fetchGrahaSthiti(dayAd, location.params),
    staleTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  useRouteLoading(query.isLoading && !query.data);

  return (
    <PageShell>
      <GrahaBanner
        icon={<Orbit className="h-6 w-6 text-accent dark:text-secondary" />}
        ne="ग्रह स्थिति"
        en="Planetary positions"
        blurbNe="नौ ग्रह र लग्नको दैनिक स्पष्ट स्थिति"
        blurbEn="Daily sphuta of the nine grahas and the ascendant"
      />

      <div className="space-y-3">
        <PatroDayTimeNav
          calendarMode={langEra}
          date={dayBrowse.date}
          onDateChange={dayBrowse.setDate}
          todayAd={todayAd}
          location={location}
          onLocationChange={setLocation}
        />
      </div>

      {query.isLoading && !query.data ? (
        <p className="text-sm">{pick("लोड हुँदै…", "Loading…")}</p>
      ) : query.data ? (
        <div className={cn(patroDataTableWrap, "mt-2")}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-secondary/[0.09] text-left dark:bg-secondary/20">
                {COLS.map((c) => (
                  <th
                    key={c.en}
                    className="whitespace-nowrap px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground"
                  >
                    {pick(c.ne, c.en)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {query.data.rows.map((row) => (
                <GrahaRow key={row.graha} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-danger">{pick("लोड गर्न सकिएन।", "Could not load.")}</p>
      )}

      <p className="mt-2 text-sm text-muted-foreground">
        {pick(
          "↺ = वक्री (retrograde) · 🔥 = अस्त (combust)। स्थिति सूर्योदयको क्षणमा गणना गरिएको।",
          "↺ = retrograde · 🔥 = combust. Positions are computed at local sunrise.",
        )}
      </p>

      <GrahaDescription pageId="graha-sthiti" />

      <p className="mt-6 text-sm">
        <Link to="/panchanga/details" className="text-primary underline">
          {pick("← सबै पञ्चाङ्ग तत्त्वहरू", "← All panchanga elements")}
        </Link>
      </p>
    </PageShell>
  );
}

export default GrahaSthiti;
