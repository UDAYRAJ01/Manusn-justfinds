import { createHash } from "node:crypto";
import { and, asc, desc, eq, inArray, max, or, sql } from "drizzle-orm";
import { aiContentVersions, aiGenerationBatches, aiGenerationJobs, aiUsageEvents, businessAiContent, businessRevisions, businesses } from "../../../drizzle/schema";
import { getBusinessAiFacts, getDb } from "../../db";
import { buildContentPrompt, PROMPT_VERSION, type PromptContentType } from "./prompts";
import { generateStructured, classifyAiError } from "./provider";
import type { AiContentType, BusinessAiFacts, GeneratedContent, ValidationResult } from "./types";

const forbiddenClaims = /\b(guaranteed|guarantee|award[- ]winning|best in|number one|#1|top[- ]rated|five[- ]star|5[- ]star|testimonial|review says|cheap|lowest price|discount|free consultation)\b/i;
const numberPattern = /\b\d+(?:[.,]\d+)?\b/g;

const outputSchemaFor = (type: AiContentType) => ({
  name: `just_finds_${type}`,
  strict: true,
  schema: type === "business_seo_profile"
    ? { type: "object", properties: { text: { type: "string" }, title: { type: "string" }, description: { type: "string" }, faqs: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } }, required: ["question", "answer"], additionalProperties: false } }, serviceVerificationQuestions: { type: "array", items: { type: "string" }, maxItems: 5 }, facilityVerificationQuestions: { type: "array", items: { type: "string" }, maxItems: 5 } }, required: ["text", "title", "description", "faqs", "serviceVerificationQuestions", "facilityVerificationQuestions"], additionalProperties: false }
    : type === "faq"
    ? { type: "object", properties: { faqs: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } }, required: ["question", "answer"], additionalProperties: false } } }, required: ["faqs"], additionalProperties: false }
    : type === "seo_title"
      ? { type: "object", properties: { title: { type: "string" } }, required: ["title"], additionalProperties: false }
      : type === "meta_description"
        ? { type: "object", properties: { description: { type: "string" } }, required: ["description"], additionalProperties: false }
        : type === "business_highlights"
          ? { type: "object", properties: { highlights: { type: "array", items: { type: "string" }, maxItems: 6 } }, required: ["highlights"], additionalProperties: false }
          : { type: "object", properties: { text: { type: "string" } }, required: ["text"], additionalProperties: false },
});

function serializedFacts(facts: BusinessAiFacts): string {
  return JSON.stringify(facts);
}

function contentText(type: AiContentType, data: GeneratedContent): string {
  if (type === "faq") return (data.faqs ?? []).map(item => `${item.question} ${item.answer}`).join("\n");
  if (type === "seo_title") return data.title ?? "";
  if (type === "meta_description") return data.description ?? "";
  if (type === "business_highlights") return (data.highlights ?? []).join("\n");
  return data.text ?? "";
}

function validationText(type: AiContentType, data: GeneratedContent) {
  if (type !== "business_seo_profile") return contentText(type, data);
  return [data.text, data.title, data.description, ...(data.faqs ?? []).flatMap(item => [item.question, item.answer])].filter(Boolean).join("\n");
}

function faqSourceFields(item: { question: string; answer: string }, facts: BusinessAiFacts): string[] {
  const text = `${item.question} ${item.answer}`.toLowerCase();
  const sources: string[] = [];
  const candidates: Array<[string, unknown]> = [
    ["business.name", facts.business.name], ["business.address", facts.business.address], ["business.category", facts.business.category], ["business.city", facts.business.city], ["business.locality", facts.business.locality], ["business.phone", facts.business.phone], ["business.postcode", facts.business.postcode],
    ...facts.services.map(item => [`service:${item.name}`, item.name] as [string, unknown]),
    ...facts.facilities.map(item => [`facility:${item.name}`, item.name] as [string, unknown]),
    ...facts.fields.map(item => [`field:${item.label}`, item.label] as [string, unknown]),
    ...facts.hours.flatMap((item, index) => [[`hours:${index}:opens`, item.opensAt], [`hours:${index}:closes`, item.closesAt]] as Array<[string, unknown]>),
  ];
  for (const [key, value] of candidates) {
    if (typeof value === "string" && value.trim().length >= 3 && text.includes(value.toLowerCase())) sources.push(key);
  }
  if (facts.business.phone && /\b(phone|telephone|call|contact number)\b/.test(text)) sources.push("business.phone");
  if (facts.business.email && /\b(email|e-mail)\b/.test(text)) sources.push("business.email");
  return sources;
}

