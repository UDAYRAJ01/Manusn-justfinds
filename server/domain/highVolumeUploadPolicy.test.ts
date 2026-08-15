import { HIGH_VOLUME_FILE_LIMIT } from "./highVolumeImportPolicy";
import { HIGH_VOLUME_UPLOAD_CHUNK_BYTES, highVolumeUploadIssue, highVolumeUploadPartBytes, highVolumeUploadPartCount, highVolumeUploadPartIssue } from "./highVolumeUploadPolicy";
import { sourceQueueIssue } from "./highVolumeImportPolicy";
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

  it("requires a confirmed secure-storage timestamp before a staged import can enter the queue", () => {
    expect(sourceQueueIssue(null)).toContain("not confirmed in secure storage");
    expect(sourceQueueIssue(new Date("2026-08-15T15:00:00Z"))).toBeNull();
  });

  it("splits a spreadsheet into bounded exact-size secure-upload chunks", () => {
    const fileSize = HIGH_VOLUME_UPLOAD_CHUNK_BYTES * 2 + 17;
    expect(highVolumeUploadPartCount(fileSize)).toBe(3);
    expect(highVolumeUploadPartBytes(fileSize, 0)).toBe(HIGH_VOLUME_UPLOAD_CHUNK_BYTES);
    expect(highVolumeUploadPartBytes(fileSize, 2)).toBe(17);
    expect(highVolumeUploadPartIssue(fileSize, 2, 17)).toBeNull();
    expect(highVolumeUploadPartIssue(fileSize, 2, 16)).toContain("does not match");
    expect(highVolumeUploadPartBytes(fileSize, 3)).toBeNull();
  });
});
