import { createHash, randomUUID } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
  aiContentVersions,
  businessChatMessages,
  businessChatSessions,
  businessKnowledgeItems,
  businessUnansweredQuestions,
} from "../../../drizzle/schema";
import { getBusinessAiFacts, getDb } from "../../db";
import type { BusinessAiFacts } from "./types";

const FALLBACK = "I don't have that information for this business.";

type KnowledgeSourceType = "profile" | "service" | "facility" | "hours" | "offer" | "faq" | "category_field" | "owner_content" | "ai_content";

type KnowledgeSeed = {
  sourceType: KnowledgeSourceType;
  sourceId?: number | null;
  label: string;
  content: string;
};

function asText(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  return JSON.stringify(value);
}

function buildKnowledgeSeeds(facts: BusinessAiFacts): KnowledgeSeed[] {
  const seeds: KnowledgeSeed[] = [];
  const profile = [
    `Business name: ${facts.business.name}`,
    `Category: ${facts.business.category}`,
    `City: ${facts.business.city}`,
    facts.business.locality ? `Locality: ${facts.business.locality}` : "",
    facts.business.address ? `Address: ${facts.business.address}` : "",
    facts.business.postcode ? `Postcode: ${facts.business.postcode}` : "",
    facts.business.phone ? `Phone: ${facts.business.phone}` : "",
    facts.business.whatsapp ? `WhatsApp: ${facts.business.whatsapp}` : "",
    facts.business.email ? `Email: ${facts.business.email}` : "",
    facts.business.website ? `Website: ${facts.business.website}` : "",
    facts.business.approvedDescription ? `Approved description: ${facts.business.approvedDescription}` : "",
  ].filter(Boolean).join("\n");
  if (profile) seeds.push({ sourceType: "profile", label: "approved-profile", content: profile });
  facts.services.forEach(service => seeds.push({ sourceType: "service", label: service.name, content: [service.name, service.description].filter(Boolean).join(": ") }));
  facts.facilities.forEach(facility => seeds.push({ sourceType: "facility", label: facility.name, content: [facility.name, facility.details].filter(Boolean).join(": ") }));
  if (facts.hours.length) seeds.push({ sourceType: "hours", label: "business-hours", content: facts.hours.map(hour => `Day ${hour.dayOfWeek}: ${hour.isClosed ? "Closed" : hour.isTwentyFourHours ? "Open 24 hours" : `${hour.opensAt ?? ""}-${hour.closesAt ?? ""}`}`).join("; ") });
  facts.fields.forEach(field => {
    const value = asText(field.value);
    if (value) seeds.push({ sourceType: "category_field", label: field.label, content: `${field.label}: ${value}` });
  });
  return seeds;
}

export async function syncBusinessKnowledge(businessId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const facts = await getBusinessAiFacts(businessId, true);
  if (!facts) return { businessId, synced: 0 };
  const publishedVersions = await db.select({ id: aiContentVersions.id, contentType: aiContentVersions.contentType, content: aiContentVersions.content }).from(aiContentVersions).where(and(eq(aiContentVersions.businessId, businessId), eq(aiContentVersions.status, "published"))).orderBy(asc(aiContentVersions.contentType), asc(aiContentVersions.version));
  const seeds = buildKnowledgeSeeds(facts);
  publishedVersions.forEach(version => seeds.push({ sourceType: "ai_content", sourceId: version.id, label: version.contentType, content: version.content }));
  const keys = new Set(seeds.map(seed => `${seed.sourceType}:${seed.label}`));
  const existing = await db.select({ id: businessKnowledgeItems.id, sourceType: businessKnowledgeItems.sourceType, label: businessKnowledgeItems.label }).from(businessKnowledgeItems).where(eq(businessKnowledgeItems.businessId, businessId));
  for (const seed of seeds) {
    await db.insert(businessKnowledgeItems).values({ businessId, sourceType: seed.sourceType, sourceId: seed.sourceId ?? null, label: seed.label, content: seed.content, status: "active" }).onDuplicateKeyUpdate({ set: { sourceId: seed.sourceId ?? null, content: seed.content, status: "active", updatedAt: new Date() } });
  }
  for (const item of existing) {
    if (!keys.has(`${item.sourceType}:${item.label}`)) await db.update(businessKnowledgeItems).set({ status: "stale", updatedAt: new Date() }).where(eq(businessKnowledgeItems.id, item.id));
  }
  return { businessId, synced: seeds.length };
}

export async function getBusinessKnowledge(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(businessKnowledgeItems).where(and(eq(businessKnowledgeItems.businessId, businessId), eq(businessKnowledgeItems.status, "active"))).orderBy(asc(businessKnowledgeItems.id));
}

function questionTokens(question: string) {
  return new Set(question.toLowerCase().split(/\W+/).filter(token => token.length >= 3));
}

