export type OwnerWorkspaceSummary = {
  label: string;
  detail: string;
  tone: "draft" | "review" | "published" | "attention";
};

export function getOwnerWorkspaceSummary(status: string, completeness: number): OwnerWorkspaceSummary {
  if (status === "published") return { label: "Published", detail: `Your public profile is ${completeness}% complete. Keep its facts current when something changes.`, tone: "published" };
  if (["submitted", "under_review"].includes(status)) return { label: "In review", detail: "Your submitted facts are with the Just Finds review team. You can continue completing permitted listing details.", tone: "review" };
  if (status === "rejected") return { label: "Changes requested", detail: "Review feedback is available in this owner-scoped profile. Update the requested facts before submitting again.", tone: "attention" };
  return { label: "Private draft", detail: `Complete the remaining listing facts before submitting this ${completeness}% complete profile for review.`, tone: "draft" };
}
