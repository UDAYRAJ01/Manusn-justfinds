export type ImportRow = Record<string, unknown>;

export const IMPORT_QUEUE_STATUSES = ["Pending", "Processing", "Completed", "Failed"] as const;
export type ImportQueueStatus = (typeof IMPORT_QUEUE_STATUSES)[number];
export function isImportQueueStatus(value: string): value is ImportQueueStatus { return (IMPORT_QUEUE_STATUSES as readonly string[]).includes(value); }

const phonePattern = /^[+\d][\d\s-]{6,30}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateBulkListingRow(row: ImportRow, knownCategories: string[], knownCities: string[]) {
  const errors: string[] = [];
  const businessName = String(row.businessName ?? row.name ?? "").trim();
  const category = String(row.category ?? "").trim();
  const city = String(row.city ?? "").trim();
  const address = String(row.address ?? "").trim();
  const phone = String(row.phone ?? "").trim();
  const email = String(row.email ?? "").trim();
  const website = String(row.website ?? "").trim();
  const latitude = row.latitude === undefined || row.latitude === null || row.latitude === "" ? undefined : Number(row.latitude);
  const longitude = row.longitude === undefined || row.longitude === null || row.longitude === "" ? undefined : Number(row.longitude);

  if (!businessName) errors.push("Business name is required.");
  if (!category || !knownCategories.some(value => value.toLowerCase() === category.toLowerCase())) errors.push("Category is invalid.");
  if (!city || !knownCities.some(value => value.toLowerCase() === city.toLowerCase())) errors.push("City is invalid.");
  if (address.length < 6) errors.push("Address is required and must be at least 6 characters.");
  if (phone && !phonePattern.test(phone)) errors.push("Phone number is invalid.");
  if (email && !emailPattern.test(email)) errors.push("Email address is invalid.");
  if (website) {
    try { const url = new URL(website); if (!/^https?:$/.test(url.protocol)) throw new Error("unsupported protocol"); }
    catch { errors.push("Website URL is invalid."); }
  }
  if (latitude !== undefined && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) errors.push("Latitude is invalid.");
  if (longitude !== undefined && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) errors.push("Longitude is invalid.");
  if ((latitude === undefined) !== (longitude === undefined)) errors.push("Latitude and longitude must be provided together.");

  return { valid: errors.length === 0, errors };
}
