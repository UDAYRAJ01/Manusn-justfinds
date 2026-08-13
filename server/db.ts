import { and, asc, count, desc, eq, isNotNull, like, ne, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  businessAiContent,
  businessCertificates,
  businessDomains,
  businessFieldValues,
  businessFacilities,
  businessHours,
  businessImages,
  businessLeads,
  businessRankings,
  businessReputation,
  businessReviews,
  businesses,
  businessServices,
  businessVerifications,
  approvalQueue,
  categories,
  categoryFields,
  cities,
  InsertUser,
  jobs,
  jobApplications,
  localities,
  searchInteractions,
  searchLogs,
  savedBusinesses,
  subcategories,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { internalValidationCategorySlug, isInternalValidationBusiness } from "./domain/internalValidation";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getActiveCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder, categories.name);
}

export async function getActiveCities() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cities).where(eq(cities.isActive, true)).orderBy(cities.name);
}

export async function getPublicCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(and(eq(categories.slug, slug), eq(categories.isActive, true))).limit(1);
  return result[0];
}

export async function getPublicSubcategories(categorySlug: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: subcategories.id, name: subcategories.name, slug: subcategories.slug, description: subcategories.description, icon: subcategories.icon })
    .from(subcategories)
    .innerJoin(categories, eq(subcategories.categoryId, categories.id))
    .where(and(eq(categories.slug, categorySlug), eq(categories.isActive, true), eq(subcategories.isActive, true)))
    .orderBy(subcategories.sortOrder, subcategories.name);
}

export async function getPublicCityBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cities).where(and(eq(cities.slug, slug), eq(cities.isActive, true))).limit(1);
  return result[0];
}

export async function getPublicLocalities(citySlug: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: localities.id, name: localities.name, slug: localities.slug, latitude: localities.latitude, longitude: localities.longitude })
    .from(localities)
    .innerJoin(cities, eq(localities.cityId, cities.id))
    .where(and(eq(cities.slug, citySlug), eq(cities.isActive, true)))
    .orderBy(localities.name);
}

export async function getPublicCategoryFields(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categoryFields).where(and(eq(categoryFields.categoryId, categoryId), eq(categoryFields.isPublic, true))).orderBy(categoryFields.sortOrder, categoryFields.label);
}

export async function getPublicBusinesses(query?: string, citySlug?: string) {
  const db = await getDb();
  if (!db) return [];
  const searchPattern = `%${query?.trim() ?? ""}%`;
  const conditions = [eq(businesses.status, "published")];
  if (query?.trim()) {
    conditions.push(or(like(businesses.name, searchPattern), like(businesses.shortDescription, searchPattern), like(categories.name, searchPattern))!);
  }
  if (citySlug) conditions.push(eq(cities.slug, citySlug));
  return db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      shortDescription: businesses.shortDescription,
      address: businesses.address,
      phone: businesses.phone,
      whatsapp: businesses.whatsapp,
      website: businesses.website,
      latitude: businesses.latitude,
      longitude: businesses.longitude,
      isVerified: businesses.isVerified,
      profileCompleteness: businesses.profileCompleteness,
      recommendationScore: businesses.recommendationScore,
      reputationScore: businesses.reputationScore,
      category: categories.name,
      categorySlug: categories.slug,
      city: cities.name,
      citySlug: cities.slug,
      locality: localities.name,
    })
    .from(businesses)
    .innerJoin(categories, eq(businesses.categoryId, categories.id))
    .innerJoin(cities, eq(businesses.cityId, cities.id))
    .leftJoin(localities, eq(businesses.localityId, localities.id))
    .where(and(...conditions))
    .orderBy(desc(businesses.manualPriority), desc(businesses.recommendationScore))
    .limit(120);
}

export type PublicSearchInput = {
  query?: string;
  citySlug?: string;
  localitySlug?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  verified?: boolean;
  latitude?: number;
  longitude?: number;
  sort?: "nearby" | "rating" | "recommended";
  offset: number;
  limit: number;
  includeTotal?: boolean;
};

