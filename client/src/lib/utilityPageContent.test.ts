import { describe, expect, it } from "vitest";
import { notFoundRecoveryLinks, publicVerificationStatus, verificationEvidenceGuidance } from "./utilityPageContent";

describe("utility-page content", () => {
  it("keeps evidence guidance limited to supported private verification paths", () => {
    expect(verificationEvidenceGuidance.map(item => item.title)).toEqual(["Business registration", "Address or ownership proof", "Private review"]);
    expect(verificationEvidenceGuidance.join(" ").toLowerCase()).not.toContain("rating");
  });

  it("gives 404 visitors search, home, and category recovery paths", () => {
    expect(notFoundRecoveryLinks.map(link => link.href)).toEqual(["/search", "/", "/categories"]);
  });

  it("does not overstate an unverified public listing", () => {
    expect(publicVerificationStatus(false)).toMatchObject({ title: "Verification not complete", tone: "pending" });
    expect(publicVerificationStatus(true)).toMatchObject({ title: "Verified Just Finds listing", tone: "verified" });
  });
});
