import { describe, expect, it } from "vitest";
import { hasCoordinates, markerClassName, type SearchMapItem } from "./SearchResultsMap";

const coordinateFree: SearchMapItem = { id: 1, name: "Coordinate-free listing", locality: "Central", city: "Example", latitude: null, longitude: null };
const mapped: SearchMapItem = { id: 2, name: "Mapped listing", locality: "Central", city: "Example", latitude: 26.45, longitude: 80.33 };

describe("search result map selection helpers", () => {
  it("allows only actual stored coordinates to become map markers", () => {
    expect(hasCoordinates(coordinateFree)).toBe(false);
    expect(hasCoordinates(mapped)).toBe(true);
  });

  it("exposes a distinguishable selected-marker visual state", () => {
    expect(markerClassName(true)).toContain("bg-[#173d9c]");
    expect(markerClassName(true)).toContain("scale-110");
    expect(markerClassName(false)).toContain("bg-[#d25b3f]");
  });
});
