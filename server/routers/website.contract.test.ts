import { describe, expect, it } from "vitest";
import { defaultDesignConfig, sectionRegistry, websiteRouter } from "./website";

describe("Phase 7 website builder contracts", () => {
  it("exposes the shared section registry without fabricated business content", () => {
    const types = sectionRegistry.map(section => section.type);
    expect(types).toContain("hero");
    expect(types).toContain("services");
    expect(types).toContain("contact");
    expect(types).toContain("cta");
    expect(types).not.toContain("testimonial");
    expect(sectionRegistry.find(section => section.type === "menu")?.allowedCategories).toContain("restaurant");
  });

  it("keeps redesign defaults limited to presentation controls", () => {
    expect(defaultDesignConfig).toMatchObject({ theme: "modern", typography: "clean", primary: "#2456c8" });
    expect(Object.keys(defaultDesignConfig)).not.toContain("businessName");
    expect(Object.keys(defaultDesignConfig)).not.toContain("reviewText");
    expect(Object.keys(defaultDesignConfig)).not.toContain("rating");
  });

  it("exposes the owner-scoped draft and publishing procedure surface", () => {
    expect(Object.keys(websiteRouter._def.procedures)).toEqual(expect.arrayContaining(["builder", "saveDraft", "publish", "unpublish", "restore", "duplicateOwnDesign", "track", "publicPage"]));
  });

  it("supports category-specific sections while retaining universal sections", () => {
    const universal = sectionRegistry.filter(section => section.allowedCategories.includes("all"));
    const restaurantOnly = sectionRegistry.filter(section => section.allowedCategories.includes("restaurant"));
    const hotelOnly = sectionRegistry.filter(section => section.allowedCategories.includes("hotel"));
    expect(universal.length).toBeGreaterThan(5);
    expect(restaurantOnly.map(section => section.type)).toContain("menu");
    expect(hotelOnly.map(section => section.type)).toContain("rooms");
  });
});
