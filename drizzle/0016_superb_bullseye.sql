CREATE TABLE `business_verification_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`verificationId` int NOT NULL,
	`actorId` int,
	`action` enum('submitted','approved','changes_requested') NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_verification_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `business_verification_events` ADD CONSTRAINT `bve_business_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_verification_events` ADD CONSTRAINT `bve_verification_fk` FOREIGN KEY (`verificationId`) REFERENCES `business_verifications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_verification_events` ADD CONSTRAINT `bve_actor_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `verification_event_verification_created_idx` ON `business_verification_events` (`verificationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `verification_event_business_idx` ON `business_verification_events` (`businessId`);
