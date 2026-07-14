import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CalendarHeart, ChevronLeft, ChevronRight, Info, ScrollText } from "lucide-react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { useLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import { patroCard } from "@/lib/patro-classes";
import { adToBS } from "@/lib/bs-calendar";
import { useRouteLoading } from "@/lib/route-loading";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { fetchSaitDetail, saitDetailKey, type SaitDetailDay } from "@/lib/api";

/** The strict śāstra rules applied, shown as the "how it is generated" section. */
const RULES: { ne: string; en: string }[] = [
  {
    ne: "महिना — विवाहका लागि शास्त्रसम्मत चन्द्रमास मात्र (मार्गशीर्ष, माघ, फाल्गुन, वैशाख, ज्येष्ठ, आषाढ); अधिकमास र चातुर्मास वर्जित।",
    en: "Month — only the śāstra vivāha lunar months (Mārgaśīrṣa, Māgha, Phālguna, Vaiśākha, Jyeṣṭha, Āṣāḍha); Adhik-māsa & Chaturmāsa barred.",
  },
  {
    ne: "तिथि — शुभ तिथि मात्र (२,३,५,७,१०,११,१३); रिक्ता (४,९,१४), अष्टमी, षष्ठी, अमावस्या, पूर्णिमा वर्जित।",
    en: "Tithi — only śubha tithis (2,3,5,7,10,11,13); rikta (4,9,14), Aṣṭamī, Ṣaṣṭhī, Amāvasyā, Pūrṇimā out.",
  },
  {
    ne: "नक्षत्र — शास्त्रीय विवाह नक्षत्र मात्र: रोहिणी, मृगशिरा, मघा, उत्तराफाल्गुनी, हस्त, स्वाती, अनुराधा, मूल, उत्तराषाढा, उत्तरभाद्रपदा, रेवती।",
    en: "Nakṣatra — the classical 11: Rohiṇī, Mṛgaśira, Maghā, U.Phalgunī, Hasta, Svātī, Anurādhā, Mūla, U.Aṣāḍhā, U.Bhādrapada, Revatī.",
  },
  {
    ne: "योग — नवै अशुभ योग (विष्कुम्भ, अतिगण्ड, शूल, गण्ड, व्याघात, वज्र, व्यतीपात, परिघ, वैधृति) वर्जित।",
    en: "Yoga — all nine aśubha yogas (Viṣkambha, Atigaṇḍa, Śūla, Gaṇḍa, Vyāghāta, Vajra, Vyatīpāta, Parigha, Vaidhṛti) barred.",
  },
  {
    ne: "करण — विष्टि (भद्रा) र चार स्थिर करण (शकुनि, चतुष्पाद, नाग, किंस्तुघ्न) वर्जित।",
    en: "Karaṇa — Viṣṭi (Bhadrā) and the four fixed karaṇas (Śakuni, Catuṣpāda, Nāga, Kiṃstughna) barred.",
  },
  {
    ne: "वार — मंगलबार र शनिबार वर्जित।",
    en: "Vāra — Tuesday and Saturday barred.",
  },
  {
    ne: "दोष — दग्धा, शून्य, भद्रा र मलेफिक लत्ता (सूर्य/मंगल/शनि/राहु/केतु) परेको दिन पूरै त्याज्य; गोधूलिले पनि छुट दिँदैन।",
    en: "Doṣa — Dagdha, Śūnya, Bhadrā, and malefic Latta (Sun/Mars/Saturn/Rāhu/Ketu) scrub the whole day; no Godhūli rescue.",
  },
  {
    ne: "ग्रह — गुरु र शुक्र अस्त हुनुहुँदैन; संक्रान्तिको सन्निकट समय र ग्रहण ±३ दिन वर्जित।",
    en: "Graha — Jupiter & Venus must be udaya (not combust); Sankrānti buffers and eclipse ±3 days excluded.",
  },
];

