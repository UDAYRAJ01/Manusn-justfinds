CREATE TABLE `ai_content_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`contentType` enum('short_description','about_business','seo_title','meta_description','faq','service_description','category_description','local_landing','business_highlights','cta_copy') NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`content` text NOT NULL,
	`structured` json,
	`sourceFields` json,
	`validationFlags` json,
	`reviewRequired` boolean NOT NULL DEFAULT false,
	`status` enum('draft','pending_review','approved','published','rejected') NOT NULL DEFAULT 'draft',
	`authorship` enum('ai_generated','owner_edited','admin_edited') NOT NULL DEFAULT 'ai_generated',
	`provider` varchar(80),
	`model` varchar(120),
	`promptTemplate` varchar(80),
	`promptVersion` int NOT NULL DEFAULT 1,
	`contentHash` varchar(128),
	`generatedById` int,
	`reviewedById` int,
	`reviewNote` text,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`publishedAt` timestamp,
	CONSTRAINT `ai_content_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_content_version_uidx` UNIQUE(`businessId`,`contentType`,`version`)
);
--> statement-breakpoint
CREATE TABLE `ai_generation_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`contentType` enum('short_description','about_business','seo_title','meta_description','faq','service_description','category_description','local_landing','business_highlights','cta_copy') NOT NULL,
	`status` enum('queued','processing','completed','failed','retrying','cancelled') NOT NULL DEFAULT 'queued',
	`batchId` varchar(64),
	`requestedById` int NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`maxAttempts` int NOT NULL DEFAULT 3,
	`errorCategory` varchar(80),
	`resultVersionId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`finishedAt` timestamp,
	CONSTRAINT `ai_generation_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_usage_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int,
	`jobId` int,
	`generationType` varchar(80) NOT NULL,
	`provider` varchar(80),
	`model` varchar(120),
	`promptTokens` int,
	`completionTokens` int,
	`totalTokens` int,
	`estimatedCostMicros` int,
	`costAvailable` boolean NOT NULL DEFAULT false,
	`succeeded` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_usage_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`message` text NOT NULL,
	`answered` boolean NOT NULL DEFAULT true,
	`knowledgeItemIds` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_chat_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`userId` int,
	`messageCount` int NOT NULL DEFAULT 0,
	`unansweredCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastMessageAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_chat_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `chat_session_uidx` UNIQUE(`businessId`,`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `business_knowledge_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`sourceType` enum('profile','service','facility','hours','offer','faq','category_field','owner_content','ai_content') NOT NULL,
	`sourceId` int,
	`label` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`status` enum('active','stale','disabled') NOT NULL DEFAULT 'active',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_knowledge_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `knowledge_scope_uidx` UNIQUE(`businessId`,`sourceType`,`label`)
);
--> statement-breakpoint
CREATE TABLE `business_recommendation_signals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`relevanceScore` int NOT NULL DEFAULT 0,
	`distanceScore` int NOT NULL DEFAULT 0,
	`ratingScore` int NOT NULL DEFAULT 0,
	`reviewScore` int NOT NULL DEFAULT 0,
	`completenessScore` int NOT NULL DEFAULT 0,
	`verificationScore` int NOT NULL DEFAULT 0,
	`activityScore` int NOT NULL DEFAULT 0,
	`availabilityScore` int NOT NULL DEFAULT 0,
	`freshnessScore` int NOT NULL DEFAULT 0,
	`manualPriorityScore` int NOT NULL DEFAULT 0,
	`featuredScore` int NOT NULL DEFAULT 0,
	`recommendationScore` int NOT NULL DEFAULT 0,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_recommendation_signals_id` PRIMARY KEY(`id`),
	CONSTRAINT `recommendation_signal_business_uidx` UNIQUE(`businessId`)
);
--> statement-breakpoint
CREATE TABLE `business_unanswered_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`question` varchar(400) NOT NULL,
	`questionHash` varchar(128) NOT NULL,
	`askCount` int NOT NULL DEFAULT 1,
	`status` enum('open','resolved','dismissed') NOT NULL DEFAULT 'open',
	`resolutionNote` text,
	`firstAskedAt` timestamp NOT NULL DEFAULT (now()),
	`lastAskedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_unanswered_questions_id` PRIMARY KEY(`id`),
	CONSTRAINT `unanswered_scope_uidx` UNIQUE(`businessId`,`questionHash`)
);
--> statement-breakpoint
CREATE TABLE `recommendation_weights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`signalKey` varchar(60) NOT NULL,
	`label` varchar(120) NOT NULL,
	`weightPercent` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`updatedById` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recommendation_weights_id` PRIMARY KEY(`id`),
	CONSTRAINT `recommendation_weights_signalKey_unique` UNIQUE(`signalKey`)
);
--> statement-breakpoint
ALTER TABLE `ai_content_versions` ADD CONSTRAINT `ai_content_versions_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_content_versions` ADD CONSTRAINT `ai_content_versions_generatedById_users_id_fk` FOREIGN KEY (`generatedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_content_versions` ADD CONSTRAINT `ai_content_versions_reviewedById_users_id_fk` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_generation_jobs` ADD CONSTRAINT `ai_generation_jobs_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_generation_jobs` ADD CONSTRAINT `ai_generation_jobs_requestedById_users_id_fk` FOREIGN KEY (`requestedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_generation_jobs` ADD CONSTRAINT `ai_generation_jobs_resultVersionId_ai_content_versions_id_fk` FOREIGN KEY (`resultVersionId`) REFERENCES `ai_content_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_usage_events` ADD CONSTRAINT `ai_usage_events_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_usage_events` ADD CONSTRAINT `ai_usage_events_jobId_ai_generation_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `ai_generation_jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_chat_messages` ADD CONSTRAINT `business_chat_messages_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_chat_sessions` ADD CONSTRAINT `business_chat_sessions_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_chat_sessions` ADD CONSTRAINT `business_chat_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_knowledge_items` ADD CONSTRAINT `business_knowledge_items_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_recommendation_signals` ADD CONSTRAINT `business_recommendation_signals_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_unanswered_questions` ADD CONSTRAINT `business_unanswered_questions_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recommendation_weights` ADD CONSTRAINT `recommendation_weights_updatedById_users_id_fk` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ai_content_business_type_status_idx` ON `ai_content_versions` (`businessId`,`contentType`,`status`);--> statement-breakpoint
CREATE INDEX `ai_content_review_idx` ON `ai_content_versions` (`status`,`reviewRequired`);--> statement-breakpoint
CREATE INDEX `ai_content_hash_idx` ON `ai_content_versions` (`contentType`,`contentHash`);--> statement-breakpoint
CREATE INDEX `ai_job_status_created_idx` ON `ai_generation_jobs` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ai_job_business_idx` ON `ai_generation_jobs` (`businessId`,`status`);--> statement-breakpoint
CREATE INDEX `ai_job_batch_idx` ON `ai_generation_jobs` (`batchId`,`status`);--> statement-breakpoint
CREATE INDEX `ai_usage_created_idx` ON `ai_usage_events` (`createdAt`);--> statement-breakpoint
CREATE INDEX `ai_usage_business_idx` ON `ai_usage_events` (`businessId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `chat_message_scope_idx` ON `business_chat_messages` (`businessId`,`sessionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `chat_session_business_idx` ON `business_chat_sessions` (`businessId`,`lastMessageAt`);--> statement-breakpoint
CREATE INDEX `knowledge_business_status_idx` ON `business_knowledge_items` (`businessId`,`status`);--> statement-breakpoint
CREATE INDEX `recommendation_signal_score_idx` ON `business_recommendation_signals` (`recommendationScore`);--> statement-breakpoint
CREATE INDEX `unanswered_business_status_idx` ON `business_unanswered_questions` (`businessId`,`status`,`askCount`);