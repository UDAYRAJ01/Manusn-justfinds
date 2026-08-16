import { describe, expect, it } from "vitest";
import { streamCsvInBatches } from "./streamCsv";

describe("streamCsvInBatches", () => {
  it("preserves quoted commas and escaped quotes across small batches", async () => {
    const received: Array<Record<string, string>> = [];
    const file = new File(['Business Name,Description\nCafe,"Open, late"\nShop,"He said ""hello"""\n'], "listings.csv", { type: "text/csv" });
    await streamCsvInBatches(file, async rows => { received.push(...rows); }, 1);
    expect(received).toEqual([{ "Business Name": "Cafe", Description: "Open, late" }, { "Business Name": "Shop", Description: 'He said "hello"' }]);
  });
});
