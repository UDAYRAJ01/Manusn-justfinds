import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";

describe("official Google Places import router", () => {
  it("reports the official provider and import status for an authenticated owner without exposing a credential", async () => {
    const caller = appRouter.createCaller({ user: { id: 1, role: "business_owner", openId: "test-user", name: "Test Owner" } as any, req: {} as any, res: {} as any });
    const status = await caller.googleImport.status();

    expect(status.provider).toBe("google_places_api_new");
    expect(status).toHaveProperty("isConfigured");
    expect(status).toHaveProperty("importedCount");
    expect(JSON.stringify(status)).not.toContain("GOOGLE_PLACES_API_KEY");
  });
});
