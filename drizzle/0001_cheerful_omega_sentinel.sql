CREATE TABLE `bulk_import_rows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`importId` int NOT NULL,
	`rowNumber` int NOT NULL,
	`data` json NOT NULL,
	`validationErrors` json,
	`duplicateCandidateId` int,
	`status` enum('pending','valid','invalid','imported','duplicate') NOT NULL DEFAULT 'pending',
	CONSTRAINT `bulk_import_rows_id` PRIMARY KEY(`id`),
	CONSTRAINT `import_row_number_uidx` UNIQUE(`importId`,`rowNumber`)
);
--> statement-breakpoint
CREATE TABLE `bulk_imports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`initiatedById` int NOT NULL,
	`filename` varchar(255) NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`totalRows` int NOT NULL DEFAULT 0,
	`validRows` int NOT NULL DEFAULT 0,
	`failedRows` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bulk_imports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_ai_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`seoTitle` varchar(180),
	`metaDescription` varchar(300),
	`about` text,
	`faqs` json,
	`sourceHash` varchar(128),
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`generatedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_ai_content_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_content_business_uidx` UNIQUE(`businessId`)
);
--> statement-breakpoint
CREATE TABLE `business_certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`certificateId` varchar(64) NOT NULL,
	`verificationUrl` varchar(500) NOT NULL,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_certificates_certificateId_unique` UNIQUE(`certificateId`)
);
--> statement-breakpoint
CREATE TABLE `business_domains` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`domain` varchar(253) NOT NULL,
	`verificationToken` varchar(128) NOT NULL,
	`status` enum('pending','verified','active','failed') NOT NULL DEFAULT 'pending',
	`sslStatus` enum('pending','active','failed') NOT NULL DEFAULT 'pending',
	`isPrimary` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_domains_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_domains_domain_unique` UNIQUE(`domain`)
);
--> statement-breakpoint
CREATE TABLE `business_field_values` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`categoryFieldId` int NOT NULL,
	`value` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_field_values_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_field_value_uidx` UNIQUE(`businessId`,`categoryFieldId`)
);
--> statement-breakpoint
CREATE TABLE `business_hours` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`opensAt` varchar(5),
	`closesAt` varchar(5),
	`isClosed` boolean NOT NULL DEFAULT false,
	`isTwentyFourHours` boolean NOT NULL DEFAULT false,
	CONSTRAINT `business_hours_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`url` varchar(1000) NOT NULL,
	`alt` varchar(240),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`phone` varchar(32),
	`email` varchar(320),
	`message` text,
	`source` varchar(100) NOT NULL DEFAULT 'business-page',
	`page` varchar(500),
	`status` enum('new','contacted','qualified','converted','closed') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`content` text,
	`status` enum('pending','published','reported','removed') NOT NULL DEFAULT 'pending',
	`businessResponse` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `review_business_user_uidx` UNIQUE(`businessId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `business_services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `business_services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int,
	`categoryId` int NOT NULL,
	`subcategoryId` int,
	`cityId` int NOT NULL,
	`localityId` int,
	`name` varchar(220) NOT NULL,
	`slug` varchar(240) NOT NULL,
	`shortDescription` text,
	`approvedDescription` text,
	`address` text NOT NULL,
	`postcode` varchar(20),
	`phone` varchar(32),
	`whatsapp` varchar(32),
	`website` varchar(500),
	`heroImageUrl` varchar(1000),
	`latitude` varchar(24),
	`longitude` varchar(24),
	`status` enum('draft','submitted','under_review','approved','published','rejected','suspended') NOT NULL DEFAULT 'draft',
	`isVerified` boolean NOT NULL DEFAULT false,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`manualPriority` int NOT NULL DEFAULT 0,
	`profileCompleteness` int NOT NULL DEFAULT 0,
	`recommendationScore` int NOT NULL DEFAULT 0,
	`reputationScore` int NOT NULL DEFAULT 0,
	`landingPageConfig` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`publishedAt` timestamp,
	CONSTRAINT `businesses_id` PRIMARY KEY(`id`),
	CONSTRAINT `businesses_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`description` text,
	`icon` varchar(100) NOT NULL DEFAULT 'Sparkles',
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `category_fields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`subcategoryId` int,
	`fieldKey` varchar(80) NOT NULL,
	`label` varchar(120) NOT NULL,
	`fieldType` enum('text','number','select','multiselect','boolean','url','textarea') NOT NULL,
	`options` json,
	`isRequired` boolean NOT NULL DEFAULT false,
	`isPublic` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `category_fields_id` PRIMARY KEY(`id`),
	CONSTRAINT `field_schema_key_uidx` UNIQUE(`categoryId`,`fieldKey`)
);
--> statement-breakpoint
CREATE TABLE `cities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`slug` varchar(140) NOT NULL,
	`state` varchar(120),
	`latitude` varchar(24),
	`longitude` varchar(24),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cities_id` PRIMARY KEY(`id`),
	CONSTRAINT `cities_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `job_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`userId` int NOT NULL,
	`resumeUrl` varchar(1000),
	`note` text,
	`status` enum('submitted','viewed','shortlisted','rejected','hired') NOT NULL DEFAULT 'submitted',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `job_applications_id` PRIMARY KEY(`id`),
	CONSTRAINT `application_job_user_uidx` UNIQUE(`jobId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int,
	`postedById` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`slug` varchar(210) NOT NULL,
	`description` text NOT NULL,
	`cityId` int,
	`category` varchar(100) NOT NULL,
	`experience` varchar(80),
	`salary` varchar(100),
	`jobType` enum('full_time','part_time','contract','internship','freelance') NOT NULL,
	`status` enum('draft','submitted','approved','published','rejected','closed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`publishedAt` timestamp,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `jobs_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `localities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cityId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`latitude` varchar(24),
	`longitude` varchar(24),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `localities_id` PRIMARY KEY(`id`),
	CONSTRAINT `locality_city_slug_uidx` UNIQUE(`cityId`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `search_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`businessId` int,
	`action` enum('search','impression','click','call','whatsapp','directions','website','save','inquiry') NOT NULL,
	`query` varchar(300),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `search_interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subcategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subcategories_id` PRIMARY KEY(`id`),
	CONSTRAINT `subcategory_category_slug_uidx` UNIQUE(`categoryId`,`slug`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','business_owner','admin','super_admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `bulk_import_rows` ADD CONSTRAINT `bulk_import_rows_importId_bulk_imports_id_fk` FOREIGN KEY (`importId`) REFERENCES `bulk_imports`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bulk_import_rows` ADD CONSTRAINT `bulk_import_rows_duplicateCandidateId_businesses_id_fk` FOREIGN KEY (`duplicateCandidateId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bulk_imports` ADD CONSTRAINT `bulk_imports_initiatedById_users_id_fk` FOREIGN KEY (`initiatedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_ai_content` ADD CONSTRAINT `business_ai_content_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_certificates` ADD CONSTRAINT `business_certificates_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_domains` ADD CONSTRAINT `business_domains_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_field_values` ADD CONSTRAINT `business_field_values_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_field_values` ADD CONSTRAINT `business_field_values_categoryFieldId_category_fields_id_fk` FOREIGN KEY (`categoryFieldId`) REFERENCES `category_fields`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_hours` ADD CONSTRAINT `business_hours_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_images` ADD CONSTRAINT `business_images_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_leads` ADD CONSTRAINT `business_leads_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_reviews` ADD CONSTRAINT `business_reviews_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_reviews` ADD CONSTRAINT `business_reviews_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_services` ADD CONSTRAINT `business_services_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `businesses` ADD CONSTRAINT `businesses_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `businesses` ADD CONSTRAINT `businesses_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `businesses` ADD CONSTRAINT `businesses_subcategoryId_subcategories_id_fk` FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `businesses` ADD CONSTRAINT `businesses_cityId_cities_id_fk` FOREIGN KEY (`cityId`) REFERENCES `cities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `businesses` ADD CONSTRAINT `businesses_localityId_localities_id_fk` FOREIGN KEY (`localityId`) REFERENCES `localities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `category_fields` ADD CONSTRAINT `category_fields_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `category_fields` ADD CONSTRAINT `category_fields_subcategoryId_subcategories_id_fk` FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_postedById_users_id_fk` FOREIGN KEY (`postedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_cityId_cities_id_fk` FOREIGN KEY (`cityId`) REFERENCES `cities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `localities` ADD CONSTRAINT `localities_cityId_cities_id_fk` FOREIGN KEY (`cityId`) REFERENCES `cities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `search_interactions` ADD CONSTRAINT `search_interactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `search_interactions` ADD CONSTRAINT `search_interactions_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subcategories` ADD CONSTRAINT `subcategories_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `import_row_status_idx` ON `bulk_import_rows` (`importId`,`status`);--> statement-breakpoint
CREATE INDEX `bulk_import_status_idx` ON `bulk_imports` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `hours_business_day_idx` ON `business_hours` (`businessId`,`dayOfWeek`);--> statement-breakpoint
CREATE INDEX `lead_business_status_idx` ON `business_leads` (`businessId`,`status`);--> statement-breakpoint
CREATE INDEX `review_moderation_idx` ON `business_reviews` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `business_public_search_idx` ON `businesses` (`status`,`categoryId`,`cityId`);--> statement-breakpoint
CREATE INDEX `business_geo_idx` ON `businesses` (`latitude`,`longitude`);--> statement-breakpoint
CREATE INDEX `business_owner_idx` ON `businesses` (`ownerId`);--> statement-breakpoint
CREATE INDEX `business_rank_idx` ON `businesses` (`status`,`manualPriority`,`recommendationScore`);--> statement-breakpoint
CREATE INDEX `category_active_sort_idx` ON `categories` (`isActive`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `field_category_idx` ON `category_fields` (`categoryId`);--> statement-breakpoint
CREATE INDEX `cities_name_idx` ON `cities` (`name`);--> statement-breakpoint
CREATE INDEX `job_public_search_idx` ON `jobs` (`status`,`cityId`,`category`);--> statement-breakpoint
CREATE INDEX `job_poster_idx` ON `jobs` (`postedById`);--> statement-breakpoint
CREATE INDEX `locality_city_idx` ON `localities` (`cityId`);--> statement-breakpoint
CREATE INDEX `interaction_business_action_idx` ON `search_interactions` (`businessId`,`action`);--> statement-breakpoint
CREATE INDEX `interaction_user_idx` ON `search_interactions` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `subcategory_category_idx` ON `subcategories` (`categoryId`);