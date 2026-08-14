import { describe, expect, it } from "vitest";
import { calculateProfileCompletion } from "./profileCompletion";

describe("profile completion", () => {
  it("starts with only the basic facts complete after a basics-first draft", () => {
    const result = calculateProfileCompletion({
      name: "Verified Local Clinic",
      shortDescription: "A factual description of the clinic and its current services.",
      phone: null,
      email: null,
      website: null,
      address: "12 Main Road, Kanpur",
      latitude: null,
      longitude: null,
      hoursCount: 0,
      servicesCount: 0,
      facilitiesCount: 0,
      coverImageCount: 0,
    });

    expect(result).toMatchObject({ percentage: 14, completed: 1, total: 7 });
    expect(result.sections.find(section => section.key === "basics")).toMatchObject({ done: true });
    expect(result.sections.filter(section => !section.done).map(section => section.key)).toEqual([
      "contact",
      "location",
      "hours",
      "services",
      "facilities",
      "photos",
    ]);
  });

  it("selects the highest-priority incomplete section as the next best action", () => {
    const result = calculateProfileCompletion({
      name: "Example Business",
      shortDescription: "A factual description that is long enough.",
      phone: "+91 90000 00000",
      email: null,
      website: null,
      address: "12 Main Road",
      latitude: "26.449900",
      longitude: "80.331900",
      hoursCount: 0,
      servicesCount: 1,
      facilitiesCount: 1,
      coverImageCount: 1,
    });

    expect(result.nextBestAction).toEqual({
      key: "hours",
      label: "Opening hours",
      hint: "Tell customers when you are open.",
      priority: 4,
    });
  });

  it("counts contact and location only when the required factual fields exist", () => {
    const incomplete = calculateProfileCompletion({
      name: "Example Business",
      shortDescription: "A factual description that is long enough.",
      phone: null,
      email: null,
      website: null,
      address: "12 Main Road",
      latitude: "",
      longitude: null,
      hoursCount: 1,
      servicesCount: 1,
      facilitiesCount: 1,
      coverImageCount: 1,
    });
    const complete = calculateProfileCompletion({
      name: "Example Business",
      shortDescription: "A factual description that is long enough.",
      phone: "+91 90000 00000",
      email: null,
      website: null,
      address: "12 Main Road",
      latitude: "26.449900",
      longitude: "80.331900",
      hoursCount: 1,
      servicesCount: 1,
      facilitiesCount: 1,
      coverImageCount: 1,
    });

    expect(incomplete.percentage).toBe(71);
    expect(incomplete.sections.find(section => section.key === "contact")?.done).toBe(false);
    expect(incomplete.sections.find(section => section.key === "location")?.done).toBe(false);
    expect(complete.percentage).toBe(100);
  });
});
