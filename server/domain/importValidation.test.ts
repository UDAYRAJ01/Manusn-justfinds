import { describe, expect, it } from "vitest";
import { IMPORT_QUEUE_STATUSES, isImportQueueStatus, validateBulkListingRow } from "./importValidation";

describe("bulk import validation", () => {
  it("accepts a complete row with known category and city", () => {
    expect(validateBulkListingRow({ businessName: "North Star", category: "Education", city: "Kanpur", phone: "+91 512 555 0122", latitude: "26.48", longitude: "80.30" }, ["Education"], ["Kanpur"])).toEqual({ valid: true, errors: [] });
  });

  it("surfaces meaningful errors for unapproved bulk rows", () => {
    const result = validateBulkListingRow({ businessName: "", category: "Unknown", city: "Elsewhere", latitude: "91" }, ["Education"], ["Kanpur"]);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Business name is required.");
    expect(result.errors).toContain("Category is invalid.");
    expect(result.errors).toContain("City is invalid.");
    expect(result.errors).toContain("Latitude is invalid.");
  });
});

describe("bulk import operational statuses", () => {
  it("retains the four explicit queue statuses", () => {
    expect(IMPORT_QUEUE_STATUSES).toEqual(["Pending", "Processing", "Completed", "Failed"]);
    expect(isImportQueueStatus("Pending")).toBe(true);
    expect(isImportQueueStatus("completed")).toBe(false);
  });
});
