import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  businessAiContent,
  businessCertificates,
  businessClaims,
  businessFieldValues,
  categoryFields,
  businessFacilities,
  businessHours,
  businessImages,
  businessItems,
  businessLeadNotes,
  businessLeads,
  businessNotifications,
  businessOffers,
  businessReviewReports,
  businessVerificationDocuments,
  businessVerificationEvents,
  businessVerifications,
  ownerNotificationPrefs,
  businessReviews,
  businessServices,
  businessSpecialHours,
  businesses,
  users,
  categories,
  cities,
  subcategories,
} from "../../drizzle/schema";
import { canManageBusiness, canModerate } from "../domain/permissions";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { storageGetSignedUrl, storagePut } from "../storage";
import { numberedSlug, preferredBusinessSlug } from "../domain/slug";
import { scoreDuplicateCandidate } from "../domain/duplicateCheck";

const roleSchema = z.enum(["user", "business_owner", "admin", "super_admin"]);
const businessIdInput = z.object({ businessId: z.number().int().positive() });
const urlOrEmpty = z.string().max(500).refine(value => value === "" || /^https?:\/\//i.test(value), "Enter a valid URL.");

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The business workspace is temporarily unavailable." });
  return db;
}

async function ownedBusinessOrThrow(businessId: number, userId: number, role: z.infer<typeof roleSchema>) {
  const db = await dbOrThrow();
  const rows = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
  const business = rows[0];
  if (!business) throw new TRPCError({ code: "NOT_FOUND", message: "Business not found." });
  const canFinishNewDraft = role === "user" && business.ownerId === userId && business.status === "draft";
  if (!canManageBusiness(role, userId, business.ownerId) && !canFinishNewDraft) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot access this business." });
  return { db, business };
}

const profileInput = z.object({
  businessId: z.number().int().positive().optional(),
  name: z.string().min(2).max(220),
  slug: z.string().max(240).optional(),
  categoryId: z.number().int().positive(),
  subcategoryId: z.number().int().positive().nullable().optional(),
  cityId: z.number().int().positive(),
  localityId: z.number().int().positive().nullable().optional(),
  address: z.string().min(6).max(1500),
  postcode: z.string().max(20).optional(),
  phone: z.string().max(32).optional(),
  whatsapp: z.string().max(32).optional(),
  email: z.string().email().max(320).optional().or(z.literal("")),
  website: urlOrEmpty.optional(),
  shortDescription: z.string().max(1000).optional(),
  aboutDescription: z.string().max(5000).optional(),
  latitude: z.string().max(24).optional(),
  longitude: z.string().max(24).optional(),
  socialLinks: z.record(z.string(), urlOrEmpty).optional(),
  dynamicValues: z.array(z.object({ categoryFieldId: z.number().int().positive(), value: z.unknown() })).max(100).optional(),
});

