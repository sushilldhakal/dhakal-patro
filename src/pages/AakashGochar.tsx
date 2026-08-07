/**
 * 3D Aakash Gochar — the live sky in three dimensions, seen from the Earth.
 *
 * The API supplies the sidereal longitudes for the chosen date; the scene pins
 * its own orbital model onto them and animates outward from there, so pressing
 * play walks the real gochar forward rather than an approximation of it.
 */

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Orbit } from "lucide-react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { PatroDayTimeNav } from "@/components/patro-date";
import { VedicPatroLoader } from "@/components/VedicPatroLoader";
import { AakashGocharSky } from "@/components/sky3d/AakashGocharSky";
import {
  resolveLocationTimezone,
  usePanchangaLocation,
} from "@/components/panchanga/use-panchanga-location";
import { useHydrated } from "@/hooks/use-hydrated";
import { useLocale, bilingualText } from "@/i18n/locale";
import { fetchGochar, gocharKeys } from "@/lib/api";
import { KATHMANDU, type Observer } from "@/lib/sky3d/horizon";
import { todayAdStringInTimezone } from "@/lib/zoned-time";

/** Canvas height when the page is not fullscreen. */
const SCENE_HEIGHT = 560;

export function AakashGochar() {
  const { lang } = useLocale();
  const pick = (ne: string, en: string) => bilingualText(lang, ne, en);

  const { location, setLocation } = usePanchangaLocation();
  /* The HUD names this zone on screen, and the default location carries no
     timezone of its own — so resolve through the helper that falls back to
     Nepal time rather than letting it read "UTC" over a Kathmandu sky. */
  const tz = resolveLocationTimezone(location);
  const todayAd = todayAdStringInTimezone(new Date(), tz);
  const [date, setDate] = useState(() => new Date(`${todayAd}T12:00:00`));
  const [clock, setClock] = useState("12:00");

  /**
   * WebGL cannot run during the build-time prerender, and rendering the canvas
   * on the very first client pass would not match the HTML that shipped. So the
   * sky waits one commit; the loader below is what the crawler sees.
   */
  const hydrated = useHydrated();

  const dateAd = useMemo(() => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [date]);

  /* The scene reads a single instant — merge the picked day with the picked
     clock so the time pickers actually move the sky, not just the date. */
  const sceneDate = useMemo(() => {
    const [hour, minute] = clock.split(":").map(Number);
    const d = new Date(date);
    d.setHours(hour || 0, minute || 0, 0, 0);
    return d;
  }, [date, clock]);

  /* The horizon/globe view is drawn from these coordinates — the observer frame
     and the "you are here" pin both. Every stored location carries them, so the
     constant below is a type-level backstop rather than a place we land on. */
  const observer: Observer = useMemo(() => {
    const { lat, lon } = location.params;
    return lat != null && lon != null ? { lat, lon } : KATHMANDU;
  }, [location.params]);

  const query = useQuery({
    queryKey: gocharKeys.dayLegacy(dateAd, "ad", location.params),
    queryFn: () => fetchGochar(dateAd, "ad", location.params),
    /* Without this, `isLoading` goes true on every date change (no data yet
       under the new key), which swaps AakashGocharSky out for the spinner —
       unmounting it and wiping its fullscreen/mode/camera state. Keeping the
       previous day's data on screen during the refetch keeps it mounted. */
    placeholderData: keepPreviousData,
  });

  return (
    <PageShell>
      <PageHeader
        icon={<Orbit className="size-7 text-secondary" strokeWidth={1.75} aria-hidden />}
        title={pick("३D आकाश गोचर", "3D Aakash Gochar")}
        subtitle={pick(
          "भूकेन्द्रित दृष्टिकोणबाट प्रत्यक्ष ग्रह गोचर",
          "Live graha transits from the geocentric standpoint",
        )}
      />

      <PatroDayTimeNav
        date={date}
        onDateChange={setDate}
        todayAd={todayAd}
        clock={clock}
        onClockChange={setClock}
        location={location}
        onLocationChange={setLocation}
      />

      {!hydrated || query.isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-border py-24">
          <VedicPatroLoader />
        </div>
      ) : (
        /* The scene runs on its own model, so a failed fetch costs accuracy for
           the day on screen, not the view itself. */
        <AakashGocharSky
          gochar={query.data?.gochar}
          ayanamsaDeg={query.data?.ayanamsa?.degrees}
          date={sceneDate}
          onDateChange={setDate}
          clock={clock}
          onClockChange={setClock}
          observer={observer}
          timeZone={tz}
          height={SCENE_HEIGHT}
        />
      )}

      <div className="flex flex-col gap-2">
        <p className="m-0 text-sm leading-relaxed text-muted-foreground">
          {pick(
            "पृथ्वी केन्द्रमा छ र क्यामेरा त्यसैको वरिपरि घुम्छ — यही भूकेन्द्रित दृष्टिकोणबाट वैदिक गोचर हेरिन्छ। प्रत्येक ग्रह आफ्नो निरयन देशान्तर र शरमा राखिएको छ, र चन्द्रदेखि शनिसम्मको परम्परागत क्रममा आफ्नो कक्षमा हिँड्छ।",
            "Earth sits at the centre and the camera orbits it — the geocentric standpoint Vedic gochar is read from. Each graha is placed at its true sidereal longitude and shara, riding a shell in the classical Moon-to-Saturn order.",
          )}
        </p>
        <p className="m-0 text-sm leading-relaxed text-muted-foreground">
          {pick(
            "राशि वलय अक्षांश अनुसार ढल्किन्छ र घण्टै पिच्छे घुम्छ, त्यसैले यो पृथ्वीको कक्षसँग समानान्तर देखिँदैन। पहेँलो रेखा खगोलीय विषुवत् हो; त्यससँगको २३.४४° को झुकाव यहीँ प्रस्ट देखिन्छ।",
            "The rashi belt tips with your latitude and swings with the hour, which is why it does not sit parallel to anything. The gold line is the celestial equator; the 23.44° tilt between the two is visible right there.",
          )}
        </p>
        <p className="m-0 text-sm leading-relaxed text-muted-foreground">
          {pick(
            "गति रेखाले ४५ दिन अघि र पछिको बाटो देखाउँछ — मंगल वा शनि वक्री हुँदा त्यही रेखामा पछाडि फर्किएको पासो देखिन्छ। कुनै पनि ग्रह छोएर नजिक पुग्न सकिन्छ; «−» ले फेरि सिङ्गो सौर्यमण्डल देखाउँछ।",
            "The trail draws 45 days either side of the moment on screen — when Mars or Saturn turns vakri you can watch the loop close on itself. Click any graha to fly in close to it; “−” pulls back to the whole system.",
          )}
        </p>
        <p className="m-0 text-sm leading-relaxed text-muted-foreground">
          {pick(
            "माउसले तानेर आकाश घुमाउनुहोस्, स्क्रोल गरेर नजिक-टाढा गर्नुहोस्; टचस्क्रिनमा दुई औंलाले पनि हुन्छ।",
            "Drag to swing the sky and scroll to zoom; on a touchscreen, drag with one finger and pinch with two.",
          )}
        </p>
      </div>
    </PageShell>
  );
}

export default AakashGochar;
