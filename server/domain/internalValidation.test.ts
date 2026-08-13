import { describe, expect, it } from "vitest";
import { internalValidationCategorySlug, isInternalValidationBusiness } from "./internalValidation";

describe("internal validation listing eligibility", () => {
  it("permits only explicitly labelled Just Finds internal records in the protected category", () => {
    expect(isInternalValidationBusiness({ categorySlug: internalValidationCategorySlug, name: "Just Finds Internal Map Validation — TEST ONLY" })).toBe(true);
  });

  it("rejects real, loosely named, and cross-category records", () => {
    expect(isInternalValidationBusiness({ categorySlug: internalValidationCategorySlug, name: "Just Finds Map Validation" })).toBe(false);
    expect(isInternalValidationBusiness({ categorySlug: internalValidationCategorySlug, name: "Neighbourhood bakery — TEST ONLY" })).toBe(false);
    expect(isInternalValidationBusiness({ categorySlug: "restaurants", name: "Just Finds Internal Map Validation — TEST ONLY" })).toBe(false);
  });
});