export async function getPublicSearchPage(input: PublicSearchInput) {
  const db = await getDb();
  if (!db) return { items: [], nextOffset: null, total: input.includeTotal ? 0 : null };

  const conditions = [eq(businesses.status, "published")];
  const term = input.query?.trim();
  if (term) {
    const pattern = `%${term}%`;
    conditions.push(or(like(businesses.name, pattern), like(businesses.shortDescription, pattern), like(categories.name, pattern), like(subcategories.name, pattern))!);
  }
  if (input.citySlug) conditions.push(eq(cities.slug, input.citySlug));
  if (input.localitySlug) conditions.push(eq(localities.slug, input.localitySlug));
  if (input.categorySlug) conditions.push(eq(categories.slug, input.categorySlug));
  if (input.subcategorySlug) conditions.push(eq(subcategories.slug, input.subcategorySlug));
  if (input.verified) conditions.push(eq(businesses.isVerified, true));

  const hasCoordinates = input.latitude !== undefined && input.longitude !== undefined;
  const validCoordinates = and(isNotNull(businesses.latitude), isNotNull(businesses.longitude), ne(businesses.latitude, ""), ne(businesses.longitude, ""));
  if (hasCoordinates && input.sort === "nearby") conditions.push(validCoordinates!);

  const distanceKm = hasCoordinates
    ? sql<number>`6371 * acos(least(1, greatest(-1, cos(radians(${input.latitude})) * cos(radians(cast(${businesses.latitude} as decimal(10,7)))) * cos(radians(cast(${businesses.longitude} as decimal(10,7))) - radians(${input.longitude})) + sin(radians(${input.latitude})) * sin(radians(cast(${businesses.latitude} as decimal(10,7)))))))`
    : sql<number | null>`null`;
  const ordering = input.sort === "nearby" && hasCoordinates
    ? [asc(distanceKm), desc(businesses.manualPriority), desc(businesses.recommendationScore)]
    : input.sort === "rating"
      ? [desc(businesses.reputationScore), desc(businesses.manualPriority), desc(businesses.recommendationScore)]
      : [desc(businesses.manualPriority), desc(businesses.recommendationScore), desc(businesses.reputationScore)];

  const [rows, countRows] = await Promise.all([
    db.select({ id: businesses.id, name: businesses.name, slug: businesses.slug, shortDescription: businesses.shortDescription, address: businesses.address, phone: businesses.phone, whatsapp: businesses.whatsapp, website: businesses.website, latitude: businesses.latitude, longitude: businesses.longitude, isVerified: businesses.isVerified, profileCompleteness: businesses.profileCompleteness, recommendationScore: businesses.recommendationScore, reputationScore: businesses.reputationScore, category: categories.name, categorySlug: categories.slug, subcategory: subcategories.name, subcategorySlug: subcategories.slug, city: cities.name, citySlug: cities.slug, locality: localities.name, localitySlug: localities.slug, distanceKm }).from(businesses)
      .innerJoin(categories, eq(businesses.categoryId, categories.id)).innerJoin(cities, eq(businesses.cityId, cities.id)).leftJoin(subcategories, eq(businesses.subcategoryId, subcategories.id)).leftJoin(localities, eq(businesses.localityId, localities.id))
      .where(and(...conditions)).orderBy(...ordering).limit(input.limit + 1).offset(input.offset),
    input.includeTotal
      ? db.select({ value: count() }).from(businesses).innerJoin(categories, eq(businesses.categoryId, categories.id)).innerJoin(cities, eq(businesses.cityId, cities.id)).leftJoin(subcategories, eq(businesses.subcategoryId, subcategories.id)).leftJoin(localities, eq(businesses.localityId, localities.id)).where(and(...conditions))
      : Promise.resolve([]),
  ]);

  const hasMore = rows.length > input.limit;
  return { items: rows.slice(0, input.limit), nextOffset: hasMore ? input.offset + input.limit : null, total: input.includeTotal ? Number(countRows[0]?.value ?? 0) : null };
}

export async function logPublicSearch(input: { userId?: number; query: string; categoryId?: number; subcategoryId?: number; cityId?: number; localityId?: number; latitude?: number; longitude?: number; intent: "standard" | "nearby" | "recommended"; sessionId?: string; resultCount: number }) {
  const db = await getDb();
  if (!db) return;
  const telemetry = { userId: input.userId, query: input.query.slice(0, 300), categoryId: input.categoryId, subcategoryId: input.subcategoryId, cityId: input.cityId, localityId: input.localityId, latitude: input.latitude?.toString(), longitude: input.longitude?.toString(), intent: input.intent, sessionId: input.sessionId?.slice(0, 64), resultCount: input.resultCount };
  await Promise.all([
    db.insert(searchLogs).values(telemetry),
    db.insert(searchInteractions).values({ userId: input.userId, action: "search", query: telemetry.query, sessionId: telemetry.sessionId }),
  ]);
}

