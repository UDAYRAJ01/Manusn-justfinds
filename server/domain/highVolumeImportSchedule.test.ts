import { describe, expect, it } from "vitest";
import { HIGH_VOLUME_IMPORT_CALLBACK_PATH, HIGH_VOLUME_IMPORT_CRON, shouldPauseHighVolumeImportSchedule } from "./highVolumeImportSchedule";

describe("high-volume import schedule policy", () => {
  it("uses a supported once-per-minute scheduled callback", () => {
    expect(HIGH_VOLUME_IMPORT_CRON).toBe("0 * * * * *");
    expect(HIGH_VOLUME_IMPORT_CALLBACK_PATH).toBe("/api/scheduled/process-high-volume-imports");
  });

  it("pauses the job schedule only when validation is ready or import work is complete", () => {
    expect(shouldPauseHighVolumeImportSchedule("validating")).toBe(false);
    expect(shouldPauseHighVolumeImportSchedule("importing")).toBe(false);
    expect(shouldPauseHighVolumeImportSchedule("ready")).toBe(true);
    expect(shouldPauseHighVolumeImportSchedule("completed")).toBe(true);
  });
});
