import { and, asc, desc, eq, inArray, lt, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { approvalQueue, businesses, businessAiContent, businessFieldValues, businessHours, businessNotifications, businessReviewReports, businessReviews, businessServices, businessTypes, bulkImportRows, bulkImports, bulkImportSourceChunks, categories, categoryFields, cities, googlePlaceCategoryMappings, localities, subcategories, users } from "../../drizzle/schema";
import { deleteInternalValidationBusiness, getAdminCounts, getCategorySchemas, getDb, getInternalValidationBusinesses, getOwnerBusinesses, getPendingBusinesses } from "../db";
import { canManageAdmins, canManageBusiness, canModerate } from "../domain/permissions";
import { buildVoiceIntroductionScript } from "../domain/voiceScript";
import { storageGetSignedUrl, storagePut } from "../storage";
import { numberedSlug, preferredBusinessSlug } from "../domain/slug";
import { normalizeCategorySlug } from "../domain/categorySlug";
import { approvedIndiaCities, findApprovedIndiaCity } from "../domain/approvedIndiaCities";
import { importCityCandidates, importLookupKeys, normalizeBulkListingRow, parseImportedFaqs, parseImportedHours, parseImportedServices, type NormalizedBulkListing } from "../domain/bulkListingImport";
import { validateBulkListingRow, type ImportRow } from "../domain/importValidation";
import { normalizeDuplicateText, scoreDuplicateCandidate } from "../domain/duplicateCheck";
import { HIGH_VOLUME_FILE_LIMIT, HIGH_VOLUME_IMPORT_CHUNK, HIGH_VOLUME_ROW_LIMIT, HIGH_VOLUME_VALIDATION_CHUNK, highVolumeProgress, isSupportedImportFilename, sourceQueueIssue } from "../domain/highVolumeImportPolicy";
import { highVolumeFormatIssue, highVolumeUploadPartBytes, highVolumeUploadPartCount } from "../domain/highVolumeUploadPolicy";
import { HIGH_VOLUME_IMPORT_CALLBACK_PATH, HIGH_VOLUME_IMPORT_CRON } from "../domain/highVolumeImportSchedule";
import { heartbeatSessionFromHeaders } from "../domain/heartbeatSession";
import { mapWithConcurrency } from "../domain/asyncPool";
import { withRequestDeadline } from "../domain/requestDeadline";
import { parseServerCsvChunk, type ServerCsvParserState } from "../domain/streamCsv";
import { protectedProcedure, router } from "../_core/trpc";
import { createHeartbeatJob, updateHeartbeatJob } from "../_core/heartbeat";
import { COOKIE_NAME } from "@shared/const";
import * as XLSX from "xlsx";

type JustFindsRole = "user" | "business_owner" | "admin" | "super_admin";
const HIGH_VOLUME_STORAGE_READ_CONCURRENCY = 3;
const HIGH_VOLUME_STORAGE_READ_ATTEMPTS = 3;
const HIGH_VOLUME_STORAGE_READ_TIMEOUT_MS = 15_000;

function delay(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function readConfirmedSourcePart(storageKey: string, expectedBytes: number) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= HIGH_VOLUME_STORAGE_READ_ATTEMPTS; attempt += 1) {
    try {
      return await withRequestDeadline(HIGH_VOLUME_STORAGE_READ_TIMEOUT_MS, async signal => {
        const response = await fetch(await storageGetSignedUrl(storageKey, signal), { signal });
        if (!response.ok) throw new Error(`Secure storage returned ${response.status}.`);
        const bytes = Buffer.from(await response.arrayBuffer());
        if (bytes.length !== expectedBytes) throw new Error("The downloaded source chunk size does not match its verified upload.");
        return bytes;
      }, "Secure storage did not respond within 15 seconds.");
    } catch (error) {
      lastError = error;
      if (attempt < HIGH_VOLUME_STORAGE_READ_ATTEMPTS) await delay(attempt * 500);
    }
  }
  const reason = lastError instanceof Error ? lastError.message : "unknown network error";
  throw new Error(`A verified spreadsheet chunk could not be read from secure storage after ${HIGH_VOLUME_STORAGE_READ_ATTEMPTS} attempts (${reason}).`);
}

