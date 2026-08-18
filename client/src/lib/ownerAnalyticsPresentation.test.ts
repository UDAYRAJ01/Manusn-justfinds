import { describe, expect, it } from "vitest";
import { analyticsEmptyMessage, analyticsSummary, readableAction, recordedInteractionTotal } from "./ownerAnalyticsPresentation";

describe("owner analytics presentation", () => {
  it("summarises only supplied recorded interaction counts", () => {
    expect(analyticsSummary([{ action: "call", count: 2 }, { action: "inquiry", count: 1 }, { action: "impression", count: 9 }], 12, [{ day: "2026-08-17", count: 12 }])).toEqual({ totalInteractions: 12, enquiries: 1, contactActions: 2, activeDays: 1 });
  });

  it("keeps unavailable analytics factual and readable", () => {
    expect(analyticsEmptyMessage(30)).toContain("next 30 days");
    expect(readableAction("website_visit")).toBe("Website Visit");
  });

  it("reads the server analytics object without reducing it and safely rejects unexpected shapes", () => {
    expect(recordedInteractionTotal({ totalInteractions: 14, actions: [{ action: "call", count: 14 }] })).toBe(14);
    expect(recordedInteractionTotal({ totalInteractions: "5" })).toBe(5);
    expect(recordedInteractionTotal([{ count: 9 }])).toBe(0);
    expect(recordedInteractionTotal({ totalInteractions: "not-a-number" })).toBe(0);
    expect(recordedInteractionTotal(null)).toBe(0);
  });
});
