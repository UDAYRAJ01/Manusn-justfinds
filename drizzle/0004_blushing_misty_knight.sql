ALTER TABLE `search_interactions` ADD `sessionId` varchar(64);--> statement-breakpoint
ALTER TABLE `search_logs` ADD `categoryId` int;--> statement-breakpoint
ALTER TABLE `search_logs` ADD `subcategoryId` int;--> statement-breakpoint
ALTER TABLE `search_logs` ADD `localityId` int;--> statement-breakpoint
ALTER TABLE `search_logs` ADD `intent` varchar(32) DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `search_logs` ADD `sessionId` varchar(64);--> statement-breakpoint
ALTER TABLE `search_logs` ADD CONSTRAINT `search_logs_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `search_logs` ADD CONSTRAINT `search_logs_subcategoryId_subcategories_id_fk` FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `search_logs` ADD CONSTRAINT `search_logs_localityId_localities_id_fk` FOREIGN KEY (`localityId`) REFERENCES `localities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `interaction_session_idx` ON `search_interactions` (`sessionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `search_log_session_idx` ON `search_logs` (`sessionId`,`createdAt`);