export const businessRouter = router({
  myBusinesses: protectedProcedure.query(async ({ ctx }) => {
    const db = await dbOrThrow();
    return db.select({ business: businesses, category: categories.name, city: cities.name })
      .from(businesses)
      .leftJoin(categories, eq(businesses.categoryId, categories.id))
      .leftJoin(cities, eq(businesses.cityId, cities.id))
      .where(eq(businesses.ownerId, ctx.user.id))
      .orderBy(desc(businesses.updatedAt));
  }),
  categoryFields: protectedProcedure.input(z.object({ categoryId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await dbOrThrow();
    return db.select().from(categoryFields).where(eq(categoryFields.categoryId, input.categoryId)).orderBy(categoryFields.sortOrder);
  }),

  businessDetail: protectedProcedure.input(businessIdInput).query(async ({ ctx, input }) => {
    const { db, business } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    const [category, city, fields, hours, specialHours, services, facilities, items, images] = await Promise.all([
      db.select().from(categories).where(eq(categories.id, business.categoryId)).limit(1),
      db.select().from(cities).where(eq(cities.id, business.cityId)).limit(1),
      db.select().from(businessFieldValues).where(eq(businessFieldValues.businessId, business.id)),
      db.select().from(businessHours).where(eq(businessHours.businessId, business.id)).orderBy(businessHours.dayOfWeek),
      db.select().from(businessSpecialHours).where(eq(businessSpecialHours.businessId, business.id)).orderBy(businessSpecialHours.date),
      db.select().from(businessServices).where(eq(businessServices.businessId, business.id)).orderBy(businessServices.sortOrder),
      db.select().from(businessFacilities).where(eq(businessFacilities.businessId, business.id)).orderBy(businessFacilities.sortOrder),
      db.select().from(businessItems).where(eq(businessItems.businessId, business.id)).orderBy(businessItems.sortOrder),
      db.select().from(businessImages).where(eq(businessImages.businessId, business.id)).orderBy(businessImages.sortOrder),
    ]);
    const checks = [business.name, business.shortDescription, business.aboutDescription, business.phone, business.email, business.website, business.address, business.latitude && business.longitude, hours.length > 0, services.length > 0, facilities.length > 0, images.some(image => image.imageType === "cover")];
    const completeness = Math.round((checks.filter(Boolean).length / checks.length) * 100);
    return { business, category: category[0] ?? null, city: city[0] ?? null, fields, hours, specialHours, services, facilities, items, images, completeness };
  }),

  createDraft: protectedProcedure.input(profileInput.omit({ businessId: true })).mutation(async ({ ctx, input }) => {
    const db = await dbOrThrow();
    const { dynamicValues, slug: requestedSlug, ...profile } = input;
    const baseSlug = preferredBusinessSlug(profile.name, requestedSlug);
    let slug = baseSlug;
    let available = false;
    for (let suffix = 1; suffix <= 100; suffix += 1) {
      const candidate = suffix === 1 ? baseSlug : numberedSlug(baseSlug, suffix);
      const existing = await db.select({ id: businesses.id }).from(businesses).where(eq(businesses.slug, candidate)).limit(1);
      if (!existing.length) { slug = candidate; available = true; break; }
    }
    if (!available) throw new TRPCError({ code: "CONFLICT", message: "This business name is already in use too many times. Please choose a more specific name." });
    const inserted = await db.insert(businesses).values({ ...profile, slug, ownerId: ctx.user.id, status: "draft", onboardingStep: 1 });
    const businessId = Number(inserted[0].insertId);
    if (ctx.user.role === "user") await db.update(users).set({ role: "business_owner" }).where(eq(users.id, ctx.user.id));
    if (dynamicValues?.length) await db.insert(businessFieldValues).values(dynamicValues.map(value => ({ businessId, categoryFieldId: value.categoryFieldId, value: value.value })));
    return { businessId, status: "draft" as const };
  }),

  updateProfile: protectedProcedure.input(profileInput.required({ businessId: true })).mutation(async ({ ctx, input }) => {
    const { db, business } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    const { businessId, dynamicValues, ...profile } = input;
    const nextStatus = ["submitted", "under_review", "published"].includes(business.status) ? "submitted" : business.status;
    await db.update(businesses).set({ ...profile, status: nextStatus, onboardingStep: Math.max(business.onboardingStep, 2) }).where(eq(businesses.id, businessId));
    if (dynamicValues?.length) for (const value of dynamicValues) {
      await db.insert(businessFieldValues).values({ businessId, categoryFieldId: value.categoryFieldId, value: value.value }).onDuplicateKeyUpdate({ set: { value: value.value } });
    }
    return { success: true, status: nextStatus };
  }),

  saveOnboardingStep: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), step: z.number().int().min(1).max(10) })).mutation(async ({ ctx, input }) => {
    const { db, business } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    await db.update(businesses).set({ onboardingStep: Math.max(business.onboardingStep, input.step) }).where(eq(businesses.id, input.businessId));
    return { step: Math.max(business.onboardingStep, input.step) };
  }),

  submitForApproval: protectedProcedure.input(businessIdInput).mutation(async ({ ctx, input }) => {
    const { db, business } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    if (!["draft", "rejected"].includes(business.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "Only draft or rejected businesses can be submitted." });
    await db.update(businesses).set({ status: "submitted", rejectionReason: null }).where(eq(businesses.id, input.businessId));
    return { status: "submitted" as const };
  }),

  searchDirectory: protectedProcedure.input(z.object({ query: z.string().min(2).max(180) })).query(async ({ input }) => {
    const db = await dbOrThrow();
    const pattern = `%${input.query.trim()}%`;
    return db.select({ business: businesses, category: categories.name, city: cities.name })
      .from(businesses).leftJoin(categories, eq(businesses.categoryId, categories.id)).leftJoin(cities, eq(businesses.cityId, cities.id))
      .where(or(like(businesses.name, pattern), like(businesses.phone, pattern), like(businesses.website, pattern), like(businesses.address, pattern)))
      .limit(20);
  }),

  duplicateCandidates: protectedProcedure.input(z.object({ businessId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const { db, business } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    const candidates = await db.select({ id: businesses.id, name: businesses.name, phone: businesses.phone, email: businesses.email, address: businesses.address, cityId: businesses.cityId, latitude: businesses.latitude, longitude: businesses.longitude, slug: businesses.slug, status: businesses.status })
      .from(businesses)
      .where(and(eq(businesses.cityId, business.cityId), eq(businesses.status, "published")))
      .limit(100);
    return candidates
      .filter(candidate => candidate.id !== business.id)
      .map(candidate => ({ candidate, match: scoreDuplicateCandidate(business, candidate) }))
      .filter((result): result is { candidate: typeof candidates[number]; match: NonNullable<ReturnType<typeof scoreDuplicateCandidate>> } => Boolean(result.match))
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, 8)
      .map(({ candidate, match }) => ({ id: candidate.id, name: candidate.name, slug: candidate.slug, address: candidate.address, phone: candidate.phone, score: match.score, classification: match.classification, reasons: match.reasons }));
  }),

  verificationStatus: protectedProcedure.input(businessIdInput).query(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    const verifications = await db.select().from(businessVerifications).where(eq(businessVerifications.businessId, input.businessId)).limit(1);
    const verification = verifications[0] ?? null;
    if (!verification) return { verification: null, documents: [], events: [] };
    const [documents, events] = await Promise.all([
      db.select({ id: businessVerificationDocuments.id, documentType: businessVerificationDocuments.documentType, fileName: businessVerificationDocuments.fileName, mimeType: businessVerificationDocuments.mimeType, fileSize: businessVerificationDocuments.fileSize, createdAt: businessVerificationDocuments.createdAt }).from(businessVerificationDocuments).where(eq(businessVerificationDocuments.verificationId, verification.id)).orderBy(desc(businessVerificationDocuments.createdAt)),
      db.select({ id: businessVerificationEvents.id, action: businessVerificationEvents.action, note: businessVerificationEvents.note, createdAt: businessVerificationEvents.createdAt, actorName: users.name }).from(businessVerificationEvents).leftJoin(users, eq(businessVerificationEvents.actorId, users.id)).where(eq(businessVerificationEvents.verificationId, verification.id)).orderBy(desc(businessVerificationEvents.createdAt)),
    ]);
    return { verification, documents, events };
  }),

  uploadVerificationDocument: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), documentType: z.enum(["registration", "licence", "address_proof", "ownership_proof", "other"]), fileName: z.string().min(1).max(255), mimeType: z.enum(["application/pdf", "image/jpeg", "image/png", "image/webp"]), dataBase64: z.string().min(4).max(7_000_000).regex(/^[A-Za-z0-9+/=]+$/, "File data is invalid.") })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    const existing = await db.select().from(businessVerifications).where(eq(businessVerifications.businessId, input.businessId)).limit(1);
    const verification = existing[0];
    if (verification?.status === "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Verification is already under review. Wait for the administrator decision before changing evidence." });
    const bytes = Buffer.from(input.dataBase64, "base64");
    if (!bytes.length || bytes.length > 5_000_000) throw new TRPCError({ code: "BAD_REQUEST", message: "Upload a PDF or image smaller than 5 MB." });
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 180) || "evidence";
    const uploaded = await storagePut(`private-verification/${input.businessId}/${input.documentType}-${safeName}`, bytes, input.mimeType);
    let verificationId = verification?.id;
    if (!verificationId) {
      const inserted = await db.insert(businessVerifications).values({ businessId: input.businessId, status: "unverified" });
      verificationId = Number(inserted[0].insertId);
    }
    const insertedDocument = await db.insert(businessVerificationDocuments).values({ businessId: input.businessId, verificationId, uploadedById: ctx.user.id, documentType: input.documentType, storageKey: uploaded.key, fileName: input.fileName, mimeType: input.mimeType, fileSize: bytes.length });
    return { documentId: Number(insertedDocument[0].insertId) };
  }),

  submitVerification: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), note: z.string().max(2000).optional() })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    const rows = await db.select().from(businessVerifications).where(eq(businessVerifications.businessId, input.businessId)).limit(1);
    const verification = rows[0];
    if (verification?.status === "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Verification is already under review." });
    const documentCount = verification ? await db.select({ id: businessVerificationDocuments.id }).from(businessVerificationDocuments).where(eq(businessVerificationDocuments.verificationId, verification.id)).limit(1) : [];
    if (!verification || (!documentCount.length && !verification.evidenceUrl)) throw new TRPCError({ code: "BAD_REQUEST", message: "Add at least one current evidence document before submitting verification." });
    const now = new Date();
    await db.update(businessVerifications).set({ status: "pending", submissionNote: input.note, submittedAt: now, reviewNote: null, reviewedAt: null, reviewedById: null }).where(eq(businessVerifications.id, verification.id));
    await db.insert(businessVerificationEvents).values({ businessId: input.businessId, verificationId: verification.id, actorId: ctx.user.id, action: "submitted", note: input.note });
    return { status: "pending" as const };
  }),

  verificationDocumentUrl: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), documentId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    const documents = await db.select({ storageKey: businessVerificationDocuments.storageKey }).from(businessVerificationDocuments).where(and(eq(businessVerificationDocuments.id, input.documentId), eq(businessVerificationDocuments.businessId, input.businessId))).limit(1);
    if (!documents[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Verification document not found." });
    return { url: await storageGetSignedUrl(documents[0].storageKey) };
  }),

  verificationQueue: protectedProcedure.query(async ({ ctx }) => {
    if (!canModerate(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
    const db = await dbOrThrow();
    const rows = await db.select({ verification: businessVerifications, business: businesses, ownerName: users.name }).from(businessVerifications).innerJoin(businesses, eq(businessVerifications.businessId, businesses.id)).leftJoin(users, eq(businesses.ownerId, users.id)).where(eq(businessVerifications.status, "pending")).orderBy(asc(businessVerifications.submittedAt));
    return Promise.all(rows.map(async row => {
      const documents = await db.select({ id: businessVerificationDocuments.id, documentType: businessVerificationDocuments.documentType, fileName: businessVerificationDocuments.fileName, mimeType: businessVerificationDocuments.mimeType, fileSize: businessVerificationDocuments.fileSize }).from(businessVerificationDocuments).where(eq(businessVerificationDocuments.verificationId, row.verification.id)).orderBy(desc(businessVerificationDocuments.createdAt));
      return { ...row, documents };
    }));
  }),

  reviewVerification: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), decision: z.enum(["verified", "changes_requested"]), note: z.string().min(5).max(2000) })).mutation(async ({ ctx, input }) => {
    if (!canModerate(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
    const db = await dbOrThrow();
    const rows = await db.select().from(businessVerifications).where(eq(businessVerifications.businessId, input.businessId)).limit(1);
    const verification = rows[0];
    if (!verification) throw new TRPCError({ code: "NOT_FOUND", message: "Verification case not found." });
    if (verification.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending verification cases can be reviewed." });
    const verified = input.decision === "verified";
    const now = new Date();
    await db.transaction(async tx => {
      await tx.update(businessVerifications).set({ status: verified ? "verified" : "rejected", reviewedById: ctx.user.id, reviewNote: input.note, reviewedAt: now }).where(eq(businessVerifications.id, verification.id));
      await tx.update(businesses).set({ isVerified: verified }).where(eq(businesses.id, input.businessId));
      await tx.insert(businessVerificationEvents).values({ businessId: input.businessId, verificationId: verification.id, actorId: ctx.user.id, action: verified ? "approved" : "changes_requested", note: input.note });
    });
    return { status: verified ? "verified" as const : "changes_requested" as const };
  }),

  requestClaim: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), evidenceNote: z.string().max(2000).optional() })).mutation(async ({ ctx, input }) => {
    const db = await dbOrThrow();
    const target = await db.select({ id: businesses.id, ownerId: businesses.ownerId }).from(businesses).where(eq(businesses.id, input.businessId)).limit(1);
    if (!target[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Business not found." });
    if (target[0].ownerId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "You already own this business." });
    const prior = await db.select({ id: businessClaims.id }).from(businessClaims).where(and(eq(businessClaims.businessId, input.businessId), eq(businessClaims.userId, ctx.user.id), eq(businessClaims.status, "claim_requested"))).limit(1);
    if (prior[0]) throw new TRPCError({ code: "CONFLICT", message: "A claim request is already under review." });
    const created = await db.insert(businessClaims).values({ businessId: input.businessId, userId: ctx.user.id, evidenceNote: input.evidenceNote });
    return { claimId: Number(created[0].insertId), status: "claim_requested" as const };
  }),

  reviewClaim: protectedProcedure.input(z.object({ claimId: z.number().int().positive(), decision: z.enum(["under_review", "verification_required", "approved", "rejected"]), rejectionReason: z.string().max(2000).optional() })).mutation(async ({ ctx, input }) => {
    if (!canModerate(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
    const db = await dbOrThrow();
    const rows = await db.select().from(businessClaims).where(eq(businessClaims.id, input.claimId)).limit(1);
    const claim = rows[0];
    if (!claim) throw new TRPCError({ code: "NOT_FOUND", message: "Claim not found." });
    await db.update(businessClaims).set({ status: input.decision, reviewedAt: new Date(), reviewedBy: ctx.user.id, rejectionReason: input.rejectionReason }).where(eq(businessClaims.id, input.claimId));
    if (input.decision === "approved") await db.update(businesses).set({ ownerId: claim.userId, status: "draft" }).where(eq(businesses.id, claim.businessId));
    return { status: input.decision };
  }),

  myClaims: protectedProcedure.query(async ({ ctx }) => {
    const db = await dbOrThrow();
    return db.select({ claim: businessClaims, business: businesses, category: categories.name, city: cities.name })
      .from(businessClaims).innerJoin(businesses, eq(businessClaims.businessId, businesses.id)).leftJoin(categories, eq(businesses.categoryId, categories.id)).leftJoin(cities, eq(businesses.cityId, cities.id))
      .where(eq(businessClaims.userId, ctx.user.id)).orderBy(desc(businessClaims.submittedAt));
  }),

  setHours: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), days: z.array(z.object({ dayOfWeek: z.number().int().min(0).max(6), opensAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(), closesAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(), intervals: z.array(z.object({ opensAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), closesAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) })).max(4).default([]), isClosed: z.boolean(), isTwentyFourHours: z.boolean() })).length(7) })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    await db.delete(businessHours).where(eq(businessHours.businessId, input.businessId));
    await db.insert(businessHours).values(input.days.map(day => ({ ...day, businessId: input.businessId })));
    return { success: true };
  }),

  saveSpecialHour: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), label: z.string().min(2).max(160), isClosed: z.boolean(), intervals: z.array(z.object({ opensAt: z.string(), closesAt: z.string() })).max(4).default([]) })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    await db.insert(businessSpecialHours).values(input).onDuplicateKeyUpdate({ set: { label: input.label, isClosed: input.isClosed, intervals: input.intervals } });
    return { success: true };
  }),

  deleteSpecialHour: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), specialHourId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    await db.delete(businessSpecialHours).where(and(eq(businessSpecialHours.id, input.specialHourId), eq(businessSpecialHours.businessId, input.businessId)));
    return { success: true };
  }),

  openNowPreview: protectedProcedure.input(businessIdInput).query(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    const day = new Date().getDay();
    const row = await db.select().from(businessHours).where(and(eq(businessHours.businessId, input.businessId), eq(businessHours.dayOfWeek, day))).limit(1);
    const current = row[0];
    if (!current || current.isClosed) return { isOpen: false, label: "CLOSED" as const };
    if (current.isTwentyFourHours) return { isOpen: true, label: "OPEN NOW" as const };
    const now = new Date().toTimeString().slice(0, 5);
    const intervals = Array.isArray(current.intervals) && current.intervals.length ? current.intervals as Array<{ opensAt: string; closesAt: string }> : current.opensAt && current.closesAt ? [{ opensAt: current.opensAt, closesAt: current.closesAt }] : [];
    const isOpen = intervals.some(interval => interval.opensAt <= now && now <= interval.closesAt);
    return { isOpen, label: isOpen ? "OPEN NOW" as const : "CLOSED" as const };
  }),

  upsertService: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), serviceId: z.number().int().positive().optional(), name: z.string().min(1).max(160), description: z.string().max(2000).optional(), price: z.string().max(80).optional(), priceType: z.enum(["fixed", "starting_from", "contact", "free"]).default("contact"), duration: z.string().max(80).optional(), imageUrl: z.string().url().max(1000).optional(), isEnabled: z.boolean().default(true), sortOrder: z.number().int().min(0).default(0) })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    const { serviceId, ...values } = input;
    if (serviceId) {
      await db.update(businessServices).set(values).where(and(eq(businessServices.id, serviceId), eq(businessServices.businessId, input.businessId)));
      return { serviceId };
    }
    const created = await db.insert(businessServices).values(values);
    return { serviceId: Number(created[0].insertId) };
  }),

  deleteService: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), serviceId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    await db.delete(businessServices).where(and(eq(businessServices.id, input.serviceId), eq(businessServices.businessId, input.businessId)));
    return { success: true };
  }),

  setFacilities: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), facilities: z.array(z.object({ name: z.string().min(1).max(160), details: z.string().max(500).optional() })).max(50) })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    await db.delete(businessFacilities).where(eq(businessFacilities.businessId, input.businessId));
    if (input.facilities.length) await db.insert(businessFacilities).values(input.facilities.map((facility, index) => ({ ...facility, businessId: input.businessId, sortOrder: index })));
    return { success: true };
  }),

  upsertItem: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), itemId: z.number().int().positive().optional(), itemType: z.enum(["product", "menu", "room", "consultation"]), name: z.string().min(1).max(180), description: z.string().max(2000).optional(), price: z.string().max(80).optional(), imageUrl: z.string().url().max(1000).optional(), isEnabled: z.boolean().default(true), sortOrder: z.number().int().min(0).default(0) })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    const { itemId, ...values } = input;
    if (itemId) { await db.update(businessItems).set(values).where(and(eq(businessItems.id, itemId), eq(businessItems.businessId, input.businessId))); return { itemId }; }
    const created = await db.insert(businessItems).values(values);
    return { itemId: Number(created[0].insertId) };
  }),

  deleteItem: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), itemId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    await db.delete(businessItems).where(and(eq(businessItems.id, input.itemId), eq(businessItems.businessId, input.businessId)));
    return { success: true };
  }),

  leadDetail: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), leadId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    const rows = await db.select().from(businessLeads).where(and(eq(businessLeads.id, input.leadId), eq(businessLeads.businessId, input.businessId))).limit(1);
    if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found." });
    const notes = await db.select({ id: businessLeadNotes.id, body: businessLeadNotes.body, createdAt: businessLeadNotes.createdAt, authorName: users.name }).from(businessLeadNotes).innerJoin(users, eq(businessLeadNotes.authorId, users.id)).where(and(eq(businessLeadNotes.leadId, input.leadId), eq(businessLeadNotes.businessId, input.businessId))).orderBy(desc(businessLeadNotes.createdAt));
    return { lead: rows[0], notes };
  }),
  savePhoto: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), imageId: z.number().int().positive().optional(), url: z.string().url().max(1000).optional(), dataBase64: z.string().max(7_000_000).optional(), mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]).default("image/jpeg"), imageType: z.enum(["logo", "cover", "gallery"]).default("gallery"), alt: z.string().max(240).optional(), sortOrder: z.number().int().min(0).default(0) }).refine(input => Boolean(input.url) !== Boolean(input.dataBase64), "Provide either an image URL or an uploaded image." )).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    const { imageId, dataBase64, mimeType, url, ...rest } = input;
    const resolvedUrl = dataBase64 ? (await storagePut(`business-images/${input.businessId}/${crypto.randomUUID()}`, Buffer.from(dataBase64, "base64"), mimeType)).url : url!;
    const values = { ...rest, url: resolvedUrl };
    if (imageId) { await db.update(businessImages).set(values).where(and(eq(businessImages.id, imageId), eq(businessImages.businessId, input.businessId))); return { imageId, url: resolvedUrl }; }
    const created = await db.insert(businessImages).values(values);
    return { imageId: Number(created[0].insertId), url: resolvedUrl };
  }),
  deletePhoto: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), imageId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    await db.delete(businessImages).where(and(eq(businessImages.id, input.imageId), eq(businessImages.businessId, input.businessId)));
    return { success: true };
  }),
  setLogo: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), imageId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    await db.update(businessImages).set({ imageType: "gallery" }).where(and(eq(businessImages.businessId, input.businessId), eq(businessImages.imageType, "logo")));
    await db.update(businessImages).set({ imageType: "logo" }).where(and(eq(businessImages.id, input.imageId), eq(businessImages.businessId, input.businessId)));
    return { success: true };
  }),
  setCover: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), imageId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    await db.update(businessImages).set({ imageType: "gallery" }).where(and(eq(businessImages.businessId, input.businessId), eq(businessImages.imageType, "cover")));
    await db.update(businessImages).set({ imageType: "cover" }).where(and(eq(businessImages.id, input.imageId), eq(businessImages.businessId, input.businessId)));
    return { success: true };
  }),
  reorderPhotos: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), imageIds: z.array(z.number().int().positive()).max(100) })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    await Promise.all(input.imageIds.map((imageId, sortOrder) => db.update(businessImages).set({ sortOrder }).where(and(eq(businessImages.id, imageId), eq(businessImages.businessId, input.businessId)))));
    return { success: true };
  }),
  listLeads: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), limit: z.number().int().min(1).max(100).default(50), offset: z.number().int().min(0).default(0) })).query(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    return db.select().from(businessLeads).where(eq(businessLeads.businessId, input.businessId)).orderBy(desc(businessLeads.createdAt)).limit(input.limit).offset(input.offset);
  }),

  addLeadNote: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), leadId: z.number().int().positive(), body: z.string().trim().min(1).max(5000) })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    const lead = await db.select({ id: businessLeads.id }).from(businessLeads).where(and(eq(businessLeads.id, input.leadId), eq(businessLeads.businessId, input.businessId))).limit(1);
    if (!lead[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found." });
    const inserted = await db.insert(businessLeadNotes).values({ businessId: input.businessId, leadId: input.leadId, authorId: ctx.user.id, body: input.body });
    return { noteId: Number(inserted[0].insertId) };
  }),

  updateLead: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), leadId: z.number().int().positive(), status: z.enum(["new", "contacted", "qualified", "converted", "closed"]).optional(), notes: z.string().max(5000).optional(), assignToMe: z.boolean().optional(), followUpAt: z.coerce.date().nullable().optional() })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    const contactStatus = input.status === "contacted" || input.status === "qualified" || input.status === "converted";
    await db.update(businessLeads).set({ ...(input.status ? { status: input.status } : {}), ...(input.notes !== undefined ? { notes: input.notes } : {}), ...(input.assignToMe !== undefined ? { assignedToId: input.assignToMe ? ctx.user.id : null } : {}), ...(input.followUpAt !== undefined ? { followUpAt: input.followUpAt } : {}), ...(contactStatus ? { lastContactedAt: new Date() } : {}) }).where(and(eq(businessLeads.id, input.leadId), eq(businessLeads.businessId, input.businessId)));
    return { success: true };
  }),

  listReviews: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), limit: z.number().int().min(1).max(100).default(50), offset: z.number().int().min(0).default(0) })).query(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    return db.select().from(businessReviews).where(eq(businessReviews.businessId, input.businessId)).orderBy(desc(businessReviews.createdAt)).limit(input.limit).offset(input.offset);
  }),

  respondToReview: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), reviewId: z.number().int().positive(), response: z.string().min(1).max(2000) })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    await db.update(businessReviews).set({ businessResponse: input.response, respondedAt: new Date() }).where(and(eq(businessReviews.id, input.reviewId), eq(businessReviews.businessId, input.businessId)));
    return { success: true };
  }),

  reportReview: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), reviewId: z.number().int().positive(), reason: z.string().min(2).max(240), details: z.string().max(2000).optional() })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    const review = await db.select({ id: businessReviews.id }).from(businessReviews).where(and(eq(businessReviews.id, input.reviewId), eq(businessReviews.businessId, input.businessId))).limit(1);
    if (!review[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Review not found." });
    await db.insert(businessReviewReports).values({ reviewId: input.reviewId, reporterId: ctx.user.id, reason: input.reason, details: input.details });
    return { success: true };
  }),

  listOffers: protectedProcedure.input(businessIdInput).query(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    await db.update(businessOffers).set({ status: "expired" }).where(and(eq(businessOffers.businessId, input.businessId), eq(businessOffers.status, "active"), sql`endsAt < NOW()`));
    return db.select().from(businessOffers).where(eq(businessOffers.businessId, input.businessId)).orderBy(desc(businessOffers.createdAt));
  }),

  saveOffer: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), offerId: z.number().int().positive().optional(), title: z.string().min(2).max(180), description: z.string().max(3000).optional(), discount: z.string().max(80).optional(), startsAt: z.coerce.date(), endsAt: z.coerce.date(), terms: z.string().max(3000).optional(), cta: z.string().max(120).optional(), status: z.enum(["draft", "active"]).default("draft") })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    if (input.endsAt <= input.startsAt) throw new TRPCError({ code: "BAD_REQUEST", message: "End date must be after start date." });
    const { offerId, ...values } = input;
    if (offerId) { await db.update(businessOffers).set(values).where(and(eq(businessOffers.id, offerId), eq(businessOffers.businessId, input.businessId))); return { offerId }; }
    const created = await db.insert(businessOffers).values(values);
    return { offerId: Number(created[0].insertId) };
  }),

  deleteOffer: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), offerId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    await db.delete(businessOffers).where(and(eq(businessOffers.id, input.offerId), eq(businessOffers.businessId, input.businessId)));
    return { success: true };
  }),
  saveSeo: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), seoTitle: z.string().max(180).optional(), metaDescription: z.string().max(300).optional(), slug: z.string().min(2).max(240).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    await db.update(businesses).set({ seoTitle: input.seoTitle, metaDescription: input.metaDescription, slug: input.slug }).where(eq(businesses.id, input.businessId));
    return { success: true };
  }),
  generateAiContent: protectedProcedure.input(businessIdInput).mutation(async ({ ctx, input }) => {
    const { db, business } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    const content = { about: business.aboutDescription ?? business.shortDescription ?? "", seoTitle: business.seoTitle ?? business.name, metaDescription: business.metaDescription ?? business.shortDescription ?? "", faqs: [] };
    await db.insert(businessAiContent).values({ businessId: input.businessId, ...content, status: "completed", generatedAt: new Date() }).onDuplicateKeyUpdate({ set: { ...content, status: "completed", generatedAt: new Date() } });
    return { ...content, generated: false, message: "Review this factual draft before saving." };
  }),
  saveAiContent: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), about: z.string().max(5000), seoTitle: z.string().max(180), metaDescription: z.string().max(300), faqs: z.array(z.object({ question: z.string().max(240), answer: z.string().max(1000) })).max(20) })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    await db.update(businesses).set({ aboutDescription: input.about, seoTitle: input.seoTitle, metaDescription: input.metaDescription }).where(eq(businesses.id, input.businessId));
    await db.insert(businessAiContent).values({ businessId: input.businessId, about: input.about, seoTitle: input.seoTitle, metaDescription: input.metaDescription, faqs: input.faqs, status: "completed" }).onDuplicateKeyUpdate({ set: { about: input.about, seoTitle: input.seoTitle, metaDescription: input.metaDescription, faqs: input.faqs, status: "completed" } });
    return { success: true };
  }),
  certificate: protectedProcedure.input(businessIdInput).query(async ({ ctx, input }) => {
    const { db, business } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    const rows = await db.select().from(businessCertificates).where(eq(businessCertificates.businessId, input.businessId)).limit(1);
    return { available: ["approved", "published"].includes(business.status) && Boolean(rows[0]), certificate: rows[0] ?? null };
  }),
  qrCode: protectedProcedure.input(businessIdInput).query(async ({ ctx, input }) => {
    const { business } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    return { public: business.status === "published", url: business.status === "published" ? `/business/${business.slug}` : null };
  }),
  getSettings: protectedProcedure.query(async ({ ctx }) => { const db = await dbOrThrow(); const rows = await db.select().from(ownerNotificationPrefs).where(eq(ownerNotificationPrefs.userId, ctx.user.id)).limit(1); return rows[0] ?? { emailEnabled: true, leadAlerts: true, reviewAlerts: true, statusAlerts: true }; }),
  saveSettings: protectedProcedure.input(z.object({ emailEnabled: z.boolean(), leadAlerts: z.boolean(), reviewAlerts: z.boolean(), statusAlerts: z.boolean() })).mutation(async ({ ctx, input }) => {
    const db = await dbOrThrow();
    await db.insert(ownerNotificationPrefs).values({ userId: ctx.user.id, ...input }).onDuplicateKeyUpdate({ set: input });
    return { success: true };
  }),
  analytics: protectedProcedure.input(businessIdInput).query(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    const rows = await db.select({ action: sql<string>`${sql.raw("action")}`, count: sql<number>`COUNT(*)` }).from(sql.raw("search_interactions") as never).where(sql`businessId = ${input.businessId}`).groupBy(sql.raw("action"));
    return rows;
  }),

  notifications: protectedProcedure.query(async ({ ctx }) => {
    const db = await dbOrThrow();
    return db.select().from(businessNotifications).where(eq(businessNotifications.userId, ctx.user.id)).orderBy(desc(businessNotifications.createdAt)).limit(100);
  }),

  markNotificationRead: protectedProcedure.input(z.object({ notificationId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await dbOrThrow();
    await db.update(businessNotifications).set({ isRead: true }).where(and(eq(businessNotifications.id, input.notificationId), eq(businessNotifications.userId, ctx.user.id)));
    return { success: true };
  }),
});

export type BusinessRouter = typeof businessRouter;
export { ownedBusinessOrThrow };
