import { houseRashi, rashiToHouse } from "@/lib/bhava";
import {
  grahaDignity,
  rashiLordKey,
  type GrahaKey,
} from "@/lib/graha-details";
import { navamsaRashiFromLongitude } from "@/lib/navamsa";

/**
 * Classical kundali yogas detected from D1 placements (whole-sign houses).
 * Where a yoga has several textual variants the most common software rule
 * is used; each row carries its rule in the description.
 */

export type YogaNature = "auspicious" | "inauspicious";

export interface KundaliYogaResult {
  key: string;
  nameEn: string;
  nameNe: string;
  nature: YogaNature;
  present: boolean;
  descEn: string;
  descNe: string;
}

export interface YogaChartInput {
  /** Lagna rashi 1–12. */
  lagnaRashi: number;
  /** Sidereal longitudes keyed by graha. */
  planetLongitudes: Partial<Record<GrahaKey, number>>;
  /** Birth between sunrise and sunset (for Mahabhagya). */
  isDayBirth?: boolean;
  /** Gulika longitude (for Vanchana Chora Bheeti). */
  gulikaLongitude?: number;
}

const SEVEN: GrahaKey[] = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];
const NON_LUMINARY: GrahaKey[] = ["mars", "mercury", "jupiter", "venus", "saturn"];
const BENEFICS: GrahaKey[] = ["mercury", "jupiter", "venus"];
const MALEFICS: GrahaKey[] = ["sun", "mars", "saturn", "rahu", "ketu"];
const KENDRA = [1, 4, 7, 10];
const UPACHAYA = [3, 6, 10, 11];

function rashiOf(lon: number): number {
  return Math.floor((((lon % 360) + 360) % 360) / 30) + 1;
}

/** House 1–12 of rashi `target` counted from rashi `base`. */
function countFrom(base: number, target: number): number {
  return rashiToHouse(target, base);
}

function isStrongDignity(graha: GrahaKey, rashi: number): boolean {
  const d = grahaDignity(graha, rashi);
  return d === "exalted" || d === "moolatrikona" || d === "own";
}

