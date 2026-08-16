import { describe, expect, it } from "vitest";
import { canApplyApprovedAboutToListing, canApplyApprovedContentToListing, validateGeneratedContent } from "./content";
import { buildChatPrompt, buildContentPrompt } from "./prompts";
import type { BusinessAiFacts } from "./types";

const facts: BusinessAiFacts = {
  business: {
    id: 7,
    name: "North Star Dental",
    address: "12 Market Road",
    postcode: "400001",
    phone: "555-0100",
    whatsapp: null,
    email: null,
    website: null,
    shortDescription: "Dental clinic in Mumbai.",
    approvedDescription: "A dental clinic in Mumbai.",
    latitude: "19.0760",
    longitude: "72.8777",
    isVerified: true,
    status: "published",
    category: "Dental Clinic",
    categorySlug: "dental-clinics",
    city: "Mumbai",
    citySlug: "mumbai",
    locality: "Fort",
  },
  services: [{ name: "Dental consultation", description: "Appointments for consultations." }],
  hours: [{ dayOfWeek: 1, opensAt: "09:00", closesAt: "17:00", isClosed: false, isTwentyFourHours: false }],
  facilities: [],
  fields: [],
};

describe("Phase 5 factual content guardrails", () => {
  it("accepts a factual short description and preserves the structured result", () => {
    const result = validateGeneratedContent("short_description", { text: "North Star Dental is a dental clinic in Mumbai." }, facts);
    expect(result.accepted).toBe(true);
    expect(result.flags).toEqual([]);
  });

  it("rejects unsupported claims and numeric facts not present in source data", () => {
    const result = validateGeneratedContent("about_business", { text: "The best clinic with 9999 happy patients and guaranteed results." }, facts);
    expect(result.accepted).toBe(false);
    expect(result.flags).toEqual(expect.arrayContaining(["unsupported_claim_language", "unsupported_numeric_claim"]));
  });

  it("does not put hidden instructions into the factual prompt contract", () => {
    const prompt = buildContentPrompt("about_business", facts as unknown as Record<string, unknown>);
    expect(prompt.system).toContain("Never fabricate");
    expect(prompt.user).toContain("North Star Dental");
  });

  it("uses an exact fallback instruction for isolated business chat", () => {
    const prompt = buildChatPrompt({ name: "North Star Dental" }, "What is your price?");
    expect(prompt.system).toContain("I don't have that information for this business.");
    expect(prompt.user).toBe("What is your price?");
  });

  it("allows only an approved About draft to update the business listing", () => {
    expect(canApplyApprovedAboutToListing("about_business", "approved")).toBe(true);
    expect(canApplyApprovedAboutToListing("about_business", "pending_review")).toBe(false);
    expect(canApplyApprovedAboutToListing("seo_title", "approved")).toBe(false);
  });

  it("allows approved SEO and FAQ drafts, but never pending or unsupported content, to update a private listing", () => {
    expect(canApplyApprovedContentToListing("about_business", "approved")).toBe(true);
    expect(canApplyApprovedContentToListing("seo_title", "approved")).toBe(true);
    expect(canApplyApprovedContentToListing("meta_description", "approved")).toBe(true);
    expect(canApplyApprovedContentToListing("faq", "approved")).toBe(true);
    expect(canApplyApprovedContentToListing("faq", "pending_review")).toBe(false);
    expect(canApplyApprovedContentToListing("business_highlights", "approved")).toBe(false);
  });
});
