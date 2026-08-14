ALTER TABLE `localities` ADD `pincode` varchar(12);--> statement-breakpoint
CREATE INDEX `locality_name_idx` ON `localities` (`name`);--> statement-breakpoint
CREATE INDEX `locality_pincode_idx` ON `localities` (`pincode`);