function DayCard({ d }: { d: SaitDetailDay }) {
  const { pick, digits } = useLocale();
  const overnight = d.window_end < d.window_start;
  const reason = pick(
    `${pick(d.weekday_ne, d.weekday_en)}, ${d.paksha_ne} ${d.tithi_ne}, ${d.nakshatra_ne} नक्षत्र र ${d.yoga_ne} योग — कुनै दोषविनाको शुद्ध विवाह लग्न।`,
    `${d.weekday_en}, ${d.paksha === "shukla" ? "Shukla" : "Krishna"} ${d.tithi_en}, ${d.nakshatra_en} nakṣatra & ${d.yoga_en} yoga — a clean vivāha window with no doṣa.`,
  );
  const rows: { label: string; value: string }[] = [
    { label: pick("तिथि", "Tithi"), value: `${d.paksha_ne} ${pick(d.tithi_ne, d.tithi_en)}` },
    { label: pick("नक्षत्र", "Nakṣatra"), value: pick(d.nakshatra_ne, d.nakshatra_en) },
    { label: pick("योग", "Yoga"), value: pick(d.yoga_ne, d.yoga_en) },
    { label: pick("करण", "Karaṇa"), value: pick(d.karana_ne, d.karana_en) },
    { label: pick("लग्न", "Lagna"), value: d.lagna_en },
    { label: pick("चन्द्रमास", "Lunar month"), value: pick(d.lunar_month_ne ?? "", d.lunar_month_en ?? "") },
  ];

  return (
    <div className={cn(patroCard, "flex flex-col gap-2.5 p-4")}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-base font-bold text-foreground">
          {pick(d.bs_month_name_ne, d.bs_month_name_ne)} {digits(d.bs_day)}
        </span>
        <span className="text-sm text-muted-foreground">
          {pick(d.weekday_ne, d.weekday_en)} · {d.gregorian}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="inline-flex items-center rounded-md bg-secondary/12 px-2 py-1 font-semibold text-secondary tabular-nums">
          {digits(d.window_start)} – {digits(d.window_end)}
          {overnight ? ` (${pick("भोलिपल्ट", "+1")})` : ""}
        </span>
        <span className="text-muted-foreground">{pick("शुभ लग्न विण्डो", "auspicious window")}</span>
      </div>

      <p className="text-sm leading-relaxed text-foreground">{reason}</p>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col">
            <dt className="text-xs text-muted-foreground">{r.label}</dt>
            <dd className="font-semibold text-foreground">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function MarriageSait() {
  const { pick, digits } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const todayBs = adToBS(new Date());
  const [year, setYear] = useState(todayBs.year);

  const detailQuery = useQuery({
    queryKey: saitDetailKey(year, "vivah", location.params),
    queryFn: () => fetchSaitDetail(year, "vivah", location.params),
    staleTime: 1000 * 60 * 60,
    placeholderData: keepPreviousData,
  });

  useRouteLoading(detailQuery.isLoading && !detailQuery.data);

  const days = detailQuery.data?.days ?? [];

  return (
    <PageShell>
      <PageHeader
        icon={<CalendarHeart className="h-6 w-6 text-secondary" />}
        title={pick("विवाह साइत", "Marriage Saait")}
        subtitle={pick(
          "शास्त्रअनुसार कडाइका साथ गणना गरिएका शुद्ध विवाह मुहूर्तहरू — समितिको सूचीलाई पछ्याइएको छैन।",
          "Strict, śāstra-derived vivāha muhūrtas — computed by the book, not tracking the committee list.",
        )}
      />

      {/* How the list is generated */}
      <div className={cn(patroCard, "flex flex-col gap-3 border-l-2 border-secondary p-4")}>
        <div className="flex items-center gap-2">
          <ScrollText className="size-4 shrink-0 text-secondary" />
          <h2 className="text-base font-bold text-foreground">
            {pick("यो सूची कसरी बन्छ", "How this list is generated")}
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-foreground">
          {pick(
            "प्रत्येक दिनको स्विस एफेमेरिसबाट सूर्योदयदेखि अर्को सूर्योदयसम्म हरेक अन्तरालमा तिथि, नक्षत्र, योग, करण, वार र लग्न गणना गरी तलका शास्त्रीय नियमहरू लगाइन्छ। कुनै एक शुद्ध लग्न विण्डो भेटिए मात्र दिन प्रकाशित हुन्छ।",
            "For each day the engine computes tithi, nakṣatra, yoga, karaṇa, vāra and lagna at every interval from sunrise to the next sunrise (Swiss Ephemeris), then applies the classical rules below. A day is published only if at least one clean lagna window survives.",
          )}
        </p>
        <ul className="flex flex-col gap-1.5">
          {RULES.map((r, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-secondary" aria-hidden />
              <span>{pick(r.ne, r.en)}</span>
            </li>
          ))}
        </ul>
        {detailQuery.data?.engine_version ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5" />
            {pick("मुहूर्त इन्जिन संस्करण", "Muhūrta engine")} {detailQuery.data.engine_version}
          </p>
        ) : null}
      </div>

      {/* Year + location */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5">
          <button type="button" onClick={() => setYear((y) => y - 1)} className="flex size-8 items-center justify-center rounded-md hover:bg-surface-hover" aria-label={pick("अघिल्लो वर्ष", "Previous year")}>
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-[6rem] text-center text-sm font-bold text-foreground">{pick(`वि.सं. ${digits(year)}`, `BS ${digits(year)}`)}</span>
          <button type="button" onClick={() => setYear((y) => y + 1)} className="flex size-8 items-center justify-center rounded-md hover:bg-surface-hover" aria-label={pick("अर्को वर्ष", "Next year")}>
            <ChevronRight size={18} />
          </button>
        </div>
        <LocationSelector
          compact
          location={location}
          onLocationChange={setLocation}
          className="ml-auto h-9 min-w-0 w-auto max-w-[12.5rem]"
        />
      </div>

      {detailQuery.isLoading && !detailQuery.data ? (
        <p className="text-sm">{pick("लोड हुँदै…", "Loading…")}</p>
      ) : days.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            {pick(
              `वि.सं. ${digits(year)} मा ${digits(days.length)} शुद्ध विवाह दिन।`,
              `${digits(days.length)} strict vivāha days in BS ${digits(year)}.`,
            )}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {days.map((d) => (
              <DayCard key={`${d.bs_month}-${d.bs_day}`} d={d} />
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm">{pick("यस वर्ष कुनै शुद्ध विवाह मुहूर्त छैन।", "No strict vivāha muhūrta this year.")}</p>
      )}

      <p className="text-sm">
        <Link to="/panchanga/details" className="text-primary underline">
          {pick("← सबै शुभ मुहूर्त", "← All ceremonies")}
        </Link>
      </p>
    </PageShell>
  );
}

export default MarriageSait;
