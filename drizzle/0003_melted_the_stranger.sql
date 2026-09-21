PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`age` integer NOT NULL,
	`city` text NOT NULL,
	`field` text NOT NULL,
	`education` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`source` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`base_amount` integer DEFAULT 399000 NOT NULL,
	`discount_code` text,
	`discount_percent` integer DEFAULT 0 NOT NULL,
	`final_amount` integer DEFAULT 399000 NOT NULL,
	`identifier_code` text,
	`payment_reference` text,
	`created_at` text NOT NULL,
	`paid_at` text
);
--> statement-breakpoint
INSERT INTO `__new_registrations`("id", "full_name", "age", "city", "field", "education", "phone", "email", "source", "status", "base_amount", "discount_code", "discount_percent", "final_amount", "identifier_code", "payment_reference", "created_at", "paid_at") SELECT "id", "full_name", "age", "city", "field", "education", "phone", "email", "source", "status", "base_amount", "discount_code", "discount_percent", "final_amount", "identifier_code", "payment_reference", "created_at", "paid_at" FROM `registrations`;--> statement-breakpoint
DROP TABLE `registrations`;--> statement-breakpoint
ALTER TABLE `__new_registrations` RENAME TO `registrations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_registrations_identifier_code` ON `registrations` (`identifier_code`);--> statement-breakpoint
CREATE INDEX `idx_registrations_created_at` ON `registrations` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_registrations_status` ON `registrations` (`status`);--> statement-breakpoint
PRAGMA optimize;
