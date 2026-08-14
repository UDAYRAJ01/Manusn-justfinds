import { TRPCError } from "@trpc/server";

const BASE_URL = "https://places.googleapis.com/v1";
const AUTOCOMPLETE_MASK = ["suggestions.placePrediction.placeId", "suggestions.placePrediction.text.text", "suggestions.placePrediction.structuredFormat.mainText.text", "suggestions.placePrediction.structuredFormat.secondaryText.text", "suggestions.placePrediction.types"].join(",");
const DETAILS_MASK = ["id", "displayName", "formattedAddress", "addressComponents", "primaryType", "types", "nationalPhoneNumber", "internationalPhoneNumber", "websiteUri", "editorialSummary", "regularOpeningHours.weekdayDescriptions", "regularOpeningHours.periods", "location", "timeZone", "utcOffsetMinutes"].join(",");

export type OfficialPlaceDetail = {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  addressComponents: unknown;
  primaryType: string | null;
  types: string[];
  phone: string | null;
  website: string | null;
  aboutDescription: string | null;
  weekdayDescriptions: string[];
  openingPeriods: unknown;
  latitude: string | null;
  longitude: string | null;
  timeZone: string | null;
  utcOffsetMinutes: number | null;
};

function apiKey() {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Business discovery is temporarily unavailable. Please try again later." });
  return key;
}

async function request(path: string, init: RequestInit, fieldMask: string) {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...init, headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey(), "X-Goog-FieldMask": fieldMask, ...(init.headers ?? {}) } });
  } catch {
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Business discovery could not be reached. Please try again." });
  }
  if (!response.ok) {
    if (response.status === 429) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Business discovery is busy. Please wait a moment and try again." });
    if (response.status === 401 || response.status === 403) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Business discovery is not available right now." });
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Business discovery could not complete. Please try again." });
  }
  return response.json() as Promise<Record<string, unknown>>;
}

export async function autocompleteOfficialPlaces(input: { query: string; locationText?: string; sessionToken?: string }) {
  const text = [input.query.trim(), input.locationText?.trim()].filter(Boolean).join(" ");
  const payload = await request("/places:autocomplete", { method: "POST", body: JSON.stringify({ input: text, sessionToken: input.sessionToken || undefined, includedRegionCodes: ["IN"] }) }, AUTOCOMPLETE_MASK);
  const suggestions = Array.isArray(payload.suggestions) ? payload.suggestions : [];
  return suggestions.flatMap((item) => {
    const prediction = (item as { placePrediction?: Record<string, unknown> }).placePrediction;
    const placeId = typeof prediction?.placeId === "string" ? prediction.placeId : "";
    const text = (prediction?.text as { text?: unknown } | undefined)?.text;
    if (!placeId || typeof text !== "string") return [];
    const format = prediction?.structuredFormat as { mainText?: { text?: unknown }; secondaryText?: { text?: unknown } } | undefined;
    return [{ placeId, text, primaryText: typeof format?.mainText?.text === "string" ? format.mainText.text : text, secondaryText: typeof format?.secondaryText?.text === "string" ? format.secondaryText.text : "", types: Array.isArray(prediction?.types) ? prediction.types.filter((value): value is string => typeof value === "string") : [] }];
  });
}

export async function getOfficialPlaceDetail(placeId: string, sessionToken?: string): Promise<OfficialPlaceDetail> {
  const place = await request(`/places/${encodeURIComponent(placeId)}${sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : ""}`, { method: "GET" }, DETAILS_MASK);
  const displayName = (place.displayName as { text?: unknown } | undefined)?.text;
  if (typeof place.id !== "string" || typeof displayName !== "string" || typeof place.formattedAddress !== "string") throw new TRPCError({ code: "NOT_FOUND", message: "That business place is no longer available. Please choose another result." });
  const location = place.location as { latitude?: unknown; longitude?: unknown } | undefined;
  const hours = place.regularOpeningHours as { weekdayDescriptions?: unknown; periods?: unknown } | undefined;
  const editorialSummary = (place.editorialSummary as { text?: unknown } | undefined)?.text;
  return {
    placeId: place.id, displayName, formattedAddress: place.formattedAddress, addressComponents: place.addressComponents ?? [], primaryType: typeof place.primaryType === "string" ? place.primaryType : null,
    types: Array.isArray(place.types) ? place.types.filter((value): value is string => typeof value === "string") : [],
    phone: typeof place.nationalPhoneNumber === "string" ? place.nationalPhoneNumber : (typeof place.internationalPhoneNumber === "string" ? place.internationalPhoneNumber : null),
    website: typeof place.websiteUri === "string" ? place.websiteUri : null,
    aboutDescription: typeof editorialSummary === "string" && editorialSummary.trim() ? editorialSummary.trim() : null,
    weekdayDescriptions: Array.isArray(hours?.weekdayDescriptions) ? hours.weekdayDescriptions.filter((value): value is string => typeof value === "string") : [],
    openingPeriods: hours?.periods ?? [], latitude: typeof location?.latitude === "number" ? String(location.latitude) : null, longitude: typeof location?.longitude === "number" ? String(location.longitude) : null,
    timeZone: typeof place.timeZone === "string" ? place.timeZone : null, utcOffsetMinutes: typeof place.utcOffsetMinutes === "number" ? place.utcOffsetMinutes : null,
  };
}
