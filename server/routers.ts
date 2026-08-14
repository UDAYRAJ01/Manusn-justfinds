import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { aiRouter } from "./routers/ai";
import { businessRouter } from "./routers/business";
import { aiContentRouter } from "./routers/aiContent";
import { discoveryRouter } from "./routers/discovery";
import { jobsRouter } from "./routers/jobs";
import { workspaceRouter } from "./routers/workspaces";
import { websiteRouter } from "./routers/website";
import { domainRouter } from "./routers/domain";
import { notificationRouter } from "./routers/notifications";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  discovery: discoveryRouter,
  jobs: jobsRouter,
  workspace: workspaceRouter,
  business: businessRouter,
  ai: aiRouter,
  aiContent: aiContentRouter,
  website: websiteRouter,
  domain: domainRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