export async function logPublicInteraction(input: { userId?: number; businessId: number; action: "click" | "call" | "whatsapp" | "directions" | "website" | "save" | "inquiry"; query?: string; sessionId?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(searchInteractions).values({ userId: input.userId, businessId: input.businessId, action: input.action, query: input.query?.slice(0, 300), sessionId: input.sessionId?.slice(0, 64) });
}

export async function getPublicBusinessByRoute(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select({
      business: businesses,
      category: { name: categories.name, slug: categories.slug },
      city: { name: cities.name, slug: cities.slug },
      locality: { name: localities.name },
    })
    .from(businesses)
    .innerJoin(categories, eq(businesses.categoryId, categories.id))
    .innerJoin(cities, eq(businesses.cityId, cities.id))
    .leftJoin(localities, eq(businesses.localityId, localities.id))
    .where(and(eq(businesses.slug, slug), eq(businesses.status, "published")))
    .limit(1);
  const row = rows[0];
  if (!row) return undefined;
  const [services, hours, fields, ai] = await Promise.all([
    db.select().from(businessServices).where(eq(businessServices.businessId, row.business.id)),
    db.select().from(businessHours).where(eq(businessHours.businessId, row.business.id)),
    db.select().from(businessFieldValues).where(eq(businessFieldValues.businessId, row.business.id)),
    db.select().from(businessAiContent).where(eq(businessAiContent.businessId, row.business.id)).limit(1),
  ]);
  return { ...row, services, hours, fields, ai: ai[0] };
}

export async function getBusinessAiFacts(businessId: number, publicOnly = false) {
  const db = await getDb();
  if (!db) return undefined;
  const businessRows = await db
    .select({
      business: businesses,
      category: { name: categories.name, slug: categories.slug },
      city: { name: cities.name, slug: cities.slug },
      locality: { name: localities.name },
    })
    .from(businesses)
    .innerJoin(categories, eq(businesses.categoryId, categories.id))
    .innerJoin(cities, eq(businesses.cityId, cities.id))
    .leftJoin(localities, eq(businesses.localityId, localities.id))
    .where(and(eq(businesses.id, businessId), ...(publicOnly ? [eq(businesses.status, "published")] : [])))
    .limit(1);
  const row = businessRows[0];
  if (!row) return undefined;
  const [services, hours, facilities, fields] = await Promise.all([
    db.select({ name: businessServices.name, description: businessServices.description }).from(businessServices).where(eq(businessServices.businessId, businessId)).orderBy(businessServices.sortOrder),
    db.select({ dayOfWeek: businessHours.dayOfWeek, opensAt: businessHours.opensAt, closesAt: businessHours.closesAt, isClosed: businessHours.isClosed, isTwentyFourHours: businessHours.isTwentyFourHours }).from(businessHours).where(eq(businessHours.businessId, businessId)).orderBy(businessHours.dayOfWeek),
    db.select({ name: businessFacilities.name, details: businessFacilities.details }).from(businessFacilities).where(eq(businessFacilities.businessId, businessId)).orderBy(businessFacilities.sortOrder),
    db.select({ label: categoryFields.label, value: businessFieldValues.value }).from(businessFieldValues).innerJoin(categoryFields, eq(businessFieldValues.categoryFieldId, categoryFields.id)).where(eq(businessFieldValues.businessId, businessId)).orderBy(categoryFields.sortOrder),
  ]);
  return {
    business: {
      id: row.business.id,
      name: row.business.name,
      address: row.business.address,
      postcode: row.business.postcode,
      phone: row.business.phone,
      whatsapp: row.business.whatsapp,
      email: row.business.email,
      website: row.business.website,
      shortDescription: row.business.shortDescription,
      approvedDescription: row.business.approvedDescription,
      latitude: row.business.latitude,
      longitude: row.business.longitude,
      isVerified: row.business.isVerified,
      status: row.business.status,
      category: row.category.name,
      categorySlug: row.category.slug,
      city: row.city.name,
      citySlug: row.city.slug,
      locality: row.locality?.name ?? null,
    },
    services,
    hours,
    facilities,
    fields,
  };
}

export async function getBusinessChatContext(businessId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const business = await db.select().from(businesses).where(and(eq(businesses.id, businessId), eq(businesses.status, "published"))).limit(1);
  if (!business[0]) return undefined;
  const [services, hours, ai] = await Promise.all([
    db.select().from(businessServices).where(eq(businessServices.businessId, businessId)),
    db.select().from(businessHours).where(eq(businessHours.businessId, businessId)),
    db.select().from(businessAiContent).where(eq(businessAiContent.businessId, businessId)).limit(1),
  ]);
  return { business: business[0], services, hours, ai: ai[0] };
}

export async function createBusinessLead(input: { businessId: number; name: string; phone?: string; email?: string; message?: string; page?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.insert(businessLeads).values({ ...input, source: "business-page" });
}

export async function getOwnerBusinesses(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(businesses).where(eq(businesses.ownerId, ownerId)).orderBy(desc(businesses.updatedAt));
}

export async function getInternalValidationBusinesses() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: businesses.id, name: businesses.name, slug: businesses.slug, status: businesses.status, voiceIntroductionUrl: businesses.voiceIntroductionUrl, createdAt: businesses.createdAt, category: categories.name, city: cities.name })
    .from(businesses).innerJoin(categories, eq(businesses.categoryId, categories.id)).innerJoin(cities, eq(businesses.cityId, cities.id))
    .where(and(eq(categories.slug, internalValidationCategorySlug), like(businesses.name, "Just Finds Internal %TEST ONLY"))).orderBy(desc(businesses.createdAt));
}

