/**
 * A small curated set of Stellarium's own deep-sky object images —
 * `nebulae/default/textures.json` in their repo lists 674; this is 25 of
 * the best-known (Andromeda, Orion, the Pleiades, …), copied under the
 * same credits their own catalogue carries, kept lean rather than shipping
 * the full ~130MB set.
 *
 * Each is a real astrophoto placed at its true sky coordinates and true
 * angular size — the thing that actually gives Stellarium's zoomed-in view
 * its detail, not a higher-resolution version of the whole-sky Milky Way
 * panorama. Sized in real degrees, so a small one (a planetary nebula) is
 * genuinely a speck at the default view and only reads as a photograph
 * once the lens has actually pulled in on it — no separate LOD gate is
 * needed, unlike Stellarium's own `minResolution` field, which this
 * catalogue keeps but does not currently use.
 */

export type Nebula = {
  /** Short id, e.g. "m31", "ngc7000". */
  id: string;
  /** File under `public/sky3d/nebulae/`. */
  file: string;
  ne: string;
  en: string;
  /** Messier/NGC designation, for the hint line. */
  catalog: string;
  /** Photographer/observatory credit, carried over from Stellarium's own catalogue. */
  credit: string;
  /** J2000 right ascension of the image centre, degrees. */
  ra: number;
  /** J2000 declination of the image centre, degrees. */
  dec: number;
  /** True angular width, degrees. */
  widthDeg: number;
  /** True angular height, degrees. */
  heightDeg: number;
};

