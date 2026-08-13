import { describe, expect, it } from "vitest";
import { validateGeneratedContent } from "./content";
import type { BusinessAiFacts } from "./types";

const mockFacts: BusinessAiFacts = {
  business: {
    id: 1,
    name: "Apex Cafe",
    address: "123 Main St",
    postcode: "94101",
    phone: "555-0192",
    whatsapp: null,
    email: "contact@apexcafe.test",
    website: "https://apexcafe.test",
    shortDescription: "Specialty coffee and pastries in downtown.",
    approvedDescription: "Specialty coffee and pastries in downtown.",
    latitude: "37.7749",
    longitude: "-122.4194",
    isVerified: true,
    status: "approved",
    category: "Cafe",
    categorySlug: "cafe",
    city: "San Francisco",
    citySlug: "san-francisco",
    locality: "Downtown",
  },
  services: [{ name: "Espresso Bar", description: "Artisan espresso drinks" }],
  hours: [],
  facilities: [{ name: "Free Wi-Fi", details: "High-speed wireless internet" }],
  fields: [],
};

describe("AI FAQ validation and grounding contract", () => {
  it("rejects FAQ content when count is not exactly 10", () => {
    const invalidData = {
      faqs: [
        { question: "What is Apex Cafe?", answer: "Apex Cafe is located at 123 Main St.", sourceFields: ["business.name", "business.address"] },
      ],
    };
    const result = validateGeneratedContent("faq", invalidData, mockFacts);
    expect(result.accepted).toBe(false);
    expect(result.flags).toContain("faq_count_invalid");
  });

  it("filters ungrounded items and accepts exactly 10 grounded items with persisted source fields and status", () => {
    const rawData = {
      faqs: [
        ...Array.from({ length: 10 }).map((_, index) => ({
          question: `What services does Apex Cafe provide at 123 Main St?`,
          answer: `We offer Espresso Bar and Free Wi-Fi in San Francisco.`,
        })),
        {
          question: "Unrelated question about outer space?",
          answer: "Outer space has no relation to Apex Cafe.",
        },
      ],
    };
    const result = validateGeneratedContent("faq", rawData, mockFacts);
    expect(result.accepted).toBe(true);
    expect(result.normalized.faqs?.length).toBe(10);
    expect(result.normalized.faqs?.[0]).toMatchObject({
      question: expect.any(String),
      answer: expect.any(String),
      sourceFields: expect.any(Array),
      status: "grounded",
    });
  });
});
