export const verificationQueueFilters = [
  { value: "all", label: "All cases" },
  { value: "with_evidence", label: "With evidence" },
  { value: "needs_evidence", label: "Needs evidence" },
] as const;

export type VerificationQueueFilter = (typeof verificationQueueFilters)[number]["value"];

type ReviewCase = { business: { name: string }; documents: readonly unknown[] };

export function filterVerificationCases<T extends ReviewCase>(cases: readonly T[], filter: VerificationQueueFilter, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return cases.filter(item => {
    const evidenceMatches = filter === "all" || (filter === "with_evidence" ? item.documents.length > 0 : item.documents.length === 0);
    const queryMatches = !normalizedQuery || item.business.name.toLocaleLowerCase().includes(normalizedQuery);
    return evidenceMatches && queryMatches;
  });
}

export function verificationReviewGuidance(documentCount: number) {
  if (documentCount === 0) return "No evidence file is attached to this case. Request changes with a specific explanation; do not infer verification from listing details alone.";
  return `${documentCount} evidence ${documentCount === 1 ? "file is" : "files are"} attached. Open each file deliberately before recording a decision.`;
}

export function canRecordVerificationDecision(note: string) {
  return note.trim().length >= 5;
}
