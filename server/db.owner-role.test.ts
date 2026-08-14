import { describe, expect, it } from "vitest";
import { resolveSyncedUserRole } from "./db";

describe("resolveSyncedUserRole", () => {
  it("keeps the configured project owner as super_admin when OAuth supplies no role", () => {
    expect(resolveSyncedUserRole("project-owner", undefined, "project-owner")).toBe("super_admin");
  });

  it("does not elevate ordinary authenticated users", () => {
    expect(resolveSyncedUserRole("ordinary-user", undefined, "project-owner")).toBe("user");
  });

  it("preserves an explicitly supplied application role", () => {
    expect(resolveSyncedUserRole("ordinary-user", "business_owner", "project-owner")).toBe("business_owner");
  });
});