function normalizeGeneratedContent(type: AiContentType, data: GeneratedContent, facts: BusinessAiFacts): GeneratedContent {
  if (!(["faq", "business_seo_profile"] as AiContentType[]).includes(type) || !data.faqs) return data;
  const grounded = data.faqs
    .map(item => ({
      ...item,
      sourceFields: item.sourceFields?.length ? item.sourceFields : faqSourceFields(item, facts),
      status: "grounded" as const,
    }))
    .filter(item => item.question.trim().length > 0 && item.answer.trim().length > 0 && item.sourceFields.length > 0);
  const profileSuggestions = type === "business_seo_profile"
    ? {
        serviceVerificationQuestions: Array.from(new Set((data.serviceVerificationQuestions ?? []).map(item => item.trim()).filter(item => /^verify whether\b/i.test(item)))).slice(0, 5),
        facilityVerificationQuestions: Array.from(new Set((data.facilityVerificationQuestions ?? []).map(item => item.trim()).filter(item => /^verify whether\b/i.test(item)))).slice(0, 5),
      }
    : {};
  return { ...data, ...profileSuggestions, faqs: grounded.slice(0, 10) };
}

function similarity(left: string, right: string) {
  const a = new Set(left.toLowerCase().split(/\W+/).filter(Boolean));
  const b = new Set(right.toLowerCase().split(/\W+/).filter(Boolean));
  if (!a.size || !b.size) return 0;
  const intersection = Array.from(a).filter(word => b.has(word)).length;
  return intersection / (a.size + b.size - intersection);
}

export function validateGeneratedContent(type: AiContentType, data: GeneratedContent, facts: BusinessAiFacts, existingContents: string[] = []): ValidationResult {
  const flags: string[] = [];
  const normalized = normalizeGeneratedContent(type, data, facts);
  const text = validationText(type, normalized).trim();
  const source = serializedFacts(facts);
  if (!text) flags.push("empty_content");
  if (forbiddenClaims.test(text)) flags.push("unsupported_claim_language");
  for (const number of text.match(numberPattern) ?? []) {
    if (!source.includes(number)) flags.push("unsupported_numeric_claim");
  }
  if (["short_description", "seo_title"].includes(type) && text.length > 180) flags.push("length_limit_exceeded");
  if (type === "meta_description" && text.length > 300) flags.push("length_limit_exceeded");
  if (type === "faq" && (normalized.faqs ?? []).length !== 10) flags.push("faq_count_invalid");
  if (type === "business_seo_profile") {
    const faqCount = normalized.faqs?.length ?? 0;
    if (faqCount < 5 || faqCount > 10) flags.push("profile_faq_count_invalid");
    if (!(normalized.title ?? "").trim() || (normalized.title ?? "").length > 60) flags.push("profile_title_invalid");
    if (!(normalized.description ?? "").trim() || (normalized.description ?? "").length > 160) flags.push("profile_meta_description_invalid");
    if ([...(data.serviceVerificationQuestions ?? []), ...(data.facilityVerificationQuestions ?? [])].some(item => !/^verify whether\b/i.test(item.trim()))) flags.push("profile_verification_question_invalid");
  }
  if (type === "business_highlights" && ((normalized.highlights ?? []).length < 3 || (normalized.highlights ?? []).length > 6)) flags.push("highlight_count_invalid");
  if (["faq", "business_seo_profile"].includes(type) && (normalized.faqs ?? []).some(item => !item.question.trim() || !item.answer.trim() || !item.sourceFields?.length)) flags.push("faq_source_fields_missing");
  if (["doctor", "hospital", "clinic", "medical", "healthcare"].some(term => facts.business.category.toLowerCase().includes(term)) && /\b(diagnos|prescrib|success rate|guaranteed cure|guaranteed result|emergency instruction)\b/i.test(text)) flags.push("sensitive_claim_blocked");
  if (existingContents.some(existing => similarity(text, existing) >= 0.85)) flags.push("duplicate_content");
  return { accepted: flags.length === 0, flags: Array.from(new Set(flags)), normalized };
}

