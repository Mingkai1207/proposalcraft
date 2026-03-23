ALTER TABLE `contractor_profiles` ADD `smtpHost` varchar(255);--> statement-breakpoint
ALTER TABLE `contractor_profiles` ADD `smtpPort` int;--> statement-breakpoint
ALTER TABLE `contractor_profiles` ADD `smtpUsername` varchar(255);--> statement-breakpoint
ALTER TABLE `contractor_profiles` ADD `smtpPassword` text;--> statement-breakpoint
ALTER TABLE `contractor_profiles` ADD `smtpFromEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `contractor_profiles` ADD `smtpFromName` varchar(255);