export function computeKundaliYogas(input: YogaChartInput): KundaliYogaResult[] {
  const { lagnaRashi, planetLongitudes, isDayBirth, gulikaLongitude } = input;

  const lon = (g: GrahaKey) => planetLongitudes[g];
  const rashi = (g: GrahaKey): number | undefined => {
    const l = lon(g);
    return l != null ? rashiOf(l) : undefined;
  };
  const house = (g: GrahaKey): number | undefined => {
    const r = rashi(g);
    return r != null ? countFrom(lagnaRashi, r) : undefined;
  };
  const lordOfHouse = (n: number): GrahaKey => rashiLordKey(houseRashi(lagnaRashi, n));

  const moonRashi = rashi("moon");
  const sunRashi = rashi("sun");
  const fromMoon = (g: GrahaKey): number | undefined => {
    const r = rashi(g);
    return moonRashi != null && r != null ? countFrom(moonRashi, r) : undefined;
  };
  const fromSun = (g: GrahaKey): number | undefined => {
    const r = rashi(g);
    return sunRashi != null && r != null ? countFrom(sunRashi, r) : undefined;
  };

  const sevenHouses = SEVEN.map(house).filter((h): h is number => h != null);
  const allSevenKnown = sevenHouses.length === SEVEN.length;

  const mutualKendra = (a: GrahaKey, b: GrahaKey): boolean => {
    const ra = rashi(a);
    const rb = rashi(b);
    return ra != null && rb != null && KENDRA.includes(countFrom(ra, rb));
  };

  /** Mahapurusha: graha exalted/own/moolatrikona in a kendra from lagna. */
  const mahapurusha = (g: GrahaKey): boolean => {
    const h = house(g);
    const r = rashi(g);
    return h != null && r != null && KENDRA.includes(h) && isStrongDignity(g, r);
  };

  const beneficsInUpachayaFrom = (base: number | undefined): boolean =>
    base != null &&
    BENEFICS.every((g) => {
      const r = rashi(g);
      return r != null && UPACHAYA.includes(countFrom(base, r));
    });

  // ── individual rules, in display order ────────────────────────────────────

  const marsHouse = house("mars");
  const mangalaDosha = marsHouse != null && [1, 4, 7, 8, 12].includes(marsHouse);

  let kalaSarpa = false;
  const rahuLon = lon("rahu");
  const ketuLon = lon("ketu");
  if (rahuLon != null && ketuLon != null && allSevenKnown) {
    const inArc = (l: number, from: number, to: number) =>
      (((l - from) % 360) + 360) % 360 < (((to - from) % 360) + 360) % 360;
    const sides = SEVEN.map((g) => inArc(lon(g)!, rahuLon, ketuLon));
    kalaSarpa = sides.every(Boolean) || sides.every((s) => !s);
  }

  const lagnaMallika =
    allSevenKnown && new Set(sevenHouses).size === 7 && sevenHouses.every((h) => h <= 7);

  const jupFromMoon = fromMoon("jupiter");
  const gajakesari = jupFromMoon != null && KENDRA.includes(jupFromMoon);

  const secondFromMoonOccupied = NON_LUMINARY.some((g) => fromMoon(g) === 2);
  const twelfthFromMoonOccupied = NON_LUMINARY.some((g) => fromMoon(g) === 12);
  const withMoon = NON_LUMINARY.some((g) => fromMoon(g) === 1);
  const sunapha = secondFromMoonOccupied && !twelfthFromMoonOccupied;
  const anapha = twelfthFromMoonOccupied && !secondFromMoonOccupied;
  const durdhara = secondFromMoonOccupied && twelfthFromMoonOccupied;
  const kemadruma =
    moonRashi != null && !secondFromMoonOccupied && !twelfthFromMoonOccupied && !withMoon;

  const chandraMangala =
    moonRashi != null && rashi("mars") != null && moonRashi === rashi("mars");

  const adhi =
    moonRashi != null &&
    BENEFICS.every((g) => {
      const h = fromMoon(g);
      return h != null && [6, 7, 8].includes(h);
    });

  const chatussagara = KENDRA.every((k) => sevenHouses.includes(k));

  const vasumati = beneficsInUpachayaFrom(lagnaRashi) || beneficsInUpachayaFrom(moonRashi);

  const rajalakshana = (["jupiter", "venus", "mercury", "moon"] as GrahaKey[]).every((g) => {
    const h = house(g);
    return h != null && KENDRA.includes(h);
  });

  let vanchanaChoraBheeti = false;
  if (gulikaLongitude != null) {
    const gulikaRashi = rashiOf(gulikaLongitude);
    const lagnesh = rashiLordKey(lagnaRashi);
    vanchanaChoraBheeti =
      gulikaRashi === lagnaRashi ||
      gulikaRashi === rashi(lagnesh) ||
      gulikaRashi === sunRashi ||
      gulikaRashi === moonRashi;
  }

  const jupRashi = rashi("jupiter");
  const shakata =
    moonRashi != null &&
    jupRashi != null &&
    [6, 8, 12].includes(countFrom(jupRashi, moonRashi));

  const amala = BENEFICS.some((g) => house(g) === 10 || fromMoon(g) === 10);

  const parvata =
    BENEFICS.some((g) => {
      const h = house(g);
      return h != null && KENDRA.includes(h);
    }) &&
    MALEFICS.every((g) => {
      const h = house(g);
      return h == null || (h !== 7 && h !== 8);
    });

  const kahala = mutualKendra(lordOfHouse(4), lordOfHouse(9));

  const secondFromSun = NON_LUMINARY.some((g) => fromSun(g) === 2);
  const twelfthFromSun = NON_LUMINARY.some((g) => fromSun(g) === 12);
  const veshi = secondFromSun && !twelfthFromSun;
  const vasi = twelfthFromSun && !secondFromSun;
  const obhayachari = secondFromSun && twelfthFromSun;

  const budhaditya =
    sunRashi != null && rashi("mercury") != null && sunRashi === rashi("mercury");

  let mahabhagya = false;
  if (isDayBirth != null && sunRashi != null && moonRashi != null) {
    const odd = (r: number) => r % 2 === 1;
    mahabhagya = isDayBirth
      ? odd(lagnaRashi) && odd(sunRashi) && odd(moonRashi)
      : !odd(lagnaRashi) && !odd(sunRashi) && !odd(moonRashi);
  }

  const lagnesh = rashiLordKey(lagnaRashi);
  let pushkala = false;
  if (moonRashi != null) {
    const moonDispositor = rashiLordKey(moonRashi);
    const dr = rashi(moonDispositor);
    const lr = rashi(lagnesh);
    pushkala =
      dr != null && lr != null && dr === lr && KENDRA.includes(countFrom(lagnaRashi, dr));
  }

  const lord9 = lordOfHouse(9);
  const lord9Rashi = rashi(lord9);
  const lord9House = lord9Rashi != null ? countFrom(lagnaRashi, lord9Rashi) : undefined;
  const lakshmi =
    lord9Rashi != null &&
    lord9House != null &&
    [1, 4, 5, 7, 9, 10].includes(lord9House) &&
    isStrongDignity(lord9, lord9Rashi);

  const gauri =
    moonRashi != null &&
    isStrongDignity("moon", moonRashi) &&
    jupFromMoon != null &&
    [1, 5, 7, 9].includes(jupFromMoon);

  let bharati = false;
  for (const n of [2, 5, 11]) {
    const l = lordOfHouse(n);
    const lLon = lon(l);
    if (lLon == null) continue;
    const navamsaLord = rashiLordKey(navamsaRashiFromLongitude(lLon));
    const nr = rashi(navamsaLord);
    if (
      nr != null &&
      grahaDignity(navamsaLord, nr) === "exalted" &&
      lord9Rashi != null &&
      nr === lord9Rashi
    ) {
      bharati = true;
      break;
    }
  }

  const chapa = allSevenKnown && sevenHouses.every((h) => h >= 4 && h <= 10);

  const lord7 = lordOfHouse(7);
  const lord7Rashi = rashi(lord7);
  const shrinatha =
    lord7Rashi != null &&
    countFrom(lagnaRashi, lord7Rashi) === 10 &&
    isStrongDignity(lord7, lord7Rashi);

  const shankha = mutualKendra(lordOfHouse(5), lordOfHouse(6));

  const bheri =
    (allSevenKnown && sevenHouses.every((h) => [1, 2, 7, 12].includes(h))) ||
    (mutualKendra("jupiter", "venus") &&
      mutualKendra("jupiter", lagnesh) &&
      mutualKendra("venus", lagnesh));

  let parijata = false;
  {
    const lagneshRashi = rashi(lagnesh);
    if (lagneshRashi != null) {
      const dispositor = rashiLordKey(lagneshRashi);
      const dispositorRashi = rashi(dispositor);
      if (dispositorRashi != null) {
        const second = rashiLordKey(dispositorRashi);
        const secondRashi = rashi(second);
        if (secondRashi != null) {
          const h = countFrom(lagnaRashi, secondRashi);
          parijata = [1, 4, 5, 7, 9, 10].includes(h) || isStrongDignity(second, secondRashi);
        }
      }
    }
  }

  return [
    y("mangala_dosha", "Mangala Dosha", "मंगल दोष", "inauspicious", mangalaDosha,
      "Mars occupies house 1, 4, 7, 8 or 12 from the lagna.",
      "लग्नबाट १, ४, ७, ८ वा १२ भावमा मंगल।"),
    y("kala_sarpa", "Kala Sarpa", "कालसर्प", "inauspicious", kalaSarpa,
      "All seven grahas lie on one side of the Rahu–Ketu axis.",
      "सबै सात ग्रह राहु–केतु अक्षको एकातर्फ।"),
    y("lagna_mallika", "Lagna Mallika", "लग्न मल्लिका", "auspicious", lagnaMallika,
      "The seven grahas occupy the seven consecutive houses from the lagna, one each.",
      "सात ग्रहले लग्नदेखि लगातार सात भाव एक-एक गरी ओगटेका।"),
    y("gajakesari", "Gajakesari", "गजकेसरी", "auspicious", gajakesari,
      "Jupiter in a kendra (1, 4, 7, 10) from the Moon.",
      "चन्द्रबाट केन्द्र (१, ४, ७, १०) मा बृहस्पति।"),
    y("sunapha", "Sunapha", "सुनफा", "auspicious", sunapha,
      "A graha (other than the Sun) in the 2nd from the Moon, with the 12th vacant.",
      "चन्द्रबाट दोस्रो भावमा ग्रह (सूर्यबाहेक), बाह्रौँ खाली।"),
    y("anapha", "Anapha", "अनफा", "auspicious", anapha,
      "A graha (other than the Sun) in the 12th from the Moon, with the 2nd vacant.",
      "चन्द्रबाट बाह्रौँ भावमा ग्रह (सूर्यबाहेक), दोस्रो खाली।"),
    y("durdhara", "Durdhara", "दुरुधरा", "auspicious", durdhara,
      "Grahas on both sides of the Moon (2nd and 12th).",
      "चन्द्रको दुवैतिर (दोस्रो र बाह्रौँ) ग्रह।"),
    y("kemadruma", "Kemadruma", "केमद्रुम", "inauspicious", kemadruma,
      "No graha with the Moon or in the 2nd/12th from it (Sun and nodes not counted).",
      "चन्द्रसँग वा दोस्रो/बाह्रौँमा कुनै ग्रह नभएको (सूर्य र राहु-केतु गनिँदैन)।"),
    y("chandra_mangala", "Chandra Mangala", "चन्द्र-मंगल", "auspicious", chandraMangala,
      "Moon and Mars conjunct in one rashi.",
      "चन्द्र र मंगल एउटै राशिमा।"),
    y("adhi", "Adhi", "अधि", "auspicious", adhi,
      "The benefics Mercury, Jupiter and Venus occupy houses 6, 7 and 8 from the Moon.",
      "बुध, बृहस्पति र शुक्र चन्द्रबाट ६, ७, ८ भावमा।"),
    y("chatussagara", "Chatussagara", "चतुःसागर", "auspicious", chatussagara,
      "All four kendras from the lagna are occupied by grahas.",
      "लग्नबाट चारै केन्द्र ग्रहले ओगटेका।"),
    y("vasumati", "Vasumati", "वसुमती", "auspicious", vasumati,
      "All benefics in upachaya houses (3, 6, 10, 11) from the lagna or the Moon.",
      "सबै शुभ ग्रह लग्न वा चन्द्रबाट उपचय (३, ६, १०, ११) भावमा।"),
    y("rajalakshana", "Rajalakshana", "राजलक्षण", "auspicious", rajalakshana,
      "Jupiter, Venus, Mercury and the Moon all in kendras from the lagna.",
      "बृहस्पति, शुक्र, बुध र चन्द्र सबै लग्नबाट केन्द्रमा।"),
    y("vanchana_chora_bheeti", "Vanchana Chora Bheeti", "वञ्चन चोर भीति", "inauspicious",
      vanchanaChoraBheeti,
      "Gulika joins the lagna, the lagna lord, the Sun or the Moon.",
      "गुलिक लग्न, लग्नेश, सूर्य वा चन्द्रसँग।"),
    y("shakata", "Shakata", "शकट", "inauspicious", shakata,
      "Moon in the 6th, 8th or 12th from Jupiter.",
      "बृहस्पतिबाट ६, ८ वा १२ भावमा चन्द्र।"),
    y("amala", "Amala", "अमला", "auspicious", amala,
      "A benefic in the 10th from the lagna or the Moon.",
      "लग्न वा चन्द्रबाट दशौँ भावमा शुभ ग्रह।"),
    y("parvata", "Parvata", "पर्वत", "auspicious", parvata,
      "Benefics in kendras while houses 7 and 8 hold no malefic.",
      "केन्द्रमा शुभ ग्रह, ७ र ८ भावमा पापग्रह नभएको।"),
    y("kahala", "Kahala", "काहल", "auspicious", kahala,
      "Lords of the 4th and 9th houses in mutual kendras.",
      "चौथो र नवौँ भावका स्वामी परस्पर केन्द्रमा।"),
    y("veshi", "Veshi", "वेशी", "auspicious", veshi,
      "A graha (other than the Moon) in the 2nd from the Sun, with the 12th vacant.",
      "सूर्यबाट दोस्रो भावमा ग्रह (चन्द्रबाहेक), बाह्रौँ खाली।"),
    y("vasi", "Vasi", "वासी", "auspicious", vasi,
      "A graha (other than the Moon) in the 12th from the Sun, with the 2nd vacant.",
      "सूर्यबाट बाह्रौँ भावमा ग्रह (चन्द्रबाहेक), दोस्रो खाली।"),
    y("obhayachari", "Obhayachari", "उभयचरी", "auspicious", obhayachari,
      "Grahas on both sides of the Sun (2nd and 12th).",
      "सूर्यको दुवैतिर (दोस्रो र बाह्रौँ) ग्रह।"),
    y("hansa", "Hansa", "हंस", "auspicious", mahapurusha("jupiter"),
      "Jupiter exalted or in own sign, in a kendra from the lagna (Mahapurusha).",
      "बृहस्पति उच्च/स्वगृहमा, लग्नबाट केन्द्रमा (महापुरुष योग)।"),
    y("malavya", "Malavya", "मालव्य", "auspicious", mahapurusha("venus"),
      "Venus exalted or in own sign, in a kendra from the lagna (Mahapurusha).",
      "शुक्र उच्च/स्वगृहमा, लग्नबाट केन्द्रमा (महापुरुष योग)।"),
    y("shasha", "Shasha", "शश", "auspicious", mahapurusha("saturn"),
      "Saturn exalted or in own sign, in a kendra from the lagna (Mahapurusha).",
      "शनि उच्च/स्वगृहमा, लग्नबाट केन्द्रमा (महापुरुष योग)।"),
    y("ruchaka", "Ruchaka", "रुचक", "auspicious", mahapurusha("mars"),
      "Mars exalted or in own sign, in a kendra from the lagna (Mahapurusha).",
      "मंगल उच्च/स्वगृहमा, लग्नबाट केन्द्रमा (महापुरुष योग)।"),
    y("bhadra", "Bhadra", "भद्र", "auspicious", mahapurusha("mercury"),
      "Mercury exalted or in own sign, in a kendra from the lagna (Mahapurusha).",
      "बुध उच्च/स्वगृहमा, लग्नबाट केन्द्रमा (महापुरुष योग)।"),
    y("budhaditya", "Budhaditya", "बुधादित्य", "auspicious", budhaditya,
      "Sun and Mercury conjunct in one rashi.",
      "सूर्य र बुध एउटै राशिमा।"),
    y("mahabhagya", "Mahabhagya", "महाभाग्य", "auspicious", mahabhagya,
      "Day birth with lagna, Sun and Moon in odd signs — or night birth with all three in even signs.",
      "दिनको जन्ममा लग्न, सूर्य, चन्द्र विषम राशिमा — वा रातको जन्ममा तीनै सम राशिमा।"),
    y("pushkala", "Pushkala", "पुष्कल", "auspicious", pushkala,
      "The Moon's dispositor joins the lagna lord in a kendra.",
      "चन्द्र-राशिको स्वामी लग्नेशसँग केन्द्रमा।"),
    y("lakshmi", "Lakshmi", "लक्ष्मी", "auspicious", lakshmi,
      "The 9th lord exalted or in own sign, placed in a kendra or trikona.",
      "नवमेश उच्च/स्वगृहमा, केन्द्र वा त्रिकोणमा।"),
    y("gauri", "Gauri", "गौरी", "auspicious", gauri,
      "The Moon exalted or in own sign, joined or aspected by Jupiter.",
      "चन्द्र उच्च/स्वगृहमा, बृहस्पतिको युति वा दृष्टिमा।"),
    y("bharati", "Bharati", "भारती", "auspicious", bharati,
      "The navamsa dispositor of the 2nd, 5th or 11th lord is exalted and joined with the 9th lord.",
      "२, ५ वा ११ भावेशको नवांशेश उच्च भई नवमेशसँग।"),
    y("chapa", "Chapa", "चाप", "auspicious", chapa,
      "All seven grahas within houses 4 to 10 from the lagna (bow shape).",
      "सातै ग्रह लग्नबाट ४–१० भावभित्र (धनुष आकृति)।"),
    y("shrinatha", "Shrinatha", "श्रीनाथ", "auspicious", shrinatha,
      "The 7th lord exalted or in own sign, placed in the 10th house.",
      "सप्तमेश उच्च/स्वगृहमा दशौँ भावमा।"),
    y("shankha", "Shankha", "शंख", "auspicious", shankha,
      "Lords of the 5th and 6th houses in mutual kendras.",
      "पाँचौँ र छैटौँ भावका स्वामी परस्पर केन्द्रमा।"),
    y("bheri", "Bheri", "भेरी", "auspicious", bheri,
      "All grahas in houses 1, 2, 7 and 12 — or Jupiter, Venus and the lagna lord in mutual kendras.",
      "सबै ग्रह १, २, ७, १२ भावमा — वा बृहस्पति, शुक्र र लग्नेश परस्पर केन्द्रमा।"),
    y("parijata", "Parijata", "पारिजात", "auspicious", parijata,
      "The second-level dispositor of the lagna lord in a kendra/trikona, exalted or in own sign.",
      "लग्नेशको द्वितीय आश्रयदाता केन्द्र/त्रिकोणमा वा उच्च/स्वगृहमा।"),
  ];
}

function y(
  key: string,
  nameEn: string,
  nameNe: string,
  nature: YogaNature,
  present: boolean,
  descEn: string,
  descNe: string,
): KundaliYogaResult {
  return { key, nameEn, nameNe, nature, present, descEn, descNe };
}