export function rankKnowledge(question: string, items: Array<{ id: number; label: string; content: string }>, limit = 8) {
  const tokens = questionTokens(question);
  return items.map(item => {
    const itemTokens = new Set(`${item.label} ${item.content}`.toLowerCase().split(/\W+/).filter(token => token.length >= 3));
    const score = Array.from(tokens).filter(token => itemTokens.has(token)).length;
    return { item, score };
  }).filter(entry => entry.score > 0).sort((left, right) => right.score - left.score || left.item.id - right.item.id).slice(0, limit).map(entry => entry.item);
}

type ApprovedKnowledgeItem = {
  id: number;
  label: string;
  content: string;
  sourceType?: string;
};

const sourceHints: Array<{ pattern: RegExp; sources: KnowledgeSourceType[] }> = [
  { pattern: /\b(service|services|offer|offers|provide|available|treatment|treatments)\b/i, sources: ["service", "facility", "offer"] },
  { pattern: /\b(hour|hours|open|opening|close|closing|time|timing|timings)\b/i, sources: ["hours"] },
  { pattern: /\b(address|location|where|directions|reach|there|city|phone|call|whatsapp|email|contact)\b/i, sources: ["profile"] },
  { pattern: /\b(facility|facilities|amenit|feature|features)\b/i, sources: ["facility"] },
];

/** Uses only already-approved listing records so public chat remains fast and factual. */
export function retrieveApprovedKnowledge(question: string, items: ApprovedKnowledgeItem[], limit = 3) {
  const ranked = rankKnowledge(question, items, limit);
  if (ranked.length) return ranked;

  const hint = sourceHints.find(item => item.pattern.test(question));
  if (hint) {
    const contextual = items.filter(item => hint.sources.includes(item.sourceType as KnowledgeSourceType));
    if (contextual.length) return contextual.slice(0, limit);
  }

  return items.filter(item => item.sourceType === "profile").slice(0, 1);
}

export function createApprovedBusinessAnswer(items: ApprovedKnowledgeItem[]) {
  const entries = items.map(item => item.content.trim()).filter(Boolean).slice(0, 3);
  if (!entries.length) return { answer: FALLBACK, answered: false };
  return {
    answer: `Based on this business's approved information:\n\n${entries.map(entry => `• ${entry}`).join("\n")}`,
    answered: true,
  };
}

async function recordUnanswered(db: Awaited<ReturnType<typeof getDb>>, businessId: number, question: string) {
  if (!db) return;
  const normalized = question.trim().toLowerCase().replace(/\s+/g, " ");
  const questionHash = createHash("sha256").update(normalized).digest("hex");
  const existing = await db.select({ id: businessUnansweredQuestions.id, askCount: businessUnansweredQuestions.askCount }).from(businessUnansweredQuestions).where(and(eq(businessUnansweredQuestions.businessId, businessId), eq(businessUnansweredQuestions.questionHash, questionHash))).limit(1);
  if (existing[0]) {
    await db.update(businessUnansweredQuestions).set({ askCount: existing[0].askCount + 1, lastAskedAt: new Date(), status: "open" }).where(eq(businessUnansweredQuestions.id, existing[0].id));
  } else {
    await db.insert(businessUnansweredQuestions).values({ businessId, question: question.trim(), questionHash, askCount: 1, status: "open" });
  }
}

