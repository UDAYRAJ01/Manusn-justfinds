import { describe, expect, it } from "vitest";
import { isValidCategorySlug, normalizeAndValidateCategorySlug, normalizeCategorySlug } from "./categorySlug";

describe("category slug normalization", () => {
  it("turns a category name into a public hyphenated slug", () => {
    expect(normalizeCategorySlug("Dental Clinic")).toBe("dental-clinic");
    expect(normalizeCategorySlug("dental_clinic")).toBe("dental-clinic");
  });

  it("removes accents and punctuation", () => {
    expect(normalizeCategorySlug("Café & Bakery")).toBe("cafe-bakery");
  });

  it("accepts normalized slugs and rejects empty or too-short results", () => {
    expect(isValidCategorySlug(normalizeCategorySlug("Dental Clinic"))).toBe(true);
    expect(() => normalizeAndValidateCategorySlug("___")).toThrow("valid URL slug");
  });
});
