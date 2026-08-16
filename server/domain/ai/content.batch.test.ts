import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getDb: vi.fn(),
}));

vi.mock("../../db", () => ({
  getDb: dbMocks.getDb,
  getBusinessAiFacts: vi.fn(),
}));

import { processAiGenerationBatchChunk } from "./content";

function query(rows: unknown[]) {
  const builder = {
    from: () => builder,
    where: () => builder,
    orderBy: () => builder,
    limit: () => Promise.resolve(rows),
    then: (resolve: (value: unknown[]) => unknown, reject?: (reason: unknown) => unknown) => Promise.resolve(rows).then(resolve, reject),
  };
  return builder;
}

describe("scheduled AI rewrite batch claim", () => {
  beforeEach(() => {
    const resultSets = [
      [{ id: "batch-owned-by-task", status: "queued" }],
      [],
      [],
    ];
    const db = {
      select: vi.fn(() => query(resultSets.shift() ?? [])),
      update: vi.fn(() => ({
        set: vi.fn(() => ({ where: vi.fn(async () => undefined) })),
      })),
    };
    dbMocks.getDb.mockResolvedValue(db);
  });

  it("claims a queued batch from its authenticated task UID without a callback batch ID", async () => {
    const result = await processAiGenerationBatchChunk({ taskUid: "heartbeat-task-123", maxJobs: 3 });

    expect(result).toMatchObject({ processed: false, done: true, pending: 0 });
    expect(dbMocks.getDb).toHaveBeenCalled();
  });
});
