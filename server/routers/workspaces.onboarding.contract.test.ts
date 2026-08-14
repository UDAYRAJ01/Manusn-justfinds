import { describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  getOwnerBusinesses: vi.fn(async () => []),
  getAdminCounts: vi.fn(async () => ({})),
  getCategorySchemas: vi.fn(async () => []),
  getPendingBusinesses: vi.fn(async () => []),
}));

vi.mock("../db", () => dbMocks);
vi.mock("../storage", () => ({ storagePut: vi.fn() }));

import { workspaceRouter } from "./workspaces";

describe("guided owner onboarding moderation contract", () => {
  it("creates a private draft and submits that owned draft to the approval queue", async () => {
    const values = vi.fn()
      .mockResolvedValueOnce([{ insertId: 44 }])
      .mockResolvedValueOnce(undefined);
    const insert = vi.fn(() => ({ values }));
    const whereUpdate = vi.fn(async () => undefined);
    const setUpdate = vi.fn(() => ({ where: whereUpdate }));
    const update = vi.fn(() => ({ set: setUpdate }));
    const limit = vi.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValue([{ id: 44, ownerId: 7, status: "draft" }]);
    const whereSelect = vi.fn(() => ({ limit }));
    const from = vi.fn(() => ({ where: whereSelect }));
    const select = vi.fn(() => ({ from }));
    dbMocks.getDb.mockResolvedValue({ insert, update, select });

    const caller = workspaceRouter.createCaller({ user: { id: 7, role: "business_owner" } } as never);
    const draft = await caller.createBusiness({
      name: "Owner supplied business",
      slug: "owner-supplied-business",
      categoryId: 1,
      cityId: 1,
      address: "Verified address supplied by the owner",
      shortDescription: "Factual owner-supplied description that is ready for administrator review.",
      latitude: "18.520430",
      longitude: "73.856744",
      dynamicValues: [],
    });
    const submission = await caller.submitBusiness({ businessId: draft.businessId });

    expect(draft).toEqual({ businessId: 44, status: "draft" });
    expect(setUpdate).toHaveBeenCalledWith({ status: "submitted" });
    expect(values).toHaveBeenLastCalledWith(expect.objectContaining({
      entityType: "business",
      businessId: 44,
      submittedById: 7,
      status: "pending",
    }));
    expect(submission).toEqual({ status: "submitted" });
  });

  it("generates later numeric suffixes when legacy createBusiness encounters occupied slugs", async () => {
    const values = vi.fn().mockResolvedValueOnce([{ insertId: 45 }]);
    const insert = vi.fn(() => ({ values }));
    const occupiedRows = [[{ id: 1 }], [{ id: 2 }], []] as Array<Array<{ id: number }>>;
    const limit = vi.fn(async () => occupiedRows.shift() ?? []);
    const whereSelect = vi.fn(() => ({ limit }));
    const from = vi.fn(() => ({ where: whereSelect }));
    const select = vi.fn(() => ({ from }));
    dbMocks.getDb.mockResolvedValue({ insert, select, update: vi.fn() });

    const caller = workspaceRouter.createCaller({ user: { id: 7, role: "business_owner" } } as never);
    await caller.createBusiness({
      name: "Owner supplied business",
      slug: "owner-supplied-business",
      categoryId: 1,
      cityId: 1,
      address: "Verified address supplied by the owner",
      shortDescription: "Factual owner-supplied description.",
      latitude: "18.520430",
      longitude: "73.856744",
      dynamicValues: [],
    });

    expect(values).toHaveBeenCalledWith(expect.objectContaining({ slug: "owner-supplied-business-3" }));
  });
});
