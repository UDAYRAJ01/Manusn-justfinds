CREATE TABLE `business_review_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reviewId` int NOT NULL,
	`reporterId` int NOT NULL,
	`reason` varchar(240) NOT NULL,
	`details` text,
	`status` enum('pending','reviewed','dismissed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_review_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `business_review_reports` ADD CONSTRAINT `business_review_reports_reviewId_business_reviews_id_fk` FOREIGN KEY (`reviewId`) REFERENCES `business_reviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_review_reports` ADD CONSTRAINT `business_review_reports_reporterId_users_id_fk` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `review_report_status_idx` ON `business_review_reports` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `review_report_review_idx` ON `business_review_reports` (`reviewId`);