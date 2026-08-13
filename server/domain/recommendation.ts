import { and, avg, count, desc, eq, gte, inArray } from "drizzle-orm";
import { businessRecommendationSignals, businessReputation, businessReviews, businesses, recommendationWeights, searchInteractions } from "../../drizzle/schema";
import { getDb } from "../db";

export type RecommendationSignalKey = "relevance" | "distance" | "rating" | "review" | "completeness" | "verification" | "activity" | "availability" | "freshness" | "manual_priority" | "featured";
export type RecommendationSignals = Record<RecommendationSignalKey, number>;
export type RecommendationWeights = Record<RecommendationSignalKey, number>;

const signalKeys: RecommendationSignalKey[] = ["relevance", "distance", "rating", "review", "completeness", "verification", "activity", "availability", "freshness", "manual_priority", "featured"];
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function calculateRecommendationScore(signals: RecommendationSignals, weights: RecommendationWeights): number {
  const active = signalKeys.filter(key => (weights[key] ?? 0) > 0);
  if (!active.length) return 0;
  const totalWeight = active.reduce((sum, key) => sum + (weights[key] ?? 0), 0);
  const weighted = active.reduce((sum, key) => sum + clamp(signals[key] ?? 0) * (weights[key] ?? 0), 0);
  return clamp(weighted / totalWeight);
}

export function calculateReputationScore(input: { averageRating: number | null; reviewCount: number; isVerified: boolean; profileCompleteness: number; freshnessDays: number; legitimateInteractionCount: number; createdAt?: Date | string | null }) {
  const ratingScore = input.averageRating === null ? 0 : clamp((input.averageRating / 5) * 55);
  const reviewDepthScore = clamp(Math.min(15, input.reviewCount * 3));
  const verificationScore = input.isVerified ? 15 : 0;
  const completenessScore = clamp(input.profileCompleteness * 0.1);
  const freshnessScore = input.freshnessDays <= 30 ? 10 : input.freshnessDays <= 90 ? 6 : input.freshnessDays <= 180 ? 3 : 0;
  const activityConfidence = input.legitimateInteractionCount > 0 ? 5 : 0;
  
  const createdTime = input.createdAt ? new Date(input.createdAt).getTime() : Date.now();
  const ageDays = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);
  const isNew = ageDays < 30 && input.reviewCount === 0;

  const score = clamp(ratingScore + reviewDepthScore + verificationScore + completenessScore + freshnessScore + activityConfidence);

  return {
    score,
    label: isNew ? "New on Just Finds" : `${score} / 100`,
    isNew,
    factors: { ratingScore, reviewDepthScore, verificationScore, completenessScore, freshnessScore, activityConfidence },
  };
}

export async function getConfiguredRecommendationWeights(): Promise<RecommendationWeights> {
  const db = await getDb();
  if (!db) return Object.fromEntries(signalKeys.map(key => [key, 0])) as RecommendationWeights;
  const rows = await db.select({ signalKey: recommendationWeights.signalKey, weightPercent: recommendationWeights.weightPercent }).from(recommendationWeights).where(eq(recommendationWeights.isActive, true));
  return Object.fromEntries(signalKeys.map(key => [key, Number(rows.find(row => row.signalKey === key)?.weightPercent ?? 0)])) as RecommendationWeights;
}

function daysSince(date: Date | null | undefined) {
  if (!date) return 365;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
}

export async function refreshBusinessScores(businessId: number, context?: { relevanceScore?: number; distanceScore?: number; availabilityScore?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const businessRows = await db.select({ id: businesses.id, isVerified: businesses.isVerified, profileCompleteness: businesses.profileCompleteness, createdAt: businesses.createdAt, updatedAt: businesses.updatedAt, manualPriority: businesses.manualPriority, isFeatured: businesses.isFeatured }).from(businesses).where(eq(businesses.id, businessId)).limit(1);
  const business = businessRows[0];
  if (!business) return undefined;
  const [reviewSummary, interactionSummary] = await Promise.all([
    db.select({ averageRating: avg(businessReviews.rating), reviewCount: count(businessReviews.id) }).from(businessReviews).where(and(eq(businessReviews.businessId, businessId), eq(businessReviews.status, "published"))),
    db.select({ interactionCount: count(searchInteractions.id) }).from(searchInteractions).where(and(eq(searchInteractions.businessId, businessId), inArray(searchInteractions.action, ["impression", "click", "call", "directions", "website", "inquiry"]), gte(searchInteractions.createdAt, new Date(Date.now() - 90 * 86_400_000)))),
  ]);
  const averageRating = reviewSummary[0]?.averageRating === null || reviewSummary[0]?.averageRating === undefined ? null : Number(reviewSummary[0].averageRating);
  const reviewCount = Number(reviewSummary[0]?.reviewCount ?? 0);
  const legitimateInteractionCount = Number(interactionSummary[0]?.interactionCount ?? 0);
  const reputation = calculateReputationScore({ averageRating, reviewCount, isVerified: business.isVerified, profileCompleteness: business.profileCompleteness, freshnessDays: daysSince(business.updatedAt), legitimateInteractionCount, createdAt: business.createdAt });
  const signals: RecommendationSignals = {
    relevance: clamp(context?.relevanceScore ?? 0),
    distance: clamp(context?.distanceScore ?? 0),
    rating: averageRating === null ? 0 : clamp(averageRating * 20),
    review: clamp(Math.min(100, reviewCount * 10)),
    completeness: clamp(business.profileCompleteness),
    verification: business.isVerified ? 100 : 0,
    activity: clamp(Math.min(100, legitimateInteractionCount * 5)),
    availability: clamp(context?.availabilityScore ?? 0),
    freshness: business.updatedAt ? clamp(Math.max(0, 100 - daysSince(business.updatedAt))) : 0,
    manual_priority: clamp(business.manualPriority * 10),
    featured: business.isFeatured ? 100 : 0,
  };
  const recommendationScore = calculateRecommendationScore(signals, await getConfiguredRecommendationWeights());
  await db.insert(businessRecommendationSignals).values({ businessId, ...signals, recommendationScore, calculatedAt: new Date() }).onDuplicateKeyUpdate({ set: { ...signals, recommendationScore, calculatedAt: new Date() } });
  await db.insert(businessReputation).values({ businessId, score: reputation.score, explanation: reputation.factors, updatedAt: new Date() }).onDuplicateKeyUpdate({ set: { score: reputation.score, explanation: reputation.factors, updatedAt: new Date() } });
  await db.update(businesses).set({ recommendationScore, reputationScore: reputation.score }).where(eq(businesses.id, businessId));
  return { businessId, recommendationScore, reputationScore: reputation.score, signals, reputationFactors: reputation.factors };
}
