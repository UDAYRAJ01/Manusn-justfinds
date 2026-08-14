CREATE TABLE `business_appointment_blackouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`localDate` varchar(10) NOT NULL,
	`reason` varchar(240),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_appointment_blackouts_id` PRIMARY KEY(`id`),
	CONSTRAINT `appt_blackout_business_date_uidx` UNIQUE(`businessId`,`localDate`)
);
--> statement-breakpoint
CREATE TABLE `business_appointment_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`leadId` int NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`timeZone` varchar(64) NOT NULL,
	`status` enum('requested','confirmed','declined','cancelled') NOT NULL DEFAULT 'requested',
	`ownerNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_appointment_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_appointment_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT false,
	`timeZone` varchar(64) NOT NULL DEFAULT 'Asia/Kolkata',
	`slotDurationMinutes` int NOT NULL DEFAULT 30,
	`minimumNoticeMinutes` int NOT NULL DEFAULT 120,
	`maximumAdvanceDays` int NOT NULL DEFAULT 30,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_appointment_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `appt_settings_business_uidx` UNIQUE(`businessId`)
);
--> statement-breakpoint
CREATE TABLE `business_appointment_windows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`startsAt` varchar(5) NOT NULL,
	`endsAt` varchar(5) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_appointment_windows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `business_appointment_blackouts` ADD CONSTRAINT `appt_blackout_business_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_appointment_requests` ADD CONSTRAINT `appt_request_business_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_appointment_requests` ADD CONSTRAINT `appt_request_lead_fk` FOREIGN KEY (`leadId`) REFERENCES `business_leads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_appointment_settings` ADD CONSTRAINT `appt_settings_business_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_appointment_windows` ADD CONSTRAINT `appt_window_business_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `appt_request_business_start_idx` ON `business_appointment_requests` (`businessId`,`startsAt`);--> statement-breakpoint
CREATE INDEX `appt_request_lead_idx` ON `business_appointment_requests` (`leadId`);--> statement-breakpoint
CREATE INDEX `appt_window_business_day_idx` ON `business_appointment_windows` (`businessId`,`dayOfWeek`);
