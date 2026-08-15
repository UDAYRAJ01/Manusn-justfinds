import { HIGH_VOLUME_FILE_LIMIT } from "./highVolumeImportPolicy";

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
