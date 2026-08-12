import { describe, expect, it } from "vitest";
import { canManageBusiness, canModerate } from "./permissions";

describe("Just Finds role boundaries", () => {
  it("allows a business owner to manage only their own profile", () => {
    expect(canManageBusiness("business_owner", 7, 7)).toBe(true);
    expect(canManageBusiness("business_owner", 7, 8)).toBe(false);
  });

  it("allows admins but not standard users to moderate", () => {
    expect(canModerate("admin")).toBe(true);
    expect(canModerate("super_admin")).toBe(true);
    expect(canModerate("user")).toBe(false);
  });

  it("never lets a business owner cross into another business data boundary", () => {
    expect(canManageBusiness("business_owner", 41, 42)).toBe(false);
    expect(canManageBusiness("user", 41, 41)).toBe(false);
    expect(canManageBusiness("admin", 41, 42)).toBe(true);
  });
});
