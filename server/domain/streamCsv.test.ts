import { describe, expect, it } from "vitest";
import { initialServerCsvParserState, parseServerCsvChunk } from "./streamCsv";

describe("parseServerCsvChunk", () => {
  it("preserves a quoted record split across storage parts", () => {
    const first = parseServerCsvChunk(initialServerCsvParserState(), Buffer.from('Business Name,Description\nCafe,"Open,'));
    const second = parseServerCsvChunk(first.state, Buffer.from(' late"\nShop,Ready\n'), true);
    expect(first.rows).toEqual([]);
    expect(second.rows).toEqual([{ "Business Name": "Cafe", Description: "Open, late" }, { "Business Name": "Shop", Description: "Ready" }]);
  });
});
