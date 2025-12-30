PRAGMA foreign_keys=OFF;--> statement-breakpoint
ALTER TABLE `logs` RENAME TO `heartbeats`;--> statement-breakpoint
PRAGMA foreign_keys=ON;

