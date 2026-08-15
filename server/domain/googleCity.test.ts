import { describe, expect, it } from "vitest";
import { googleCityCandidates, resolveGoogleCity } from "./googleCity";

const cities = [
  { id: 1, name: "Kanpur" },
  { id: 2, name: "New Delhi" },
];

describe("Google Places city resolution", () => {
  it("prefers a Google locality that exactly matches an existing Just Finds city", () => {
    const addressComponents = [
      { longText: "Kanpur", shortText: "Kanpur", types: ["locality", "political"] },
      { longText: "Uttar Pradesh", shortText: "UP", types: ["administrative_area_level_1", "political"] },
    ];

    expect(resolveGoogleCity(addressComponents, cities)).toEqual({ id: 1, name: "Kanpur", googleLocality: "Kanpur" });
  });

  it("supports official postal-town address components while retaining the source locality", () => {
    const addressComponents = [{ longText: "New Delhi", shortText: "New Delhi", types: ["postal_town"] }];

    expect(googleCityCandidates(addressComponents)).toEqual(["New Delhi"]);
    expect(resolveGoogleCity(addressComponents, cities)).toEqual({ id: 2, name: "New Delhi", googleLocality: "New Delhi" });
  });

  it("does not create or guess a city when Google locality has no existing match", () => {
    const addressComponents = [{ longText: "Unlisted Town", shortText: "Unlisted Town", types: ["locality"] }];

    expect(resolveGoogleCity(addressComponents, cities)).toBeNull();
  });

  it("rejects a non-Indian or inactive matching city record", () => {
    const addressComponents = [{ longText: "Kanpur", shortText: "Kanpur", types: ["locality"] }];

    expect(resolveGoogleCity(addressComponents, [{ id: 1, name: "Kanpur", country: "US", tier: "tier2", isActive: true }])).toBeNull();
    expect(resolveGoogleCity(addressComponents, [{ id: 1, name: "Kanpur", country: "IN", tier: "tier2", isActive: false }])).toBeNull();
  });
});
