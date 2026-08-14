import { afterEach, describe, expect, it, vi } from "vitest";
import { autocompleteOfficialPlaces, getOfficialPlaceDetail } from "./googlePlaces";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("official Google Places client", () => {
  it("uses the server-only credential and permitted autocomplete field mask without returning that credential", async () => {
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "server-only-test-key");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ suggestions: [{ placePrediction: { placeId: "ChIJ123", text: { text: "Vishnoi Face Hospital" }, structuredFormat: { mainText: { text: "Vishnoi Face Hospital" }, secondaryText: { text: "Kanpur" } }, types: ["hospital"] } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const results = await autocompleteOfficialPlaces({ query: "Vishnoi", locationText: "Kanpur", sessionToken: "a1b2c3d4e5f6" });

    expect(results).toEqual([{ placeId: "ChIJ123", text: "Vishnoi Face Hospital", primaryText: "Vishnoi Face Hospital", secondaryText: "Kanpur", types: ["hospital"] }]);
    expect(fetchMock).toHaveBeenCalledWith("https://places.googleapis.com/v1/places:autocomplete", expect.objectContaining({ headers: expect.objectContaining({ "X-Goog-Api-Key": "server-only-test-key", "X-Goog-FieldMask": expect.stringContaining("placeId") }) }));
    expect(JSON.stringify(results)).not.toContain("server-only-test-key");
  });

  it("maps only permitted factual detail fields and keeps ratings, reviews, and photos absent", async () => {
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "server-only-test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "ChIJ123", displayName: { text: "Vishnoi Face Hospital" }, formattedAddress: "Kanpur, Uttar Pradesh", primaryType: "hospital", nationalPhoneNumber: "+91 512 123 4567", websiteUri: "https://example.test", location: { latitude: 26.4499, longitude: 80.3319 }, regularOpeningHours: { weekdayDescriptions: ["Monday: 09:00 – 17:00"], periods: [{ open: { day: 1, hour: 9, minute: 0 }, close: { day: 1, hour: 17, minute: 0 } }] }, rating: 4.9, reviews: [{ text: "Do not import" }], photos: [{ name: "Do not import" }] }), { status: 200 })));

    const detail = await getOfficialPlaceDetail("ChIJ123", "a1b2c3d4e5f6");

    expect(detail).toMatchObject({ placeId: "ChIJ123", displayName: "Vishnoi Face Hospital", phone: "+91 512 123 4567", website: "https://example.test", latitude: "26.4499", longitude: "80.3319" });
    expect(detail).not.toHaveProperty("rating");
    expect(detail).not.toHaveProperty("reviews");
    expect(detail).not.toHaveProperty("photos");
  });

  it("returns a safe retryable error when the official service rate-limits discovery", async () => {
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "server-only-test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 429 })));

    await expect(autocompleteOfficialPlaces({ query: "Hospital" })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS", message: expect.stringContaining("wait") });
  });
});