function requireModerator(role: JustFindsRole) {
  if (!canModerate(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
}

function requireSuperAdmin(role: JustFindsRole) {
  if (!canManageAdmins(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Super-administrator access is required." });
}

async function enableHighVolumeImportSchedule(importId: number, taskUid: string | null, userSession: string) {
  if (taskUid) {
    await updateHeartbeatJob(taskUid, { enable: true }, userSession);
    return taskUid;
  }
  const created = await createHeartbeatJob({
    name: `just-finds-import-${importId}`,
    cron: HIGH_VOLUME_IMPORT_CRON,
    path: HIGH_VOLUME_IMPORT_CALLBACK_PATH,
    method: "POST",
    description: `Process durable high-volume import ${importId} in safe chunks.`,
  }, userSession);
  return created.taskUid;
}

async function approvedCityOrThrow(db: Awaited<ReturnType<typeof getDb>> & {}, cityId: number) {
  const rows = await db.select({ id: cities.id }).from(cities).where(and(eq(cities.id, cityId), eq(cities.isActive, true), eq(cities.country, "IN"), or(eq(cities.tier, "tier1"), eq(cities.tier, "tier2")))).limit(1);
  if (!rows[0]) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a supported India Tier-1 or Tier-2 city." });
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

const spreadsheetCell = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const spreadsheetRowsInput = z.array(z.record(z.string(), spreadsheetCell)).min(1).max(500);

type TaxonomyLookup = {
  categoriesByName: Map<string, { id: number; name: string }>;
  subcategoriesByCategoryAndName: Map<string, { id: number; name: string }>;
  businessTypesBySubcategoryAndName: Map<string, { id: number; name: string }>;
  businessTypesByAlias: Map<string, Array<{ id: number; name: string; subcategory: { id: number; name: string; categoryId: number }; category: { id: number; name: string } }>>;
  citiesByName: Map<string, { id: number; name: string; state: string | null }>;
  localitiesByCityAndName: Map<string, { id: number; name: string }>;
  candidatesByCity: Map<number, Array<{ id: number; name: string; phone: string | null; email: string | null; address: string; cityId: number; latitude: string | null; longitude: string | null }>>;
};

function lookupName(value: string) { return normalizeDuplicateText(value); }
function subcategoryKey(categoryId: number, name: string) { return `${categoryId}:${lookupName(name)}`; }
function businessTypeKey(subcategoryId: number, name: string) { return `${subcategoryId}:${lookupName(name)}`; }
function localityKey(cityId: number, name: string) { return `${cityId}:${lookupName(name)}`; }
function firstLookup<T>(map: Map<string, T>, value: string) { return importLookupKeys(value).map(lookupName).map(key => map.get(key)).find((match): match is T => Boolean(match)); }

async function importTaxonomyLookup(db: Awaited<ReturnType<typeof getDb>> & {}, rows: ImportRow[], includeDuplicateCandidates = true): Promise<TaxonomyLookup> {
  const normalized = rows.map(normalizeBulkListingRow);
  const cityNames = Array.from(new Set(normalized.flatMap(row => importCityCandidates(row.city).flatMap(candidate => [candidate, findApprovedIndiaCity(candidate)?.name].filter((value): value is string => Boolean(value))))));
  const [activeCategories, activeSubcategories, activeBusinessTypes, supportedCities] = await Promise.all([
    db.select({ id: categories.id, name: categories.name }).from(categories).where(and(eq(categories.isActive, true), eq(categories.status, "active"))),
    db.select({ id: subcategories.id, categoryId: subcategories.categoryId, name: subcategories.name }).from(subcategories).where(and(eq(subcategories.isActive, true), eq(subcategories.status, "active"))),
    db.select({ id: businessTypes.id, subcategoryId: businessTypes.subcategoryId, name: businessTypes.name }).from(businessTypes).where(and(eq(businessTypes.isActive, true), eq(businessTypes.status, "active"))),
    cityNames.length ? db.select({ id: cities.id, name: cities.name, state: cities.state }).from(cities).where(and(inArray(cities.name, cityNames), eq(cities.isActive, true), eq(cities.country, "IN"))) : Promise.resolve([]),
  ]);
  const cityIds = supportedCities.map(city => city.id);
  const [supportedLocalities, candidates] = await Promise.all([
    cityIds.length ? db.select({ id: localities.id, cityId: localities.cityId, name: localities.name }).from(localities).where(inArray(localities.cityId, cityIds)) : Promise.resolve([]),
    includeDuplicateCandidates && cityIds.length ? db.select({ id: businesses.id, name: businesses.name, phone: businesses.phone, email: businesses.email, address: businesses.address, cityId: businesses.cityId, latitude: businesses.latitude, longitude: businesses.longitude }).from(businesses).where(inArray(businesses.cityId, cityIds)) : Promise.resolve([]),
  ]);
  const categoriesById = new Map(activeCategories.map(category => [category.id, category]));
  const subcategoriesById = new Map(activeSubcategories.map(subcategory => [subcategory.id, subcategory]));
  const categoriesByName = new Map<string, { id: number; name: string }>();
  for (const category of activeCategories) for (const key of importLookupKeys(category.name)) categoriesByName.set(lookupName(key), category);
  const subcategoriesByCategoryAndName = new Map<string, { id: number; name: string }>();
  for (const subcategory of activeSubcategories) for (const key of importLookupKeys(subcategory.name)) subcategoriesByCategoryAndName.set(`${subcategory.categoryId}:${lookupName(key)}`, subcategory);
  const businessTypesBySubcategoryAndName = new Map<string, { id: number; name: string }>();
  const businessTypesByAlias = new Map<string, Array<{ id: number; name: string; subcategory: { id: number; name: string; categoryId: number }; category: { id: number; name: string } }>>();
  for (const type of activeBusinessTypes) {
    const subcategory = subcategoriesById.get(type.subcategoryId);
    const category = subcategory ? categoriesById.get(subcategory.categoryId) : undefined;
    if (!subcategory || !category) continue;
    for (const key of importLookupKeys(type.name)) {
      businessTypesBySubcategoryAndName.set(`${subcategory.id}:${lookupName(key)}`, type);
      const alias = lookupName(key);
      businessTypesByAlias.set(alias, [...(businessTypesByAlias.get(alias) ?? []), { ...type, subcategory, category }]);
    }
  }
  return {
    categoriesByName,
    subcategoriesByCategoryAndName,
    businessTypesBySubcategoryAndName,
    businessTypesByAlias,
    citiesByName: new Map(supportedCities.flatMap(city => {
      const approved = findApprovedIndiaCity(city.name);
      return [[lookupName(city.name), city], ...(approved?.aliases ?? []).map(alias => [lookupName(alias), city] as [string, typeof city])];
    })),
    localitiesByCityAndName: new Map(supportedLocalities.map(locality => [localityKey(locality.cityId, locality.name), locality])),
    candidatesByCity: new Map(cityIds.map(cityId => [cityId, candidates.filter(candidate => candidate.cityId === cityId)])),
  };
}

function validateImportListing(raw: ImportRow, rowNumber: number, lookup: TaxonomyLookup, seenRows: Map<string, number>) {
  const listing = normalizeBulkListingRow(raw);
  const errors: string[] = [];
  const warnings: string[] = [];
  let category = firstLookup(lookup.categoriesByName, listing.mainCategory);
  let city = importCityCandidates(listing.city).map(candidate => {
    const knownCity = findApprovedIndiaCity(candidate);
    return lookup.citiesByName.get(lookupName(knownCity?.name ?? candidate));
  }).find((match): match is { id: number; name: string; state: string | null } => Boolean(match));
  if (city && lookupName(city.name) !== lookupName(listing.city)) warnings.push(`City matched to supported city “${city.name}” from the source location value.`);
  const basic = validateBulkListingRow({ businessName: listing.businessName, category: category?.name ?? listing.mainCategory, city: city?.name ?? listing.city, address: listing.address, phone: listing.phone, email: listing.email, website: listing.website, latitude: listing.latitude || undefined, longitude: listing.longitude || undefined }, Array.from(lookup.categoriesByName.values()).map(value => value.name), Array.from(lookup.citiesByName.values()).map(value => value.name));
  errors.push(...basic.errors);
  if (listing.country && !/^(india|in)$/i.test(listing.country)) errors.push("Only India listings can be imported.");
  if (city && listing.state && lookupName(listing.state) !== lookupName(city.state ?? "")) errors.push(`State does not match the supported city (${city.state ?? city.name}).`);
  let subcategory = category && listing.subcategory ? firstLookup(new Map(Array.from(lookup.subcategoriesByCategoryAndName.entries()).filter(([key]) => key.startsWith(`${category?.id}:`)).map(([key, value]) => [key.slice(String(category?.id).length + 1), value])), listing.subcategory) : undefined;
  let businessType = subcategory && listing.businessType ? firstLookup(new Map(Array.from(lookup.businessTypesBySubcategoryAndName.entries()).filter(([key]) => key.startsWith(`${subcategory?.id}:`)).map(([key, value]) => [key.slice(String(subcategory?.id).length + 1), value])), listing.businessType) : undefined;
  if (!category || (listing.subcategory && !subcategory)) {
    const labels = [listing.businessType, listing.subcategory].flatMap(importLookupKeys).map(lookupName);
    const matches = Array.from(new Map(labels.flatMap(label => lookup.businessTypesByAlias.get(label) ?? []).map(match => [`${match.category.id}:${match.subcategory.id}:${match.id}`, match] as const)).values());
    if (matches.length === 1) {
      const match = matches[0]!;
      category = match.category;
      subcategory = match.subcategory;
      businessType = match;
      warnings.push(`Source taxonomy matched the single supported path “${match.category.name} → ${match.subcategory.name} → ${match.name}”.`);
    }
  }
  if (listing.subcategory && !subcategory) errors.push("Subcategory is invalid for the selected main category.");
  if (listing.businessType && !businessType) errors.push("Business Type is invalid for the selected subcategory.");
  const locality = city && listing.locality ? lookup.localitiesByCityAndName.get(localityKey(city.id, listing.locality)) : undefined;
  if (listing.locality && !locality) warnings.push("Locality was not matched in the supported city and will remain unset until an administrator selects it.");
  if (!listing.latitude && !listing.longitude) warnings.push("No coordinates supplied. The listing can be reviewed, but nearby-distance matching will remain unavailable until coordinates are verified.");
  const hours = parseImportedHours(listing.hours);
  if (hours.warning) warnings.push(hours.warning);
  const faq = parseImportedFaqs(listing.faqs);
  if (faq.warning) warnings.push(faq.warning);
  const services = parseImportedServices(listing.services);
  if (services.warning) warnings.push(services.warning);
  if (listing.rating || listing.totalReviews) warnings.push("Rating and Total Reviews are retained only in the private import audit; they are not published or converted into customer reviews.");
  const fileDuplicateKey = importRowFingerprint(listing, city?.id);
  const earlierRow = seenRows.get(fileDuplicateKey);
  if (earlierRow) errors.push(`Duplicate of spreadsheet row ${earlierRow}.`); else seenRows.set(fileDuplicateKey, rowNumber);
  const candidates = city ? lookup.candidatesByCity.get(city.id) ?? [] : [];
  const duplicate = city ? candidates
    .map(candidate => ({ candidate, match: scoreDuplicateCandidate({ name: listing.businessName, phone: listing.phone || null, email: listing.email || null, address: listing.address, cityId: city.id, latitude: listing.latitude || null, longitude: listing.longitude || null }, candidate) }))
    .filter((entry): entry is { candidate: typeof candidates[number]; match: NonNullable<ReturnType<typeof scoreDuplicateCandidate>> } => Boolean(entry.match))
    .sort((left, right) => right.match.score - left.match.score)[0] : undefined;
  if (duplicate?.match.classification === "likely") errors.push(`Likely duplicate of existing listing “${duplicate.candidate.name}” (${duplicate.match.reasons.join(", ")}).`);
  else if (duplicate) warnings.push(`Possible duplicate of existing listing “${duplicate.candidate.name}”; it will require administrator review.`);
  return { rowNumber, raw, listing, category, subcategory: subcategory ?? null, businessType: businessType ?? null, city: city ?? null, locality: locality ?? null, hours: hours.days, faqs: faq.faqs, services: services.services, errors, warnings, duplicateCandidateId: duplicate?.candidate.id ?? null, valid: errors.length === 0 };
}

function importRowFingerprint(listing: NormalizedBulkListing, cityId: number | null | undefined) {
  return `${lookupName(listing.businessName)}:${cityId ?? "unknown"}:${lookupName(listing.phone || listing.email || listing.address)}`.slice(0, 260);
}

function nextImportSlug(name: string, usedSlugs: Set<string>) {
  const base = preferredBusinessSlug(name);
  for (let suffix = 1; suffix <= 500; suffix += 1) {
    const candidate = suffix === 1 ? base : numberedSlug(base, suffix);
    if (!usedSlugs.has(candidate)) { usedSlugs.add(candidate); return candidate; }
  }
  throw new TRPCError({ code: "CONFLICT", message: `Could not create a unique listing URL for ${name}.` });
}

function spreadsheetRowsFromBuffer(buffer: Buffer): ImportRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) throw new Error("The spreadsheet does not contain a readable sheet.");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheet], { defval: "", raw: false });
  if (!rows.length) throw new Error("No business rows were found below the header row.");
  if (rows.length > HIGH_VOLUME_ROW_LIMIT) throw new Error(`This import contains ${rows.length.toLocaleString()} rows. The maximum is ${HIGH_VOLUME_ROW_LIMIT.toLocaleString()}.`);
  return rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value === undefined ? null : typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null ? value : String(value)])) as ImportRow);
}

