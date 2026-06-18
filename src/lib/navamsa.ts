/** Navamsa (D9) rashi 1–12 from sidereal longitude in degrees. */
export function navamsaRashiFromLongitude(longitude: number): number {
  const lon = ((longitude % 360) + 360) % 360;
  return (Math.floor((lon * 9) / 30) % 12) + 1;
}
