import { describe, expect, it } from "vitest";
import { defaultDesignConfig, safeDesignKeys, safeDesignSchema, sectionRegistry, websiteRouter } from "./website";

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

  it("exposes the owner-scoped draft, publishing, and section-management procedure surface", () => {
    expect(Object.keys(websiteRouter._def.procedures)).toEqual(expect.arrayContaining(["create", "builder", "versions", "reorder", "setSectionEnabled", "saveDraft", "submitForReview", "publish", "unpublish", "restore", "duplicateOwnDesign", "track", "publicPage"]));
  });

  it("exposes presentation-only AI and admin moderation contracts", () => {
    expect(Object.keys(websiteRouter._def.procedures)).toEqual(expect.arrayContaining(["suggestRedesign", "applyRedesign", "rejectRedesign", "generateDraft", "regenerateSection", "moderationQueue", "moderate", "templateLibrary"]));
    expect(Object.keys(defaultDesignConfig)).not.toEqual(expect.arrayContaining(["businessName", "address", "serviceDescription", "reviewText", "rating", "testimonial"]));
  });

  it("accepts only presentation keys and rejects business facts", () => {
    expect(safeDesignKeys).not.toContain("businessName");
    expect(safeDesignKeys).not.toContain("address");
    expect(safeDesignKeys).not.toContain("rating");
    const result = safeDesignSchema.safeParse({ ...defaultDesignConfig, businessName: "Invented" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).not.toHaveProperty("businessName");
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
