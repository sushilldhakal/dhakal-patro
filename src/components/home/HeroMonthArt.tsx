import { useEffect, useRef, useState } from "react";

interface Props {
  src: string;
}

function isWideLayout() {
  return window.matchMedia("(min-width: 1081px)").matches;
}

/**
 * Month hero art — deferred on mobile (below the calendar) via Intersection
 * Observer; eager on wide layouts where the aside is visible beside the grid.
 */
export function HeroMonthArt({ src }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [eager, setEager] = useState(false);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const wide = isWideLayout();
    setEager(wide);
    if (wide) {
      setLoad(true);
      return;
    }

    const host = hostRef.current;
    if (!host) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden" aria-hidden>
      {load ? (
        <img
          src={src}
          alt=""
          decoding="async"
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "low"}
          className="h-full w-full object-cover object-center"
        />
      ) : null}
    </div>
  );
}
