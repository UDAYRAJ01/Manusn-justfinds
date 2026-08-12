import { z } from "zod";
import { getActiveCategories, getActiveCities, getPublicBusinessByRoute, getPublicBusinesses, getPublicCategoryFields } from "../db";
import { calculateRecommendationScore, haversineDistanceKm } from "../domain/ranking";
import { publicProcedure, router } from "../_core/trpc";

const searchInput = z.object({
  query: z.string().max(200).optional().default(""),
  city: z.string().max(140).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
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
  categoryFields: publicProcedure.input(z.object({ categoryId: z.number().int().positive() })).query(({ input }) => getPublicCategoryFields(input.categoryId)),
  suggestions: publicProcedure.input(z.object({ query: z.string().max(100).default("") })).query(async ({ input }) => {
    const term = input.query.trim().toLowerCase();
    const [categories, businesses] = await Promise.all([getActiveCategories(), getPublicBusinesses(input.query)]);
    const categorySuggestions = categories.filter(category => !term || category.name.toLowerCase().includes(term)).map(category => ({ kind: "Category", label: category.name, detail: "Browse this category" }));
    const businessSuggestions = businesses.filter(item => !term || item.name.toLowerCase().includes(term) || item.category.toLowerCase().includes(term)).map(item => ({ kind: "Business", label: item.name, detail: `${item.locality ?? "Local area"}, ${item.city}` }));
    const suggestedSearches = term ? [] : ["Hospitals near me", "Restaurants near me", "Jobs near me"].map(label => ({ kind: "Suggested", label, detail: "Suggested search" }));
    return [...businessSuggestions, ...categorySuggestions, ...suggestedSearches].slice(0, 8);
  }),
  search: publicProcedure.input(searchInput).query(async ({ input }) => {
    const rows = await getPublicBusinesses(input.query, input.city);
    const source = rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: row.category,
      categorySlug: row.categorySlug,
      city: row.city,
      citySlug: row.citySlug,
      locality: row.locality ?? "Local area",
      address: row.address,
      shortDescription: row.shortDescription ?? "Business profile available on Just Finds.",
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      verified: row.isVerified,
      profileCompleteness: row.profileCompleteness,
      recommendationScore: row.recommendationScore,
      reputationScore: row.reputationScore,
      openNow: false,
      services: [] as string[],
      hours: [] as string[],
      phone: row.phone ?? undefined,
      whatsapp: row.whatsapp ?? undefined,
      website: row.website ?? undefined,
    }));
    const filtered = source.filter(item => matchesQuery(item, input.query) && (!input.city || item.citySlug === input.city));
    const ranked = filtered.map(item => {
      const distanceKm = input.latitude !== undefined && input.longitude !== undefined
        ? haversineDistanceKm(input.latitude, input.longitude, item.latitude, item.longitude)
        : null;
      const score = calculateRecommendationScore({ relevance: matchesQuery(item, input.query) ? 92 : 55, distanceKm, profileCompleteness: item.profileCompleteness, verified: item.verified, activity: 72, openNow: item.openNow, interactionAffinity: 0 });
      return { ...item, distanceKm, rankScore: score, reviewSummary: "No Just Finds reviews yet" };
    }).sort((left, right) => right.rankScore - left.rankScore || (left.distanceKm ?? 9999) - (right.distanceKm ?? 9999));
    return { items: ranked.slice(input.offset, input.offset + input.limit), nextOffset: input.offset + input.limit < ranked.length ? input.offset + input.limit : null, total: ranked.length };
  }),
  business: publicProcedure.input(z.object({ slug: z.string().min(2).max(240) })).query(async ({ input }) => {
    const detail = await getPublicBusinessByRoute(input.slug);
    return detail ? { ...detail, isFixture: false, reviewSummary: "No Just Finds reviews yet" } : null;
  }),
});
