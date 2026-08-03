import { cn } from "@/lib/utils";
import { tmCardPadLg, tmCardCap, tmDiagramSvg } from "@/lib/learn-classes";
import earthUrl from "@/assets/earth.svg?url";
import { GRAHA_PLANET_ICON_URL } from "@/lib/graha-planet-icons";

type Lang = "ne" | "en";

const LABELS: Record<
  Lang,
  {
    caption: string;
    foundation: string;
    raw: string;
    angas: string;
    daily: string;
    apps: string;
    nodes: Record<string, string>;
  }
> = {
  ne: {
    caption:
      "अनुरोध → स्थान र समय → Swiss Ephemeris → पञ्चाङ्ग अङ्ग → उदय–आधारित दैनिक सेट → पात्रो, पर्व, साइत, कुण्डली",
    foundation: "आधार",
    raw: "खगोलीय मात्रा",
    angas: "पञ्चाङ्ग अङ्ग",
    daily: "दैनिक सेट",
    apps: "उत्पादन",
    nodes: {
      loc: "अवलोकक\n(Kathmandu TZ)",
      jd: "जुलियन दिन\nAD / BS / BCE",
      ephe: "Swiss Ephemeris\nLahiri ayanamsa",
      rs: "उदय / अस्त",
      lon: "निरयन देशान्तर",
      lag: "लग्न · राशि",
      five: "तिथि · नक्षत्र\nयोग · करण · वार",
      bnd: "अन्त समय\n(bisection)",
      uday: "उदय → अर्को उदय\n(पञ्चाङ्ग दिन)",
      civ: "Civil timeline",
      at: "at-time",
      patro: "महिना / वर्ष",
      fest: "पर्व नियम",
      sait: "साइत स्क्यान",
      gochar: "गोचर · वक्री",
      ecl: "ग्रहण",
      kun: "कुण्डली · दशा",
    },
  },
  en: {
    caption:
      "Request → place & time → Swiss Ephemeris → panchanga limbs → sunrise-anchored day → patro, festivals, sait, kundali",
    foundation: "Foundation",
    raw: "Raw astronomy",
    angas: "Panchanga angas",
    daily: "Daily assembly",
    apps: "Products",
    nodes: {
      loc: "Observer\n(Kathmandu TZ)",
      jd: "Julian day\nAD / BS / BCE",
      ephe: "Swiss Ephemeris\nLahiri ayanamsa",
      rs: "Rise / set",
      lon: "Sidereal longitudes",
      lag: "Lagna · rashi",
      five: "Tithi · nakshatra\nYoga · karana · vara",
      bnd: "End times\n(bisection)",
      uday: "Sunrise → next sunrise\n(panchanga day)",
      civ: "Civil timeline",
      at: "at-time",
      patro: "Month / year grids",
      fest: "Festival rules",
      sait: "Sait scan",
      gochar: "Gochar · retrograde",
      ecl: "Eclipses",
      kun: "Kundali · dasha",
    },
  },
};

function Box({
  x,
  y,
  w,
  h,
  label,
  accent,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  accent?: "teal" | "amber" | "gold";
}) {
  const fill =
    accent === "amber"
      ? "color-mix(in srgb, var(--tm-amber) 14%, var(--tm-card))"
      : accent === "gold"
        ? "color-mix(in srgb, var(--tm-gold) 12%, var(--tm-card))"
        : "color-mix(in srgb, var(--tm-teal) 10%, var(--tm-card))";
  const stroke =
    accent === "amber"
      ? "var(--tm-amber)"
      : accent === "gold"
        ? "var(--tm-gold)"
        : "var(--tm-teal)";
  const lines = label.split("\n");
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={10}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.2}
        opacity={0.95}
      />
      {lines.map((line, i) => (
        <text
          key={i}
          x={x + w / 2}
          y={y + h / 2 + (i - (lines.length - 1) / 2) * 13}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-[var(--tm-ink)] text-[11px] font-semibold"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function Arrow({ d }: { d: string }) {
  return (
    <path
      d={d}
      fill="none"
      stroke="var(--tm-ink-faint)"
      strokeWidth={1.4}
      markerEnd="url(#pipe-arrow)"
      opacity={0.85}
    />
  );
}

function GroupLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text
      x={x}
      y={y}
      className="fill-[var(--tm-amber)] text-[12px] font-bold uppercase tracking-wide"
    >
      {text}
    </text>
  );
}

