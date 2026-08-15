export const HIGH_VOLUME_IMPORT_CRON = "0 * * * * *";
export const HIGH_VOLUME_IMPORT_CALLBACK_PATH = "/api/scheduled/process-high-volume-imports";

export function shouldPauseHighVolumeImportSchedule(phase: string | undefined) {
  return phase === "ready" || phase === "completed";
}
