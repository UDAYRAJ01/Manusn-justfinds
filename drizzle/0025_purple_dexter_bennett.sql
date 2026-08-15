ALTER TABLE `bulk_imports` ADD `scheduleCronTaskUid` varchar(65);
CREATE INDEX `bulk_import_schedule_cron_idx` ON `bulk_imports` (`scheduleCronTaskUid`);
