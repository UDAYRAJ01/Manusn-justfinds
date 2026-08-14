import { describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("../db", () => dbMocks);
vi.mock("../storage", () => ({ storagePut: vi.fn() }));

import { workspaceRouter } from "./workspaces";

describe("city creation contract", () => {
  it("rejects non-super-admin users before touching the database", async () => {
    const getDb = dbMocks.getDb;
    const caller = workspaceRouter.createCaller({ user: { id: 7, role: "admin" } } as never);

    await expect(caller.createCity({ name: "Kannur", slug: "kanpur" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Super-administrator access is required.",
    });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("normalizes a mismatched manual slug before inserting for a super admin", async () => {
    const values = vi.fn().mockResolvedValueOnce([{ insertId: 88 }]);
    const insert = vi.fn(() => ({ values }));
    dbMocks.getDb.mockResolvedValue({ insert });
    const caller = workspaceRouter.createCaller({ user: { id: 1, role: "super_admin" } } as never);

    await caller.createCity({ name: "Kannur", slug: "kanpur" });

    expect(values).toHaveBeenCalledWith({ name: "Kannur", slug: "kannur", isActive: true });
  });
});
