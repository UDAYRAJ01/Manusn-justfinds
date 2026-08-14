import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";

describe("Google Business Profile Import Router", () => {
  it("returns status and configuration flag without crashing", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, role: "owner", openId: "test-user", name: "Test Owner" } as any,
      req: {} as any,
      res: {} as any,
    });

    const status = await caller.googleImport.status();
    expect(status).toHaveProperty("isConfigured");
    expect(status).toHaveProperty("importedCount");
  });

  it("returns simulated locations when fetched with mock=true", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, role: "owner", openId: "test-user", name: "Test Owner" } as any,
      req: {} as any,
      res: {} as any,
    });

    const res = await caller.googleImport.fetchLocations({ mock: true });
    expect(res).toHaveProperty("locations");
    expect(Array.isArray(res.locations)).toBe(true);
    expect(res.locations.length).toBeGreaterThan(0);
  });
});
