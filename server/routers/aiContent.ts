import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { aiContentVersions, aiGenerationJobs, businesses } from "../../drizzle/schema";
import { getBusinessAiFacts, getDb } from "../db";
import { approveAiContentVersion, createAiDraftFromVersion, enqueueAiGenerationJob, getLatestAiContent, processAiGenerationJob, publishAiContentVersion, transitionAiContentVersion } from "../domain/ai/content";
import { canManageBusiness, canModerate } from "../domain/permissions";
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

const contentType = z.enum(["short_description", "about_business", "seo_title", "meta_description", "faq", "service_description", "category_description", "local_landing", "business_highlights", "cta_copy"]);

async function getManagedBusiness(businessId: number, userId: number, role: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The AI workspace is temporarily unavailable." });
  const rows = await db.select({ id: businesses.id, ownerId: businesses.ownerId, status: businesses.status }).from(businesses).where(eq(businesses.id, businessId)).limit(1);
  const business = rows[0];
  if (!business) throw new TRPCError({ code: "NOT_FOUND", message: "Business not found." });
  if (!canManageBusiness(role as Parameters<typeof canManageBusiness>[0], userId, business.ownerId)) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot manage AI content for this business." });
  return { db, business };
}

export const aiContentRouter = router({
  getProviderStatus: protectedProcedure.query(() => ({ configured: Boolean(process.env.BUILT_IN_FORGE_API_URL && process.env.BUILT_IN_FORGE_API_KEY), provider: "builtin-forge" as const })),
  generate: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), contentType })).mutation(async ({ ctx, input }) => {
    await getManagedBusiness(input.businessId, ctx.user.id, ctx.user.role);
    const queued = await enqueueAiGenerationJob({ businessId: input.businessId, contentType: input.contentType, requestedById: ctx.user.id, batchId: `single-${Date.now()}` });
    return processAiGenerationJob(queued.jobId);
  }),
  preview: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), contentType: contentType.optional() })).query(async ({ ctx, input }) => {
    await getManagedBusiness(input.businessId, ctx.user.id, ctx.user.role);
    return getLatestAiContent(input.businessId, input.contentType);
  }),
  retryJob: protectedProcedure.input(z.object({ jobId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The AI workspace is temporarily unavailable." });
    const jobs = await db.select({ id: aiGenerationJobs.id, businessId: aiGenerationJobs.businessId, requestedById: aiGenerationJobs.requestedById, status: aiGenerationJobs.status }).from(aiGenerationJobs).where(eq(aiGenerationJobs.id, input.jobId)).limit(1);
    const job = jobs[0];
    if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Generation job not found." });
    if (job.requestedById !== ctx.user.id && !canModerate(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot retry this generation job." });
    await getManagedBusiness(job.businessId, ctx.user.id, ctx.user.role);
    return processAiGenerationJob(input.jobId);
  }),
  submitForReview: protectedProcedure.input(z.object({ versionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The AI workspace is temporarily unavailable." });
    const rows = await db.select({ businessId: aiContentVersions.businessId }).from(aiContentVersions).where(eq(aiContentVersions.id, input.versionId)).limit(1);
    if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "AI content version not found." });
    await getManagedBusiness(rows[0].businessId, ctx.user.id, ctx.user.role);
    try {
      await transitionAiContentVersion({ versionId: input.versionId, to: "pending_review", actorId: ctx.user.id });
    } catch (error) {
      throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "This AI content cannot be submitted." });
    }
    return { status: "pending_review" as const };
  }),
  restore: protectedProcedure.input(z.object({ versionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The AI workspace is temporarily unavailable." });
    const rows = await db.select({ businessId: aiContentVersions.businessId }).from(aiContentVersions).where(eq(aiContentVersions.id, input.versionId)).limit(1);
    if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "AI content version not found." });
    await getManagedBusiness(rows[0].businessId, ctx.user.id, ctx.user.role);
    const versionId = await createAiDraftFromVersion({ versionId: input.versionId, actorId: ctx.user.id });
    return { versionId, status: "draft" as const };
  }),
  approve: protectedProcedure.input(z.object({ versionId: z.number().int().positive(), note: z.string().max(2000).optional() })).mutation(async ({ ctx, input }) => {
    if (!canModerate(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required to approve AI content." });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The AI workspace is temporarily unavailable." });
    const versions = await db.select({ businessId: aiContentVersions.businessId }).from(aiContentVersions).where(eq(aiContentVersions.id, input.versionId)).limit(1);
    if (!versions[0]) throw new TRPCError({ code: "NOT_FOUND", message: "AI content version not found." });
    try {
      await approveAiContentVersion({ versionId: input.versionId, reviewerId: ctx.user.id, note: input.note });
    } catch (error) {
      throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "This AI content cannot be approved." });
    }
    return { approved: true, businessId: versions[0].businessId, status: "approved" as const };
  }),
  reject: protectedProcedure.input(z.object({ versionId: z.number().int().positive(), note: z.string().min(1).max(2000) })).mutation(async ({ ctx, input }) => {
    if (!canModerate(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required to reject AI content." });
    try {
      await transitionAiContentVersion({ versionId: input.versionId, to: "rejected", actorId: ctx.user.id, note: input.note });
    } catch (error) {
      throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "This AI content cannot be rejected." });
    }
    return { rejected: true, status: "rejected" as const };
  }),
  publish: protectedProcedure.input(z.object({ versionId: z.number().int().positive(), note: z.string().max(2000).optional() })).mutation(async ({ ctx, input }) => {
    if (!canModerate(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required to publish AI content." });
    try {
      await publishAiContentVersion({ versionId: input.versionId, reviewerId: ctx.user.id, note: input.note });
    } catch (error) {
      throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "This AI content cannot be published." });
    }
    return { published: true, status: "published" as const };
  }),
  getBusinessFactsPreview: protectedProcedure.input(z.object({ businessId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    await getManagedBusiness(input.businessId, ctx.user.id, ctx.user.role);
    return getBusinessAiFacts(input.businessId, false);
  }),
});
