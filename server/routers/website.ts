import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { businessImages, businessServices, businessReviews, businesses, businessPages, pageAnalytics, pagePublishHistory, pageSections, pageVersions, businessHours, categories, cities } from "../../drizzle/schema";
import { generateStructured } from "../domain/ai/provider";
import { canonicalWebsiteSectionTypes, normalizeWebsiteDraft, websiteDraftOutputSchema, websiteDraftSystemPrompt, type GeneratedWebsiteDraft } from "../domain/websiteDraft";
import { canManageBusiness } from "../domain/permissions";
import { getDb } from "../db";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

export const sectionRegistry = [
  { type: "hero", label: "Hero", allowedCategories: ["all"] },
  { type: "about", label: "About", allowedCategories: ["all"] },
  { type: "services", label: "Services", allowedCategories: ["all"] },
  { type: "facilities", label: "Facilities", allowedCategories: ["all"] },
  { type: "gallery", label: "Gallery", allowedCategories: ["all"] },
  { type: "hours", label: "Business hours", allowedCategories: ["all"] },
  { type: "contact", label: "Contact", allowedCategories: ["all"] },
  { type: "map", label: "Map", allowedCategories: ["all"] },
  { type: "reviews", label: "Reviews", allowedCategories: ["all"] },
  { type: "faq", label: "FAQ", allowedCategories: ["all"] },
  { type: "cta", label: "Call to action", allowedCategories: ["all"] },
  { type: "footer", label: "Footer", allowedCategories: ["all"] },
  { type: "menu", label: "Menu", allowedCategories: ["restaurant"] },
  { type: "rooms", label: "Rooms", allowedCategories: ["hotel"] },
  { type: "doctors", label: "Doctors", allowedCategories: ["doctor", "hospital"] },
  { type: "offers", label: "Offers", allowedCategories: ["all"] },
] as const;

export const defaultDesignConfig = {
  theme: "modern",
  typography: "clean",
  buttonStyle: "rounded",
  cardStyle: "soft",
  radius: "lg",
  spacing: "comfortable",
  sectionWidth: "wide",
  primary: "#2456c8",
  secondary: "#173d9c",
  background: "#f8fafc",
  surface: "#ffffff",
  text: "#0f172a",
  muted: "#64748b",
  accent: "#f59e0b",
} as const;

