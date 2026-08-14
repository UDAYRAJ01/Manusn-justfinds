CREATE TABLE `custom_domains` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`domain` varchar(255) NOT NULL,
	`domainType` varchar(32) NOT NULL DEFAULT 'apex',
	`isPrimary` boolean NOT NULL DEFAULT false,
	`verificationStatus` enum('pending','verified','failed','expired') NOT NULL DEFAULT 'pending',
	`routingStatus` enum('pending','connected','error') NOT NULL DEFAULT 'pending',
	`sslStatus` enum('active','pending','not_configured') NOT NULL DEFAULT 'not_configured',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custom_domains_id` PRIMARY KEY(`id`),
	CONSTRAINT `custom_domains_domain_unique` UNIQUE(`domain`)
);
--> statement-breakpoint
CREATE TABLE `domain_verification_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`domain` varchar(255) NOT NULL,
	`verificationMethod` varchar(32) NOT NULL DEFAULT 'txt',
	`verificationToken` varchar(255) NOT NULL,
	`status` enum('pending','verified','failed','expired') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`verifiedAt` timestamp,
	`expiresAt` timestamp,
	CONSTRAINT `domain_verification_records_id` PRIMARY KEY(`id`)
);
