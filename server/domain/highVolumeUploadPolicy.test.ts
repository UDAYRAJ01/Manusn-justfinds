import { HIGH_VOLUME_FILE_LIMIT } from "./highVolumeImportPolicy";
import { highVolumeUploadIssue } from "./highVolumeUploadPolicy";
import { describe, expect, it } from "vitest";

describe("high-volume upload policy", () => {
  it("accepts a staged payload when the streamed byte count matches the approved 500 MB-or-less request", () => {
    expect(highVolumeUploadIssue(245_760, 245_760)).toBeNull();
    expect(highVolumeUploadIssue(HIGH_VOLUME_FILE_LIMIT, HIGH_VOLUME_FILE_LIMIT)).toBeNull();
  });

  it("rejects missing, oversized, and mismatched streamed payloads before storage upload", () => {
    expect(highVolumeUploadIssue(100, null)).toContain("readable file size");
    expect(highVolumeUploadIssue(HIGH_VOLUME_FILE_LIMIT + 1, HIGH_VOLUME_FILE_LIMIT + 1)).toContain("invalid staged file size");
    expect(highVolumeUploadIssue(100, 101)).toContain("does not match");
  });
});
