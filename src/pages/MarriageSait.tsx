import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useLocale } from "@/i18n/locale";
import { adToBS } from "@/lib/bs-calendar";
import { useRouteLoading } from "@/lib/route-loading";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { SaitCeremonyLayout } from "@/components/sait/SaitCeremonyLayout";
import { SAIT_RULES_CONTENT } from "@/lib/sait-rules-content";
import { fetchSaitDetail, saitDetailKey } from "@/lib/api";

export function MarriageSait() {
  const { pick, digits } = useLocale();
  const { location, setLocation } = usePanchangaLocation();
  const todayBs = adToBS(new Date());
  const [year, setYear] = useState(todayBs.year);
  const content = SAIT_RULES_CONTENT.vivah;

  const detailQuery = useQuery({
    queryKey: saitDetailKey(year, "vivah", location.params),
    queryFn: () => fetchSaitDetail(year, "vivah", location.params),
    staleTime: 1000 * 60 * 60,
    placeholderData: keepPreviousData,
  });

  useRouteLoading(detailQuery.isLoading && !detailQuery.data);

  return (
    <SaitCeremonyLayout
      title={pick("विवाह साइत", "Marriage Saait")}
      subtitle={pick(
        "शास्त्रअनुसार कडाइका साथ गणना गरिएका शुद्ध विवाह मुहूर्तहरू — समितिको सूचीलाई पछ्याइएको छैन।",
        "Strict, śāstra-derived vivāha muhūrtas — computed by the book, not tracking the committee list.",
      )}
      year={year}
      onYearChange={setYear}
      location={location}
      onLocationChange={setLocation}
      method={content.method}
      rules={content.rules}
      engineVersion={detailQuery.data?.engine_version}
      days={detailQuery.data?.days ?? []}
      loading={detailQuery.isLoading && !detailQuery.data}
      emptyLabel={{
        ne: "यस वर्ष कुनै शुद्ध विवाह मुहूर्त छैन।",
        en: "No strict vivāha muhūrta this year.",
      }}
      countLabel={(count, y) => ({
        ne: `वि.सं. ${digits(y)} मा ${digits(count)} शुद्ध विवाह दिन`,
        en: `${digits(count)} strict vivāha days in BS ${digits(y)}`,
      })}
    />
  );
}

export default MarriageSait;
