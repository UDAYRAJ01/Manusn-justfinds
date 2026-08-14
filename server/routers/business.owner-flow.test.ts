import { beforeEach, describe, expect, it, vi } from "vitest";
import { businessRouter } from "./business";

const state = vi.hoisted(() => ({
  business: { id: 7, ownerId: 42, status: "draft", onboardingStep: 1, name: "Test business", categoryId: 1, cityId: 1 },
  claimRows: [] as Array<{ id: number }>,
  updates: [] as unknown[],
  inserts: [] as unknown[],
}));

vi.mock("../db", () => ({
  getDb: vi.fn(async () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => {
            if (state.claimRows.length) return state.claimRows;
            return [state.business];
          },
          orderBy: async () => [],
        }),
      }),
    }),
    insert: () => ({ values: async (values: unknown) => { state.inserts.push(values); return [{ insertId: 99 }]; } }),
    update: () => ({ set: (values: unknown) => ({ where: async () => { state.updates.push(values); } }) }),
    delete: () => ({ where: async () => undefined }),
  })),
}));

const caller = (userId = 99, role: "user" | "business_owner" = "business_owner") => businessRouter.createCaller({
  user: { id: userId, openId: "owner", name: "Owner", email: null, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {} as never,
  res: {} as never,
});

describe("business owner flow behavior", () => {
  beforeEach(() => {
    state.inserts = [];
    state.updates = [];
    state.claimRows = [];
    state.business.ownerId = 42;
  });

  it("lets an authenticated user create a private draft and promotes owner access", async () => {
    state.inserts = [];
    state.updates = [];
    const result = await caller(77, "user").createDraft({
      name: "New Local Business",
      slug: "new-local-business",
      categoryId: 1,
      cityId: 1,
      address: "123 Verified Main Street",
      shortDescription: "A factual local business description.",
      aboutDescription: "A factual local business description for the private draft.",
    });
    expect(result).toEqual({ businessId: 99, status: "draft" });
    expect(state.inserts).toContainEqual(expect.objectContaining({ ownerId: 77, status: "draft" }));
    expect(state.updates).toContainEqual({ role: "business_owner" });
    state.business.ownerId = 77;
    await expect(caller(77, "user").setHours({ businessId: 99, days: Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, opensAt: "09:00", closesAt: "17:00", intervals: [{ opensAt: "09:00", closesAt: "17:00" }], isClosed: false, isTwentyFourHours: false })) })).resolves.toEqual({ success: true });
  });

  it("rejects invalid listing profile input before touching the database", async () => {
    await expect(caller(77, "user").createDraft({ name: "X", slug: "Bad Slug", categoryId: 1, cityId: 1, address: "Short" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.inserts).toHaveLength(0);
  });

  it("rejects a self-claim before creating a claim row", async () => {
    state.claimRows = [];
    await expect(caller(42).requestClaim({ businessId: 7, evidenceNote: "I operate here" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.inserts).toHaveLength(0);
  });

  it("rejects a duplicate claim already under review", async () => {
    state.claimRows = [{ id: 55 }];
    await expect(caller(99).requestClaim({ businessId: 7 })).rejects.toMatchObject({ code: "CONFLICT" });
    state.claimRows = [];
  });

  it("rejects malformed weekly intervals at the procedure boundary", async () => {
    const days = Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, opensAt: "09:00", closesAt: "17:00", intervals: [{ opensAt: "9am", closesAt: "17:00" }], isClosed: false, isTwentyFourHours: false }));
    await expect(caller().setHours({ businessId: 7, days })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects an offer whose end date is not after its start date", async () => {
    await expect(caller(42).saveOffer({ businessId: 7, title: "Current offer", startsAt: "2026-08-14T10:00:00.000Z", endsAt: "2026-08-14T09:00:00.000Z" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("refreshes expired active offers before returning the owner list", async () => {
    const result = await caller(42).listOffers({ businessId: 7 });
    expect(result).toEqual([]);
    expect(state.updates.length).toBeGreaterThan(0);
  });
});

