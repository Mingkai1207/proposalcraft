CREATE TABLE `contractor_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessName` varchar(255),
	`ownerName` varchar(255),
	`phone` varchar(64),
	`email` varchar(320),
	`address` text,
	`licenseNumber` varchar(128),
	`logoUrl` text,
	`website` varchar(512),
	`defaultTerms` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contractor_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `contractor_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `email_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposalId` int NOT NULL,
	`eventType` enum('sent','opened','clicked') NOT NULL,
	`ipAddress` varchar(64),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(512) NOT NULL,
	`tradeType` enum('hvac','plumbing','electrical','roofing','general') NOT NULL,
	`clientName` varchar(255),
	`clientEmail` varchar(320),
	`clientAddress` text,
	`jobScope` text NOT NULL,
	`materials` text,
	`laborCost` varchar(64),
	`materialsCost` varchar(64),
	`totalCost` varchar(64),
	`generatedContent` text,
	`pdfUrl` text,
	`status` enum('draft','sent','viewed','accepted','declined') NOT NULL DEFAULT 'draft',
	`trackingToken` varchar(128),
	`sentAt` timestamp,
	`viewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proposals_id` PRIMARY KEY(`id`),
	CONSTRAINT `proposals_trackingToken_unique` UNIQUE(`trackingToken`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`plan` enum('free','starter','pro') NOT NULL DEFAULT 'free',
	`stripeCustomerId` varchar(128),
	`stripeSubscriptionId` varchar(128),
	`stripeCurrentPeriodEnd` bigint,
	`proposalsUsedThisMonth` int NOT NULL DEFAULT 0,
	`usageResetAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_userId_unique` UNIQUE(`userId`)
);
