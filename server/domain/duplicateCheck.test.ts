import { describe, expect, it } from "vitest";
import { normalizePhone, scoreDuplicateCandidate } from "./duplicateCheck";

const source = { name: "Vishnoi Face Hospital", phone: "+91 098765 43210", email: "contact@vishnoi.example", address: "12 Mall Road, Kanpur", cityId: 7, latitude: "26.4499", longitude: "80.3319" };

describe("duplicate candidate scoring", () => {
  it("flags matching identity, contact, address, and coordinates as a likely duplicate", () => {
    const match = scoreDuplicateCandidate(source, { ...source, id: 42, name: "VISHNOI FACE HOSPITAL", phone: "91 09876543210", latitude: "26.4500", longitude: "80.3320" });
    expect(match).toEqual(expect.objectContaining({ classification: "likely", score: 100 }));
    expect(match?.reasons).toEqual(expect.arrayContaining(["Same business name", "Same phone number", "Same address", "Same map location"]));
  });

  it("returns only a possible match for an overlapping local address without a shared identity", () => {
    const match = scoreDuplicateCandidate(source, { id: 43, name: "Kanpur Aesthetic Centre", phone: null, email: null, address: "12 Mall Road, Kanpur", cityId: 7, latitude: null, longitude: null });
    expect(match).toEqual(expect.objectContaining({ classification: "possible" }));
    expect(match?.reasons).toContain("Same address");
  });

  it("does not surface unrelated businesses and normalizes local phone formatting", () => {
    expect(normalizePhone("0091 (98765) 43210")).toBe("919876543210");
    expect(scoreDuplicateCandidate(source, { id: 44, name: "River View Restaurant", phone: "1234567890", email: "hello@river.example", address: "7 Riverside, Kanpur", cityId: 7, latitude: "26.4700", longitude: "80.3500" })).toBeNull();
  });
});
