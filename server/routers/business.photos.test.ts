import { describe, expect, it, vi } from "vitest";
import { businessRouter } from "./business";

const { storagePut, updateCalls, deleteCalls } = vi.hoisted(() => ({
  storagePut: vi.fn(async () => ({ key: "business-images/7/photo.png", url: "/manus-storage/business-images/7/photo.png" })),
  updateCalls: [] as unknown[],
  deleteCalls: [] as unknown[],
}));

vi.mock("../storage", () => ({ storagePut }));
vi.mock("../db", () => ({
  getDb: vi.fn(async () => ({
    select: () => ({ from: () => ({ where: () => ({ limit: async () => [{ id: 7, ownerId: 42, status: "draft", onboardingStep: 1, name: "Photo business", categoryId: 1, cityId: 1 }] }) }) }),
    insert: () => ({ values: async () => [{ insertId: 91 }] }),
    update: () => ({ set: (values: unknown) => ({ where: async () => { updateCalls.push(values); } }) }),
    delete: () => ({ where: async () => { deleteCalls.push(true); } }),
  })),
}));

const caller = () => businessRouter.createCaller({
  user: { id: 42, openId: "owner", name: "Owner", email: null, loginMethod: "test", role: "business_owner", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {} as never,
  res: {} as never,
});

describe("business photo behavior", () => {
  it("uploads bytes to storage and saves the returned URL", async () => {
    const result = await caller().savePhoto({ businessId: 7, dataBase64: Buffer.from("image-bytes").toString("base64"), mimeType: "image/png", imageType: "gallery", sortOrder: 0 });
    expect(storagePut).toHaveBeenCalledOnce();
    expect(result).toEqual({ imageId: 91, url: "/manus-storage/business-images/7/photo.png" });
  });

  it("runs owner-scoped delete, reorder, cover, and logo mutations", async () => {
    await expect(caller().deletePhoto({ businessId: 7, imageId: 91 })).resolves.toEqual({ success: true });
    await expect(caller().reorderPhotos({ businessId: 7, imageIds: [91, 92] })).resolves.toEqual({ success: true });
    await expect(caller().setCover({ businessId: 7, imageId: 91 })).resolves.toEqual({ success: true });
    await expect(caller().setLogo({ businessId: 7, imageId: 92 })).resolves.toEqual({ success: true });
    expect(deleteCalls).toHaveLength(1);
    expect(updateCalls.length).toBeGreaterThanOrEqual(6);
  });
});
