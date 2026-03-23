CREATE TABLE `share_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposalId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `share_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `share_tokens_token_unique` UNIQUE(`token`)
);