export const NEBULAE: Nebula[] = [
  {
    id: "m1",
    file: "m1dumont.png",
    ne: "क्र्याब नेब्युला",
    en: "Crab Nebula",
    catalog: "M1",
    credit: "Stephane Dumont",
    ra: 83.6296,
    dec: 22.0181,
    widthDeg: 0.1572,
    heightDeg: 0.1452,
  },
  {
    id: "m101",
    file: "m101-vasey.png",
    ne: "पिनव्हील ग्यालेक्सी",
    en: "Pinwheel Galaxy",
    catalog: "M101",
    credit: "Plover Hill Observatory",
    ra: 210.8587,
    dec: 54.3661,
    widthDeg: 1.1913,
    heightDeg: 0.6889,
  },
  {
    id: "m104",
    file: "m104.png",
    ne: "सोम्ब्रेरो ग्यालेक्सी",
    en: "Sombrero Galaxy",
    catalog: "M104",
    credit: "Adam Block/Mount Lemmon SkyCenter/University of Arizona & Ngc1535, post-processing: Sun Shuwei",
    ra: 189.9968,
    dec: -11.6295,
    widthDeg: 0.2645,
    heightDeg: 0.2587,
  },
  {
    id: "m11",
    file: "m11.png",
    ne: "वाइल्ड डक क्लस्टर",
    en: "Wild Duck Cluster",
    catalog: "M11",
    credit: "Grasslands Observatory",
    ra: 282.784,
    dec: -6.2653,
    widthDeg: 0.2359,
    heightDeg: 0.2344,
  },
  {
    id: "m13",
    file: "m13.png",
    ne: "हर्क्युलिस क्लस्टर",
    en: "Hercules Cluster",
    catalog: "M13",
    credit: "Starhopper",
    ra: 250.4204,
    dec: 36.4604,
    widthDeg: 0.559,
    heightDeg: 0.4499,
  },
  {
    id: "m16",
    file: "m16.png",
    ne: "इगल नेब्युला",
    en: "Eagle Nebula",
    catalog: "M16",
    credit: "Sun Gang",
    ra: 274.7354,
    dec: -13.8064,
    widthDeg: 1.8681,
    heightDeg: 1.8152,
  },
  {
    id: "m17",
    file: "m17.png",
    ne: "ओमेगा नेब्युला",
    en: "Omega Nebula",
    catalog: "M17",
    credit: "Dylan O'Donnell",
    ra: 275.1968,
    dec: -16.1241,
    widthDeg: 0.9464,
    heightDeg: 0.9091,
  },
  {
    id: "m20",
    file: "m20.png",
    ne: "ट्राइफिड नेब्युला",
    en: "Trifid Nebula",
    catalog: "M20",
    credit: "Hewholooks",
    ra: 270.5993,
    dec: -22.9744,
    widthDeg: 0.6053,
    heightDeg: 0.5569,
  },
  {
    id: "m22",
    file: "m22.png",
    ne: "सजिटेरियस क्लस्टर",
    en: "Sagittarius Cluster",
    catalog: "M22",
    credit: "Hewholooks",
    ra: 279.1037,
    dec: -23.8983,
    widthDeg: 0.4806,
    heightDeg: 0.4413,
  },
  {
    id: "m27",
    file: "m27dumont.png",
    ne: "डम्बेल नेब्युला",
    en: "Dumbbell Nebula",
    catalog: "M27",
    credit: "Stephane Dumont",
    ra: 299.901,
    dec: 22.7216,
    widthDeg: 0.1541,
    heightDeg: 0.1426,
  },
  {
    id: "m31",
    file: "m31.png",
    ne: "एन्ड्रोमेडा ग्यालेक्सी",
    en: "Andromeda Galaxy",
    catalog: "M31",
    credit: "LEE ang HG731GZ",
    ra: 10.7069,
    dec: 41.1598,
    widthDeg: 3.9746,
    heightDeg: 2.9894,
  },
  {
    id: "m33",
    file: "m33.png",
    ne: "ट्राइएङ्गुलम ग्यालेक्सी",
    en: "Triangulum Galaxy",
    catalog: "M33",
    credit: "HG731GZ",
    ra: 23.4831,
    dec: 30.6601,
    widthDeg: 2.1129,
    heightDeg: 1.8169,
  },
  {
    id: "m4",
    file: "m4.png",
    ne: "एम४ क्लस्टर",
    en: "M4 Cluster",
    catalog: "M4",
    credit: "Starhopper",
    ra: 245.9053,
    dec: -26.5335,
    widthDeg: 0.8069,
    heightDeg: 0.7227,
  },
  {
    id: "m42",
    file: "m42.png",
    ne: "ओरायन नेब्युला",
    en: "Orion Nebula",
    catalog: "M42",
    credit: "HG731GZ",
    ra: 84.2727,
    dec: -5.726,
    widthDeg: 3.6144,
    heightDeg: 3.5894,
  },
  {
    id: "m45",
    file: "pleiades.png",
    ne: "प्लिएडिज",
    en: "Pleiades",
    catalog: "M45",
    credit: "HG731GZ",
    ra: 56.6601,
    dec: 24.1139,
    widthDeg: 2.3033,
    heightDeg: 2.1021,
  },
  {
    id: "m51",
    file: "m51-vasey.png",
    ne: "वर्लपुल ग्यालेक्सी",
    en: "Whirlpool Galaxy",
    catalog: "M51",
    credit: "Plover Hill Observatory",
    ra: 202.4836,
    dec: 47.2274,
    widthDeg: 0.669,
    heightDeg: 0.4542,
  },
  {
    id: "m57",
    file: "m57dumont.png",
    ne: "रिङ नेब्युला",
    en: "Ring Nebula",
    catalog: "M57",
    credit: "Stephane Dumont",
    ra: 283.3957,
    dec: 33.0281,
    widthDeg: 0.0736,
    heightDeg: 0.062,
  },
  {
    id: "m8",
    file: "m8.png",
    ne: "लगून नेब्युला",
    en: "Lagoon Nebula",
    catalog: "M8",
    credit: "Dylan O'Donnell",
    ra: 271.5359,
    dec: -24.0736,
    widthDeg: 2.8032,
    heightDeg: 2.5579,
  },
  {
    id: "m81",
    file: "m81.png",
    ne: "बोडेको ग्यालेक्सी",
    en: "Bode's Galaxy",
    catalog: "M81",
    credit: "Kees Scherer, post-processing: Sun Shuwei",
    ra: 148.9001,
    dec: 69.0644,
    widthDeg: 1.345,
    heightDeg: 0.477,
  },
  {
    id: "m83",
    file: "m83.png",
    ne: "दक्षिणी पिनव्हील ग्यालेक्सी",
    en: "Southern Pinwheel Galaxy",
    catalog: "M83",
    credit: "TRAPPIST/E. Jehin/ESO",
    ra: 204.2576,
    dec: -29.8705,
    widthDeg: 0.3732,
    heightDeg: 0.3235,
  },
  {
    id: "m97",
    file: "m97dumont.png",
    ne: "आउल नेब्युला",
    en: "Owl Nebula",
    catalog: "M97",
    credit: "Stephane Dumont",
    ra: 168.706,
    dec: 55.0193,
    widthDeg: 0.4395,
    heightDeg: 0.2519,
  },
  {
    id: "ngc3372",
    file: "etaCarinae.png",
    ne: "कारिना नेब्युला",
    en: "Carina Nebula",
    catalog: "NGC 3372",
    credit: "Harel Boren",
    ra: 160.9291,
    dec: -59.8211,
    widthDeg: 6.1699,
    heightDeg: 2.9893,
  },
  {
    id: "ngc6960",
    file: "n6960.png",
    ne: "भेल नेब्युला",
    en: "Veil Nebula",
    catalog: "NGC 6960",
    credit: "Jose A Mtanous",
    ra: 313.0254,
    dec: 30.6402,
    widthDeg: 5.7652,
    heightDeg: 4.9554,
  },
  {
    id: "ngc7000",
    file: "n7000.png",
    ne: "उत्तर अमेरिका नेब्युला",
    en: "North America Nebula",
    catalog: "NGC 7000",
    credit: "Adam Block/Steward Observatory/University of Arizona",
    ra: 314.0725,
    dec: 44.0165,
    widthDeg: 6.0819,
    heightDeg: 4.3642,
  },
  {
    id: "ngc7293",
    file: "n7293.png",
    ne: "हेलिक्स नेब्युला",
    en: "Helix Nebula",
    catalog: "NGC 7293",
    credit: "Dylan O'Donnell",
    ra: 337.4005,
    dec: -20.8332,
    widthDeg: 0.4966,
    heightDeg: 0.4634,
  },
];

/** `useLoader` needs a stable array of URLs, in the same order every render. */
export const NEBULA_SOURCES: string[] = NEBULAE.map(
  (n) => `${import.meta.env.BASE_URL}sky3d/nebulae/${n.file}`,
);

/* ── flattening ────────────────────────────────────────────────────────── */

import { equatorialToeclipticJ2000 } from "@/lib/sky3d/nakshatra-stars";

export type FlatNebula = {
  nebula: Nebula;
  /** Ecliptic longitude at J2000, degrees. */
  lon: number;
  /** Ecliptic latitude, degrees. */
  lat: number;
  /** True angular width, radians. */
  widthRad: number;
  /** True angular height, radians. */
  heightRad: number;
};

const DEG = Math.PI / 180;

/** {@link NEBULAE}, in the same order as {@link NEBULA_SOURCES}, pre-converted. */
export function flattenNebulae(): FlatNebula[] {
  return NEBULAE.map((nebula) => {
    const { lon, lat } = equatorialToeclipticJ2000(nebula.ra, nebula.dec);
    return { nebula, lon, lat, widthRad: nebula.widthDeg * DEG, heightRad: nebula.heightDeg * DEG };
  });
}
