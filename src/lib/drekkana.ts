/**
 * Drekkana (D3) rashi 1–12 from a sidereal longitude in degrees.
 *
 * Each 30° sign splits into three 10° drekkanas: the first stays in the sign
 * itself, the second maps to the 5th sign from it, the third to the 9th — i.e.
 * the trinal signs of the same element.
 */
export function drekkanaRashiFromLongitude(longitude: number): number {
  const lon = ((longitude % 360) + 360) % 360;
  const sign = Math.floor(lon / 30); // 0–11
  const drekkana = Math.floor((lon - sign * 30) / 10); // 0, 1, 2
  return ((sign + drekkana * 4) % 12) + 1;
}
