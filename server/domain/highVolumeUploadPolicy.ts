import { HIGH_VOLUME_FILE_LIMIT } from "./highVolumeImportPolicy";

export const HIGH_VOLUME_UPLOAD_CHUNK_BYTES = 5 * 1024 * 1024;
export const HIGH_VOLUME_WORKBOOK_FILE_LIMIT = 25 * 1024 * 1024;

export function highVolumeFormatIssue(filename: string, fileSize: number): string | null {
  const normalized = filename.trim().toLowerCase();
  if (/\.(xls|xlsx)$/.test(normalized) && fileSize > HIGH_VOLUME_WORKBOOK_FILE_LIMIT) {
    return `For reliable large imports, export this workbook as CSV. XLS/XLSX files are limited to ${Math.floor(HIGH_VOLUME_WORKBOOK_FILE_LIMIT / (1024 * 1024))} MB because they must be fully decoded before validation.`;
  }
  return null;
}

export function highVolumeUploadIssue(expectedBytes: number | null, receivedBytes: number | null): string | null {
  if (!expectedBytes || expectedBytes < 1 || expectedBytes > HIGH_VOLUME_FILE_LIMIT) {
    return "This import has an invalid staged file size.";
  }
  if (!receivedBytes || receivedBytes < 1) {
    return "The upload did not include a readable file size.";
  }
  if (receivedBytes > HIGH_VOLUME_FILE_LIMIT) {
    return "The uploaded file exceeds the 500 MB limit.";
  }
  if (receivedBytes !== expectedBytes) {
    return "The uploaded file size does not match the staged import request. Please select the file again.";
  }
  return null;
}

export function highVolumeUploadPartCount(expectedBytes: number | null): number | null {
  if (!expectedBytes || expectedBytes < 1 || expectedBytes > HIGH_VOLUME_FILE_LIMIT) return null;
  return Math.ceil(expectedBytes / HIGH_VOLUME_UPLOAD_CHUNK_BYTES);
}

export function highVolumeUploadPartBytes(expectedBytes: number | null, partNumber: number): number | null {
  const totalParts = highVolumeUploadPartCount(expectedBytes);
  if (!totalParts || !Number.isInteger(partNumber) || partNumber < 0 || partNumber >= totalParts) return null;
  const remaining = expectedBytes! - partNumber * HIGH_VOLUME_UPLOAD_CHUNK_BYTES;
  return Math.min(HIGH_VOLUME_UPLOAD_CHUNK_BYTES, remaining);
}

export function highVolumeUploadPartIssue(expectedBytes: number | null, partNumber: number, receivedBytes: number | null): string | null {
  const expectedPartBytes = highVolumeUploadPartBytes(expectedBytes, partNumber);
  if (!expectedPartBytes) return "This upload chunk does not belong to the staged import.";
  if (!receivedBytes || receivedBytes < 1) return "The upload chunk did not include readable data.";
  if (receivedBytes !== expectedPartBytes) return "The uploaded chunk size does not match the staged spreadsheet. Please select the file again.";
  return null;
}
