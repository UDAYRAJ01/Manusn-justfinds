import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const userRoleValues = ["user", "business_owner", "admin", "super_admin"] as const;
export const businessStatusValues = ["draft", "submitted", "under_review", "approved", "published", "rejected", "suspended"] as const;
export const importStatusValues = ["pending", "processing", "completed", "failed"] as const;

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  avatarUrl: varchar("avatarUrl", { length: 1000 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", userRoleValues).default("user").notNull(),
  status: mysqlEnum("status", ["active", "suspended"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const cities = mysqlTable("cities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  state: varchar("state", { length: 120 }),
  latitude: varchar("latitude", { length: 24 }),
  longitude: varchar("longitude", { length: 24 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("cities_name_idx").on(table.name)]);

export const localities = mysqlTable("localities", {
  id: int("id").autoincrement().primaryKey(),
  cityId: int("cityId").notNull().references(() => cities.id),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull(),
  latitude: varchar("latitude", { length: 24 }),
  longitude: varchar("longitude", { length: 24 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("locality_city_slug_uidx").on(table.cityId, table.slug), index("locality_city_idx").on(table.cityId)]);

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }).notNull().default("Sparkles"),
  imageUrl: varchar("imageUrl", { length: 1000 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("category_active_sort_idx").on(table.isActive, table.sortOrder)]);

export const subcategories = mysqlTable("subcategories", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull().references(() => categories.id),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("subcategory_category_slug_uidx").on(table.categoryId, table.slug), index("subcategory_category_idx").on(table.categoryId)]);

export const categoryFields = mysqlTable("category_fields", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull().references(() => categories.id),
  subcategoryId: int("subcategoryId").references(() => subcategories.id),
  fieldKey: varchar("fieldKey", { length: 80 }).notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  fieldType: mysqlEnum("fieldType", ["text", "textarea", "number", "currency", "boolean", "select", "multiselect", "multi_select", "date", "time", "image", "url", "phone", "email"]).notNull(),
  placeholder: varchar("placeholder", { length: 240 }),
  options: json("options"),
  validationRules: json("validationRules"),
  isRequired: boolean("isRequired").default(false).notNull(),
  isPublic: boolean("isPublic").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("field_schema_key_uidx").on(table.categoryId, table.fieldKey), index("field_category_idx").on(table.categoryId)]);

export const businesses = mysqlTable("businesses", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").references(() => users.id),
  categoryId: int("categoryId").notNull().references(() => categories.id),
  subcategoryId: int("subcategoryId").references(() => subcategories.id),
  cityId: int("cityId").notNull().references(() => cities.id),
  localityId: int("localityId").references(() => localities.id),
  name: varchar("name", { length: 220 }).notNull(),
  slug: varchar("slug", { length: 240 }).notNull().unique(),
  shortDescription: text("shortDescription"),
  approvedDescription: text("approvedDescription"),
  address: text("address").notNull(),
  postcode: varchar("postcode", { length: 20 }),
  phone: varchar("phone", { length: 32 }),
  whatsapp: varchar("whatsapp", { length: 32 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 500 }),
  heroImageUrl: varchar("heroImageUrl", { length: 1000 }),
  latitude: varchar("latitude", { length: 24 }),
  longitude: varchar("longitude", { length: 24 }),
  status: mysqlEnum("status", businessStatusValues).default("draft").notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  manualPriority: int("manualPriority").default(0).notNull(),
  profileCompleteness: int("profileCompleteness").default(0).notNull(),
  recommendationScore: int("recommendationScore").default(0).notNull(),
  reputationScore: int("reputationScore").default(0).notNull(),
  landingPageConfig: json("landingPageConfig"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  publishedAt: timestamp("publishedAt"),
}, table => [
  index("business_public_search_idx").on(table.status, table.categoryId, table.cityId),
  index("business_geo_idx").on(table.latitude, table.longitude),
  index("business_owner_idx").on(table.ownerId),
  index("business_rank_idx").on(table.status, table.manualPriority, table.recommendationScore),
]);

export const businessFieldValues = mysqlTable("business_field_values", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull().references(() => businesses.id),
  categoryFieldId: int("categoryFieldId").notNull().references(() => categoryFields.id),
  value: json("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("business_field_value_uidx").on(table.businessId, table.categoryFieldId)]);

export const businessHours = mysqlTable("business_hours", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull().references(() => businesses.id),
  dayOfWeek: int("dayOfWeek").notNull(),
  opensAt: varchar("opensAt", { length: 5 }),
  closesAt: varchar("closesAt", { length: 5 }),
  isClosed: boolean("isClosed").default(false).notNull(),
  isTwentyFourHours: boolean("isTwentyFourHours").default(false).notNull(),
}, table => [index("hours_business_day_idx").on(table.businessId, table.dayOfWeek)]);

export const businessServices = mysqlTable("business_services", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull().references(() => businesses.id),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export const businessImages = mysqlTable("business_images", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull().references(() => businesses.id),
  url: varchar("url", { length: 1000 }).notNull(),
  imageType: mysqlEnum("imageType", ["logo", "cover", "gallery"]).default("gallery").notNull(),
  alt: varchar("alt", { length: 240 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const businessReviews = mysqlTable("business_reviews", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull().references(() => businesses.id),
  userId: int("userId").notNull().references(() => users.id),
  rating: int("rating").notNull(),
  content: text("content"),
  status: mysqlEnum("status", ["pending", "published", "reported", "removed"]).default("pending").notNull(),
  businessResponse: text("businessResponse"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("review_business_user_uidx").on(table.businessId, table.userId), index("review_moderation_idx").on(table.status, table.createdAt)]);

export const businessLeads = mysqlTable("business_leads", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull().references(() => businesses.id),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 320 }),
  message: text("message"),
  source: varchar("source", { length: 100 }).notNull().default("business-page"),
  page: varchar("page", { length: 500 }),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "converted", "closed"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("lead_business_status_idx").on(table.businessId, table.status)]);

export const businessAiContent = mysqlTable("business_ai_content", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull().references(() => businesses.id),
  seoTitle: varchar("seoTitle", { length: 180 }),
  metaDescription: varchar("metaDescription", { length: 300 }),
  about: text("about"),
  faqs: json("faqs"),
  sourceHash: varchar("sourceHash", { length: 128 }),
  status: mysqlEnum("status", importStatusValues).default("pending").notNull(),
  generatedAt: timestamp("generatedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("ai_content_business_uidx").on(table.businessId)]);

export const businessDomains = mysqlTable("business_domains", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull().references(() => businesses.id),
  domain: varchar("domain", { length: 253 }).notNull().unique(),
  verificationToken: varchar("verificationToken", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["pending", "verified", "active", "failed"]).default("pending").notNull(),
  sslStatus: mysqlEnum("sslStatus", ["pending", "active", "failed"]).default("pending").notNull(),
  isPrimary: boolean("isPrimary").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const businessCertificates = mysqlTable("business_certificates", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull().references(() => businesses.id),
  certificateId: varchar("certificateId", { length: 64 }).notNull().unique(),
  verificationUrl: varchar("verificationUrl", { length: 500 }).notNull(),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
});

export const searchInteractions = mysqlTable("search_interactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  businessId: int("businessId").references(() => businesses.id),
  action: mysqlEnum("action", ["search", "impression", "click", "call", "whatsapp", "directions", "website", "save", "inquiry"]).notNull(),
  query: varchar("query", { length: 300 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("interaction_business_action_idx").on(table.businessId, table.action), index("interaction_user_idx").on(table.userId, table.createdAt)]);

export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").references(() => businesses.id),
  postedById: int("postedById").notNull().references(() => users.id),
  title: varchar("title", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 210 }).notNull().unique(),
  description: text("description").notNull(),
  cityId: int("cityId").references(() => cities.id),
  category: varchar("category", { length: 100 }).notNull(),
  experience: varchar("experience", { length: 80 }),
  salary: varchar("salary", { length: 100 }),
  jobType: mysqlEnum("jobType", ["full_time", "part_time", "contract", "internship", "freelance"]).notNull(),
  status: mysqlEnum("status", ["draft", "submitted", "approved", "published", "rejected", "closed"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  publishedAt: timestamp("publishedAt"),
}, table => [index("job_public_search_idx").on(table.status, table.cityId, table.category), index("job_poster_idx").on(table.postedById)]);

export const jobApplications = mysqlTable("job_applications", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull().references(() => jobs.id),
  userId: int("userId").notNull().references(() => users.id),
  resumeUrl: varchar("resumeUrl", { length: 1000 }),
  note: text("note"),
  status: mysqlEnum("status", ["submitted", "viewed", "shortlisted", "rejected", "hired"]).default("submitted").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("application_job_user_uidx").on(table.jobId, table.userId)]);

export const bulkImports = mysqlTable("bulk_imports", {
  id: int("id").autoincrement().primaryKey(),
  initiatedById: int("initiatedById").notNull().references(() => users.id),
  filename: varchar("filename", { length: 255 }).notNull(),
  status: mysqlEnum("status", importStatusValues).default("pending").notNull(),
  totalRows: int("totalRows").default(0).notNull(),
  validRows: int("validRows").default(0).notNull(),
  failedRows: int("failedRows").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("bulk_import_status_idx").on(table.status, table.createdAt)]);

export const bulkImportRows = mysqlTable("bulk_import_rows", {
  id: int("id").autoincrement().primaryKey(),
  importId: int("importId").notNull().references(() => bulkImports.id),
  rowNumber: int("rowNumber").notNull(),
  data: json("data").notNull(),
  validationErrors: json("validationErrors"),
  duplicateCandidateId: int("duplicateCandidateId").references(() => businesses.id),
  status: mysqlEnum("status", ["pending", "valid", "invalid", "imported", "duplicate"]).default("pending").notNull(),
}, table => [uniqueIndex("import_row_number_uidx").on(table.importId, table.rowNumber), index("import_row_status_idx").on(table.importId, table.status)]);

export const businessFacilities = mysqlTable("business_facilities", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull().references(() => businesses.id),
  name: varchar("name", { length: 160 }).notNull(),
  details: text("details"),
  sortOrder: int("sortOrder").default(0).notNull(),
}, table => [index("facility_business_idx").on(table.businessId)]);

export const businessVerifications = mysqlTable("business_verifications", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull().references(() => businesses.id),
  status: mysqlEnum("status", ["unverified", "pending", "verified", "rejected"]).default("unverified").notNull(),
  evidenceUrl: varchar("evidenceUrl", { length: 1000 }),
  reviewedById: int("reviewedById").references(() => users.id),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
}, table => [uniqueIndex("verification_business_uidx").on(table.businessId), index("verification_status_idx").on(table.status)]);

export const businessReputation = mysqlTable("business_reputation", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull().references(() => businesses.id),
  score: int("score").default(0).notNull(),
  explanation: json("explanation"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("reputation_business_uidx").on(table.businessId)]);

export const businessRankings = mysqlTable("business_rankings", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull().references(() => businesses.id),
  queryScope: varchar("queryScope", { length: 180 }).notNull().default("default"),
  score: int("score").default(0).notNull(),
  factors: json("factors"),
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
}, table => [index("ranking_business_scope_idx").on(table.businessId, table.queryScope)]);

export const approvalQueue = mysqlTable("approval_queue", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", ["business", "job", "profile_change"]).notNull(),
  businessId: int("businessId").references(() => businesses.id),
  jobId: int("jobId").references(() => jobs.id),
  submittedById: int("submittedById").notNull().references(() => users.id),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "cancelled"]).default("pending").notNull(),
  reviewerId: int("reviewerId").references(() => users.id),
  reviewerNote: text("reviewerNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
}, table => [index("approval_status_created_idx").on(table.status, table.createdAt), index("approval_business_idx").on(table.businessId)]);

export const savedBusinesses = mysqlTable("saved_businesses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  businessId: int("businessId").notNull().references(() => businesses.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("saved_business_user_uidx").on(table.userId, table.businessId)]);

export const searchLogs = mysqlTable("search_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  query: varchar("query", { length: 300 }).notNull(),
  cityId: int("cityId").references(() => cities.id),
  latitude: varchar("latitude", { length: 24 }),
  longitude: varchar("longitude", { length: 24 }),
  resultCount: int("resultCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("search_log_query_idx").on(table.query, table.createdAt), index("search_log_user_idx").on(table.userId, table.createdAt)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Business = typeof businesses.$inferSelect;
