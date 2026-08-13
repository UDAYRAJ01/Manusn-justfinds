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
	`progressPercent` int NOT NULL DEFAULT 0,
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
CREATE TABLE `business_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`slug` varchar(240) NOT NULL,
	`status` enum('draft','pending_review','published','unpublished') NOT NULL DEFAULT 'draft',
	`seoTitle` varchar(180),
	`metaDescription` varchar(300),
	`canonicalUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`publishedAt` timestamp,
	CONSTRAINT `business_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_page_business_uidx` UNIQUE(`businessId`),
	CONSTRAINT `business_page_slug_uidx` UNIQUE(`slug`)
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
CREATE TABLE `page_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`pageId` int NOT NULL,
	`sectionId` int,
	`eventType` enum('page_view','cta_click','lead_start','lead_submit','call_click','whatsapp_click','website_click','directions','scroll_depth','section_interaction') NOT NULL,
	`source` varchar(100),
	`campaign` varchar(120),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `page_publish_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` int NOT NULL,
	`businessId` int NOT NULL,
	`versionId` int NOT NULL,
	`action` enum('publish','unpublish','restore') NOT NULL,
	`performedById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_publish_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `page_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` int NOT NULL,
	`sectionType` varchar(60) NOT NULL,
	`displayOrder` int NOT NULL DEFAULT 0,
	`enabled` boolean NOT NULL DEFAULT true,
	`config` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `page_sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `page_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` int NOT NULL,
	`businessId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`designConfig` json NOT NULL,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `page_version_number_uidx` UNIQUE(`pageId`,`versionNumber`)
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
ALTER TABLE `search_interactions` MODIFY COLUMN `action` enum('search','impression','click','call','whatsapp','directions','website','save','inquiry','share') NOT NULL;--> statement-breakpoint
ALTER TABLE `business_hours` ADD `intervals` json;--> statement-breakpoint
ALTER TABLE `business_leads` ADD `consentGiven` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `business_leads` ADD `consentAt` timestamp;--> statement-breakpoint
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
ALTER TABLE `business_pages` ADD CONSTRAINT `business_pages_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_recommendation_signals` ADD CONSTRAINT `business_recommendation_signals_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_review_reports` ADD CONSTRAINT `business_review_reports_reviewId_business_reviews_id_fk` FOREIGN KEY (`reviewId`) REFERENCES `business_reviews`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_review_reports` ADD CONSTRAINT `business_review_reports_reporterId_users_id_fk` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_unanswered_questions` ADD CONSTRAINT `business_unanswered_questions_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `page_analytics` ADD CONSTRAINT `page_analytics_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `page_analytics` ADD CONSTRAINT `page_analytics_pageId_business_pages_id_fk` FOREIGN KEY (`pageId`) REFERENCES `business_pages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `page_analytics` ADD CONSTRAINT `page_analytics_sectionId_page_sections_id_fk` FOREIGN KEY (`sectionId`) REFERENCES `page_sections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `page_publish_history` ADD CONSTRAINT `page_publish_history_pageId_business_pages_id_fk` FOREIGN KEY (`pageId`) REFERENCES `business_pages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `page_publish_history` ADD CONSTRAINT `page_publish_history_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `page_publish_history` ADD CONSTRAINT `page_publish_history_versionId_page_versions_id_fk` FOREIGN KEY (`versionId`) REFERENCES `page_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `page_publish_history` ADD CONSTRAINT `page_publish_history_performedById_users_id_fk` FOREIGN KEY (`performedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `page_sections` ADD CONSTRAINT `page_sections_pageId_business_pages_id_fk` FOREIGN KEY (`pageId`) REFERENCES `business_pages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `page_versions` ADD CONSTRAINT `page_versions_pageId_business_pages_id_fk` FOREIGN KEY (`pageId`) REFERENCES `business_pages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `page_versions` ADD CONSTRAINT `page_versions_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `page_versions` ADD CONSTRAINT `page_versions_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX `business_page_status_idx` ON `business_pages` (`status`);--> statement-breakpoint
CREATE INDEX `recommendation_signal_score_idx` ON `business_recommendation_signals` (`recommendationScore`);--> statement-breakpoint
CREATE INDEX `review_report_status_idx` ON `business_review_reports` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `review_report_review_idx` ON `business_review_reports` (`reviewId`);--> statement-breakpoint
CREATE INDEX `unanswered_business_status_idx` ON `business_unanswered_questions` (`businessId`,`status`,`askCount`);--> statement-breakpoint
CREATE INDEX `page_analytics_scope_idx` ON `page_analytics` (`businessId`,`pageId`,`eventType`,`createdAt`);--> statement-breakpoint
CREATE INDEX `page_publish_business_idx` ON `page_publish_history` (`businessId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `page_section_order_idx` ON `page_sections` (`pageId`,`displayOrder`);--> statement-breakpoint
CREATE INDEX `page_section_type_idx` ON `page_sections` (`pageId`,`sectionType`);--> statement-breakpoint
CREATE INDEX `page_version_business_idx` ON `page_versions` (`businessId`,`createdAt`);