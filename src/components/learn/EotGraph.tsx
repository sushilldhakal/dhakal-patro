/**
 * The equation of time, drawn as a curve.
 *
 * Two effects add here, and the graph exists so they can be pulled apart by
 * hand. The **eccentricity** term is one hump per year — the planet runs fast
 * near perihelion and slow near aphelion. The **tilt** term is two humps per
 * year — the Sun's motion along the ecliptic projects onto the equator at a
 * changing rate, which is zero at the solstices and largest at the equinoxes.
 *
 * Set eccentricity to zero in the playground and one hump survives; set the
 * tilt to zero and the other does. On Earth's real values they combine into
 * the familiar lopsided double wave, which is the same shape as the long axis
 * of an analemma.
 *
 * Drawn by hand rather than by a chart library: the article's other diagrams
 * are inline SVG, and the whole curve is 240 points of arithmetic.
 */

import { useMemo } from "react";

import { bilingualText, useLocale } from "@/i18n/locale";
import { toNepaliDigits } from "@/lib/panchanga-format";
import { BS_MONTHS_NE, BS_MONTH_NAMES } from "@/lib/bs-calendar";
import { eotCurve, solarMonthStarts } from "@/lib/sky3d/day-mechanics";

const W = 520;
const H = 158;
const PAD = { l: 34, r: 8, t: 12, b: 26 };

const SOLAR = "#dddd00";

export interface EotGraphProps {
  eccentricity: number;
  /** Axial tilt in radians. */
  tilt: number;
  /** Day of the year currently on screen, for the marker. */
  dayOfYear: number;
  /** Total days in the sim's year, so the marker maps onto the 365-day curve. */
  daysPerYear: number;
}

export function EotGraph({ eccentricity, tilt, dayOfYear, daysPerYear }: EotGraphProps) {
  const { lang } = useLocale();
  const ne = lang !== "en";
  const num = (v: number | string) => (ne ? toNepaliDigits(String(v)) : String(v));

  const curve = useMemo(() => eotCurve(eccentricity, tilt), [eccentricity, tilt]);

  /**
   * Symmetric scale, floored at ±4 min.
   *
   * Without the floor, a circular upright orbit — where the answer is a
   * dead-flat zero — would rescale until numerical noise filled the frame and
   * looked like signal.
   */
  const peak = useMemo(() => {
    const m = curve.reduce((a, p) => Math.max(a, Math.abs(p.minutes)), 0);
    return Math.max(4, Math.ceil(m / 4) * 4);
  }, [curve]);

  const x = (day: number) => PAD.l + (day / 365) * (W - PAD.l - PAD.r);
  const y = (min: number) => {
    const h = H - PAD.t - PAD.b;
    return PAD.t + h / 2 - (min / peak) * (h / 2);
  };

  const path = useMemo(
    () => curve.map((p, i) => `${i ? "L" : "M"}${x(p.day).toFixed(1)} ${y(p.minutes).toFixed(1)}`).join(" "),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [curve, peak],
  );

  /* The sim's year may be any length; the curve is always a real 365. */
  const markerDay = ((dayOfYear / daysPerYear) * 365) % 365;
  const markerMin = curve[Math.round((markerDay / 365) * (curve.length - 1))]?.minutes ?? 0;

  const ticks = [peak, peak / 2, 0, -peak / 2, -peak];

  /* बिक्रम months, not Gregorian ones — and they are not evenly spaced, because
     a बिक्रम month is 30° of the Sun's travel rather than a fixed run of days.
     Their unevenness is the same eccentricity the curve is plotting. */
  const monthStarts = useMemo(() => solarMonthStarts(eccentricity), [eccentricity]);
  const monthNames = ne ? BS_MONTHS_NE : ([...BS_MONTH_NAMES] as string[]);
  const currentMonth = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < 12; i += 1) if (markerDay >= monthStarts[i]!) idx = i;
    return idx;
  }, [markerDay, monthStarts]);

  return (
    <figure className="m-0 w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label={bilingualText(
          lang,
          "समयको समीकरण — वर्षभरि साँचो सौर समय र माध्य सौर समयबीचको फरक",
          "The equation of time — true solar time minus mean solar time across a year",
        )}
      >
        {/* horizontal grid + minute labels */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={y(t)}
              y2={y(t)}
              stroke="currentColor"
              strokeOpacity={t === 0 ? 0.42 : 0.14}
              strokeWidth={t === 0 ? 1 : 0.6}
            />
            <text
              x={PAD.l - 5}
              y={y(t) + 3}
              textAnchor="end"
              className="fill-current text-[8px] tabular-nums opacity-55"
            >
              {num(t === 0 ? 0 : `${t > 0 ? "+" : "−"}${Math.abs(t)}`)}
            </text>
          </g>
        ))}

        {/* बिक्रम month boundaries, each one a सङ्क्रान्ति */}
        {monthStarts.map((d, i) => {
          const next = i === 11 ? 365 : monthStarts[i + 1]!;
          return (
            <g key={i}>
              <line
                x1={x(d)}
                x2={x(d)}
                y1={PAD.t}
                y2={H - PAD.b + 3}
                stroke="currentColor"
                strokeOpacity={i === 0 ? 0.34 : 0.14}
                strokeWidth={0.7}
              />
              <text
                x={x((d + next) / 2)}
                y={H - PAD.b + 12}
                textAnchor="middle"
                className="fill-current text-[7.5px]"
                style={{ opacity: i === currentMonth ? 0.95 : 0.45 }}
                fontWeight={i === currentMonth ? 700 : 400}
              >
                {monthNames[i]}
              </text>
            </g>
          );
        })}

        <path d={path} fill="none" stroke={SOLAR} strokeWidth={1.8} strokeLinejoin="round" />

        {/* where the sim is now */}
        <line
          x1={x(markerDay)}
          x2={x(markerDay)}
          y1={PAD.t}
          y2={H - PAD.b}
          stroke="currentColor"
          strokeOpacity={0.45}
          strokeWidth={0.9}
          strokeDasharray="3 3"
        />
        <circle cx={x(markerDay)} cy={y(markerMin)} r={3.6} fill={SOLAR} />

        <text
          x={W - PAD.r}
          y={PAD.t + 1}
          textAnchor="end"
          className="fill-current text-[9px] font-semibold tabular-nums"
          style={{ fill: SOLAR }}
        >
          {markerMin >= 0 ? "+" : "−"}
          {num(Math.abs(markerMin).toFixed(1))}{" "}
          {bilingualText(lang, "मिनेट", "min")}
        </text>
      </svg>
      <figcaption className="mt-1.5 text-[11px] leading-snug text-white/45">
        {bilingualText(
          lang,
          "घडीभन्दा घामको समय कति अगाडि/पछाडि छ। उत्केन्द्रता शून्य पार्नुहोस् — एउटा लहर बाँकी रहन्छ; अक्ष झुकाव शून्य पार्नुहोस् — अर्को।",
          "How far a sundial runs ahead of or behind a clock. Zero the eccentricity and one wave survives; zero the tilt and the other does.",
        )}
      </figcaption>
    </figure>
  );
}

export default EotGraph;
