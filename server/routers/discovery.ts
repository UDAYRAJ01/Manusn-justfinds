import { z } from "zod";
import { createPublicBusinessReview, getActiveCategories, getActiveCities, getPublicBusinessByRoute, getPublicBusinesses, getPublicCategoryBySlug, getPublicCategoryFields, getPublicCityBySlug, getPublicLocalities, getPublicSavedBusiness, getPublicSearchPage, getPublicSubcategories, getPublicCertificateVerification, logPublicInteraction, logPublicSearch, reportPublicBusinessReview, togglePublicSavedBusiness } from "../db";
import { parseSearchIntent } from "../domain/searchIntent";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const searchInput = z.object({
  query: z.string().max(200).optional().default(""),
  city: z.string().max(140).optional(),
  locality: z.string().max(180).optional(),
  category: z.string().max(120).optional(),
  subcategory: z.string().max(120).optional(),
  verified: z.boolean().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  sort: z.enum(["nearby", "rating", "recommended"]).optional(),
  sessionId: z.string().max(64).optional(),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(10).default(10),
});

function matchesQuery(item: { name: string; category: string; shortDescription: string }, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [item.name, item.category, item.shortDescription].some(value => value.toLowerCase().includes(normalized.replace(/near me|in kanpur|best/gi, "").trim())) || normalized.includes(item.category.toLowerCase());
}

export const discoveryRouter = router({
  categories: publicProcedure.query(() => getActiveCategories()),
  locations: publicProcedure.query(() => getActiveCities()),
  category: publicProcedure.input(z.object({ slug: z.string().min(1).max(120) })).query(({ input }) => getPublicCategoryBySlug(input.slug)),
  subcategories: publicProcedure.input(z.object({ category: z.string().min(1).max(120) })).query(({ input }) => getPublicSubcategories(input.category)),
  city: publicProcedure.input(z.object({ slug: z.string().min(1).max(140) })).query(({ input }) => getPublicCityBySlug(input.slug)),
  localities: publicProcedure.input(z.object({ city: z.string().min(1).max(140) })).query(({ input }) => getPublicLocalities(input.city)),
  categoryFields: publicProcedure.input(z.object({ categoryId: z.number().int().positive() })).query(({ input }) => getPublicCategoryFields(input.categoryId)),
  suggestions: publicProcedure.input(z.object({ query: z.string().max(100).default("") })).query(async ({ input }) => {
    const term = input.query.trim().toLowerCase();
    const [categories, businesses] = await Promise.all([getActiveCategories(), getPublicBusinesses(input.query)]);
    const categorySuggestions = categories.filter(category => !term || category.name.toLowerCase().includes(term)).map(category => ({ kind: "Category", label: category.name, detail: "Browse this category" }));
    const businessSuggestions = businesses.filter(item => !term || item.name.toLowerCase().includes(term) || item.category.toLowerCase().includes(term)).map(item => ({ kind: "Business", label: item.name, detail: `${item.locality ?? "Local area"}, ${item.city}` }));
    const suggestedSearches: Array<{ kind: "Suggested"; label: string; detail: string }> = [];
    return [...businessSuggestions, ...categorySuggestions, ...suggestedSearches].slice(0, 8);
  }),
  search: publicProcedure.input(searchInput).query(async ({ ctx, input }) => {
    const intent = parseSearchIntent(input.query);
    const sort = input.sort ?? (intent.mode === "nearby" && input.latitude !== undefined && input.longitude !== undefined ? "nearby" : intent.mode === "recommended" ? "recommended" : "recommended");
    const result = await getPublicSearchPage({
      query: intent.searchTerm,
      citySlug: input.city,
      localitySlug: input.locality,
      categorySlug: input.category,
      subcategorySlug: input.subcategory,
      verified: input.verified,
      latitude: input.latitude,
      longitude: input.longitude,
      sort,
      offset: input.offset,
      limit: input.limit,
      includeTotal: input.offset === 0,
    });
    if (input.offset === 0) {
      await logPublicSearch({ userId: ctx.user?.id, query: input.query, latitude: input.latitude, longitude: input.longitude, intent: sort === "nearby" ? "nearby" : intent.mode, sessionId: input.sessionId, resultCount: result.total ?? result.items.length });
    }
    return {
      items: result.items.map(row => ({
        ...row,
        locality: row.locality ?? "Local area",
        shortDescription: row.shortDescription ?? "Business profile available on Just Finds.",
        phone: row.phone ?? undefined,
        whatsapp: row.whatsapp ?? undefined,
        website: row.website ?? undefined,
        latitude: row.latitude === null ? null : Number(row.latitude),
        longitude: row.longitude === null ? null : Number(row.longitude),
        distanceKm: row.distanceKm === null ? null : Number(row.distanceKm),
        verified: row.isVerified,
        openNow: false,
        reviewSummary: "No Just Finds reviews yet",
      })),
      nextOffset: result.nextOffset,
      total: result.total,
      intent,
      sort,
    };
  }),
  interaction: publicProcedure.input(z.object({ businessId: z.number().int().positive(), action: z.enum(["click", "call", "whatsapp", "directions", "website", "save", "inquiry", "share"]), query: z.string().max(300).optional(), sessionId: z.string().max(64).optional() })).mutation(async ({ ctx, input }) => {
    await logPublicInteraction({ userId: ctx.user?.id, ...input });
    return { ok: true };
  }),
  business: publicProcedure.input(z.object({ slug: z.string().min(2).max(240) })).query(async ({ input }) => {
    const detail = await getPublicBusinessByRoute(input.slug);
    return detail ? { ...detail, isFixture: false, reviewSummary: "No Just Finds reviews yet" } : null;
  }),
  saved: protectedProcedure.input(z.object({ businessId: z.number().int().positive() })).query(({ ctx, input }) => getPublicSavedBusiness(ctx.user.id, input.businessId)),
  toggleSave: protectedProcedure.input(z.object({ businessId: z.number().int().positive() })).mutation(async ({ ctx, input }) => togglePublicSavedBusiness(ctx.user.id, input.businessId)),
  submitReview: protectedProcedure.input(z.object({ businessId: z.number().int().positive(), rating: z.number().int().min(1).max(5), content: z.string().trim().max(2000).optional() })).mutation(({ ctx, input }) => createPublicBusinessReview({ ...input, userId: ctx.user.id })),
  reportReview: protectedProcedure.input(z.object({ reviewId: z.number().int().positive(), reason: z.string().trim().min(3).max(240), details: z.string().trim().max(1000).optional() })).mutation(({ ctx, input }) => reportPublicBusinessReview({ ...input, reporterId: ctx.user.id })),
  certificate: publicProcedure.input(z.object({ slug: z.string().min(2).max(240) })).query(({ input }) => getPublicCertificateVerification(input.slug)),
});
