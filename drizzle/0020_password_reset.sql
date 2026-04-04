ALTER TABLE `users` ADD `passwordResetToken` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetTokenExpiresAt` bigint;