function importPayload(row: ReturnType<typeof validateImportListing>) {
  return { raw: row.raw, normalized: row.listing, warnings: row.warnings, hours: row.hours, faqs: row.faqs, services: row.services, categoryId: row.category?.id ?? null, subcategoryId: row.subcategory?.id ?? null, businessTypeId: row.businessType?.id ?? null, cityId: row.city?.id ?? null, localityId: row.locality?.id ?? null };
}

async function validateHighVolumeChunk(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, job: typeof bulkImports.$inferSelect) {
  const stagingIssue = sourceQueueIssue(job.sourceUploadedAt);
  if (stagingIssue) throw new Error(stagingIssue);
  const parts = await db.select().from(bulkImportSourceChunks).where(eq(bulkImportSourceChunks.importId, job.id)).orderBy(asc(bulkImportSourceChunks.partNumber));
  let sourceBuffer: Buffer;
  if (parts.length) {
    const totalParts = highVolumeUploadPartCount(job.sourceFileSize);
    if (!totalParts || parts.length !== totalParts || parts.some(part => part.byteSize !== highVolumeUploadPartBytes(job.sourceFileSize, part.partNumber))) throw new Error("The staged spreadsheet is incomplete. Upload the file again to create a new import.");
    const buffers = await mapWithConcurrency(parts, HIGH_VOLUME_STORAGE_READ_CONCURRENCY, part => readConfirmedSourcePart(part.storageKey, part.byteSize));
    sourceBuffer = Buffer.concat(buffers);
    if (sourceBuffer.length !== job.sourceFileSize) throw new Error("The staged spreadsheet size could not be verified. Upload the file again to create a new import.");
  } else {
    if (!job.sourceFileKey) throw new Error("The staged source file is missing.");
    const response = await fetch(await storageGetSignedUrl(job.sourceFileKey));
    if (!response.ok) throw new Error("The staged spreadsheet could not be read from secure storage.");
    sourceBuffer = Buffer.from(await response.arrayBuffer());
  }
  const sourceRows = spreadsheetRowsFromBuffer(sourceBuffer);
  const totalRows = sourceRows.length;
  const offset = Math.min(job.validationCursor, totalRows);
  const slice = sourceRows.slice(offset, offset + HIGH_VOLUME_VALIDATION_CHUNK);
  if (!slice.length) {
    await db.update(bulkImports).set({ status: "pending", phase: "ready", totalRows, progressPercent: 100, finishedAt: new Date(), errorMessage: null, errorCategory: null }).where(eq(bulkImports.id, job.id));
    return { importId: job.id, phase: "ready", processed: 0, totalRows };
  }
  const lookup = await importTaxonomyLookup(db, slice);
  const priorRows = offset
    ? await db.select({ rowNumber: bulkImportRows.rowNumber, fingerprint: bulkImportRows.fingerprint }).from(bulkImportRows).where(and(eq(bulkImportRows.importId, job.id), lt(bulkImportRows.rowNumber, offset + 2)))
    : [];
  const seenRows = new Map(priorRows.flatMap(row => row.fingerprint ? [[row.fingerprint, row.rowNumber] as [string, number]] : []));
  const prepared = slice.map((raw, index) => validateImportListing(raw, offset + index + 2, lookup, seenRows));
  const rowsToInsert = prepared.map(row => ({
    importId: job.id,
    rowNumber: row.rowNumber,
    fingerprint: row.errors.some(error => error.startsWith("Duplicate of spreadsheet row")) ? null : importRowFingerprint(row.listing, row.city?.id),
    data: importPayload(row),
    validationErrors: row.errors.length ? row.errors : null,
    duplicateCandidateId: row.duplicateCandidateId,
    status: row.valid ? "valid" as const : row.duplicateCandidateId && row.errors.some(error => error.startsWith("Likely duplicate")) ? "duplicate" as const : "invalid" as const,
  }));
  if (rowsToInsert.length) await db.insert(bulkImportRows).values(rowsToInsert);
  const validAdded = prepared.filter(row => row.valid).length;
  const invalidAdded = prepared.length - validAdded;
  const nextCursor = offset + prepared.length;
  const ready = nextCursor >= totalRows;
  await db.update(bulkImports).set({
    status: ready ? "pending" : "queued",
    phase: ready ? "ready" : "validating",
    totalRows,
    validationCursor: nextCursor,
    validRows: job.validRows + validAdded,
    failedRows: job.failedRows + invalidAdded,
    progressPercent: highVolumeProgress("validating", nextCursor, totalRows),
    finishedAt: ready ? new Date() : null,
    errorMessage: null,
    errorCategory: null,
  }).where(eq(bulkImports.id, job.id));
  return { importId: job.id, phase: ready ? "ready" : "validating", processed: prepared.length, totalRows };
}

async function persistValidatedImportRows(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, job: typeof bulkImports.$inferSelect, sourceRows: ImportRow[], offset: number) {
  if (!sourceRows.length) return { validAdded: 0, invalidAdded: 0 };
  if (offset + sourceRows.length > HIGH_VOLUME_ROW_LIMIT) throw new Error(`This import exceeds the ${HIGH_VOLUME_ROW_LIMIT.toLocaleString()} row limit.`);
  const lookup = await importTaxonomyLookup(db, sourceRows);
  const priorRows = offset ? await db.select({ rowNumber: bulkImportRows.rowNumber, fingerprint: bulkImportRows.fingerprint }).from(bulkImportRows).where(and(eq(bulkImportRows.importId, job.id), lt(bulkImportRows.rowNumber, offset + 2))) : [];
  const seenRows = new Map(priorRows.flatMap(row => row.fingerprint ? [[row.fingerprint, row.rowNumber] as [string, number]] : []));
  const prepared = sourceRows.map((raw, index) => validateImportListing(raw, offset + index + 2, lookup, seenRows));
  for (let index = 0; index < prepared.length; index += 500) {
    const batch = prepared.slice(index, index + 500).map(row => ({
      importId: job.id,
      rowNumber: row.rowNumber,
      fingerprint: row.errors.some(error => error.startsWith("Duplicate of spreadsheet row")) ? null : importRowFingerprint(row.listing, row.city?.id),
      data: importPayload(row),
      validationErrors: row.errors.length ? row.errors : null,
      duplicateCandidateId: row.duplicateCandidateId,
      status: row.valid ? "valid" as const : row.duplicateCandidateId && row.errors.some(error => error.startsWith("Likely duplicate")) ? "duplicate" as const : "invalid" as const,
    }));
    await db.insert(bulkImportRows).values(batch);
  }
  const validAdded = prepared.filter(row => row.valid).length;
  return { validAdded, invalidAdded: prepared.length - validAdded };
}

