import { describe, expect, it } from "vitest";
import { getMeta, resolveCanonical } from "./PageMeta";

describe("PageMeta", () => {
  it("provides public discovery metadata", () => {
    expect(getMeta("/")).toMatchObject({ title: "Just Finds — Local discovery, refined" });
    expect(getMeta("/categories").description).toContain("categories");
    expect(getMeta("/jobs").title).toContain("Local jobs");
  });

  it("does not expose public discovery language on protected routes", () => {
    expect(getMeta("/login").title).toContain("Secure sign in");
    expect(getMeta("/owner/profile").title).toContain("Business workspace");
    expect(getMeta("/admin/categories").title).toContain("Administration");
  });

  it("builds the deployed canonical URL for every route class", () => {
    expect(resolveCanonical("https://just-finds.manus.space", "/categories")).toBe("https://just-finds.manus.space/categories");
    expect(resolveCanonical("https://just-finds.manus.space/", "/owner/profile")).toBe("https://just-finds.manus.space/owner/profile");
  });
});
