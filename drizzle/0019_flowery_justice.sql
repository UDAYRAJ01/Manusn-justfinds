CREATE TABLE `business_profile_section_saves` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`userId` int NOT NULL,
	`sectionKey` varchar(40) NOT NULL,
	`savedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_profile_section_saves_id` PRIMARY KEY(`id`),
	CONSTRAINT `profile_section_business_user_uidx` UNIQUE(`businessId`,`userId`,`sectionKey`)
);
--> statement-breakpoint
ALTER TABLE `business_profile_section_saves` ADD CONSTRAINT `business_profile_section_saves_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_profile_section_saves` ADD CONSTRAINT `business_profile_section_saves_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `profile_section_business_idx` ON `business_profile_section_saves` (`businessId`,`savedAt`);