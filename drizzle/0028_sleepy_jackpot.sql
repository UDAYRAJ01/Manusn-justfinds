ALTER TABLE `bulk_imports` ADD `sourcePartCursor` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bulk_imports` ADD `csvParserState` json;