export async function deleteInternalValidationBusiness(businessId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const matches = await db.select({ name: businesses.name, categorySlug: categories.slug }).from(businesses).innerJoin(categories, eq(businesses.categoryId, categories.id)).where(eq(businesses.id, businessId)).limit(1);
  const business = matches[0];
  if (!business || !isInternalValidationBusiness(business)) return false;
  await db.transaction(async tx => {
    const childId = <T>(column: T) => eq(column as never, businessId);
    const testJobs = await tx.select({ id: jobs.id }).from(jobs).where(eq(jobs.businessId, businessId));
    if (testJobs.length) await tx.delete(jobApplications).where(sql`${jobApplications.jobId} IN (${sql.join(testJobs.map(job => sql`${job.id}`), sql`, `)})`);
    await Promise.all([
      tx.delete(businessFieldValues).where(childId(businessFieldValues.businessId)), tx.delete(businessHours).where(childId(businessHours.businessId)), tx.delete(businessServices).where(childId(businessServices.businessId)), tx.delete(businessImages).where(childId(businessImages.businessId)), tx.delete(businessReviews).where(childId(businessReviews.businessId)), tx.delete(businessLeads).where(childId(businessLeads.businessId)), tx.delete(businessAiContent).where(childId(businessAiContent.businessId)), tx.delete(businessDomains).where(childId(businessDomains.businessId)), tx.delete(businessCertificates).where(childId(businessCertificates.businessId)), tx.delete(businessFacilities).where(childId(businessFacilities.businessId)), tx.delete(businessVerifications).where(childId(businessVerifications.businessId)), tx.delete(businessReputation).where(childId(businessReputation.businessId)), tx.delete(businessRankings).where(childId(businessRankings.businessId)), tx.delete(approvalQueue).where(eq(approvalQueue.businessId, businessId)), tx.delete(savedBusinesses).where(childId(savedBusinesses.businessId)), tx.delete(searchInteractions).where(childId(searchInteractions.businessId)), tx.delete(jobs).where(eq(jobs.businessId, businessId)),
    ]);
    await tx.delete(businesses).where(eq(businesses.id, businessId));
  });
  return true;
}

export async function getAdminCounts() {
  const db = await getDb();
  if (!db) return { businesses: 0, pendingBusinesses: 0, users: 0, jobs: 0 };
  const [businessCount, pendingCount, userCount, jobCount] = await Promise.all([
    db.select({ value: count() }).from(businesses),
    db.select({ value: count() }).from(businesses).where(or(eq(businesses.status, "submitted"), eq(businesses.status, "under_review"))),
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(jobs),
  ]);
  return { businesses: businessCount[0]?.value ?? 0, pendingBusinesses: pendingCount[0]?.value ?? 0, users: userCount[0]?.value ?? 0, jobs: jobCount[0]?.value ?? 0 };
}

export async function getPendingBusinesses() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: businesses.id, name: businesses.name, status: businesses.status, shortDescription: businesses.shortDescription, createdAt: businesses.createdAt, category: categories.name, city: cities.name })
    .from(businesses)
    .innerJoin(categories, eq(businesses.categoryId, categories.id))
    .innerJoin(cities, eq(businesses.cityId, cities.id))
    .where(eq(businesses.status, "submitted"))
    .orderBy(desc(businesses.updatedAt));
}

export async function getPublishedJobs(query?: string, citySlug?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(jobs.status, "published")];
  if (query?.trim()) conditions.push(or(like(jobs.title, `%${query.trim()}%`), like(jobs.category, `%${query.trim()}%`))!);
  if (citySlug) conditions.push(eq(cities.slug, citySlug));
  return db.select({ job: jobs, city: cities.name, citySlug: cities.slug, company: businesses.name })
    .from(jobs)
    .leftJoin(cities, eq(jobs.cityId, cities.id))
    .leftJoin(businesses, eq(jobs.businessId, businesses.id))
    .where(and(...conditions))
    .orderBy(desc(jobs.publishedAt))
    .limit(50);
}

export async function getCategorySchemas() {
  const db = await getDb();
  if (!db) return [];
  const [schemas, fields] = await Promise.all([
    db.select({ category: categories, subcategory: subcategories }).from(categories).leftJoin(subcategories, eq(subcategories.categoryId, categories.id)).orderBy(categories.sortOrder, subcategories.sortOrder),
    db.select().from(categoryFields).orderBy(categoryFields.sortOrder, categoryFields.label),
  ]);
  return schemas.map(schema => ({
    ...schema,
    fields: fields.filter(field => field.categoryId === schema.category.id && field.subcategoryId === (schema.subcategory?.id ?? null)),
  }));
}
