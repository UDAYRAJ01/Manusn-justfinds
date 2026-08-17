import { describe, expect, it } from "vitest";
import { sortSavedListings } from "./Saved";

const listings = [
  { id: 1, name: "Zed Clinic", slug: "zed-clinic", shortDescription: null, address: "Mall Road", isVerified: false, category: "Healthcare", categorySlug: "healthcare", city: "Kanpur", citySlug: "kanpur", locality: null, savedAt: "2026-08-01T10:00:00.000Z" },
  { id: 2, name: "Aarohan Studio", slug: "aarohan-studio", shortDescription: null, address: "Civil Lines", isVerified: true, category: "Wellness", categorySlug: "wellness", city: "Lucknow", citySlug: "lucknow", locality: "Hazratganj", savedAt: "2026-08-03T10:00:00.000Z" },
];

describe("sortSavedListings", () => {
  it("keeps the most recently saved factual record first by default", () => {
    expect(sortSavedListings(listings, "recent").map(item => item.id)).toEqual([2, 1]);
  });

  it("supports lightweight business-name and city ordering without generating records", () => {
    expect(sortSavedListings(listings, "name").map(item => item.name)).toEqual(["Aarohan Studio", "Zed Clinic"]);
    expect(sortSavedListings(listings, "city").map(item => item.city)).toEqual(["Kanpur", "Lucknow"]);
  });
});
