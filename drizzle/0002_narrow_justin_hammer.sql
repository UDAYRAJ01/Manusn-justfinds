CREATE TABLE `approval_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('business','job','profile_change') NOT NULL,
	`businessId` int,
	`jobId` int,
	`submittedById` int NOT NULL,
	`status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`reviewerId` int,
	`reviewerNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `approval_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_facilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`details` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `business_facilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_rankings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`queryScope` varchar(180) NOT NULL DEFAULT 'default',
	`score` int NOT NULL DEFAULT 0,
	`factors` json,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_rankings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_reputation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`explanation` json,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_reputation_id` PRIMARY KEY(`id`),
	CONSTRAINT `reputation_business_uidx` UNIQUE(`businessId`)
);
--> statement-breakpoint
CREATE TABLE `business_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`status` enum('unverified','pending','verified','rejected') NOT NULL DEFAULT 'unverified',
	`evidenceUrl` varchar(1000),
	`reviewedById` int,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `business_verifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `verification_business_uidx` UNIQUE(`businessId`)
);
--> statement-breakpoint
CREATE TABLE `saved_businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_businesses_id` PRIMARY KEY(`id`),
	CONSTRAINT `saved_business_user_uidx` UNIQUE(`userId`,`businessId`)
);
--> statement-breakpoint
CREATE TABLE `search_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`query` varchar(300) NOT NULL,
	`cityId` int,
	`latitude` varchar(24),
	`longitude` varchar(24),
	`resultCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `search_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `category_fields` MODIFY COLUMN `fieldType` enum('text','textarea','number','currency','boolean','select','multiselect','multi_select','date','time','image','url','phone','email') NOT NULL;--> statement-breakpoint
ALTER TABLE `business_images` ADD `imageType` enum('logo','cover','gallery') DEFAULT 'gallery' NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `categories` ADD `imageUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `categories` ADD `status` enum('active','inactive') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `category_fields` ADD `placeholder` varchar(240);--> statement-breakpoint
ALTER TABLE `category_fields` ADD `validationRules` json;--> statement-breakpoint
ALTER TABLE `subcategories` ADD `description` text;--> statement-breakpoint
ALTER TABLE `subcategories` ADD `icon` varchar(100);--> statement-breakpoint
ALTER TABLE `subcategories` ADD `status` enum('active','inactive') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('active','suspended') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `approval_queue` ADD CONSTRAINT `approval_queue_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approval_queue` ADD CONSTRAINT `approval_queue_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approval_queue` ADD CONSTRAINT `approval_queue_submittedById_users_id_fk` FOREIGN KEY (`submittedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approval_queue` ADD CONSTRAINT `approval_queue_reviewerId_users_id_fk` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_facilities` ADD CONSTRAINT `business_facilities_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_rankings` ADD CONSTRAINT `business_rankings_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_reputation` ADD CONSTRAINT `business_reputation_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_verifications` ADD CONSTRAINT `business_verifications_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_verifications` ADD CONSTRAINT `business_verifications_reviewedById_users_id_fk` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_businesses` ADD CONSTRAINT `saved_businesses_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_businesses` ADD CONSTRAINT `saved_businesses_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `search_logs` ADD CONSTRAINT `search_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `search_logs` ADD CONSTRAINT `search_logs_cityId_cities_id_fk` FOREIGN KEY (`cityId`) REFERENCES `cities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `approval_status_created_idx` ON `approval_queue` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `approval_business_idx` ON `approval_queue` (`businessId`);--> statement-breakpoint
CREATE INDEX `facility_business_idx` ON `business_facilities` (`businessId`);--> statement-breakpoint
CREATE INDEX `ranking_business_scope_idx` ON `business_rankings` (`businessId`,`queryScope`);--> statement-breakpoint
CREATE INDEX `verification_status_idx` ON `business_verifications` (`status`);--> statement-breakpoint
CREATE INDEX `search_log_query_idx` ON `search_logs` (`query`,`createdAt`);--> statement-breakpoint
CREATE INDEX `search_log_user_idx` ON `search_logs` (`userId`,`createdAt`);