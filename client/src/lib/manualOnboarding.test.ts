import { describe, expect, it } from "vitest";
import { getManualOnboardingErrors, isManualOnboardingIdentityReady, isManualOnboardingLocationReady, MANUAL_ONBOARDING_STEPS } from "./manualOnboarding";

const complete = { name: "Northside Clinic", categoryId: "3", cityId: "8", address: "14 Market Road, Jaipur", description: "A factual clinic description for local customers.", phone: "", email: "" };

describe("manual onboarding rules", () => {
  it("keeps the required owner workflow to ten clear steps", () => {
    expect(MANUAL_ONBOARDING_STEPS).toHaveLength(10);
    expect(MANUAL_ONBOARDING_STEPS.map(step => step.key)).toEqual(["identity", "location", "contact", "hours", "services", "facilities", "media", "content", "seo", "review"]);
  });

  it("requires factual identity and approved-city location facts before a draft can be created", () => {
    expect(isManualOnboardingIdentityReady(complete)).toBe(true);
    expect(isManualOnboardingLocationReady(complete)).toBe(true);
    expect(getManualOnboardingErrors({ ...complete, cityId: "", description: "too short", email: "not-an-email" })).toMatchObject({ cityId: expect.any(String), description: expect.any(String), email: expect.any(String) });
  });
});
