import { describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getActiveCategories: vi.fn(async () => []),
  getPublicBusinessByRoute: vi.fn(async () => null),
  getPublicBusinesses: vi.fn(async () => []),
  getPublicSearchPage: vi.fn(async () => ({ total: 0, items: [], nextOffset: null })),
  logPublicSearch: vi.fn(async () => undefined),
  logPublicInteraction: vi.fn(async () => undefined),
}));

vi.mock("../db", () => dbMocks);

import { discoveryRouter } from "./discovery";

describe("public discovery contract", () => {
  it("does not create public suggestions from sample business data when the database is empty", async () => {
    const caller = discoveryRouter.createCaller({} as never);
    const results = await caller.suggestions({ query: "Aarohan" });
    expect(results).toEqual([]);
    expect(results.length).toBeLessThanOrEqual(8);
  });

  it("forwards bounded taxonomy, location, sort, and session context to the database search contract", async () => {
    const caller = discoveryRouter.createCaller({ user: { id: 7 } } as never);
    const results = await caller.search({ query: "dentist near Mall Road", city: "kanpur", locality: "mall-road", category: "healthcare", subcategory: "dentists", latitude: 26.45, longitude: 80.33, sort: "nearby", verified: true, sessionId: "browser-session", limit: 10, offset: 0 });
    expect(results).toEqual(expect.objectContaining({ total: 0, items: [], nextOffset: null, sort: "nearby", intent: expect.objectContaining({ searchTerm: "dentist", locationTerm: "Mall Road" }) }));
    expect(dbMocks.getPublicSearchPage).toHaveBeenCalledWith(expect.objectContaining({ query: "dentist", citySlug: "kanpur", localitySlug: "mall-road", categorySlug: "healthcare", subcategorySlug: "dentists", sort: "nearby", verified: true, limit: 10, offset: 0 }));
    expect(dbMocks.logPublicSearch).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, sessionId: "browser-session", resultCount: 0, intent: "nearby" }));
  });

  it("records listing engagement without requiring an authenticated session", async () => {
    const caller = discoveryRouter.createCaller({} as never);
    await expect(caller.interaction({ businessId: 13, action: "directions", query: "dentist", sessionId: "anonymous-session" })).resolves.toEqual({ ok: true });
    expect(dbMocks.logPublicInteraction).toHaveBeenCalledWith({ businessId: 13, action: "directions", query: "dentist", sessionId: "anonymous-session", userId: undefined });
  });
});
