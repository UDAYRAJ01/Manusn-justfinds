import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { approvalQueue, businesses, businessFieldValues, categories, categoryFields, cities } from "../../drizzle/schema";
import { deleteInternalValidationBusiness, getAdminCounts, getCategorySchemas, getDb, getInternalValidationBusinesses, getOwnerBusinesses, getPendingBusinesses } from "../db";
import { canManageAdmins, canManageBusiness, canModerate } from "../domain/permissions";
import { buildVoiceIntroductionScript } from "../domain/voiceScript";
import { storagePut } from "../storage";
import { numberedSlug, preferredBusinessSlug } from "../domain/slug";
import { normalizeCategorySlug } from "../domain/categorySlug";
import { protectedProcedure, router } from "../_core/trpc";

type JustFindsRole = "user" | "business_owner" | "admin" | "super_admin";

function requireModerator(role: JustFindsRole) {
  if (!canModerate(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
}

function requireSuperAdmin(role: JustFindsRole) {
  if (!canManageAdmins(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Super-administrator access is required." });
}

const businessInput = z.object({
  name: z.string().min(2).max(220),
  slug: z.string().max(240).optional(),
  categoryId: z.number().int().positive(),
  subcategoryId: z.number().int().positive().optional(),
  cityId: z.number().int().positive(),
  localityId: z.number().int().positive().optional(),
  address: z.string().min(6).max(1500),
  shortDescription: z.string().max(1000).optional(),
  phone: z.string().max(32).optional(),
  whatsapp: z.string().max(32).optional(),
  email: z.string().email().max(320).optional(),
  website: z.string().url().max(500).optional(),
  latitude: z.string().max(24).optional(),
  longitude: z.string().max(24).optional(),
  dynamicValues: z.array(z.object({ categoryFieldId: z.number().int().positive(), value: z.any() })).max(80).optional(),
});

async function ownedBusinessOrThrow(businessId: number, userId: number, role: JustFindsRole) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The business workspace is temporarily unavailable." });
  const records = await db.select({ id: businesses.id, ownerId: businesses.ownerId, status: businesses.status, name: businesses.name, approvedDescription: businesses.approvedDescription }).from(businesses).where(eq(businesses.id, businessId)).limit(1);
  const business = records[0];
  if (!business) throw new TRPCError({ code: "NOT_FOUND", message: "Business not found." });
  if (!canManageBusiness(role, userId, business.ownerId)) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot manage this business." });
  return { db, business };
}

export const workspaceRouter = router({
  ownerOverview: protectedProcedure.query(async ({ ctx }) => ({ businesses: await getOwnerBusinesses(ctx.user.id), ownerRole: ctx.user.role })),
  categorySchemas: protectedProcedure.query(async ({ ctx }) => {
    requireModerator(ctx.user.role);
    return getCategorySchemas();
  }),
  adminOverview: protectedProcedure.query(async ({ ctx }) => {
    requireModerator(ctx.user.role);
    return getAdminCounts();
  }),
  pendingBusinesses: protectedProcedure.query(async ({ ctx }) => {
    requireModerator(ctx.user.role);
    return getPendingBusinesses();
  }),
  internalValidationBusinesses: protectedProcedure.query(async ({ ctx }) => {
    requireModerator(ctx.user.role);
    return getInternalValidationBusinesses();
  }),
  deleteInternalValidationBusiness: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), confirmation: z.literal("DELETE TEST LISTING") })).mutation(async ({ ctx, input }) => {
    requireModerator(ctx.user.role);
    const deleted = await deleteInternalValidationBusiness(input.businessId);
    if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Only designated Just Finds internal test listings can be deleted here." });
    return { deleted: true };
  }),
  createCategory: protectedProcedure.input(z.object({ name: z.string().min(2).max(100), slug: z.preprocess(value => typeof value === "string" ? normalizeCategorySlug(value) : value, z.string().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)), description: z.string().max(1000).optional(), icon: z.string().min(1).max(100).default("Sparkles") })).mutation(async ({ ctx, input }) => {
    requireSuperAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The category service is temporarily unavailable." });
    const result = await db.insert(categories).values({ ...input, status: "active", isActive: true });
    return { categoryId: Number(result[0].insertId) };
  }),
  createCity: protectedProcedure.input(z.object({ name: z.string().min(2).max(120), slug: z.string().max(140).optional(), state: z.string().max(120).optional(), latitude: z.string().max(24).optional(), longitude: z.string().max(24).optional() })).mutation(async ({ ctx, input }) => {
    requireSuperAdmin(ctx.user.role);
    const citySlug = normalizeCategorySlug(input.name);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(citySlug)) throw new TRPCError({ code: "BAD_REQUEST", message: "City name must produce a valid URL slug." });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The location service is temporarily unavailable." });
    const result = await db.insert(cities).values({ ...input, slug: citySlug, isActive: true });
    return { cityId: Number(result[0].insertId) };
  }),
  createCategoryField: protectedProcedure.input(z.object({ categoryId: z.number().int().positive(), fieldKey: z.string().min(2).max(80).regex(/^[a-z][a-z0-9_]*$/), label: z.string().min(2).max(120), fieldType: z.enum(["text", "textarea", "number", "currency", "boolean", "select", "multiselect", "multi_select", "date", "time", "image", "url", "phone", "email"]), placeholder: z.string().max(240).optional(), options: z.array(z.string().max(100)).max(50).optional(), isRequired: z.boolean().default(false), isPublic: z.boolean().default(true), sortOrder: z.number().int().min(0).default(0) })).mutation(async ({ ctx, input }) => {
    requireSuperAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The schema service is temporarily unavailable." });
    const result = await db.insert(categoryFields).values({ ...input, options: input.options ?? null });
    return { fieldId: Number(result[0].insertId) };
  }),
  createBusiness: protectedProcedure.input(businessInput).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "business_owner" && !canModerate(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Business-owner access is required to create a listing." });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The business workspace is temporarily unavailable." });
    const { dynamicValues, slug: requestedSlug, ...business } = input;
    const baseSlug = preferredBusinessSlug(business.name, requestedSlug);
    let slug = baseSlug;
    let available = false;
    for (let suffix = 1; suffix <= 100; suffix += 1) {
      const candidate = suffix === 1 ? baseSlug : numberedSlug(baseSlug, suffix);
      const existing = await db.select({ id: businesses.id }).from(businesses).where(eq(businesses.slug, candidate)).limit(1);
      if (!existing.length) { slug = candidate; available = true; break; }
    }
    if (!available) throw new TRPCError({ code: "CONFLICT", message: "This business name is already in use too many times. Please choose a more specific name." });
    const created = await db.insert(businesses).values({ ...business, slug, ownerId: ctx.user.id, status: "draft" });
    const businessId = Number(created[0].insertId);
    if (dynamicValues?.length) await db.insert(businessFieldValues).values(dynamicValues.map(field => ({ businessId, categoryFieldId: field.categoryFieldId, value: field.value })));
    return { businessId, status: "draft" as const };
  }),
  updateBusiness: protectedProcedure.input(businessInput.partial().extend({ businessId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    const update: Partial<typeof businesses.$inferInsert> = {};
    if (input.name !== undefined) update.name = input.name;
    if (input.slug !== undefined) update.slug = input.slug;
    if (input.categoryId !== undefined) update.categoryId = input.categoryId;
    if (input.subcategoryId !== undefined) update.subcategoryId = input.subcategoryId;
    if (input.cityId !== undefined) update.cityId = input.cityId;
    if (input.localityId !== undefined) update.localityId = input.localityId;
    if (input.address !== undefined) update.address = input.address;
    if (input.shortDescription !== undefined) update.shortDescription = input.shortDescription;
    if (input.phone !== undefined) update.phone = input.phone;
    if (input.whatsapp !== undefined) update.whatsapp = input.whatsapp;
    if (input.email !== undefined) update.email = input.email;
    if (input.website !== undefined) update.website = input.website;
    if (input.latitude !== undefined) update.latitude = input.latitude;
    if (input.longitude !== undefined) update.longitude = input.longitude;
    if (Object.keys(update).length) await db.update(businesses).set(update).where(eq(businesses.id, input.businessId));
    if (input.dynamicValues) for (const field of input.dynamicValues) await db.insert(businessFieldValues).values({ businessId: input.businessId, categoryFieldId: field.categoryFieldId, value: field.value }).onDuplicateKeyUpdate({ set: { value: field.value } });
    return { success: true };
  }),
  submitBusiness: protectedProcedure.input(z.object({ businessId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { db, business } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    if (!["draft", "rejected"].includes(business.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "Only draft or returned businesses can be submitted for review." });
    await db.update(businesses).set({ status: "submitted" }).where(eq(businesses.id, input.businessId));
    await db.insert(approvalQueue).values({ entityType: "business", businessId: input.businessId, submittedById: ctx.user.id, status: "pending" });
    return { status: "submitted" as const };
  }),
  generateVoiceIntroduction: protectedProcedure.input(z.object({ businessId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { db, business } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    if (!['approved', 'published'].includes(business.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "Voice introductions can be generated only after the business is approved." });
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The voice provider is not configured." });
    const script = buildVoiceIntroductionScript(business);

    const voicesResponse = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": apiKey } });
    if (!voicesResponse.ok) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The voice provider could not load an approved voice." });
    const voicesPayload = await voicesResponse.json() as { voices?: Array<{ voice_id?: string }> };
    const voiceId = process.env.ELEVENLABS_VOICE_ID ?? voicesPayload.voices?.find(voice => voice.voice_id)?.voice_id;
    if (!voiceId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No approved voice is available for this workspace." });

    const synthesisResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text: script, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.55, similarity_boost: 0.7, style: 0.2, use_speaker_boost: true } }),
    });
    if (!synthesisResponse.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The voice introduction could not be generated. Please try again." });
    const audio = Buffer.from(await synthesisResponse.arrayBuffer());
    const { url } = await storagePut(`businesses/${input.businessId}/voice-introduction.mp3`, audio, "audio/mpeg");
    await db.update(businesses).set({ voiceIntroductionUrl: url, voiceIntroductionScript: script, voiceIntroductionUpdatedAt: new Date() }).where(eq(businesses.id, input.businessId));
    return { url, script };
  }),
  reviewBusiness: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), decision: z.enum(["approved", "rejected", "published", "suspended"]), reviewerNote: z.string().max(2000).optional() })).mutation(async ({ ctx, input }) => {
    requireModerator(ctx.user.role);
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    const publishedAt = input.decision === "published" ? new Date() : undefined;
    await db.update(businesses).set({ status: input.decision, ...(publishedAt ? { publishedAt } : {}) }).where(eq(businesses.id, input.businessId));
    await db.update(approvalQueue).set({ status: input.decision === "rejected" ? "rejected" : "approved", reviewerId: ctx.user.id, reviewerNote: input.reviewerNote, resolvedAt: new Date() }).where(and(eq(approvalQueue.businessId, input.businessId), eq(approvalQueue.status, "pending")));
    return { status: input.decision };
  }),
  bulkImportPreview: protectedProcedure.input(z.object({ filename: z.string().min(1).max(255) })).mutation(async ({ ctx, input }) => {
    requireModerator(ctx.user.role);
    return { filename: input.filename, status: "Pending" as const, message: "The upload interface is ready. A storage-backed parser and queue worker should be connected before processing source files." };
  }),
});
