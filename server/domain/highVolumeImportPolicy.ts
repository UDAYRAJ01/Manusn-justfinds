export const HIGH_VOLUME_ROW_LIMIT = 100_000;
export const HIGH_VOLUME_FILE_LIMIT = 500 * 1024 * 1024;
export const HIGH_VOLUME_VALIDATION_CHUNK = 500;
// Creation includes several durable writes per business; keep each scheduled run short and recoverable.
export const HIGH_VOLUME_IMPORT_CHUNK = 25;

export function isSupportedImportFilename(filename: string) {
  return /\.(csv|xls|xlsx)$/i.test(filename.trim());
}

export function highVolumeProgress(phase: "validating" | "importing", completed: number, total: number) {
  if (total <= 0) return phase === "validating" ? 0 : 45;
  const ratio = Math.max(0, Math.min(1, completed / total));
  return phase === "validating"
    ? Math.floor(ratio * 45)
    : Math.min(99, 45 + Math.floor(ratio * 55));
}

export function sourceQueueIssue(sourceUploadedAt: Date | null): string | null {
  return sourceUploadedAt
    ? null
    : "This historical staged file was not confirmed in secure storage. Please upload the spreadsheet again to start a new background import.";
}
