CREATE TABLE `client_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposalId` int NOT NULL,
	`reason` varchar(255),
	`comments` text,
	`rating` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proposal_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposalId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`clientName` varchar(255),
	`clientEmail` varchar(255),
	`jobScope` text,
	`materials` text,
	`laborCost` varchar(64),
	`materialsCost` varchar(64),
	`totalCost` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `proposal_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `client_feedback` ADD CONSTRAINT `client_feedback_proposalId_proposals_id_fk` FOREIGN KEY (`proposalId`) REFERENCES `proposals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proposal_versions` ADD CONSTRAINT `proposal_versions_proposalId_proposals_id_fk` FOREIGN KEY (`proposalId`) REFERENCES `proposals`(`id`) ON DELETE cascade ON UPDATE no action;