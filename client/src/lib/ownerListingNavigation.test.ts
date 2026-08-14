import { describe, expect, it } from "vitest";
import { getOwnerListingPath, getSelectedBusinessId } from "./ownerListingNavigation";

describe("owner listing navigation", () => {
  it("creates one canonical workspace URL with optional business context", () => {
    expect(getOwnerListingPath()).toBe("/business");
    expect(getOwnerListingPath(42)).toBe("/business?businessId=42");
  });

  it("reads a valid selected business from the canonical workspace URL", () => {
    expect(getSelectedBusinessId("/business?businessId=42")).toBe(42);
    expect(getSelectedBusinessId("/business?businessId=42&tab=profile")).toBe(42);
  });

  it("rejects missing, zero, fractional, and non-numeric business IDs", () => {
    expect(getSelectedBusinessId("/business")).toBeNull();
    expect(getSelectedBusinessId("/business?businessId=0")).toBeNull();
    expect(getSelectedBusinessId("/business?businessId=4.5")).toBeNull();
    expect(getSelectedBusinessId("/business?businessId=unknown")).toBeNull();
  });
});
