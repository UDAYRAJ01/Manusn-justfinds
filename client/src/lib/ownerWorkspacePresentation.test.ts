import { describe, expect, it } from "vitest";
import { getOwnerWorkspaceSummary } from "./ownerWorkspacePresentation";

describe("getOwnerWorkspaceSummary", () => {
  it("describes draft work as private and completeness-led", () => {
    expect(getOwnerWorkspaceSummary("draft", 40)).toEqual({ label: "Private draft", detail: "Complete the remaining listing facts before submitting this 40% complete profile for review.", tone: "draft" });
  });

  it("keeps review messaging factual without fabricating metrics", () => {
    expect(getOwnerWorkspaceSummary("under_review", 85)).toMatchObject({ label: "In review", tone: "review" });
  });

  it("only calls the listing public after a published status", () => {
    expect(getOwnerWorkspaceSummary("published", 100).detail).toContain("public profile");
    expect(getOwnerWorkspaceSummary("submitted", 100).detail).not.toContain("public profile");
  });
});
