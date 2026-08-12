import { and, count, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  businessAiContent,
  businessFieldValues,
  businessHours,
  businessLeads,
  businesses,
  businessServices,
  categories,
  cities,
  InsertUser,
  jobs,
  localities,
  subcategories,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

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
  return db.select({ category: categories, subcategory: subcategories }).from(categories).leftJoin(subcategories, eq(subcategories.categoryId, categories.id)).orderBy(categories.sortOrder, subcategories.sortOrder);
}
