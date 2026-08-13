import { describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  deleteInternalValidationBusiness: vi.fn(),
  getDb: vi.fn(),
  getOwnerBusinesses: vi.fn(),
  getAdminCounts: vi.fn(),
  getCategorySchemas: vi.fn(),
  getPendingBusinesses: vi.fn(),
  getInternalValidationBusinesses: vi.fn(),
}));

vi.mock("../db", () => dbMocks);
vi.mock("../storage", () => ({ storagePut: vi.fn() }));

import { workspaceRouter } from "./workspaces";

describe("internal test-listing cleanup contract", () => {
  it("enforces administrator access, exact confirmation, and the internal-listing-only database guard", async () => {
    const owner = workspaceRouter.createCaller({ user: { id: 4, role: "business_owner" } } as never);
    await expect(owner.deleteInternalValidationBusiness({ businessId: 73, confirmation: "DELETE TEST LISTING" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(dbMocks.deleteInternalValidationBusiness).not.toHaveBeenCalled();

    const admin = workspaceRouter.createCaller({ user: { id: 1, role: "admin" } } as never);
    await expect(admin.deleteInternalValidationBusiness({ businessId: 73, confirmation: "delete test listing" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMocks.deleteInternalValidationBusiness).not.toHaveBeenCalled();

    dbMocks.deleteInternalValidationBusiness.mockResolvedValueOnce(false);
    await expect(admin.deleteInternalValidationBusiness({ businessId: 73, confirmation: "DELETE TEST LISTING" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(dbMocks.deleteInternalValidationBusiness).toHaveBeenLastCalledWith(73);

    dbMocks.deleteInternalValidationBusiness.mockResolvedValueOnce(true);
    await expect(admin.deleteInternalValidationBusiness({ businessId: 73, confirmation: "DELETE TEST LISTING" })).resolves.toEqual({ deleted: true });
  });
});
