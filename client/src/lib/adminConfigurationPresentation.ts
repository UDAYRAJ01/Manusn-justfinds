export type MappingStatus = {
  label: string;
  detail: string;
  tone: "positive" | "warning" | "neutral";
};

export function googleMappingStatus(isActive: boolean, categoryIsActive: boolean): MappingStatus {
  if (!isActive) return { label: "Inactive", detail: "This source type is not used for future Google import prefills.", tone: "neutral" };
  if (!categoryIsActive) return { label: "Needs review", detail: "The mapped Just Finds category is inactive, so this mapping should be reviewed before it can be used.", tone: "warning" };
  return { label: "Active", detail: "This mapping can prefill a category on future private Google import drafts.", tone: "positive" };
}

export function googleMappingGuardrail(): string {
  return "Saving a mapping affects future Google import prefills only. It never changes an existing owner listing and never publishes a listing.";
}

export function moderationDecisionWarning(decision: "dismiss" | "remove_review"): string {
  return decision === "remove_review"
    ? "Removing a review changes its public moderation state. This cannot be undone from this screen."
    : "Dismissing a report leaves the current review unchanged and records the report as dismissed.";
}
