CREATE TABLE `business_lead_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`leadId` int NOT NULL,
	`authorId` int NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_lead_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_verification_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`verificationId` int NOT NULL,
	`uploadedById` int NOT NULL,
	`documentType` enum('registration','licence','address_proof','ownership_proof','other') NOT NULL,
	`storageKey` varchar(1000) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`fileSize` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_verification_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `business_leads` ADD `sourceDetail` varchar(240);--> statement-breakpoint
ALTER TABLE `business_leads` ADD `assignedToId` int;--> statement-breakpoint
ALTER TABLE `business_leads` ADD `followUpAt` timestamp;--> statement-breakpoint
ALTER TABLE `business_leads` ADD `lastContactedAt` timestamp;--> statement-breakpoint
ALTER TABLE `business_leads` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `business_verifications` ADD `submissionNote` text;--> statement-breakpoint
ALTER TABLE `business_verifications` ADD `submittedAt` timestamp;--> statement-breakpoint
ALTER TABLE `business_lead_notes` ADD CONSTRAINT `business_lead_notes_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_lead_notes` ADD CONSTRAINT `business_lead_notes_leadId_business_leads_id_fk` FOREIGN KEY (`leadId`) REFERENCES `business_leads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_lead_notes` ADD CONSTRAINT `business_lead_notes_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_verification_documents` ADD CONSTRAINT `business_verification_documents_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_verification_documents` ADD CONSTRAINT `bvd_verification_fk` FOREIGN KEY (`verificationId`) REFERENCES `business_verifications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_verification_documents` ADD CONSTRAINT `bvd_uploader_fk` FOREIGN KEY (`uploadedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `lead_note_lead_created_idx` ON `business_lead_notes` (`leadId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `lead_note_business_idx` ON `business_lead_notes` (`businessId`);--> statement-breakpoint
CREATE INDEX `verification_document_verification_idx` ON `business_verification_documents` (`verificationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `verification_document_business_idx` ON `business_verification_documents` (`businessId`);--> statement-breakpoint
ALTER TABLE `business_leads` ADD CONSTRAINT `bl_assignee_fk` FOREIGN KEY (`assignedToId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `lead_business_follow_up_idx` ON `business_leads` (`businessId`,`followUpAt`);--> statement-breakpoint
CREATE INDEX `lead_assignee_idx` ON `business_leads` (`assignedToId`,`updatedAt`);
