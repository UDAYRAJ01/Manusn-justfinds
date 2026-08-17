import { describe, expect, it } from "vitest";
import { canRecordVerificationDecision, filterVerificationCases, verificationReviewGuidance } from "./verificationReviewPresentation";

describe("verification review presentation rules", () => {
  const cases = [
    { business: { name: "Lotus Clinic" }, documents: [{ id: 1 }] },
    { business: { name: "River Pharmacy" }, documents: [] },
  ];

  it("filters pending review cases by evidence presence and business query without fabricating queue state", () => {
    expect(filterVerificationCases(cases, "with_evidence", "")).toHaveLength(1);
    expect(filterVerificationCases(cases, "needs_evidence", "river")).toHaveLength(1);
  });

  it("requires an explanation and directs reviewers to deliberately open real evidence", () => {
    expect(canRecordVerificationDecision("  no ")).toBe(false);
    expect(canRecordVerificationDecision("Document matches the listing identity.")).toBe(true);
    expect(verificationReviewGuidance(0)).toContain("do not infer");
    expect(verificationReviewGuidance(2)).toContain("Open each file deliberately");
  });
});
