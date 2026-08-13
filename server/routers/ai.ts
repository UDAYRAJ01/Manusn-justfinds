import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createBusinessLead, getDb } from "../db";
import { businesses } from "../../drizzle/schema";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { canManageBusiness, canModerate } from "../domain/permissions";
import { answerBusinessQuestion, getBusinessChatHistory, getChatAnalytics, getKnowledgeSources, listUnansweredQuestions, refreshBusinessKnowledge, resolveUnansweredQuestion } from "../domain/ai/knowledge";
import { eq } from "drizzle-orm";

export const aiRouter = router({
  businessChat: publicProcedure.input(z.object({
    businessId: z.number().int().positive(),
    question: z.string().min(1).max(600),
    sessionId: z.string().min(16).max(64).optional(),
    leadConsent: z.boolean().optional(),
    customerName: z.string().min(2).max(160).optional(),
    customerContact: z.string().min(3).max(160).optional(),
  })).mutation(async ({ ctx, input }) => {
    const result = await answerBusinessQuestion({ businessId: input.businessId, question: input.question, sessionId: input.sessionId, userId: ctx.user?.id });
    if (input.leadConsent && input.customerName && input.customerContact) {
      await createBusinessLead({
        businessId: input.businessId,
        name: input.customerName,
        email: input.customerContact.includes("@") ? input.customerContact : undefined,
        phone: !input.customerContact.includes("@") ? input.customerContact : undefined,
        message: `Lead captured via AI Chatbot session ${input.sessionId ?? "anonymous"}: ${input.question}`,
        page: "AI Chatbot",
      });
    }
    return result;
  }),
  createLead: publicProcedure.input(z.object({ businessId: z.number().int().positive(), name: z.string().min(2).max(160), phone: z.string().max(32).optional(), email: z.string().email().optional(), message: z.string().max(2000).optional(), page: z.string().max(500).optional() })).mutation(async ({ input }) => {
    await createBusinessLead(input);
    return { success: true };
  }),
  refreshKnowledge: protectedProcedure.input(z.object({ businessId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    const business = (await db?.select({ ownerId: businesses.ownerId }).from(businesses).where(eq(businesses.id, input.businessId)).limit(1))?.[0];
    if (!business) throw new TRPCError({ code: "NOT_FOUND", message: "Business not found." });
    if (!canManageBusiness(ctx.user.role as Parameters<typeof canManageBusiness>[0], ctx.user.id, business.ownerId)) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot manage this business knowledge base." });
    return refreshBusinessKnowledge(input.businessId);
  }),
  knowledgeSources: protectedProcedure.input(z.object({ businessId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    const business = (await db?.select({ ownerId: businesses.ownerId }).from(businesses).where(eq(businesses.id, input.businessId)).limit(1))?.[0];
    if (!business) throw new TRPCError({ code: "NOT_FOUND", message: "Business not found." });
    if (!canManageBusiness(ctx.user.role as Parameters<typeof canManageBusiness>[0], ctx.user.id, business.ownerId)) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot view this business knowledge base." });
    return getKnowledgeSources(input.businessId);
  }),
  unansweredQuestions: protectedProcedure.input(z.object({ businessId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    const business = (await db?.select({ ownerId: businesses.ownerId }).from(businesses).where(eq(businesses.id, input.businessId)).limit(1))?.[0];
    if (!business) throw new TRPCError({ code: "NOT_FOUND", message: "Business not found." });
    if (!canManageBusiness(ctx.user.role as Parameters<typeof canManageBusiness>[0], ctx.user.id, business.ownerId)) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot view this business chat feedback." });
    return listUnansweredQuestions(input.businessId);
  }),
  resolveUnansweredQuestion: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), id: z.number().int().positive(), status: z.enum(["resolved", "dismissed"]), resolutionNote: z.string().max(2000).optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    const business = (await db?.select({ ownerId: businesses.ownerId }).from(businesses).where(eq(businesses.id, input.businessId)).limit(1))?.[0];
    if (!business) throw new TRPCError({ code: "NOT_FOUND", message: "Business not found." });
    if (!canManageBusiness(ctx.user.role as Parameters<typeof canManageBusiness>[0], ctx.user.id, business.ownerId)) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot resolve this business question." });
    return resolveUnansweredQuestion(input);
  }),
  chatHistory: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), sessionId: z.string().min(16).max(64) })).query(async ({ ctx, input }) => {
    if (!canModerate(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required for chat history." });
    return getBusinessChatHistory(input.businessId, input.sessionId);
  }),
  chatAnalytics: protectedProcedure.input(z.object({ businessId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    const business = (await db?.select({ ownerId: businesses.ownerId }).from(businesses).where(eq(businesses.id, input.businessId)).limit(1))?.[0];
    if (!business) throw new TRPCError({ code: "NOT_FOUND", message: "Business not found." });
    if (!canManageBusiness(ctx.user.role as Parameters<typeof canManageBusiness>[0], ctx.user.id, business.ownerId)) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot view this business chat analytics." });
    return getChatAnalytics(input.businessId);
  }),
});