async function validateHighVolumeCsvPart(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, job: typeof bulkImports.$inferSelect) {
  const stagingIssue = sourceQueueIssue(job.sourceUploadedAt);
  if (stagingIssue) throw new Error(stagingIssue);
  const parts = await db.select().from(bulkImportSourceChunks).where(eq(bulkImportSourceChunks.importId, job.id)).orderBy(asc(bulkImportSourceChunks.partNumber));
  const totalParts = highVolumeUploadPartCount(job.sourceFileSize);
  if (!totalParts || parts.length !== totalParts) throw new Error("The staged CSV is incomplete. Upload the file again to create a new import.");
  const part = parts[job.sourcePartCursor];
  if (!part) throw new Error("The CSV parser cursor is outside the confirmed source file.");
  const bytes = await readConfirmedSourcePart(part.storageKey, part.byteSize);
  const parsed = parseServerCsvChunk(job.csvParserState as ServerCsvParserState | null, bytes, job.sourcePartCursor === totalParts - 1);
  const persisted = await persistValidatedImportRows(db, job, parsed.rows, job.validationCursor);
  const nextCursor = job.validationCursor + parsed.rows.length;
  const complete = job.sourcePartCursor + 1 >= totalParts;
  await db.update(bulkImports).set({
    status: complete ? "pending" : "queued",
    phase: complete ? "ready" : "validating",
    sourcePartCursor: job.sourcePartCursor + 1,
    csvParserState: complete ? null : parsed.state,
    validationCursor: nextCursor,
    totalRows: complete ? nextCursor : 0,
    validRows: job.validRows + persisted.validAdded,
    failedRows: job.failedRows + persisted.invalidAdded,
    progressPercent: complete ? 100 : Math.min(44, Math.floor(((job.sourcePartCursor + 1) / totalParts) * 45)),
    finishedAt: complete ? new Date() : null,
    errorMessage: null,
    errorCategory: null,
  }).where(eq(bulkImports.id, job.id));
  return { importId: job.id, phase: complete ? "ready" : "validating", processed: parsed.rows.length, totalRows: complete ? nextCursor : null };
}

async function importHighVolumeChunk(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, job: typeof bulkImports.$inferSelect) {
  const readyRows = await db.select().from(bulkImportRows).where(and(eq(bulkImportRows.importId, job.id), eq(bulkImportRows.status, "valid"))).orderBy(asc(bulkImportRows.rowNumber)).limit(HIGH_VOLUME_IMPORT_CHUNK);
  if (!readyRows.length) {
    await db.update(bulkImports).set({ status: "completed", phase: "completed", progressPercent: 100, finishedAt: new Date(), errorMessage: null, errorCategory: null }).where(eq(bulkImports.id, job.id));
    return { importId: job.id, phase: "completed", processed: 0 };
  }
  const existingSlugs = new Set((await db.select({ slug: businesses.slug }).from(businesses)).map(row => row.slug));
  let created = 0;
  let failed = 0;
  for (const row of readyRows) {
    const payload = row.data as { normalized?: NormalizedBulkListing; categoryId?: number | null; subcategoryId?: number | null; businessTypeId?: number | null; cityId?: number | null; localityId?: number | null; hours?: ReturnType<typeof parseImportedHours>["days"]; faqs?: ReturnType<typeof parseImportedFaqs>["faqs"]; services?: ReturnType<typeof parseImportedServices>["services"] } | null;
    const listing = payload?.normalized;
    if (!listing || !payload?.categoryId || !payload.cityId) {
      failed += 1;
      await db.update(bulkImportRows).set({ status: "invalid", validationErrors: ["Import audit data is incomplete. Re-upload this row."] }).where(eq(bulkImportRows.id, row.id));
      continue;
    }
    try {
      const createdBusiness = await db.insert(businesses).values({ ownerId: job.initiatedById, categoryId: payload.categoryId, subcategoryId: payload.subcategoryId ?? null, businessTypeId: payload.businessTypeId ?? null, cityId: payload.cityId, localityId: payload.localityId ?? null, name: listing.businessName, slug: nextImportSlug(listing.businessName, existingSlugs), address: listing.address, shortDescription: listing.description || null, aboutDescription: listing.description || null, phone: listing.phone || null, email: listing.email || null, website: listing.website || null, latitude: listing.latitude || null, longitude: listing.longitude || null, status: "submitted", onboardingStep: 1 });
      const businessId = Number(createdBusiness[0].insertId);
      await Promise.all([
        payload.hours?.length === 7 ? db.insert(businessHours).values(payload.hours.map(day => ({ ...day, businessId }))) : Promise.resolve(),
        payload.faqs?.length ? db.insert(businessAiContent).values({ businessId, about: listing.description || null, faqs: payload.faqs, status: "pending" }) : Promise.resolve(),
        payload.services?.length ? db.insert(businessServices).values(payload.services.map((service, sortOrder) => ({ businessId, name: service.name, sortOrder }))) : Promise.resolve(),
        db.insert(approvalQueue).values({ entityType: "business", businessId, submittedById: job.initiatedById, status: "pending" }),
        db.update(bulkImportRows).set({ status: "imported", createdBusinessId: businessId }).where(eq(bulkImportRows.id, row.id)),
      ]);
      created += 1;
    } catch (error) {
      failed += 1;
      await db.update(bulkImportRows).set({ status: "invalid", validationErrors: [error instanceof Error ? error.message.slice(0, 500) : "The row could not be imported."] }).where(eq(bulkImportRows.id, row.id));
    }
  }
  const processedRows = job.processedRows + readyRows.length;
  await db.update(bulkImports).set({ status: "queued", phase: "importing", processedRows, validRows: Math.max(0, job.validRows - failed), failedRows: job.failedRows + failed, progressPercent: highVolumeProgress("importing", processedRows, Math.max(1, job.validRows + job.failedRows)), errorMessage: null, errorCategory: null }).where(eq(bulkImports.id, job.id));
  return { importId: job.id, phase: "importing", processed: readyRows.length, created, failed };
}

