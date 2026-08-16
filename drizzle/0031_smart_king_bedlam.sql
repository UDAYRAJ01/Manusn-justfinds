CREATE TABLE `ai_generation_batches` (
	`id` varchar(64) NOT NULL,
	`requestedById` int NOT NULL,
	`scheduleCronTaskUid` varchar(96),
	`status` enum('queued','processing','completed','cancelled') NOT NULL DEFAULT 'queued',
	`totalJobs` int NOT NULL DEFAULT 0,
	`completedJobs` int NOT NULL DEFAULT 0,
	`failedJobs` int NOT NULL DEFAULT 0,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`finishedAt` timestamp,
	CONSTRAINT `ai_generation_batches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ai_generation_batches` ADD CONSTRAINT `ai_generation_batches_requestedById_users_id_fk` FOREIGN KEY (`requestedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ai_batch_status_created_idx` ON `ai_generation_batches` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ai_batch_task_idx` ON `ai_generation_batches` (`scheduleCronTaskUid`,`status`);--> statement-breakpoint
CREATE INDEX `ai_batch_requester_idx` ON `ai_generation_batches` (`requestedById`,`createdAt`);