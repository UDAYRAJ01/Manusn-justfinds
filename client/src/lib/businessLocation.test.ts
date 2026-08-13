import { describe, expect, it } from "vitest";
import { parseBusinessCoordinates } from "./businessLocation";

describe("parseBusinessCoordinates", () => {
  it("returns validated coordinates when both values are present", () => {
    expect(parseBusinessCoordinates("26.8467", 80.9462)).toEqual({ lat: 26.8467, lng: 80.9462 });
    expect(parseBusinessCoordinates(0, "0")).toEqual({ lat: 0, lng: 0 });
  });

  it("does not convert missing or malformed values into a location", () => {
    expect(parseBusinessCoordinates(undefined, "80.9462")).toBeNull();
    expect(parseBusinessCoordinates("", "80.9462")).toBeNull();
    expect(parseBusinessCoordinates("not-a-number", "80.9462")).toBeNull();
  });

  it("rejects coordinate values outside geographic bounds", () => {
    expect(parseBusinessCoordinates(91, 80)).toBeNull();
    expect(parseBusinessCoordinates(26, 181)).toBeNull();
  });
});
