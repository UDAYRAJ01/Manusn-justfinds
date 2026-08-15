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
      .mockResolvedValueOnce([{ id: 1 }])
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
    const occupiedRows = [[{ id: 1 }], [{ id: 1 }], [{ id: 2 }], []] as Array<Array<{ id: number }>>;
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

  it("lets an ordinary authenticated user create a private first draft and promotes only that user to business owner", async () => {
    const values = vi.fn().mockResolvedValue([{ insertId: 46 }]);
    const insert = vi.fn(() => ({ values }));
    const roleWhere = vi.fn(async () => undefined);
    const roleSet = vi.fn(() => ({ where: roleWhere }));
    const update = vi.fn(() => ({ set: roleSet }));
    const limit = vi.fn()
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValue([]);
    const whereSelect = vi.fn(() => ({ limit }));
    const from = vi.fn(() => ({ where: whereSelect }));
    const select = vi.fn(() => ({ from }));
    dbMocks.getDb.mockResolvedValue({ insert, select, update });

    const caller = workspaceRouter.createCaller({ user: { id: 71, role: "user" } } as never);
    await expect(caller.createBusiness({
      name: "First owner listing",
      categoryId: 1,
      cityId: 1,
      address: "123 Verified Main Street",
      shortDescription: "A factual first private draft created by an authenticated ordinary user.",
      latitude: "18.520430",
      longitude: "73.856744",
      dynamicValues: [],
    })).resolves.toEqual({ businessId: 46, status: "draft" });

    expect(values).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 71, status: "draft" }));
    expect(roleSet).toHaveBeenCalledWith({ role: "business_owner" });
  });

  it("keeps a newly promoted owner from mutating a different owner’s listing", async () => {
    const limit = vi.fn(async () => [{ id: 88, ownerId: 72, status: "draft", name: "Another owner listing", approvedDescription: null }]);
    const whereSelect = vi.fn(() => ({ limit }));
    const from = vi.fn(() => ({ where: whereSelect }));
    const select = vi.fn(() => ({ from }));
    const update = vi.fn();
    dbMocks.getDb.mockResolvedValue({ select, update });

    const caller = workspaceRouter.createCaller({ user: { id: 71, role: "business_owner" } } as never);
    await expect(caller.updateBusiness({ businessId: 88, name: "Attempted foreign change" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "You cannot manage this business.",
    });
    expect(update).not.toHaveBeenCalled();
  });
});
