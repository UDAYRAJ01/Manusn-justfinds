ALTER TABLE `bulk_import_rows` MODIFY COLUMN `status` enum('pending','valid','invalid','imported','duplicate','processing') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `bulk_imports` MODIFY COLUMN `status` enum('pending','queued','processing','completed','failed','retrying','cancelled') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `bulk_import_rows` ADD `fingerprint` varchar(260);--> statement-breakpoint
ALTER TABLE `bulk_imports` ADD `phase` enum('staged','validating','ready','importing','completed','failed','cancelled') DEFAULT 'staged' NOT NULL;--> statement-breakpoint
ALTER TABLE `bulk_imports` ADD `sourceFileKey` varchar(1000);--> statement-breakpoint
ALTER TABLE `bulk_imports` ADD `sourceFileContentType` varchar(120);--> statement-breakpoint
ALTER TABLE `bulk_imports` ADD `sourceFileSize` int;--> statement-breakpoint
ALTER TABLE `bulk_imports` ADD `validationCursor` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bulk_imports` ADD `processedRows` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bulk_imports` ADD `progressPercent` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bulk_imports` ADD `attempts` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bulk_imports` ADD `maxAttempts` int DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE `bulk_imports` ADD `errorCategory` varchar(80);--> statement-breakpoint
ALTER TABLE `bulk_imports` ADD `errorMessage` text;--> statement-breakpoint
ALTER TABLE `bulk_imports` ADD `startedAt` timestamp;--> statement-breakpoint
ALTER TABLE `bulk_imports` ADD `finishedAt` timestamp;--> statement-breakpoint
ALTER TABLE `bulk_imports` ADD `cancelledAt` timestamp;--> statement-breakpoint
ALTER TABLE `bulk_import_rows` ADD CONSTRAINT `import_row_fingerprint_uidx` UNIQUE(`importId`,`fingerprint`);--> statement-breakpoint
CREATE INDEX `bulk_import_phase_progress_idx` ON `bulk_imports` (`phase`,`status`,`updatedAt`);