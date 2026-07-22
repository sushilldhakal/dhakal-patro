/** Routes that show the left panchanga sidebar on desktop (≥992px). */
const SIDEBAR_ROUTE_PATTERNS: RegExp[] = [
  /^\/holidays$/,
  /^\/converter$/,
  /^\/suryakranti$/,
  /^\/panchanga\/year$/,
  /^\/dainikkranti$/,
  /^\/panchak-patro$/,
  /^\/ritu$/,
  /^\/panchanga\/avakahada-chakra$/,
  /^\/abhijit-muhurta$/,
  /^\/kundali$/,
  /^\/kundali\//,
  /^\/jyotish\/kundali-milan$/,
  /^\/panchanga\/details$/,
  /^\/panchanga\/element\//,
  /^\/panchanga\/graha-/,
  /^\/panchanga\/chandra-grahan$/,
  /^\/panchanga\/surya-grahan$/,
  /^\/sait\//,
];

export function shouldShowPanchangaSidebar(pathname: string): boolean {
  return SIDEBAR_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

/** Client navigations that keep the persistent panchanga shell mounted. */
export function isPanchangaShellNavigation(from: string, to: string): boolean {
  return shouldShowPanchangaSidebar(from) && shouldShowPanchangaSidebar(to);
}
