import { describe, expect, it } from "vitest";
import { hasValidCoordinates, isApprovalReadyDescription } from "./onboarding";

describe("guided onboarding acceptance rules", () => {
  it("accepts only finite latitude and longitude values within global bounds", () => {
    expect(hasValidCoordinates("12.971599", "77.594566")).toBe(true);
    expect(hasValidCoordinates("", "77.594566")).toBe(false);
    expect(hasValidCoordinates("91", "77.594566")).toBe(false);
    expect(hasValidCoordinates("12.9", "181")).toBe(false);
  });

  it("requires a bounded, approval-ready factual description", () => {
    expect(isApprovalReadyDescription("A factual description with enough detail to support review.")).toBe(true);
    expect(isApprovalReadyDescription("Too brief")).toBe(false);
    expect(isApprovalReadyDescription("x".repeat(1001))).toBe(false);
  });
});
