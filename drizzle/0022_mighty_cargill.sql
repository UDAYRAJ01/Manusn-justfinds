CREATE TABLE `business_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subcategoryId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`slug` varchar(140) NOT NULL,
	`description` text,
	`icon` varchar(100),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_type_subcategory_slug_uidx` UNIQUE(`subcategoryId`,`slug`)
);
--> statement-breakpoint
ALTER TABLE `businesses` ADD `businessTypeId` int;--> statement-breakpoint
ALTER TABLE `business_types` ADD CONSTRAINT `business_types_subcategoryId_subcategories_id_fk` FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `business_type_subcategory_idx` ON `business_types` (`subcategoryId`);--> statement-breakpoint
ALTER TABLE `businesses` ADD CONSTRAINT `businesses_businessTypeId_business_types_id_fk` FOREIGN KEY (`businessTypeId`) REFERENCES `business_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `business_taxonomy_idx` ON `businesses` (`status`,`categoryId`,`subcategoryId`,`businessTypeId`);