export async function answerBusinessQuestion(input: { businessId: number; question: string; sessionId?: string; userId?: number | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const facts = await getBusinessAiFacts(input.businessId, true);
  if (!facts) return { answer: FALLBACK, answered: false, knowledgeItemIds: [], sessionId: input.sessionId ?? randomUUID() };
  await syncBusinessKnowledge(input.businessId);
  const knowledge = await getBusinessKnowledge(input.businessId);
  const retrieved = retrieveApprovedKnowledge(input.question, knowledge);
  const sessionId = input.sessionId ?? randomUUID();
  let answer = FALLBACK;
  let answered = false;
  if (retrieved.length) {
    const deterministicAnswer = createApprovedBusinessAnswer(retrieved);
    answer = deterministicAnswer.answer;
    answered = deterministicAnswer.answered;
  }
  if (!answered) await recordUnanswered(db, input.businessId, input.question);
  const sessions = await db.select({ id: businessChatSessions.id, messageCount: businessChatSessions.messageCount, unansweredCount: businessChatSessions.unansweredCount }).from(businessChatSessions).where(and(eq(businessChatSessions.businessId, input.businessId), eq(businessChatSessions.sessionId, sessionId))).limit(1);
  const session = sessions[0];
  if (session) {
    await db.update(businessChatSessions).set({ messageCount: session.messageCount + 2, unansweredCount: session.unansweredCount + (answered ? 0 : 1), lastMessageAt: new Date() }).where(eq(businessChatSessions.id, session.id));
  } else {
    await db.insert(businessChatSessions).values({ businessId: input.businessId, sessionId, userId: input.userId ?? null, messageCount: 2, unansweredCount: answered ? 0 : 1 });
  }
  await db.insert(businessChatMessages).values([
    { businessId: input.businessId, sessionId, role: "user", message: input.question, answered },
    { businessId: input.businessId, sessionId, role: "assistant", message: answer, answered, knowledgeItemIds: retrieved.map(item => item.id) },
  ]);
  return { answer, answered, knowledgeItemIds: retrieved.map(item => item.id), sessionId };
}

export async function getBusinessChatHistory(businessId: number, sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(businessChatMessages).where(and(eq(businessChatMessages.businessId, businessId), eq(businessChatMessages.sessionId, sessionId))).orderBy(asc(businessChatMessages.createdAt));
}

export async function listUnansweredQuestions(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(businessUnansweredQuestions).where(and(eq(businessUnansweredQuestions.businessId, businessId), eq(businessUnansweredQuestions.status, "open"))).orderBy(asc(businessUnansweredQuestions.lastAskedAt));
}

export async function resolveUnansweredQuestion(input: { id: number; businessId: number; status: "resolved" | "dismissed"; resolutionNote?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.update(businessUnansweredQuestions).set({ status: input.status, resolutionNote: input.resolutionNote ?? null }).where(and(eq(businessUnansweredQuestions.id, input.id), eq(businessUnansweredQuestions.businessId, input.businessId)));
  return true;
}

export { FALLBACK as BUSINESS_CHAT_FALLBACK };

export const knowledgeSourceTypes = ["profile", "service", "facility", "hours", "offer", "faq", "category_field", "owner_content", "ai_content"] as const;
export type { KnowledgeSourceType };

export async function getKnowledgeItemsByIds(businessId: number, ids: number[]) {
  const db = await getDb();
  if (!db || !ids.length) return [];
  return db.select().from(businessKnowledgeItems).where(and(eq(businessKnowledgeItems.businessId, businessId), inArray(businessKnowledgeItems.id, ids), eq(businessKnowledgeItems.status, "active")));
}

export async function refreshBusinessKnowledge(businessId: number) {
  return syncBusinessKnowledge(businessId);
}

export async function getKnowledgeForChat(businessId: number, question: string) {
  const items = await getBusinessKnowledge(businessId);
  return rankKnowledge(question, items);
}

export async function getUnansweredQuestionCount(businessId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ id: businessUnansweredQuestions.id }).from(businessUnansweredQuestions).where(and(eq(businessUnansweredQuestions.businessId, businessId), eq(businessUnansweredQuestions.status, "open")));
  return rows.length;
}

export async function getChatSessionCount(businessId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ id: businessChatSessions.id }).from(businessChatSessions).where(eq(businessChatSessions.businessId, businessId));
  return rows.length;
}

export async function getBusinessChatMessagesForAdmin(businessId: number, sessionId: string) {
  return getBusinessChatHistory(businessId, sessionId);
}

export async function getKnowledgeItemCount(businessId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ id: businessKnowledgeItems.id }).from(businessKnowledgeItems).where(and(eq(businessKnowledgeItems.businessId, businessId), eq(businessKnowledgeItems.status, "active")));
  return rows.length;
}

export async function getUnansweredQuestionById(businessId: number, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(businessUnansweredQuestions).where(and(eq(businessUnansweredQuestions.id, id), eq(businessUnansweredQuestions.businessId, businessId))).limit(1);
  return rows[0];
}

export async function markKnowledgeItemStatus(input: { businessId: number; id: number; status: "active" | "stale" | "disabled" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.update(businessKnowledgeItems).set({ status: input.status, updatedAt: new Date() }).where(and(eq(businessKnowledgeItems.id, input.id), eq(businessKnowledgeItems.businessId, input.businessId)));
  return true;
}

export async function getKnowledgeSources(businessId: number) {
  const items = await getBusinessKnowledge(businessId);
  return items.map(item => ({ id: item.id, sourceType: item.sourceType, label: item.label, updatedAt: item.updatedAt }));
}

export async function getChatAnalytics(businessId: number) {
  const db = await getDb();
  if (!db) return { sessions: 0, messages: 0, unanswered: 0 };
  const [sessions, messages, unanswered] = await Promise.all([
    db.select({ id: businessChatSessions.id }).from(businessChatSessions).where(eq(businessChatSessions.businessId, businessId)),
    db.select({ id: businessChatMessages.id }).from(businessChatMessages).where(eq(businessChatMessages.businessId, businessId)),
    db.select({ id: businessUnansweredQuestions.id }).from(businessUnansweredQuestions).where(and(eq(businessUnansweredQuestions.businessId, businessId), eq(businessUnansweredQuestions.status, "open"))),
  ]);
  return { sessions: sessions.length, messages: messages.length, unanswered: unanswered.length };
}
