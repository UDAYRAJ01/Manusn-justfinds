import { describe, expect, it } from "vitest";

const GOOGLE_PLACES_AUTOCOMPLETE_URL =
  "https://places.googleapis.com/v1/places:autocomplete";

describe("GOOGLE_PLACES_API_KEY", () => {
  it("authorizes a lightweight official Places Autocomplete request", async () => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    expect(apiKey, "GOOGLE_PLACES_API_KEY must be configured for official import").toBeTruthy();

    const response = await fetch(GOOGLE_PLACES_AUTOCOMPLETE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey!,
        "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
      },
      body: JSON.stringify({
        input: "hospital Kanpur",
        includedRegionCodes: ["in"],
        sessionToken: `jf-${Date.now()}-places`,
      }),
    });

    const body = await response.text();
    expect(response.ok, `Google Places validation failed (${response.status}): ${body}`).toBe(true);
  }, 20_000);
});
