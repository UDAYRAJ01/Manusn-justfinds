import { describe, expect, it } from "vitest";
import { normalizeCategorySlug } from "./categorySlug";

describe("city slug normalization", () => {
  it("derives a public slug from the city name", () => {
    expect(normalizeCategorySlug("Kannur")).toBe("kannur");
  });

  it("cleans spaces, underscores, accents, and punctuation", () => {
    expect(normalizeCategorySlug("São José_da Costa!")).toBe("sao-jose-da-costa");
  });

  it("returns an empty value for names that contain no slug characters", () => {
    expect(normalizeCategorySlug("___")).toBe("");
  });
});
