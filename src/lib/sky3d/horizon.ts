/**
 * Local horizon frame — the sky as it actually stands over one place at one moment.
 *
 * The ecliptic (and with it the rashi belt) is only "flat" when you look at the
 * solar system from outside. From a spot on the Earth's surface it is a great
 * circle tipped by the observer's latitude and swung round by the hour, which is
 * why the lagna keeps changing while the grahas barely move. Everything here
 * exists to compute that tip.
 */

import { normalizeDeg } from "@/lib/sky3d/geocentric-model";
import { julianDay } from "@/lib/sky3d/orbital-model";

const RAD = Math.PI / 180;

/** Obliquity of the ecliptic, deg — the 23.44° tilt between ecliptic and equator. */
export function obliquity(dtDays: number): number {
  const T = dtDays / 36525;
  return 23.439291 - 0.0130042 * T - 1.64e-7 * T * T;
}

/** Greenwich mean sidereal time, deg. */
export function gmstDeg(date: Date): number {
  const jd = julianDay(date);
  const d = jd - 2451545.0;
  const T = d / 36525;
  return normalizeDeg(
    280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - (T * T * T) / 38710000,
  );
}

/** Local mean sidereal time, deg, for an east-positive longitude. */
export function lstDeg(date: Date, lonEast: number): number {
  return normalizeDeg(gmstDeg(date) + lonEast);
}

export type Equatorial = { ra: number; dec: number };

/** Tropical ecliptic (λ, β) → equatorial (α, δ), all deg. */
export function eclipticToEquatorial(lonDeg: number, latDeg: number, eps: number): Equatorial {
  const l = lonDeg * RAD;
  const b = latDeg * RAD;
  const e = eps * RAD;
  const sinDec = Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l);
  const dec = Math.asin(sinDec);
  const ra = Math.atan2(
    Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e),
    Math.cos(l),
  );
  return { ra: normalizeDeg(ra / RAD), dec: dec / RAD };
}

/** Equatorial (α, δ) → tropical ecliptic (λ, β), the inverse of the above. */
export function equatorialToecliptic(eq: Equatorial, eps: number) {
  const a = eq.ra * RAD;
  const d = eq.dec * RAD;
  const e = eps * RAD;
  const lat = Math.asin(Math.sin(d) * Math.cos(e) - Math.cos(d) * Math.sin(e) * Math.sin(a));
  const lon = Math.atan2(
    Math.sin(a) * Math.cos(e) + Math.tan(d) * Math.sin(e),
    Math.cos(a),
  );
  return { lon: normalizeDeg(lon / RAD), lat: lat / RAD };
}

export type AltAz = {
  /** Altitude above the horizon, deg. Negative means below it. */
  alt: number;
  /** Azimuth from north, increasing eastward, deg. */
  az: number;
};

/** Equatorial (α, δ) → local horizon (alt, az) for latitude `lat` at sidereal time `lst`. */
export function equatorialToAltAz(eq: Equatorial, lstDegrees: number, latDeg: number): AltAz {
  const H = (lstDegrees - eq.ra) * RAD;
  const dec = eq.dec * RAD;
  const lat = latDeg * RAD;

  const alt = Math.asin(
    Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H),
  );
  // atan2 form measured from south, then turned to a north-based bearing.
  const az = Math.atan2(
    Math.sin(H),
    Math.cos(H) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat),
  );
  return { alt: alt / RAD, az: normalizeDeg(az / RAD + 180) };
}

/** Tropical ecliptic straight to the local horizon — the composition used per frame. */
export function eclipticToAltAz(
  lonDeg: number,
  latDeg: number,
  eps: number,
  lstDegrees: number,
  observerLat: number,
): AltAz {
  return equatorialToAltAz(eclipticToEquatorial(lonDeg, latDeg, eps), lstDegrees, observerLat);
}

/**
 * Horizon direction → scene vector on a dome of `radius`.
 * Scene frame: +Y is the zenith, +X is east, −Z is north.
 */
export function altAzToVec3(alt: number, az: number, radius: number): [number, number, number] {
  const a = alt * RAD;
  const z = az * RAD;
  const cosAlt = Math.cos(a);
  return [radius * cosAlt * Math.sin(z), radius * Math.sin(a), -radius * cosAlt * Math.cos(z)];
}

export type Observer = { lat: number; lon: number };

/** Kathmandu — the app's reference place, and the fallback when a city carries no coordinates. */
export const KATHMANDU: Observer = { lat: 27.7172, lon: 85.324 };