function factsForPrompt(facts: BusinessAiFacts) {
  return {
    ...facts,
    business: { ...facts.business, phone: facts.business.phone ? "Available in source facts" : null, email: facts.business.email ? "Available in source facts" : null },
  };
}

async function nextVersion(businessId: number, type: AiContentType) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const row = await db.select({ value: max(aiContentVersions.version) }).from(aiContentVersions).where(and(eq(aiContentVersions.businessId, businessId), eq(aiContentVersions.contentType, type)));
  return Number(row[0]?.value ?? 0) + 1;
}

export async function enqueueAiGenerationJob(input: { businessId: number; contentType: AiContentType; requestedById: number; batchId?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db.insert(aiGenerationJobs).values({ businessId: input.businessId, contentType: input.contentType, requestedById: input.requestedById, batchId: input.batchId, status: "queued", attempts: 0 }).$returningId();
  const jobId = Number(result[0]?.id);
  if (!jobId) throw new Error("The AI generation job could not be queued");
  return { jobId, status: "queued" as const };
}

export async function processAiGenerationJob(jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const jobs = await db.select().from(aiGenerationJobs).where(eq(aiGenerationJobs.id, jobId)).limit(1);
  const job = jobs[0];
  if (!job || ["completed", "cancelled"].includes(job.status)) return job;
  const attempt = job.attempts + 1;
    await db.update(aiGenerationJobs).set({ status: "processing", progressPercent: 5, attempts: attempt, startedAt: new Date(), errorCategory: null }).where(eq(aiGenerationJobs.id, jobId));
  try {
    await db.update(aiGenerationJobs).set({ progressPercent: 10 }).where(eq(aiGenerationJobs.id, jobId));
    const facts = await getBusinessAiFacts(job.businessId, false);
    if (!facts) throw new Error("Business facts are unavailable");
    const prompt = buildContentPrompt(job.contentType as PromptContentType, factsForPrompt(facts));
    await db.update(aiGenerationJobs).set({ progressPercent: 30 }).where(eq(aiGenerationJobs.id, jobId));
    const result = await generateStructured<GeneratedContent>({ system: prompt.system, user: prompt.user, outputSchema: outputSchemaFor(job.contentType as AiContentType), maxTokens: 1800 });
    await db.update(aiGenerationJobs).set({ progressPercent: 70 }).where(eq(aiGenerationJobs.id, jobId));
    const previousVersions = await getLatestAiContent(job.businessId, job.contentType as AiContentType);
    const validation = validateGeneratedContent(job.contentType as AiContentType, result.data, facts, previousVersions.map(version => version.content));
    const version = await nextVersion(job.businessId, job.contentType as AiContentType);
    const content = contentText(job.contentType as AiContentType, validation.normalized);
    await db.update(aiGenerationJobs).set({ progressPercent: 85 }).where(eq(aiGenerationJobs.id, jobId));
    const contentHash = createHash("sha256").update(`${job.contentType}:${content}`).digest("hex");
    const inserted = await db.insert(aiContentVersions).values({
      businessId: job.businessId,
      contentType: job.contentType,
      version,
      content,
      structured: validation.normalized,
      sourceFields: facts,
      validationFlags: validation.flags,
      reviewRequired: validation.accepted,
      status: validation.accepted ? "draft" : "rejected",
      authorship: "ai_generated",
      provider: result.provider,
      model: result.model,
      promptTemplate: `business_${job.contentType}`,
      promptVersion: PROMPT_VERSION,
      contentHash,
      generatedById: job.requestedById,
      generatedAt: new Date(),
    }).$returningId();
    const versionId = Number(inserted[0]?.id);
    await db.update(aiGenerationJobs).set({ status: validation.accepted ? "completed" : "failed", progressPercent: 100, resultVersionId: versionId || null, finishedAt: new Date(), errorCategory: validation.accepted ? null : validation.flags.join(",") }).where(eq(aiGenerationJobs.id, jobId));
    await db.insert(aiUsageEvents).values({ businessId: job.businessId, jobId, generationType: job.contentType, provider: result.provider, model: result.model, promptTokens: result.promptTokens, completionTokens: result.completionTokens, totalTokens: result.totalTokens, costAvailable: false, succeeded: validation.accepted });
    return { jobId, status: validation.accepted ? "completed" : "failed", versionId, validation };
  } catch (error) {
    const category = classifyAiError(error);
    const terminal = attempt >= job.maxAttempts;
    await db.update(aiGenerationJobs).set({ status: terminal ? "failed" : "retrying", progressPercent: terminal ? 100 : 0, errorCategory: category, finishedAt: terminal ? new Date() : null }).where(eq(aiGenerationJobs.id, jobId));
    if (terminal) return { jobId, status: "failed" as const, errorCategory: category };
    throw error;
  }
}

export async function enqueueAiGenerationBatch(input: { businessIds: number[]; contentTypes: AiContentType[]; requestedById: number; batchId: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const businessIds = Array.from(new Set(input.businessIds)).slice(0, 1000);
  const contentTypes = Array.from(new Set(input.contentTypes));
  const values = businessIds.flatMap(businessId => contentTypes.map(contentType => ({ businessId, contentType, requestedById: input.requestedById, batchId: input.batchId, status: "queued" as const, attempts: 0, progressPercent: 0 })));
  if (!values.length) return { batchId: input.batchId, jobIds: [], queued: 0 };
  await db.insert(aiGenerationBatches).values({ id: input.batchId, requestedById: input.requestedById, status: "queued", totalJobs: values.length, completedJobs: 0, failedJobs: 0 });
  const inserted = await db.insert(aiGenerationJobs).values(values).$returningId();
  return { batchId: input.batchId, jobIds: inserted.map(item => Number(item.id)), queued: values.length };
}

export async function attachAiGenerationBatchSchedule(batchId: string, taskUid: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.update(aiGenerationBatches).set({ scheduleCronTaskUid: taskUid, status: "queued", lastError: null, finishedAt: null }).where(eq(aiGenerationBatches.id, batchId));
}

export async function getAiGenerationBatch(batchId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const [batch] = await db.select().from(aiGenerationBatches).where(eq(aiGenerationBatches.id, batchId)).limit(1);
  if (!batch) return undefined;
  const progress = await getAiGenerationProgress({ batchId });
  return { ...batch, ...progress };
}

export async function processAiGenerationBatchChunk(input: { taskUid: string; batchId: string; maxJobs?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [batch] = await db.select().from(aiGenerationBatches).where(and(eq(aiGenerationBatches.id, input.batchId), eq(aiGenerationBatches.scheduleCronTaskUid, input.taskUid))).limit(1);
  if (!batch || ["completed", "cancelled"].includes(batch.status)) return { processed: false, reason: "no_owned_queued_batch" as const };
  const staleBefore = new Date(Date.now() - 3 * 60_000);
  const jobs = await db.select({ id: aiGenerationJobs.id }).from(aiGenerationJobs)
    .where(and(eq(aiGenerationJobs.batchId, input.batchId), or(inArray(aiGenerationJobs.status, ["queued", "retrying"]), and(eq(aiGenerationJobs.status, "processing"), sql`${aiGenerationJobs.startedAt} < ${staleBefore}`))))
    .orderBy(asc(aiGenerationJobs.createdAt)).limit(Math.min(Math.max(input.maxJobs ?? 3, 1), 5));
  if (!jobs.length) {
    const progress = await getAiGenerationProgress({ batchId: input.batchId });
    const final = progress.pending === 0;
    await db.update(aiGenerationBatches).set({ status: final ? "completed" : "processing", completedJobs: progress.completed, failedJobs: progress.failed, finishedAt: final ? new Date() : null }).where(eq(aiGenerationBatches.id, input.batchId));
    return { processed: false, completed: progress.completed, failed: progress.failed, pending: progress.pending, done: final };
  }
  await db.update(aiGenerationBatches).set({ status: "processing" }).where(eq(aiGenerationBatches.id, input.batchId));
  let lastError: string | null = null;
  for (const job of jobs) {
    try {
      await processAiGenerationJob(job.id);
    } catch (error) {
      lastError = error instanceof Error ? error.message.slice(0, 1000) : "The AI rewrite worker failed.";
    }
  }
  const progress = await getAiGenerationProgress({ batchId: input.batchId });
  const done = progress.pending === 0;
  await db.update(aiGenerationBatches).set({ status: done ? "completed" : "processing", completedJobs: progress.completed, failedJobs: progress.failed, lastError, finishedAt: done ? new Date() : null }).where(eq(aiGenerationBatches.id, input.batchId));
  return { processed: true, completed: progress.completed, failed: progress.failed, pending: progress.pending, done };
}

export async function getAiGenerationProgress(input: { batchId?: string; jobId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const conditions = input.jobId ? [eq(aiGenerationJobs.id, input.jobId)] : input.batchId ? [eq(aiGenerationJobs.batchId, input.batchId)] : [];
  const jobs = await db.select({ id: aiGenerationJobs.id, businessId: aiGenerationJobs.businessId, status: aiGenerationJobs.status, progressPercent: aiGenerationJobs.progressPercent, errorCategory: aiGenerationJobs.errorCategory, resultVersionId: aiGenerationJobs.resultVersionId }).from(aiGenerationJobs).where(conditions.length ? and(...conditions) : undefined);
  const total = jobs.length;
  const progressPercent = total ? Math.round(jobs.reduce((sum, job) => sum + job.progressPercent, 0) / total) : 0;
  return { total, completed: jobs.filter(job => job.status === "completed").length, failed: jobs.filter(job => job.status === "failed").length, pending: jobs.filter(job => ["queued", "processing", "retrying"].includes(job.status)).length, progressPercent, jobs };
}

export async function cancelAiGenerationJob(jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const rows = await db.select({ status: aiGenerationJobs.status }).from(aiGenerationJobs).where(eq(aiGenerationJobs.id, jobId)).limit(1);
  if (!rows[0]) return false;
  if (!["queued", "retrying"].includes(rows[0].status)) return false;
  await db.update(aiGenerationJobs).set({ status: "cancelled", finishedAt: new Date() }).where(eq(aiGenerationJobs.id, jobId));
  return true;
}

export async function getAiGenerationAnalytics() {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const jobs = await db.select({ status: aiGenerationJobs.status, createdAt: aiGenerationJobs.createdAt }).from(aiGenerationJobs);
  const usage = await db.select({ costAvailable: aiUsageEvents.costAvailable, estimatedCostMicros: aiUsageEvents.estimatedCostMicros }).from(aiUsageEvents);
  const now = Date.now();
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
  const createdAtMs = (value: Date | string) => new Date(value).getTime();
  return {
    today: jobs.filter(job => createdAtMs(job.createdAt) >= startOfToday.getTime()).length,
    month: jobs.filter(job => createdAtMs(job.createdAt) >= startOfMonth.getTime()).length,
    failed: jobs.filter(job => job.status === "failed").length,
    pending: jobs.filter(job => ["queued", "processing", "retrying"].includes(job.status)).length,
    totalCostMicros: usage.every(event => event.costAvailable) ? usage.reduce((sum, event) => sum + (event.estimatedCostMicros ?? 0), 0) : null,
    costMessage: usage.some(event => !event.costAvailable) ? "Cost data unavailable from provider." : null,
    generatedAt: new Date(now),
  };
}

export async function getLatestAiContent(businessId: number, type?: AiContentType) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(aiContentVersions.businessId, businessId)];
  if (type) conditions.push(eq(aiContentVersions.contentType, type));
  return db.select().from(aiContentVersions).where(and(...conditions)).orderBy(desc(aiContentVersions.version));
}

export async function getAiReviewQueue() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: aiContentVersions.id,
    businessId: aiContentVersions.businessId,
    businessName: businesses.name,
    originalAbout: businesses.aboutDescription,
    originalShortDescription: businesses.shortDescription,
    originalSeoTitle: businesses.seoTitle,
    originalMetaDescription: businesses.metaDescription,
    originalFaqs: businessAiContent.faqs,
    contentType: aiContentVersions.contentType,
    version: aiContentVersions.version,
    content: aiContentVersions.content,
    structured: aiContentVersions.structured,
    validationFlags: aiContentVersions.validationFlags,
    status: aiContentVersions.status,
    reviewRequired: aiContentVersions.reviewRequired,
    generatedAt: aiContentVersions.generatedAt,
  }).from(aiContentVersions).innerJoin(businesses, eq(aiContentVersions.businessId, businesses.id)).leftJoin(businessAiContent, eq(aiContentVersions.businessId, businessAiContent.businessId)).where(inArray(aiContentVersions.status, ["pending_review", "approved"])).orderBy(desc(aiContentVersions.generatedAt));
}

