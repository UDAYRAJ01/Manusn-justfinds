import { describe, expect, it } from "vitest";
import { importCityCandidates, importLookupKeys, missingRequiredBulkHeaders, normalizeBulkListingRow, parseImportedFaqs, parseImportedHours, parseImportedServices } from "./bulkListingImport";

describe("Excel bulk listing normalization", () => {
  it("maps the supplied spreadsheet headers into a taxonomy-aware listing", () => {
    const row = normalizeBulkListingRow({
      "Business Name": "North Star Clinic",
      "Main Category": "Healthcare",
      Subcategory: "Clinics",
      "Description (About)": "Primary care clinic.",
      Services: "Consultation; Vaccination",
      Address: "Civil Lines, Kanpur",
      City: "Kanpur",
      Locality: "Civil Lines",
      State: "Uttar Pradesh",
      Country: "India",
      Latitude: 26.48,
      Longitude: 80.3,
      Phone: "+91 512 555 0122",
      Email: "hello@northstar.in",
      Website: "https://northstar.in",
      Hours: "Mon-Fri 09:00-18:00; Sat 10:00-14:00; Sun Closed",
      Rating: 4.8,
      "Total Reviews": 120,
      FAQs: "[]",
    });
    expect(row).toMatchObject({ businessName: "North Star Clinic", mainCategory: "Healthcare", subcategory: "Clinics", city: "Kanpur", services: "Consultation; Vaccination", latitude: "26.48", longitude: "80.3", totalReviews: "120" });
  });

  it("reports only missing required user-supplied headers and treats Business Type as optional", () => {
    expect(missingRequiredBulkHeaders(["Business Name", "Main Category", "Subcategory", "Description (About)", "Address", "City", "Locality", "State", "Country", "Latitude", "Longitude", "Phone", "Email", "Website", "Hours", "Rating", "Total Reviews", "FAQs"])).toEqual([]);
  });

  it("keeps only conservative taxonomy aliases and trailing city segments for server-side matching", () => {
    expect(importLookupKeys("Zumba Classes")).toContain("zumba");
    expect(importLookupKeys("Dentists")).toContain("dentist");
    expect(importCityCandidates("matabari, udaipur")).toEqual(["matabari, udaipur", "udaipur", "matabari"]);
  });
});

describe("safe imported hours and FAQs", () => {
  it("converts readable weekly hours to the established business-hours shape", () => {
    const result = parseImportedHours("Mon-Fri 09:00-18:00; Sat 10:00-14:00; Sun Closed");
    expect(result.warning).toBeNull();
    expect(result.days).toHaveLength(7);
    expect(result.days?.[1]).toMatchObject({ opensAt: "09:00", closesAt: "18:00", isClosed: false });
    expect(result.days?.[6]).toMatchObject({ opensAt: "10:00", closesAt: "14:00", isClosed: false });
    expect(result.days?.[0]).toMatchObject({ isClosed: true });
  });

  it("accepts structured FAQs but rejects unstructured source text for manual review", () => {
    expect(parseImportedFaqs('[{"question":"Do you take appointments?","answer":"Yes."}]')).toEqual({ faqs: [{ question: "Do you take appointments?", answer: "Yes." }], warning: null });
    expect(parseImportedFaqs("Call us for details").faqs).toEqual([]);
    expect(parseImportedFaqs("Call us for details").warning).toContain("FAQs were not imported");
  });

  it("normalizes a semicolon-separated services list without duplicating supplied services", () => {
    expect(parseImportedServices("Haircut; Beard trim; Haircut").services).toEqual([{ name: "Haircut" }, { name: "Beard trim" }]);
  });
});
