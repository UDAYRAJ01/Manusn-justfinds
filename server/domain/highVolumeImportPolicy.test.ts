import { describe, expect, it } from "vitest";
import { HIGH_VOLUME_FILE_LIMIT, HIGH_VOLUME_ROW_LIMIT, highVolumeProgress, isSupportedImportFilename } from "./highVolumeImportPolicy";

describe("high-volume import policy", () => {
  it("supports the promised 100,000-row and 500 MB limits", () => {
    expect(HIGH_VOLUME_ROW_LIMIT).toBe(100_000);
    expect(HIGH_VOLUME_FILE_LIMIT).toBe(500 * 1024 * 1024);
  });

  it("accepts supported spreadsheet extensions and rejects unsafe names", () => {
    expect(isSupportedImportFilename("listings.CSV")).toBe(true);
    expect(isSupportedImportFilename("businesses.xlsx")).toBe(true);
    expect(isSupportedImportFilename("archive.zip")).toBe(false);
    expect(isSupportedImportFilename("sheet.xlsx.exe")).toBe(false);
  });

  it("reserves the validation portion of progress before creating listings", () => {
    expect(highVolumeProgress("validating", 50_000, 100_000)).toBe(22);
    expect(highVolumeProgress("importing", 0, 100_000)).toBe(45);
    expect(highVolumeProgress("importing", 100_000, 100_000)).toBe(99);
  });
});