export type AiContentStatus = "draft" | "pending_review" | "approved" | "published" | "rejected";

const allowedTransitions: Record<AiContentStatus, AiContentStatus[]> = {
  draft: ["pending_review", "rejected"],
  pending_review: ["approved", "rejected"],
  approved: ["published", "rejected"],
  published: [],
  rejected: ["draft"],
};

export function canTransitionAiContent(from: AiContentStatus, to: AiContentStatus) {
  return allowedTransitions[from].includes(to);
}

export function canApplyApprovedAboutToListing(contentType: AiContentType, status: AiContentStatus) {
  return contentType === "about_business" && status === "approved";
}

export function canApplyApprovedContentToListing(contentType: AiContentType, status: AiContentStatus) {
  return ["about_business", "business_seo_profile", "seo_title", "meta_description", "faq"].includes(contentType) && status === "approved";
}

export async function transitionAiContentVersion(input: { versionId: number; to: AiContentStatus; actorId: number; note?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const rows = await db.select().from(aiContentVersions).where(eq(aiContentVersions.id, input.versionId)).limit(1);
  const current = rows[0];
  if (!current) return false;
  if (!canTransitionAiContent(current.status as AiContentStatus, input.to)) throw new Error(`Invalid AI content transition: ${current.status} -> ${input.to}`);
  await db.update(aiContentVersions).set({ status: input.to, reviewRequired: input.to === "draft" || input.to === "pending_review", reviewedById: input.to === "approved" || input.to === "published" || input.to === "rejected" ? input.actorId : current.reviewedById, reviewNote: input.note ?? current.reviewNote, publishedAt: input.to === "published" ? new Date() : input.to === "draft" ? null : current.publishedAt }).where(eq(aiContentVersions.id, input.versionId));
  return true;
}

export async function createAiDraftFromVersion(input: { versionId: number; actorId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const rows = await db.select().from(aiContentVersions).where(eq(aiContentVersions.id, input.versionId)).limit(1);
  const source = rows[0];
  if (!source) return undefined;
  const version = await nextVersion(source.businessId, source.contentType as AiContentType);
  const inserted = await db.insert(aiContentVersions).values({ businessId: source.businessId, contentType: source.contentType, version, content: source.content, structured: source.structured, sourceFields: source.sourceFields, validationFlags: source.validationFlags, reviewRequired: false, status: "draft", authorship: "ai_generated", provider: source.provider, model: source.model, promptTemplate: source.promptTemplate, promptVersion: source.promptVersion, contentHash: source.contentHash, generatedById: input.actorId }).$returningId();
  return Number(inserted[0]?.id);
}

export async function approveAiContentVersion(input: { versionId: number; reviewerId: number; note?: string }) {
  return transitionAiContentVersion({ versionId: input.versionId, to: "approved", actorId: input.reviewerId, note: input.note });
}

export async function publishAiContentVersion(input: { versionId: number; reviewerId: number; note?: string }) {
  return transitionAiContentVersion({ versionId: input.versionId, to: "published", actorId: input.reviewerId, note: input.note });
}

export async function publishApprovedAboutToListing(input: { versionId: number; reviewerId: number; note?: string }) {
  return publishApprovedContentToListing(input, true);
}

async function captureOriginalAiContentSnapshot(businessId: number, actorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [business] = await db.select({ aboutDescription: businesses.aboutDescription, seoTitle: businesses.seoTitle, metaDescription: businesses.metaDescription }).from(businesses).where(eq(businesses.id, businessId)).limit(1);
  if (!business) throw new Error("Business not found");
  const [existingAi] = await db.select({ faqs: businessAiContent.faqs, status: businessAiContent.status, sourceHash: businessAiContent.sourceHash }).from(businessAiContent).where(eq(businessAiContent.businessId, businessId)).limit(1);
  const existingSnapshot = await db.select({ id: businessRevisions.id }).from(businessRevisions).where(and(eq(businessRevisions.businessId, businessId), eq(businessRevisions.changeType, "ai_content_original_snapshot"))).limit(1);
  if (existingSnapshot[0]) return;
  await db.insert(businessRevisions).values({
    businessId,
    createdBy: actorId,
    changeType: "ai_content_original_snapshot",
    payload: { business, aiContent: existingAi ?? null },
    status: "approved",
  });
}

export async function revertBusinessAiContentToOriginal(input: { businessId: number; actorId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [snapshot] = await db.select({ payload: businessRevisions.payload }).from(businessRevisions)
    .where(and(eq(businessRevisions.businessId, input.businessId), eq(businessRevisions.changeType, "ai_content_original_snapshot")))
    .orderBy(asc(businessRevisions.createdAt), asc(businessRevisions.id)).limit(1);
  const payload = snapshot?.payload as { business?: { aboutDescription?: string | null; seoTitle?: string | null; metaDescription?: string | null }; aiContent?: { faqs?: unknown; status?: "pending" | "processing" | "completed" | "failed"; sourceHash?: string | null } | null } | undefined;
  if (!payload?.business) throw new Error("No original AI-content snapshot is available for this listing.");
  await db.transaction(async tx => {
    await tx.update(businesses).set({
      aboutDescription: payload.business?.aboutDescription ?? null,
      seoTitle: payload.business?.seoTitle ?? null,
      metaDescription: payload.business?.metaDescription ?? null,
    }).where(eq(businesses.id, input.businessId));
    const [currentAi] = await tx.select({ id: businessAiContent.id }).from(businessAiContent).where(eq(businessAiContent.businessId, input.businessId)).limit(1);
    if (!payload.aiContent) {
      if (currentAi) await tx.delete(businessAiContent).where(eq(businessAiContent.id, currentAi.id));
      return;
    }
    const values = { faqs: payload.aiContent.faqs ?? null, status: payload.aiContent.status ?? "completed", sourceHash: payload.aiContent.sourceHash ?? null };
    if (currentAi) await tx.update(businessAiContent).set(values).where(eq(businessAiContent.id, currentAi.id));
    else await tx.insert(businessAiContent).values({ businessId: input.businessId, ...values });
  });
  return { businessId: input.businessId, reverted: true };
}

export async function publishApprovedContentToListing(input: { versionId: number; reviewerId: number; note?: string }, aboutOnly = false) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const rows = await db.select({ businessId: aiContentVersions.businessId, contentType: aiContentVersions.contentType, status: aiContentVersions.status, content: aiContentVersions.content, structured: aiContentVersions.structured }).from(aiContentVersions).where(eq(aiContentVersions.id, input.versionId)).limit(1);
  const version = rows[0];
  if (!version) throw new Error("AI content version not found");
  const contentType = version.contentType as AiContentType;
  const permitted = aboutOnly ? canApplyApprovedAboutToListing(contentType, version.status as AiContentStatus) : canApplyApprovedContentToListing(contentType, version.status as AiContentStatus);
  if (!permitted) throw new Error(aboutOnly ? "Only an approved About Business draft can update the listing." : "Only an approved business profile, About, SEO title, meta description, or FAQ draft can update the listing.");
  await captureOriginalAiContentSnapshot(version.businessId, input.reviewerId);
  if (contentType === "business_seo_profile") {
    const profile = version.structured && typeof version.structured === "object" ? version.structured as GeneratedContent : {};
    const faqs = Array.isArray(profile.faqs) ? profile.faqs : [];
    if (!profile.title || !profile.description || faqs.length < 5 || faqs.length > 10) throw new Error("The approved business SEO profile is incomplete and cannot be published.");
    await db.update(businesses).set({ aboutDescription: version.content, seoTitle: profile.title, metaDescription: profile.description }).where(eq(businesses.id, version.businessId));
    const existing = await db.select({ id: businessAiContent.id }).from(businessAiContent).where(eq(businessAiContent.businessId, version.businessId)).limit(1);
    if (existing[0]) await db.update(businessAiContent).set({ faqs, status: "completed" }).where(eq(businessAiContent.id, existing[0].id));
    else await db.insert(businessAiContent).values({ businessId: version.businessId, faqs, status: "completed" });
  }
  if (contentType === "about_business") await db.update(businesses).set({ aboutDescription: version.content }).where(eq(businesses.id, version.businessId));
  if (contentType === "seo_title") await db.update(businesses).set({ seoTitle: version.content }).where(eq(businesses.id, version.businessId));
  if (contentType === "meta_description") await db.update(businesses).set({ metaDescription: version.content }).where(eq(businesses.id, version.businessId));
  if (contentType === "faq") {
    const faqs = version.structured && typeof version.structured === "object" && "faqs" in version.structured && Array.isArray((version.structured as { faqs?: unknown }).faqs) ? (version.structured as { faqs: unknown[] }).faqs : [];
    if (!faqs.length) throw new Error("The approved FAQ draft has no structured FAQ entries to publish.");
    const existing = await db.select({ id: businessAiContent.id }).from(businessAiContent).where(eq(businessAiContent.businessId, version.businessId)).limit(1);
    if (existing[0]) await db.update(businessAiContent).set({ faqs, status: "completed" }).where(eq(businessAiContent.id, existing[0].id));
    else await db.insert(businessAiContent).values({ businessId: version.businessId, faqs, status: "completed" });
  }
  await transitionAiContentVersion({ versionId: input.versionId, to: "published", actorId: input.reviewerId, note: input.note });
  return { businessId: version.businessId, applied: true };
}
