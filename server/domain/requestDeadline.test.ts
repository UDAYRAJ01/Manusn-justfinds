import { describe, expect, it } from "vitest";
import { withRequestDeadline } from "./requestDeadline";

describe("withRequestDeadline", () => {
  it("aborts a stalled operation and reports the supplied actionable message", async () => {
    await expect(withRequestDeadline(5, signal => new Promise<void>((_, reject) => {
      signal.addEventListener("abort", () => reject(new Error("aborted")));
    }), "Storage read timed out.")).rejects.toThrow("Storage read timed out.");
  });

  it("returns a completed operation before its deadline", async () => {
    await expect(withRequestDeadline(100, async () => "complete", "Should not time out.")).resolves.toBe("complete");
  });
});
