import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AyanamshaSelector } from "@/components/kundali/AyanamshaSelector";
import {
  defaultMilanBirthState,
  MilanBirthPanel,
  type MilanBirthFormState,
} from "@/components/kundali/MilanBirthPanel";
import { KundaliMilanResult } from "@/components/kundali/KundaliMilanResult";
import { computeAshtakuta } from "@/lib/ashtakuta";
import type { AyanamshaMode } from "@/lib/ayanamsha";
import { buildAtTimeDatetime, fetchEphemerisPanchangaDay } from "@/lib/ephemeris-adapters";
import { ayanamshaLabel, buildMilanPersonInput, moonDataFromPanchanga } from "@/lib/kundali/milan-person";
import { getPanchangaDetail } from "@/lib/panchanga-format";
import { resolveJanmaNakshatra } from "@/lib/panchang-elements";
import { useLocale } from "@/i18n/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { locationCacheKey } from "@/lib/api";
import { resolveLocationTimezone } from "@/components/panchanga/use-panchanga-location";

const AYANAMSHA_KEY = "dhakalPatroAyanamshaMode";

function loadSavedAyanamshaMode(): AyanamshaMode {
  const saved = typeof localStorage !== "undefined" ? localStorage.getItem(AYANAMSHA_KEY) : null;
  const modes = ["nepal", "lahiri", "raman", "kp", "true_citra"] as const;
  return modes.includes(saved as AyanamshaMode) ? (saved as AyanamshaMode) : "lahiri";
}

function toAdStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatAdDateLong(d: Date, locale: string): string {
  return d.toLocaleDateString(locale.startsWith("en") ? "en-US" : "ne-NP", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDms(deg: number): string {
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  const hemi = deg >= 0 ? "N" : "S";
  return `${d}° ${String(m).padStart(2, "0")}′ ${String(s).padStart(2, "0")}″ ${hemi}`;
}

function formatLonDms(deg: number): string {
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  const hemi = deg >= 0 ? "E" : "W";
  return `${d}° ${String(m).padStart(2, "0")}′ ${String(s).padStart(2, "0")}″ ${hemi}`;
}

interface BirthDetailsTableProps {
  role: "boy" | "girl";
  name: string;
  form: MilanBirthFormState;
  panchanga?: Awaited<ReturnType<typeof fetchEphemerisPanchangaDay>>;
  ayanamsha: AyanamshaMode;
  lang: string;
}

function BirthDetailsTable({ role, name, form, panchanga, ayanamsha, lang }: BirthDetailsTableProps) {
  const { t } = useTranslation();
  const en = lang.startsWith("en");
  const moon = panchanga ? moonDataFromPanchanga(panchanga, ayanamsha) : null;
  const detail = panchanga ? getPanchangaDetail(panchanga) : undefined;
  const nak = panchanga
    ? resolveJanmaNakshatra(
        panchanga,
        detail?.nakshatra as { number?: number; name_ne?: string; pada?: number } | undefined,
        moon?.longitude,
      )
    : undefined;

  const lat = form.location.params.lat;
  const lon = form.location.params.lon;
  const tz = resolveLocationTimezone(form.location);

  const rows: { label: string; value: string }[] = [
    { label: t("milan.name"), value: name || "—" },
    {
      label: t("milan.date_of_birth"),
      value: formatAdDateLong(form.date, lang),
    },
    { label: t("milan.time_of_birth"), value: form.clock },
    { label: t("milan.city"), value: form.location.label.split(",")[0] ?? form.location.label },
    { label: t("milan.region"), value: form.location.label },
    { label: t("milan.country"), value: form.location.label.split(",").pop()?.trim() ?? "—" },
  ];

  if (lat != null) {
    rows.push({
      label: t("milan.latitude"),
      value: `${formatDms(lat)} (${lat.toFixed(4)})`,
    });
  }
  if (lon != null) {
    rows.push({
      label: t("milan.longitude"),
      value: `${formatLonDms(lon)} (${lon.toFixed(4)})`,
    });
  }
  rows.push({ label: t("milan.timezone"), value: tz });
  rows.push({
    label: t("milan.ayanamsha"),
    value: en ? `${ayanamshaLabel(ayanamsha, lang)} / Chitrapaksha` : `${ayanamshaLabel(ayanamsha, lang)} / चित्रपक्ष`,
  });

  if (moon) {
    rows.push({
      label: t("milan.moon_sign"),
      value: moon.rashiNe,
    });
  }
  if (nak) {
    rows.push({
      label: t("milan.nakshatra"),
      value: `${nak.ne} (${nak.index + 1}) · ${t("milan.pada")} ${nak.pada}`,
    });
  }
  if (moon) {
    rows.push({
      label: t("milan.lunar_longitude"),
      value: moon.longitude.toFixed(2),
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/20">
        <h3 className="text-sm font-semibold">
          {role === "boy" ? t("milan.vara_details") : t("milan.kanya_details")}
        </h3>
      </div>
      <Table>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.label}>
              <TableCell className="text-muted-foreground w-[40%]">{row.label}</TableCell>
              <TableCell className="font-medium">{row.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

export function KundaliMilan() {
  const { t } = useTranslation();
  const { lang } = useLocale();
  const [ayanamsha, setAyanamsha] = useState<AyanamshaMode>(loadSavedAyanamshaMode);
  const [boy, setBoy] = useState<MilanBirthFormState>(() => defaultMilanBirthState("Sushil"));
  const [girl, setGirl] = useState<MilanBirthFormState>(() => defaultMilanBirthState("Sheela"));
  const [submitted, setSubmitted] = useState(true);

  const boyAd = toAdStr(boy.date);
  const girlAd = toAdStr(girl.date);
  const boyDatetime = buildAtTimeDatetime(boyAd, boy.clock);
  const girlDatetime = buildAtTimeDatetime(girlAd, girl.clock);

  const boyQuery = useQuery({
    queryKey: [
      "milan",
      "panchanga",
      boyDatetime,
      locationCacheKey(boy.location.params),
      ayanamsha,
    ],
    queryFn: () =>
      fetchEphemerisPanchangaDay(boyDatetime, boyAd, boy.location.params, { ayanamsha }),
    enabled: submitted,
  });

  const girlQuery = useQuery({
    queryKey: [
      "milan",
      "panchanga",
      girlDatetime,
      locationCacheKey(girl.location.params),
      ayanamsha,
    ],
    queryFn: () =>
      fetchEphemerisPanchangaDay(girlDatetime, girlAd, girl.location.params, { ayanamsha }),
    enabled: submitted,
  });

  const result = useMemo(() => {
    if (!boyQuery.data || !girlQuery.data) return null;
    const boyPerson = buildMilanPersonInput(boy.name, boyQuery.data, ayanamsha);
    const girlPerson = buildMilanPersonInput(girl.name, girlQuery.data, ayanamsha);
    if (!boyPerson || !girlPerson) return null;
    return computeAshtakuta(boyPerson, girlPerson, lang);
  }, [boyQuery.data, girlQuery.data, boy.name, girl.name, ayanamsha, lang]);

  const loading = submitted && (boyQuery.isLoading || girlQuery.isLoading);
  const error = submitted && (boyQuery.isError || girlQuery.isError);

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-6 pb-16">
      <div className="mb-6 mt-2">
        <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
          {t("milan.eyebrow")}
        </div>
        <h1 className="text-[34px] font-bold leading-tight tracking-tight m-0 flex items-center gap-2.5">
          <Heart className="w-7 h-7 text-secondary shrink-0" />
          {t("milan.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{t("milan.subtitle")}</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <AyanamshaSelector mode={ayanamsha} onModeChange={setAyanamsha} />
        <Button
          onClick={() => {
            setSubmitted(true);
            void boyQuery.refetch();
            void girlQuery.refetch();
          }}
        >
          <Sparkles className="size-4" />
          {t("milan.match")}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <MilanBirthPanel role="boy" state={boy} onChange={setBoy} />
        <MilanBirthPanel role="girl" state={girl} onChange={setGirl} />
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-12 text-center text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-8 text-center text-sm text-destructive">
          {t("milan.error")}
        </div>
      ) : null}

      {submitted && !loading && !error && boyQuery.data && girlQuery.data ? (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <BirthDetailsTable
              role="boy"
              name={boy.name}
              form={boy}
              panchanga={boyQuery.data}
              ayanamsha={ayanamsha}
              lang={lang}
            />
            <BirthDetailsTable
              role="girl"
              name={girl.name}
              form={girl}
              panchanga={girlQuery.data}
              ayanamsha={ayanamsha}
              lang={lang}
            />
          </div>

          {result ? (
            <KundaliMilanResult
              boyName={boy.name}
              girlName={girl.name}
              result={result}
              lang={lang}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
              {t("milan.no_moon")}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
