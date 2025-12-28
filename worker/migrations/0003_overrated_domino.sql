CREATE TABLE `locations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `logs` ADD `location_id` integer REFERENCES locations(id);--> statement-breakpoint
ALTER TABLE `logs` DROP COLUMN `location`;