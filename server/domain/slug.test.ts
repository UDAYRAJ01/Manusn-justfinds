import { describe, expect, it } from "vitest";
import { isValidSlug, numberedSlug, preferredBusinessSlug, slugify } from "./slug";

describe("business slug generation", () => {
  it("converts a business name into a URL-safe slug", () => {
    expect(slugify("RS Institute & Café")).toBe("rs-institute-cafe");
    expect(isValidSlug("rs-institute-cafe")).toBe(true);
  });

  it("keeps a valid explicitly supplied slug", () => {
    expect(preferredBusinessSlug("RS Institute", "rs-institute-main")).toBe("rs-institute-main");
  });

  it("falls back to the business name when a manual slug is invalid", () => {
    expect(preferredBusinessSlug("RS Institute", "RS_INSTITUTE")).toBe("rs-institute");
    expect(preferredBusinessSlug("!!!", "")).toBe("business");
  });

  it("adds a deterministic numeric suffix for collisions", () => {
    expect(numberedSlug("a-business", 2)).toBe("a-business-2");
  });
});
