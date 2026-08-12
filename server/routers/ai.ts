import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { getBusinessChatContext, createBusinessLead } from "../db";
import { publicProcedure, router } from "../_core/trpc";

export const aiRouter = router({
  businessChat: publicProcedure.input(z.object({ businessId: z.number().int().positive(), question: z.string().min(1).max(600) })).mutation(async ({ input }) => {
    const context = await getBusinessChatContext(input.businessId);
    if (!context) throw new TRPCError({ code: "NOT_FOUND", message: "This approved business is unavailable." });
    const approvedFacts = JSON.stringify({
      name: context.business.name,
      address: context.business.address,
      phone: context.business.phone,
      whatsapp: context.business.whatsapp,
      website: context.business.website,
      description: context.business.approvedDescription,
      services: context.services.map(service => ({ name: service.name, description: service.description })),
      hours: context.hours,
      approvedFaqs: context.ai?.faqs ?? [],
    });
    const response = await invokeLLM({
      messages: [
        { role: "system", content: `You are the private assistant for one Just Finds business. Answer strictly and only from this approved business JSON: ${approvedFacts}. Never infer facts, mention another business, or use any external knowledge. If the information is absent, reply exactly: I don't have that information for this business.` },
        { role: "user", content: input.question },
      ],
    });
    const content = response.choices[0]?.message?.content;
    return { answer: typeof content === "string" ? content : "I don't have that information for this business." };
  }),
  createLead: publicProcedure.input(z.object({ businessId: z.number().int().positive(), name: z.string().min(2).max(160), phone: z.string().max(32).optional(), email: z.string().email().optional(), message: z.string().max(2000).optional(), page: z.string().max(500).optional() })).mutation(async ({ input }) => {
    await createBusinessLead(input);
    return { success: true };
  }),
});
