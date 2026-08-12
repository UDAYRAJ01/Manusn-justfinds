export type RankingSignal = {
  relevance: number;
  distanceKm?: number | null;
  reviewCount?: number;
  profileCompleteness: number;
  verified: boolean;
  activity: number;
  openNow: boolean;
  interactionAffinity?: number;
  manualPriority?: number;
};

export type RankingWeights = {
  relevance: number;
  distance: number;
  reviews: number;
  completeness: number;
  verification: number;
  activity: number;
  availability: number;
  interaction: number;
  manualPriority: number;
};

export const defaultRankingWeights: RankingWeights = {
  relevance: 30,
  distance: 18,
  reviews: 7,
  completeness: 12,
  verification: 9,
  activity: 8,
  availability: 6,
  interaction: 5,
  manualPriority: 5,
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export function haversineDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latDelta = toRadians(latitudeB - latitudeA);
  const lonDelta = toRadians(longitudeB - longitudeA);
  const a = Math.sin(latDelta / 2) ** 2 + Math.cos(toRadians(latitudeA)) * Math.cos(toRadians(latitudeB)) * Math.sin(lonDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateRecommendationScore(signals: RankingSignal, weights: RankingWeights = defaultRankingWeights) {
  const distanceScore = signals.distanceKm === undefined || signals.distanceKm === null
    ? 50
    : clamp(100 - signals.distanceKm * 8);
  const reviewSignal = clamp(Math.log10((signals.reviewCount ?? 0) + 1) * 33);
  const manualSignal = clamp((signals.manualPriority ?? 0) * 10);

  const weighted =
    signals.relevance * weights.relevance +
    distanceScore * weights.distance +
    reviewSignal * weights.reviews +
    signals.profileCompleteness * weights.completeness +
    (signals.verified ? 100 : 0) * weights.verification +
    signals.activity * weights.activity +
    (signals.openNow ? 100 : 0) * weights.availability +
    (signals.interactionAffinity ?? 0) * weights.interaction +
    manualSignal * weights.manualPriority;

  const totalWeight = Object.values(weights).reduce((total, weight) => total + weight, 0);
  return Math.round(clamp(weighted / totalWeight));
}

export function isBusinessOpenNow(hours: Array<{ dayOfWeek: number; opensAt: string | null; closesAt: string | null; isClosed: boolean; isTwentyFourHours: boolean }>, date = new Date()) {
  const day = date.getDay();
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  return hours.some(hour => {
    if (hour.dayOfWeek !== day || hour.isClosed) return false;
    if (hour.isTwentyFourHours) return true;
    if (!hour.opensAt || !hour.closesAt) return false;
    const [openHour, openMinute] = hour.opensAt.split(":").map(Number);
    const [closeHour, closeMinute] = hour.closesAt.split(":").map(Number);
    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;
    return closeMinutes >= openMinutes
      ? currentMinutes >= openMinutes && currentMinutes <= closeMinutes
      : currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
  });
}
