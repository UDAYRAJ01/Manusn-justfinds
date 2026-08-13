import { createHash } from "node:crypto";
import { and, desc, eq, max } from "drizzle-orm";
import { aiContentVersions, aiGenerationJobs, aiUsageEvents, businesses } from "../../../drizzle/schema";
import { getBusinessAiFacts, getDb } from "../../db";
import { buildContentPrompt, PROMPT_VERSION, type PromptContentType } from "./prompts";
import { generateStructured, classifyAiError } from "./provider";
import type { AiContentType, BusinessAiFacts, GeneratedContent, ValidationResult } from "./types";

const forbiddenClaims = /\b(guaranteed|guarantee|award[- ]winning|best in|number one|#1|top[- ]rated|five[- ]star|5[- ]star|testimonial|review says|cheap|lowest price|discount|free consultation)\b/i;
const numberPattern = /\b\d+(?:[.,]\d+)?\b/g;

const outputSchemaFor = (type: AiContentType) => ({
  name: `just_finds_${type}`,
  strict: true,
  schema: type === "faq"
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

export function validateGeneratedContent(type: AiContentType, data: GeneratedContent, facts: BusinessAiFacts): ValidationResult {
  const flags: string[] = [];
  const text = contentText(type, data).trim();
  const source = serializedFacts(facts);
  if (!text) flags.push("empty_content");
  if (forbiddenClaims.test(text)) flags.push("unsupported_claim_language");
  for (const number of text.match(numberPattern) ?? []) {
    if (!source.includes(number)) flags.push("unsupported_numeric_claim");
  }
  if (["short_description", "seo_title"].includes(type) && text.length > 180) flags.push("length_limit_exceeded");
  if (type === "meta_description" && text.length > 300) flags.push("length_limit_exceeded");
  if (type === "faq" && (data.faqs ?? []).length > 5) flags.push("faq_limit_exceeded");
  if (type === "business_highlights" && ((data.highlights ?? []).length < 3 || (data.highlights ?? []).length > 6)) flags.push("highlight_count_invalid");
  if (type === "faq" && (data.faqs ?? []).some(item => !item.question.trim() || !item.answer.trim())) flags.push("faq_item_empty");
  return { accepted: flags.length === 0, flags: Array.from(new Set(flags)), normalized: data };
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
  await db.update(aiGenerationJobs).set({ status: "processing", attempts: attempt, startedAt: new Date(), errorCategory: null }).where(eq(aiGenerationJobs.id, jobId));
  try {
    const facts = await getBusinessAiFacts(job.businessId, false);
    if (!facts) throw new Error("Business facts are unavailable");
    const prompt = buildContentPrompt(job.contentType as PromptContentType, factsForPrompt(facts));
    const result = await generateStructured<GeneratedContent>({ system: prompt.system, user: prompt.user, outputSchema: outputSchemaFor(job.contentType as AiContentType), maxTokens: 1800 });
    const validation = validateGeneratedContent(job.contentType as AiContentType, result.data, facts);
    const version = await nextVersion(job.businessId, job.contentType as AiContentType);
    const content = contentText(job.contentType as AiContentType, validation.normalized);
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
    await db.update(aiGenerationJobs).set({ status: validation.accepted ? "completed" : "failed", resultVersionId: versionId || null, finishedAt: new Date(), errorCategory: validation.accepted ? null : validation.flags.join(",") }).where(eq(aiGenerationJobs.id, jobId));
    await db.insert(aiUsageEvents).values({ businessId: job.businessId, jobId, generationType: job.contentType, provider: result.provider, model: result.model, promptTokens: result.promptTokens, completionTokens: result.completionTokens, totalTokens: result.totalTokens, costAvailable: false, succeeded: validation.accepted });
    return { jobId, status: validation.accepted ? "completed" : "failed", versionId, validation };
  } catch (error) {
    const category = classifyAiError(error);
    const terminal = attempt >= job.maxAttempts;
    await db.update(aiGenerationJobs).set({ status: terminal ? "failed" : "retrying", errorCategory: category, finishedAt: terminal ? new Date() : null }).where(eq(aiGenerationJobs.id, jobId));
    if (terminal) return { jobId, status: "failed" as const, errorCategory: category };
    throw error;
  }
}

export async function getLatestAiContent(businessId: number, type?: AiContentType) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(aiContentVersions.businessId, businessId)];
  if (type) conditions.push(eq(aiContentVersions.contentType, type));
  return db.select().from(aiContentVersions).where(and(...conditions)).orderBy(desc(aiContentVersions.version));
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
