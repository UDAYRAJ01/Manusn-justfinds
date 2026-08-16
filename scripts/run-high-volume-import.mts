import { processNextHighVolumeImportChunk } from "../server/routers/workspaces";

const taskUid = process.argv[2];
if (!taskUid) throw new Error("Pass the scheduler task UID as the first argument.");

const result = await processNextHighVolumeImportChunk(taskUid);
console.log(JSON.stringify(result));
