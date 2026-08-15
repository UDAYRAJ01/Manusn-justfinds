import { describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getActiveCategories: vi.fn(async () => []),
  getPublicCategoryBySlug: vi.fn(async () => undefined),
  getPublicSubcategories: vi.fn(async () => []),
  getPublicBusinessTypes: vi.fn(async () => []),
  getPublicBusinessByRoute: vi.fn(async () => null),
  getPublicBusinesses: vi.fn(async () => []),
  getPublicSearchPage: vi.fn(async () => ({ total: 0, items: [], nextOffset: null })),
  logPublicSearch: vi.fn(async () => undefined),
  logPublicInteraction: vi.fn(async () => undefined),
  getPublicSavedBusiness: vi.fn(async () => false),
  togglePublicSavedBusiness: vi.fn(async () => ({ saved: true, reason: "saved" })),
  createPublicBusinessReview: vi.fn(async () => ({ ok: true, reason: "created", review: { id: 22, status: "pending" } })),
  reportPublicBusinessReview: vi.fn(async () => ({ ok: true, reason: "reported" })),
  getPublicCertificateVerification: vi.fn(async () => ({ valid: true, business: { id: 13, name: "Published business", slug: "published-business", address: "Verified address" }, certificate: { certificateId: "JF-TEST" }, verification: { status: "verified" } })),
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
    const results = await caller.search({ query: "dentist near Mall Road", city: "kanpur", locality: "mall-road", category: "healthcare", subcategory: "dentists", businessType: "dental-clinic", latitude: 26.45, longitude: 80.33, sort: "nearby", verified: true, sessionId: "browser-session", limit: 10, offset: 0 });
    expect(results).toEqual(expect.objectContaining({ total: 0, items: [], nextOffset: null, sort: "nearby", intent: expect.objectContaining({ searchTerm: "dentist", locationTerm: "Mall Road" }) }));
    expect(dbMocks.getPublicSearchPage).toHaveBeenCalledWith(expect.objectContaining({ query: "dentist", citySlug: "kanpur", localitySlug: "mall-road", categorySlug: "healthcare", subcategorySlug: "dentists", businessTypeSlug: "dental-clinic", sort: "nearby", verified: true, limit: 10, offset: 0 }));
    expect(dbMocks.logPublicSearch).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, sessionId: "browser-session", resultCount: 0, intent: "nearby" }));
  });

  it("exposes only the taxonomy entries supplied by the published-listing data layer", async () => {
    dbMocks.getActiveCategories.mockResolvedValueOnce([{ id: 10, name: "Healthcare", slug: "healthcare" }]);
    dbMocks.getPublicSubcategories.mockResolvedValueOnce([{ id: 20, name: "Dentists", slug: "dentists" }]);
    dbMocks.getPublicBusinessTypes.mockResolvedValueOnce([{ id: 30, name: "Dental clinics", slug: "dental-clinic" }]);
    const caller = discoveryRouter.createCaller({} as never);

    await expect(caller.categories()).resolves.toEqual([{ id: 10, name: "Healthcare", slug: "healthcare" }]);
    await expect(caller.subcategories({ category: "healthcare" })).resolves.toEqual([{ id: 20, name: "Dentists", slug: "dentists" }]);
    await expect(caller.businessTypes({ category: "healthcare", subcategory: "dentists" })).resolves.toEqual([{ id: 30, name: "Dental clinics", slug: "dental-clinic" }]);
    expect(dbMocks.getPublicSubcategories).toHaveBeenCalledWith("healthcare");
    expect(dbMocks.getPublicBusinessTypes).toHaveBeenCalledWith("healthcare", "dentists");
  });

  it("records listing engagement without requiring an authenticated session", async () => {
    const caller = discoveryRouter.createCaller({} as never);
    await expect(caller.interaction({ businessId: 13, action: "directions", query: "dentist", sessionId: "anonymous-session" })).resolves.toEqual({ ok: true });
    expect(dbMocks.logPublicInteraction).toHaveBeenCalledWith({ businessId: 13, action: "directions", query: "dentist", sessionId: "anonymous-session", userId: undefined });
    await expect(caller.interaction({ businessId: 13, action: "share", sessionId: "anonymous-session" })).resolves.toEqual({ ok: true });
    expect(dbMocks.logPublicInteraction).toHaveBeenCalledWith({ businessId: 13, action: "share", sessionId: "anonymous-session", userId: undefined });
  });

  it("keeps authenticated profile actions behind the protected procedure and forwards the user id", async () => {
    const caller = discoveryRouter.createCaller({ user: { id: 7 } } as never);
    await expect(caller.saved({ businessId: 13 })).resolves.toBe(false);
    await expect(caller.toggleSave({ businessId: 13 })).resolves.toEqual({ saved: true, reason: "saved" });
    await expect(caller.submitReview({ businessId: 13, rating: 5, content: "Helpful firsthand detail" })).resolves.toEqual(expect.objectContaining({ ok: true, reason: "created" }));
    await expect(caller.reportReview({ reviewId: 22, reason: "Needs review", details: "Please check this report." })).resolves.toEqual({ ok: true, reason: "reported" });
    expect(dbMocks.getPublicSavedBusiness).toHaveBeenCalledWith(7, 13);
    expect(dbMocks.togglePublicSavedBusiness).toHaveBeenCalledWith(7, 13);
    expect(dbMocks.createPublicBusinessReview).toHaveBeenCalledWith({ userId: 7, businessId: 13, rating: 5, content: "Helpful firsthand detail" });
    expect(dbMocks.reportPublicBusinessReview).toHaveBeenCalledWith({ reporterId: 7, reviewId: 22, reason: "Needs review", details: "Please check this report." });
  });

  it("exposes only the public certificate verification contract", async () => {
    const caller = discoveryRouter.createCaller({} as never);
    await expect(caller.certificate({ slug: "published-business" })).resolves.toEqual(expect.objectContaining({ valid: true, certificate: { certificateId: "JF-TEST" } }));
    expect(dbMocks.getPublicCertificateVerification).toHaveBeenCalledWith("published-business");
  });
});
