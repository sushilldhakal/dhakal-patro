/** Shared North-Indian kundali geometry (300×300 viewBox). */

export type Point = [number, number];

/** House polygons — counter-clockwise from top-center diamond. */
export const NI_HOUSE_POLYGONS: Record<number, Point[]> = {
  1: [[150, 0], [225, 75], [150, 150], [75, 75]],
  2: [[0, 0], [150, 0], [75, 75]],
  3: [[0, 0], [75, 75], [0, 150]],
  4: [[0, 150], [75, 75], [150, 150], [75, 225]],
  5: [[0, 150], [75, 225], [0, 300]],
  6: [[0, 300], [75, 225], [150, 300]],
  7: [[150, 300], [75, 225], [150, 150], [225, 225]],
  8: [[150, 300], [225, 225], [300, 300]],
  9: [[225, 225], [300, 300], [300, 150]],
  10: [[300, 150], [225, 225], [150, 150], [225, 75]],
  11: [[300, 150], [225, 75], [300, 0]],
  12: [[225, 75], [300, 0], [150, 0]],
};

/**
 * Fixed rāśi → house slot on a North-Indian गोचर कुण्डली (Surya-patro convention).
 * मेष at top-right corner, मीन at right-center, मिथुन at top-center, etc.
 */
export const GOCHAR_RASHI_TO_HOUSE: Record<number, number> = {
  1: 11,
  2: 12,
  3: 1,
  4: 2,
  5: 3,
  6: 4,
  7: 5,
  8: 6,
  9: 7,
  10: 8,
  11: 9,
  12: 10,
};

export function polygonCentroid(points: Point[]): Point {
  const n = points.length;
  const sum = points.reduce(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0]);
  return [sum[0] / n, sum[1] / n];
}

export function pointsToSvg(points: Point[]): string {
  return points.map((p) => p.join(",")).join(" ");
}
