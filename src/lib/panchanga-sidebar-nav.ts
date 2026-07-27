import { CEREMONY_META, ELEMENT_META } from "@/lib/panchanga-elements";

export interface PanchangaSidebarItem {
  id: string;
  to: string;
  params?: Record<string, string>;
  labelNe: string;
  labelEn: string;
  blurbNe?: string;
  blurbEn?: string;
}

export interface PanchangaSidebarSection {
  id: string;
  titleNe: string;
  titleEn: string;
  items: PanchangaSidebarItem[];
}

const GRAHA_SIDEBAR_ITEMS: PanchangaSidebarItem[] = [
  {
    id: "graha-sthiti",
    to: "/panchanga/graha-sthiti",
    labelNe: "ग्रह स्थिति",
    labelEn: "Planetary positions",
    blurbNe: "नौ ग्रह र लग्नको दैनिक स्थिति",
    blurbEn: "Daily positions of 9 grahas + lagna",
  },
  {
    id: "graha-asta",
    to: "/panchanga/graha-asta",
    labelNe: "ग्रह अस्त",
    labelEn: "Heliacal set",
    blurbNe: "वर्षभरका उदय–अस्त क्षण",
    blurbEn: "Yearly rising & setting",
  },
  {
    id: "graha-vakri",
    to: "/panchanga/graha-vakri",
    labelNe: "ग्रह वक्री",
    labelEn: "Retrograde",
    blurbNe: "वर्षभरका वक्री–मार्गी क्षण",
    blurbEn: "Yearly retrograde stations",
  },
  {
    id: "chandra-grahan",
    to: "/panchanga/chandra-grahan",
    labelNe: "चन्द्र ग्रहण",
    labelEn: "Lunar eclipse",
    blurbNe: "वर्षका चन्द्र ग्रहण",
    blurbEn: "The year's lunar eclipses",
  },
  {
    id: "surya-grahan",
    to: "/panchanga/surya-grahan",
    labelNe: "सूर्य ग्रहण",
    labelEn: "Solar eclipse",
    blurbNe: "वर्षका सूर्य ग्रहण",
    blurbEn: "The year's solar eclipses",
  },
];

function elementItems(kind: "span" | "table"): PanchangaSidebarItem[] {
  return ELEMENT_META.filter((e) => e.kind === kind).map((e) => ({
    id: e.id,
    to: "/panchanga/element/$name",
    params: { name: e.id },
    labelNe: e.ne,
    labelEn: e.en,
    blurbNe: e.blurbNe,
    blurbEn: e.blurbEn,
  }));
}

function ceremonyItems(): PanchangaSidebarItem[] {
  return CEREMONY_META.map((c) => ({
    id: c.id,
    to: "/sait/$category",
    params: { category: c.id },
    labelNe: `${c.ne} साइत`,
    labelEn: `${c.en} moment`,
    blurbNe: "शुभ मिति र व्याख्या",
    blurbEn: "Auspicious dates & explanation",
  }));
}

/** Static sidebar sections — dynamic search (dainik kranti, panchak) added in the component. */
export function getPanchangaSidebarSections(): PanchangaSidebarSection[] {
  return [
    {
      id: "patro",
      titleNe: "पात्रो तथा मिति",
      titleEn: "Patro & dates",
      items: [
        {
          id: "holidays",
          to: "/holidays",
          labelNe: "बिदा तथा पर्व",
          labelEn: "Holidays",
        },
        {
          id: "converter",
          to: "/converter",
          labelNe: "रूपान्तरण",
          labelEn: "Converter",
        },
        {
          id: "suryakranti",
          to: "/suryakranti",
          labelNe: "सूर्यक्रान्ति",
          labelEn: "Sun Revolution",
        },
        {
          id: "panchanga-year",
          to: "/panchanga/year",
          labelNe: "वार्षिक पञ्चाङ्ग चक्र",
          labelEn: "Annual panchanga wheel",
        },
        {
          id: "dainikkranti",
          to: "/dainikkranti",
          labelNe: "दैनिक क्रान्ति",
          labelEn: "Daily transits",
        },
        {
          id: "panchak-patro",
          to: "/panchak-patro",
          labelNe: "पञ्चक पात्रो",
          labelEn: "Panchak calendar",
        },
        {
          id: "ritu",
          to: "/ritu",
          labelNe: "ऋतु",
          labelEn: "Seasons",
        },
      ],
    },
    {
      id: "jyotish",
      titleNe: "ज्योतिष तथा मुहूर्त",
      titleEn: "Jyotish & moment",
      items: [
        {
          id: "avakahada",
          to: "/panchanga/avakahada-chakra",
          labelNe: "अवकहडा चक्र",
          labelEn: "Avakahada chakra",
        },
        {
          id: "abhijit",
          to: "/abhijit-muhurta",
          labelNe: "अभिजित् मुहूर्त",
          labelEn: "Abhijit moment",
        },
        {
          id: "kundali",
          to: "/kundali",
          labelNe: "जन्मकुण्डली निर्माण",
          labelEn: "Birth chart builder",
        },
        {
          id: "kundali-milan",
          to: "/jyotish/kundali-milan",
          labelNe: "कुण्डली मिलान",
          labelEn: "Chart matching",
        },
      ],
    },
    {
      id: "spans",
      titleNe: "सङ्क्रमण तत्त्व (आरम्भ–अन्त्य)",
      titleEn: "Transition elements (begin–end)",
      items: elementItems("span"),
    },
    {
      id: "graha",
      titleNe: "ग्रह विवरण",
      titleEn: "Planet details",
      items: GRAHA_SIDEBAR_ITEMS,
    },
    {
      id: "tables",
      titleNe: "दैनिक तालिका",
      titleEn: "Daily tables",
      items: elementItems("table"),
    },
    {
      id: "sait",
      titleNe: "शुभ मुहूर्त",
      titleEn: "Auspicious ceremonies",
      items: ceremonyItems(),
    },
  ];
}
