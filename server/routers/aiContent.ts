import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { aiContentVersions, aiGenerationJobs, businesses } from "../../drizzle/schema";
import { getBusinessAiFacts, getDb } from "../db";
import { approveAiContentVersion, cancelAiGenerationJob, createAiDraftFromVersion, enqueueAiGenerationBatch, enqueueAiGenerationJob, getAiGenerationAnalytics, getAiGenerationProgress, getAiReviewQueue, getLatestAiContent, processAiGenerationJob, publishAiContentVersion, publishApprovedContentToListing, transitionAiContentVersion } from "../domain/ai/content";
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
  generateSeoPack: protectedProcedure.input(z.object({ businessId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    if (!canModerate(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required to create AI SEO drafts." });
    await getManagedBusiness(input.businessId, ctx.user.id, ctx.user.role);
    const batchId = `seo-pack-${ctx.user.id}-${Date.now()}`;
    const results: Array<{ contentType: "about_business" | "seo_title" | "meta_description" | "faq"; status: "completed" | "failed"; versionId?: number }> = [];
    for (const draftType of ["about_business", "seo_title", "meta_description", "faq"] as const) {
      const queued = await enqueueAiGenerationJob({ businessId: input.businessId, contentType: draftType, requestedById: ctx.user.id, batchId });
      const result = await processAiGenerationJob(queued.jobId);
      const versionId = "versionId" in result ? result.versionId : undefined;
      if (result.status === "completed" && versionId) {
        await transitionAiContentVersion({ versionId, to: "pending_review", actorId: ctx.user.id });
        results.push({ contentType: draftType, status: "completed", versionId });
      } else {
        results.push({ contentType: draftType, status: "failed", ...(versionId ? { versionId } : {}) });
      }
    }
    return { batchId, results, completed: results.filter(result => result.status === "completed").length, failed: results.filter(result => result.status === "failed").length };
  }),
  preview: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), contentType: contentType.optional() })).query(async ({ ctx, input }) => {
    await getManagedBusiness(input.businessId, ctx.user.id, ctx.user.role);
    return getLatestAiContent(input.businessId, input.contentType);
  }),
  bulkGenerate: protectedProcedure.input(z.object({ businessIds: z.array(z.number().int().positive()).min(1).max(25), contentTypes: z.array(contentType).min(1).max(10) })).mutation(async ({ ctx, input }) => {
    if (!canModerate(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required for bulk AI generation." });
    for (const businessId of input.businessIds) await getManagedBusiness(businessId, ctx.user.id, ctx.user.role);
    const batchId = `bulk-${ctx.user.id}-${Date.now()}`;
    return enqueueAiGenerationBatch({ ...input, requestedById: ctx.user.id, batchId });
  }),
  progress: protectedProcedure.input(z.object({ batchId: z.string().min(1).optional(), jobId: z.number().int().positive().optional() }).refine(input => Boolean(input.batchId) !== Boolean(input.jobId), "Provide exactly one batchId or jobId.")).query(async ({ ctx, input }) => {
    const result = await getAiGenerationProgress(input);
    for (const businessId of Array.from(new Set(result.jobs.map(job => job.businessId)))) await getManagedBusiness(businessId, ctx.user.id, ctx.user.role);
    return result;
  }),
  cancelJob: protectedProcedure.input(z.object({ jobId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The AI workspace is temporarily unavailable." });
    const rows = await db.select({ businessId: aiGenerationJobs.businessId, requestedById: aiGenerationJobs.requestedById }).from(aiGenerationJobs).where(eq(aiGenerationJobs.id, input.jobId)).limit(1);
    const job = rows[0];
    if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Generation job not found." });
    if (job.requestedById !== ctx.user.id && !canModerate(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot cancel this generation job." });
    await getManagedBusiness(job.businessId, ctx.user.id, ctx.user.role);
    return { cancelled: await cancelAiGenerationJob(input.jobId) };
  }),
  analytics: protectedProcedure.query(async ({ ctx }) => {
    if (!canModerate(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required for AI analytics." });
    return getAiGenerationAnalytics();
  }),
  reviewQueue: protectedProcedure.query(async ({ ctx }) => {
    if (!canModerate(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required for AI content review." });
    return getAiReviewQueue();
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
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The AI workspace is temporarily unavailable." });
      const versions = await db.select({ contentType: aiContentVersions.contentType }).from(aiContentVersions).where(eq(aiContentVersions.id, input.versionId)).limit(1);
      if (!versions[0]) throw new TRPCError({ code: "NOT_FOUND", message: "AI content version not found." });
      const applied = ["about_business", "seo_title", "meta_description", "faq"].includes(versions[0].contentType);
      if (applied) await publishApprovedContentToListing({ versionId: input.versionId, reviewerId: ctx.user.id, note: input.note });
      else await publishAiContentVersion({ versionId: input.versionId, reviewerId: ctx.user.id, note: input.note });
      return { published: true, appliedToListing: applied, status: "published" as const };
    } catch (error) {
      throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "This AI content cannot be published." });
    }
  }),
  getBusinessFactsPreview: protectedProcedure.input(z.object({ businessId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    await getManagedBusiness(input.businessId, ctx.user.id, ctx.user.role);
    return getBusinessAiFacts(input.businessId, false);
  }),
});
