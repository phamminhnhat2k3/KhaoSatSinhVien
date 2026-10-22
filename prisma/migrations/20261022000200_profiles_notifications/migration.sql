ALTER TABLE `User`
  ADD COLUMN `phone` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `department` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `bio` TEXT NOT NULL,
  ADD COLUMN `coverTheme` VARCHAR(191) NOT NULL DEFAULT 'blue';

CREATE TABLE `Notification` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `href` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `readAt` DATETIME(3) NULL,
  INDEX `Notification_userId_readAt_createdAt_idx` (`userId`, `readAt`, `createdAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
