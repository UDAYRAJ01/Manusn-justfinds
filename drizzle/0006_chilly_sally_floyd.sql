CREATE TABLE `business_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('claim_requested','under_review','verification_required','approved','rejected') NOT NULL DEFAULT 'claim_requested',
	`evidenceNote` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`reviewedBy` int,
	`rejectionReason` text,
	CONSTRAINT `business_claims_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`itemType` enum('product','menu','room','consultation') NOT NULL DEFAULT 'product',
	`name` varchar(180) NOT NULL,
	`description` text,
	`price` varchar(80),
	`imageUrl` varchar(1000),
	`isEnabled` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessId` int,
	`type` varchar(80) NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text,
	`discount` varchar(80),
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`terms` text,
	`cta` varchar(120),
	`status` enum('draft','active','expired') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_revisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`createdBy` int NOT NULL,
	`changeType` varchar(80) NOT NULL,
	`payload` json NOT NULL,
	`status` enum('draft','submitted','approved','rejected') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_revisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_special_hours` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`label` varchar(160) NOT NULL,
	`isClosed` boolean NOT NULL DEFAULT false,
	`intervals` json,
	CONSTRAINT `business_special_hours_id` PRIMARY KEY(`id`),
	CONSTRAINT `special_hours_business_date_uidx` UNIQUE(`businessId`,`date`)
);
--> statement-breakpoint
CREATE TABLE `owner_notification_prefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emailEnabled` boolean NOT NULL DEFAULT true,
	`leadAlerts` boolean NOT NULL DEFAULT true,
	`reviewAlerts` boolean NOT NULL DEFAULT true,
	`statusAlerts` boolean NOT NULL DEFAULT true,
	CONSTRAINT `owner_notification_prefs_id` PRIMARY KEY(`id`),
	CONSTRAINT `owner_notification_prefs_user_uidx` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `business_leads` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `business_reviews` ADD `respondedAt` timestamp;--> statement-breakpoint
ALTER TABLE `business_services` ADD `price` varchar(80);--> statement-breakpoint
ALTER TABLE `business_services` ADD `priceType` enum('fixed','starting_from','contact','free') DEFAULT 'contact' NOT NULL;--> statement-breakpoint
ALTER TABLE `business_services` ADD `duration` varchar(80);--> statement-breakpoint
ALTER TABLE `business_services` ADD `imageUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `business_services` ADD `isEnabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `aboutDescription` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `socialLinks` json;--> statement-breakpoint
ALTER TABLE `businesses` ADD `seoTitle` varchar(180);--> statement-breakpoint
ALTER TABLE `businesses` ADD `metaDescription` varchar(300);--> statement-breakpoint
ALTER TABLE `businesses` ADD `rejectionReason` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `onboardingStep` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `business_claims` ADD CONSTRAINT `business_claims_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_claims` ADD CONSTRAINT `business_claims_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_claims` ADD CONSTRAINT `business_claims_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_items` ADD CONSTRAINT `business_items_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_notifications` ADD CONSTRAINT `business_notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_notifications` ADD CONSTRAINT `business_notifications_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_offers` ADD CONSTRAINT `business_offers_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_revisions` ADD CONSTRAINT `business_revisions_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_revisions` ADD CONSTRAINT `business_revisions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_special_hours` ADD CONSTRAINT `business_special_hours_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `owner_notification_prefs` ADD CONSTRAINT `owner_notification_prefs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `claim_user_status_idx` ON `business_claims` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `claim_business_idx` ON `business_claims` (`businessId`);--> statement-breakpoint
CREATE INDEX `item_business_type_idx` ON `business_items` (`businessId`,`itemType`);--> statement-breakpoint
CREATE INDEX `notification_user_read_idx` ON `business_notifications` (`userId`,`isRead`,`createdAt`);--> statement-breakpoint
CREATE INDEX `offer_business_status_idx` ON `business_offers` (`businessId`,`status`,`endsAt`);--> statement-breakpoint
CREATE INDEX `revision_business_status_idx` ON `business_revisions` (`businessId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `service_business_idx` ON `business_services` (`businessId`);