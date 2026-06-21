import { useMemo, type CSSProperties } from "react";
import { useQueries } from "@tanstack/react-query";
import { Sunrise, Sunset } from "lucide-react";
import {
  fetchMonthCalendar,
  panchangaKeys,
  type CalendarDay,
  type LocationParams,
} from "@/lib/api";
import { BS_MONTHS_NE, getBSMonthLength } from "@/lib/bs-calendar";
import { formatClockNepali, formatTimeShort, toNepaliDigits } from "@/lib/panchanga-format";

function parseTimeToMinutes(time?: string | null): number | null {
  if (!time) return null;
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function daylightMinutes(sunrise?: string, sunset?: string): number | null {
  const rise = parseTimeToMinutes(sunrise);
  const set = parseTimeToMinutes(sunset);
  if (rise == null || set == null) return null;
  return set - rise;
}

type SunCell = {
  sunrise?: string;
  sunset?: string;
  sunriseDisplay?: string;
  sunsetDisplay?: string;
  daylightMin: number | null;
};

function buildYearGrid(
  months: (CalendarDay[] | undefined)[],
): Map<string, SunCell> {
  const grid = new Map<string, SunCell>();

  months.forEach((days, monthIdx) => {
    if (!days) return;
    const month = monthIdx + 1;
    for (const d of days) {
      const sunrise = formatTimeShort(d.sunrise);
      const sunset = formatTimeShort(d.sunset);
      grid.set(`${month}-${d.day}`, {
        sunrise,
        sunset,
        sunriseDisplay: formatClockNepali(sunrise),
        sunsetDisplay: formatClockNepali(sunset),
        daylightMin: daylightMinutes(sunrise, sunset),
      });
    }
  });

  return grid;
}

function daylightStyle(minutes: number | null): CSSProperties | undefined {
  if (minutes == null) return undefined;
  const minDay = 600;
  const maxDay = 840;
  const t = Math.min(1, Math.max(0, (minutes - minDay) / (maxDay - minDay)));
  const alpha = 0.08 + t * 0.22;
  return {
    background: `color-mix(in srgb, var(--brand-yellow) ${Math.round(alpha * 100)}%, transparent)`,
  };
}

interface Props {
  bsYear: number;
  locationLabel: string;
  locationParams: LocationParams;
}

export function SunTimesYearGrid({ bsYear, locationLabel, locationParams }: Props) {
  const monthQueries = useQueries({
    queries: Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return {
        queryKey: panchangaKeys.month(bsYear, month, locationParams),
        queryFn: () => fetchMonthCalendar(bsYear, month, locationParams),
        staleTime: 1000 * 60 * 60,
      };
    }),
  });

  const isLoading = monthQueries.some((q) => q.isLoading);
  const isError = monthQueries.every((q) => q.isError);

  const grid = useMemo(() => {
    const monthDays = monthQueries.map((q) => q.data?.calendar);
    return buildYearGrid(monthDays);
  }, [monthQueries]);

  const maxDay = useMemo(() => {
    let max = 30;
    for (let m = 1; m <= 12; m += 1) {
      max = Math.max(max, getBSMonthLength(bsYear, m));
    }
    return max;
  }, [bsYear]);

  if (isError) {
    return (
      <div className="pn-sun-grid-wrap">
        <p className="pn-sun-grid-error">Could not load sunrise/sunset times for this location.</p>
      </div>
    );
  }

  return (
    <div className="pn-sun-grid-wrap">
      <div className="pn-sun-grid-head">
        <div className="pn-sun-grid-titles">
          <h3 className="pn-sun-grid-title">वार्षिक सूर्योदय / सूर्यास्त</h3>
          <span className="pn-sun-grid-sub">
            Yearly sunrise & sunset · {locationLabel} · वि.सं. {bsYear}
          </span>
        </div>
        <div className="pn-sun-grid-legend">
          <span className="pn-sun-grid-legend-item">
            <Sunrise size={13} strokeWidth={1.8} />
            सूर्योदय
          </span>
          <span className="pn-sun-grid-legend-item">
            <Sunset size={13} strokeWidth={1.8} />
            सूर्यास्त
          </span>
        </div>
      </div>

      <div className="pn-sun-grid-scroll">
        <table className="pn-sun-grid" aria-label={`Sunrise and sunset grid for BS year ${bsYear}`}>
          <thead>
            <tr>
              <th scope="col" className="pn-sun-grid-corner">
                दिन
              </th>
              {BS_MONTHS_NE.map((name) => (
                <th key={name} scope="col" className="pn-sun-grid-month">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxDay }, (_, rowIdx) => {
              const day = rowIdx + 1;
              return (
                <tr key={day}>
                  <th scope="row" className="pn-sun-grid-day">
                    {toNepaliDigits(day)}
                  </th>
                  {Array.from({ length: 12 }, (_, colIdx) => {
                    const month = colIdx + 1;
                    const monthLen = getBSMonthLength(bsYear, month);
                    if (day > monthLen) {
                      return <td key={month} className="pn-sun-grid-cell empty" aria-hidden />;
                    }

                    const cell = grid.get(`${month}-${day}`);
                    const title = cell?.sunrise && cell?.sunset
                      ? `${BS_MONTHS_NE[colIdx]} ${day}: ↑ ${cell.sunriseDisplay ?? cell.sunrise} ↓ ${cell.sunsetDisplay ?? cell.sunset}`
                      : undefined;

                    return (
                      <td
                        key={month}
                        className={`pn-sun-grid-cell${isLoading && !cell ? " loading" : ""}`}
                        style={daylightStyle(cell?.daylightMin ?? null)}
                        title={title}
                      >
                        {isLoading && !cell ? (
                          <span className="pn-sun-grid-skel" />
                        ) : cell?.sunrise || cell?.sunset ? (
                          <>
                            <span className="pn-sun-grid-rise">{cell.sunriseDisplay ?? "—"}</span>
                            <span className="pn-sun-grid-set">{cell.sunsetDisplay ?? "—"}</span>
                          </>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
