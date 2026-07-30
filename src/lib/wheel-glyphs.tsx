/**
 * राशि and नक्षत्र artwork for the panchanga wheel, inlined from
 * `src/assets/{rashi,nakshatras}`.
 *
 * These files are traced exports, not a tidy icon set: every one carries its own
 * non-square viewBox (352×302 for mesha, 734×712 for thula, 52×52 for ashwini),
 * a hardcoded `fill="#000000"` that would render invisible on the wheel's dark
 * plate, and — in ashwini's case — `default:`-prefixed element names. So each is
 * normalised once at module load and drawn through its own viewBox rather than
 * an assumed one, which is why this can't reuse `RashiGlyph` from
 * `components/learn/rashi-icons.tsx` (that one hardcodes a 0 0 100 100 source).
 */

import rashiDhanu from "@/assets/rashi/dhanu.svg?raw";
import rashiKanya from "@/assets/rashi/kanya.svg?raw";
import rashiKarkat from "@/assets/rashi/karkat.svg?raw";
import rashiKumbha from "@/assets/rashi/kumbha.svg?raw";
import rashiMakara from "@/assets/rashi/makara.svg?raw";
import rashiMeena from "@/assets/rashi/meena.svg?raw";
import rashiMesha from "@/assets/rashi/mesha.svg?raw";
import rashiMithuna from "@/assets/rashi/mithuna.svg?raw";
import rashiSimha from "@/assets/rashi/simha.svg?raw";
import rashiThula from "@/assets/rashi/thula.svg?raw";
import rashiVrishabha from "@/assets/rashi/vrishabha.svg?raw";
import rashiVrushika from "@/assets/rashi/vrushika.svg?raw";

import nakAnuradha from "@/assets/nakshatras/anuradha.svg?raw";
import nakArdra from "@/assets/nakshatras/ardra.svg?raw";
import nakAshlesha from "@/assets/nakshatras/ashlesha.svg?raw";
import nakAshwini from "@/assets/nakshatras/ashwini.svg?raw";
import nakBharani from "@/assets/nakshatras/bharani.svg?raw";
import nakChitra from "@/assets/nakshatras/chitra.svg?raw";
import nakDhanishta from "@/assets/nakshatras/dhanishta.svg?raw";
import nakHasta from "@/assets/nakshatras/hasta.svg?raw";
import nakJyeshta from "@/assets/nakshatras/jyeshta.svg?raw";
import nakKrittika from "@/assets/nakshatras/krittika.svg?raw";
import nakMagha from "@/assets/nakshatras/magha.svg?raw";
import nakMrigashira from "@/assets/nakshatras/mrigashira.svg?raw";
import nakMula from "@/assets/nakshatras/mula.svg?raw";
import nakPunarvasu from "@/assets/nakshatras/punarvasu.svg?raw";
import nakPurvabhadrapada from "@/assets/nakshatras/purvabhadrapada.svg?raw";
import nakPurvaphalguni from "@/assets/nakshatras/purvaphalguni.svg?raw";
import nakPurvashada from "@/assets/nakshatras/purvashada.svg?raw";
import nakPushya from "@/assets/nakshatras/pushya.svg?raw";
import nakRevati from "@/assets/nakshatras/revati.svg?raw";
import nakRohini from "@/assets/nakshatras/rohini.svg?raw";
import nakShatabisha from "@/assets/nakshatras/shatabisha.svg?raw";
import nakShravana from "@/assets/nakshatras/shravana.svg?raw";
import nakSwathi from "@/assets/nakshatras/swathi.svg?raw";
import nakUttarabhadrapada from "@/assets/nakshatras/uttarabhadrapada.svg?raw";
import nakUttaraphalguni from "@/assets/nakshatras/uttaraphalguni.svg?raw";
import nakUttarashada from "@/assets/nakshatras/uttarashada.svg?raw";
import nakVishakha from "@/assets/nakshatras/vishakha.svg?raw";

