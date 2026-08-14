CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `type` enum('business','job','application','lead','review','verification','admin','system') NOT NULL DEFAULT 'system',
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `actionUrl` varchar(500),
  `isRead` boolean NOT NULL DEFAULT false,
  `readAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `notification_user_read_idx` (`userId`, `isRead`),
  INDEX `notification_created_idx` (`createdAt`)
);

CREATE TABLE IF NOT EXISTS `user_notification_preferences` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL UNIQUE,
  `inAppEnabled` boolean NOT NULL DEFAULT true,
  `emailEnabled` boolean NOT NULL DEFAULT true,
  `whatsappEnabled` boolean NOT NULL DEFAULT false,
  `notifyBusiness` boolean NOT NULL DEFAULT true,
  `notifyJobs` boolean NOT NULL DEFAULT true,
  `notifyLeads` boolean NOT NULL DEFAULT true,
  `notifyReviews` boolean NOT NULL DEFAULT true,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
