ALTER TABLE `bulk_imports` ADD `aiRewriteBatchId` varchar(64);--> statement-breakpoint
CREATE INDEX `bulk_import_ai_batch_idx` ON `bulk_imports` (`aiRewriteBatchId`);