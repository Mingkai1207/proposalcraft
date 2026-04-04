ALTER TABLE `users` MODIFY `email` varchar(320) UNIQUE;--> statement-breakpoint
ALTER TABLE `proposals` MODIFY `updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
CREATE INDEX `proposals_userId_idx` ON `proposals` (`userId`);--> statement-breakpoint
CREATE INDEX `proposals_status_idx` ON `proposals` (`status`);--> statement-breakpoint
CREATE INDEX `proposal_templates_userId_idx` ON `proposal_templates` (`userId`);
