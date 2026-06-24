import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarRange, MapPin } from "lucide-react";
import { SunTimesYearGrid } from "@/components/SunTimesYearGrid";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import { usePanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import {
  BS_SUPPORTED_END_YEAR,
  BS_SUPPORTED_START_YEAR,
  getCurrentBs,
} from "@/lib/bs-calendar";
import { toNepaliDigits } from "@/lib/panchanga-format";

const BS_YEAR_OPTIONS = Array.from(
  { length: BS_SUPPORTED_END_YEAR - BS_SUPPORTED_START_YEAR + 1 },
  (_, i) => BS_SUPPORTED_START_YEAR + i,
);

export function SunTimesYear() {
  const { location, setLocation } = usePanchangaLocation();
  const [year, setYear] = useState(() => getCurrentBs().year);

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-7 py-6 pb-16 overflow-x-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4 mt-2">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            गृहपृष्ठमा फर्कनुहोस्
          </Link>
          <h1 className="text-[34px] font-bold leading-tight tracking-tight m-0">
            सूर्य क्रान्ति
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            Suryakranti · वार्षिक सूर्योदय–सूर्यास्त · वि.सं. {toNepaliDigits(year)}
            {" · "}
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {location.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto sm:justify-end">
          <select
            className="pn-select"
            value={year}
            aria-label="वि.सं. वर्ष"
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {BS_YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <LocationSelector
            compact
            className="shrink-0"
            location={location}
            onLocationChange={setLocation}
          />
        </div>
      </div>

      <div className="pn-suryakranti-ayana-note">
        <p className="pn-suryakranti-ayana-lead">
          प्रत्येक दिनको <strong>उ</strong> वा <strong>द</strong> सूर्योदयको बेला सूर्य कुन राशिमा
          छ भन्ने आधारमा तय हुन्छ — पूरै महिनाले होइन। वर्षमा दुई पटक सङ्क्रान्तिमा परिवर्तन
          हुन्छ (कर्कट र मकर)।
        </p>
        <div className="pn-suryakranti-ayana-table-wrap">
          <table className="pn-suryakranti-ayana-table">
            <thead>
              <tr>
                <th scope="col">अयन</th>
                <th scope="col">सूर्य राशि (उदयकाल)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="pn-sun-grid-ayana pn-sun-grid-ayana--north">उ</span>{" "}
                  उत्तरायण
                </td>
                <td>मकर, कुम्भ, मीन, मेष, वृष, मिथुन</td>
              </tr>
              <tr>
                <td>
                  <span className="pn-sun-grid-ayana pn-sun-grid-ayana--south">द</span>{" "}
                  दक्षिणायण
                </td>
                <td>कर्कट, सिंह, कन्या, तुला, वृश्चिक, धनु</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Link
          to="/panchanga/year"
          search={{ year }}
          className="pn-suryakranti-ayana-cta"
        >
          <CalendarRange className="w-4 h-4 shrink-0" />
          सूर्यको राशि यात्रा हेर्नुहोस् — वार्षिक पञ्चाङ्ग चक्र
        </Link>
      </div>

      <SunTimesYearGrid
        bsYear={year}
        locationLabel={location.label}
        locationParams={location.params}
        hideHeader
      />
    </div>
  );
}
