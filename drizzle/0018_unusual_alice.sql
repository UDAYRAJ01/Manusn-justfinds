CREATE TABLE `business_appointment_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`requestId` int NOT NULL,
	`actorType` enum('owner','customer','system') NOT NULL,
	`actorUserId` int,
	`eventType` enum('requested','approved','rejected','proposed_time','proposal_accepted','reschedule_requested','cancelled') NOT NULL,
	`fromStatus` varchar(40),
	`toStatus` varchar(40) NOT NULL,
	`startsAt` timestamp,
	`endsAt` timestamp,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_appointment_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `business_appointment_requests` MODIFY COLUMN `status` enum('requested','proposed','reschedule_requested','confirmed','declined','cancelled') NOT NULL DEFAULT 'requested';--> statement-breakpoint
ALTER TABLE `business_appointment_requests` ADD `proposedStartsAt` timestamp;--> statement-breakpoint
ALTER TABLE `business_appointment_requests` ADD `proposedEndsAt` timestamp;--> statement-breakpoint
ALTER TABLE `business_appointment_requests` ADD `customerAccessToken` varchar(96);--> statement-breakpoint
ALTER TABLE `business_appointment_requests` ADD `customerNote` text;--> statement-breakpoint
ALTER TABLE `business_appointment_requests` ADD `decidedAt` timestamp;--> statement-breakpoint
ALTER TABLE `business_appointment_requests` ADD `cancelledAt` timestamp;--> statement-breakpoint
ALTER TABLE `business_appointment_requests` ADD CONSTRAINT `appt_request_customer_token_uidx` UNIQUE(`customerAccessToken`);--> statement-breakpoint
ALTER TABLE `business_appointment_events` ADD CONSTRAINT `appt_evt_business_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_appointment_events` ADD CONSTRAINT `appt_evt_request_fk` FOREIGN KEY (`requestId`) REFERENCES `business_appointment_requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_appointment_events` ADD CONSTRAINT `appt_evt_actor_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `appt_event_request_created_idx` ON `business_appointment_events` (`requestId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `appt_event_business_created_idx` ON `business_appointment_events` (`businessId`,`createdAt`);
