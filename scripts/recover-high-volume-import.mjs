import { processNextHighVolumeImportChunk } from "../server/routers/workspaces.ts";

const taskUid = process.argv[2];
if (!taskUid) throw new Error("A scheduler task UID is required.");

console.log(JSON.stringify(await processNextHighVolumeImportChunk(taskUid)));
