/** Sripathi / B.V. Raman drishti value from aspect angle (degrees). */

export function normLon(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}

/** Aspect angle: aspected longitude minus aspecting longitude (add 360° if negative). */
export function drishtiKendra(aspectedLon: number, aspectingLon: number): number {
  let kendra = normLon(aspectedLon) - normLon(aspectingLon);
  if (kendra < 0) kendra += 360;
  return kendra;
}

/**
 * Drishti strength in virupas for a given aspect angle.
 * Valid only when kendra is between 30° and 300° (exclusive of blind spots).
 */
export function drishtiValue(kendraDeg: number): number {
  if (kendraDeg < 30 || kendraDeg > 300) return 0;

  if (kendraDeg < 60) return (kendraDeg - 30) / 2;
  if (kendraDeg < 90) return kendraDeg - 60 + 15;
  if (kendraDeg < 120) return (120 - kendraDeg) / 2 + 30;
  if (kendraDeg < 150) return 150 - kendraDeg;
  if (kendraDeg < 180) return (kendraDeg - 150) * 2;
  return (300 - kendraDeg) / 2;
}

/** Special (full) aspects of Mars, Jupiter and Saturn per classical rules. */
export function viseshaDrishti(planetKey: string, kendraDeg: number): number {
  if (kendraDeg < 30 || kendraDeg > 300) return 0;

  if (planetKey === "mars") {
    if (kendraDeg >= 90 && kendraDeg < 120) return 15;
    if (kendraDeg >= 210 && kendraDeg < 240) return 15;
  }
  if (planetKey === "jupiter") {
    if (kendraDeg >= 120 && kendraDeg < 150) return 30;
    if (kendraDeg >= 240 && kendraDeg < 270) return 30;
  }
  if (planetKey === "saturn") {
    if (kendraDeg >= 60 && kendraDeg < 90) return 45;
    if (kendraDeg >= 270 && kendraDeg < 300) return 45;
  }
  return 0;
}

export function totalDrishtiOnPoint(
  aspectedLon: number,
  aspectingLon: number,
  aspectingKey: string,
): number {
  const kendra = drishtiKendra(aspectedLon, aspectingLon);
  return drishtiValue(kendra) + viseshaDrishti(aspectingKey, kendra);
}
