import { PANCHANGA_SHELL_PATHS } from "@/router";

/** True if `template`'s static segments match `pathname` (dynamic "$param" segments match anything). */
function matchesTemplate(pathname: string, template: string): boolean {
  const pathSegments = pathname.split("/");
  const templateSegments = template.split("/");
  if (pathSegments.length !== templateSegments.length) return false;
  return templateSegments.every(
    (segment, i) => segment.startsWith("$") || segment === pathSegments[i],
  );
}

/** Routes that show the left panchanga sidebar on desktop (≥992px). */
export function shouldShowPanchangaSidebar(pathname: string): boolean {
  return PANCHANGA_SHELL_PATHS.some((template) => matchesTemplate(pathname, template));
}

/** Client navigations that keep the persistent panchanga shell mounted. */
export function isPanchangaShellNavigation(from: string, to: string): boolean {
  return shouldShowPanchangaSidebar(from) && shouldShowPanchangaSidebar(to);
}
