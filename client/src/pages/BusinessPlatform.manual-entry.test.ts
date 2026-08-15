import { describe, expect, it } from "vitest";
import { getBusinessPlatformRouteMode, MANUAL_BUSINESS_CREATION_PATH } from "./BusinessPlatform";

describe("manual business creation entry", () => {
  it("keeps the add-business choice separate from the explicit manual onboarding route", () => {
    expect(getBusinessPlatformRouteMode("/business/add")).toBe("add_choice");
    expect(MANUAL_BUSINESS_CREATION_PATH).toBe("/business/add/manual");
    expect(getBusinessPlatformRouteMode(MANUAL_BUSINESS_CREATION_PATH)).toBe("manual_onboarding");
  });

  it("keeps Google import on its explicit route", () => {
    expect(getBusinessPlatformRouteMode("/business/add/import")).toBe("google_import");
  });
});
