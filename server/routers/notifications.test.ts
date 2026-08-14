import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";

describe("Notification Router Contract", () => {
  it("should expose unreadCount and list procedures", () => {
    expect(appRouter._def.procedures).toHaveProperty("notification.unreadCount");
    expect(appRouter._def.procedures).toHaveProperty("notification.list");
    expect(appRouter._def.procedures).toHaveProperty("notification.markAsRead");
    expect(appRouter._def.procedures).toHaveProperty("notification.getPreferences");
    expect(appRouter._def.procedures).toHaveProperty("notification.updatePreferences");
  });
});
