import { describe, expect, it } from "vitest";
import { canManageBusiness } from "../domain/permissions";

describe("business switcher isolation", () => {
  it("allows a business owner to manage only their own business", () => {
    expect(canManageBusiness("business_owner", 12, 12)).toBe(true);
    expect(canManageBusiness("business_owner", 12, 13)).toBe(false);
  });

  it("does not grant ordinary users owner access through a business id", () => {
    expect(canManageBusiness("user", 12, 12)).toBe(false);
    expect(canManageBusiness("user", 12, 13)).toBe(false);
  });

  it("allows moderators to inspect businesses without weakening owner checks for normal users", () => {
    expect(canManageBusiness("admin", 7, 12)).toBe(true);
    expect(canManageBusiness("super_admin", 7, 12)).toBe(true);
    expect(canManageBusiness("user", 7, 12)).toBe(false);
  });
});
