ALTER TABLE `proposals` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `proposals` ADD `expiryDays` int DEFAULT 30;--> statement-breakpoint
ALTER TABLE `proposals` ADD `acceptedAt` timestamp;--> statement-breakpoint
ALTER TABLE `proposals` ADD `declinedAt` timestamp;--> statement-breakpoint
ALTER TABLE `proposals` ADD `clientPortalToken` varchar(64);--> statement-breakpoint
ALTER TABLE `proposals` ADD CONSTRAINT `proposals_clientPortalToken_unique` UNIQUE(`clientPortalToken`);