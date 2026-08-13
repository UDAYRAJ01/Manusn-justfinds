ALTER TABLE `page_publish_history` MODIFY COLUMN `action` enum('publish','unpublish','restore','submit_review') NOT NULL;--> statement-breakpoint
ALTER TABLE `page_publish_history` ADD `reviewNote` text;--> statement-breakpoint
ALTER TABLE `page_publish_history` ADD `reviewedById` int;--> statement-breakpoint
ALTER TABLE `page_publish_history` ADD CONSTRAINT `page_publish_history_reviewedById_users_id_fk` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;