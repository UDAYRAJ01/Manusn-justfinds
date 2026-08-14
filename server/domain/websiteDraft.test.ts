import { describe, expect, it } from "vitest";
import { canonicalWebsiteSectionTypes, normalizeWebsiteDraft, websiteDraftSystemPrompt } from "./websiteDraft";

describe("grounded website draft domain", () => {
  it("uses canonical sections for a category and ignores unsupported or duplicate sections", () => {
    const draft = normalizeWebsiteDraft({
      seoTitle: "  Factual Restaurant  ",
      metaDescription: "A local restaurant.",
      sections: [
        { sectionType: "menu", config: { headline: "Menu", bullets: ["Fresh meals", "Fresh meals", 42] } },
        { sectionType: "testimonial", config: { body: "Invented review" } },
        { sectionType: "menu", config: { body: "Owner-provided menu information." } },
      ],
    }, "Restaurant");

    expect(draft.sections.map(section => section.sectionType)).toEqual(canonicalWebsiteSectionTypes("Restaurant"));
    expect(draft.sections.find(section => section.sectionType === "menu")?.config).toEqual({ body: "Owner-provided menu information." });
    expect(draft.sections.some(section => section.sectionType === "testimonial")).toBe(false);
  });

  it("limits unsafe copy lengths and keeps the renderer-facing config presentation-only", () => {
    const draft = normalizeWebsiteDraft({
      seoTitle: "A".repeat(400),
      metaDescription: "B".repeat(500),
      sections: [{ sectionType: "hero", config: { headline: "C".repeat(400), businessName: "Invented", rating: 5 } }],
    });
    const hero = draft.sections.find(section => section.sectionType === "hero");

    expect(draft.seoTitle).toHaveLength(180);
    expect(draft.metaDescription).toHaveLength(300);
    expect(hero?.config.headline).toHaveLength(180);
    expect(hero?.config).not.toHaveProperty("businessName");
    expect(hero?.config).not.toHaveProperty("rating");
  });

  it("states the factual grounding rule in the generation system prompt", () => {
    const prompt = websiteDraftSystemPrompt();
    expect(prompt).toContain("approved business facts");
    expect(prompt).toContain("Never invent awards");
    expect(prompt).toContain("renderer remains the source of truth");
  });
});