export async function processNextHighVolumeImportChunk(taskUid: string) {
  const db = await getDb();
  if (!db) throw new Error("The import database is unavailable.");
  const staleBefore = new Date(Date.now() - 3 * 60_000);
  const [job] = await db.select().from(bulkImports).where(and(eq(bulkImports.scheduleCronTaskUid, taskUid), or(inArray(bulkImports.status, ["queued", "retrying"]), and(eq(bulkImports.status, "processing"), lt(bulkImports.updatedAt, staleBefore))), inArray(bulkImports.phase, ["validating", "importing"]))).orderBy(asc(bulkImports.updatedAt)).limit(1);
  if (!job) return { processed: false, reason: "no_owned_queued_import" as const };
  await db.update(bulkImports).set({ status: "processing", startedAt: job.startedAt ?? new Date(), attempts: job.attempts + 1 }).where(eq(bulkImports.id, job.id));
  try {
    const result = job.phase === "validating" ? (job.filename.toLowerCase().endsWith(".csv") ? await validateHighVolumeCsvPart(db, job) : await validateHighVolumeChunk(db, job)) : await importHighVolumeChunk(db, job);
    return { workerRan: true, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : "The background import processor failed.";
    const exhausted = job.attempts + 1 >= job.maxAttempts;
    await db.update(bulkImports).set({ status: exhausted ? "failed" : "retrying", errorCategory: "processor", errorMessage: message, finishedAt: exhausted ? new Date() : null }).where(eq(bulkImports.id, job.id));
    throw error;
  }
}

export const workspaceRouter = router({
  ownerOverview: protectedProcedure.query(async ({ ctx }) => ({ businesses: await getOwnerBusinesses(ctx.user.id), ownerRole: ctx.user.role })),
  categorySchemas: protectedProcedure.query(async ({ ctx }) => {
    requireModerator(ctx.user.role);
    return getCategorySchemas();
  }),
  governanceCatalog: protectedProcedure.query(async ({ ctx }) => {
    requireModerator(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The governance catalogue is temporarily unavailable." });
    const [categoryRows, subcategoryRows, fieldRows, cityRows] = await Promise.all([
      db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
      db.select({ id: subcategories.id, categoryId: subcategories.categoryId }).from(subcategories),
      db.select({ id: categoryFields.id, categoryId: categoryFields.categoryId }).from(categoryFields),
      db.select({ id: cities.id, name: cities.name, slug: cities.slug, country: cities.country, tier: cities.tier, isActive: cities.isActive }).from(cities).where(eq(cities.country, "IN")),
    ]);
    const cityBySlug = new Map(cityRows.map(city => [city.slug, city]));
    return {
      categories: categoryRows.map(category => ({
        ...category,
        subcategoryCount: subcategoryRows.filter(subcategory => subcategory.categoryId === category.id).length,
        fieldCount: fieldRows.filter(field => field.categoryId === category.id).length,
      })),
      cities: approvedIndiaCities.map(city => {
        const existing = cityBySlug.get(city.slug);
        return {
          ...city,
          cityId: existing?.id ?? null,
          isProvisioned: Boolean(existing),
          isActive: existing?.isActive ?? false,
        };
      }),
    };
  }),
  adminOverview: protectedProcedure.query(async ({ ctx }) => {
    requireModerator(ctx.user.role);
    return getAdminCounts();
  }),
  adminGoogleCategoryMappings: protectedProcedure.query(async ({ ctx }) => {
    requireModerator(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The mapping configuration service is temporarily unavailable." });
    const [mappings, activeCategories, activeSubcategories] = await Promise.all([
      db.select({ id: googlePlaceCategoryMappings.id, googlePrimaryType: googlePlaceCategoryMappings.googlePrimaryType, categoryId: googlePlaceCategoryMappings.categoryId, subcategoryId: googlePlaceCategoryMappings.subcategoryId, isActive: googlePlaceCategoryMappings.isActive, categoryName: categories.name, categoryIsActive: categories.isActive, subcategoryName: subcategories.name }).from(googlePlaceCategoryMappings).innerJoin(categories, eq(googlePlaceCategoryMappings.categoryId, categories.id)).leftJoin(subcategories, eq(googlePlaceCategoryMappings.subcategoryId, subcategories.id)).orderBy(asc(googlePlaceCategoryMappings.googlePrimaryType)),
      db.select({ id: categories.id, name: categories.name }).from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.name)),
      db.select({ id: subcategories.id, categoryId: subcategories.categoryId, name: subcategories.name }).from(subcategories).where(eq(subcategories.isActive, true)).orderBy(asc(subcategories.name)),
    ]);
    return { canEdit: ctx.user.role === "super_admin", mappings, categories: activeCategories.map(category => ({ ...category, subcategories: activeSubcategories.filter(subcategory => subcategory.categoryId === category.id) })) };
  }),
  upsertGoogleCategoryMapping: protectedProcedure.input(z.object({ googlePrimaryType: z.string().trim().toLowerCase().min(2).max(160).regex(/^[a-z0-9_]+$/), categoryId: z.number().int().positive(), subcategoryId: z.number().int().positive().nullable(), isActive: z.boolean() })).mutation(async ({ ctx, input }) => {
    requireSuperAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The mapping configuration service is temporarily unavailable." });
    const [category] = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.id, input.categoryId), eq(categories.isActive, true))).limit(1);
    if (!category) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose an active Just Finds category before saving this mapping." });
    if (input.subcategoryId) {
      const [subcategory] = await db.select({ id: subcategories.id }).from(subcategories).where(and(eq(subcategories.id, input.subcategoryId), eq(subcategories.categoryId, input.categoryId), eq(subcategories.isActive, true))).limit(1);
      if (!subcategory) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose an active subcategory that belongs to the selected category." });
    }
    await db.insert(googlePlaceCategoryMappings).values({ googlePrimaryType: input.googlePrimaryType, categoryId: input.categoryId, subcategoryId: input.subcategoryId, isActive: input.isActive }).onDuplicateKeyUpdate({ set: { categoryId: input.categoryId, subcategoryId: input.subcategoryId, isActive: input.isActive, updatedAt: new Date() } });
    return { success: true, message: input.isActive ? "The mapping was saved for future private Google import drafts. No existing listing changed." : "The mapping was saved as inactive. It will not be used for future Google import drafts." };
  }),
  adminModerationReports: protectedProcedure.query(async ({ ctx }) => {
    requireModerator(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The moderation service is temporarily unavailable." });
    return db.select({ report: { id: businessReviewReports.id, reason: businessReviewReports.reason, details: businessReviewReports.details, createdAt: businessReviewReports.createdAt }, review: { id: businessReviews.id, content: businessReviews.content, status: businessReviews.status }, business: { id: businesses.id, name: businesses.name }, categoryName: categories.name, cityName: cities.name }).from(businessReviewReports).innerJoin(businessReviews, eq(businessReviewReports.reviewId, businessReviews.id)).innerJoin(businesses, eq(businessReviews.businessId, businesses.id)).leftJoin(categories, eq(businesses.categoryId, categories.id)).leftJoin(cities, eq(businesses.cityId, cities.id)).where(eq(businessReviewReports.status, "pending")).orderBy(asc(businessReviewReports.createdAt)).limit(100);
  }),
  resolveModerationReport: protectedProcedure.input(z.object({ reportId: z.number().int().positive(), decision: z.enum(["dismiss", "remove_review"]), confirmation: z.enum(["DISMISS REPORT", "REMOVE REVIEW"]) })).mutation(async ({ ctx, input }) => {
    requireModerator(ctx.user.role);
    if ((input.decision === "dismiss" && input.confirmation !== "DISMISS REPORT") || (input.decision === "remove_review" && input.confirmation !== "REMOVE REVIEW")) throw new TRPCError({ code: "BAD_REQUEST", message: "Confirm the moderation decision before continuing." });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The moderation service is temporarily unavailable." });
    const [report] = await db.select({ id: businessReviewReports.id, reviewId: businessReviewReports.reviewId, status: businessReviewReports.status }).from(businessReviewReports).where(eq(businessReviewReports.id, input.reportId)).limit(1);
    if (!report || report.status !== "pending") throw new TRPCError({ code: "NOT_FOUND", message: "That pending moderation report is no longer available." });
    if (input.decision === "remove_review") {
      await db.update(businessReviews).set({ status: "removed" }).where(eq(businessReviews.id, report.reviewId));
      await db.update(businessReviewReports).set({ status: "reviewed" }).where(and(eq(businessReviewReports.reviewId, report.reviewId), eq(businessReviewReports.status, "pending")));
      return { message: "The reported review was removed and related pending reports were marked reviewed." };
    }
    await db.update(businessReviewReports).set({ status: "dismissed" }).where(eq(businessReviewReports.id, report.id));
    return { message: "The report was dismissed. The review remains unchanged." };
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
  updateCategoryGovernance: protectedProcedure.input(z.object({
    categoryId: z.number().int().positive(),
    description: z.string().max(1000).nullable().optional(),
    icon: z.string().min(1).max(100).optional(),
    isActive: z.boolean().optional(),
  }).refine(input => input.description !== undefined || input.icon !== undefined || input.isActive !== undefined, { message: "Choose at least one category attribute to update." })).mutation(async ({ ctx, input }) => {
    requireSuperAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The category service is temporarily unavailable." });
    const { categoryId, isActive, ...metadata } = input;
    const update: { description?: string | null; icon?: string; isActive?: boolean; status?: "active" | "inactive" } = { ...metadata };
    if (isActive !== undefined) {
      update.isActive = isActive;
      update.status = isActive ? "active" : "inactive";
    }
    const result = await db.update(categories).set(update).where(eq(categories.id, categoryId));
    if (!result[0].affectedRows) throw new TRPCError({ code: "NOT_FOUND", message: "The category no longer exists." });
    return { updated: true };
  }),
  createCity: protectedProcedure.input(z.object({ name: z.string().min(2).max(120), slug: z.string().max(140).optional(), state: z.string().max(120).optional(), latitude: z.string().max(24).optional(), longitude: z.string().max(24).optional() })).mutation(async ({ ctx, input }) => {
    requireSuperAdmin(ctx.user.role);
    const citySlug = normalizeCategorySlug(input.name);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(citySlug)) throw new TRPCError({ code: "BAD_REQUEST", message: "City name must produce a valid URL slug." });
    const approvedCity = findApprovedIndiaCity(citySlug);
    if (!approvedCity) throw new TRPCError({ code: "BAD_REQUEST", message: "Just Finds currently supports only the approved India Tier-1 and Tier-2 city catalogue." });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The location service is temporarily unavailable." });
    const result = await db.insert(cities).values({ name: approvedCity.name, slug: approvedCity.slug, state: approvedCity.state, country: approvedCity.country, tier: approvedCity.tier, latitude: approvedCity.latitude, longitude: approvedCity.longitude, isActive: true });
    return { cityId: Number(result[0].insertId) };
  }),
  setCityActive: protectedProcedure.input(z.object({ cityId: z.number().int().positive(), isActive: z.boolean() })).mutation(async ({ ctx, input }) => {
    requireSuperAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The location service is temporarily unavailable." });
    const [city] = await db.select({ id: cities.id, name: cities.name, slug: cities.slug, country: cities.country, tier: cities.tier }).from(cities).where(eq(cities.id, input.cityId)).limit(1);
    if (!city || !findApprovedIndiaCity(city.slug) || city.country !== "IN" || !["tier1", "tier2"].includes(city.tier)) throw new TRPCError({ code: "NOT_FOUND", message: "Only a curated India Tier-1 or Tier-2 city can be managed here." });
    await db.update(cities).set({ isActive: input.isActive }).where(eq(cities.id, input.cityId));
    return { updated: true };
  }),
  createCategoryField: protectedProcedure.input(z.object({ categoryId: z.number().int().positive(), fieldKey: z.string().min(2).max(80).regex(/^[a-z][a-z0-9_]*$/), label: z.string().min(2).max(120), fieldType: z.enum(["text", "textarea", "number", "currency", "boolean", "select", "multiselect", "multi_select", "date", "time", "image", "url", "phone", "email"]), placeholder: z.string().max(240).optional(), options: z.array(z.string().max(100)).max(50).optional(), isRequired: z.boolean().default(false), isPublic: z.boolean().default(true), sortOrder: z.number().int().min(0).default(0) })).mutation(async ({ ctx, input }) => {
    requireSuperAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The schema service is temporarily unavailable." });
    const result = await db.insert(categoryFields).values({ ...input, options: input.options ?? null });
    return { fieldId: Number(result[0].insertId) };
  }),
  createBusiness: protectedProcedure.input(businessInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The business workspace is temporarily unavailable." });
    const { dynamicValues, slug: requestedSlug, ...business } = input;
    await approvedCityOrThrow(db, business.cityId);
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
    if (ctx.user.role === "user") await db.update(users).set({ role: "business_owner" }).where(eq(users.id, ctx.user.id));
    if (dynamicValues?.length) await db.insert(businessFieldValues).values(dynamicValues.map(field => ({ businessId, categoryFieldId: field.categoryFieldId, value: field.value })));
    return { businessId, status: "draft" as const };
  }),
  updateBusiness: protectedProcedure.input(businessInput.partial().extend({ businessId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { db } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    if (input.cityId !== undefined) await approvedCityOrThrow(db, input.cityId);
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
    const { db, business } = await ownedBusinessOrThrow(input.businessId, ctx.user.id, ctx.user.role);
    const publishedAt = input.decision === "published" ? new Date() : undefined;
    await db.update(businesses).set({ status: input.decision, ...(publishedAt ? { publishedAt } : {}) }).where(eq(businesses.id, input.businessId));
    await db.update(approvalQueue).set({ status: input.decision === "rejected" ? "rejected" : "approved", reviewerId: ctx.user.id, reviewerNote: input.reviewerNote, resolvedAt: new Date() }).where(and(eq(approvalQueue.businessId, input.businessId), eq(approvalQueue.status, "pending")));
    if (business.ownerId) {
      const notice = input.decision === "rejected"
        ? { type: "review_rejected", title: "Changes requested for your listing", body: input.reviewerNote || "Review the owner dashboard for the requested changes." }
        : input.decision === "suspended"
          ? { type: "review_suspended", title: "Listing temporarily suspended", body: input.reviewerNote || "Review the owner dashboard for the current listing status." }
          : { type: `review_${input.decision}`, title: input.decision === "published" ? "Listing is now live" : "Listing approved", body: input.reviewerNote || "Your listing review status has been updated." };
      await db.insert(businessNotifications).values({ userId: business.ownerId, businessId: input.businessId, type: notice.type, title: notice.title, body: notice.body, isRead: false });
    }
    return { status: input.decision };
  }),
  beginHighVolumeImport: protectedProcedure.input(z.object({ filename: z.string().min(1).max(255), contentType: z.string().max(120).optional(), fileSize: z.number().int().positive().max(HIGH_VOLUME_FILE_LIMIT) })).mutation(async ({ ctx, input }) => {
    requireModerator(ctx.user.role);
    if (!isSupportedImportFilename(input.filename)) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a CSV, XLS, or XLSX file." });
    const formatIssue = highVolumeFormatIssue(input.filename, input.fileSize);
    if (formatIssue) throw new TRPCError({ code: "BAD_REQUEST", message: formatIssue });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The import service is temporarily unavailable." });
    const safeFilename = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `bulk-imports/${ctx.user.id}/${Date.now()}-${crypto.randomUUID()}-${safeFilename}`;
    const created = await db.insert(bulkImports).values({ initiatedById: ctx.user.id, filename: input.filename, status: "pending", phase: "staged", sourceFileKey: key, sourceFileContentType: input.contentType || null, sourceFileSize: input.fileSize, maxAttempts: 3 });
    const importId = Number(created[0].insertId);
    return { importId, uploadPath: `/api/admin/bulk-imports/${importId}/upload`, fileKey: key, maxRows: HIGH_VOLUME_ROW_LIMIT, maxBytes: HIGH_VOLUME_FILE_LIMIT, validatesCsvInBrowser: input.filename.toLowerCase().endsWith(".csv") };
  }),
  validateHighVolumeCsvBatch: protectedProcedure.input(z.object({ importId: z.number().int().positive(), rowOffset: z.number().int().min(0).max(HIGH_VOLUME_ROW_LIMIT), sourceBytesRead: z.number().int().min(0).max(HIGH_VOLUME_FILE_LIMIT), rows: spreadsheetRowsInput.optional().default([]), final: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
    requireModerator(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The import service is temporarily unavailable." });
    const [job] = await db.select().from(bulkImports).where(eq(bulkImports.id, input.importId)).limit(1);
    if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Staged import not found." });
    if (job.initiatedById !== ctx.user.id && ctx.user.role !== "super_admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only the initiating administrator may validate this import." });
    if (!job.filename.toLowerCase().endsWith(".csv")) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Only CSV files use streamed browser validation." });
    const stagingIssue = sourceQueueIssue(job.sourceUploadedAt);
    if (stagingIssue) throw new TRPCError({ code: "PRECONDITION_FAILED", message: stagingIssue });
    if (job.phase !== "staged" && job.phase !== "validating") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This import is no longer awaiting CSV validation." });
    if (job.validationCursor !== input.rowOffset) throw new TRPCError({ code: "CONFLICT", message: "CSV validation is out of sequence. Refresh import history before continuing." });
    if (!input.final && !input.rows.length) throw new TRPCError({ code: "BAD_REQUEST", message: "A CSV validation batch must include at least one business row." });
    if (input.rowOffset + input.rows.length > HIGH_VOLUME_ROW_LIMIT) throw new TRPCError({ code: "BAD_REQUEST", message: `This import exceeds the ${HIGH_VOLUME_ROW_LIMIT.toLocaleString()} row limit.` });
    const lookup = input.rows.length ? await importTaxonomyLookup(db, input.rows) : null;
    const priorRows = input.rowOffset ? await db.select({ rowNumber: bulkImportRows.rowNumber, fingerprint: bulkImportRows.fingerprint }).from(bulkImportRows).where(and(eq(bulkImportRows.importId, job.id), lt(bulkImportRows.rowNumber, input.rowOffset + 2))) : [];
    const seenRows = new Map(priorRows.flatMap(row => row.fingerprint ? [[row.fingerprint, row.rowNumber] as [string, number]] : []));
    const prepared = lookup ? input.rows.map((raw, index) => validateImportListing(raw as ImportRow, input.rowOffset + index + 2, lookup, seenRows)) : [];
    const rowsToInsert = prepared.map(row => ({ importId: job.id, rowNumber: row.rowNumber, fingerprint: row.errors.some(error => error.startsWith("Duplicate of spreadsheet row")) ? null : importRowFingerprint(row.listing, row.city?.id), data: importPayload(row), validationErrors: row.errors.length ? row.errors : null, duplicateCandidateId: row.duplicateCandidateId, status: row.valid ? "valid" as const : row.duplicateCandidateId && row.errors.some(error => error.startsWith("Likely duplicate")) ? "duplicate" as const : "invalid" as const }));
    if (rowsToInsert.length) await db.insert(bulkImportRows).values(rowsToInsert);
    const validAdded = prepared.filter(row => row.valid).length;
    const nextCursor = input.rowOffset + prepared.length;
    if (input.final) {
      await db.update(bulkImports).set({ status: "pending", phase: "ready", totalRows: nextCursor, validationCursor: nextCursor, validRows: job.validRows + validAdded, failedRows: job.failedRows + prepared.length - validAdded, progressPercent: 100, finishedAt: new Date(), errorMessage: null, errorCategory: null }).where(eq(bulkImports.id, job.id));
      return { importId: job.id, phase: "ready" as const, processed: prepared.length, totalRows: nextCursor };
    }
    const progressPercent = job.sourceFileSize ? Math.min(44, Math.max(1, Math.floor((input.sourceBytesRead / job.sourceFileSize) * 45))) : 1;
    await db.update(bulkImports).set({ status: "processing", phase: "validating", validationCursor: nextCursor, validRows: job.validRows + validAdded, failedRows: job.failedRows + prepared.length - validAdded, progressPercent, errorMessage: null, errorCategory: null }).where(eq(bulkImports.id, job.id));
    return { importId: job.id, phase: "validating" as const, processed: prepared.length, totalRows: null };
  }),
  queueHighVolumeValidation: protectedProcedure.input(z.object({ importId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    requireModerator(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The import service is temporarily unavailable." });
    const [job] = await db.select().from(bulkImports).where(eq(bulkImports.id, input.importId)).limit(1);
    if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Staged import not found." });
    if (job.initiatedById !== ctx.user.id && ctx.user.role !== "super_admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only the initiating administrator may queue this import." });
    if (job.phase !== "staged") return { importId: job.id, status: job.status, phase: job.phase, alreadyQueued: true };
    const stagingIssue = sourceQueueIssue(job.sourceUploadedAt);
    if (stagingIssue) throw new TRPCError({ code: "PRECONDITION_FAILED", message: stagingIssue });
    const scheduleCronTaskUid = await enableHighVolumeImportSchedule(input.importId, job.scheduleCronTaskUid, heartbeatSessionFromHeaders(ctx.req.headers.cookie, ctx.req.headers.authorization, COOKIE_NAME));
    await db.update(bulkImports).set({ scheduleCronTaskUid, status: "queued", phase: "validating", validationCursor: 0, progressPercent: 0, attempts: 0, errorMessage: null, errorCategory: null, finishedAt: null }).where(eq(bulkImports.id, input.importId));
    return { importId: input.importId, status: "queued" as const, phase: "validating" as const, alreadyQueued: false };
  }),
  startHighVolumeImport: protectedProcedure.input(z.object({ importId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    requireModerator(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The import service is temporarily unavailable." });
    const [job] = await db.select().from(bulkImports).where(eq(bulkImports.id, input.importId)).limit(1);
    if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Import not found." });
    if (job.initiatedById !== ctx.user.id && ctx.user.role !== "super_admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only the initiating administrator may start this import." });
    if (job.phase !== "ready") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Wait for validation to finish before creating submitted listings." });
    if (!job.validRows) throw new TRPCError({ code: "BAD_REQUEST", message: "This import has no valid rows to create." });
    const scheduleCronTaskUid = await enableHighVolumeImportSchedule(input.importId, job.scheduleCronTaskUid, heartbeatSessionFromHeaders(ctx.req.headers.cookie, ctx.req.headers.authorization, COOKIE_NAME));
    await db.update(bulkImports).set({ scheduleCronTaskUid, status: "queued", phase: "importing", processedRows: 0, progressPercent: 45, attempts: 0, errorMessage: null, errorCategory: null, finishedAt: null }).where(eq(bulkImports.id, input.importId));
    return { importId: input.importId, status: "queued" as const, phase: "importing" as const };
  }),
  retryHighVolumeImport: protectedProcedure.input(z.object({ importId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    requireModerator(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The import service is temporarily unavailable." });
    const [job] = await db.select().from(bulkImports).where(eq(bulkImports.id, input.importId)).limit(1);
    if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Import not found." });
    if (job.initiatedById !== ctx.user.id && ctx.user.role !== "super_admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only the initiating administrator may retry this import." });
    if (!["failed", "retrying"].includes(job.status) || !["validating", "importing"].includes(job.phase)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Only a failed background import can be retried." });
    if (job.errorCategory === "format_limit") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This oversized XLS/XLSX import cannot run in the managed worker. Export it as CSV UTF-8 and create a new large import." });
    const stagingIssue = sourceQueueIssue(job.sourceUploadedAt);
    if (stagingIssue) throw new TRPCError({ code: "PRECONDITION_FAILED", message: stagingIssue });
    const scheduleCronTaskUid = await enableHighVolumeImportSchedule(input.importId, job.scheduleCronTaskUid, heartbeatSessionFromHeaders(ctx.req.headers.cookie, ctx.req.headers.authorization, COOKIE_NAME));
    await db.update(bulkImports).set({ scheduleCronTaskUid, status: "queued", attempts: 0, errorMessage: null, errorCategory: null, finishedAt: null }).where(eq(bulkImports.id, input.importId));
    return { importId: input.importId, status: "queued" as const, phase: job.phase };
  }),
  cancelHighVolumeImport: protectedProcedure.input(z.object({ importId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    requireModerator(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The import service is temporarily unavailable." });
    const [job] = await db.select().from(bulkImports).where(eq(bulkImports.id, input.importId)).limit(1);
    if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Import not found." });
    if (job.initiatedById !== ctx.user.id && ctx.user.role !== "super_admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only the initiating administrator may cancel this import." });
    if (["completed", "cancelled"].includes(job.status)) return { importId: input.importId, status: job.status, alreadyFinal: true };
    if (job.scheduleCronTaskUid) await updateHeartbeatJob(job.scheduleCronTaskUid, { enable: false }, heartbeatSessionFromHeaders(ctx.req.headers.cookie, ctx.req.headers.authorization, COOKIE_NAME));
    await db.update(bulkImports).set({ status: "cancelled", phase: "cancelled", cancelledAt: new Date(), finishedAt: new Date() }).where(eq(bulkImports.id, input.importId));
    return { importId: input.importId, status: "cancelled" as const, alreadyFinal: false };
  }),
  bulkImportPreview: protectedProcedure.input(z.object({ filename: z.string().min(1).max(255), rows: spreadsheetRowsInput })).mutation(async ({ ctx, input }) => {
    requireModerator(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The import service is temporarily unavailable." });
    const lookup = await importTaxonomyLookup(db, input.rows);
    const seenRows = new Map<string, number>();
    const previewRows = input.rows.map((raw, index) => validateImportListing(raw, index + 2, lookup, seenRows));
    const validRows = previewRows.filter(row => row.valid);
    const invalidRows = previewRows.filter(row => !row.valid);
    const created = await db.insert(bulkImports).values({ initiatedById: ctx.user.id, filename: input.filename, status: "pending", totalRows: previewRows.length, validRows: validRows.length, failedRows: invalidRows.length });
    const importId = Number(created[0].insertId);
    await db.insert(bulkImportRows).values(previewRows.map(row => {
      const status: "valid" | "invalid" | "duplicate" = row.valid ? "valid" : row.duplicateCandidateId && row.errors.some(error => error.startsWith("Likely duplicate")) ? "duplicate" : "invalid";
      return { importId, rowNumber: row.rowNumber, data: { raw: row.raw, normalized: row.listing, warnings: row.warnings, hours: row.hours, faqs: row.faqs, categoryId: row.category?.id ?? null, subcategoryId: row.subcategory?.id ?? null, businessTypeId: row.businessType?.id ?? null, cityId: row.city?.id ?? null, localityId: row.locality?.id ?? null }, validationErrors: row.errors.length ? row.errors : null, duplicateCandidateId: row.duplicateCandidateId, status };
    }));
    return {
      importId,
      filename: input.filename,
      status: "Pending" as const,
      message: `${validRows.length} of ${previewRows.length} rows are ready to create as submitted listings for administrator review. Nothing is public yet.`,
      summary: { totalRows: previewRows.length, validRows: validRows.length, invalidRows: invalidRows.length, warningRows: previewRows.filter(row => row.warnings.length).length, duplicateRows: previewRows.filter(row => Boolean(row.duplicateCandidateId)).length },
      rows: previewRows.slice(0, 100).map(row => ({ rowNumber: row.rowNumber, businessName: row.listing.businessName || "Unnamed row", category: row.category?.name ?? row.listing.mainCategory, subcategory: (row.subcategory?.name ?? row.listing.subcategory) || null, city: row.city?.name ?? row.listing.city, locality: (row.locality?.name ?? row.listing.locality) || null, valid: row.valid, errors: row.errors, warnings: row.warnings })),
    };
  }),
  commitBulkImport: protectedProcedure.input(z.object({ importId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    requireModerator(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The import service is temporarily unavailable." });
    const [importJob] = await db.select().from(bulkImports).where(eq(bulkImports.id, input.importId)).limit(1);
    if (!importJob) throw new TRPCError({ code: "NOT_FOUND", message: "Import preview not found." });
    if (importJob.initiatedById !== ctx.user.id && ctx.user.role !== "super_admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only the initiating administrator may commit this import." });
    if (importJob.status === "completed") return { importId: input.importId, createdRows: 0, skippedRows: 0, alreadyCompleted: true };
    const pendingRows = await db.select().from(bulkImportRows).where(and(eq(bulkImportRows.importId, input.importId), eq(bulkImportRows.status, "valid")));
    if (!pendingRows.length) throw new TRPCError({ code: "BAD_REQUEST", message: "This preview has no valid rows to import." });
    await db.update(bulkImports).set({ status: "processing" }).where(eq(bulkImports.id, input.importId));
    const existingSlugs = new Set((await db.select({ slug: businesses.slug }).from(businesses)).map(row => row.slug));
    let createdRows = 0;
    let skippedRows = 0;
    for (const row of pendingRows) {
      const payload = row.data as { normalized?: NormalizedBulkListing; categoryId?: number | null; subcategoryId?: number | null; businessTypeId?: number | null; cityId?: number | null; localityId?: number | null; hours?: ReturnType<typeof parseImportedHours>["days"]; faqs?: ReturnType<typeof parseImportedFaqs>["faqs"]; services?: ReturnType<typeof parseImportedServices>["services"] } | null;
      const listing = payload?.normalized;
      if (!listing || !payload?.categoryId || !payload.cityId) {
        skippedRows += 1;
        await db.update(bulkImportRows).set({ status: "invalid", validationErrors: ["Import audit data is incomplete. Re-upload this row."] }).where(eq(bulkImportRows.id, row.id));
        continue;
      }
      try {
        const slug = nextImportSlug(listing.businessName, existingSlugs);
        const created = await db.insert(businesses).values({ ownerId: ctx.user.id, categoryId: payload.categoryId, subcategoryId: payload.subcategoryId ?? null, businessTypeId: payload.businessTypeId ?? null, cityId: payload.cityId, localityId: payload.localityId ?? null, name: listing.businessName, slug, address: listing.address, shortDescription: listing.description || null, aboutDescription: listing.description || null, phone: listing.phone || null, email: listing.email || null, website: listing.website || null, latitude: listing.latitude || null, longitude: listing.longitude || null, status: "submitted", onboardingStep: 1 });
        const businessId = Number(created[0].insertId);
        await Promise.all([
          payload.hours?.length === 7 ? db.insert(businessHours).values(payload.hours.map(day => ({ ...day, businessId }))) : Promise.resolve(),
          payload.faqs?.length ? db.insert(businessAiContent).values({ businessId, about: listing.description || null, faqs: payload.faqs, status: "pending" }) : Promise.resolve(),
          payload.services?.length ? db.insert(businessServices).values(payload.services.map((service, sortOrder) => ({ businessId, name: service.name, sortOrder }))) : Promise.resolve(),
          db.insert(approvalQueue).values({ entityType: "business", businessId, submittedById: ctx.user.id, status: "pending" }),
          db.update(bulkImportRows).set({ status: "imported" }).where(eq(bulkImportRows.id, row.id)),
        ]);
        createdRows += 1;
      } catch (error) {
        skippedRows += 1;
        const message = error instanceof Error ? error.message.slice(0, 500) : "The row could not be imported.";
        await db.update(bulkImportRows).set({ status: "invalid", validationErrors: [message] }).where(eq(bulkImportRows.id, row.id));
      }
    }
    await db.update(bulkImports).set({ status: createdRows ? "completed" : "failed", validRows: createdRows, failedRows: importJob.failedRows + skippedRows }).where(eq(bulkImports.id, input.importId));
    return { importId: input.importId, createdRows, skippedRows, alreadyCompleted: false };
  }),
  bulkImportHistory: protectedProcedure.query(async ({ ctx }) => {
    requireModerator(ctx.user.role);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The import service is temporarily unavailable." });
    return db.select({ id: bulkImports.id, filename: bulkImports.filename, status: bulkImports.status, phase: bulkImports.phase, totalRows: bulkImports.totalRows, validRows: bulkImports.validRows, failedRows: bulkImports.failedRows, validationCursor: bulkImports.validationCursor, processedRows: bulkImports.processedRows, progressPercent: bulkImports.progressPercent, errorMessage: bulkImports.errorMessage, errorCategory: bulkImports.errorCategory, sourceUploadedAt: bulkImports.sourceUploadedAt, createdAt: bulkImports.createdAt, updatedAt: bulkImports.updatedAt }).from(bulkImports).where(eq(bulkImports.initiatedById, ctx.user.id)).orderBy(desc(bulkImports.createdAt)).limit(20);
  }),
});
