CREATE TABLE `bulk_import_source_chunks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`importId` int NOT NULL,
	`partNumber` int NOT NULL,
	`storageKey` varchar(1000) NOT NULL,
	`byteSize` int NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bulk_import_source_chunks_id` PRIMARY KEY(`id`),
	CONSTRAINT `bulk_import_source_part_uidx` UNIQUE(`importId`,`partNumber`)
);
--> statement-breakpoint
ALTER TABLE `bulk_import_source_chunks` ADD CONSTRAINT `bulk_import_source_chunks_importId_bulk_imports_id_fk` FOREIGN KEY (`importId`) REFERENCES `bulk_imports`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `bulk_import_source_import_idx` ON `bulk_import_source_chunks` (`importId`,`partNumber`);