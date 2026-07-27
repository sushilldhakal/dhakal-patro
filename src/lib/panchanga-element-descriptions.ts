/**
 * Long-form element page descriptions — copy lives in ne.json / en.json
 * (`element_descriptions.*`). Use {@link elementDescriptionSection}.
 */
export type ElementDescriptionSection = "what" | "how" | "meaning";

export { elementDescriptionSection as getElementDescriptionText } from "@/lib/panchanga-i18n";
