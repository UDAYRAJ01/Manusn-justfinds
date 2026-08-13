import { describe, expect, it } from "vitest";

describe("ElevenLabs credential", () => {
  it("authorizes access to the models endpoint", async () => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    expect(apiKey, "ELEVENLABS_API_KEY must be configured").toBeTruthy();

    const response = await fetch("https://api.elevenlabs.io/v1/models", {
      headers: { "xi-api-key": apiKey! },
    });

    expect(response.ok, `ElevenLabs returned ${response.status}`).toBe(true);
    const models = await response.json();
    expect(Array.isArray(models)).toBe(true);
  }, 15_000);
});
