import { describe, expect, it } from "vitest";
import { approvedIndiaCities, findApprovedIndiaCity, isApprovedIndiaTierCity } from "./approvedIndiaCities";

describe("approved India city catalogue", () => {
  it("contains only India Tier-1 and Tier-2 city records", () => {
    expect(approvedIndiaCities).toHaveLength(49);
    expect(approvedIndiaCities.every(city => city.country === "IN" && (city.tier === "tier1" || city.tier === "tier2"))).toBe(true);
  });

  it("resolves known aliases without allowing unsupported cities", () => {
    expect(findApprovedIndiaCity("Bangalore")?.slug).toBe("bengaluru");
    expect(findApprovedIndiaCity("Vizag")?.slug).toBe("visakhapatnam");
    expect(findApprovedIndiaCity("Kannur")).toBeUndefined();
  });

  it("requires both an approved country/tier boundary and a catalogue city", () => {
    expect(isApprovedIndiaTierCity({ name: "Kanpur", slug: "kanpur", country: "IN", tier: "tier2" })).toBe(true);
    expect(isApprovedIndiaTierCity({ name: "Kannur", slug: "kannur", country: "IN", tier: "tier2" })).toBe(false);
    expect(isApprovedIndiaTierCity({ name: "Kanpur", slug: "kanpur", country: "US", tier: "tier2" })).toBe(false);
  });
});
