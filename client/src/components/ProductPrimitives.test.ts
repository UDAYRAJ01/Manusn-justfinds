import { describe, expect, it } from "vitest";
import { isNavigationItemActive, statusToneClasses } from "./ProductPrimitives";

describe("product primitives", () => {
  it("maps semantic status tones to distinct token-driven styles", () => {
    expect(statusToneClasses.positive).toContain("emerald");
    expect(statusToneClasses.warning).toContain("amber");
    expect(statusToneClasses.danger).toContain("rose");
  });

  it("keeps root navigation from matching every route while allowing nested workspaces", () => {
    expect(isNavigationItemActive("/search", { href: "/" })).toBe(false);
    expect(isNavigationItemActive("/business/120001/analytics", { href: "/business" })).toBe(true);
    expect(isNavigationItemActive("/saved", { href: "/search" })).toBe(false);
  });
});
