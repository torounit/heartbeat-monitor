ALTER TABLE `logs` RENAME TO `heartbeats`;--> statement-breakpoint
CREATE TABLE `reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`location_id` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_heartbeats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`location_id` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_heartbeats`("id", "location_id", "created_at") SELECT "id", "location_id", "created_at" FROM `heartbeats`;--> statement-breakpoint
DROP TABLE `heartbeats`;--> statement-breakpoint
ALTER TABLE `__new_heartbeats` RENAME TO `heartbeats`;--> statement-breakpoint
PRAGMA foreign_keys=ON;