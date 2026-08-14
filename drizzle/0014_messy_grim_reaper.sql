CREATE TABLE `google_imports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessId` int,
	`googleAccountId` varchar(120),
	`googleLocationId` varchar(120) NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`rawPayload` json,
	`status` enum('pending_review','imported','duplicate','error','approved','rejected') NOT NULL DEFAULT 'pending_review',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `google_imports_id` PRIMARY KEY(`id`),
	CONSTRAINT `google_location_uidx` UNIQUE(`googleLocationId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('business','job','application','lead','review','verification','admin','system') NOT NULL DEFAULT 'system',
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`actionUrl` varchar(500),
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`inAppEnabled` boolean NOT NULL DEFAULT true,
	`emailEnabled` boolean NOT NULL DEFAULT true,
	`whatsappEnabled` boolean NOT NULL DEFAULT false,
	`notifyBusiness` boolean NOT NULL DEFAULT true,
	`notifyJobs` boolean NOT NULL DEFAULT true,
	`notifyLeads` boolean NOT NULL DEFAULT true,
	`notifyReviews` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_notification_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `google_imports` ADD CONSTRAINT `google_imports_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `google_imports` ADD CONSTRAINT `google_imports_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_notification_preferences` ADD CONSTRAINT `user_notification_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `google_imports_user_idx` ON `google_imports` (`userId`);--> statement-breakpoint
CREATE INDEX `notification_user_read_idx` ON `notifications` (`userId`,`isRead`);--> statement-breakpoint
CREATE INDEX `notification_created_idx` ON `notifications` (`createdAt`);