const sectionInput = z.object({
  id: z.number().int().positive().optional(),
  sectionType: z.string().min(2).max(60),
  displayOrder: z.number().int().min(0),
  enabled: z.boolean(),
  config: z.record(z.string(), z.unknown()).optional(),
});
export const safeDesignKeys = ["theme", "typography", "buttonStyle", "cardStyle", "radius", "spacing", "sectionWidth", "primary", "secondary", "background", "surface", "text", "muted", "accent"] as const;
export const safeDesignSchema = z.object({ theme: z.enum(["modern", "editorial", "minimal"]), typography: z.enum(["clean", "serif", "compact"]), buttonStyle: z.enum(["rounded", "square", "pill"]), cardStyle: z.enum(["soft", "outlined", "flat"]), radius: z.enum(["sm", "lg", "xl"]), spacing: z.enum(["compact", "comfortable", "airy"]), sectionWidth: z.enum(["contained", "wide", "full"]), primary: z.string().regex(/^#[0-9a-fA-F]{6}$/), secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/), background: z.string().regex(/^#[0-9a-fA-F]{6}$/), surface: z.string().regex(/^#[0-9a-fA-F]{6}$/), text: z.string().regex(/^#[0-9a-fA-F]{6}$/), muted: z.string().regex(/^#[0-9a-fA-F]{6}$/), accent: z.string().regex(/^#[0-9a-fA-F]{6}$/) });
const designInput = z.object({
  businessId: z.number().int().positive(),
  sections: z.array(sectionInput).min(1).max(30),
  designConfig: z.record(z.string(), z.unknown()),
  seoTitle: z.string().max(180).optional(),
  metaDescription: z.string().max(300).optional(),
});

async function dbOrThrow() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The website builder is temporarily unavailable." });
  return db;
}

async function ownedPage(businessId: number, userId: number, role: string) {
  const db = await dbOrThrow();
  const businessRows = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
  const business = businessRows[0];
  if (!business) throw new TRPCError({ code: "NOT_FOUND", message: "Business not found." });
  if (!canManageBusiness(role as "user" | "business_owner" | "admin" | "super_admin", userId, business.ownerId)) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot manage this website." });
  const pageRows = await db.select().from(businessPages).where(eq(businessPages.businessId, businessId)).limit(1);
  let page = pageRows[0];
  if (!page) {
    const inserted = await db.insert(businessPages).values({ businessId, slug: `${business.slug}-website`, status: "draft" });
    const created = await db.select().from(businessPages).where(eq(businessPages.id, Number(inserted[0].insertId))).limit(1);
    page = created[0];
  }
  if (!page) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Website page could not be initialized." });
  return { db, business, page };
}

function defaultSections(categoryName?: string | null) {
  return canonicalWebsiteSectionTypes(categoryName).map((sectionType, displayOrder) => ({ sectionType, displayOrder, enabled: true, config: {} }));
}

async function websiteFacts(db: Awaited<ReturnType<typeof dbOrThrow>>, business: typeof businesses.$inferSelect) {
  const [categoryRows, cityRows, hours, services, images] = await Promise.all([
    db.select({ name: categories.name }).from(categories).where(eq(categories.id, business.categoryId)).limit(1),
    db.select({ name: cities.name }).from(cities).where(eq(cities.id, business.cityId)).limit(1),
    db.select({ dayOfWeek: businessHours.dayOfWeek, opensAt: businessHours.opensAt, closesAt: businessHours.closesAt, isClosed: businessHours.isClosed, isTwentyFourHours: businessHours.isTwentyFourHours }).from(businessHours).where(eq(businessHours.businessId, business.id)).orderBy(asc(businessHours.dayOfWeek)),
    db.select({ name: businessServices.name, description: businessServices.description, isEnabled: businessServices.isEnabled }).from(businessServices).where(eq(businessServices.businessId, business.id)).orderBy(asc(businessServices.sortOrder)),
    db.select({ imageType: businessImages.imageType, alt: businessImages.alt }).from(businessImages).where(eq(businessImages.businessId, business.id)).orderBy(asc(businessImages.sortOrder)),
  ]);
  return {
    business: {
      name: business.name,
      category: categoryRows[0]?.name ?? null,
      city: cityRows[0]?.name ?? null,
      status: business.status,
      isVerified: business.isVerified,
      shortDescription: business.shortDescription,
      approvedDescription: business.approvedDescription,
      aboutDescription: business.aboutDescription,
      address: business.address,
      postcode: business.postcode,
      phone: business.phone,
      whatsapp: business.whatsapp,
      email: business.email,
      website: business.website,
      latitude: business.latitude,
      longitude: business.longitude,
    },
    hours,
    services: services.filter(service => service.isEnabled).map(({ isEnabled: _isEnabled, ...service }) => service),
    photoInventory: images.map(image => ({ imageType: image.imageType, alt: image.alt })),
    supportedSections: canonicalWebsiteSectionTypes(categoryRows[0]?.name),
  };
}

function sectionOutputSchema() {
  return {
    name: "grounded_website_section",
    strict: true,
    schema: {
      type: "object",
      properties: {
        config: {
          type: "object",
          properties: {
            label: { type: "string" },
            eyebrow: { type: "string" },
            headline: { type: "string" },
            body: { type: "string" },
            ctaLabel: { type: "string" },
            ctaHref: { type: "string", enum: ["#contact", "#services", "#book-appointment"] },
            bullets: { type: "array", maxItems: 8, items: { type: "string" } },
          },
          additionalProperties: false,
        },
      },
      required: ["config"],
      additionalProperties: false,
    },
  } as const;
}

export const websiteRouter = router({
  registry: publicProcedure.query(() => sectionRegistry),
  moderationQueue: adminProcedure.query(async () => { const db = await dbOrThrow(); return db.select({ page: businessPages, business: businesses }).from(businessPages).innerJoin(businesses, eq(businessPages.businessId, businesses.id)).where(eq(businessPages.status, "pending_review")); }),
  moderate: adminProcedure.input(z.object({ businessId: z.number().int().positive(), decision: z.enum(["approve", "reject"]), note: z.string().max(500).optional() })).mutation(async ({ ctx, input }) => { const db = await dbOrThrow(); const pages = await db.select().from(businessPages).where(eq(businessPages.businessId, input.businessId)).limit(1); const page = pages[0]; if (!page) throw new TRPCError({ code: "NOT_FOUND", message: "Website page not found." }); const history = await db.select().from(pagePublishHistory).where(and(eq(pagePublishHistory.pageId, page.id), eq(pagePublishHistory.action, "submit_review"))).orderBy(desc(pagePublishHistory.createdAt)).limit(1); await db.update(businessPages).set({ status: input.decision === "approve" ? "published" : "draft", publishedAt: input.decision === "approve" ? new Date() : null }).where(eq(businessPages.id, page.id)); if (history[0]) { await db.update(pagePublishHistory).set({ reviewedById: ctx.user.id, reviewNote: input.note ?? null }).where(eq(pagePublishHistory.id, history[0].id)); await db.insert(pagePublishHistory).values({ pageId: page.id, businessId: input.businessId, versionId: history[0].versionId, action: input.decision === "approve" ? "approve" : "reject", performedById: ctx.user.id, reviewNote: input.note ?? null, reviewedById: ctx.user.id }); } return { success: true, businessId: input.businessId, decision: input.decision, note: input.note ?? null, reviewedById: ctx.user.id }; }),
  templateLibrary: adminProcedure.query(() => ({ templates: [{ id: "modern-trust", label: "Modern trust", designConfig: defaultDesignConfig }, { id: "editorial-local", label: "Editorial local", designConfig: { ...defaultDesignConfig, theme: "editorial", typography: "serif" } }] })),
  create: protectedProcedure.input(z.object({ businessId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const { page } = await ownedPage(input.businessId, ctx.user.id, ctx.user.role); return { id: page.id, slug: page.slug, status: page.status }; }),
  versions: protectedProcedure.input(z.object({ businessId: z.number().int().positive() })).query(async ({ ctx, input }) => { const { db, page } = await ownedPage(input.businessId, ctx.user.id, ctx.user.role); return db.select().from(pageVersions).where(eq(pageVersions.pageId, page.id)).orderBy(asc(pageVersions.versionNumber)); }),
  reorder: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), sectionIds: z.array(z.number().int().positive()).min(1).max(30) })).mutation(async ({ ctx, input }) => { const { db, page } = await ownedPage(input.businessId, ctx.user.id, ctx.user.role); const sections = await db.select().from(pageSections).where(eq(pageSections.pageId, page.id)); const ids = new Set(sections.map(section => section.id)); if (input.sectionIds.some(id => !ids.has(id)) || input.sectionIds.length !== sections.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Section order does not match this page." }); for (let displayOrder = 0; displayOrder < input.sectionIds.length; displayOrder++) { const id = input.sectionIds[displayOrder]; await db.update(pageSections).set({ displayOrder }).where(and(eq(pageSections.id, id), eq(pageSections.pageId, page.id))); } return { success: true }; }),
  setSectionEnabled: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), sectionId: z.number().int().positive(), enabled: z.boolean() })).mutation(async ({ ctx, input }) => { const { db, page } = await ownedPage(input.businessId, ctx.user.id, ctx.user.role); await db.update(pageSections).set({ enabled: input.enabled }).where(and(eq(pageSections.id, input.sectionId), eq(pageSections.pageId, page.id))); return { success: true }; }),
  builder: protectedProcedure.input(z.object({ businessId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const { db, business, page } = await ownedPage(input.businessId, ctx.user.id, ctx.user.role);
    let sections = await db.select().from(pageSections).where(eq(pageSections.pageId, page.id)).orderBy(asc(pageSections.displayOrder));
    if (!sections.length) {
      const categoryRows = await db.select({ name: categories.name }).from(categories).where(eq(categories.id, business.categoryId)).limit(1);
      const initial = defaultSections(categoryRows[0]?.name);
      await db.insert(pageSections).values(initial.map(section => ({ ...section, pageId: page.id })));
      sections = await db.select().from(pageSections).where(eq(pageSections.pageId, page.id)).orderBy(asc(pageSections.displayOrder));
    }
    const versions = await db.select().from(pageVersions).where(and(eq(pageVersions.pageId, page.id), eq(pageVersions.businessId, input.businessId))).orderBy(asc(pageVersions.versionNumber));
    return { page, business, sections, versions, designConfig: versions.at(-1)?.designConfig ?? defaultDesignConfig, registry: sectionRegistry };
  }),
  suggestRedesign: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), direction: z.string().trim().min(3).max(240).default("Make the presentation feel more distinctive while staying trustworthy.") })).mutation(async ({ ctx, input }) => {
    const { db, business, page } = await ownedPage(input.businessId, ctx.user.id, ctx.user.role);
    const latest = await db.select().from(pageVersions).where(eq(pageVersions.pageId, page.id)).orderBy(asc(pageVersions.versionNumber));
    const current = latest.at(-1)?.designConfig ?? defaultDesignConfig;
    const response = await invokeLLM({ messages: [{ role: "system", content: `You are a restrained website art director. Return only a presentation design configuration. Never invent or edit business facts, names, addresses, services, images, reviews, ratings, testimonials, prices, or claims. Allowed keys: ${safeDesignKeys.join(", ")}.` }, { role: "user", content: JSON.stringify({ category: business.categoryId, direction: input.direction, current }) }], response_format: { type: "json_schema", json_schema: { name: "safe_design_config", strict: true, schema: { type: "object", properties: Object.fromEntries(safeDesignKeys.map(key => [key, { type: "string" }])), required: [...safeDesignKeys], additionalProperties: false } } } });
    const raw = response.choices?.[0]?.message?.content;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : current;
    const proposal = safeDesignSchema.parse({ ...defaultDesignConfig, ...parsed });
    return { proposal, source: "ai_design_only", businessId: input.businessId };
  }),
  generateDraft: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), instruction: z.string().trim().max(500).optional() })).mutation(async ({ ctx, input }) => {
    const { db, business } = await ownedPage(input.businessId, ctx.user.id, ctx.user.role);
    const facts = await websiteFacts(db, business);
    const generation = await generateStructured<GeneratedWebsiteDraft>({
      system: websiteDraftSystemPrompt(),
      user: JSON.stringify({ request: input.instruction ?? "Create a complete factual first website draft.", approvedFacts: facts }),
      outputSchema: websiteDraftOutputSchema,
      maxTokens: 2800,
    });
    const draft = normalizeWebsiteDraft(generation.data, facts.business.category);
    return { businessId: input.businessId, draft, source: "approved_business_facts" as const, provider: generation.provider, model: generation.model };
  }),
  regenerateSection: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), sectionType: z.string().min(2).max(60), currentConfig: z.record(z.string(), z.unknown()).optional(), instruction: z.string().trim().max(500).optional() })).mutation(async ({ ctx, input }) => {
    const { db, business } = await ownedPage(input.businessId, ctx.user.id, ctx.user.role);
    const facts = await websiteFacts(db, business);
    const supported = canonicalWebsiteSectionTypes(facts.business.category);
    if (!supported.includes(input.sectionType as (typeof supported)[number])) throw new TRPCError({ code: "BAD_REQUEST", message: "That section is not supported for this business category." });
    const generation = await generateStructured<{ config: GeneratedWebsiteDraft["sections"][number]["config"] }>({
      system: websiteDraftSystemPrompt() + " You are regenerating exactly one section. Keep the response limited to concise presentation copy for that section.",
      user: JSON.stringify({ sectionType: input.sectionType, request: input.instruction ?? "Improve clarity and local relevance without adding facts.", currentConfig: input.currentConfig ?? {}, approvedFacts: facts }),
      outputSchema: sectionOutputSchema(),
      maxTokens: 1200,
    });
    const normalized = normalizeWebsiteDraft({ sections: [{ sectionType: input.sectionType, config: generation.data.config }] }, facts.business.category);
    const section = normalized.sections.find(item => item.sectionType === input.sectionType);
    return { businessId: input.businessId, sectionType: input.sectionType, config: section?.config ?? {}, source: "approved_business_facts" as const, provider: generation.provider, model: generation.model };
  }),
  applyRedesign: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), designConfig: safeDesignSchema })).mutation(async ({ ctx, input }) => {
    const { db, business, page } = await ownedPage(input.businessId, ctx.user.id, ctx.user.role);
    const latest = await db.select().from(pageVersions).where(eq(pageVersions.pageId, page.id)).orderBy(asc(pageVersions.versionNumber));
    await db.insert(pageVersions).values({ pageId: page.id, businessId: business.id, versionNumber: (latest.at(-1)?.versionNumber ?? 0) + 1, designConfig: input.designConfig, status: "draft", createdById: ctx.user.id });
    return { success: true, businessId: input.businessId };
  }),
  rejectRedesign: protectedProcedure.input(z.object({ businessId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { await ownedPage(input.businessId, ctx.user.id, ctx.user.role); return { success: true, rejected: true }; }),
  submitForReview: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), note: z.string().max(500).optional() })).mutation(async ({ ctx, input }) => { const { db, business, page } = await ownedPage(input.businessId, ctx.user.id, ctx.user.role); const latest = await db.select().from(pageVersions).where(eq(pageVersions.pageId, page.id)).orderBy(asc(pageVersions.versionNumber)); const version = latest.at(-1); if (!version) throw new TRPCError({ code: "BAD_REQUEST", message: "Save a draft version before submitting for review." }); await db.update(businessPages).set({ status: "pending_review", publishedAt: null }).where(eq(businessPages.id, page.id)); await db.insert(pagePublishHistory).values({ pageId: page.id, businessId: business.id, versionId: version.id, action: "submit_review", performedById: ctx.user.id, reviewNote: input.note ?? null }); return { success: true, businessId: input.businessId, status: "pending_review" as const }; }),
  saveDraft: protectedProcedure.input(designInput).mutation(async ({ ctx, input }) => {
    const { db, business, page } = await ownedPage(input.businessId, ctx.user.id, ctx.user.role);
    const invalid = input.sections.some(section => !sectionRegistry.some(item => item.type === section.sectionType));
    if (invalid) throw new TRPCError({ code: "BAD_REQUEST", message: "The page contains an unsupported section." });
    await db.delete(pageSections).where(eq(pageSections.pageId, page.id));
    await db.insert(pageSections).values(input.sections.map(section => ({ pageId: page.id, sectionType: section.sectionType, displayOrder: section.displayOrder, enabled: section.enabled, config: section.config ?? {} })));
    const latest = await db.select().from(pageVersions).where(eq(pageVersions.pageId, page.id)).orderBy(asc(pageVersions.versionNumber));
    const versionNumber = (latest.at(-1)?.versionNumber ?? 0) + 1;
    await db.insert(pageVersions).values({ pageId: page.id, businessId: business.id, versionNumber, designConfig: input.designConfig, status: "draft", createdById: ctx.user.id });
    await db.update(businessPages).set({ seoTitle: input.seoTitle, metaDescription: input.metaDescription, status: page.status === "published" ? "pending_review" : "draft" }).where(eq(businessPages.id, page.id));
    return { success: true, versionNumber };
  }),
  publish: protectedProcedure.input(z.object({ businessId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { db, business, page } = await ownedPage(input.businessId, ctx.user.id, ctx.user.role);
    if (!["approved", "published"].includes(business.status)) throw new TRPCError({ code: "FORBIDDEN", message: "The business profile must be approved before its website can be published." });
    const sections = await db.select().from(pageSections).where(and(eq(pageSections.pageId, page.id), eq(pageSections.enabled, true)));
    if (!sections.some(section => section.sectionType === "hero")) throw new TRPCError({ code: "BAD_REQUEST", message: "Add a hero section before publishing." });
    const versions = await db.select().from(pageVersions).where(eq(pageVersions.pageId, page.id)).orderBy(asc(pageVersions.versionNumber));
    const draft = versions.at(-1);
    if (!draft) throw new TRPCError({ code: "BAD_REQUEST", message: "Save a design draft before publishing." });
    await db.update(pageVersions).set({ status: "published" }).where(eq(pageVersions.id, draft.id));
    await db.update(businessPages).set({ status: "published", publishedAt: new Date() }).where(eq(businessPages.id, page.id));
    await db.insert(pagePublishHistory).values({ pageId: page.id, businessId: business.id, versionId: draft.id, action: "publish", performedById: ctx.user.id });
    return { success: true, slug: page.slug };
  }),
  unpublish: protectedProcedure.input(z.object({ businessId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { db, page } = await ownedPage(input.businessId, ctx.user.id, ctx.user.role);
    const versions = await db.select().from(pageVersions).where(eq(pageVersions.pageId, page.id)).orderBy(asc(pageVersions.versionNumber));
    const latest = versions.at(-1);
    if (!latest) throw new TRPCError({ code: "BAD_REQUEST", message: "Create a page version before unpublishing." });
    await db.update(businessPages).set({ status: "draft", publishedAt: null }).where(eq(businessPages.id, page.id));
    await db.insert(pagePublishHistory).values({ pageId: page.id, businessId: input.businessId, versionId: latest.id, action: "unpublish", performedById: ctx.user.id });
    return { success: true };
  }),
  restore: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), versionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { db, page } = await ownedPage(input.businessId, ctx.user.id, ctx.user.role);
    const rows = await db.select().from(pageVersions).where(and(eq(pageVersions.id, input.versionId), eq(pageVersions.pageId, page.id))).limit(1);
    const version = rows[0];
    if (!version) throw new TRPCError({ code: "NOT_FOUND", message: "Version not found." });
    await db.update(pageVersions).set({ status: "published" }).where(eq(pageVersions.id, version.id));
    await db.update(businessPages).set({ status: "published", publishedAt: new Date() }).where(eq(businessPages.id, page.id));
    await db.insert(pagePublishHistory).values({ pageId: page.id, businessId: input.businessId, versionId: version.id, action: "restore", performedById: ctx.user.id });
    return { success: true };
  }),
  duplicateOwnDesign: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), sourceBusinessId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { db, page: targetPage } = await ownedPage(input.businessId, ctx.user.id, ctx.user.role);
    const { page: sourcePage } = await ownedPage(input.sourceBusinessId, ctx.user.id, ctx.user.role);
    const [sections, versions] = await Promise.all([
      db.select().from(pageSections).where(eq(pageSections.pageId, sourcePage.id)).orderBy(asc(pageSections.displayOrder)),
      db.select().from(pageVersions).where(eq(pageVersions.pageId, sourcePage.id)).orderBy(asc(pageVersions.versionNumber)),
    ]);
    const design = versions.at(-1)?.designConfig ?? defaultDesignConfig;
    await db.delete(pageSections).where(eq(pageSections.pageId, targetPage.id));
    if (sections.length) await db.insert(pageSections).values(sections.map(s => ({ pageId: targetPage.id, sectionType: s.sectionType, displayOrder: s.displayOrder, enabled: s.enabled, config: s.config ?? {} })));
    const latest = await db.select().from(pageVersions).where(eq(pageVersions.pageId, targetPage.id)).orderBy(asc(pageVersions.versionNumber));
    await db.insert(pageVersions).values({ pageId: targetPage.id, businessId: input.businessId, versionNumber: (latest.at(-1)?.versionNumber ?? 0) + 1, designConfig: design, status: "draft", createdById: ctx.user.id });
    return { success: true };
  }),
  publicPage: publicProcedure.input(z.object({ slug: z.string().min(2).max(240) })).query(async ({ input }) => {
    const db = await dbOrThrow();
    const rows = await db.select({ page: businessPages, business: businesses, category: categories.name, city: cities.name }).from(businessPages).innerJoin(businesses, eq(businessPages.businessId, businesses.id)).leftJoin(categories, eq(businesses.categoryId, categories.id)).leftJoin(cities, eq(businesses.cityId, cities.id)).where(and(eq(businesses.slug, input.slug), eq(businessPages.status, "published"))).limit(1);
    const row = rows[0];
    if (!row || !["approved", "published"].includes(row.business.status)) throw new TRPCError({ code: "NOT_FOUND", message: "Published website not found." });
    const [sections, services, images, reviews] = await Promise.all([
      db.select().from(pageSections).where(and(eq(pageSections.pageId, row.page.id), eq(pageSections.enabled, true))).orderBy(asc(pageSections.displayOrder)),
      db.select().from(businessServices).where(and(eq(businessServices.businessId, row.business.id), eq(businessServices.isEnabled, true))).orderBy(asc(businessServices.sortOrder)),
      db.select().from(businessImages).where(eq(businessImages.businessId, row.business.id)).orderBy(asc(businessImages.sortOrder)),
      db.select().from(businessReviews).where(and(eq(businessReviews.businessId, row.business.id), eq(businessReviews.status, "published"))),
    ]);
    return { ...row, sections, services, images, reviews };
  }),
  track: publicProcedure.input(z.object({ pageId: z.number().int().positive(), businessId: z.number().int().positive(), eventType: z.enum(["page_view", "cta_click", "lead_start", "lead_submit", "call_click", "whatsapp_click", "website_click", "directions", "scroll_depth", "section_interaction"]), sectionId: z.number().int().positive().optional(), source: z.string().max(100).optional(), campaign: z.string().max(120).optional(), metadata: z.record(z.string(), z.unknown()).optional() })).mutation(async ({ input }) => {
    const db = await dbOrThrow();
    const page = await db.select({ id: businessPages.id, businessId: businessPages.businessId }).from(businessPages).where(and(eq(businessPages.id, input.pageId), eq(businessPages.businessId, input.businessId))).limit(1);
    if (!page[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Website page not found." });
    await db.insert(pageAnalytics).values(input);
    return { success: true };
  }),
});