/** Inner markup of a glyph plus the viewBox it was authored against. */
export interface GlyphArt {
  inner: string;
  /** [minX, minY, width, height] */
  vb: readonly [number, number, number, number];
}

const DEFAULT_VB = [0, 0, 100, 100] as const;

function parseGlyph(raw: string): GlyphArt {
  const svgOpen = /<svg\b[^>]*>/i.exec(raw);
  const vbMatch = svgOpen && /viewBox\s*=\s*"([^"]+)"/i.exec(svgOpen[0]);
  const nums = vbMatch?.[1].trim().split(/[\s,]+/).map(Number).filter((n) => !Number.isNaN(n));
  const vb = nums && nums.length === 4 ? (nums as unknown as GlyphArt["vb"]) : DEFAULT_VB;

  let inner = raw
    // Drop the XML prolog, DOCTYPE and the outer <svg> wrapper — this markup is
    // spliced into the wheel's own <svg>, which owns the real viewBox.
    .replace(/^[\s\S]*?<svg\b[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "")
    // ashwini.svg names its elements `default:g` / `default:path`; the prefix is
    // bound to the SVG namespace, but innerHTML parsing keeps it as a literal
    // unknown tag name and nothing paints.
    .replace(/<(\/?)default:/g, "<$1")
    .replace(/\sxmlns:default\s*=\s*"[^"]*"/g, "")
    // Let the wrapping <g>'s fill through, so one glyph set works on both themes.
    .replace(/\sfill\s*=\s*"(#000000|#000|black)"/gi, "");

  inner = inner.trim();
  return { inner, vb };
}

/** मेष → मीन, matching `getWheelRashis()` / the `rashis.N` i18n keys. */
export const RASHI_GLYPHS: readonly GlyphArt[] = [
  rashiMesha,
  rashiVrishabha,
  rashiMithuna,
  rashiKarkat,
  rashiSimha,
  rashiKanya,
  rashiThula,
  rashiVrushika,
  rashiDhanu,
  rashiMakara,
  rashiKumbha,
  rashiMeena,
].map(parseGlyph);

/** अश्विनी → रेवती, matching `NAKSHATRA_ICONS` order. */
export const NAKSHATRA_GLYPHS: readonly GlyphArt[] = [
  nakAshwini,
  nakBharani,
  nakKrittika,
  nakRohini,
  nakMrigashira,
  nakArdra,
  nakPunarvasu,
  nakPushya,
  nakAshlesha,
  nakMagha,
  nakPurvaphalguni,
  nakUttaraphalguni,
  nakHasta,
  nakChitra,
  nakSwathi,
  nakVishakha,
  nakAnuradha,
  nakJyeshta,
  nakMula,
  nakPurvashada,
  nakUttarashada,
  nakShravana,
  nakDhanishta,
  nakShatabisha,
  nakPurvabhadrapada,
  nakUttarabhadrapada,
  nakRevati,
].map(parseGlyph);

/**
 * Draw a glyph centred on (cx, cy), scaled to fit a `size`-square box.
 *
 * Fitting on the longer side (contain) is what keeps a 734×712 glyph and a 52×52
 * one looking like the same size on the ring; fitting on width alone would let
 * the tall ones spill across their neighbours' arcs.
 */
export function WheelGlyph({
  art,
  size,
  cx,
  cy,
  className,
  opacity = 1,
  title,
}: {
  art: GlyphArt | undefined;
  size: number;
  cx: number;
  cy: number;
  className?: string;
  opacity?: number;
  title?: string;
}) {
  if (!art) return null;
  const [minX, minY, w, h] = art.vb;
  const scale = size / Math.max(w, h);
  const tx = cx - (minX + w / 2) * scale;
  const ty = cy - (minY + h / 2) * scale;
  return (
    <g
      transform={`translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})`}
      className={className}
      opacity={opacity}
      dangerouslySetInnerHTML={{
        __html: `${title ? `<title>${title}</title>` : ""}${art.inner}`,
      }}
    />
  );
}
