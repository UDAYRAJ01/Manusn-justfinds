import { describe, expect, it } from "vitest";
import { businessRouter } from "./business";

const procedures = Object.keys((businessRouter as unknown as { _def: { procedures: Record<string, unknown> } })._def.procedures);

describe("business router contracts", () => {
  it("exposes the owner workspace lifecycle and claim workflow", () => {
    expect(procedures).toEqual(expect.arrayContaining([
      "myBusinesses",
      "businessDetail",
      "createDraft",
      "saveOnboardingStep",
      "submitForApproval",
      "searchDirectory",
      "requestClaim",
      "myClaims",
    ]));
  });

  it("exposes owner-scoped management tools without review or customer-data shortcuts", () => {
    expect(procedures).toEqual(expect.arrayContaining([
      "setHours",
      "saveSpecialHour",
      "upsertService",
      "upsertItem",
      "savePhoto",
      "listReviews",
      "respondToReview",
      "listLeads",
      "updateLead",
      "listOffers",
      "saveOffer",
      "saveSeo",
      "notifications",
      "saveSettings",
    ]));
    expect(procedures).not.toContain("seedReviews");
    expect(procedures).not.toContain("mockAnalytics");
  });
});