export function ServerPipelineDiagram({ lang }: { lang: Lang }) {
  const L = LABELS[lang];
  const n = L.nodes;

  return (
    <figure className={tmCardPadLg}>
      <svg
        viewBox="0 0 920 520"
        className={cn(tmDiagramSvg, "max-h-[min(520px,75vh)]")}
        role="img"
        aria-label={L.caption}
      >
        <defs>
          <marker
            id="pipe-arrow"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--tm-ink-faint)" />
          </marker>
        </defs>

        <image href={earthUrl} x="24" y="36" width="48" height="48" opacity={0.92} />
        <text x="80" y="58" className="fill-[var(--tm-ink-dim)] text-[11px]">
          nepali-holiday-api
        </text>
        <text x="80" y="74" className="fill-[var(--tm-teal)] text-[11px] font-semibold">
          Vedic Patro → HTTP
        </text>

        <GroupLabel x={32} y={118} text={L.foundation} />
        <Box x={32} y={128} w={118} h={52} label={n.loc} />
        <Box x={168} y={128} w={118} h={52} label={n.jd} />
        <Box x={304} y={124} w={140} h={60} label={n.ephe} accent="teal" />

        <GroupLabel x={32} y={208} text={L.raw} />
        <Box x={32} y={218} w={130} h={52} label={n.rs} />
        <Box x={180} y={218} w={150} h={52} label={n.lon} />
        <Box x={348} y={218} w={118} h={52} label={n.lag} />

        <GroupLabel x={32} y={298} text={L.angas} />
        <Box x={32} y={308} w={160} h={56} label={n.five} accent="amber" />
        <Box x={210} y={308} w={130} h={56} label={n.bnd} />

        <GroupLabel x={32} y={388} text={L.daily} />
        <Box x={32} y={398} w={150} h={56} label={n.uday} accent="teal" />
        <Box x={200} y={398} w={118} h={56} label={n.civ} />
        <Box x={336} y={398} w={100} h={56} label={n.at} />

        <GroupLabel x={520} y={118} text={L.apps} />
        <Box x={520} y={128} w={120} h={44} label={n.patro} />
        <Box x={656} y={128} w={120} h={44} label={n.fest} />
        <Box x={792} y={128} w={108} h={44} label={n.sait} />
        <Box x={520} y={188} w={120} h={44} label={n.gochar} />
        <Box x={656} y={188} w={120} h={44} label={n.ecl} />
        <Box x={792} y={188} w={108} h={44} label={n.kun} />

        <g transform="translate(520, 268)">
          {(["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"] as const).map(
            (key, i) => (
              <image
                key={key}
                href={GRAHA_PLANET_ICON_URL[key]}
                x={(i % 4) * 52}
                y={Math.floor(i / 4) * 52}
                width={40}
                height={40}
                opacity={0.9}
              />
            ),
          )}
          <text x={0} y={118} className="fill-[var(--tm-ink-faint)] text-[10px]">
            {lang === "ne" ? "९ ग्रह — spashta @ उदय" : "9 grahas — positions at sunrise"}
          </text>
        </g>

        <Arrow d="M150 154 H168" />
        <Arrow d="M286 154 H304" />
        <Arrow d="M374 184 V208" />
        <Arrow d="M97 180 V218" />
        <Arrow d="M330 270 V308" />
        <Arrow d="M192 334 H210" />
        <Arrow d="M112 364 V398" />
        <Arrow d="M374 426 H520" />
        <Arrow d="M182 426 H520" />
      </svg>
      <figcaption className={tmCardCap}>{L.caption}</figcaption>
    </figure>
  );
}
