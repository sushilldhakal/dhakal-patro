import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useLocale } from "@/i18n/locale";
import { useRouteLoading } from "@/lib/route-loading";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { usePatroYearUrlBrowse } from "@/hooks/use-patro-url-browse";
import { searchToLocation } from "@/lib/url-state";
import { SaitCeremonyLayout } from "@/components/sait/SaitCeremonyLayout";
import { SaitProfilePicker } from "@/components/sait/SaitProfilePicker";
import { SuitabilityLegend } from "@/components/sait/sait-suitability";
import { SAIT_RULES_CONTENT } from "@/lib/sait-rules-content";
import {
  fetchSaitDetail,
  fetchSaitPersonalize,
  saitDetailKey,
  saitPersonalizeKey,
  type SaitSuitability,
} from "@/lib/api";
import type { Profile } from "@/lib/auth/client";
import { profileChartParams } from "@/lib/kundali/profile-chart";

const routeApi = getRouteApi("/vivah-sait");

export function MarriageSait() {
  const { pick, digits } = useLocale();
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const { location, setLocation } = usePanchangaLocation(searchToLocation(search));
  const yearBrowse = usePatroYearUrlBrowse(search, navigate, location, setLocation);
  const bsYear = yearBrowse.bsYear;
  const content = SAIT_RULES_CONTENT.vivah;

  const detailQuery = useQuery({
    queryKey: saitDetailKey(bsYear, "vivah", location.params),
    queryFn: () => fetchSaitDetail(bsYear, "vivah", location.params),
    staleTime: 1000 * 60 * 60,
    placeholderData: keepPreviousData,
  });

  useRouteLoading(detailQuery.isLoading && !detailQuery.data);

  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const birth = selectedProfile ? profileChartParams(selectedProfile) : null;
  const birthDatetime = birth ? `${birth.adDate}T${birth.clock}` : "";
  const birthTz = selectedProfile?.timezone ?? "Asia/Kathmandu";

  const personalizeQuery = useQuery({
    queryKey: saitPersonalizeKey(bsYear, "vivah", location.params, birthDatetime, birthTz),
    queryFn: () => fetchSaitPersonalize(bsYear, "vivah", location.params, birthDatetime, birthTz),
    enabled: Boolean(selectedProfile) && Boolean(birthDatetime),
    staleTime: 1000 * 60 * 60,
    placeholderData: keepPreviousData,
  });

  const suitabilityByDay = useMemo(() => {
    const map = new Map<string, SaitSuitability>();
    for (const d of personalizeQuery.data?.days ?? []) {
      map.set(`${d.bs_month}-${d.bs_day}`, d.suitability);
    }
    return map;
  }, [personalizeQuery.data]);

  const profileControl = (
    <>
      <SaitProfilePicker
        selectedId={selectedProfile?.id ?? null}
        onSelect={setSelectedProfile}
      />
      {selectedProfile && personalizeQuery.data ? (
        <SuitabilityLegend counts={personalizeQuery.data.counts} />
      ) : null}
    </>
  );

  return (
    <SaitCeremonyLayout
      title={pick("विवाह साइत", "Marriage Saait")}
      subtitle={pick(
        "शास्त्रअनुसार कडाइका साथ गणना गरिएका शुद्ध विवाह मुहूर्तहरू — समितिको सूचीलाई पछ्याइएको छैन।",
        "Strict, śāstra-derived vivāha muhūrtas — computed by the book, not tracking the committee list.",
      )}
      year={yearBrowse.browseYear}
      onYearChange={yearBrowse.setBrowseYear}
      calendarMode={yearBrowse.era}
      yearOptions={yearBrowse.yearOptions}
      currentYear={yearBrowse.currentBrowseYear}
      location={location}
      onLocationChange={setLocation}
      method={content.method}
      rules={content.rules}
      engineVersion={detailQuery.data?.engine_version}
      days={detailQuery.data?.days ?? []}
      profileControl={profileControl}
      suitabilityByDay={suitabilityByDay}
      loading={detailQuery.isLoading && !detailQuery.data}
      emptyLabel={{
        ne: "यस वर्ष कुनै शुद्ध विवाह मुहूर्त छैन।",
        en: "No strict vivāha muhūrta this year.",
      }}
      countLabel={(count, y) => ({
        ne: `वि.सं. ${digits(bsYear)} मा ${digits(count)} शुद्ध विवाह दिन`,
        en:
          yearBrowse.era === "ad"
            ? `${digits(count)} strict vivāha days in ${digits(y)}`
            : `${digits(count)} strict vivāha days in BS ${digits(y)}`,
      })}
    />
  );
}

export default MarriageSait;
