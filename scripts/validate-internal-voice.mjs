import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema.ts";
import { getDb } from "../server/db.ts";
import { appRouter } from "../server/routers.ts";

const businessId = 2;
const ownerId = 570001;
const db = await getDb();

if (!db) {
  throw new Error("Database is unavailable for internal voice validation.");
}

const [owner] = await db.select().from(users).where(eq(users.id, ownerId)).limit(1);

if (!owner || owner.role !== "business_owner") {
  throw new Error("The authorized internal validation owner is unavailable.");
}

const caller = appRouter.createCaller({
  user: owner,
  req: {},
  res: {},
});

const result = await caller.workspace.generateVoiceIntroduction({ businessId });

console.log(JSON.stringify({
  businessId,
  url: result.url,
  script: result.script,
}, null, 2));
