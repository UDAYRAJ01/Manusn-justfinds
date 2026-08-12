import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb, getPublishedJobs } from "../db";
import { jobApplications, jobs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const jobsRouter = router({
  list: publicProcedure.input(z.object({ query: z.string().max(160).default(""), city: z.string().max(140).optional() })).query(async ({ input }) => {
    const rows = await getPublishedJobs(input.query, input.city);
    return rows.map(row => ({ id: row.job.id, title: row.job.title, company: row.company ?? "Independent employer", city: row.city ?? "Location flexible", category: row.job.category, experience: row.job.experience ?? "Not specified", salary: row.job.salary ?? "Not specified", jobType: row.job.jobType.replace("_", " "), posted: row.job.publishedAt }));
  }),
  submitApplication: protectedProcedure.input(z.object({ jobId: z.number().int().positive(), note: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Applications are temporarily unavailable." });
    const job = await db.select({ id: jobs.id, status: jobs.status }).from(jobs).where(eq(jobs.id, input.jobId)).limit(1);
    if (!job[0] || job[0].status !== "published") throw new TRPCError({ code: "NOT_FOUND", message: "This job is not available." });
    await db.insert(jobApplications).values({ jobId: input.jobId, userId: ctx.user.id, note: input.note });
    return { success: true };
  }),
});
