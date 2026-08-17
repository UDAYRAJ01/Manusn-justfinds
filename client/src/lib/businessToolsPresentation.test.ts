import { describe, expect, it } from "vitest";
import { destructiveActionMessage, getBusinessToolLabel, isSupportedBusinessTool, supportedBusinessTools } from "./businessToolsPresentation";

describe("business tools presentation", () => {
  it("exposes only the currently supported owner tool destinations", () => {
    expect(supportedBusinessTools.map((tool) => tool.key)).toEqual([
      "profile", "photos", "hours", "services", "leads", "availability", "appointments", "verification", "analytics", "website",
    ]);
    expect(isSupportedBusinessTool("offers")).toBe(false);
    expect(isSupportedBusinessTool("analytics")).toBe(true);
  });

  it("falls back to a supported profile title and explains recorded destructive actions", () => {
    expect(getBusinessToolLabel("unknown-route")).toBe("Profile");
    expect(destructiveActionMessage("Delete photo")).toContain("recorded against this business");
  });
});
