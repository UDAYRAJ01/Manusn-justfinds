import { processNextHighVolumeImportChunk } from "../server/routers/workspaces";

const taskUid = process.argv[2];
const count = Number.parseInt(process.argv[3] ?? "1", 10);
if (!taskUid || !Number.isInteger(count) || count < 1 || count > 12) throw new Error("Usage: run-high-volume-import-batch.mts <taskUid> [1-12]");

for (let index = 0; index < count; index += 1) {
  const result = await processNextHighVolumeImportChunk(taskUid);
  console.log(JSON.stringify({ sequence: index + 1, ...result }));
  if (!("workerRan" in result)) break;
}

process.exit(0);
