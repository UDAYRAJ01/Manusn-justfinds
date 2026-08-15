import type { ImportRow } from "./importValidation";

export const REQUIRED_BULK_IMPORT_HEADERS = [
  "Business Name",
  "Main Category",
  "Subcategory",
  "Description (About)",
  "Address",
  "City",
  "Locality",
  "State",
  "Country",
  "Latitude",
  "Longitude",
  "Phone",
  "Email",
  "Website",
  "Hours",
  "Rating",
  "Total Reviews",
  "FAQs",
] as const;

export type NormalizedBulkListing = {
  businessName: string;
  mainCategory: string;
  subcategory: string;
  businessType: string;
  description: string;
  address: string;
  city: string;
  locality: string;
  state: string;
  country: string;
  latitude: string;
  longitude: string;
  phone: string;
  email: string;
  website: string;
  hours: string;
  rating: string;
  totalReviews: string;
  faqs: string;
};

export type ImportedHours = Array<{
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  intervals: Array<{ opensAt: string; closesAt: string }>;
  isClosed: boolean;
  isTwentyFourHours: boolean;
}>;

export type ImportedFaq = { question: string; answer: string };

const DAY_INDEX: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

const HEADER_ALIASES: Record<keyof NormalizedBulkListing, string[]> = {
  businessName: ["business name", "name"],
  mainCategory: ["main category", "category"],
  subcategory: ["subcategory", "sub category"],
  businessType: ["business type", "type"],
  description: ["description about", "description", "about", "about business"],
  address: ["address", "business address"],
  city: ["city"],
  locality: ["locality", "area", "neighbourhood", "neighborhood"],
  state: ["state"],
  country: ["country"],
  latitude: ["latitude", "lat"],
  longitude: ["longitude", "lng", "lon", "long"],
  phone: ["phone", "phone number", "mobile", "mobile number"],
  email: ["email", "email address"],
  website: ["website", "website url", "url"],
  hours: ["hours", "opening hours", "business hours"],
  rating: ["rating", "average rating"],
  totalReviews: ["total reviews", "review count", "reviews"],
  faqs: ["faqs", "faq"],
};

function headerKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function stringValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

export function normalizeBulkListingRow(row: ImportRow): NormalizedBulkListing {
  const keyed = new Map(Object.entries(row).map(([key, value]) => [headerKey(key), stringValue(value)]));
  const find = (aliases: string[]) => aliases.map(headerKey).map(alias => keyed.get(alias)).find(value => value !== undefined) ?? "";
  return Object.fromEntries(Object.entries(HEADER_ALIASES).map(([field, aliases]) => [field, find(aliases)])) as NormalizedBulkListing;
}

export function missingRequiredBulkHeaders(headers: string[]) {
  const received = new Set(headers.map(headerKey));
  return REQUIRED_BULK_IMPORT_HEADERS.filter(header => {
    const aliases = Object.values(HEADER_ALIASES).find(values => values.includes(headerKey(header))) ?? [headerKey(header)];
    return !aliases.map(headerKey).some(alias => received.has(alias));
  });
}

function to24Hour(value: string) {
  const match = value.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  const period = match[3];
  if (minute > 59 || hour > 23 || hour < 0) return null;
  if (period) {
    if (hour < 1 || hour > 12) return null;
    if (period === "pm" && hour !== 12) hour += 12;
    if (period === "am" && hour === 12) hour = 0;
  }
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function rangeDays(value: string) {
  const tokens = value.toLowerCase().replace(/\./g, "").split("-").map(token => token.trim()).filter(Boolean);
  const start = DAY_INDEX[tokens[0]];
  const end = DAY_INDEX[tokens[tokens.length - 1]];
  if (start === undefined || end === undefined) return [];
  const values: number[] = [];
  let current = start;
  do { values.push(current); current = (current + 1) % 7; } while (current !== (end + 1) % 7 && values.length < 7);
  return values;
}

function emptyHoursDay(dayOfWeek: number) {
  return { dayOfWeek, opensAt: null, closesAt: null, intervals: [], isClosed: true, isTwentyFourHours: false };
}

export function parseImportedHours(raw: string): { days: ImportedHours | null; warning: string | null } {
  const value = raw.trim();
  if (!value) return { days: null, warning: null };
  if (/^(24\s*hours|24\/7|open\s*24\s*hours)$/i.test(value)) {
    return { days: Array.from({ length: 7 }, (_, dayOfWeek) => ({ ...emptyHoursDay(dayOfWeek), isClosed: false, isTwentyFourHours: true })), warning: null };
  }
  const days: ImportedHours = Array.from({ length: 7 }, (_, dayOfWeek) => emptyHoursDay(dayOfWeek));
  const clauses = value.split(/[;\n]+/).map(part => part.trim()).filter(Boolean);
  if (!clauses.length) return { days: null, warning: "Hours could not be read. Use values such as ‘Mon-Fri 09:00-18:00; Sat 10:00-14:00; Sun Closed’." };
  for (const clause of clauses) {
    const match = clause.match(/^([a-zA-Z.]+(?:\s*-\s*[a-zA-Z.]+)?)\s*(.*)$/);
    if (!match) return { days: null, warning: "Hours could not be read. Use values such as ‘Mon-Fri 09:00-18:00; Sat 10:00-14:00; Sun Closed’." };
    const targetDays = rangeDays(match[1]);
    const schedule = match[2].trim();
    if (!targetDays.length || !schedule) return { days: null, warning: "Hours could not be read. Use values such as ‘Mon-Fri 09:00-18:00; Sat 10:00-14:00; Sun Closed’." };
    if (/^(closed|close)$/i.test(schedule)) continue;
    if (/^(24\s*hours|24\/7|open\s*24\s*hours)$/i.test(schedule)) {
      for (const dayOfWeek of targetDays) days[dayOfWeek] = { ...emptyHoursDay(dayOfWeek), isClosed: false, isTwentyFourHours: true };
      continue;
    }
    const timeMatch = schedule.match(/^(.+?)\s*-\s*(.+)$/);
    const opensAt = timeMatch ? to24Hour(timeMatch[1]) : null;
    const closesAt = timeMatch ? to24Hour(timeMatch[2]) : null;
    if (!opensAt || !closesAt || opensAt >= closesAt) return { days: null, warning: "Hours could not be read. Use 24-hour or AM/PM times such as ‘Mon-Fri 09:00-18:00’." };
    for (const dayOfWeek of targetDays) days[dayOfWeek] = { dayOfWeek, opensAt, closesAt, intervals: [{ opensAt, closesAt }], isClosed: false, isTwentyFourHours: false };
  }
  return { days, warning: null };
}

export function parseImportedFaqs(raw: string): { faqs: ImportedFaq[]; warning: string | null } {
  const value = raw.trim();
  if (!value) return { faqs: [], warning: null };
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) throw new Error("not an array");
    const faqs = parsed
      .map(item => ({ question: stringValue((item as Record<string, unknown>)?.question), answer: stringValue((item as Record<string, unknown>)?.answer) }))
      .filter(item => item.question && item.answer)
      .slice(0, 20);
    if (!faqs.length) throw new Error("no valid FAQs");
    return { faqs, warning: null };
  } catch {
    return { faqs: [], warning: "FAQs were not imported. Use a JSON array such as [{\"question\":\"Do you take appointments?\",\"answer\":\"Yes.\"}]." };
  }
}
