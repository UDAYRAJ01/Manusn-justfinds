export const GOOGLE_IMPORT_BOUNDARY = "Google ratings, reviews, user content, and photos are never imported.";

export const googleImportSteps = [
  { id: "search", label: "Search and select", detail: "Choose an official Google business result." },
  { id: "review", label: "Review editable details", detail: "Confirm the factual fields before creating a private draft." },
] as const;

export function googlePrefillLabel(field: "category" | "city" | "about", available: boolean, locality?: string | null) {
  if (field === "city") {
    return available
      ? `From Google Business data — matched from ${locality || "the listed locality"}. Edit before creating your draft.`
      : "No supported city match was found. Choose a supported city to continue.";
  }
  if (field === "category") {
    return available
      ? "From Google Business data — edit before creating your draft."
      : "No category mapping was available. Choose the closest Just Finds category.";
  }
  return available
    ? "From Google Business data — edit before creating your draft."
    : "No Google Business About information was available. Add your own description.";
}

export function isLikelyDuplicateMessage(message?: string | null) {
  return Boolean(message && /likely duplicate|already being added/i.test(message));
}
