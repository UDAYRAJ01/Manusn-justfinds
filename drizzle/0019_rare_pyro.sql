CREATE TABLE `google_place_category_mappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`googlePrimaryType` varchar(160) NOT NULL,
	`categoryId` int NOT NULL,
	`subcategoryId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `google_place_category_mappings_id` PRIMARY KEY(`id`),
	CONSTRAINT `google_place_type_uidx` UNIQUE(`googlePrimaryType`)
);
--> statement-breakpoint
ALTER TABLE `google_imports` MODIFY COLUMN `status` enum('draft','pending_review','imported','duplicate','error','approved','rejected','finalized') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `google_imports` ADD `importSessionId` varchar(64);--> statement-breakpoint
ALTER TABLE `google_imports` ADD `categoryHint` varchar(180);--> statement-breakpoint
ALTER TABLE `google_imports` ADD `formattedAddress` text;--> statement-breakpoint
ALTER TABLE `google_imports` ADD `addressComponents` json;--> statement-breakpoint
ALTER TABLE `google_imports` ADD `fieldSources` json;--> statement-breakpoint
ALTER TABLE `google_imports` ADD `duplicateBusinessId` int;--> statement-breakpoint
ALTER TABLE `google_place_category_mappings` ADD CONSTRAINT `gpcm_cat_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `google_place_category_mappings` ADD CONSTRAINT `gpcm_subcat_fk` FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `google_place_category_idx` ON `google_place_category_mappings` (`categoryId`,`isActive`);--> statement-breakpoint
ALTER TABLE `google_imports` ADD CONSTRAINT `gi_dup_business_fk` FOREIGN KEY (`duplicateBusinessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `google_imports_business_idx` ON `google_imports` (`businessId`);--> statement-breakpoint
CREATE INDEX `google_imports_duplicate_idx` ON `google_imports` (`duplicateBusinessId`);
