import { describe, expect, it } from "vitest";
import { authEntryContent, secureSignInAction } from "./authEntryContent";

describe("normal-user authentication entry content", () => {
  it("keeps every entry route focused on the same secure sign-in action", () => {
    expect(secureSignInAction).toBe("Continue to secure sign-in");
    expect(Object.keys(authEntryContent)).toEqual(["/login", "/signup", "/forgot-password"]);
  });

  it("does not introduce administrative access language into the normal entry copy", () => {
    const copy = JSON.stringify(authEntryContent).toLowerCase();
    expect(copy).not.toContain("admin");
    expect(copy).not.toContain("administrator");
  });
});
