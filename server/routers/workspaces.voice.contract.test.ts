import { afterEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  getOwnerBusinesses: vi.fn(async () => []),
  getAdminCounts: vi.fn(async () => ({})),
  getCategorySchemas: vi.fn(async () => []),
  getPendingBusinesses: vi.fn(async () => []),
}));

const storageMocks = vi.hoisted(() => ({
  storagePut: vi.fn(async () => ({ key: "businesses/17/voice-introduction.mp3", url: "https://storage.example.test/businesses/17/voice-introduction.mp3" })),
}));

vi.mock("../db", () => dbMocks);
vi.mock("../storage", () => storageMocks);

import { workspaceRouter } from "./workspaces";

describe("owner voice-introduction persistence contract", () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.ELEVENLABS_API_KEY;

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.ELEVENLABS_API_KEY = originalApiKey;
    vi.clearAllMocks();
  });

  it("writes the stored MP3 URL to the approved business and returns the same URL", async () => {
    const whereUpdate = vi.fn(async () => undefined);
    const setUpdate = vi.fn(() => ({ where: whereUpdate }));
    const update = vi.fn(() => ({ set: setUpdate }));
    const limit = vi.fn(async () => [{
      id: 17,
      ownerId: 7,
      status: "approved",
      name: "Northstar Dental",
      approvedDescription: "Approved dental care information for local patients.",
    }]);
    const whereSelect = vi.fn(() => ({ limit }));
    const from = vi.fn(() => ({ where: whereSelect }));
    const select = vi.fn(() => ({ from }));
    dbMocks.getDb.mockResolvedValue({ select, update });
    process.env.ELEVENLABS_API_KEY = "test-server-key";

    global.fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ voices: [{ voice_id: "approved-voice" }] }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3]), { status: 200 }));

    const caller = workspaceRouter.createCaller({ user: { id: 7, role: "business_owner" } } as never);
    const result = await caller.generateVoiceIntroduction({ businessId: 17 });

    expect(storageMocks.storagePut).toHaveBeenCalledWith("businesses/17/voice-introduction.mp3", expect.any(Buffer), "audio/mpeg");
    expect(setUpdate).toHaveBeenCalledWith(expect.objectContaining({
      voiceIntroductionUrl: "https://storage.example.test/businesses/17/voice-introduction.mp3",
      voiceIntroductionScript: expect.stringContaining("Northstar Dental"),
      voiceIntroductionUpdatedAt: expect.any(Date),
    }));
    expect(whereUpdate).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expect.objectContaining({
      url: "https://storage.example.test/businesses/17/voice-introduction.mp3",
      script: expect.stringContaining("Northstar Dental"),
    }));
  });
});
